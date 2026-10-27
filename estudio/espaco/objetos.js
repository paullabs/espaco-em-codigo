// Objetos didáticos da cena genérica (cenas/video.js): as imagens que os livros usam para explicar, feitas em código.
//   luz      um cone de luz de um ponto a outro (a luz da Lua chegando na Terra)
//   bola     uma bolinha sólida (três bolinhas caindo para a Lua, com uma corda que estica)
//   seta     uma seta que cresce de um ponto a outro (um puxão, uma força, um sentido)
//   campo    um anel de setas em volta de um corpo: o puxão que sobra da Lua (maré) ou a parte que empurra a água
//   oceano   a água em volta de um planeta, esticada pelos bojos da maré (vista de lado, ou de cima)
//   praia    o chão onde a pessoa vive: areia, mar com ondas, régua de maré, luar (e a noite sem a Lua)
//   pino     um marcador na superfície de um planeta que gira (a praia vista do espaço)
//   grafico  uma curva que se desenha ao lado (a maré do dia) com um ponto que anda
// Cada fábrica recebe o contexto do objeto e devolve { grupo, atualizar(f), registro(), aceso(v) }.
// "f" é o que a cena entrega a cada quadro: { t, p, esc, pr, ponto, porTrechos, camera, OBJ, anguloDe, raioDe, presenca, dirLuz }.
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { linhaGorda } from './linhas.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));
const V3 = (a) => new THREE.Vector3().fromArray(a);

// ---------- seta ----------
export function criarSetaMesh(cor = '#FFD166') {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cor), transparent: true, depthWrite: false });
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 14), mat);
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 18), mat);
  haste.renderOrder = ponta.renderOrder = 6;
  g.add(haste, ponta);
  const Y = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), q = new THREE.Quaternion();
  g.userData.mat = mat;
  g.userData.ajustar = (a, b, largura, op = 1) => {
    d.subVectors(b, a);
    const L = d.length();
    if (L < 1e-5 || op < 0.005) { g.visible = false; return; }
    g.visible = true;
    d.divideScalar(L);
    const hl = Math.min(L * 0.5, largura * 3.2), hs = Math.max(1e-4, L - hl);
    q.setFromUnitVectors(Y, d);
    haste.quaternion.copy(q); ponta.quaternion.copy(q);
    haste.scale.set(largura, hs, largura); haste.position.copy(a).addScaledVector(d, hs / 2);
    ponta.scale.set(largura * 2.6, hl, largura * 2.6); ponta.position.copy(a).addScaledVector(d, hs + hl / 2);
    mat.opacity = op;
  };
  return g;
}

function seta(c) {
  const { sp } = c;
  const grupo = new THREE.Group();
  const s = criarSetaMesh(sp.cor || '#FFD166');
  grupo.add(s);
  const desenha = sp.desenha ? [c.tempo(sp.desenha[0], `objeto ${c.nome}, desenha`), c.tempo(sp.desenha[1], `objeto ${c.nome}, desenha`)] : null;
  let a = new THREE.Vector3(), e = new THREE.Vector3();
  return {
    grupo,
    atualizar(f) {
      a = f.ponto(sp.de, f.t, `objeto ${c.nome}, "de"`);
      const b = f.ponto(sp.para, f.t, `objeto ${c.nome}, "para"`);
      const k = (desenha ? suave(entre(f.t, desenha[0], desenha[1])) : 1) * f.esc;
      e = a.clone().lerp(b, k);
      s.userData.ajustar(a, e, sp.largura ?? 0.05, (sp.opacidade ?? 1) * Math.min(1, f.pr));
    },
    registro() { return [a.clone().lerp(e, 0.5), a.distanceTo(e) / 2 + 0.05]; },
  };
}

