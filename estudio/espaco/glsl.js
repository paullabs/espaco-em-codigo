// Trechos de GLSL compartilhados: ruído 3D, voronoi e rampa toon.
export const RUIDO = /* glsl */ `
float h31(vec3 p){ p=fract(p*0.3183099+vec3(.71,.113,.419)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
vec3 h33(vec3 p){
  p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453);
}
float vn(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){
  float a=.5,s=0.;
  for(int i=0;i<5;i++){ s+=a*vn(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; }
  return s;
}
vec2 vor(vec3 x){
  vec3 i=floor(x), f=fract(x); float d1=8., d2=8.;
  for(int a=-1;a<=1;a++) for(int b=-1;b<=1;b++) for(int c=-1;c<=1;c++){
    vec3 g=vec3(float(a),float(b),float(c)); vec3 o=h33(i+g); vec3 r=g+o-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; } else if(d<d2){ d2=d; }
  }
  return vec2(sqrt(d1),sqrt(d2));
}
// número aleatório do ponto-semente MAIS PRÓXIMO (cada célula do voronoi tem um valor só, sem quadrados de grade)
float vorH(vec3 x){
  vec3 i=floor(x), f=fract(x); float d1=8.0; float h=0.0;
  for(int a=-1;a<=1;a++) for(int b=-1;b<=1;b++) for(int c=-1;c<=1;c++){
    vec3 g=vec3(float(a),float(b),float(c)); vec3 o=h33(i+g); vec3 r=g+o-f; float d=dot(r,r);
    if(d<d1){ d1=d; h=h31(i+g+vec3(3.7,1.3,5.1)); }
  }
  return h;
}
float st(float a,float x){ return smoothstep(a-0.006,a+0.006,x); }
// luz em 3 faixas, sombra puxada para o roxo, luz para o quente
vec3 toon3(vec3 alb,float ndl){
  float b1=smoothstep(-0.04,0.05,ndl);
  float b2=smoothstep(0.40,0.50,ndl);
  vec3 sh=alb*vec3(0.30,0.28,0.60);
  vec3 md=alb*vec3(0.78,0.78,0.96);
  vec3 li=alb*vec3(1.06,1.02,0.96);
  return mix(mix(sh,md,b1),li,b2);
}
`;
