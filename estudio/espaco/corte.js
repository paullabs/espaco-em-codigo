// Esfera com corte em camadas, por traçado de raio analítico no fragment shader.
// Uma malha só: o shader acha a superfície (Sol ou Terra) ou, dentro do octante removido,
// as três faces planas do corte, pintadas por camada (cor interna -> externa, linha de divisa).
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { SUP } from './superficies.js';
import { COR } from './design.js';

const v3 = (h) => {
  const c = new THREE.Color(h);
  return new THREE.Vector3(c.r, c.g, c.b);
};
export const cor3 = v3;

const VERT = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }
`;

const FRAG = /* glsl */ `
precision highp float;
uniform mat4 projectionMatrix;
varying vec3 vW;
uniform vec3 uCenter; uniform float uRadius; uniform mat3 uCutRot; uniform mat3 uSpin;
uniform vec3 uCutSign; uniform float uCut; uniform vec3 uLight; uniform float uTime; uniform int uMode;
uniform float uR[7]; uniform vec3 uCA[7]; uniform vec3 uCB[7]; uniform int uN;
uniform vec3 uPal0,uPal1,uPal2,uPal3; uniform float uCelEsc,uCelContr,uCelSoft,uMancha;
uniform float uCutD; uniform float uPulso; uniform float uApaga; uniform float uNoite; uniform float uFocoLo; uniform float uFocoHi; uniform float uFocoF;
${RUIDO}
${SUP}

// ---------- Terra ----------
vec3 terraAlb(vec3 n, out float oc){
  vec3 w=n*1.05+vec3(3.1,1.7,5.3);
  vec3 q=w+0.55*vec3(fbm(w*1.7),fbm(w*1.7+7.3),fbm(w*1.7+13.1));
  float h=fbm(q);
  float lat=abs(n.y);
  vec3 deep=vec3(.043,.227,.549), mid=vec3(.09,.404,.788), sha=vec3(.184,.71,.839), foam=vec3(.56,.92,.89);
  vec3 col; float sea=0.535;
  oc=0.0;
  if(h<sea){
    oc=1.0;
    col=deep;
    col=mix(col,mid,st(0.40,h));
    col=mix(col,sha,st(0.47,h));
    col=mix(col,foam,st(0.515,h));
    col*=0.96+0.08*vn(n*55.0);
    col=mix(col,vec3(.83,.93,1.0),smoothstep(0.88,0.93,lat+0.03*vn(n*20.)));
  } else {
    float e=h-sea;
    float m=fbm(n*1.7+vec3(11.0))+0.30*(0.55-abs(n.y))+0.10*sin(abs(n.y)*9.0);
    vec3 desert=vec3(.949,.722,.294), desert2=vec3(.9,.6,.23), sav=vec3(.75,.84,.31), gra=vec3(.357,.788,.294), forest=vec3(.122,.627,.353), jun=vec3(.055,.498,.322);
    // faixas por umidade (da menor para a maior)
    col=jun;
    col=mix(col,forest,1.0-st(0.64,m));
    col=mix(col,gra,1.0-st(0.58,m));
    col=mix(col,sav,1.0-st(0.52,m));
    float dun=0.5+0.5*sin((n.x*9.0+n.z*5.0)+fbm(n*8.0)*6.0);
    col=mix(col,mix(desert,desert2,dun),(1.0-st(0.45,m))*(1.0-smoothstep(0.55,0.7,lat)));
    col=mix(col,vec3(.969,.863,.557),1.0-st(0.02,e));
    col=mix(col,vec3(.651,.51,.4),st(0.20,e));
    col=mix(col,vec3(.96,.98,1.0),st(0.30,e));
    col*=0.95+0.10*vn(n*70.0);
    col=mix(col,vec3(.93,.97,1.0),smoothstep(0.84,0.88,lat+0.04*vn(n*14.)));
  }
  return col;
}

