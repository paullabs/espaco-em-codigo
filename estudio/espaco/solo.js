// Perfil de solo em camadas (horizontes): bloco de terreno com corte frontal e lateral.
// O serapilheira (folhas), A (solo fértil, escuro, com raízes e minhoca), B (argila alaranjada com seixos),
// C (rocha em pedaços, lençol de água e um fóssil) e R (rocha-mãe com estratos e fraturas).
import * as THREE from 'three';
import { RUIDO } from './glsl.js';

export const SOLO = { larg: 6, alt: 4.6, prof: 3.4 };

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vObj; varying vec3 vN;
uniform float uTime,uFocoLo,uFocoHi,uFocoF;
${RUIDO}
const float LX=3.0; const float LY=2.3; const float LZ=1.7;

float bnd(float i,float s){
  float base=(i<0.5)?0.085:((i<1.5)?0.29:((i<2.5)?0.57:0.80));
  return base+0.012*sin(s*1.7+i*2.3)+0.032*(fbm(vec3(s*0.55,i*4.0,1.0))-0.5);
}
float lin(float x,float w){ return smoothstep(w,w*0.35,abs(x)); }

// raízes: linhas finas que descem e se ramificam
float raizes(float s,float d,float y){
  float m=0.0;
  for(int k=0;k<7;k++){
    float fk=float(k);
    float x0=0.55+fk*1.38+0.2*h31(vec3(fk,3.0,1.0));
    float sx=x0+0.22*sin(d*13.0+fk)+0.10*sin(d*31.0+fk*3.0);
    float w=0.022*(1.0-smoothstep(0.05,0.46-0.025*fk,d))+0.004;
    float on=step(0.05,d)*step(d,0.46-0.025*fk);
    m=max(m,lin(s-sx,w)*on);
    float sx2=sx+(d-0.13)*(0.9+0.2*fk*0.3)*(h31(vec3(fk,7.0,2.0))>0.5?1.0:-1.0);
    m=max(m,lin(s-sx2,w*0.7)*step(0.13,d)*step(d,0.36-0.02*fk));
  }
  return m;
}
// minhoca: segmento sinuoso rosado, com anéis
vec4 minhoca(float s,float y,float cs,float cy){
  float dx=s-cs; float t=dx/0.55;
  if(abs(t)>1.0) return vec4(0.0);
  float yy=cy+0.07*sin(dx*9.0)+0.05*dx;
  float r=0.055*(1.0-0.5*pow(abs(t),3.0));
  float dd=abs(y-yy);
  float m=smoothstep(r,r*0.7,dd);
  float aneis=0.5+0.5*sin(dx*95.0);
  vec3 c=mix(vec3(0.93,0.55,0.62),vec3(0.80,0.38,0.50),aneis*0.6);
  c*=0.75+0.35*smoothstep(r,0.0,dd);                       // volume
  return vec4(c,m);
}

