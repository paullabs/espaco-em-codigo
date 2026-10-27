// Pós-processamento de cinema: profundidade de campo física (lente em mm + abertura f + distância de foco),
// bloom nas luzes fortes, vinheta e grão leve. A cena é desenhada num alvo com buffer de profundidade.
import * as THREE from 'three';
import { SENSOR_H } from './camera.js';
import { MARCA, agendaMarca, texturaMarca } from './marca.js';   // marca d'água do canal: parte do núcleo, desenhada em todo quadro

const VERT = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';

const DOF = /* glsl */ `
precision highp float; varying vec2 vUv;
uniform sampler2D tColor,tDepth; uniform vec2 uRes; uniform float uNear,uFar,uFoco,uMm,uN,uEsc,uMax,uSensor;
float linZ(float d){ float z=d*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear-z*(uFar-uNear)); }
float coc(float dist){
  float S=uFoco*1000.0; float d=dist*1000.0;
  float c=(uMm*uMm/(uN*(S-uMm)))*abs(d-S)/d;          // círculo de confusão no sensor, em mm
  return min(c/uSensor*uRes.y*uEsc,uMax);              // em pixels
}
void main(){
  vec3 col0=texture2D(tColor,vUv).rgb;
  float c0=coc(linZ(texture2D(tDepth,vUv).x));
  if(c0<0.7){ gl_FragColor=vec4(col0,1.0); return; }
  vec3 acc=vec3(0.0); float ws=0.0;
  for(int i=0;i<56;i++){
    float fi=float(i);
    float r=sqrt((fi+0.5)/56.0);
    float a=fi*2.39996323;
    vec2 uv=vUv+vec2(cos(a),sin(a))*r*c0/uRes;
    float cs=coc(linZ(texture2D(tDepth,uv).x));
    vec3 s=texture2D(tColor,uv).rgb;
    float w=smoothstep(r*c0-1.2,r*c0+1.2,cs);           // só contribui quem tem desfoque que alcança aqui
    float lum=dot(s,vec3(0.30,0.59,0.11));
    w*=1.0+lum*lum*2.2;                                   // luzes fortes viram bokeh visível
    acc+=s*w; ws+=w;
  }
  gl_FragColor=vec4(acc/max(ws,1e-4),1.0);
}`;

const BRILHO = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D tColor;
void main(){ vec3 c=min(texture2D(tColor,vUv).rgb,vec3(4.0)); float l=dot(c,vec3(0.30,0.59,0.11)); gl_FragColor=vec4(c*smoothstep(0.78,1.25,l),1.0); }`;

// Borrão de movimento da câmera: reconstrói a posição de cada pixel pela profundidade e a reprojeta com a câmera de 1 quadro antes;
// o deslocamento (obturador 180°) vira o comprimento do borrão. Só enxerga o movimento da câmera (planetas, estrelas e Sóis sólidos).
const MB = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D tColor,tDepth; uniform mat4 uInvVP,uPrevVP; uniform float uK,uMax;
void main(){
  vec3 c0=texture2D(tColor,vUv).rgb;
  float d=texture2D(tDepth,vUv).x;
  if(uK<=0.0||d>=0.99999){ gl_FragColor=vec4(c0,1.0); return; }
  vec4 w=uInvVP*vec4(vUv*2.0-1.0,d*2.0-1.0,1.0); w/=w.w;
  vec4 pc=uPrevVP*w; vec2 pv=(pc.xy/pc.w)*0.5+0.5;
  vec2 v=(vUv-pv)*0.5*uK;
  float L=length(v); if(L>uMax) v*=uMax/L;
  if(L<0.0008){ gl_FragColor=vec4(c0,1.0); return; }
  vec3 acc=c0; float ws=1.0;
  for(int i=1;i<=10;i++){ float f=float(i)/10.0-0.5; vec2 uv=vUv+v*f; float di=texture2D(tDepth,uv).x; float w2=(di<0.99999)?1.0:0.35; acc+=texture2D(tColor,uv).rgb*w2; ws+=w2; }
  gl_FragColor=vec4(acc/ws,1.0);
}`;

