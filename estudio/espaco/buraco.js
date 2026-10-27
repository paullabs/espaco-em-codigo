// Buraco negro: traçado de raio com a curvatura da luz (geodésica de Schwarzschild, raio do horizonte = 1).
// Disco de acreção com paleta quente -> magenta -> violeta, anel de fótons, estrelas deformadas e jatos.
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { COR } from './design.js';
import { cor3 } from './corte.js';

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes; uniform float uTime; uniform vec3 uCam; uniform mat3 uBasis; uniform float uTan;
uniform vec3 uPal0,uPal1,uPal2,uPal3,uPal4,uPal5; uniform vec3 uJato,uAnel,uFundo1,uFundo2,uMag;
uniform float uRI,uRO,uJatoForca,uPassos,uNear,uFar,uDc; uniform vec3 uFwd; uniform vec2 uShift;
${RUIDO}

vec3 rampa(float t){
  t=clamp(t,0.0,1.0);
  vec3 c=uPal0;
  c=mix(c,uPal1,smoothstep(0.00,0.10,t));
  c=mix(c,uPal2,smoothstep(0.10,0.28,t));
  c=mix(c,uPal3,smoothstep(0.28,0.50,t));
  c=mix(c,uPal4,smoothstep(0.50,0.74,t));
  c=mix(c,uPal5,smoothstep(0.74,1.00,t));
  return c;
}

vec3 fundo(vec3 d){
  float g=smoothstep(-0.9,0.9,d.x*0.5+d.y*0.8);
  vec3 col=mix(uFundo1,uFundo2,g);
  float n=fbm(d*2.0+vec3(5.0));
  col+=uMag*smoothstep(0.52,0.85,n)*0.40;
  // estrelas em duas escalas
  for(int k=0;k<2;k++){
    float esc=(k==0)?46.0:120.0;
    vec3 sp=d*esc; vec3 id=floor(sp); vec3 f=fract(sp)-0.5;
    float h=h31(id+float(k)*7.0);
    vec3 o=(h33(id+float(k)*3.0)-0.5)*0.7;
    float dd=length(f-o);
    float lim=(k==0)?0.955:0.93;
    float raio=(k==0)?mix(0.07,0.16,fract(h*13.7)):mix(0.10,0.20,fract(h*7.3));
    float s=step(lim,h)*smoothstep(raio,raio*0.15,dd);
    vec3 tint=mix(vec3(1.0),mix(vec3(1.0,0.86,0.66),vec3(0.75,0.85,1.0),fract(h*91.0)),0.7);
    col+=tint*s*((k==0)?1.15:0.7);
  }
  return col;
}