// ---------- Sol ----------
vec3 solAlb(vec3 n,float mu){
  float t=uTime;
  vec3 p=n*8.5+vec3(0.0,t*0.05,0.0);
  vec2 v=vor(p);
  float cell=smoothstep(0.01,0.16,v.y-v.x);
  float big=fbm(n*2.0+vec3(t*0.03,0.0,0.0));
  vec3 red=vec3(.91,.157,.29), org=vec3(1.0,.416,.122), amb=vec3(1.0,.69,.18), yel=vec3(1.0,.894,.36);
  float k=clamp(mu,0.0,1.0);
  vec3 base=mix(red,org,smoothstep(0.0,0.35,k));
  base=mix(base,amb,smoothstep(0.35,0.75,k));
  base=mix(base,yel,smoothstep(0.75,1.0,k)*0.85);
  base=mix(base*vec3(0.97,0.88,0.92),base*vec3(1.02,1.03,0.98),cell);
  base+=(big-0.5)*vec3(0.20,0.12,0.0);
  float sp=fbm(n*2.2+vec3(9.0));
  float core=smoothstep(0.700,0.72,sp), pen=smoothstep(0.665,0.69,sp);
  base=mix(base,vec3(.76,.23,.16),pen*0.9);
  base=mix(base,vec3(.48,.12,.2),core);
  return base;
}

vec3 albedo(vec3 n, float mu, out float oc){
  oc=0.0;
  vec3 ns=uSpin*n;
  if(uMode==0) return solAlb(ns,mu);
  if(uMode==2){ vec3 g; float b; return rochoso(ns,0,g,b); }
  return terraAlb(ns,oc);
}

vec3 shadeSurface(vec3 p, vec3 rd, vec3 L){
  vec3 n=p; float oc; float mu=clamp(dot(n,-rd),0.0,1.0);
  if(uMode==2){
    vec3 gr; float br; vec3 alb2=rochoso(uSpin*n,0,gr,br);
    vec3 nb=normalize(n-(gr*uSpin)*0.55);
    float ndl2=dot(nb,L);
    float l=clamp(ndl2*1.08+0.06,0.0,1.0); l=mix(l,floor(l*6.0+0.5)/6.0,0.6);
    vec3 c2=alb2*mix(vec3(0.42,0.39,0.48),vec3(1.07,1.03,0.97),l);
    c2+=vec3(0.95,0.88,0.80)*pow(1.0-mu,3.0)*smoothstep(-0.1,0.5,ndl2)*0.12;
    return c2;
  }
  vec3 alb=albedo(n,mu,oc);
  if(uMode==0){
    // Sol: emissivo, brilho de borda quente
    float rim=pow(1.0-mu,2.2);
    vec3 vivo=alb+vec3(1.0,0.35,0.35)*rim*0.35*uPulso;
    vec3 morto=vec3(0.075,0.045,0.17)+vec3(0.55,0.12,0.30)*pow(1.0-mu,3.0)*0.55;
    return mix(vivo,morto,uApaga);
  }
  float ndl=dot(n,L)-uNoite*1.4;
  vec3 col=toon3(alb,ndl);
  col*=mix(1.0,0.42,uNoite);
  // brilho do Sol no oceano, em degrau
  vec3 rf=reflect(-L,n);
  float g=pow(max(dot(rf,-rd),0.0),260.0);
  
  // luz de borda ciano no lado iluminado
  float rim=pow(1.0-mu,3.0)*smoothstep(-0.1,0.5,ndl);
  col+=vec3(.36,.82,1.0)*rim*0.55;
  // luzes de cidade no lado escuro
  vec3 ns=uSpin*n;
  float night=1.0-smoothstep(-0.12,0.06,ndl);
  float cityMask=step(0.0,0.5-oc)*smoothstep(0.42,0.56,fbm(ns*3.1+vec3(4.0)));
  vec2 vv=vor(ns*30.0);
  float dots=smoothstep(0.30,0.10,vv.x)*step(0.40,vorH(ns*30.0));
  col+=vec3(1.0,.784,.341)*dots*cityMask*night*2.6+vec3(1.0,.62,.25)*cityMask*night*0.10;
  return col;
}