// ---------- luz (um cone de luz de um ponto a outro: a luz da Lua chegando na Terra) ----------
function luz(c) {
  const { sp } = c;
  const grupo = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCor: { value: new THREE.Color(sp.cor || '#CFE0FF') }, uA: { value: sp.opacidade ?? 0.5 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vT; void main(){ vT=0.5-position.y; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'precision highp float; uniform vec3 uCor; uniform float uA; varying vec3 vN; varying vec3 vV; varying float vT; void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float a=pow(f,1.7)*uA*(1.0-0.55*vT)*smoothstep(0.0,0.06,vT); gl_FragColor=vec4(uCor*a,a); }',
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(sp.raio_ini ?? 0.2, sp.raio_fim ?? 0.8, 1, 48, 1, true), mat);
  cone.renderOrder = 5; cone.frustumCulled = false;
  grupo.add(cone);
  const Y = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  let meio = new THREE.Vector3(), L = 1;
  return {
    grupo,
    atualizar(f) {
      const a = f.ponto(sp.de, f.t, `objeto ${c.nome}, "de"`), b = f.ponto(sp.para, f.t, `objeto ${c.nome}, "para"`);
      const d = a.clone().sub(b); L = d.length();
      if (L < 1e-4) { cone.visible = false; return; }
      cone.visible = true; meio = a.clone().lerp(b, 0.5);
      cone.position.copy(meio); cone.scale.set(f.esc, L, f.esc); q.setFromUnitVectors(Y, d.normalize()); cone.quaternion.copy(q);
      mat.uniforms.uA.value = (sp.opacidade ?? 0.5) * Math.min(1, f.pr);
    },
    registro() { return [meio, L / 2]; },
  };
}

// ---------- bola (uma bolinha sólida, para experimentos de livro: três bolinhas caindo, uma corda esticando) ----------
function bola(c) {
  const { sp } = c;
  const grupo = new THREE.Group();
  const cor = new THREE.Color(sp.cor || '#FFD166');
  const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true });
  const esfera = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
  const aro = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(sp.cor_borda || '#FFFFFF'), transparent: true, opacity: 0.0, side: THREE.BackSide }));
  const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.halo, color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  esfera.renderOrder = 6; brilho.renderOrder = 7;
  grupo.add(esfera, aro, brilho);
  let centro = new THREE.Vector3(), r = 0.1;
  return {
    grupo,
    atualizar(f) {
      centro = f.p.clone(); r = Math.max(f.r, 1e-4);
      grupo.position.copy(f.p); esfera.scale.setScalar(r); aro.scale.setScalar(r * 1.18); brilho.scale.setScalar(r * 4.2);
      const op = Math.min(1, f.pr);
      mat.opacity = op; brilho.material.opacity = 0.5 * op; aro.material.opacity = 0.5 * op;
    },
    registro() { return [centro, r * 1.5]; },
  };
}

// ---------- campo de setas (maré) ----------
// modo "mare": o puxão que SOBRA depois de tirar o puxão do centro (para fora dos dois lados, para dentro nos lados)
// modo "superficie": só a parte que corre ao longo da superfície, a que empurra a água (zero nos dois pontos e a 90°, máxima a 45°)
function campo(c) {
  const { sp } = c;
  const n = sp.n ?? 16;
  const grupo = new THREE.Group();
  const setas = Array.from({ length: n }, () => { const s = criarSetaMesh(); grupo.add(s); return s; });
  const lista = c.lista(sp.crescer, `objeto ${c.nome}, crescer`);
  const corFora = new THREE.Color(sp.cor_fora || sp.cor || '#FFD166'), corDentro = new THREE.Color(sp.cor_dentro || '#7FE8FF');
  let centro = new THREE.Vector3(), R = 1;
  return {
    grupo,
    atualizar(f) {
      centro = f.p.clone();
      R = sp.raio ?? 1.3;
      const d = f.ponto(sp.fonte, f.t, `objeto ${c.nome}, "fonte"`).sub(centro).normalize();
      let v = V3(sp.eixo ?? [0, 1, 0]);
      v.addScaledVector(d, -v.dot(d));
      if (v.lengthSq() < 1e-6) v = new THREE.Vector3(0, 0, 1).addScaledVector(d, -d.z);
      v.normalize();
      const grow = (lista.length ? f.porTrechos(lista, f.t, sp.crescer_inicial ?? 0) : 1) * f.esc;
      const esc = (sp.comprimento ?? 0.5) * grow;
      const modo = sp.modo || 'mare';
      for (let i = 0; i < n; i++) {
        const ph = (2 * Math.PI * i) / n;
        const nr = d.clone().multiplyScalar(Math.cos(ph)).addScaledVector(v, Math.sin(ph));
        const nd = nr.dot(d);
        const a = modo === 'superficie'
          ? d.clone().addScaledVector(nr, -nd).multiplyScalar(3 * nd / 1.5)
          : d.clone().multiplyScalar(3 * nd).addScaledVector(nr, -1).multiplyScalar(0.5);
        const cauda = centro.clone().addScaledVector(nr, R);
        const sai = modo === 'superficie' ? 1 : a.dot(nr);
        setas[i].userData.mat.color.copy(sai >= 0 ? corFora : corDentro);
        const len = a.length() * esc;
        const ponta = cauda.clone().add(a.clone().multiplyScalar(esc));
        // no modo "mare" as setas de dentro começam do lado de fora e apontam para o centro
        setas[i].userData.ajustar(cauda, ponta, sp.largura ?? 0.045, len < 0.02 ? 0 : (sp.opacidade ?? 1) * Math.min(1, f.pr));
      }
    },
    registro() { return [centro, R + 0.4]; },
  };
}