const BORRA = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D tColor; uniform vec2 uDir;
void main(){
  vec3 s=texture2D(tColor,vUv).rgb*0.2270270270;
  s+=texture2D(tColor,vUv+uDir*1.3846153846).rgb*0.3162162162; s+=texture2D(tColor,vUv-uDir*1.3846153846).rgb*0.3162162162;
  s+=texture2D(tColor,vUv+uDir*3.2307692308).rgb*0.0702702703; s+=texture2D(tColor,vUv-uDir*3.2307692308).rgb*0.0702702703;
  gl_FragColor=vec4(s,1.0);
}`;

const FINAL = /* glsl */ `
precision highp float; varying vec2 vUv; uniform sampler2D tColor,tBloom,tMarca; uniform vec4 uMarca; uniform float uMarcaOp; uniform float uBloom,uGrao,uT,uVinheta,uFlash,uFade,uFlashR,uGrade,uSatD; uniform vec2 uRes,uFlashC; uniform vec3 uFlashCor;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 c=vUv-0.5;
  vec2 ab=c*0.0016;                                       // aberração cromática mínima nas bordas
  vec3 col=vec3(texture2D(tColor,vUv+ab).r,texture2D(tColor,vUv).g,texture2D(tColor,vUv-ab).b);
  col+=texture2D(tBloom,vUv).rgb*uBloom*mix(vec3(1.0),vec3(1.0,0.96,0.90),uGrade);   // grade: o brilho ganha um halo quente
  if(uFlashR>0.0){ float dd=length((vUv-uFlashC)*vec2(uRes.x/uRes.y,1.0)); col+=uFlashCor*uFlash*(1.0-smoothstep(0.0,uFlashR,dd)); }  // clarão que nasce no lugar do impacto
  else col=mix(col,vec3(1.0,0.96,0.88),uFlash);
  if(uGrade>0.0){                                                                          // gradação de cinema: sombras frias, luzes quentes, S suave, um pouco mais de cor
    float l=dot(col,vec3(0.30,0.59,0.11));
    col=mix(vec3(l),col,1.0+0.07*uGrade+uSatD);
    col*=mix(vec3(1.0),vec3(0.95,0.99,1.07),uGrade*smoothstep(0.45,0.0,l));
    col*=mix(vec3(1.0),vec3(1.05,1.01,0.95),uGrade*smoothstep(0.35,1.0,l));
    vec3 cc=clamp(col,0.0,1.0); col=mix(col,cc*cc*(3.0-2.0*cc)+(col-cc),0.28*uGrade);
  }
  float v=smoothstep(0.95,0.30,length(c*vec2(1.0,0.82)*1.15));
  col*=mix(1.0-uVinheta,1.0,v);
  col+=(h(vUv*uRes+uT)-0.5)*uGrao;
  col*=1.0-uFade;
  { vec2 mu=(vUv-uMarca.xy)/uMarca.zw; if(uMarcaOp>0.0&&mu.x>0.0&&mu.x<1.0&&mu.y>0.0&&mu.y<1.0){ vec4 mk=texture2D(tMarca,mu); col=mix(col,mk.rgb,mk.a*uMarcaOp); } }   // marca d'água do canal (por último: nem o fade a esconde)
  gl_FragColor=vec4(col,1.0);
}`;

export class Pos {
  constructor(renderer, W, H) {
    this.r = renderer;
    this.W = W;
    this.H = H;
    const dt = new THREE.DepthTexture(W, H);
    dt.type = THREE.UnsignedIntType;
    dt.format = THREE.DepthFormat;
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture: dt });
    const mk = (w, h, filtro = THREE.LinearFilter) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: filtro, magFilter: filtro });
    this.rtDof = mk(W, H);
    this.rtMB = mk(W, H);
    const bw = Math.max(2, Math.round(W / 4));
    const bh = Math.max(2, Math.round(H / 4));
    this.rtB1 = mk(bw, bh);
    this.rtB2 = mk(bw, bh);
    this.camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.cenaQ = new THREE.Scene();
    this.malha = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial());
    this.malha.frustumCulled = false;
    this.cenaQ.add(this.malha);
    const M = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    this.mDof = M(DOF, { tColor: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(W, H) }, uNear: { value: 0.1 }, uFar: { value: 400 }, uFoco: { value: 10 }, uMm: { value: 35 }, uN: { value: 4 }, uEsc: { value: 1 }, uMax: { value: 26 * (H / 1080) }, uSensor: { value: H > W ? 24 : SENSOR_H } });
    this.mMB = M(MB, { tColor: { value: null }, tDepth: { value: null }, uInvVP: { value: new THREE.Matrix4() }, uPrevVP: { value: new THREE.Matrix4() }, uK: { value: 0 }, uMax: { value: 0.045 } });
    this.mBrilho = M(BRILHO, { tColor: { value: null } });
    this.mBorra = M(BORRA, { tColor: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.marca = texturaMarca(W, H);
    this.mFinal = M(FINAL, { tMarca: { value: this.marca.tex }, uMarca: { value: new THREE.Vector4(0, 0, 0, 0) }, uMarcaOp: { value: 0 }, tColor: { value: null }, tBloom: { value: null }, uBloom: { value: 0.55 }, uGrao: { value: 0.02 }, uFlash: { value: 0 }, uFlashR: { value: 0 }, uGrade: { value: 0 }, uSatD: { value: 0 }, uFlashC: { value: new THREE.Vector2(0.5, 0.5) }, uFlashCor: { value: new THREE.Vector3(1, 0.93, 0.8) }, uFade: { value: 0 }, uT: { value: 0 }, uVinheta: { value: 0.5 }, uRes: { value: new THREE.Vector2(W, H) } });
  }

  _quad(mat, alvo) {
    this.malha.material = mat;
    this.r.setRenderTarget(alvo);
    this.r.render(this.cenaQ, this.camQ);
  }

  // lente: { mm, f, foco } (foco em unidades da cena = metros); opcoes: { esc, bloom, grao, vinheta }
  renderizar(scene, camera, lente = {}, t = 0) {
    const r = this.r;
    r.setRenderTarget(this.rt);
    r.render(scene, camera);
    let cor = this.rt.texture;
    if (lente.mb && lente.mb.k > 0) {
      const u = this.mMB.uniforms; u.tColor.value = this.rt.texture; u.tDepth.value = this.rt.depthTexture;
      u.uInvVP.value.copy(lente.mb.invVP); u.uPrevVP.value.copy(lente.mb.prevVP); u.uK.value = lente.mb.k; u.uMax.value = lente.mb.max ?? 0.045;
      this._quad(this.mMB, this.rtMB); cor = this.rtMB.texture;
    }
    if (lente.foco) {
      const u = this.mDof.uniforms;
      u.tColor.value = cor;
      u.tDepth.value = this.rt.depthTexture;
      u.uNear.value = camera.near;
      u.uFar.value = camera.far;
      u.uFoco.value = lente.foco;
      u.uMm.value = lente.mm;
      u.uN.value = lente.f;
      u.uEsc.value = lente.esc ?? 1;
      this._quad(this.mDof, this.rtDof);
      cor = this.rtDof.texture;
    }
    // bloom: brilho -> borra H/V duas vezes (em 1/4 da resolução)
    this.mBrilho.uniforms.tColor.value = cor;
    this._quad(this.mBrilho, this.rtB1);
    for (let i = 0; i < 2; i++) {
      this.mBorra.uniforms.tColor.value = this.rtB1.texture;
      this.mBorra.uniforms.uDir.value.set((1 / this.rtB1.width) * (1 + i), 0);
      this._quad(this.mBorra, this.rtB2);
      this.mBorra.uniforms.tColor.value = this.rtB2.texture;
      this.mBorra.uniforms.uDir.value.set(0, (1 / this.rtB1.height) * (1 + i));
      this._quad(this.mBorra, this.rtB1);
    }
    const f = this.mFinal.uniforms;
    f.tColor.value = cor;
    f.tBloom.value = this.rtB1.texture;
    f.uBloom.value = lente.bloom ?? 0.55;
    f.uGrao.value = lente.grao ?? 0.02;
    f.uVinheta.value = lente.vinheta ?? 0.5;
    f.uFlash.value = lente.flash ?? 0;
    f.uGrade.value = lente.grade ?? 0;
    f.uSatD.value = lente.sat ?? 0;
    f.uFlashR.value = lente.flashR ?? 0;
    if (lente.flashC) f.uFlashC.value.set(lente.flashC[0], lente.flashC[1]);
    f.uFlashCor.value.set(...(lente.flashCor || [1, 0.93, 0.8]));
    f.uFade.value = lente.fade ?? 0;
    f.uT.value = (t * 7.31) % 10;
    { const ag = agendaMarca(t, this.H > this.W), m = this.marca; f.uMarca.value.set(ag.lado === 'e' ? ag.x : ag.x - m.uw, 1 - (ag.y + m.uh), m.uw, m.uh); f.uMarcaOp.value = MARCA.opacidade * ag.a; }
    this._quad(this.mFinal, null);
  }
}