void main(){
  vec3 p=vObj;
  vec3 n=normalize(vN);
  float ax=LX-abs(p.x), ay=LY-abs(p.y), az=LZ-abs(p.z);
  float mid=ax+ay+az-max(max(ax,ay),az)-min(min(ax,ay),az);
  float edge=1.0-smoothstep(0.0,0.045,mid);
  vec3 col;
  if(n.y>0.5){
    // topo: grama com tufos e flores
    vec2 v=vor(vec3(p.x*7.0,p.z*7.0,1.0));
    float tufo=smoothstep(0.55,0.0,v.x);
    vec3 g=mix(vec3(0.30,0.68,0.27),vec3(0.50,0.80,0.30),fbm(vec3(p.x*2.0,p.z*2.0,3.0)));
    g=mix(g,vec3(0.20,0.52,0.24),tufo*0.55);
    g*=0.88+0.22*vn(vec3(p.x*40.0,p.z*40.0,0.0));
    vec2 vf=vor(vec3(p.x*3.4,p.z*3.4,9.0)); float hf=h31(floor(vec3(p.x*3.4,p.z*3.4,9.0)));
    float flor=smoothstep(0.12,0.05,vf.x)*step(0.86,hf);
    g=mix(g,(hf>0.93)?vec3(1.0,0.95,0.55):vec3(1.0,0.98,0.98),flor);
    col=g*1.08;
  } else if(n.z>0.5||n.x>0.5){
    float s=(n.z>0.5)?(p.x+LX):(2.0*LX+(LZ-p.z));
    float d=(LY-p.y)/(2.0*LY);
    float y=d*4.6;
    float b0=bnd(0.0,s), b1=bnd(1.0,s), b2=bnd(2.0,s), b3=bnd(3.0,s);
    float idx=(d<b0)?0.0:((d<b1)?1.0:((d<b2)?2.0:((d<b3)?3.0:4.0)));
    if(idx<0.5){
      // serapilheira: folhas e matéria orgânica
      vec2 v=vor(vec3(s*9.0,y*13.0,2.0));
      float fol=smoothstep(0.30,0.12,v.x); float hh=h31(floor(vec3(s*9.0,y*13.0,2.0)));
      col=mix(vec3(0.33,0.20,0.12),vec3(0.50,0.33,0.16),hh);
      col=mix(col,(hh>0.6)?vec3(0.36,0.52,0.22):vec3(0.62,0.40,0.14),fol*0.85);
      col*=0.85+0.3*vn(vec3(s*30.0,y*30.0,1.0));
    } else if(idx<1.5){
      // A: solo fértil, escuro, com matéria orgânica, raízes e minhoca
      col=mix(vec3(0.24,0.14,0.10),vec3(0.36,0.22,0.15),smoothstep(0.06,0.27,d));
      col*=0.80+0.40*fbm(vec3(s*6.0,y*8.0,4.0));
      col+=vec3(0.18,0.12,0.06)*smoothstep(0.80,0.95,vn(vec3(s*45.0,y*45.0,2.0)));
      float rz=raizes(s,d,y);
      col=mix(col,vec3(0.92,0.76,0.50)*(0.9+0.2*vn(vec3(s*60.0,y*60.0,0.0))),rz);
      vec4 w=minhoca(s,y,2.9,0.27*4.6*0.74+0.02);
      col=mix(col,w.rgb,w.a);
      vec4 w2=minhoca(s,y,7.3,0.27*4.6*0.60);
      col=mix(col,w2.rgb,w2.a);
    } else if(idx<2.5){
      // B: argila alaranjada, manchas de ferro e seixos
      col=mix(vec3(0.70,0.38,0.20),vec3(0.80,0.52,0.28),fbm(vec3(s*3.0,y*5.0,6.0)));
      col=mix(col,vec3(0.58,0.24,0.14),smoothstep(0.60,0.82,fbm(vec3(s*9.0,y*14.0,2.0)))*0.6);
      col*=0.90+0.20*vn(vec3(s*40.0,y*40.0,3.0));
      vec2 vp=vor(vec3(s*3.2,y*5.4,5.0)); float hp=h31(floor(vec3(s*3.2,y*5.4,5.0)));
      float seixo=smoothstep(0.20,0.14,vp.x)*step(0.78,hp);
      vec3 sc=mix(vec3(0.60,0.52,0.48),vec3(0.80,0.70,0.58),h31(floor(vec3(s*3.2,y*5.4,5.0))+3.0));
      sc*=0.85+0.4*smoothstep(0.3,0.0,vp.x);
      col=mix(col,sc,seixo);
    } else if(idx<3.5){
      // C: rocha alterada em pedaços, lençol de água e um fóssil
      col=mix(vec3(0.82,0.69,0.50),vec3(0.70,0.58,0.42),fbm(vec3(s*3.5,y*5.0,8.0)));
      col*=0.92+0.16*vn(vec3(s*42.0,y*42.0,5.0));
      vec2 vp=vor(vec3(s*2.4,y*4.0,7.0)); float hp=h31(floor(vec3(s*2.4,y*4.0,7.0)));
      float ped=smoothstep(0.34,0.25,vp.x)*step(0.40,hp);
      vec3 pc=mix(vec3(0.52,0.54,0.66),vec3(0.70,0.70,0.80),hp);
      pc*=0.78+0.42*smoothstep(0.34,0.0,vp.x);
      col=mix(col,pc,ped);
      col=mix(col,col*0.35,smoothstep(0.012,0.0,vp.y-vp.x)*ped*0.5);
      // lençol freático: faixa azulada com ondas
      float aq=smoothstep(0.64,0.655,d+0.012*sin(s*7.0))*(1.0-smoothstep(0.715,0.735,d+0.012*sin(s*5.0+1.0)));
      vec3 az2=mix(vec3(0.20,0.45,0.78),vec3(0.35,0.70,0.92),0.5+0.5*sin(s*9.0+y*20.0));
      col=mix(col,col*0.55+az2*0.55,aq*0.85);
      col+=vec3(0.7,0.9,1.0)*smoothstep(0.02,0.0,abs(d-0.655+0.012*sin(s*7.0)))*0.6;
      // fóssil: amonite
      vec2 q=vec2(s-6.6,y-0.74*4.6); float R=length(q); float an=atan(q.y,q.x);
      float fm=smoothstep(0.34,0.31,R);
      float cr=0.5+0.5*sin(R*46.0-an*2.2);
      vec3 fc=mix(vec3(0.97,0.90,0.74),vec3(0.62,0.46,0.30),cr*0.7)*(0.85+0.3*smoothstep(0.34,0.0,R));
      col=mix(col,fc,fm);
    } else {
      // R: rocha-mãe com estratos, fraturas e veios
      float st=0.5+0.5*sin((d+0.02*fbm(vec3(s*2.0,d*3.0,1.0)))*95.0);
      col=mix(vec3(0.30,0.34,0.52),vec3(0.42,0.46,0.66),st*0.6+0.4*fbm(vec3(s*4.0,y*6.0,9.0)));
      col*=0.90+0.2*vn(vec3(s*50.0,y*50.0,6.0));
      vec2 vc=vor(vec3(s*1.6,y*2.6,4.0));
      col=mix(col,col*0.30,smoothstep(0.045,0.0,vc.y-vc.x)*0.8);
      float veio=smoothstep(0.012,0.0,abs(fract(s*0.7+d*1.4+0.2*sin(y*3.0))-0.5)-0.46);
      col=mix(col,vec3(0.92,0.80,0.92),veio*0.55);
    }
    // franja de grama no alto do corte
    float fr=0.02+0.016*vn(vec3(s*34.0,1.0,1.0))+0.01*sin(s*60.0);
    if(d<fr) col=mix(vec3(0.28,0.62,0.26),vec3(0.46,0.78,0.30),vn(vec3(s*50.0,2.0,2.0)));
    // linhas entre camadas
    float ln=smoothstep(0.006,0.0,abs(d-b0))+smoothstep(0.006,0.0,abs(d-b1))+smoothstep(0.006,0.0,abs(d-b2))+smoothstep(0.006,0.0,abs(d-b3));
    col=mix(col,col*0.45,clamp(ln,0.0,1.0)*0.7);
    // foco: a camada em destaque fica viva; as outras esmaecem para a sombra roxa
    bool dentro=(idx>=uFocoLo-0.5)&&(idx<=uFocoHi+0.5);
    if(uFocoF>0.001 && !dentro) col=col*(1.0-0.50*uFocoF)+vec3(0.11,0.03,0.20)*0.50*uFocoF;
    if(uFocoF>0.001 && dentro) col*=1.0+0.07*uFocoF;
    col*=((n.z>0.5)?1.14:0.92)*(1.08-0.22*d);   // luz de cima: o alto do corte é mais claro, o fundo mais escuro
  } else {
    col=vec3(0.13,0.08,0.10);
  }
  col*=1.0-0.45*edge;
  gl_FragColor=vec4(col,1.0);
}`;

export function criarSolo() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec3 vObj; varying vec3 vN; void main(){ vObj=position; vN=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: FRAG,
    uniforms: { uTime: { value: 0 }, uFocoLo: { value: 0 }, uFocoHi: { value: 0 }, uFocoF: { value: 0 } },
  });
  const bloco = new THREE.Mesh(new THREE.BoxGeometry(SOLO.larg, SOLO.alt, SOLO.prof), mat);
  const g = new THREE.Group();
  g.add(bloco);
  g.userData.material = mat;
  // ponto na face frontal (z = +prof/2) no centro do horizonte indicado, perto do lado direito do bloco
  g.userData.pontoDoHorizonte = (idx, xFrac = 0.78) => {
    const lim = [0, 0.085, 0.29, 0.57, 0.80, 1.0];
    const d = (lim[idx] + lim[idx + 1]) / 2;
    return new THREE.Vector3((xFrac - 0.5) * SOLO.larg, SOLO.alt / 2 - d * SOLO.alt, SOLO.prof / 2).applyMatrix4(g.matrixWorld);
  };
  return g;
}