// ---------- oceano (a água esticada pela maré) ----------
function oceano(c) {
  const { sp } = c;
  const fontes = (sp.mares || []).slice(0, 3).map((m, k) => ({ de: m.de, a: c.lista(m.amplitude || [], `objeto ${c.nome}, mares ${k + 1}`), ini: m.amplitude_inicial ?? 0, rel: m.relativa }));
  const realce = c.lista(sp.realce || [], `objeto ${c.nome}, realce`); // a água acende quando a fala diz "mar": [{de, ate, para: 1}, {de, ate, para: 0}]
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uD0: { value: new THREE.Vector3(1, 0, 0) }, uD1: { value: new THREE.Vector3(0, 0, 1) }, uD2: { value: new THREE.Vector3(0, 1, 0) },
      uA: { value: new THREE.Vector3() },
      uCor: { value: new THREE.Color(sp.cor || '#2D6BC9') }, uCorSom: { value: new THREE.Color(sp.cor_sombra || '#14307A') },
      uL: { value: new THREE.Vector3(-0.6, 0.5, 0.7).normalize() }, uLm: { value: new THREE.Vector3(1, 0, 0) }, uLmK: { value: 0 }, uOp: { value: sp.opacidade ?? 0.8 }, uTime: { value: 0 }, uReal: { value: 0 }, uGlow: { value: 1 / Math.max(0.05, sp.glow ?? 0.25) },
    },
    vertexShader: /* glsl */ `
uniform vec3 uD0,uD1,uD2,uA;
varying vec3 vN; varying vec3 vW; varying float vH; varying vec3 vNo;
void main(){
  vec3 n=normalize(position);
  float c0=dot(n,uD0), c1=dot(n,uD1), c2=dot(n,uD2);
  float h=uA.x*(3.0*c0*c0-1.0)*0.5+uA.y*(3.0*c1*c1-1.0)*0.5+uA.z*(3.0*c2*c2-1.0)*0.5;
  vec3 gr=3.0*uA.x*c0*(uD0-c0*n)+3.0*uA.y*c1*(uD1-c1*n)+3.0*uA.z*c2*(uD2-c2*n);
  float r=1.0+h;
  vec3 nn=normalize(n-gr/r);
  vec4 w=modelMatrix*vec4(n*r,1.0);
  vW=w.xyz; vN=normalize(mat3(modelMatrix)*nn); vH=h; vNo=n;
  gl_Position=projectionMatrix*viewMatrix*w;
}`,
    fragmentShader: /* glsl */ `
precision highp float;
uniform vec3 uCor,uCorSom,uL,uLm; uniform float uOp,uTime,uGlow,uLmK,uReal;
varying vec3 vN; varying vec3 vW; varying float vH; varying vec3 vNo;
${RUIDO}
void main(){
  vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW); vec3 L=normalize(uL);
  float ndl=dot(N,L);
  float k=smoothstep(-0.03,0.03,ndl-0.02);
  vec3 col=mix(uCorSom,uCor,k);
  float rip=fbm(vNo*16.0+vec3(0.0,uTime*0.12,0.0));
  col*=0.90+0.2*rip;
  float fres=pow(1.0-max(dot(N,V),0.0),2.4);
  col+=vec3(0.22,0.72,0.9)*fres*0.6;
  col+=vec3(0.35,0.85,1.0)*clamp(vH*uGlow,0.0,1.0)*0.32;      // o bojo é mais claro: o olho acha onde a água subiu
  vec3 Rr=reflect(-L,N); float spc=pow(max(dot(Rr,V),0.0),50.0); col+=vec3(1.0)*spc*0.5*k;
  // luar: a luz da Lua deixa o mar do lado da noite prateado (e some junto com ela)
  vec3 Lm=normalize(uLm); float dm=max(dot(N,Lm),0.0);
  col+=vec3(0.60,0.80,1.0)*dm*uLmK*0.85;
  vec3 Rm=reflect(-Lm,N); col+=vec3(0.9,0.96,1.0)*pow(max(dot(Rm,V),0.0),22.0)*uLmK*1.3;
  col+=vec3(0.30,0.80,1.0)*uReal*(0.30+0.6*fres);              // realce: a água acende no instante em que a fala diz o nome dela
  gl_FragColor=vec4(col,min(1.0,uOp*(0.80+0.2*fres)+0.12*uReal));
}`,
  });
  const malha = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mat);
  malha.renderOrder = 3;
  const grupo = new THREE.Group();
  grupo.add(malha);
  let amps = [0, 0, 0], dirs = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)], raio = 1;
  const u = mat.uniforms;
  return {
    grupo,
    atualizar(f) {
      raio = f.r;
      grupo.position.copy(f.p); grupo.scale.setScalar(Math.max(f.r, 1e-4));
      u.uTime.value = f.t;
      u.uReal.value = realce.length ? f.porTrechos(realce, f.t, 0) : 0;
      fontes.forEach((m, i) => {
        amps[i] = f.porTrechos(m.a, f.t, m.ini) * Math.min(1, f.pr);
        dirs[i] = f.ponto(m.de, f.t, `objeto ${c.nome}, mares`).sub(f.p).normalize();
        [u.uD0, u.uD1, u.uD2][i].value.copy(dirs[i]);
      });
      u.uA.value.set(amps[0] || 0, amps[1] || 0, amps[2] || 0);
      if (sp.luar) this.luar(f.ponto(sp.luar, f.t, `objeto ${c.nome}, "luar"`).sub(f.p).normalize(), f.presenca(sp.luar, f.t) * (sp.luar_forca ?? 1));
    },
    aceso(v) { u.uL.value.copy(v); },
    luar(dir, k) { u.uLm.value.copy(dir); u.uLmK.value = k; },
    // altura da água (fração do raio) na direção n do mundo: o pino lê daqui para saber se está sob um bojo
    // raio da superfície da água na direção n do mundo (para o pino andar em cima da água)
    raioEm(n) { let h = 0; dirs.forEach((d, i) => { if (i < fontes.length) { const x = n.dot(d); h += (amps[i] || 0) * (3 * x * x - 1) * 0.5; } }); return raio * (1 + h); },
    nivelEm(n) { let h = 0; dirs.forEach((d, i) => { if (i < fontes.length) { const x = n.dot(d); h += (amps[i] || 0) * (3 * x * x - 1) * 0.5; } }); return h; },
    amplitudeMax() { return Math.max(1e-6, ...amps.slice(0, fontes.length).map(Math.abs)); },
    registro() { const A = Math.max(0, ...amps); return [grupo.position, raio * (1 + A)]; },
  };
}

