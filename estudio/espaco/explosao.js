// Explosão cartunesca em camadas: bola de fogo turbulenta, anel de onda de choque, ejecta em partículas e clarão.
// criarExplosao({ tom }) -> { grupo, atualizar(u, raio, t) }   u: 0 (começa) a 1 (dissipou); raio: tamanho final em unidades.
// tom: [r,g,b] multiplica as cores (1,1,1 = estrela; 1,0.6,0.4 = Terra em brasa).
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { texturaHalo } from './fundo.js';

const VERT_FOGO = 'varying vec3 vP; varying vec3 vN; void main(){ vP=position; vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const FRAG_FOGO = /* glsl */ `
precision highp float; varying vec3 vP; varying vec3 vN; uniform float uU,uTime,uNucleo,uGanho,uCalor; uniform vec3 uTom,uC0,uC1,uC2,uC3;
${RUIDO}
vec3 rampa(float h){
  vec3 c=mix(uC0,uC1,smoothstep(0.0,0.35,h));
  c=mix(c,uC2,smoothstep(0.35,0.70,h));
  return mix(c,uC3,smoothstep(0.70,1.0,h));
}
void main(){
  float n=fbm(vP*2.6+vec3(0.0,uTime*0.7,uU*3.0));
  float n2=fbm(vP*6.5-vec3(uTime*1.1,0.0,uU*2.0));
  float dens=smoothstep(0.28,0.78,n*0.75+n2*0.35);
  float rim=pow(1.0-abs(dot(normalize(vN),vec3(0.0,0.0,1.0))),1.4);
  float heat=clamp((1.0-uU)*uCalor+n*0.45-rim*0.25,0.0,1.0);
  float nuc=uNucleo*pow(1.0-rim,2.2)*(1.0-smoothstep(0.35,0.95,uU));
  dens=clamp(dens+0.55*nuc,0.0,1.0); heat=clamp(heat+0.15*nuc,0.0,1.0);
  float a=dens*(1.0-smoothstep(0.50,1.0,uU))*(0.5+0.7*rim+0.5*nuc);
  gl_FragColor=vec4(rampa(heat)*uTom*a*uGanho,a);
}`;
const FRAG_ANEL = /* glsl */ `
precision highp float; varying vec2 vUv; uniform float uU; uniform vec3 uTom,uR0,uR1;
void main(){
  float d=length(vUv-0.5)*2.0; float r=0.06+0.94*uU; float w=0.018+0.05*uU;
  float a=exp(-pow((d-r)/w,2.0)); float b=exp(-pow((d-r*0.86)/(w*2.4),2.0))*0.4;
  float f=(a+b)*(1.0-smoothstep(0.55,1.0,uU));
  vec3 c=mix(uR0,uR1,smoothstep(0.0,0.8,uU))*uTom;
  gl_FragColor=vec4(c*f,f);
}`;
const VERT_PART = /* glsl */ `
attribute vec3 dir; attribute float vel; attribute float sem; uniform float uU,uR,uAlt,uTam; varying float vA; varying float vH;
void main(){
  vec3 p=dir*vel*(1.0-pow(1.0-uU,2.2))*uR;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uTam*(0.5+sem)*uAlt/max(-mv.z,0.5)*(1.15-0.8*uU);
  vA=(1.0-smoothstep(0.35,1.0,uU)); vH=clamp(1.0-uU*0.9+sem*0.2,0.0,1.0);
}`;
const FRAG_PART = /* glsl */ `
precision highp float; varying float vA; varying float vH; uniform vec3 uTom,uP0,uP1;
void main(){ vec2 u=gl_PointCoord*2.0-1.0; float d=length(u); float a=smoothstep(1.0,0.1,d)*vA; if(a<0.01) discard;
  vec3 c=mix(uP0,uP1,vH)*uTom; gl_FragColor=vec4(c*a,a); }`;

// paleta (opcional): { fogo: [c0,c1,c2,c3], anel: [a0,a1], part: [p0,p1], nucleo: 0..1, duploAnel: bool, flare: [r0,r1], flareCor: [[...]] }
const PAL_FOGO = { fogo: [[0.22, 0.02, 0.05], [0.95, 0.20, 0.06], [1.0, 0.72, 0.22], [1.0, 0.97, 0.86]], anel: [[1.0, 0.96, 0.8], [1.0, 0.35, 0.15]], part: [[0.9, 0.2, 0.07], [1.0, 0.9, 0.6]], nucleo: 0, duploAnel: false, flare: [1.5, 5] };
export const PALETA_AZUL = { fogo: [[0.06, 0.08, 0.42], [0.18, 0.36, 1.0], [0.52, 0.78, 1.0], [0.92, 0.97, 1.0]], anel: [[1.0, 1.0, 1.0], [0.35, 0.55, 1.0]], part: [[0.35, 0.55, 1.0], [0.95, 0.98, 1.0]], nucleo: 1, ganho: 0.9, calor: 0.42, duploAnel: true, flare: [1.0, 1.6], flareCor: ['rgba(255,255,255,1)', 'rgba(190,220,255,0.75)', 'rgba(90,140,255,0.28)', 'rgba(60,90,255,0)'] };
export const PALETA_FOGO_FORTE = { ...PAL_FOGO, nucleo: 1, ganho: 1.25, calor: 0.8, duploAnel: true, flare: [1.1, 2.0] };

export function criarExplosao({ tom = [1, 1, 1], n = 900, semente = 3, paleta = PAL_FOGO } = {}) {
  const grupo = new THREE.Group();
  const tomV = new THREE.Vector3(...tom);
  const V3c = (a) => new THREE.Vector3(...a);
  const fogoMat = new THREE.ShaderMaterial({
    vertexShader: VERT_FOGO, fragmentShader: FRAG_FOGO, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uU: { value: 0 }, uTime: { value: 0 }, uTom: { value: tomV }, uNucleo: { value: paleta.nucleo || 0 }, uGanho: { value: paleta.ganho || 1.7 }, uCalor: { value: paleta.calor || 0.95 }, uC0: { value: V3c(paleta.fogo[0]) }, uC1: { value: V3c(paleta.fogo[1]) }, uC2: { value: V3c(paleta.fogo[2]) }, uC3: { value: V3c(paleta.fogo[3]) } },
  });
  const fogo = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), fogoMat);
  const anelMat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: FRAG_ANEL, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uU: { value: 0 }, uTom: { value: tomV }, uR0: { value: V3c(paleta.anel[0]) }, uR1: { value: V3c(paleta.anel[1]) } },
  });
  const anel = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), anelMat);
  const anelMat2 = anelMat.clone(); anelMat2.uniforms = { uU: { value: 0 }, uTom: { value: tomV }, uR0: { value: V3c(paleta.anel[0]) }, uR1: { value: V3c(paleta.anel[1]) } };
  const anel2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), anelMat2); anel2.visible = !!paleta.duploAnel;
  // partículas
  let s = semente * 7919 + 13;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const dir = new Float32Array(n * 3), vel = new Float32Array(n), sem = new Float32Array(n), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, k = Math.sqrt(1 - u * u);
    dir.set([k * Math.cos(a), u, k * Math.sin(a)], i * 3);
    vel[i] = 0.35 + rnd() * 0.85; sem[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('dir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('vel', new THREE.BufferAttribute(vel, 1));
  g.setAttribute('sem', new THREE.BufferAttribute(sem, 1));
  const partMat = new THREE.ShaderMaterial({
    vertexShader: VERT_PART, fragmentShader: FRAG_PART, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uU: { value: 0 }, uR: { value: 1 }, uAlt: { value: 1080 }, uTam: { value: 0.07 }, uTom: { value: tomV }, uP0: { value: V3c(paleta.part[0]) }, uP1: { value: V3c(paleta.part[1]) } },
  });
  const part = new THREE.Points(g, partMat);
  part.frustumCulled = false;
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texturaHalo(paleta.flareCor ? paleta.flareCor.map((c, i) => [[0, 0.2, 0.5, 1][i], c]) : [[0, 'rgba(255,255,240,1)'], [0.2, 'rgba(255,220,150,0.8)'], [0.5, 'rgba(255,120,60,0.3)'], [1, 'rgba(255,60,30,0)']], 256),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  grupo.add(fogo, anel, anel2, part, flare);
  grupo.visible = false;
  return {
    grupo, anel, anel2, // a cena gira os anéis para a câmera (anel.quaternion.copy(camera.quaternion))
    // u em [0,1]; raio final; t para o ruído
    atualizar(u, raio, t) {
      grupo.visible = u > 0 && u < 1;
      if (!grupo.visible) return;
      const e = Math.pow(u, 0.62);
      fogo.scale.setScalar(Math.max(0.01, raio * (0.12 + 0.88 * e)));
      fogoMat.uniforms.uU.value = u; fogoMat.uniforms.uTime.value = t;
      anel.scale.setScalar(raio * 1.9); anelMat.uniforms.uU.value = u;
      if (anel2.visible) { anel2.quaternion.copy(anel.quaternion); anel2.scale.setScalar(raio * 1.45); anelMat2.uniforms.uU.value = Math.min(1, Math.max(0, (u - 0.07) / 0.93)); }
      partMat.uniforms.uU.value = u; partMat.uniforms.uR.value = raio * 1.25; partMat.uniforms.uTam.value = Math.max(0.05, raio * 0.012);
      const fl = (1 - Math.min(1, u * 2.5));
      flare.scale.setScalar(raio * (paleta.flare[0] + paleta.flare[1] * fl)); flare.material.opacity = Math.max(0, fl);
    },
  };
}