// textura de cada camada do corte (reconhecível): cristais, metal líquido, plumas do manto, estratos da crosta, células de convecção
vec3 texInterna(float idxf,vec3 q,float r,vec3 base,bool skin){
  if(skin) return base;
  int k=int(idxf+0.5);
  vec3 dir=q/max(r,1e-4);
  float t=uTime;
  if(uMode==0){
    if(k==0){
      vec3 qs=q*38.0+vec3(0.0,t*2.0,0.0);
      float sp=smoothstep(0.16,0.0,vor(qs).x)*step(0.93,vorH(qs));
      base+=vec3(1.0,0.95,0.6)*sp*0.7+vec3(1.0,.85,.45)*exp(-r*5.0)*0.45;
      base*=0.95+0.10*fbm(q*10.0+vec3(t*0.3));
    } else if(k==1){
      float st=fbm(dir*24.0+vec3(t*0.05));
      base*=0.88+0.26*st; base+=vec3(1.0,0.9,0.5)*0.05*vn(dir*60.0);
    } else if(k==2){
      vec2 v=vor(q*4.8+vec3(0.0,t*0.25,0.0)); float c=smoothstep(0.0,0.38,v.y-v.x);
      base*=mix(0.74,1.16,c); base+=vec3(1.0,0.5,0.2)*0.08*(1.0-c);
      base*=0.92+0.16*fbm(dir*9.0+vec3(t*0.1));
    } else {
      vec2 v=vor(q*17.0+vec3(0.0,t*0.4,0.0)); float c=smoothstep(0.0,0.3,v.y-v.x);
      base*=mix(0.86,1.10,c);
    }
    return base;
  }
  int kk=k;
  if(uMode==2){ if(k==3) kk=5; }
  if(kk==0){
    vec2 v=vor(q*16.0); float f=smoothstep(0.0,0.10,v.y-v.x); float hh=vorH(q*16.0);
    base*=0.88+0.12*hh+0.18*f; base+=vec3(1.0,0.97,0.8)*pow(max(0.0,1.0-v.x*2.2),6.0)*0.10;
  } else if(kk==1){
    float w=fbm(q*6.0+vec3(t*0.25,0.0,t*0.1));
    float sline=0.5+0.5*sin((q.x+q.y*0.7+q.z*0.4)*22.0+w*9.0);
    base*=0.86+0.20*w; base+=vec3(1.0,0.92,0.5)*smoothstep(0.82,1.0,sline)*0.16;
  } else if(kk==2){
    float b=fbm(q*3.0+vec3(t*0.04));
    base=mix(base*0.84,base*1.16+vec3(0.07,0.02,0.0),smoothstep(0.42,0.68,b));
    base*=0.90+0.20*fbm(dir*11.0+vec3(t*0.05));
  } else if(kk==3){
    vec2 v=vor(q*7.5+vec3(0.0,t*0.06,0.0)); float c=smoothstep(0.0,0.3,v.y-v.x);
    base*=mix(0.84,1.10,c); base+=vec3(1.0,0.4,0.2)*0.06*(1.0-c);
  } else if(kk==5){
    vec2 v=vor(q*22.0); float hh=vorH(q*22.0);
    float borda=smoothstep(0.0,0.10,v.y-v.x);                       // cristais de olivina com contorno
    base*=(0.78+0.34*hh)*mix(0.72,1.0,borda);
    base=mix(base,base*vec3(0.94,1.05,0.88),step(0.68,hh)*0.5);
    base+=vec3(1.0,0.95,0.8)*smoothstep(0.30,0.0,v.x)*0.05;
    base*=0.94+0.10*vn(q*120.0);
  } else {
    float s=r*70.0+fbm(q*4.0)*4.0; float fa=fract(s);
    float band=smoothstep(0.0,0.08,fa)*(1.0-smoothstep(0.55,0.62,fa)); float bi=floor(s);
    base*=0.78+0.16*h31(vec3(bi,3.0,1.0))+0.12*band;
    base*=0.94+0.12*vn(q*90.0);
  }
  return base;
}

vec3 shadeCut(vec3 q,int ax,float r,vec3 L){
  vec3 base=vec3(0.0); float lo=0.0; float ed=1.0; float idx=0.0; bool skin=false;
  float fi=0.0;
  for(int i=0;i<7;i++){
    if(i<uN){
      if(r<=uR[i]){
        float t=(r-lo)/max(uR[i]-lo,0.0001);
        base=mix(uCA[i],uCB[i],t);
        ed=min(r-lo,uR[i]-r);
        idx=float(i);
        skin=(i==uN-1);
        break;
      }
      lo=uR[i];
    }
  }
  vec3 dir=q/max(r,1e-4);
  float oc;
  if(skin){ base=albedo(dir,0.78,oc)*0.92; }
  base=texInterna(idx,q,r,base,skin);
  // foco: a camada em destaque fica viva; as outras esmaecem
  bool dentro=(idx>=uFocoLo-0.5)&&(idx<=uFocoHi+0.5);
  if(uFocoF>0.001){
    if(dentro){ base*=1.0+0.07*uFocoF; }
    else {
      base=base*(1.0-0.50*uFocoF)+vec3(0.11,0.03,0.20)*0.50*uFocoF;   // esmaece em direção à sombra roxa, sem esverdear
    }
  }
  // linha de divisa entre camadas
  float ln=1.0-smoothstep(0.006,0.014,ed);
  base=mix(base,base*vec3(0.78,0.52,0.62),ln*0.8);
  // brilho fino no contorno externo do corte
  float rimO=smoothstep(0.986,1.0,r);
  base=mix(base,base+vec3(0.12,0.1,0.1),rimO*0.4);
  // face e profundidade: vinco escuro perto do centro do corte, 3 faces com brilho diferente
  float d1,d2;
  if(ax==0){ d1=q.y*uCutSign.y; d2=q.z*uCutSign.z; }
  else if(ax==1){ d1=q.x*uCutSign.x; d2=q.z*uCutSign.z; }
  else { d1=q.x*uCutSign.x; d2=q.y*uCutSign.y; }
  float crease=min(d1,d2)-uCutD;
  float ao=mix(0.84,1.0,smoothstep(0.0,0.30,crease));
  float face=(ax==0)?0.95:((ax==1)?1.0:0.90);
  return base*ao*face;
}

