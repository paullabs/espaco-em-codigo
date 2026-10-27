// Nuvens, atmosfera, Lua e brilho do Sol. Todos usam a mesma paleta do design.js.
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { COR } from './design.js';
import { cor3 } from './corte.js';

export function criarNuvens({ centro, raio, corte = null, cobertura = 0.60, suavidade = 0.02, chapado = 0 }) {
  // corte: a malha do criarCorte, para recortar o mesmo octante e acompanhar giro/luz
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    defines: chapado ? { CHAPADO: 1 } : {}, // desenho chapado do estilo 'vivo' (corpos.js); sem ele, o v11
    uniforms: {
      uCenter: { value: centro.clone() },
      uRadius: { value: raio },
      uLight: { value: new THREE.Vector3(-1, 0.4, 0.6).normalize() },
      uSpin: { value: new THREE.Matrix3() },
      uCutRot: { value: new THREE.Matrix3() },
      uCutSign: { value: new THREE.Vector3(1, 1, 1) },
      uCut: { value: 0 },
      uCutD: { value: 0 },
      uTime: { value: 0 },
      uNoite: { value: 0 },
      uCob: { value: cobertura }, uSuav: { value: suavidade },
      uLuz: { value: cor3(COR.terra.nuvem.luz) },
      uSom: { value: cor3(COR.terra.nuvem.sombra) },
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vW;
uniform vec3 uCenter,uLight,uCutSign,uLuz,uSom; uniform float uRadius,uCut,uCutD,uTime,uNoite,uCob,uSuav; uniform mat3 uSpin,uCutRot;
${RUIDO}
void main(){
  vec3 n=normalize((vW-uCenter)/uRadius);
  vec3 nc=uCutRot*n;
  if(uCut>0.5 && nc.x*uCutSign.x>uCutD && nc.y*uCutSign.y>uCutD && nc.z*uCutSign.z>uCutD) discard;
  vec3 ns=uSpin*n;
  vec3 w=ns*3.0+vec3(uTime*0.02,0.0,0.0);
  vec3 q=w+0.6*vec3(fbm(w*1.4),fbm(w*1.4+4.1),fbm(w*1.4+9.7));
  float d=fbm(q*1.15+vec3(2.0));
  float a=smoothstep(uCob,uCob+uSuav,d);
  if(a<0.01) discard;
  float lit=dot(n,normalize(uLight))-uNoite*1.4;
  // borda de luz: topo da nuvem mais claro, miolo com 2 tons
  float topo=smoothstep(uCob+0.02,uCob+0.08,d);
#ifdef CHAPADO
  // chapado (estilo 'vivo'): dois tons com a mesma divisão limpa do planeta
  float k=smoothstep(-0.012,0.012,lit-0.02);
  vec3 c=mix(uSom*0.72,uLuz,k);
  c=mix(c,uLuz,topo*0.25*k);
#else
  vec3 c=mix(uSom,uLuz,smoothstep(-0.10,0.25,lit));
  c=mix(c,uLuz,topo*0.55);
  c*=mix(0.80,1.0,smoothstep(-0.2,0.4,lit));
#endif
  c*=mix(1.0,0.38,uNoite);
  gl_FragColor=vec4(c,a*0.96);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.028, 96, 64), m);
  mesh.position.copy(centro);
  mesh.frustumCulled = false;
  return mesh;
}

export function criarAtmosfera({ centro, raio }) {
  const m = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uLight: { value: new THREE.Vector3(-1, 0.4, 0.6).normalize() },
      uCenter: { value: centro.clone() },
      c1: { value: cor3(COR.terra.atmosfera[0]) },
      c2: { value: cor3(COR.terra.atmosfera[1]) },
      uForca: { value: 1 },
    },
    vertexShader: 'varying vec3 vW; varying vec3 vN; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vW; varying vec3 vN; uniform vec3 uLight,uCenter,c1,c2; uniform float uForca;
void main(){
  vec3 v=normalize(cameraPosition-vW);
  float f=pow(clamp(0.70+dot(vN,v),0.0,1.0),2.2);
  vec3 n=normalize(vW-uCenter);
  float lit=smoothstep(-0.35,0.35,dot(n,uLight));
  vec3 c=mix(c2,c1,f);
  float tw=smoothstep(-0.2,0.0,dot(n,uLight))*(1.0-smoothstep(0.0,0.25,dot(n,uLight)));
  c=mix(c,vec3(1.0,0.45,0.5),tw*0.45);
  float a=f*lit*0.9*uForca;
  gl_FragColor=vec4(c*a,a);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.14, 64, 48), m);
  mesh.position.copy(centro);
  mesh.frustumCulled = false;
  return mesh;
}

export function criarLua({ centro, raio }) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uCenter: { value: centro.clone() },
      uRadius: { value: raio },
      uLight: { value: new THREE.Vector3(-1, 0.4, 0.6).normalize() },
      uLuz: { value: cor3(COR.terra.lua.luz) },
      uMeio: { value: cor3(COR.terra.lua.meio) },
      uSom: { value: cor3(COR.terra.lua.sombra) },
      uCra: { value: cor3(COR.terra.lua.cratera) },
      uNoite: { value: 0 },
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vW;
uniform vec3 uCenter,uLight,uLuz,uMeio,uSom,uCra; uniform float uRadius,uNoite;
${RUIDO}
void main(){
  vec3 n=normalize((vW-uCenter)/uRadius);
  vec3 v=normalize(cameraPosition-vW);
  vec2 vv=vor(n*3.2);
  float borda=smoothstep(0.34,0.30,vv.x)-smoothstep(0.26,0.22,vv.x);
  float fundo=smoothstep(0.24,0.20,vv.x);
  vec3 alb=mix(uLuz,uMeio,smoothstep(0.35,0.7,fbm(n*2.0)));
  alb=mix(alb,uCra,fundo*0.8);
  alb=mix(alb,uLuz,borda*0.6);
  float ndl=dot(n,normalize(uLight))-uNoite*1.4;
  vec3 c=mix(alb*vec3(0.30,0.27,0.58),alb,smoothstep(-0.05,0.08,ndl));
  c=mix(c,alb*1.05,smoothstep(0.4,0.5,ndl));
  float rim=pow(clamp(1.0-dot(n,v),0.0,1.0),3.0)*smoothstep(-0.1,0.5,ndl);
  c+=vec3(0.45,0.6,1.0)*rim*0.3;
  c+=vec3(0.30,0.35,0.70)*pow(clamp(1.0-dot(n,v),0.0,1.0),2.5)*0.25*uNoite;
  gl_FragColor=vec4(c,1.0);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 48), m);
  mesh.position.copy(centro);
  return mesh;
}

// halo e raios do Sol (sprites aditivos)
export function criarHaloSol({ centro, raio, texHalo, texRaios, escala = 1 }) {
  const g = new THREE.Group();
  g.position.copy(centro);
  const mk = (tex, esc, op) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op })
    );
    s.scale.set(raio * esc, raio * esc, 1);
    return s;
  };
  const halo = mk(texHalo, 5.2 * escala, 1);
  const raios = mk(texRaios, 6.4 * escala, 0.20);
  g.add(halo, raios);
  g.userData = { halo, raios };
  return g;
}