// ---------- pino na superfície de um planeta que gira ----------
function pino(c) {
  const { sp } = c;
  const grupo = new THREE.Group();
  const cor = new THREE.Color(sp.cor || '#FF5E4D'), corAlta = new THREE.Color(sp.cor_alta || '#FFF0A0');
  const mat = new THREE.MeshBasicMaterial({ color: cor });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 20), mat);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), mat);
  const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ color: cor, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0, map: c.halo }));
  cone.renderOrder = bola.renderOrder = 7; brilho.renderOrder = 8;
  grupo.add(cone, bola, brilho);
  const Y = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  let pos = new THREE.Vector3(), nivel = 0;
  return {
    grupo,
    atualizar(f) {
      const em = sp.em, centro = f.ponto(em, f.t, `objeto ${c.nome}, "em"`), R = f.raioDe(em, f.t);
      const ang = f.anguloDe(em, f.t);
      const lat = THREE.MathUtils.degToRad(sp.lat ?? 0), lon = THREE.MathUtils.degToRad(sp.lon ?? 0) + ang;
      const n = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
      pos = centro.clone().addScaledVector(n, R);
      if (sp.oceano && f.OBJ[sp.oceano] && f.OBJ[sp.oceano].obj && f.OBJ[sp.oceano].grupo.visible) pos = centro.clone().addScaledVector(n, f.OBJ[sp.oceano].obj.raioEm(n)); // a praia fica na superfície da água
      // sob um bojo (maré alta) o pino acende e cresce; no vale, fica apagado
      let k = 0.35;
      if (sp.oceano && f.OBJ[sp.oceano] && f.OBJ[sp.oceano].obj) {
        const oc = f.OBJ[sp.oceano].obj;
        const A = oc.amplitudeMax();
        nivel = oc.nivelEm(n) / A; // 1 sob o bojo, -0,5 a 90°
        k = clamp((nivel + 0.5) / 1.5);
      }
      const tam = (sp.tamanho ?? 0.1) * (0.85 + 0.55 * k) * Math.min(1, f.pr);
      q.setFromUnitVectors(Y, n);
      cone.quaternion.copy(q); cone.scale.set(tam * 0.9, tam * 2.2, tam * 0.9);
      cone.position.copy(pos).addScaledVector(n, tam * 1.1);
      bola.scale.setScalar(tam); bola.position.copy(pos).addScaledVector(n, tam * 2.6);
      mat.color.copy(cor).lerp(corAlta, k);
      brilho.position.copy(bola.position); brilho.scale.setScalar(tam * (3 + 6 * k)); brilho.material.color.copy(mat.color); brilho.material.opacity = 0.15 + 0.7 * k * k;
    },
    nivel() { return nivel; },
    registro() { return [pos, (sp.tamanho ?? 0.1) * 2]; },
  };
}