void main(){
  vec2 p=((vUv-uShift)*2.0-1.0)*vec2(uRes.x/uRes.y,1.0)*uTan;
  vec3 rd=normalize(uBasis*vec3(p,-1.0));
  vec3 pos=uCam, vel=rd;
  vec3 col=vec3(0.0); float alpha=0.0; float minr=1e9; float jet=0.0;
  bool capt=false; float firstZ=-1.0;
  for(int i=0;i<420;i++){
    if(float(i)>=uPassos) break;
    float r=length(pos);
    minr=min(minr,r);
    if(r<1.0){ capt=true; break; }
    if(r>48.0 && dot(pos,vel)>0.0) break;
    float dt=clamp(0.07*(r-0.85),0.035,0.85);
    vec3 hv=cross(pos,vel); float h2=dot(hv,hv);
    vec3 prev=pos;
    vel=normalize(vel-1.5*h2*pos/(r*r*r*r*r)*dt);
    pos+=vel*dt;
    // jatos: feixe fino ao longo do eixo
    float ay=abs(pos.y); float rad=length(pos.xz);
    if(ay>1.6&&ay<17.0){
      float w=0.12+0.03*ay;
      jet+=dt*exp(-ay*0.13)*smoothstep(w*1.6,w*0.2,rad);
    }
    // cruzamento do plano do disco
    if(prev.y*pos.y<0.0){
      float tt=prev.y/(prev.y-pos.y);
      vec3 hit=mix(prev,pos,tt);
      float rr=length(hit.xz);
      if(rr>uRI&&rr<uRO){
        float t=(rr-uRI)/(uRO-uRI);
        float phi=atan(hit.z,hit.x);
        float om=3.4/pow(rr,1.5);
        float a=phi-uTime*om;
        float arms=0.5+0.5*sin(a*2.0+log(rr)*6.0);
        float fine=fbm(vec3(cos(a)*rr*0.8,sin(a)*rr*0.8,t*7.0));
        float lum=mix(0.78,1.2,smoothstep(0.38,0.62,fine*0.7+arms*0.5));
        float aneis=0.5+0.5*sin(rr*9.0+fine*3.0);
        lum*=mix(0.94,1.06,smoothstep(0.4,0.6,aneis));
        // espirais finas e brilhantes, pontos quentes que orbitam, faixas de poeira escura e granulação
        float fil=pow(abs(sin(a*3.0+log(rr)*9.5+fine*1.2)),10.0);
        vec3 qp=vec3(cos(a)*rr*1.5,sin(a)*rr*1.5,t*6.0);
        vec2 vq=vor(qp);
        float quente=smoothstep(0.28,0.0,vq.x)*step(0.55,h31(floor(qp)));
        float poeira=smoothstep(0.05,0.0,abs(fract(rr*1.35+0.35*fine)-0.5)-0.455);
        lum+=fil*0.28+quente*0.40;
        lum*=1.0-poeira*0.42;
        lum*=0.9+0.2*fbm(vec3(cos(a)*rr*4.0,sin(a)*rr*4.0,t*12.0));
        vec3 vd=normalize(cross(vec3(0.0,1.0,0.0),hit));
        float beam=1.0+0.62*dot(vd,-vel);
        beam=clamp(beam*beam,0.38,2.3);
        vec3 c=rampa(t+0.10*(1.0-beam));
        c*=lum*mix(0.80,1.15,smoothstep(0.4,2.0,beam));
        c=mix(c,vec3(1.0),smoothstep(1.7,2.3,beam)*0.4*(1.0-t));
        float da=smoothstep(uRI,uRI+0.18,rr)*(1.0-smoothstep(uRO-2.6,uRO,rr))*0.97;
        if(firstZ<0.0&&da>0.3) firstZ=dot(hit-uCam,uFwd);
        col+=(1.0-alpha)*c*da;
        alpha+=(1.0-alpha)*da;
      }
    }
  }
  vec3 bg=vec3(0.0);
  if(!capt){
    bg=fundo(normalize(vel));
    float ring=exp(-pow((minr-1.5)/0.06,2.0));
    bg+=uAnel*ring*1.5;
    bg+=vec3(1.0,0.55,0.35)*exp(-(minr-1.5)*1.6)*0.10;
  } else {
    bg=vec3(0.016,0.008,0.05);
  }
  col+=(1.0-alpha)*bg;
  float j=1.0-exp(-jet*0.85);
  col+=uJato*j*(1.0-alpha)*uJatoForca;
  gl_FragColor=vec4(col,1.0);
  float zv=(firstZ>0.0)?firstZ:(capt?uDc:uFar*0.98);
  float ndc=(uFar+uNear)/(uFar-uNear)-2.0*uFar*uNear/((uFar-uNear)*zv);
  gl_FragDepth=ndc*0.5+0.5;
}
`;

export function criarBuraco({ raioInterno = 3.0, raioExterno = 10.5, passos = 360 } = {}) {
  const P = COR.buraco.disco.map(cor3);
  const m = new THREE.ShaderMaterial({
    depthTest: true,
    depthFunc: THREE.AlwaysDepth,
    depthWrite: true,
    uniforms: {
      uRes: { value: new THREE.Vector2(1920, 1080) },
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3(0, 6, 26) },
      uBasis: { value: new THREE.Matrix3() },
      uTan: { value: Math.tan((28 * Math.PI) / 360) },
      uPal0: { value: P[0] }, uPal1: { value: P[1] }, uPal2: { value: P[2] }, uPal3: { value: P[3] }, uPal4: { value: P[4] }, uPal5: { value: P[5] },
      uJato: { value: cor3(COR.buraco.jato) },
      uAnel: { value: cor3(COR.buraco.anel) },
      uFundo1: { value: cor3(COR.espaco.base) },
      uFundo2: { value: cor3(COR.espaco.base) },
      uMag: { value: cor3('#000000') },
      uRI: { value: raioInterno },
      uRO: { value: raioExterno },
      uJatoForca: { value: 0.9 },
      uPassos: { value: passos },
      uNear: { value: 0.1 },
      uFar: { value: 400 },
      uDc: { value: 30 },
      uFwd: { value: new THREE.Vector3(0, 0, -1) },
      uShift: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader: FRAG,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m);
  mesh.frustumCulled = false;
  mesh.renderOrder = -50;
  mesh.userData.sincronizar = (camera, W, H, cx = 0.5, cy = 0.5) => {
    m.uniforms.uShift.value.set(cx - 0.5, 0.5 - cy);
    camera.updateMatrixWorld();
    const e = camera.matrixWorld.elements;
    m.uniforms.uBasis.value.set(e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]);
    m.uniforms.uCam.value.copy(camera.position);
    m.uniforms.uRes.value.set(W, H);
    m.uniforms.uTan.value = Math.tan((camera.fov * Math.PI) / 360);
    m.uniforms.uNear.value = camera.near;
    m.uniforms.uFar.value = camera.far;
    m.uniforms.uFwd.value.set(-e[8], -e[9], -e[10]);
    m.uniforms.uDc.value = camera.position.length();
  };
  return mesh;
}
