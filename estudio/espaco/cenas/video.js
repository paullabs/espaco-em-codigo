// CENA GENÉRICA DO KIT: o vídeo inteiro sai de um PLANO (projetos/<nome>/plano.json) e dos tempos da fala
// (projetos/<nome>/linhas.json, feito por ferramentas/voz_guia.mjs ou voz_final.mjs). Para um vídeo novo ninguém
// escreve cena: escreve o plano (objetos, planos de câmera e efeitos) e cada tempo se prende a uma fala.
//   node render.mjs --cena video --projeto exemplo_lua --t 2,6 --saida "projetos/exemplo_lua/saida/q_{t}.png" --w 1080 --h 1920
// O formato do plano está em projetos/LEIA_O_PLANO.md. Mesmas regras do estúdio: um mundo só, câmera de cinema,
// legenda de UMA palavra por vez (a própria fala), espaço preto, e a análise quadro a quadro (window.__ana)
// que a conferência (ferramentas/conferir_video.mjs) usa para saber se cada frase mostrou o que disse.
import * as THREE from 'three';
import { CURVAS, fovDeMm } from '../camera.js';
import { criarEstrelas, texturaHalo, criarPoeiraEspacial, criarNebulosa } from '../fundo.js';
import { estiloDaUrl } from '../estilos.js';
import { linhaGorda, circulo, marcador } from '../linhas.js';
import { criarCorpo } from '../corpos.js';
import { DADOS } from '../dados.js';
import { criarExplosao, PALETA_AZUL, PALETA_FOGO_FORTE } from '../explosao.js';
import { RUIDO } from '../glsl.js';
import { criarCorte, CAMADAS_SOL, CAMADAS_TERRA, CAMADAS_LUA } from '../corte.js';
import { criarBuraco } from '../buraco.js';
import { FABRICAS } from '../objetos.js';

const ST = estiloDaUrl();
const PROJ = new URLSearchParams(location.search).get('projeto');
if (!PROJ) throw new Error('falta o projeto: node render.mjs --cena video --projeto <nome> (a pasta é estudio/espaco/projetos/<nome>)');
const BASE = `/projetos/${PROJ}/`;
async function lerJson(arq) {
  const r = await fetch(BASE + arq);
  if (!r.ok) throw new Error(`não achei projetos/${PROJ}/${arq}` + (arq.startsWith('linhas') ? ' (rode antes: npm run video -- voz ' + PROJ + ')' : ''));
  try { return JSON.parse(await r.text()); } catch (e) { throw new Error(`projetos/${PROJ}/${arq} não é um JSON válido: ${e.message}`); }
}
const PLANO = await lerJson('plano.json');
const LIN = await lerJson(PLANO.falas || 'linhas.json');
const EXTRA = PLANO.extra ? await import(BASE + PLANO.extra) : null;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const costas = (x, s = 2.4) => { const u = clamp(x) - 1; return 1 + (s + 1) * u * u * u + s * u * u; }; // pop com ressalto
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, e) => a + (b - a) * e;
const V3 = (a) => new THREE.Vector3().fromArray(a);
const curva = (nome) => (nome === 'linear' ? (x) => clamp(x) : CURVAS[nome || 'suave'] || CURVAS.suave); // 'linear': velocidade constante, do começo ao fim