void main(){
  vec3 ro=uCutRot*((cameraPosition-uCenter)/uRadius);
  vec3 rd=normalize(uCutRot*(vW-cameraPosition));
  float b=dot(ro,rd); float c=dot(ro,ro)-1.0; float hh=b*b-c;
  if(hh<0.0) discard;
  hh=sqrt(hh); float t0=-b-hh, t1=-b+hh;
  vec3 p=ro+rd*t0;
  vec3 L=normalize(uCutRot*uLight);
  vec3 col; float tHit=t0;
  bool inCut=(uCut>0.5)&&(p.x*uCutSign.x>uCutD)&&(p.y*uCutSign.y>uCutD)&&(p.z*uCutSign.z>uCutD);
  if(!inCut){
    col=shadeSurface(p,rd,L);
  } else {
    float tt=1e9; int ax=-1;
    if(rd.x*uCutSign.x<0.0){ float ti=(uCutD*uCutSign.x-ro.x)/rd.x; if(ti>t0&&ti<tt){tt=ti;ax=0;} }
    if(rd.y*uCutSign.y<0.0){ float ti=(uCutD*uCutSign.y-ro.y)/rd.y; if(ti>t0&&ti<tt){tt=ti;ax=1;} }
    if(rd.z*uCutSign.z<0.0){ float ti=(uCutD*uCutSign.z-ro.z)/rd.z; if(ti>t0&&ti<tt){tt=ti;ax=2;} }
    if(ax<0||tt>t1) discard;
    vec3 q=ro+rd*tt; tHit=tt;
    col=shadeCut(q,ax,length(q),L);
  }
  gl_FragColor=vec4(col,1.0);
  vec3 wp=cameraPosition+normalize(vW-cameraPosition)*(tHit*uRadius);
  vec4 cp=projectionMatrix*viewMatrix*vec4(wp,1.0);
  gl_FragDepth=(cp.z/cp.w)*0.5+0.5;
}
`;

// camadas: [{ r, a, b }] do centro para fora; a última é a "pele" (usa a cor da superfície)
export function criarCorte({ modo = 'sol', camadas, centro = new THREE.Vector3(), raio = 1, luz = new THREE.Vector3(-1, 0.4, 0.6), pal = ['#ECE7DE', '#C9C2B6', '#8C867B', '#6E695E'] }) {
  const n = camadas.length;
  const R = new Float32Array(7).fill(1);
  const A = [];
  const B = [];
  for (let i = 0; i < 7; i++) {
    const c = camadas[Math.min(i, n - 1)];
    R[i] = c.r;
    A.push(v3(c.a));
    B.push(v3(c.b));
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uCenter: { value: centro.clone() },
      uRadius: { value: raio },
      uCutRot: { value: new THREE.Matrix3() },
      uSpin: { value: new THREE.Matrix3() },
      uCutSign: { value: new THREE.Vector3(1, 1, 1) },
      uCut: { value: 1 },
      uCutD: { value: 0 },
      uLight: { value: luz.clone().normalize() },
      uTime: { value: 0 },
      uMode: { value: modo === 'sol' ? 0 : modo === 'lua' ? 2 : 1 },
      uPal0: { value: v3(pal[0]) }, uPal1: { value: v3(pal[1]) }, uPal2: { value: v3(pal[2]) }, uPal3: { value: v3(pal[3]) },
      uCelEsc: { value: 8 }, uCelContr: { value: 1 }, uCelSoft: { value: 0 }, uMancha: { value: 0 },
      uR: { value: R },
      uCA: { value: A },
      uCB: { value: B },
      uN: { value: n },
      uPulso: { value: 1 },
      uApaga: { value: 0 },
      uNoite: { value: 0 },
      uFocoLo: { value: 0 },
      uFocoHi: { value: 0 },
      uFocoF: { value: 0 },
    },
  });
  const malha = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.002, 96, 64), material);
  malha.position.copy(centro);
  malha.frustumCulled = false;
  // oriente o corte: eixo (1,1,1) do octante apontando para 'dir' (mundo), com giro 'roll'
  malha.userData.definirRaio = (r) => {
    material.uniforms.uRadius.value = r;
    malha.scale.setScalar(r / raio);
  };
  malha.userData.orientar = (dir, roll = 0) => {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), dir.clone().normalize());
    const qr = new THREE.Quaternion().setFromAxisAngle(dir.clone().normalize(), roll);
    const total = qr.multiply(q); // cutframe -> mundo
    const m4 = new THREE.Matrix4().makeRotationFromQuaternion(total);
    malha.userData.cutToWorld = m4.clone();
    const inv = m4.clone().invert();
    material.uniforms.uCutRot.value.setFromMatrix4(inv);
  };
  malha.userData.giro = (ang, eixo = new THREE.Vector3(0, 1, 0)) => {
    const m4 = new THREE.Matrix4().makeRotationAxis(eixo, ang);
    material.uniforms.uSpin.value.setFromMatrix4(m4.invert());
  };
  malha.userData.pontoNoCorte = (ax, ang, r) => {
    // ponto no mundo sobre a face 'ax' do corte, em ângulo 'ang' (0..pi/2) e raio r (0..1)
    const a = Math.cos(ang) * r;
    const b = Math.sin(ang) * r;
    const p = ax === 0 ? new THREE.Vector3(0, a, b) : ax === 1 ? new THREE.Vector3(a, 0, b) : new THREE.Vector3(a, b, 0);
    p.applyMatrix4(malha.userData.cutToWorld).multiplyScalar(raio).add(centro);
    return p;
  };
  malha.userData.melhorPonto = (camera, r, lado, W, H, yAlvo = null) => {
    let melhor = null;
    for (let ax = 0; ax < 3; ax++) {
      for (let k = 1; k < 15; k++) {
        const p = malha.userData.pontoNoCorte(ax, (k / 15) * (Math.PI / 2), r);
        const v = p.clone().project(camera);
        const x = (v.x * 0.5 + 0.5) * W;
        const y = (-v.y * 0.5 + 0.5) * H;
        const sc = (lado === 'dir' ? x : -x) - (yAlvo === null ? 0 : 1.1 * Math.abs(y - yAlvo));
        if (!melhor || sc > melhor.sc) melhor = { sc, p };
      }
    }
    return melhor.p;
  };
  malha.userData.orientar(new THREE.Vector3(0.45, 0.42, 0.8), 0);
  return malha;
}

export const CAMADAS_SOL = () => [
  { r: 0.24, a: COR.sol.nucleo[0], b: COR.sol.nucleo[1] },
  { r: 0.62, a: COR.sol.radiativa[0], b: COR.sol.radiativa[1] },
  { r: 0.90, a: COR.sol.convectiva[0], b: COR.sol.convectiva[1] },
  { r: 0.965, a: COR.sol.fotosfera[0], b: COR.sol.fotosfera[1] },
  { r: 1.0, a: '#ffffff', b: '#ffffff' },
];
export const CAMADAS_TERRA = () => [
  { r: 0.17, a: COR.terra.nucleoInterno[0], b: COR.terra.nucleoInterno[1] },
  { r: 0.40, a: COR.terra.nucleoExterno[0], b: COR.terra.nucleoExterno[1] },
  { r: 0.72, a: COR.terra.mantoInferior[0], b: COR.terra.mantoInferior[1] },
  { r: 0.90, a: COR.terra.mantoSuperior[0], b: COR.terra.mantoSuperior[1] },
  { r: 0.955, a: COR.terra.crosta[0], b: COR.terra.crosta[1] },
  { r: 1.0, a: '#ffffff', b: '#ffffff' },
];

export const CAMADAS_LUA = () => [
  { r: 0.13, a: '#FFE08A', b: '#FFC24A' },
  { r: 0.23, a: '#FF9A3D', b: '#F2632E' },
  { r: 0.34, a: '#D8456A', b: '#A82E7E' },
  { r: 0.92, a: '#BFAE86', b: '#8A7B5A' },
  { r: 0.97, a: '#E6E0D2', b: '#BDB5A6' },
  { r: 1.0, a: '#ffffff', b: '#ffffff' },
];