// ---------- gráfico (a curva da maré do dia) ----------
function grafico(c) {
  const { sp } = c;
  const w = sp.largura ?? 2.2, h = sp.altura ?? 0.9, ciclos = sp.ciclos ?? 2, fase = THREE.MathUtils.degToRad(sp.fase ?? 0);
  const grupo = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 120; i++) { const x = i / 120; pts.push(new THREE.Vector3((x - 0.5) * w, (Math.cos(2 * Math.PI * ciclos * x + fase) * h) / 2, 0)); }
  const curva = linhaGorda(pts, { cor: sp.cor || '#7FE8FF', largura: sp.espessura ?? 3.2, opacidade: 0.95, W: c.W, H: c.H });
  const base = linhaGorda([new THREE.Vector3(-w / 2, 0, 0), new THREE.Vector3(w / 2, 0, 0)], { cor: '#B9B3E8', largura: 1.4, opacidade: 0.4, tracejada: true, traco: 0.05, espaco: 0.05, W: c.W, H: c.H });
  const ponto = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.halo, color: new THREE.Color(sp.cor_ponto || '#FFF0A0'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  ponto.renderOrder = 9;
  grupo.add(base, curva, ponto);
  const lista = c.lista(sp.ponto || [], `objeto ${c.nome}, ponto`);
  return {
    grupo,
    atualizar(f) {
      grupo.position.copy(f.p); grupo.scale.setScalar(f.esc);
      const x = f.porTrechos(lista, f.t, sp.ponto_inicial ?? 0);
      ponto.position.set((x - 0.5) * w, (Math.cos(2 * Math.PI * ciclos * x + fase) * h) / 2, 0);
      ponto.scale.setScalar(0.22);
      curva.material.opacity = 0.95 * Math.min(1, f.pr); ponto.material.opacity = Math.min(1, f.pr);
    },
    depoisCamera(cam) { grupo.quaternion.copy(cam.quaternion); },   // de frente para a câmera, já com a câmera deste quadro
    registro() { return [grupo.position, w / 2]; },
  };
}