// ---------- tempos presos às falas ----------
// Um tempo pode ser um número (segundos) ou uma âncora na fala:
//   "A1"  começo da fala A1       "A1.fim"  fim dela          "A1.2"  começo do 2º pedaço   "A1.2.fim"  fim dele
//   "A1:lua"  quando começa a palavra que começa por "lua" (sem acento, sem maiúscula)   "A1:lua.fim"  quando ela acaba
//   "fim"  fim da fala inteira    qualquer um + ou - segundos: "A1:lua-0.4", "A2.fim+0.3"
const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const LP = {};
LIN.linhas.forEach((l) => (LP[l.id] = l));
const FIM_FALA = Math.max(...LIN.linhas.map((l) => l.t1));
// pedaços sem tempo por palavra (linhas antigas): divide o pedaço pelas letras
for (const l of LIN.linhas) for (const p of l.pedacos) {
  if (p.palavras && p.palavras.length) continue;
  const ws = p.texto.split(/\s+/).filter(Boolean); const pesos = ws.map((w) => w.length + 1); const tot = pesos.reduce((a, b) => a + b, 0);
  let a = p.t0; p.palavras = ws.map((w, i) => { const e = a + ((p.t1 - p.t0) * pesos[i]) / tot; const r = { t: w, t0: +a.toFixed(3), t1: +e.toFixed(3) }; a = e; return r; });
}
const AVISADAS = new Set();
function tempo(x, onde = 'tempo') {
  if (x === undefined || x === null || x === '') return null;
  if (typeof x === 'number') return x;
  let s = String(x).trim(), off = 0;
  const m = s.match(/^(.+?)\s*([+-])\s*(\d+(?:[.,]\d+)?)$/);
  if (m && !/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) { s = m[1]; off = (m[2] === '-' ? -1 : 1) * parseFloat(m[3].replace(',', '.')); }
  if (/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return parseFloat(s.replace(',', '.')) + off;
  if (s === 'inicio') return off;
  if (s === 'fim') return FIM_FALA + off;
  let fim = false;
  if (s.endsWith('.fim')) { fim = true; s = s.slice(0, -4); }
  const [idp, pal] = s.split(':');
  const [id, np] = idp.split('.');
  const l = LP[id];
  if (!l) throw new Error(`${onde}: a fala "${id}" não existe (falas: ${Object.keys(LP).join(', ')})`);
  if (pal) {
    // "A1:lua" procura na fala inteira; "A1.2:lua" só no 2º pedaço. Vale a PRIMEIRA palavra que começa assim (sem acento)
    const alvo = semAcento(pal).replace(/[^a-z0-9]/g, '');
    const peds = np ? [l.pedacos[+np - 1]] : l.pedacos;
    if (np && !peds[0]) throw new Error(`${onde}: a fala ${id} não tem o pedaço ${np} (tem ${l.pedacos.length})`);
    const achadas = peds.flatMap((p) => p.palavras).filter((w) => semAcento(w.t).replace(/[^a-z0-9]/g, '').startsWith(alvo));
    if (!achadas.length) throw new Error(`${onde}: a palavra "${pal}" não está na fala ${id}${np ? ', pedaço ' + np : ''} ("${l.texto}")`);
    if (achadas.length > 1 && !AVISADAS.has(onde + x)) { AVISADAS.add(onde + x); console.warn(`${onde}: "${x}" casa com ${achadas.length} palavras (${achadas.map((w) => w.t).join(', ')}); vale a primeira. Use uma palavra única ou o pedaço (${id}.N:${pal})`); }
    const w = achadas[0];
    return (fim ? w.t1 : w.t0) + off;
  }
  if (np) {
    const p = l.pedacos[+np - 1];
    if (!p) throw new Error(`${onde}: a fala ${id} não tem o pedaço ${np} (tem ${l.pedacos.length})`);
    return (fim ? p.t1 : p.t0) + off;
  }
  return (fim ? l.t1 : l.t0) + off;
}
// lista de trechos com tempo preso à fala: [{ de, ate, para, curva }] -> [{ t0, t1, para, curva }] em ordem
const lista = (arr, onde = 'lista') => (arr || []).map((m, k) => ({ ...m, t0: tempo(m.de, `${onde} ${k + 1}, "de"`), t1: tempo(m.ate, `${onde} ${k + 1}, "ate"`) })).sort((a, b) => a.t0 - b.t0);
const DUR = PLANO.duracao != null ? tempo(PLANO.duracao, 'duracao') : FIM_FALA + (PLANO.cauda ?? 1.7);

// legenda: a própria fala, UMA palavra por vez; *palavra* sai em dourado
const ouroFlags = (bruto) => { const out = []; bruto.split(/(\*[^*]+\*)/).filter(Boolean).forEach((seg) => { const gold = seg.startsWith('*'); seg.replace(/\*/g, '').split(' ').filter(Boolean).forEach((w) => out.push({ w, gold })); }); const res = []; out.forEach((o) => { if (/^[,.:?!;]+$/.test(o.w) && res.length) res[res.length - 1].w += o.w; else res.push({ ...o }); }); return res; };
const PAL = [];
for (const l of LIN.linhas) for (const p of l.pedacos) { const fl = ouroFlags(p.bruto || p.texto); p.palavras.forEach((w, i) => { const q = fl[i]; PAL.push({ t: (q ? q.w : w.t).replace(/[,.:;]+$/, ''), ouro: !!(q && q.gold), t0: w.t0, t1: w.t1 }); }); }
const palavraEm = (t) => { let k = -1; for (let i = 0; i < PAL.length && PAL[i].t0 - 0.02 <= t; i++) k = i; if (k < 0) return null; const w = PAL[k], nx = PAL[k + 1]; const segue = !!nx && nx.t0 - w.t1 < 0.32; if (!segue && t >= w.t1 + 0.24) return null; return { w, u: t - w.t0 + 0.02, sai: segue ? 0 : suave(entre(t, w.t1 + 0.1, w.t1 + 0.24)) }; };

// ---------- planos de câmera: cada um começa numa âncora e vai até o próximo ----------
const PLANOS = (PLANO.planos || []).map((s, i) => ({ ...s, id: s.id || 'p' + String(i + 1).padStart(2, '0'), t0: tempo(s.de, `plano ${s.id || i + 1}, "de"`) }));
if (!PLANOS.length) throw new Error('o plano não tem nenhum plano de câmera ("planos")');
PLANOS.sort((a, b) => a.t0 - b.t0);
PLANOS.forEach((s, i) => { s.t1 = s.ate != null ? tempo(s.ate, `plano ${s.id}, "ate"`) : (PLANOS[i + 1] ? PLANOS[i + 1].t0 : DUR); if (!(s.t1 > s.t0)) throw new Error(`plano ${s.id}: termina (${s.t1?.toFixed(2)} s) antes de começar (${s.t0.toFixed(2)} s)`); });
PLANOS[0].t0 = Math.min(PLANOS[0].t0, 0);
PLANOS[PLANOS.length - 1].t1 = Math.max(PLANOS[PLANOS.length - 1].t1, DUR);
const planoEm = (t) => PLANOS.find((x) => t < x.t1) || PLANOS[PLANOS.length - 1];

export function montar({ scene, camera, ui, comp, W, H }) {
  const vertical = H > W;
  const root = document.getElementById('quadro');
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // ---------- fundo: espaço preto, estrelas em camadas, poeira de profundidade ----------
  const ceu1 = criarEstrelas({ n: 2300, raio: 220, semente: 61, tamanho: (H / 1080) * 0.8 });
  const ceu2 = criarEstrelas({ n: 380, raio: 90, semente: 63, tamanho: (H / 1080) * 1.35 });
  scene.add(ceu1, ceu2);
  if (ST.nebulosa) scene.add(criarNebulosa({ semente: 3.0 }));
  const poeiraEsp = criarPoeiraEspacial({ n: 520, caixa: 14, H, opacidade: ST.poeira }); scene.add(poeiraEsp);
  if (PLANO.poeira === false) poeiraEsp.visible = false;
  const halo = texturaHalo([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.75)'], [0.55, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']], 128);
  const anelTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 0], [0.68, 0], [0.8, 1], [0.9, 0.35], [1, 0]].forEach(([o, a]) => r.addColorStop(o, `rgba(255,255,255,${a})`)); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const glow = (cor, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(cor), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(s); return sp; };
  const cascaMat = (cor, op, ex) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCor: { value: new THREE.Color(cor) }, uA: { value: op }, uEx: { value: ex }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vO; void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `precision highp float; uniform vec3 uCor; uniform float uA,uEx,uTime; varying vec3 vN; varying vec3 vV; varying vec3 vO; ${RUIDO}
      void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uEx); float n=fbm(normalize(vO)*5.0+vec3(0.0,uTime*0.3,0.0)); float a=(0.18+f)*(0.75+0.5*n)*uA; gl_FragColor=vec4(uCor*a,a); }` });

  // ---------- objetos do plano ----------
  const OBJ = {};
  const marcs = [];
  for (const [nome, sp] of Object.entries(PLANO.objetos || {})) {
    const o = { nome, sp, tipo: sp.tipo || (sp.corpo ? 'corpo' : 'brilho'), raio: sp.raio ?? 1 };
    // quando aparece: "aparece"/"some" (uma vez) ou "mostrar": [[de, ate], ...] (some e volta)
    o.janelas = sp.mostrar ? sp.mostrar.map((j, k) => [tempo(j[0], `objeto ${nome}, mostrar ${k + 1}`) ?? -1, tempo(j[1], `objeto ${nome}, mostrar ${k + 1}`)])
      : [[tempo(sp.aparece, `objeto ${nome}, "aparece"`) ?? -1, tempo(sp.some, `objeto ${nome}, "some"`)]];
    o.movs = (sp.movimentos || []).map((m, k) => ({ ...m, t0: tempo(m.de, `objeto ${nome}, movimento ${k + 1}`), t1: tempo(m.ate, `objeto ${nome}, movimento ${k + 1}`) })).sort((a, b) => a.t0 - b.t0);
    o.escs = (sp.escala || []).map((m, k) => ({ ...m, t0: tempo(m.de, `objeto ${nome}, escala ${k + 1}`), t1: tempo(m.ate, `objeto ${nome}, escala ${k + 1}`) })).sort((a, b) => a.t0 - b.t0);
    o.brilhos = (sp.brilho || []).map((m, k) => ({ ...m, t0: tempo(m.de, `objeto ${nome}, brilho ${k + 1}`), t1: tempo(m.ate, `objeto ${nome}, brilho ${k + 1}`) })).sort((a, b) => a.t0 - b.t0);
    o.giros = lista(sp.giro, `objeto ${nome}, giro`);
    o.formas = (sp.esticar_ao_longo || []).map((m, k) => ({ ...m, t0: tempo(m.de, `objeto ${nome}, esticar ${k + 1}`), t1: tempo(m.ate, `objeto ${nome}, esticar ${k + 1}`) })).sort((a, b) => a.t0 - b.t0);
    if (o.tipo === 'corpo') {
      if (!DADOS[sp.corpo]) throw new Error(`objeto ${nome}: o corpo "${sp.corpo}" não existe (corpos: ${Object.keys(DADOS).join(', ')})`);
      o.estrela = DADOS[sp.corpo].tipo === 'estrela';
      o.c = criarCorpo(sp.corpo, { presenca: sp.presenca ?? true, risco: ST.risco, coroa: ST.coroa, halo: sp.halo ?? 4.5 });
      o.grupo = o.c.grupo; o.grupo.children[0].userData.ocl = true;
      if (sp.marcador) { o.marc = marcador(anelTex, sp.marcador === true ? (o.estrela ? '#ffd166' : '#8febe3') : sp.marcador, 26, H); scene.add(o.marc); marcs.push(o.marc); }
    } else if (o.tipo === 'casca') {
      o.grupo = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), cascaMat(sp.cor || '#7fe8ff', sp.opacidade ?? 0.55, sp.borda ?? 2.2));
    } else if (o.tipo === 'orbita') {
      const est = sp.destaque ? ST.orbita.terra : ST.orbita.outras;
      o.grupo = linhaGorda(circulo(1, 256), { cor: sp.cor || est.cor, largura: sp.largura || est.largura, opacidade: sp.opacidade ?? est.op, tracejada: !!sp.tracejada, W, H });
    } else if (o.tipo === 'linha') {
      o.grupo = linhaGorda([new THREE.Vector3(), new THREE.Vector3(0, 0.001, 0)], { cor: sp.cor || '#FFD166', largura: sp.largura || 2.6, opacidade: sp.opacidade ?? 0.85, tracejada: !!sp.tracejada, W, H });
      o.desenha = sp.desenha ? [tempo(sp.desenha[0], `objeto ${nome}, desenha`), tempo(sp.desenha[1], `objeto ${nome}, desenha`)] : null;
    } else if (o.tipo === 'brilho') {
      o.grupo = glow(sp.cor || '#ffe9c8', 1); o.grupo.material.opacity = sp.opacidade ?? 0.8;
    } else if (o.tipo === 'corte') {
      // a Terra, o Sol ou a Lua por dentro: um octante se abre e mostra as camadas; "destaque" acende uma camada por vez
      const camadas = { sol: CAMADAS_SOL, terra: CAMADAS_TERRA, lua: CAMADAS_LUA }[sp.modo || 'terra'];
      if (!camadas) throw new Error(`objeto ${nome}: o corte "${sp.modo}" não existe (sol, terra, lua)`);
      o.grupo = criarCorte({ modo: sp.modo || 'terra', camadas: camadas(), centro: V3(sp.pos || [0, 0, 0]), raio: 1 });
      o.grupo.userData.ocl = true;
      o.abre = sp.abre ? [tempo(sp.abre[0], `objeto ${nome}, abre`), tempo(sp.abre[1], `objeto ${nome}, abre`)] : null;
      o.fecha = sp.fecha ? [tempo(sp.fecha[0], `objeto ${nome}, fecha`), tempo(sp.fecha[1], `objeto ${nome}, fecha`)] : null;
      o.destaques = (sp.destaque || []).map((d, k) => ({ nome: d.nome, t0: tempo(d.de, `objeto ${nome}, destaque ${k + 1}`), t1: tempo(d.ate, `objeto ${nome}, destaque ${k + 1}`), camadas: Array.isArray(d.camadas) ? d.camadas : [d.camada ?? 0, d.camada ?? 0] }));
    } else if (o.tipo === 'buraco') {
      // buraco negro com a luz curvada de verdade (buraco.js): fica sempre no centro do mundo, o resto se arruma em volta
      if (sp.pos && sp.pos.some((v) => v !== 0)) throw new Error(`objeto ${nome}: o buraco negro fica sempre em [0, 0, 0]; mova os outros objetos em volta dele`);
      o.raio = sp.raio ?? 10.5;
      o.grupo = criarBuraco({ raioInterno: o.raio * 0.286, raioExterno: o.raio, passos: sp.passos ?? 360 });
    } else if (FABRICAS[o.tipo]) {
      // objetos didáticos (objetos.js): seta, campo, oceano, pino, grafico, praia
      o.obj = FABRICAS[o.tipo]({ nome, sp, W, H, tempo, lista, halo });
      o.grupo = o.obj.grupo;
    } else throw new Error(`objeto ${nome}: tipo "${o.tipo}" não existe (tipos: corpo, casca, orbita, linha, brilho, corte, buraco, ${Object.keys(FABRICAS).join(', ')})`);
    scene.add(o.grupo);
    OBJ[nome] = o;
  }

  // posição de um objeto (ou de um ponto [x,y,z]) no instante t; um objeto pode orbitar outro e seguir movimentos
  let memo = new Map();
  const pilha = new Set();
  function ponto(ref, t, onde) {
    if (Array.isArray(ref)) return V3(ref);
    if (typeof ref === 'string') {
      if (!OBJ[ref]) throw new Error(`${onde}: o objeto "${ref}" não existe (objetos: ${Object.keys(OBJ).join(', ')})`);
      return posDe(ref, t);
    }
    return new THREE.Vector3();
  }
  function posBase(o, t) {
    const sp = o.sp;
    if (sp.orbita) {
      const ob = sp.orbita, c = ponto(ob.em, t, `objeto ${o.nome}, órbita`);
      const a = 2 * Math.PI * ((ob.fase ?? 0) + t / (ob.periodo ?? 20)), inc = THREE.MathUtils.degToRad(ob.inclinacao ?? 0);
      return c.add(new THREE.Vector3(Math.cos(a) * ob.raio, -Math.sin(a) * ob.raio * Math.sin(inc), Math.sin(a) * ob.raio * Math.cos(inc)));
    }
    if (o.tipo === 'orbita' || ((o.tipo === 'casca' || o.tipo === 'brilho' || FABRICAS[o.tipo]) && sp.em)) return ponto(sp.em, t, `objeto ${o.nome}`).add(V3(sp.pos || [0, 0, 0]));
    return V3(sp.pos || [0, 0, 0]);
  }
  function posDe(nome, t) {
    const k = nome + '@' + t;
    if (memo.has(k)) return memo.get(k).clone();
    if (pilha.has(nome)) throw new Error(`o objeto ${nome} depende dele mesmo (órbita ou movimento em volta de si)`);
    pilha.add(nome);
    const o = OBJ[nome];
    let p = posBase(o, t);
    for (let i = o.movs.length - 1; i >= 0; i--) {
      const m = o.movs[i];
      if (t < m.t0) continue;
      const ini = i === 0 ? posBase(o, m.t0) : ponto(o.movs[i - 1].para, m.t0, `objeto ${nome}`);
      p = ini.lerp(ponto(m.para, t, `objeto ${nome}, movimento`), curva(m.curva)(entre(t, m.t0, m.t1)));
      break;
    }
    pilha.delete(nome);
    memo.set(k, p.clone());
    return p;
  }
  // valor que muda por trechos (escala, brilho): começa em 1 e vai para "para" em cada trecho
  const porTrechos = (lista, t, ini = 1) => { let v = ini; for (const m of lista) { if (t < m.t0) break; v = lerp(v, m.para, curva(m.curva)(entre(t, m.t0, m.t1))); } return v; };
  // ângulo de giro de um corpo (rad): "giro": [{ de, ate, para (graus), curva }] dá o ângulo exato; sem ele, gira na velocidade "girar"
  function anguloDe(nome, t) {
    const o = OBJ[nome]; if (!o) return 0;
    if (o.giros.length) return THREE.MathUtils.degToRad(porTrechos(o.giros, t, o.sp.giro_inicial ?? 0));
    return (o.sp.girar ?? (o.estrela ? 0.04 : 0.08)) * t;
  }
  const raioDe = (nome, t) => OBJ[nome].raio * porTrechos(OBJ[nome].escs, t) * Math.max(presenca(OBJ[nome], t), 0.0001);
  // quanto o objeto está presente: entra com pop, sai encolhendo (ou some de vez)
  function presenca(o, t) {
    let v = 0;
    for (const [ap, so] of o.janelas) {
      if (t < ap) continue;
      const ent = ap <= 0 || o.sp.entra === 'direto' ? 1 : o.sp.entra === 'cresce' ? suave(entre(t, ap, ap + 0.5)) : costas(entre(t, ap, ap + 0.4), 2.0);
      const k = so == null ? ent : o.sp.sai === 'direto' ? (t < so ? ent : 0) : ent * (1 - suave(entre(t, so, so + 0.35)));
      v = Math.max(v, k);
    }
    return v;
  }

  // ---------- efeitos (eventos) ----------
  const EVT = (PLANO.eventos || []).map((ev, k) => {
    const e = { ...ev, nome: ev.nome || ev.tipo, t0: tempo(ev.em, `evento ${k + 1} (${ev.tipo}), "em"`) };
    e.t1 = ev.ate != null ? tempo(ev.ate, `evento ${k + 1}, "ate"`) : null;
    if (e.tipo === 'explosao') {
      e.dur = ev.dur ?? 1.8;
      e.x = criarExplosao({ paleta: ev.cor === 'azul' ? PALETA_AZUL : PALETA_FOGO_FORTE, semente: 3 + k });
      scene.add(e.x.grupo);
      if (ev.alvo && ev.esconde !== false && OBJ[ev.alvo]) { const o = OBJ[ev.alvo]; o.janelas = o.janelas.map(([ap, so]) => (ap < e.t0 && (so == null || so > e.t0 + 0.1) ? [ap, e.t0 + 0.1] : [ap, so])); o.sp = { ...o.sp, sai: 'direto' }; }
    } else if (e.tipo === 'pulso') {
      e.t1 = e.t1 ?? e.t0 + 1.5;
      e.bola = glow(ev.cor || '#fff4d8', 1); scene.add(e.bola);
      e.rastro = linhaGorda([new THREE.Vector3(), new THREE.Vector3(0, 0.001, 0)], { cor: ev.cor || '#fff4d8', largura: 2.2, opacidade: 0.7, aditiva: true, W, H }); scene.add(e.rastro);
    } else if (e.tipo === 'onda') {
      e.dur = ev.dur ?? 1.6;
      e.m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), cascaMat(ev.cor || '#ffe2b8', 0.9, 3.0)); e.m.visible = false; scene.add(e.m);
    } else if (e.tipo === 'rebobinar') {
      e.t1 = e.t1 ?? e.t0 + 1.2;
    } else if (!['clarao', 'tremor', 'som'].includes(e.tipo)) throw new Error(`evento ${k + 1}: tipo "${e.tipo}" não existe (tipos: explosao, clarao, tremor, pulso, onda, rebobinar, som)`);
    return e;
  });
  const rew = document.createElement('div');
  rew.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none';
  const tri = (x) => `<div style="position:absolute;left:${x}px;top:${Math.round(0.15 * H)}px;width:0;height:0;border-top:${Math.round(0.03 * H)}px solid transparent;border-bottom:${Math.round(0.03 * H)}px solid transparent;border-right:${Math.round(0.05 * W)}px solid rgba(255,255,255,.92)"></div>`;
  rew.innerHTML = `<div data-lin style="position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.05) 0,rgba(255,255,255,.05) 2px,transparent 2px,transparent 7px)"></div><div data-ico style="position:absolute;inset:0;transform-origin:${Math.round(0.13 * W)}px ${Math.round(0.15 * H)}px">${tri(Math.round(0.08 * W))}${tri(Math.round(0.13 * W))}</div>`;
  root.insertBefore(rew, document.getElementById('texto'));
  const veu = document.createElement('div');
  veu.style.cssText = 'position:absolute;left:0;right:0;top:50%;bottom:0;pointer-events:none;opacity:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(2,1,12,.78) 34%,rgba(2,1,12,.9) 100%)';
  root.insertBefore(veu, document.getElementById('texto'));
  const rewIco = rew.querySelector('[data-ico]');

  // ---------- luz: do Sol (ou da estrela que o plano disser), da câmera, ou de uma direção fixa ----------
  const primeiraEstrela = Object.values(OBJ).find((o) => o.estrela);
  const luzPadrao = PLANO.luz ?? (primeiraEstrela ? { de: primeiraEstrela.nome } : 'camera');
  const setLuz = (grupo, v) => grupo.traverse((x) => { const u = x.material && x.material.uniforms; if (u) { if (u.uLuz && !u.uCob) u.uLuz.value.copy(v); if (u.uLight) u.uLight.value.copy(v); } });
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  function acender(s, t) {
    const regra = s.luz ?? luzPadrao;
    for (const o of Object.values(OBJ)) {
      const didatico = o.obj && o.obj.aceso;
      if (!(o.tipo === 'corpo' || (o.tipo === 'corte' && o.sp.modo !== 'sol') || didatico) || o.estrela || !o.grupo.visible) continue;
      let v;
      if (Array.isArray(regra)) v = V3(regra).normalize();
      else if (regra && regra.de) v = ponto(regra.de, t, 'luz').sub(o.grupo.position).normalize();
      else v = tA.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-0.55).addScaledVector(tB.setFromMatrixColumn(camera.matrixWorld, 1), 0.45).addScaledVector(tC.copy(camera.position).sub(o.grupo.position).normalize(), 0.75).normalize().clone();
      if (didatico) o.obj.aceso(v); else setLuz(o.grupo, v);
    }
  }

  // ---------- câmera: cada chave diz o alvo e de onde olhar (az, el, dist) ou a posição exata ----------
  const sph = (az, el, r) => { const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el); return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(r); };
  // raio do objeto para o enquadramento: NÃO depende de ele já ter aparecido (senão a câmera se aproxima demais enquanto o objeto entra e depois recua)
  function raioNoTempo(nome, t) { const o = OBJ[nome]; return o.raio * Math.max(porTrechos(o.escs, t), 0.0001); }
  function chave(k, s, t, onde) {
    const mm = k.mm ?? 35;
    let alvo, distAuto = null;
    // "em": os pontos [x, y, z] desta chave são medidos a partir desse objeto (a praia, por exemplo)
    const rel = (v) => (k.em && Array.isArray(v) ? V3(v).add(ponto(k.em, t, onde)) : ponto(v, t, onde));
    if (k.enquadrar && k.enquadrar.length) {
      // enquadrar: a esfera que contém esses objetos ocupa "ocupa" da altura do quadro (e cabe na largura)
      const cs = k.enquadrar.map((n) => ({ p: ponto(n, t, onde), r: raioNoTempo(n, t) * (OBJ[n].tipo === 'orbita' ? 1 : 1.08) }));
      const c = cs.reduce((a, x) => a.add(x.p), new THREE.Vector3()).multiplyScalar(1 / cs.length);
      const R = Math.max(...cs.map((x) => c.distanceTo(x.p) + x.r));
      alvo = k.alvo != null ? rel(k.alvo) : c;
      const tv = Math.tan(THREE.MathUtils.degToRad(fovDeMm(mm, vertical)) / 2), th = tv * (W / H);
      // so_altura: um grupo comprido na vertical (com "roll": 90, a Lua em cima da Terra) só precisa caber na altura; sem isso a esfera do grupo também limita pela largura
      distAuto = k.so_altura ? R / ((k.ocupa ?? 0.42) * tv) : Math.max(R / ((k.ocupa ?? 0.42) * tv), R / (0.82 * th)); // 0,42 da altura com o centro a 37%: sobra a faixa da legenda
    } else alvo = rel(k.alvo ?? s.heroi ?? [0, 0, 0]);
    return { alvo, mm, az: k.az ?? 0, el: k.el ?? 8, dist: k.dist ?? distAuto ?? 6, pos: k.pos ? rel(k.pos) : null, roll: k.roll ?? 0 };
  }
  const alvoV = new THREE.Vector3();
  let tremor = 0, ultimoAlvo = new THREE.Vector3();
  function aplicarCamera(s, t) {
    const cam = s.camera || {};
    const de = cam.de || cam, para = { ...de, ...(cam.para || {}) };
    const e = curva(cam.curva || s.curva)(entre(t, s.t0, s.t1));
    const a = chave(de, s, t, `plano ${s.id}, câmera "de"`), b = chave(para, s, t, `plano ${s.id}, câmera "para"`);
    const alvo = a.alvo.clone().lerp(b.alvo, e), mm = lerp(a.mm, b.mm, e);
    let C;
    if (!a.pos && !b.pos) C = alvo.clone().add(sph(lerp(a.az, b.az, e), lerp(a.el, b.el, e), lerp(a.dist, b.dist, e)));
    else { const ca = a.pos || a.alvo.clone().add(sph(a.az, a.el, a.dist)), cb = b.pos || b.alvo.clone().add(sph(b.az, b.el, b.dist)); C = ca.lerp(cb, e); }
    const dd = C.distanceTo(alvo) * 0.0014; // respiração mínima
    C.add(new THREE.Vector3(Math.sin(t * 0.9) * dd, Math.sin(t * 0.7 + 1.3) * dd, Math.sin(t * 0.5 + 2.1) * dd * 0.5));
    if (tremor > 0) { const k = tremor * C.distanceTo(alvo); C.add(new THREE.Vector3(Math.sin(t * 61) * k, Math.sin(t * 47 + 1) * k, Math.sin(t * 53 + 2) * k)); }
    camera.position.copy(C);
    const rl = THREE.MathUtils.degToRad(lerp(a.roll, b.roll, e)) + ST.camera.roll * Math.sin(t * 0.4 + 1.3);
    camera.up.set(Math.sin(rl), Math.cos(rl), 0);
    camera.fov = fovDeMm(mm, vertical); camera.near = 0.01; camera.far = 3000;
    const cx = (s.compo || {}).x ?? 0.46, cy = (s.compo || {}).y ?? 0.37; // herói acima da faixa da legenda (58% a 68%) e longe dos botões da direita
    camera.clearViewOffset(); camera.setViewOffset(W, H, (0.5 - cx) * W, (0.5 - cy) * H, W, H); camera.updateProjectionMatrix();
    camera.lookAt(alvoV.copy(alvo)); camera.updateMatrixWorld();
    ultimoAlvo = alvo;
    return { mm, alvo, cx, cy };
  }

  // ---------- análise quadro a quadro (a conferência lê isto) ----------
  const reg = {};
  const registrar = (nome, c, r, marcado = false, inteiro = false) => { reg[nome] = { c: c ? (c.isVector3 ? c.toArray() : c) : null, r, marcado, inteiro }; };
  const solidos = []; const ray = new THREE.Raycaster();
  function medir(c, r) {
    const centro = V3(c); const pr = centro.clone().project(camera); const atras = pr.z > 1;
    const x = (pr.x * 0.5 + 0.5) * W, y = (-pr.y * 0.5 + 0.5) * H;
    const dirD = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const e = centro.clone().addScaledVector(dirD, r).project(camera); const rpx = Math.hypot((e.x * 0.5 + 0.5) * W - x, (-e.y * 0.5 + 0.5) * H - y);
    const d = centro.clone().sub(camera.position); const dl = d.length(); ray.set(camera.position, d.normalize()); ray.far = dl;
    const tapado = ray.intersectObjects(solidos, false).some((h) => h.distance < dl - r * 1.35);
    const dentro = !atras && x > -rpx && x < W + rpx && y > -rpx && y < H + rpx;
    return { x, y, rpx, tapado, dentro, atras };
  }
  function analisar(s) {
    scene.updateMatrixWorld(true);
    solidos.length = 0; scene.traverse((o) => { if (o.userData.ocl && o.isMesh) { let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (v) solidos.push(o); } });
    const objs = {};
    const tela = {}; // onde cada objeto visível cai no quadro (fração da largura, da altura e raio/altura): a conferência compara planos seguidos
    for (const [nome, o] of Object.entries(reg)) { if (o.c === null) { objs[nome] = 1; continue; } const m = medir(o.c, o.r); objs[nome] = m.dentro && !m.tapado && (m.rpx >= 5 || o.marcado) ? 1 : 0; if (objs[nome] && m.rpx >= 5 && OBJ[nome] && !OBJ[nome].sp.fundo && ['corpo', 'corte', 'buraco', 'casca'].includes(OBJ[nome].tipo)) tela[nome] = [+(m.x / W).toFixed(3), +(m.y / H).toFixed(3), +(m.rpx / H).toFixed(3)]; }
    let hero = null;
    if (s.heroi && reg[s.heroi]) { const o = reg[s.heroi]; const m = medir(o.c, o.r); hero = { x: Math.round(m.x), y: Math.round(m.y), r: Math.round(m.rpx), visivel: m.tapado || !m.dentro ? 0 : 1, naJanela: m.x >= 0.04 * W && m.x <= 0.86 * W && m.y >= 0.12 * H && m.y <= 0.6 * H, grande: !s.macro && 2 * m.rpx > 0.85 * W, pequeno: 2 * m.rpx < 0.06 * H, macro: !!s.macro, cortado: !s.macro && (m.x - m.rpx < 0.03 * W || m.x + m.rpx > 0.88 * W || m.y - m.rpx < 0.06 * H) }; }
    const faixa = [];
    for (const [nome, o] of Object.entries(reg)) { if (o.c === null || !OBJ[nome] || OBJ[nome].sp.fundo || !['corpo', 'brilho', 'corte', 'buraco', 'oceano'].includes(OBJ[nome].tipo)) continue; const m = medir(o.c, o.r); if (m.dentro && m.rpx >= 18 && m.y + m.rpx > 0.575 * H && m.y - m.rpx < 0.685 * H && m.x + m.rpx > 0.06 * W && m.x - m.rpx < 0.86 * W) faixa.push(nome); }
    const cortados = [];
    if (!s.macro) for (const [nome, o] of Object.entries(reg)) { if (!o.inteiro || o.c === null) continue; const m = medir(o.c, o.r); if (m.dentro && !m.atras && (m.x - m.rpx < 0.03 * W || m.x + m.rpx > 0.88 * W || m.y - m.rpx < 0.06 * H || m.y + m.rpx > 0.62 * H)) cortados.push(nome); }
    const camColide = [];
    for (const o of Object.values(OBJ)) { if (!['corpo', 'corte'].includes(o.tipo) || !o.grupo.visible) continue; const d = camera.position.distanceTo(o.grupo.position), r = o.grupo.scale.x; if (d < r * 1.5) camColide.push(o.nome + ':' + (d / r).toFixed(2)); }
    window.__ana = { id: s.id, novo: s.novo || '', heroi: s.heroi || null, tela: [W, H], naTela: tela, veu: !!s.veu || s.faixa === false, hero, objs, faixa, cortados, camColide, cam: { p: camera.position.toArray().map((v) => +v.toFixed(3)), f: camera.getWorldDirection(new THREE.Vector3()).toArray().map((v) => +v.toFixed(4)), fov: +camera.fov.toFixed(2), dist: +camera.position.distanceTo(ultimoAlvo).toFixed(3) } };
  }
  const mini = document.createElement('canvas'); mini.width = 108; mini.height = 192; const mctx = mini.getContext('2d', { willReadFrequently: true });
  function aposRender(canvas) {
    if (!window.__ana) return;
    mctx.drawImage(canvas, 0, 0, W, H, 0, 0, 108, 192);
    const x0 = Math.round(0.06 * 108), x1 = Math.round(0.86 * 108), y0 = Math.round(0.575 * 192), y1 = Math.round(0.685 * 192);
    const d = mctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; let ocup = 0, lum = 0; const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]); lum += m; if (m > 88) ocup++; }
    window.__ana.banda = { ocup: +(ocup / n).toFixed(3), lum: +(lum / n / 255).toFixed(3) };
    if (extra && extra.aposRender) extra.aposRender(canvas);
  }
  const extra = EXTRA && EXTRA.montar ? EXTRA.montar({ THREE, scene, camera, ui, W, H, OBJ, tempo, posDe: (n, t) => posDe(n, t), registrar, PLANO, ST }) : null;

  // ---------- um quadro ----------
  function mundo(t) {
    memo = new Map();
    for (const o of Object.values(OBJ)) {
      const pr = presenca(o, t), sp = o.sp;
      o.grupo.visible = pr > 0.002;
      if (!o.grupo.visible) { if (o.marc) o.marc.visible = false; continue; }
      const p = posDe(o.nome, t), r = o.raio * porTrechos(o.escs, t) * pr;
      if (o.tipo === 'corpo') {
        o.grupo.position.copy(p); o.grupo.scale.setScalar(Math.max(r, 1e-4));
        if (sp.inclinar) o.grupo.rotation.set(0, THREE.MathUtils.degToRad(sp.inclinar_giro ?? 0), THREE.MathUtils.degToRad(sp.inclinar)); // inclina o eixo (e os anéis)
        o.c.atualizar(t, { spin: o.giros.length ? anguloDe(o.nome, t) / Math.max(t, 1e-3) : (sp.girar ?? (o.estrela ? 0.04 : 0.08)) });
        const br = porTrechos(o.brilhos, t), ud = o.grupo.userData;
        if (ud.material.uniforms.uBrilho) ud.material.uniforms.uBrilho.value = (DADOS[sp.corpo].brilho || 1) * br;
        if (o.brilhos.length) { const k = Math.min(1, br); if (ud.halo) ud.halo.material.opacity = k; if (ud.coroa) { ud.coroa.cA.material.opacity *= k; ud.coroa.cB.material.opacity *= k; } } // a estrela que apaga leva o halo e a coroa junto
      } else if (o.tipo === 'casca') {
        o.grupo.position.copy(p);
        const k = porTrechos(o.formas, t, sp.esticar ?? 1);
        o.grupo.scale.set(r * k, r, r); // esticar > 1 alonga no eixo de 'aponta'; < 1 achata num disco (água, anel de poeira)
        if (sp.aponta) { const d = ponto(sp.aponta, t, `objeto ${o.nome}, aponta`).sub(p); if (d.lengthSq() > 1e-9) o.grupo.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.normalize()); }
        o.grupo.material.uniforms.uTime.value = t; o.grupo.material.uniforms.uA.value = (sp.opacidade ?? 0.55) * Math.min(1, pr);
      } else if (o.tipo === 'orbita') {
        o.grupo.position.copy(p); o.grupo.scale.setScalar(sp.raio ?? 1); o.grupo.material.opacity = (sp.opacidade ?? (sp.destaque ? ST.orbita.terra.op : ST.orbita.outras.op)) * Math.min(1, pr);
        if (sp.inclinacao) o.grupo.rotation.x = THREE.MathUtils.degToRad(sp.inclinacao);
      } else if (o.tipo === 'linha') {
        const a = ponto(sp.de, t, `objeto ${o.nome}, "de"`), b = ponto(sp.para, t, `objeto ${o.nome}, "para"`);
        const k = o.desenha ? suave(entre(t, o.desenha[0], o.desenha[1])) : 1;
        o.grupo.userData.definir([a, a.clone().lerp(b, Math.max(0.001, k))]); o.grupo.material.opacity = (sp.opacidade ?? 0.85) * Math.min(1, pr);
      } else if (o.tipo === 'brilho') {
        o.grupo.position.copy(p); o.grupo.scale.setScalar(Math.max(r, 1e-4) * 2); o.grupo.material.opacity = (sp.opacidade ?? 0.8) * Math.min(1, pr) * porTrechos(o.brilhos, t);
      } else if (o.tipo === 'corte') {
        const u = o.grupo.material.uniforms;
        o.grupo.position.copy(p); u.uCenter.value.copy(p); o.grupo.userData.definirRaio(Math.max(r, 1e-4));
        u.uTime.value = t; o.grupo.userData.giro(t * (sp.girar ?? (sp.modo === 'sol' ? 0.05 : 0.07)));
        const aberto = (o.abre ? suave(entre(t, o.abre[0], o.abre[1])) : 0) * (o.fecha ? 1 - suave(entre(t, o.fecha[0], o.fecha[1])) : 1);
        u.uCutD.value = 0.62 * (1 - aberto);
        let f = 0, at = null;
        for (const d of o.destaques) { const a = suave(entre(t, d.t0, d.t0 + 0.4)) * (1 - suave(entre(t, d.t1 - 0.4, d.t1))); if (a > f) { f = a; at = d; } }
        u.uFocoF.value = at ? f : 0;
        if (at) { u.uFocoLo.value = at.camadas[0]; u.uFocoHi.value = at.camadas[1]; }
        o.aceso = at && f > 0.3 ? at : null; // a camada acesa conta como vista na conferência, com o nome do destaque
      } else if (o.tipo === 'buraco') {
        o.grupo.visible = pr > 0.5; o.grupo.material.uniforms.uTime.value = t;
      } else if (o.obj) {
        o.obj.atualizar({ t, p, r, esc: porTrechos(o.escs, t), pr, ponto, porTrechos, camera, OBJ, anguloDe, raioDe, presenca: (n, tt) => presenca(OBJ[n], tt) });
      }
    }
  }
  function efeitos(t) {
    let flash = 0, flashAlvo = null, flashCor = [1, 0.93, 0.8];
    tremor = 0;
    rew.style.display = 'none';
    for (const e of EVT) {
      const tx = t - e.t0;
      if (e.tipo === 'explosao') {
        const u = tx / e.dur;
        const lugar = e.alvo ? ponto(e.alvo, e.t0, 'explosão') : V3(e.pos || [0, 0, 0]);
        const raio = e.raio ?? (e.alvo && OBJ[e.alvo] ? OBJ[e.alvo].raio * 3 : 2);
        e.x.grupo.position.copy(lugar); e.x.atualizar(u, raio, tx); e.x.anel.quaternion.copy(camera.quaternion);
        if (u > 0 && u < 1) registrar(e.nome, lugar, raio * (0.4 + 0.6 * suave(entre(tx, 0, 0.9))), true);
        if (tx >= 0 && tx < 0.4) { const f = (e.clarao ?? 0.35) * (1 - suave(tx / 0.4)); if (f > flash) { flash = f; flashAlvo = lugar; flashCor = e.cor === 'azul' ? [0.8, 0.9, 1] : [1, 0.93, 0.8]; } }
        if (tx >= -1 && tx < 1.2) tremor = Math.max(tremor, (e.tremor ?? 0.02) * suave(entre(tx, -0.05, 0.05)) * (1 - suave(entre(tx, 0.1, 1.1))));
      } else if (e.tipo === 'clarao') {
        if (tx >= 0 && tx < (e.dur ?? 0.4)) { const f = (e.forca ?? 0.3) * (1 - suave(tx / (e.dur ?? 0.4))); if (f > flash) { flash = f; flashAlvo = e.alvo ? ponto(e.alvo, t, 'clarão') : null; flashCor = e.cor === 'azul' ? [0.8, 0.9, 1] : [1, 0.93, 0.8]; } }
      } else if (e.tipo === 'tremor') {
        const d = e.dur ?? 0.8; if (tx >= 0 && tx < d) tremor = Math.max(tremor, (e.forca ?? 0.02) * suave(entre(tx, 0, 0.08)) * (1 - suave(entre(tx, d * 0.3, d))));
      } else if (e.tipo === 'pulso') {
        const vis = t >= e.t0 && t < e.t1 + 0.25; e.bola.visible = e.rastro.visible = vis;
        if (vis) {
          const a = ponto(e.de, t, 'pulso'), b = ponto(e.para, t, 'pulso'), k = CURVAS.meio(entre(t, e.t0, e.t1));
          const p = a.clone().lerp(b, k); e.bola.position.copy(p); e.bola.scale.setScalar((e.tamanho ?? 0.35) * (1 + 0.1 * Math.sin(t * 20)));
          e.bola.material.opacity = 1 - suave(entre(t, e.t1, e.t1 + 0.25));
          e.rastro.userData.definir([a.clone().lerp(b, Math.max(0, k - 0.25)), p]); e.rastro.material.opacity = 0.7 * e.bola.material.opacity;
          registrar(e.nome, p, e.tamanho ?? 0.35, true);
        }
      } else if (e.tipo === 'onda') {
        const u = tx / e.dur; e.m.visible = u > 0 && u < 1;
        if (e.m.visible) { const lugar = e.alvo ? ponto(e.alvo, e.t0, 'onda') : V3(e.pos || [0, 0, 0]); const r = lerp(e.raio0 ?? 0.2, e.raio ?? 6, suave(u)); e.m.position.copy(lugar); e.m.scale.setScalar(r); e.m.material.uniforms.uA.value = 0.9 * (1 - suave(entre(u, 0.4, 1))); e.m.material.uniforms.uTime.value = t; registrar(e.nome, lugar, r, true); }
      } else if (e.tipo === 'rebobinar') {
        if (t >= e.t0 && t < e.t1) { rew.style.display = 'block'; const k = costas((t - e.t0) / 0.32, 2.6) * suave(clamp((e.t1 - t) / 0.25)); rewIco.style.opacity = clamp(k).toFixed(3); rewIco.style.transform = `translateX(${((1 - clamp(k)) * -0.07 * W).toFixed(1)}px) scale(${(0.72 + 0.28 * k).toFixed(3)})`; registrar(e.nome, null, 0); }
      }
    }
    return { flash, flashAlvo, flashCor };
  }

  return {
    duracao: DUR, aposRender,
    desenhar(t) {
      const tt = clamp(t, 0, DUR - 0.001);
      const s = planoEm(tt);
      for (const k of Object.keys(reg)) delete reg[k];
      mundo(tt);
      const fx = efeitos(tt);
      // borrão de movimento: a câmera de 1 quadro antes (no mesmo plano) dá o deslocamento de cada pixel
      let mb = null;
      const tp = tt - 1 / 24;
      if (s.borrao !== false && tp >= 0 && planoEm(tp).id === s.id) { aplicarCamera(s, tp); const prev = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); aplicarCamera(s, tt); const inv = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert(); mb = { invVP: inv, prevVP: prev, k: ST.camera.mb, max: 0.04 }; }
      const { mm, cx, cy } = aplicarCamera(s, tt);
      // o corte olha para a câmera (um pouco para cima e para a direita, como no estúdio) e o buraco negro segue a lente
      for (const o of Object.values(OBJ)) {
        if (!o.grupo.visible) continue;
        if (o.tipo === 'corte') { const v = camera.position.clone().sub(o.grupo.position); const az = THREE.MathUtils.radToDeg(Math.atan2(v.x, v.z)), el = THREE.MathUtils.radToDeg(Math.asin(clamp(v.y / (v.length() || 1), -1, 1))); o.grupo.userData.orientar(sph(az + 29, el + 24, 1), 0.14 * Math.sin(tt * 0.25)); }
        if (o.tipo === 'buraco') o.grupo.userData.sincronizar(camera, W, H, cx, cy);
      }
      [ceu1, ceu2].forEach((c) => { c.position.copy(camera.position); c.scale.setScalar((camera.far * 0.45) / 220); });
      poeiraEsp.material.uniforms.uT.value = tt;
      acender(s, tt);
      // registra os objetos para a conferência; os pequenos demais ganham um marcador
      for (const o of Object.values(OBJ)) {
        if (!o.grupo.visible) continue;
        let r = Math.max(o.grupo.scale.x, o.grupo.scale.y, o.grupo.scale.z);
        if (o.tipo === 'linha') { registrar(o.nome, null, 0); continue; }
        if (o.obj) { const rg = o.obj.registro && o.obj.registro(); if (rg) registrar(o.nome, rg[0], rg[1], true, !!o.sp.inteiro); continue; }
        if (o.tipo === 'orbita') r = o.sp.raio ?? 1;
        if (o.tipo === 'buraco') { registrar(o.nome, [0, 0, 0], o.raio * 0.75, true, !!o.sp.inteiro); continue; }
        let marcado = false;
        if (o.marc) { const m = medir(o.grupo.position.toArray(), r); o.marc.visible = m.dentro && m.rpx < 8; o.marc.position.copy(o.grupo.position); marcado = o.marc.visible; }
        registrar(o.nome, o.grupo.position.toArray(), r, marcado, !!o.sp.inteiro);
        if (o.tipo === 'corte' && o.aceso && o.aceso.nome) registrar(o.aceso.nome, o.grupo.position.toArray(), r, true); // mesmo raio do corte: com raio menor o próprio corte "taparia" a camada
      }
      marcs.forEach((m) => m.visible && m.userData.ajustar(camera));
      for (const o of Object.values(OBJ)) if (o.obj && o.obj.depoisCamera && o.grupo.visible) o.obj.depoisCamera(camera);   // o que fica de frente para a câmera (gráfico)
      veu.style.opacity = s.veu ? String(suave(entre(tt, s.t0, s.t0 + 0.3))) : '0';
      if (extra && extra.desenhar) extra.desenhar(tt, { plano: s, camera });
      // por último: a legenda, UMA palavra por vez, pequena e no centro, com pop
      ui.limpar();
      const pw = s.legenda === false ? null : palavraEm(tt);
      if (pw) {
        const pop = costas(pw.u / 0.2, ST.legenda.pop);
        ui.legendaPalavra({ texto: pw.w.t, ouro: pw.w.ouro, escala: (0.8 + 0.2 * pop) * (1 - 0.03 * pw.sai), alpha: clamp(pw.u / 0.07) * (1 - pw.sai), dy: 0.008 * H * (1 - suave(clamp(pw.u / 0.2))) - 0.004 * H * ST.legenda.deriva * suave(clamp((pw.u - 0.2) / 0.6)), y: s.leg ?? 0.64, estilo: ST.legenda });
      }
      if (s.heroi && reg[s.heroi] && reg[s.heroi].c) comp.registrar(V3(reg[s.heroi].c), reg[s.heroi].r, { heroi: true, macro: !!s.macro });
      analisar(s);
      let flashC = [0.5, 0.5];
      if (fx.flashAlvo) { const pr = fx.flashAlvo.clone().project(camera); flashC = [pr.x * 0.5 + 0.5, pr.y * 0.5 + 0.5]; }
      const lente = { mm, f: 8, flash: fx.flash, fade: 0, bloom: ST.pos.bloom + 0.25 * clamp(fx.flash * 2), grao: ST.pos.grao, grade: ST.pos.grade, sat: ST.pos.sat, vinheta: ST.pos.vinheta, mb, flashC, flashR: 0.6, flashCor: fx.flashCor };
      if (s.foco && OBJ[s.foco]) { lente.foco = camera.position.distanceTo(OBJ[s.foco].grupo.position); lente.f = s.f ?? 2.8; }
      return lente;
    },
  };
}
