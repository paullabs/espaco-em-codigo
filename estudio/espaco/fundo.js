// Fundo do espaço: nebulosa em degradê suave (índigo -> violeta, toques magenta/azul) e estrelas em 3 camadas.
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { COR } from './design.js';

const c3 = (h) => {
  const c = new THREE.Color(h);
  return new THREE.Vector3(c.r, c.g, c.b);
};

export function criarNebulosa({ semente = 3.0, forca = 1.0 } = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      c1: { value: c3(COR.espaco.fundo1) },
      c2: { value: c3(COR.espaco.fundo2) },
      cm: { value: c3(COR.espaco.nebulaMagenta) },
      ca: { value: c3(COR.espaco.nebulaAzul) },
      uSem: { value: semente },
      uForca: { value: forca },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);}',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vD; uniform vec3 c1,c2,cm,ca; uniform float uSem,uForca;
${RUIDO}
void main(){
  vec3 d=normalize(vD);
  float g=smoothstep(-0.9,0.9,d.x*0.6+d.y*0.8);
  vec3 col=mix(c1,c2,g);
  float n=fbm(d*1.8+uSem);
  float n2=fbm(d*3.2+uSem*2.0+5.0);
  col+=cm*smoothstep(0.52,0.85,n)*0.42*uForca;
  col+=ca*smoothstep(0.55,0.9,n2)*0.30*uForca;
  col*=0.92+0.08*vn(d*60.0);
  gl_FragColor=vec4(col,1.0);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 32), m);
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  return mesh;
}

export function criarEstrelas({ n = 900, raio = 60, tamanho = 1, semente = 1, tonalidades } = {}) {
  let s = semente * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pos = new Float32Array(n * 3);
  const cor = new Float32Array(n * 3);
  const tam = new Float32Array(n);
  const fase = new Float32Array(n);
  const tons = (tonalidades || ['#FFFFFF', '#FFE9C2', '#CFE3FF', '#E9D6FF']).map((h) => new THREE.Color(h));
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pos.set([r * Math.cos(a) * raio, u * raio, r * Math.sin(a) * raio], i * 3);
    const t = tons[Math.floor(rnd() * tons.length)];
    cor.set([t.r, t.g, t.b], i * 3);
    tam[i] = (rnd() < 0.06 ? 7 + rnd() * 6 : 1.4 + rnd() * 3.2) * tamanho;
    fase[i] = rnd() * 6.28;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('cor', new THREE.BufferAttribute(cor, 3));
  g.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  g.setAttribute('fase', new THREE.BufferAttribute(fase, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uEsc: { value: 1 } },
    vertexShader: /* glsl */ `
attribute vec3 cor; attribute float tam; attribute float fase; uniform float uT; uniform float uEsc;
varying vec3 vC; varying float vB;
void main(){ vC=cor; vB=0.75+0.25*sin(uT*1.3+fase); gl_PointSize=tam*uEsc; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vC; varying float vB;
void main(){
  vec2 u=gl_PointCoord*2.0-1.0; float d=length(u);
  float core=smoothstep(0.55,0.0,d);
  float cruz=max(0.0,1.0-abs(u.x)*9.0)*max(0.0,1.0-abs(u.y)*1.1)+max(0.0,1.0-abs(u.y)*9.0)*max(0.0,1.0-abs(u.x)*1.1);
  float a=(core+cruz*0.35)*vB;
  if(a<0.01) discard;
  gl_FragColor=vec4(vC*a,a);
}`,
  });
  const p = new THREE.Points(g, m);
  p.renderOrder = -90;
  p.frustumCulled = false;
  return p;
}