// ---------- praia (o chão onde a pessoa vive) ----------
// Coordenadas locais: o mar está em -z (longe da câmera que olha para -z), a areia sobe para +z. A régua de maré fica dentro d'água.
function praia(c) {
  const { sp } = c;
  const incl = sp.inclinacao ?? 0.1, planalto = sp.planalto ?? 12;
  const sandY = (z) => incl * Math.min(z, planalto);
  const grupo = new THREE.Group();
  const amb = sp.ambiente ?? 0.22;
  const comuns = { uLampPos: { value: new THREE.Vector3() }, uLampK: { value: sp.lampada === false ? 0 : (sp.lampada ?? 1) }, uOrigem: { value: new THREE.Vector3() }, uLevel: { value: 0 }, uLuar: { value: 1 }, uLuaDir: { value: new THREE.Vector3(0, 0.5, -1).normalize() }, uAmb: { value: amb }, uTime: { value: 0 } };

  // areia
  const ag = new THREE.PlaneGeometry(260, 80, 130, 80); ag.rotateX(-Math.PI / 2); ag.translate(0, 0, -22);
  { const p = ag.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, sandY(p.getZ(i))); ag.computeVertexNormals(); }
  const areia = new THREE.Mesh(ag, new THREE.ShaderMaterial({
    uniforms: { ...comuns, uIncl: { value: incl }, uPlan: { value: planalto } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vW; uniform float uLevel,uLuar,uAmb,uIncl,uPlan,uLampK; uniform vec3 uLuaDir,uOrigem,uLampPos;
${RUIDO}
void main(){
  vec3 p=vW; float n=fbm(vec3(p.x*0.5,0.0,p.z*0.5)); float g=vn(vec3(p.x*9.0,0.0,p.z*9.0));
  vec3 areia=mix(vec3(0.62,0.52,0.36),vec3(0.82,0.72,0.52),n)*(0.9+0.2*g);
  float umido=smoothstep(uLevel+0.16,uLevel-0.02,p.y);           // areia molhada, mais escura, logo acima da água
  areia=mix(areia,areia*vec3(0.55,0.5,0.5),umido);
  vec3 nn=normalize(vec3(0.0,1.0,-uIncl*step(p.z-uOrigem.z,uPlan)));
  float lamb=max(dot(nn,uLuaDir),0.0)*uLuar;
  float dl=distance(p,uLampPos); float lamp=uLampK*exp(-dl*dl/28.0);   // a lâmpada da régua: uma poça pequena de luz quente em volta
  vec3 col=areia*(uAmb+1.05*lamb)+areia*vec3(1.0,0.78,0.45)*lamp*0.5;
  gl_FragColor=vec4(col,1.0);
}`,
  }));
  areia.renderOrder = 0;

  // mar
  const mg = new THREE.PlaneGeometry(320, 560, 120, 220); mg.rotateX(-Math.PI / 2); mg.translate(0, 0, -(280 - 18));
  const agua = new THREE.Mesh(mg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { ...comuns, uAmp: { value: sp.ondas ?? 1 }, uIncl: { value: incl }, uPlan: { value: planalto } },
    vertexShader: /* glsl */ `
uniform float uLevel,uTime,uAmp; varying vec3 vW; varying vec3 vL;
float onda(vec2 q,float t){ return 0.06*sin(1.3*q.y+0.18*q.x-1.7*t)+0.035*sin(2.4*q.y-0.27*q.x-2.3*t)+0.05*sin(0.7*q.y+0.05*q.x-0.9*t); }
void main(){
  vec4 w=modelMatrix*vec4(position,1.0);
  float near=1.0-smoothstep(120.0,260.0,distance(w.xz,cameraPosition.xz));
  w.y=uLevel+uAmp*onda(w.xz,uTime)*mix(0.4,1.0,near);
  vW=w.xyz; vL=position; gl_Position=projectionMatrix*viewMatrix*w;
}`,
    fragmentShader: /* glsl */ `
precision highp float;
varying vec3 vW; varying vec3 vL; uniform float uLevel,uTime,uAmp,uLuar,uAmb,uIncl,uPlan,uLampK; uniform vec3 uLuaDir,uOrigem,uLampPos;
${RUIDO}
float onda(vec2 q,float t){ return 0.06*sin(1.3*q.y+0.18*q.x-1.7*t)+0.035*sin(2.4*q.y-0.27*q.x-2.3*t)+0.05*sin(0.7*q.y+0.05*q.x-0.9*t); }
void main(){
  vec2 q=vW.xz; float e=0.05;
  float h0=onda(q,uTime);
  float dx=(onda(q+vec2(e,0.0),uTime)-h0)/e, dz=(onda(q+vec2(0.0,e),uTime)-h0)/e;
  float dist=distance(vW,cameraPosition);
  float nf=1.0-smoothstep(25.0,200.0,dist);                    // longe, as ondas viram um brilho suave (sem listras)
  vec3 N=normalize(vec3(-dx*uAmp*1.6*nf,1.0,-dz*uAmp*1.6*nf));
  vec3 V=normalize(cameraPosition-vW);
  float prof=uLevel-(uOrigem.y+uIncl*min(vW.z-uOrigem.z,uPlan));
  vec3 fundo=vec3(0.015,0.05,0.16), raso=vec3(0.05,0.42,0.52);
  vec3 col=mix(raso,fundo,smoothstep(0.0,2.2,prof));
  float luz=uAmb+0.9*uLuar;
  col*=0.35+0.8*luz;
  vec3 H=normalize(uLuaDir+V);
  float glint=pow(max(dot(N,H),0.0),260.0)*uLuar*5.0;       // o caminho brilhante da Lua no mar
  float brilho=pow(max(dot(N,H),0.0),22.0)*uLuar*0.28+pow(max(dot(N,H),0.0),4.0)*uLuar*0.05;
  float fres=pow(1.0-max(dot(N,V),0.0),4.0);
  col+=vec3(0.7,0.85,1.0)*(glint+brilho)+vec3(0.03,0.07,0.16)*fres*(0.4+luz);
  float dl=distance(vW,uLampPos); float lamp=uLampK*exp(-dl*dl/22.0);
  vec3 Lh=normalize(normalize(uLampPos-vW)+V); float lampGlint=pow(max(dot(N,Lh),0.0),220.0)*uLampK*exp(-dl*dl/260.0);
  col+=vec3(1.0,0.78,0.45)*(lamp*0.14+lampGlint*0.9);                    // luz quente da lâmpada na água perto da régua
  float ruido=vn(vec3(vW.x*2.5,uTime*0.6,vW.z*2.5));
  float espuma=(1.0-smoothstep(0.0,0.10+0.06*ruido,prof))*step(-0.05,prof);
  col=mix(col,vec3(0.92,0.96,1.0)*(0.25+0.8*luz),clamp(espuma,0.0,1.0)*0.9);
  float crista=smoothstep(0.085,0.125,h0*uAmp)*(0.5+0.5*vn(vec3(vW.x*1.7,uTime*0.5,vW.z*1.7)))*nf;   // espuma nas cristas das ondas
  col=mix(col,vec3(0.85,0.93,1.0)*(0.2+0.8*luz),clamp(crista,0.0,1.0)*0.6);
  float alfa=mix(0.5,0.96,smoothstep(0.0,0.5,prof));
  float fog=smoothstep(60.0,430.0,dist);
  col=mix(col,vec3(0.02,0.055,0.14)*(0.35+1.3*luz),fog);   // o horizonte tem a cor do céu
  gl_FragColor=vec4(col,mix(alfa,1.0,fog));
}`,
  }));
  agua.renderOrder = 2;
  // céu da praia: o horizonte clareia com o luar e o resto fica quase preto (só visível perto da praia)
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: comuns,
    vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0); }',
    fragmentShader: /* glsl */ `
precision highp float; varying vec3 vD; uniform float uLuar,uAmb; uniform vec3 uLuaDir;
void main(){
  vec3 d=normalize(vD); float el=max(d.y,0.0);
  vec3 hor=vec3(0.015,0.04,0.10)*(0.3+0.9*(uAmb+uLuar)); vec3 topo=vec3(0.0,0.004,0.016);
  vec3 col=mix(hor,topo,smoothstep(0.0,0.5,el));
  float m=max(dot(d,uLuaDir),0.0)*step(0.0,uLuar);
  col+=vec3(0.22,0.32,0.55)*pow(m,90.0)*uLuar*0.9+vec3(0.08,0.14,0.30)*pow(m,7.0)*uLuar*0.35;
  gl_FragColor=vec4(col,1.0);
}`,
  }));
  ceu.renderOrder = -100; ceu.frustumCulled = false;
  agua.frustumCulled = false; areia.frustumCulled = false;

  // régua de maré
  const reg = sp.regua || { x: 2, z: -7, altura: 5 };
  const base = sandY(reg.z) - 0.6, alt = reg.altura ?? 5;
  const tex = (() => { const cv = document.createElement('canvas'); cv.width = 16; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#ECE6D2'; g.fillRect(0, 0, 16, 32); g.fillStyle = '#2B3F78'; g.fillRect(0, 32, 16, 32); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, alt / 0.5); t.magFilter = THREE.NearestFilter; return t; })();
  const poste = new THREE.Mesh(new THREE.BoxGeometry(0.28, alt, 0.28), new THREE.MeshBasicMaterial({ map: tex }));
  poste.position.set(reg.x, base + alt / 2, reg.z);
  const luzPoste = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1, 1, 1) });
  poste.material = luzPoste;
  poste.renderOrder = 1;
  const lampBrilho = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.halo, color: new THREE.Color('#FFC878'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
  lampBrilho.position.set(reg.x, base + alt + 0.2, reg.z); lampBrilho.scale.setScalar(1.6); lampBrilho.renderOrder = 9;
  grupo.add(ceu, areia, agua, poste, lampBrilho);

  // marcas de nível (a maré mais alta e a mais baixa): barras brilhantes na régua
  const marcas = (sp.marcas || []).map((m, k) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.045, 0.045), new THREE.MeshBasicMaterial({ color: new THREE.Color(m.cor || '#7FE8FF'), transparent: true, depthWrite: false }));
    mesh.position.set(reg.x, m.nivel, reg.z); mesh.renderOrder = 8;
    const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: c.halo, color: new THREE.Color(m.cor || '#7FE8FF'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    lamp.position.set(reg.x + 0.75, m.nivel, reg.z); lamp.scale.setScalar(0.5); lamp.renderOrder = 9;
    grupo.add(mesh, lamp);
    return { mesh, lamp, t0: c.tempo(m.aparece, `objeto ${c.nome}, marcas ${k + 1}`) ?? -1, t1: m.some != null ? c.tempo(m.some, `objeto ${c.nome}, marcas ${k + 1}`) : null };
  });

  const nivelLista = c.lista(sp.nivel || [], `objeto ${c.nome}, nivel`);
  let nivel = sp.nivel_inicial ?? 0, perto = false;
  return {
    grupo,
    atualizar(f) {
      grupo.position.copy(f.p);
      perto = f.camera.position.distanceTo(f.p) < 500;
      ceu.visible = perto;   // o céu da praia só existe perto dela (no espaço seria um fundo errado)
      nivel = f.porTrechos(nivelLista, f.t, sp.nivel_inicial ?? 0);
      let luar = 1, dir = comuns.uLuaDir.value;
      if (sp.luar) {
        const pm = f.ponto(sp.luar, f.t, `objeto ${c.nome}, "luar"`).sub(f.p);
        dir.copy(pm).normalize();
        luar = f.presenca(sp.luar, f.t) * smooth(dir.y, -0.02, 0.18) * (sp.luar_forca ?? 1);
      }
      comuns.uLampPos.value.set(reg.x, base + alt, reg.z).add(f.p); lampBrilho.visible = comuns.uLampK.value > 0.01; lampBrilho.material.opacity = 0.8 * Math.min(1, comuns.uLampK.value);
      comuns.uOrigem.value.copy(f.p); comuns.uLevel.value = nivel + f.p.y; comuns.uTime.value = f.t; comuns.uLuar.value = Math.min(1.2, luar);
      for (const m of marcas) { const a = suave(entre(f.t, m.t0, m.t0 + 0.4)) * (m.t1 == null ? 1 : 1 - suave(entre(f.t, m.t1, m.t1 + 0.3))); m.mesh.visible = m.lamp.visible = a > 0.01; m.mesh.material.opacity = a; m.lamp.material.opacity = 0.7 * a; }
      const k = clamp(0.35 + 0.9 * (luar + amb));
      luzPoste.color.setRGB(k, k, k);
    },
    // a praia cerca a câmera: com a câmera perto dela, "praia" conta como vista em qualquer ângulo (inclusive olhando para o céu)
    registro() { return perto ? [null, 0] : [grupo.position, 1]; },
    nivelAtual() { return nivel; },
  };
}
const smooth = (x, a, b) => suave(clamp((x - a) / (b - a)));

export const FABRICAS = { seta, luz, bola, campo, oceano, pino, grafico, praia };
export const TIPOS_DIDATICOS = Object.keys(FABRICAS);