// halo suave com anéis (estilo infográfico): textura de canvas para sprites aditivos
export function texturaHalo(paradas, tamanho = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = tamanho;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(tamanho / 2, tamanho / 2, 0, tamanho / 2, tamanho / 2, tamanho / 2);
  paradas.forEach(([p, cor]) => g.addColorStop(p, cor));
  x.fillStyle = g;
  x.fillRect(0, 0, tamanho, tamanho);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function texturaRaios(n = 28, cor = '255,200,120', tamanho = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = tamanho;
  const x = c.getContext('2d');
  x.translate(tamanho / 2, tamanho / 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const len = tamanho * (0.28 + 0.2 * ((i * 7) % 5) / 5);
    const w = 0.05 + 0.02 * ((i * 3) % 4);
    x.save();
    x.rotate(a);
    const g = x.createLinearGradient(tamanho * 0.12, 0, len, 0);
    g.addColorStop(0, `rgba(${cor},0.55)`);
    g.addColorStop(1, `rgba(${cor},0)`);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(tamanho * 0.1, -tamanho * 0.012);
    x.lineTo(len, -tamanho * w * 0.02);
    x.lineTo(len, tamanho * w * 0.02);
    x.lineTo(tamanho * 0.1, tamanho * 0.012);
    x.fill();
    x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

// poeira e partículas no MUNDO (não seguem a câmera): dão paralaxe e profundidade, e ficam fora de foco
export function criarPoeiraMundo({ n = 120, centro = new THREE.Vector3(), raioMin = 3, raioMax = 16, tam = 1, semente = 1, tons } = {}) {
  let s = semente * 7919 + 104729;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pos = new Float32Array(n * 3);
  const cor = new Float32Array(n * 3);
  const tm = new Float32Array(n);
  const paleta = (tons || ['#B9B3E8', '#FFB347', '#FF7AA8', '#7FD8FF']).map((h) => new THREE.Color(h));
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const r = raioMin + rnd() * (raioMax - raioMin);
    const k = Math.sqrt(1 - u * u);
    pos.set([centro.x + k * Math.cos(a) * r, centro.y + u * r * 0.7, centro.z + k * Math.sin(a) * r], i * 3);
    const c = paleta[Math.floor(rnd() * paleta.length)];
    cor.set([c.r, c.g, c.b], i * 3);
    tm[i] = (0.05 + rnd() * 0.14) * tam;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('cor', new THREE.BufferAttribute(cor, 3));
  g.setAttribute('tam', new THREE.BufferAttribute(tm, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    uniforms: { uAlt: { value: 1080 } },
    vertexShader: `attribute vec3 cor; attribute float tam; uniform float uAlt; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vC=cor; vA=0.55; gl_PointSize=tam*uAlt/(-mv.z)*projectionMatrix[1][1]*0.5; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `precision highp float; varying vec3 vC; varying float vA;
      void main(){ vec2 u=gl_PointCoord*2.0-1.0; float d=length(u); float a=smoothstep(1.0,0.2,d)*vA; if(a<0.01) discard; gl_FragColor=vec4(vC*a,a); }`,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}


// Poeira espacial: grãos fixos no mundo, repetidos em volta da câmera (rede periódica). Quando a câmera anda eles passam por perto
// (paralaxe, profundidade, velocidade); de longe viram quase nada. Discreta: poucos grãos, claros e pequenos, nunca competem com o assunto.
export function criarPoeiraEspacial({ n = 520, caixa = 14, semente = 5, tamanho = 9, H = 1920, cor = '#d9d3ff', opacidade = 0.5 } = {}) {
  let s = semente * 9301 + 49297; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pos = new Float32Array(n * 3), tam = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([rnd() * caixa, rnd() * caixa, rnd() * caixa], i * 3); tam[i] = 0.5 + rnd() * rnd() * 1.8; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    uniforms: { uCaixa: { value: caixa }, uTam: { value: tamanho * (H / 1920) }, uCor: { value: new THREE.Color(cor) }, uOp: { value: opacidade }, uT: { value: 0 } },
    vertexShader: /* glsl */ `
attribute float tam; uniform float uCaixa,uTam,uT; varying float vA;
void main(){
  vec3 p=mod(position-cameraPosition+vec3(uCaixa*0.5),vec3(uCaixa))-vec3(uCaixa*0.5);
  vec4 mv=viewMatrix*vec4(cameraPosition+p,1.0);
  float d=-mv.z;
  float borda=1.0-smoothstep(uCaixa*0.28,uCaixa*0.5,length(p));
  vA=borda*smoothstep(0.15,0.9,d)*(0.55+0.45*sin(uT*1.1+position.x*7.0));
  gl_PointSize=min(7.0,tam*uTam/max(d,0.25));
  gl_Position=projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */ `
precision highp float; uniform vec3 uCor; uniform float uOp; varying float vA;
void main(){ vec2 u=gl_PointCoord*2.0-1.0; float a=smoothstep(1.0,0.0,length(u))*vA*uOp; if(a<0.01) discard; gl_FragColor=vec4(uCor*a,a); }`,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 1;
  return pts;
}
