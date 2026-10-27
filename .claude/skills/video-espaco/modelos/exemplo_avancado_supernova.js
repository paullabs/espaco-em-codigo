// SUPERNOVA v11 (refino do v10 aprovado: modelos com mais presença e textura fina, poeira de profundidade, borrão de movimento, gradação de cor, trilhas e micro-animações; mesma fala e mesmos tempos). v10 (retorno do autor no v9: sem "a Terra fica tranquila" (parece que acabou); pergunta final curta e objetiva; o vídeo termina em aberto, sem fade).
// Um mundo só: o Sol no centro das órbitas, a Terra na órbita dela e a Próxima lá longe, sempre EM CIMA À DIREITA.
// O vídeo começa na Terra e recua até o Sistema Solar e a estrela (para nunca parecer que é o Sol que explode).
// Retorno do autor no v6: ângulos que não atrapalhem a explicação; mostrar a camada de ozônio; animações mais fluidas;
// poucas cores, só as que destacam o que importa; legenda por último, palavra por palavra, onde cabe.
//  - cores: ouro = Sol e distância; vermelho = a Próxima e perigo; azul/verde = Terra; ciano = camada de ozônio;
//    branco-quente = ondas e raios; laranja = a versão "de filme". Planetas ficam em cinza-lilás.
//  - a legenda é desenhada por último, cada palavra aparece na hora em que é falada; a faixa de 58% a 68% da altura
//    fica livre (a análise mede essa faixa quadro a quadro).
import * as THREE from 'three';
import { CURVAS, fovDeMm } from '../camera.js';
import { criarEstrelas, texturaHalo, criarPoeiraEspacial } from '../fundo.js';
import { linhaGorda, circulo, marcador } from '../linhas.js';
import { COR } from '../design.js';
import { RUIDO } from '../glsl.js';
import { criarCorpo } from '../corpos.js';
import { criarExplosao, PALETA_AZUL, PALETA_FOGO_FORTE } from '../explosao.js';
import { criarEstilhacos } from '../estilhaco.js';

const LIN = await (await fetch('/roteiros/supernova_v11/linhas.json')).json();
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
// curvas de motion design: entrada com ressalto (pop), saída suave, aceleração (atração)
const costas = (x, s = 2.4) => { const u = clamp(x) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
const acelera = (x) => { x = clamp(x); return x * x * x; };
const suave = (x) => x * x * (3 - 2 * x);
const suavissimo = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const entre = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, e) => a + (b - a) * e;
const V3 = (a) => new THREE.Vector3().fromArray(a);
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const norm3 = (a) => mul3(a, 1 / Math.hypot(...a));

// ---- tempos presos às falas (linhas.json) ----
const LP = {}; LIN.linhas.forEach((l) => (LP[l.id] = l));
const tw = (id, frag) => { for (const p of LP[id].pedacos) for (const w of p.palavras) if (w.t.toLowerCase().startsWith(frag.toLowerCase())) return w.t0; throw new Error(`palavra ${frag} não achada em ${id}`); };
const L0 = (id) => LP[id].t0;
const ouroFlags = (bruto) => { const out = []; bruto.split(/(\*[^*]+\*)/).filter(Boolean).forEach((seg) => { const gold = seg.startsWith('*'); seg.replace(/\*/g, '').split(' ').filter(Boolean).forEach((w) => out.push({ w, gold })); }); const res = []; out.forEach((o) => { if (/^[,.:?!;]+$/.test(o.w) && res.length) res[res.length - 1].w += o.w; else res.push({ ...o }); }); return res; };
const PAL = [];
for (const l of LIN.linhas) for (const p of l.pedacos) { const fl = ouroFlags(p.bruto); p.palavras.forEach((w, i) => { const q = fl[i]; PAL.push({ t: (q ? q.w : w.t).replace(/[,.:;]+$/, ''), ouro: !!(q && q.gold), cor: q && q.gold && p.cor ? p.cor : null, t0: w.t0, t1: w.t1 }); }); }
// a palavra que está sendo falada agora: fica até a próxima entrar (troca seca) ou some suave se há pausa
const palavraEm = (t) => { let k = -1; for (let i = 0; i < PAL.length && PAL[i].t0 - 0.02 <= t; i++) k = i; if (k < 0) return null; const w = PAL[k], nx = PAL[k + 1]; const segue = !!nx && nx.t0 - w.t1 < 0.32; if (!segue && t >= w.t1 + 0.24) return null; return { w, u: t - w.t0 + 0.02, sai: segue ? 0 : suave(entre(t, w.t1 + 0.1, w.t1 + 0.24)) }; };

// ---- mundo ----
const S = [0, 0, 0], RS = 0.6;
const ORB = [1.6, 2.4, 3.4, 4.6, 7.0, 9.4];
const RPL = [0.07, 0.11, 0.25, 0.1, 0.3, 0.26];
const ANG = [0.7, 0.2, (150 * Math.PI) / 180, 5.2, 1.9, 4.4];
const E = [Math.cos(ANG[2]) * ORB[2], 0, Math.sin(ANG[2]) * ORB[2]], RE = RPL[2];
const P = [18.44, -22.91, -46.45], RP = 0.092;
const D = norm3(add3(E, mul3(P, -1))); // direção em que a onda anda: da estrela para a Terra
const TOSTAR = mul3(D, -1);
const DIST_E = Math.hypot(...add3(P, mul3(E, -1))) - RE;
const DIST_S = Math.hypot(...P);
const T_EXP_FILME = tw('A1', 'explodisse'), T_HIT_FILME = tw('A2', 'acabava') + 0.05;
const T_EXP_REAL = tw('B2', 'explodisse'), T_HIT_REAL = L0('C3');
const V_FILME = DIST_E / (T_HIT_FILME - T_EXP_FILME), V_REAL = DIST_E / (T_HIT_REAL - T_EXP_REAL);
const T_REW1 = [T_HIT_FILME + 1.35, T_HIT_FILME + 2.65], T_REW2 = [L0('C3') + 3.0, L0('C3') + 4.2]; // rebobinar
const T_FIM_FILME = T_HIT_FILME + 1.35, T_FIM_REAL = L0('C3') + 3.0;
const TA = { H1: L0('H1'), B1: L0('B1'), B2: L0('B2'), C1: L0('C1'), C2: L0('C2'), C3: L0('C3'), D0: L0('D0'), D1: L0('D1'), S1: L0('S1'), Q1: L0('Q1') };
const TP0 = tw('B1', 'luz'), TP1 = TA.B2 - 0.5; // o ponto de luz sai da estrela e chega na Terra
const EXG = tw('D1', 'explodir') - 0.05; // a grandona explode na palavra "explodir"
const T_EXQ = tw('Q1', 'explodisse'); // a estrela explode (pergunta final)
const T_HOJE = LP.Q1.pedacos[2].t0 + 0.1, T_VOCE = T_HOJE; // 'hoje?': o ponto de luz acende no começo do anel (a casinha não é mais usada)
const T_PIOR = tw('D0', 'Sabe'); // gancho: "Sabe por quê?"
// camada de ozônio ilustrada ao lado (corte): palco próprio, fora do caminho do resto
const SEC = [0, -300, 0], RSEC = 2.2, CSEC = add3(SEC, [0, -2.5, 0]), ROZ = RSEC * 1.17;
const D2 = norm3([-0.82, -0.57, 0]), TO2 = mul3(D2, -1);

// ---- câmeras prontas (calculadas com desenho/projetar.py e desenho/busca_camera.py) ----
const OTS = { C: [-3.35, 1.51, 3.52], T: [-2.56, -0.65, 0.95], mm: 24 };
const OTSb = { C: [-3.28, 1.47, 3.4], T: [-2.56, -0.62, 0.96], mm: 24 };
const OTSsol = { C: [-3.4, 2.0, 3.8], T: [-2.4, -0.5, 1.0], mm: 24 };
const SS = { C: [0, 40, 27], T: [0.4, 0, -2.5], mm: 24 };
const SSb = { C: [0.6, 38, 25.2], T: [0.5, 0, -2.6], mm: 24 };
const LN = { C: [-2.83, 63.65, 50.46], T: [3.96, -6.78, -11.57], mm: 50 };
const LNb = { C: [-3.5, 61.5, 48.5], T: [4.2, -7.2, -12], mm: 50 };
const EC = { C: [-3.34, 2.03, 3.41], T: [-2.95, -0.21, 1.62], mm: 28 };
const ECb = { C: [-3.3, 1.98, 3.32], T: [-2.95, -0.2, 1.62], mm: 30 };
const EC2 = { C: [-2.94, -2.43, 1.84], T: [-3.0, 0.08, 1.91], mm: 28 };
const EC2b = { C: [-2.92, -2.3, 1.8], T: [-3.0, 0.08, 1.91], mm: 28 };
const VM = norm3([0.431, -0.824, -0.367]);
const PC = { C: add3(P, mul3(VM, 1.45)), T: P, mm: 35 };
const PCb = { C: add3(P, mul3(VM, 1.3)), T: P, mm: 35 };
const PM = { C: add3(P, mul3(VM, 4.5)), T: P, mm: 35 };
const PMb = { C: add3(P, mul3(VM, 5.2)), T: P, mm: 35 };
const PF = { C: add3(P, mul3(VM, 12)), T: P, mm: 28 };
const fw = mul3(VM, -1), upW = [0, 1, 0];
const RR = norm3([fw[1] * upW[2] - fw[2] * upW[1], fw[2] * upW[0] - fw[0] * upW[2], fw[0] * upW[1] - fw[1] * upW[0]]);
const UU = [RR[1] * fw[2] - RR[2] * fw[1], RR[2] * fw[0] - RR[0] * fw[2], RR[0] * fw[1] - RR[1] * fw[0]];
const at = (r, u, v) => add3(add3(add3(P, mul3(RR, r)), mul3(UU, u)), mul3(VM, v));
const SOLC = at(-1.25, -0.05, 0), GIG = at(5.2, 0.9, -1.0), RG = 2.4;
// palco do corte da camada de ozônio
const SC1 = { C: add3(SEC, [0.2, 0.6, 5.4]), T: add3(SEC, [0.1, -0.3, 0]), mm: 32 };
const SC2 = { C: add3(SEC, [0.5, 0.5, 5.1]), T: add3(SEC, [0.2, -0.3, 0]), mm: 34 };
const SC3 = { C: add3(SEC, [-0.3, 0.3, 4.6]), T: add3(SEC, [-0.2, -0.4, 0]), mm: 36 };
const SC4 = { C: add3(SEC, [-0.25, 0.1, 3.4]), T: add3(SEC, [-0.25, -0.2, 0]), mm: 38 };
const SC4b = { C: add3(SEC, [-0.22, 0.1, 3.2]), T: add3(SEC, [-0.25, -0.2, 0]), mm: 40 };

// Sol de perto (gancho 1 e a resposta), grade de oito caixas de Sol (inteira, centrada, sem zoom que corta)
const SOLa = { C: [-1.58, 6.2, 7.8], T: [0.33, -1.2, -1.1], mm: 35 }, SOLb = { C: [-0.99, 3.89, 4.86], T: [0.33, -1.2, -1.1], mm: 35 }, SOLc = { C: [-1.2, 4.7, 5.9], T: [0.33, -1.2, -1.1], mm: 35 };
const GC = [0, -600, 0];
const celula = (i) => [GC[0] + (i % 4 - 1.5) * 1.75, GC[1] + (0.5 - Math.floor(i / 4)) * 1.75, GC[2]];
const G8a = { C: add3(GC, [0, 0, 25.6]), T: GC, mm: 35 }, G8b = { C: add3(GC, [0, 0, 24.8]), T: GC, mm: 35 }, G8c = { C: add3(GC, [0, 0, 24.0]), T: GC, mm: 35 };
// pergunta final: a casinha onde a gente mora (corte transversal calmo) e a Terra com o anel dos quatro anos
const CASA1 = { C: add3(SEC, [-0.7, 0.25, 4.6]), T: add3(SEC, [-0.2, -0.22, 0]), mm: 36 };
const CASA2 = { C: add3(SEC, [-0.45, 0.1, 3.4]), T: add3(SEC, [-0.12, -0.2, 0]), mm: 40 };
const CASA3 = { C: add3(SEC, [-0.2, -0.08, 1.9]), T: add3(SEC, [0.0, -0.2, 0]), mm: 40 };
const CASA3b = { C: add3(SEC, [-0.1, -0.1, 1.6]), T: add3(SEC, [0.01, -0.2, 0]), mm: 40 };
const ER = (dx, dy, dz, mm = 28) => ({ C: add3(E, [dx, dy, dz]), T: E, mm });
const AT = (r, u, v, tr = r, tu = 0, tv = 0, mm = 28) => ({ C: at(r, u, v), T: at(tr, tu, tv), mm });
const Sh = (id, t0, t1, modo, de, para, o = {}) => ({ id, t0, t1, modo, de, para: para || de, curva: 'suave', ...o });
const voo = (A, B, olha = false) => ({ f: (e) => ({ C: mix3(A.C, B.C, e), T: olha ? mix3(A.T, B.T, suave(entre(e, 0, 0.4))) : mix3(A.T, B.T, Math.min(1, e * 1.25)), mm: lerp(A.mm, B.mm, e) }) });
const SHOTS = [
// <SHOTS>
  Sh('s01', 0.00, 0.90, 'filme', OTS, OTSb, { novo: 'a Terra de perto; lá no alto uma estrela brilhando demais', hero: 'terra' }),
  Sh('s02', 0.90, 2.10, 'filme', voo(OTSb, SS), null, { novo: 'recua: o Sol, calmo, no meio das órbitas', curva: 'parte' }),
  Sh('s03', 2.10, 3.40, 'filme', voo(SS, LN), null, { novo: 'recua mais: lá longe a estrela explode', curva: 'chega' }),
  Sh('s04', 3.40, 4.50, 'filme', LN, LNb, { novo: 'a onda de fogo sai da estrela rápido' }),
  Sh('s05', 4.50, 5.44, 'filme', voo(LNb, SSb), null, { novo: 'a câmera desce para o Sistema Solar com a onda chegando', curva: 'meio' }),
  Sh('s06', 5.44, 6.14, 'filme', SSb, SS, { novo: 'a onda varre as órbitas, de fora para dentro' }),
  Sh('s07', 6.14, 6.94, 'filme', EC, ECb, { novo: 'a onda passa pela Terra: frente de luz, poeira, cauda', hero: 'terra', treme: true }),
  Sh('s08', 6.94, 7.74, 'filme', EC2, null, { novo: 'a Terra se despedaça', hero: 'terra', macro: true, treme: true }),
  Sh('s09', 7.74, 9.04, 'volta1', SS, SSb, { novo: 'REBOBINA (◀◀): os pedaços voltam, a onda volta para a estrela', curva: 'meio' }),
  Sh('s10', 9.04, 10.40, 'calmo', SSb, SS, { novo: 'tudo calmo: o Sol, a Terra e a estrela lá longe' }),
  Sh('h1a', 10.40, 11.66, 'calmo', voo(SS, SOLa), null, { novo: 'GANCHO: a câmera voa até o nosso Sol, calmo, brilhando', curva: 'suave' }),
  Sh('h1b', 11.66, 12.96, 'calmo', SOLa, SOLb, { novo: 'o Sol de perto, com manchas e granulação: ele também explode?', hero: 'sol', compoY: 0.36 }),
  Sh('h1c', 12.96, 14.40, 'calmo', SOLb, SOLc, { novo: 'a câmera recua devagar: a pergunta fica no ar', hero: 'sol', compoY: 0.36 }),
  Sh('b1a', 14.40, 15.48, 'calmo', voo(SOLc, PM, true), null, { novo: 'voa do Sol até a vizinha, olhando para ela', linha: true, curva: 'suave' }),
  Sh('b1b', 15.48, 16.58, 'calmo', PM, PC, { novo: 'a estrela de perto: vermelha e pequena', hero: 'estrela', macro: true, curva: 'chega', compoY: 0.34 }),
  Sh('b1c', 16.58, 17.68, 'calmo', LN, LNb, { novo: 'vista inteira: a linha se desenha da estrela até o Sol', linha: [16.68, 17.48], aneis: [17.38, 17.88] }),
  Sh('b1d', 17.68, 18.88, 'calmo', { C: [-0.42, 10.63, 10.44], T: [1.66, -5.13, -7.26], mm: 24 }, { C: [-0.8, 10.1, 10.1], T: [1.66, -5.13, -7.26], mm: 24 }, { novo: 'de perto do Sol: um ponto de luz sai da estrela e a linha some lá no fundo (tão longe)', linha: true, aneis: true, pulso: true }),
  Sh('b1e', 18.88, 19.98, 'calmo', { ft: (tt) => { const u = entre(tt, TP0, TP1); const pp = mix3(P, E, u); return { C: add3(pp, [-0.08, 8.04, 4.9]), T: mix3(P, E, Math.min(1, u + 0.03)), mm: 28 }; } }, null, { novo: 'a câmera vai do lado da luz; cada anel acende quando ela passa', linha: true, aneis: true, pulso: true, curva: 'meio' }),
  Sh('b1f', 19.98, 20.99, 'calmo', SS, OTS, { novo: 'a luz chega na Terra', linha: true, pulso: true, curva: 'chega' }),
  Sh('b2a', 20.99, 22.14, 'real', voo(OTS, PF, true), null, { novo: 'volta para a estrela, olhando para ela', linha: true, curva: 'meio' }),
  Sh('b2b', 22.14, 23.34, 'real', PF, PM, { novo: 'a estrela explode de verdade', hero: 'estrela', macro: true }),
  Sh('b2c', 23.34, 24.69, 'real', LN, LNb, { novo: 'a onda anda devagar pela linha e acende um anel por ano', linha: true, aneis: true }),
  Sh('b2d', 24.69, 26.30, 'real', SS, SSb, { novo: 'a onda varre as órbitas rumo à Terra; os anéis acendem', aneis: true }),
  Sh('c1a', 26.30, 27.30, 'real', OTS, OTSb, { novo: 'GANCHO: na Terra tudo calmo; do alto vem um clarão vermelho (perigo)', hero: 'terra', perigo: true }),
  Sh('c1b', 27.30, 28.20, 'real', OTSb, { C: [-3.2, 1.75, 3.3], T: [-2.9, -0.15, 1.5], mm: 26 }, { novo: 'a câmera se aproxima da Terra: o clarão vermelho cresce atrás dela', hero: 'terra', perigo: true, curva: 'chega' }),
  Sh('c2a', 28.20, 29.54, 'real', voo({ C: [-3.2, 1.75, 3.3], T: [-2.9, -0.15, 1.5], mm: 26 }, EC, true), null, { novo: 'aproxima da Terra: uma camada fina e azul brilha em volta dela', hero: 'terra', macro: true, curva: 'meio' }),
  Sh('c2b', 29.54, 30.94, 'corte', SC1, SC2, { novo: 'corte transversal: a camada de ozônio no alto e os raios do espaço sendo barrados', veuBaixo: true }),
  Sh('c2c', 30.94, 32.14, 'corte', SC2, SC3, { novo: 'a gente lá embaixo, protegida; os raios batem na camada e somem', veuBaixo: true }),
  Sh('c2d', 32.14, 33.17, 'corte', SC3, SC4b, { novo: 'bem de perto: a casinha sob o escudo; cada raio vira uma faísca no alto', veuBaixo: true }),
  Sh('c3a', 33.17, 34.52, 'real', EC, ECb, { novo: 'a onda chega: passa pela Terra com a camada acendendo e rasgando', hero: 'terra', treme: true }),
  Sh('c3b', 34.52, 35.67, 'corte', SC3, SC1, { novo: 'corte transversal: a camada abre um buraco e os raios chegam ao chão', veuBaixo: true }),
  Sh('c3c', 35.67, 36.17, 'real', EC2, EC2b, { novo: 'de lado: o lado da estrela perdeu o escudo; a camada vai embora na cauda', hero: 'terra' }),
  Sh('c3d', 36.17, 37.37, 'volta2', EC, ECb, { novo: 'REBOBINA (◀◀): a camada volta, a onda volta', hero: 'terra', curva: 'meio' }),
  Sh('d0a', 37.37, 38.60, 'calmo', voo(LNb, PM, true), null, { novo: 'voa da vista inteira até a estrela', linha: true, curva: 'meio' }),
  Sh('d0b', 38.60, 39.94, 'calmo', PM, PC, { novo: 'a estrela pulsa, mas não explode', hero: 'estrela', macro: true, tenta: true, curva: 'chega', compoY: 0.34 }),
  Sh('d0c', 39.94, 41.37, 'calmo', PC, PCb, { novo: 'GANCHO: bem de perto, a estrela em silêncio: sabe por quê?', hero: 'estrela', macro: true, tenta: true, compoY: 0.34 }),
  Sh('d1a', 41.37, 42.27, 'L', AT(-0.85, 0.1, 7.0, -0.85, 0, 0, 35), null, { novo: 'um Sol de comparação chega voando e para ao lado da Próxima', hero: 'estrela', macro: true }),
  Sh('d1b', 42.27, 42.87, 'L', AT(-0.85, 0.1, 7.0, -0.85, 0, 0, 35), AT(-0.85, 0.05, 6.6, -0.85, 0, 0, 35), { novo: 'lado a lado: a Próxima é bem menor que o Sol', hero: 'solcomp' }),
  Sh('d1c', 42.87, 44.43, 'L', AT(2.6, 0.6, 26.5, 2.6, 0.5, 0, 28), AT(2.9, 0.7, 24.5, 2.9, 0.6, -0.4, 28), { novo: 'plano aberto: a estrela grandona (azul) aparece do lado do Sol, as duas inteiras na tela', hero: 'gigante', compoY: 0.36 }),
  Sh('d1e', 44.43, 45.73, 'L', AT(2.9, 0.7, 24.5, 2.9, 0.6, -0.4, 28), AT(5.2, 0.9, 26.5, 5.2, 0.9, -1.0, 28), { novo: 'a câmera desliza até a grandona e aparecem 8 Sóis em volta dela', curva: 'meio', compoY: 0.36 }),
  Sh('d1f', 45.73, 46.79, 'L', AT(5.2, 0.9, 26.5, 5.2, 0.9, -1.0, 28), AT(5.2, 0.9, 22.5, 5.2, 0.9, -1.0, 28), { novo: 'os 8 Sóis caem nela um depois do outro: cada batida acende e sacode a grandona', hero: 'gigante', colide: true, treme: true, curva: 'chega', compoY: 0.36 }),
  Sh('d1g', 46.79, 47.80, 'L', AT(5.2, 0.9, 22.5, 5.2, 0.9, -1.0, 28), AT(5.2, 0.9, 29, 5.2, 0.9, -1.0, 28), { novo: 'a grandona explode: clarão, onda de choque dupla e fagulhas; a câmera recua', colide: true, treme: true, compoY: 0.36 }),
  Sh('s1a', 47.80, 49.00, 'calmo', voo(SS, SOLa), null, { novo: 'FECHA O GANCHO: volta ao nosso Sol, calmo', hero: 'sol', macro: true, curva: 'chega' }),
  Sh('s1b', 49.00, 50.60, 'calmo', SOLa, SOLb, { novo: 'o Sol de perto: também não explode', hero: 'sol', compoY: 0.36 }),
  Sh('s1c', 50.60, 51.60, 'oito', G8a, G8b, { novo: 'oito caixas do tamanho de um Sol: o nosso Sol enche só uma', veuBaixo: false }),
  Sh('s1d', 51.60, 52.63, 'oito', G8b, G8c, { novo: 'as outras sete se acendem uma a uma: faltam sete Sóis', veuBaixo: false }),
  Sh('q1a', 52.63, 53.47, 'calmo', PF, PM, { novo: 'PERGUNTA: corte direto para a estrela, lá longe: ela começa a brilhar demais', exq: true, curva: 'chega' }),
  Sh('q1b', 53.47, 54.36, 'calmo', PM, PMb, { novo: 'a estrela explode: clarão, onda de choque e fagulhas', hero: 'estrela', macro: true, exq: true, treme: true }),
  Sh('q1c', 54.36, 55.87, 'calmo', ER(-0.62, 2.2, 2.73), ER(-0.58, 2.07, 2.56), { novo: 'corte para a Terra: aparece o anel de quatro arcos e um ponto de luz acende no começo: hoje', hero: 'aneis4', anel: true, curva: 'chega', compoY: 0.34 }),
  Sh('q1d', 55.87, 57.49, 'calmo', ER(-0.58, 2.07, 2.56), ER(-0.45, 2.35, 2.9), { novo: 'nos próximos quatro anos: o ponto de luz percorre o anel e acende cada arco', hero: 'aneis4', anel: true, curva: 'meio', compoY: 0.34 }),
  Sh('q1e', 57.49, 58.87, 'calmo', ER(-0.45, 2.35, 2.9), ER(-0.4, 2.25, 2.78), { novo: 'o ponto de luz continua girando no anel aceso (sem fade, sem fim): a pergunta fica no ar', hero: 'aneis4', anel: true, fim: true, compoY: 0.34 }),
// </SHOTS>
];
const DUR = 58.87;

export function montar({ scene, camera, ui, comp, W, H }) {
  const vertical = H > W;
  const root = document.getElementById('quadro');
  const rew = document.createElement('div');
  rew.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:none';
  const tri = (x) => `<div style="position:absolute;left:${x}px;top:${Math.round(0.15 * H)}px;width:0;height:0;border-top:${Math.round(0.03 * H)}px solid transparent;border-bottom:${Math.round(0.03 * H)}px solid transparent;border-right:${Math.round(0.05 * W)}px solid rgba(255,255,255,.92)"></div>`;
  rew.innerHTML = `<div data-lin style="position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.05) 0,rgba(255,255,255,.05) 2px,transparent 2px,transparent 7px)"></div><div data-ico style="position:absolute;inset:0;transform-origin:${Math.round(0.13 * W)}px ${Math.round(0.15 * H)}px">${tri(Math.round(0.08 * W))}${tri(Math.round(0.13 * W))}</div>`;
  const rewIco = rew.querySelector('[data-ico]'), rewLin = rew.querySelector('[data-lin]');
  root.insertBefore(rew, document.getElementById('texto'));
  const veuBaixo = document.createElement('div');
  veuBaixo.style.cssText = 'position:absolute;left:0;right:0;top:50%;bottom:0;pointer-events:none;opacity:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(2,1,12,.78) 34%,rgba(2,1,12,.9) 100%)';
  root.insertBefore(veuBaixo, document.getElementById('texto'));

  const luzTerra = V3(S).sub(V3(E)).normalize();
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const luzP = new THREE.PointLight(0xff9a7a, 0, 0, 1.6); luzP.position.fromArray(P); scene.add(luzP);
  const ceu1 = criarEstrelas({ n: 2300, raio: 220, semente: 61, tamanho: (H / 1080) * 0.8 });
  const ceu2 = criarEstrelas({ n: 380, raio: 90, semente: 63, tamanho: (H / 1080) * 1.35 });
  scene.add(ceu1, ceu2);
  const poeiraEsp = criarPoeiraEspacial({ n: 520, caixa: 14, H }); scene.add(poeiraEsp);
  const halo = texturaHalo([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.75)'], [0.55, 'rgba(255,255,255,0.15)'], [1, 'rgba(255,255,255,0)']], 128);
  const anelTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 0], [0.68, 0], [0.8, 1], [0.9, 0.35], [1, 0]].forEach(([o, a]) => r.addColorStop(o, `rgba(255,255,255,${a})`)); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const discoTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); [[0, 0.03], [0.62, 0.05], [0.86, 1], [0.95, 0.25], [1, 0]].forEach(([o, a]) => r.addColorStop(o, `rgba(255,255,255,${a})`)); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const bas = (c, o = 1, add = false) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1 || add, opacity: o, depthWrite: !(o < 1 || add), side: THREE.DoubleSide, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending });
  const lam = (c, e = 0x000000) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
  const glow = (cor, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(cor), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(s); return sp; };
  const marcs = [];
  const marc = (g, tex, cor, px, pos) => { const m = marcador(tex, cor, px, H); if (pos) m.position.fromArray(pos); g.add(m); marcs.push(m); return m; };
  const g = new THREE.Group(); scene.add(g);
  const alinhar = (obj, dir) => obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), V3(dir).normalize());
  const gSec = new THREE.Group(); gSec.position.fromArray(SEC); scene.add(gSec);

  // ---------- sombreadores: onda com filamentos e camada de ozônio com buraco ----------
  const ondaMat = (cor, ex = 6.0) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCor: { value: new THREE.Color(cor) }, uA: { value: 1 }, uEx: { value: ex }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vO; void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `precision highp float; uniform vec3 uCor; uniform float uA,uEx,uTime; varying vec3 vN; varying vec3 vV; varying vec3 vO; ${RUIDO}
      void main(){ float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uEx); float n=fbm(normalize(vO)*7.0+vec3(0.0,uTime*0.5,0.0)); float a=f*(0.5+1.0*n)*1.4*uA; gl_FragColor=vec4(uCor*a,a); }` });
  const ozonioMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCor: { value: new THREE.Color('#7fe8ff') }, uCW: { value: new THREE.Color('#ff7a5a') }, uDir: { value: new THREE.Vector3(1, 0, 0) }, uA: { value: 1 }, uHole: { value: 0 }, uWarn: { value: 0 }, uTime: { value: 0 }, uEx: { value: 1.6 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vO; void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `precision highp float; uniform vec3 uCor,uCW,uDir; uniform float uA,uHole,uWarn,uTime,uEx; varying vec3 vN; varying vec3 vV; varying vec3 vO; ${RUIDO}
      void main(){
        vec3 n=normalize(vO);
        float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uEx);
        float tex=0.7+0.6*fbm(n*5.0+vec3(uTime*0.12,0.0,0.0));
        float ang=acos(clamp(dot(n,normalize(uDir)),-1.0,1.0));
        float borda=uHole+0.14*(fbm(n*6.0+3.0)-0.5);
        float fora=smoothstep(borda-0.03,borda+0.05,ang);
        float rim=exp(-pow((ang-borda)/0.05,2.0))*step(0.001,uHole);
        float base=f*tex*fora;
        vec3 col=uCor*base+uCW*rim*uWarn*0.8;
        float a=(base+rim*uWarn)*uA;
        gl_FragColor=vec4(col*uA,a);
      }` });

  // ---------- corpos (ativos finais do estúdio) ----------
  const solid = (b) => { b.grupo.children[0].userData.ocl = true; return b; };
  const sol = solid(criarCorpo('estrelaG', { presenca: true, luz: luzTerra, halo: 5 })); sol.grupo.scale.setScalar(RS); sol.grupo.position.fromArray(S); g.add(sol.grupo);
  const terra = solid(criarCorpo('terra', { presenca: true, luz: luzTerra })); terra.grupo.scale.setScalar(RE); terra.grupo.position.fromArray(E); g.add(terra.grupo);
  const lua = criarCorpo('lua', { presenca: true, luz: luzTerra }); lua.grupo.scale.setScalar(RE * 0.27); lua.grupo.position.fromArray(add3(E, [0.45, 0.08, 0.18])); g.add(lua.grupo);
  const prox = solid(criarCorpo('estrelaM', { presenca: true, luz: luzTerra, halo: 4.2 })); prox.grupo.scale.setScalar(RP); prox.grupo.position.fromArray(P); g.add(prox.grupo);
  const gig = solid(criarCorpo('estrelaB', { presenca: true, luz: luzTerra, halo: 3.6 })); gig.grupo.scale.setScalar(RG); gig.grupo.position.fromArray(GIG); g.add(gig.grupo);
  const solComp = solid(criarCorpo('estrelaG', { presenca: true, luz: luzTerra, halo: 3.2 })); solComp.grupo.scale.setScalar(RS); g.add(solComp.grupo);
  const sois8 = Array.from({ length: 8 }, (_, i) => { const a = Math.PI * 0.375 - i * (Math.PI / 4); const p = add3(GIG, add3(mul3(RR, Math.cos(a) * 3.3), mul3(UU, Math.sin(a) * 4.4))); const b = criarCorpo('estrelaG', { presenca: true, luz: luzTerra, halo: 3.0 }); b.grupo.userData.p = p; b.grupo.scale.setScalar(RS); g.add(b.grupo); return b; });
  const trilhasSois = sois8.map(() => { const l = linhaGorda([V3(P), V3(P).clone().add(new THREE.Vector3(0.01, 0, 0))], { cor: '#ffe0a0', largura: 7, opacidade: 0.5, aditiva: true, W, H }); l.visible = false; g.add(l); return l; });
  const choques = sois8.map(() => { const gl = glow('#cfe6ff', 3); gl.visible = false; g.add(gl); const an = marc(g, anelTex, '#cfe6ff', 100, null); return { gl, an }; });
  // planetas em cinza-lilás: não disputam cor com a Terra, o Sol e a estrela
  const mudo = (b, k = 0.15) => { const u = b.grupo.userData.material.uniforms; ['uPal0', 'uPal1', 'uPal2', 'uPal3'].forEach((n) => { const c = u[n].value; const l = 0.3 * c.x + 0.59 * c.y + 0.11 * c.z; c.set(lerp(l, c.x, k) * 0.95 + 0.04, lerp(l, c.y, k) * 0.95 + 0.04, lerp(l, c.z, k) * 0.95 + 0.07); }); if (b.grupo.userData.atm) b.grupo.userData.atm.visible = false; return b; };
  const planetas = [['mercurio', 0], ['venus', 1], ['marte', 3], ['jupiter', 4], ['saturno', 5]].map(([chave, i]) => { const b = mudo(criarCorpo(chave, { presenca: true, luz: luzTerra })); b.grupo.scale.setScalar(RPL[i]); b.grupo.position.set(Math.cos(ANG[i]) * ORB[i], 0, Math.sin(ANG[i]) * ORB[i]); g.add(b.grupo); return b; });
  const orbitas = ORB.map((r, i) => { const l = linhaGorda(circulo(r, 200), { cor: i === 2 ? '#8FEBE3' : '#B9B3E8', largura: i === 2 ? 2.4 : 1.6, opacidade: i === 2 ? 0.7 : 0.32, W, H }); g.add(l); return l; });
  const marcSol = marc(g, halo, '#ffd166', 30, S), marcTerra = marc(g, halo, '#8febe3', 22, E), marcP = marc(g, halo, '#ff5e4d', 30, P);
  const labaredas = Array.from({ length: 6 }, (_, i) => { const d = new THREE.Vector3(Math.sin(i * 2.3), Math.cos(i * 1.7), Math.sin(i * 1.1 + 2)).normalize(); const m = new THREE.Mesh(new THREE.SphereGeometry(RP * 0.13, 10, 8), bas('#ffcf6a', 0.8, true)); m.position.copy(V3(P)).addScaledVector(d, RP * 1.02); g.add(m); return m; });

  // ---------- explosões (ativo do estúdio) e ondas ----------
  const expF = criarExplosao({ tom: [1.35, 1.1, 0.85], n: 1100, semente: 3, paleta: PALETA_FOGO_FORTE }), expR = criarExplosao({ tom: [1, 1, 1], n: 1100, semente: 5, paleta: PALETA_AZUL }), expG = criarExplosao({ tom: [1, 1, 1.05], n: 1500, semente: 9, paleta: PALETA_AZUL });
  [expF, expR].forEach((e) => { e.grupo.position.fromArray(P); scene.add(e.grupo); }); expG.grupo.position.fromArray(GIG); scene.add(expG.grupo);
  const anelExp = marc(g, anelTex, '#ffe9c8', 60, P);
  const nuvem = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), ondaMat('#c8a0ff', 3.0)); nuvem.position.fromArray(P); g.add(nuvem);
  const onda = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 80), ondaMat('#ff8a2a', 6.0)); onda.position.fromArray(P); g.add(onda);
  const ondaPai = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 80), ondaMat('#e8f0ff', 6.0)); ondaPai.position.fromArray(P); g.add(ondaPai);

  // ---------- passagem da onda pela Terra ----------
  const frente = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshBasicMaterial({ map: discoTex, color: '#ffd9a0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  frente.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V3(D)); g.add(frente);
  const NP = 520; let sd = 9; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
  const base1 = V3(D).clone(), ax1 = new THREE.Vector3(0, 1, 0).cross(base1).normalize(), ax2 = base1.clone().cross(ax1).normalize();
  const part0 = [], partS = [];
  for (let i = 0; i < NP; i++) { const a = rnd() * Math.PI * 2, r = 0.3 + Math.sqrt(rnd()) * 1.4, s = (rnd() - 0.5) * 2.8; const p = V3(E).addScaledVector(ax1, Math.cos(a) * r).addScaledVector(ax2, Math.sin(a) * r).addScaledVector(base1, s); part0.push(p); partS.push(p.clone().sub(V3(P)).dot(base1)); }
  const poeiraGeo = new THREE.BufferGeometry(); poeiraGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  const poeira = new THREE.Points(poeiraGeo, new THREE.PointsMaterial({ map: halo, size: 0.07, color: '#ffe0b0', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); poeira.frustumCulled = false; g.add(poeira);
  const riscosGeo = new THREE.BufferGeometry(); riscosGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 6), 3));
  const riscos = new THREE.LineSegments(riscosGeo, new THREE.LineBasicMaterial({ color: '#ffd9a0', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); riscos.frustumCulled = false; g.add(riscos);
  const proa = new THREE.Mesh(new THREE.LatheGeometry(Array.from({ length: 28 }, (_, i) => { const r = (i / 27) * 0.5; return new THREE.Vector2(r, (r * r) / (2 * 0.12)); }), 56), ondaMat('#ffe0a0', 2.4)); alinhar(proa, D); g.add(proa);
  const cauda = new THREE.Mesh((() => { const c = new THREE.CylinderGeometry(RE * 0.85, RE * 0.6, 1.6, 40, 1, true); c.translate(0, 0.8, 0); return c; })(), ondaMat('#ffb070', 1.4)); alinhar(cauda, D); cauda.position.fromArray(E); g.add(cauda);
  const perigoGlow = glow('#ff4a3a', 1); perigoGlow.visible = false; g.add(perigoGlow);
  const ladoLuz = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.03, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.5), bas('#ffe8b0', 0, true)); alinhar(ladoLuz, TOSTAR); ladoLuz.position.fromArray(E); g.add(ladoLuz);
  // filme: a Terra pega fogo (no sombreador dela) e quebra
  const estil = criarEstilhacos({ material: terra.grupo.userData.material, n: 70 }); estil.grupo.scale.setScalar(RE); estil.grupo.position.fromArray(E); g.add(estil.grupo);
  // camada de ozônio em volta da Terra do mundo
  const ozM = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), ozonioMat()); ozM.scale.setScalar(RE * 1.075); ozM.position.fromArray(E); ozM.material.uniforms.uDir.value.fromArray(TOSTAR); g.add(ozM);

  // ---------- linha da distância, anéis de 1 ano de luz, pulso de luz ----------
  const linha = linhaGorda([V3(P), V3(E)], { cor: '#FFD166', largura: 3.4, opacidade: 0.85, tracejada: true, traco: 1.2, espaco: 0.9, W, H }); g.add(linha);
  const aneis = [1, 2, 3, 4].map((k) => { const c = V3(P).lerp(V3(E), k / 4.24); const l = linhaGorda(circulo(1.4, 96), { cor: '#FFD166', largura: 3.6, opacidade: 0.9, W, H }); l.position.copy(c); alinhar(l, D); g.add(l); return l; });
  const pulso = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), bas('#ffffff')); const pulsoH = glow('#fff2d0', 2.4); const marcPulso = marc(g, halo, '#fff2d0', 26, P); g.add(pulso, pulsoH);

  // ---------- palco do corte da camada de ozônio ----------
  const soloMat = new THREE.ShaderMaterial({ uniforms: { uAq: { value: 0 } },
    vertexShader: 'varying vec3 vO; varying vec3 vN; varying vec3 vV; void main(){ vO=position; vec4 w=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `precision highp float; uniform float uAq; varying vec3 vO; varying vec3 vN; varying vec3 vV; ${RUIDO}
      void main(){ vec3 n=normalize(vO); float t=0.6*fbm(n*6.0)+0.4*fbm(n*19.0);
        vec3 base=mix(vec3(0.04,0.07,0.18),vec3(0.07,0.17,0.22),smoothstep(0.38,0.62,t));
        float lim=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.0);
        vec3 col=base+vec3(0.08,0.2,0.42)*lim*0.45;
        col=mix(col,col+vec3(0.5,0.18,0.1)*(0.35+0.65*t),uAq);
        gl_FragColor=vec4(col,1.0); }` });
  const terraS = { grupo: new THREE.Mesh(new THREE.SphereGeometry(RSEC, 128, 96), soloMat) }; terraS.grupo.userData.ocl = true; terraS.grupo.position.fromArray(add3(CSEC, mul3(SEC, -1))); gSec.add(terraS.grupo);
  const atmS = new THREE.Mesh(new THREE.SphereGeometry(RSEC * 1.025, 64, 48), ondaMat('#4f86ff', 3.0)); atmS.position.copy(terraS.grupo.position); gSec.add(atmS);
  const ozS = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), ozonioMat()); ozS.scale.setScalar(ROZ); ozS.position.copy(terraS.grupo.position); ozS.material.uniforms.uEx.value = 1.25; gSec.add(ozS);
  const estrelaS = glow('#ff9a7a', 7); estrelaS.position.set(4.2, 3.4, -3); gSec.add(estrelaS);
  const ondaS = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: discoTex, color: '#fff0d8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); gSec.add(ondaS);
  // a gente lá embaixo: uma casinha e uma pessoa (poucas cores: lilás e uma janela dourada)
  const surf = (ang) => { const n = new THREE.Vector3(Math.sin(ang), Math.cos(ang), 0); return { n, p: terraS.grupo.position.clone().addScaledVector(n, RSEC) }; };
  const casa = new THREE.Group();
  { const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.15), lam('#d9cff0', 0x1a1030)); corpo.position.y = 0.075; const teto = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.1, 4), lam('#6b5a9a', 0x120a24)); teto.rotation.y = Math.PI / 4; teto.position.y = 0.2; const jan = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), bas('#ffd166')); jan.position.set(0, 0.08, 0.076); casa.add(corpo, teto, jan);
    const pes = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.07, 4, 8), lam('#bfb2e8', 0x1a1030)); pes.position.set(0.17, 0.055, 0.02); casa.add(pes); const cab = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), lam('#efe6ff', 0x2a2040)); cab.position.set(0.17, 0.127, 0.02); casa.add(cab); }
  { const s = surf(-0.1); casa.position.copy(s.p); casa.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.n); casa.scale.setScalar(1.35); gSec.add(casa); }
  const brilhoCasa = glow('#ffcf8a', 1.0); brilhoCasa.position.copy(casa.position).add(new THREE.Vector3(0, 0.16, 0.05)); gSec.add(brilhoCasa);
  gSec.updateMatrixWorld(true);
  const pessoaPos = gSec.worldToLocal(casa.localToWorld(new THREE.Vector3(0.17, 0.1, 0.02)));
  const pessoaLuz = glow('#fff2d0', 0.34); pessoaLuz.position.copy(pessoaPos); pessoaLuz.material.opacity = 0; gSec.add(pessoaLuz);
  const pessoaMundo = add3(SEC, [pessoaPos.x, pessoaPos.y, pessoaPos.z]);
  // raios do espaço: linhas retas vindas da estrela, com fótons que correm por elas e faíscas onde são barrados
  const NR = 22;
  const sphInt = (O, Dv, C, R) => { const oc = O.clone().sub(C), b = oc.dot(Dv), c = oc.dot(oc) - R * R, h = b * b - c; if (h < 0) return null; const s = -b - Math.sqrt(h); return s > 0 ? s : -b + Math.sqrt(h); };
  const baseR = terraS.grupo.position.clone().addScaledVector(V3(TO2), 5.4), perp = new THREE.Vector3(D2[1] * -1, D2[0], 0).normalize();
  const raios = Array.from({ length: NR }, (_, i) => { const O = baseR.clone().addScaledVector(perp, (i - (NR - 1) / 2) * 0.27); const l = linhaGorda([O, O.clone().addScaledVector(V3(D2), 1)], { cor: '#ffe9c8', largura: 2.4, opacidade: 0.5, aditiva: true, W, H }); gSec.add(l); const foton = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), bas('#fff6e0', 0.95, true)); gSec.add(foton); const fa = glow('#ffd9a0', 0.4); gSec.add(fa); return { O, l, foton, fa, fase: (i * 0.37) % 1 }; });
  const fotonsC = marc(gSec, halo, '#ffffff', 1, null); fotonsC.visible = false;

  // ---------- palco da grade: oito caixas do tamanho do Sol (o nosso enche uma só) ----------
  const gG8 = new THREE.Group(); gG8.visible = false; scene.add(gG8);
  const sol8 = solid(criarCorpo('estrelaG', { presenca: true, luz: luzTerra, halo: 3.4 })); sol8.grupo.scale.setScalar(0.72); sol8.grupo.position.fromArray(celula(0)); gG8.add(sol8.grupo);
  const fantasmas = Array.from({ length: 8 }, (_, i) => { const c = celula(i); const anel = linhaGorda(circulo(0.78, 96).map((p) => new THREE.Vector3(p.x, p.z, p.y)), { cor: i === 0 ? '#FFD166' : '#D7D0FF', largura: i === 0 ? 4 : 3.2, opacidade: i === 0 ? 1 : 0.9, tracejada: i > 0, traco: 0.12, espaco: 0.09, W, H }); anel.position.fromArray(c); gG8.add(anel); const disco = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), bas('#ffd166', 0.0, true)); disco.position.fromArray(c); gG8.add(disco); return { anel, disco }; });
  // grade: o Sol enche só uma das oito caixas; as outras sete se acendem uma a uma (movimento de motion design: pop com ressalto e onda de luz)
  function grade8(tt) {
    const tOito = tw('S1', 'oitavo');
    const kSol = costas(entre(tt, tOito - 0.45, tOito - 0.05), 2.6);
    sol8.grupo.visible = kSol > 0.01; sol8.grupo.scale.setScalar(Math.max(0.001, 0.72 * kSol)); sol8.atualizar(tt, { spin: 0.04 }); sol8.grupo.userData.material.uniforms.uBrilho.value = 1 + 0.06 * Math.sin(tt * 3);
    const tFill = tOito + 1.0;
    fantasmas.forEach((f, i) => {
      const a = i === 0 ? entre(tt, tOito - 0.45, tOito - 0.15) : entre(tt, tOito + 0.1 + i * 0.07, tOito + 0.38 + i * 0.07);
      f.anel.visible = a > 0.01; f.anel.scale.setScalar(Math.max(0.01, i === 0 ? 1 : 0.55 + 0.45 * costas(a, 2.2))); f.anel.material.opacity = (i === 0 ? 1 : 0.7) * suave(a);
      const onda = Math.exp(-Math.pow((tt - (tFill + (i - 1) * 0.11)) / 0.16, 2));
      f.disco.visible = i > 0 && a > 0.01; f.disco.material.opacity = Math.max(0, (0.07 + 0.015 * Math.sin(tt * 3 + i) + 0.2 * onda) * suave(a));
    });
    registrar('sol', celula(0), 0.78, true, true); registrar('oitavo', GC, 1.7, true);
    for (let i = 1; i < 8; i++) if (fantasmas[i].anel.visible) registrar('caixa' + i, celula(i), 0.78, true, true);
  }
  // ---------- anel dos quatro anos em volta da Terra (sempre de frente para a câmera) ----------
  const gAno = new THREE.Group(); gAno.visible = false; g.add(gAno);
  const RAN = RE * 2.1;
  const arco = (k, fr) => { const a0 = Math.PI / 2 - ((k * 90 + 5) * Math.PI) / 180, a1 = Math.PI / 2 - (((k + 1) * 90 - 5) * Math.PI) / 180; const n = 41; return Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * fr * (i / (n - 1)); return new THREE.Vector3(Math.cos(a) * RAN, Math.sin(a) * RAN, 0); }); };
  const arcosDim = [0, 1, 2, 3].map((k) => { const l = linhaGorda(arco(k, 1), { cor: '#B9B3E8', largura: 4.6, opacidade: 0.42, W, H }); gAno.add(l); return l; });
  const arcosOn = [0, 1, 2, 3].map((k) => { const l = linhaGorda(arco(k, 1), { cor: '#FFD166', largura: 10, opacidade: 0.96, W, H }); gAno.add(l); return l; });
  const arcosGlow = [0, 1, 2, 3].map((k) => { const l = linhaGorda(arco(k, 1), { cor: '#FFD166', largura: 30, opacidade: 0.16, aditiva: true, W, H }); gAno.add(l); return l; });
  const pontoHoje = marc(gAno, halo, '#fff2d0', 54, [0, RAN, 0]), viajante = marc(gAno, halo, '#ffffff', 46, [0, RAN, 0]);
  const caudaLuz = Array.from({ length: 8 }, () => marc(gAno, halo, '#ffe6a8', 30, [0, RAN, 0]));   // cauda de cometa atrás do ponto de luz
  const marcasAno = [0, 1, 2, 3].map((k) => marc(gAno, halo, '#fff2d0', 15, [Math.cos(Math.PI / 2 - (k * Math.PI) / 2) * RAN, Math.sin(Math.PI / 2 - (k * Math.PI) / 2) * RAN, 0]));   // um ponto em cada divisão: um ano
  const AQ = LP.Q1.pedacos;
  function anel4(tt, ativo) {
    gAno.visible = ativo; if (!ativo) return;
    gAno.position.fromArray(E); gAno.quaternion.copy(camera.quaternion);
    const tA = T_HOJE, tV0 = AQ[4].t0, tV1 = AQ[4].t1 - 0.1;
    const corre = suavissimo(entre(tt, tV0, tV1)); // 0..1: o ponto dá uma volta em "nos próximos quatro anos"
    const depois = tt > tV1 ? ((tt - tV1) / 2.4) % 1 : 0; // depois da volta ele não para: segue girando
    const fase = tt > tV1 ? depois : corre;
    let algum = false;
    for (let k = 0; k < 4; k++) {
      const ap = costas(entre(tt, tA + k * 0.07, tA + 0.28 + k * 0.07), 2.2), fr = tt > tV1 ? 1 : entre(corre * 4, k, k + 1), sc = 0.82 + 0.18 * clamp(ap);
      arcosDim[k].visible = ap > 0.01; arcosDim[k].material.opacity = 0.42 * suave(clamp(ap)); arcosDim[k].scale.setScalar(sc); if (ap > 0.01) algum = true;
      const on = fr > 0.02;
      [arcosOn[k], arcosGlow[k]].forEach((l) => { l.visible = on; l.scale.setScalar(sc); if (on) l.userData.definir(arco(k, Math.max(0.03, fr))); });
      arcosGlow[k].material.opacity = 0.16 + 0.34 * Math.exp(-Math.pow((fase * 4 - (k + 0.5)) / 0.55, 2)) * (tt >= tV0 ? 1 : 0);
    }
    gAno.scale.setScalar(1 + 0.012 * Math.sin(tt * 3.2) * suave(entre(tt, tV1, tV1 + 0.4)));
    const kh = costas(entre(tt, T_HOJE - 0.02, T_HOJE + 0.3), 2.6); // o ponto "hoje" acende no topo e fica pulsando até a volta começar
    pontoHoje.visible = kh > 0.01 && tt < tV0 + 0.05; pontoHoje.userData.pxv = (40 + 44 * kh) * (1 + 0.15 * Math.sin(tt * 9)); pontoHoje.material.opacity = clamp(kh);
    const ang = Math.PI / 2 - fase * Math.PI * 2; viajante.visible = tt >= tV0 - 0.05; viajante.position.set(Math.cos(ang) * RAN, Math.sin(ang) * RAN, 0); viajante.userData.pxv = 50 + 14 * Math.sin(tt * 10);
    marcasAno.forEach((m, k) => { m.visible = algum; m.material.opacity = 0.75 * clamp(costas(entre(tt, tA + k * 0.07, tA + 0.3 + k * 0.07), 2.2)); });
    caudaLuz.forEach((m, j) => { const aj = ang + (j + 1) * 0.085, vis = viajante.visible && (tt > tV0 + 0.05); m.visible = vis; m.position.set(Math.cos(aj) * RAN, Math.sin(aj) * RAN, 0); m.userData.pxv = 40 - j * 3.6; m.material.opacity = 0.55 * (1 - j / 8); });
    if (algum) registrar('aneis4', E, RAN * 1.08, true, true);
  }
  // ---------- registro por nome (o que a tela mostra, para conferir a fala) ----------
  const reg = {};
  const registrar = (nome, c, r, marcado = false, inteiro = false) => { reg[nome] = { c, r, marcado, inteiro }; };

  // ---------- estados ----------
  const visTodos = [expF.grupo, expR.grupo, expG.grupo, nuvem, onda, ondaPai, frente, poeira, riscos, proa, cauda, ladoLuz, estil.grupo, ozM, solComp.grupo, gig.grupo, ...sois8.map((s) => s.grupo), pulso, pulsoH];
  const todosCorpos = [sol, terra, lua, prox, gig, solComp, ...sois8, ...planetas];
  function calmo(tt) {
    visTodos.forEach((m) => (m.visible = false)); choques.forEach((c) => (c.gl.visible = false)); trilhasSois.forEach((l) => (l.visible = false)); orbitas.forEach((l) => (l.visible = true));
    sol.grupo.visible = true; planetas.forEach((b) => (b.grupo.visible = true));
    prox.grupo.visible = true; prox.grupo.userData.material.uniforms.uBrilho.value = 1.0 + 0.04 * Math.sin(tt * 2.3); prox.grupo.userData.halo.scale.setScalar(4.2 + 0.2 * Math.sin(tt * 2));
    terra.grupo.visible = lua.grupo.visible = true; terra.grupo.userData.material.uniforms.uQueima.value = 0; terra.grupo.userData.atm.visible = true; luzP.intensity = 0;
    sol.grupo.userData.material.uniforms.uBrilho.value = 1; sol.grupo.userData.halo.material.opacity = 1;
    orbitas.forEach((l, i) => { l.material.color.set(i === 2 ? '#8FEBE3' : '#B9B3E8'); l.material.opacity = i === 2 ? 0.7 : 0.32; });
    labaredas.forEach((m, i) => { const k = 0.5 + 0.5 * Math.sin(tt * 3 + i * 1.7); m.visible = true; m.scale.setScalar(0.5 + 0.7 * k); m.material.opacity = 0.3 + 0.35 * k; });
  }
  // a frente da onda passa pelo Sistema Solar e pela Terra (filme e de verdade)
  function passagem(rs, cor, t, tHit, velo) {
    orbitas.forEach((l, i) => { const k = suave(entre(rs, DIST_S - ORB[i] - 1.5, DIST_S - ORB[i] + 1.5)) * (1 - suave(entre(rs, DIST_S + ORB[i] + 3, DIST_S + ORB[i] + 12))); l.material.color.set(new THREE.Color(i === 2 ? '#8FEBE3' : '#B9B3E8').lerp(new THREE.Color(cor), k)); l.material.opacity = (i === 2 ? 0.7 : 0.32) + 0.5 * k; });
    const ks = suave(entre(rs, DIST_S - 2, DIST_S + 1)) * (1 - suave(entre(rs, DIST_S + 2, DIST_S + 10))); sol.grupo.userData.material.uniforms.uBrilho.value = 1 + 0.9 * ks;
    const df = rs - DIST_E; frente.visible = Math.abs(df) < 5; frente.position.copy(V3(P)).addScaledVector(V3(D), rs); frente.material.color.set(cor); frente.material.opacity = 0.75 * (1 - suave(entre(Math.abs(df), 1.2, 5)));
    const pos = riscosGeo.attributes.position.array, pp = poeiraGeo.attributes.position.array;
    for (let i = 0; i < NP; i++) { const dt = (rs - partS[i]) / velo; const p = part0[i].clone(); let len = 0.02; if (dt > 0) { const desl = 1.5 * suave(Math.min(1, dt / 1.2)) + 1.1 * dt; p.addScaledVector(V3(D), desl); len = Math.min(0.8, 0.12 + 0.9 * suave(Math.min(1, dt / 1.4))); } const q = p.clone().addScaledVector(V3(D), -len); pos.set([q.x, q.y, q.z, p.x, p.y, p.z], i * 6); pp.set([p.x, p.y, p.z], i * 3); }
    riscosGeo.attributes.position.needsUpdate = true; poeiraGeo.attributes.position.needsUpdate = true;
    const jan = suave(entre(t - tHit, -1.4, 0.2)) * (1 - suave(entre(t - tHit, 2.2, 3.6)));
    riscos.visible = poeira.visible = jan > 0.01; riscos.material.color.set(cor); riscos.material.opacity = 0.55 * jan; poeira.material.color.set(cor); poeira.material.opacity = 0.9 * jan;
    const kp = suave(entre(t, tHit - 0.2, tHit + 0.5)) * (1 - suave(entre(t, tHit + 2.0, tHit + 3.6)));
    proa.visible = kp > 0.01; proa.position.copy(V3(E)).addScaledVector(V3(D), -RE * 1.5); proa.scale.setScalar(0.5 + 0.6 * kp); proa.material.uniforms.uA.value = kp; proa.material.uniforms.uCor.value.set(cor);
    cauda.visible = kp > 0.01; cauda.scale.set(1, 0.3 + 1.0 * kp, 1); cauda.material.uniforms.uA.value = 0.5 * kp; cauda.material.uniforms.uCor.value.set(cor); cauda.material.uniforms.uTime.value = t; proa.material.uniforms.uTime.value = t;
    const kl = suave(entre(t, tHit - 0.2, tHit + 0.2)) * (1 - suave(entre(t, tHit + 0.5, tHit + 1.8))); ladoLuz.visible = kl > 0.01; ladoLuz.material.opacity = 0.7 * kl; ladoLuz.material.color.set(cor);
    return t >= tHit - 0.05 && t < tHit + 0.3 ? 0.22 * (1 - suave(entre(t, tHit - 0.05, tHit + 0.3))) : 0;
  }
  let ultRaioExp = 0, flashAt = 'E';
  function explode(e, tx, dur, raio0, cor, kd = 0.04) {
    const dPc = camera.position.distanceTo(V3(P)); const raio = Math.max(0.3, Math.min(3.2, dPc * kd));
    const u = clamp(tx / dur); e.atualizar(u, raio, tx); e.anel.quaternion.copy(camera.quaternion); ultRaioExp = raio * (0.25 + 0.75 * suave(entre(tx, 0, 1.4)));
    anelExp.visible = tx > 0 && tx < 2.4; anelExp.userData.pxv = 60 + 760 * suave(entre(tx, 0, 2.4)); marcP.userData.pxv = 70 + 260 * (1 - suave(entre(tx, 0, 1.8))); anelExp.material.opacity = 1 - suave(entre(tx, 0, 2.4)); anelExp.material.color.set(cor);
    luzP.intensity = 40 * (1 - suave(entre(tx, 0.3, 3.2)));
    nuvem.visible = tx > 0.8; nuvem.scale.setScalar(RP * (4 + 40 * suavissimo(entre(tx, 0.8, 8)))); nuvem.material.uniforms.uA.value = 0.5 * suave(entre(tx, 0.8, 2.5)); nuvem.material.uniforms.uTime.value = tx;
    prox.grupo.userData.material.uniforms.uBrilho.value = 1 + 1.4 * (1 - suave(entre(tx, 0, 0.5))); prox.grupo.visible = tx < 0.18; prox.grupo.userData.halo.scale.setScalar(4.2 + 14 * suave(entre(tx, 0, 0.4)));
  }
  function filme(tm) {
    calmo(tm); labaredas.forEach((m) => (m.visible = false));
    const pre = 0.3 + 0.7 * entre(tm, 0, T_EXP_FILME); // a estrela já brilha demais no primeiro quadro
    prox.grupo.userData.material.uniforms.uBrilho.value = 1 + 1.3 * pre; prox.grupo.userData.halo.scale.setScalar(4.2 + 9 * pre + 1.4 * Math.sin(tm * 26) * pre);
    marcP.userData.pxv = 44 + 110 * pre * (0.85 + 0.15 * Math.sin(tm * 26)); marcP.material.color.set(new THREE.Color('#ff5e4d').lerp(new THREE.Color('#fff2d0'), pre));
    let flash = 0; const tx = tm - T_EXP_FILME;
    if (tx >= 0) {
      expF.grupo.visible = true; explode(expF, tx, 3.8, 1.5, '#ffd9a0');
      const rs = Math.max(0.01, V_FILME * tx); onda.visible = true; onda.scale.setScalar(rs); onda.material.uniforms.uA.value = suave(entre(tx, 0, 0.5)) * (1 - suave(entre(rs, DIST_S + 14, DIST_S + 30))) * (1 - 0.8 * Math.exp(-Math.pow(rs - DIST_E, 2) / 7)); onda.material.uniforms.uTime.value = tm;
      flash += passagem(rs, '#ffa040', tm, T_HIT_FILME, V_FILME); flashAt = 'E';
      if (tx < 0.25) { flash += 0.3 * (1 - suave(tx / 0.25)); flashAt = 'P'; }
    }
    const dH = tm - T_HIT_FILME; const b = suave(entre(dH, -0.05, 0.9));
    terra.grupo.userData.material.uniforms.uQueima.value = b; terra.grupo.userData.material.uniforms.uTime.value = tm; terra.grupo.userData.atm.visible = b < 0.4;
    const quebra = T_HIT_FILME + 0.9; terra.grupo.visible = tm < quebra; estil.grupo.visible = tm >= quebra; estil.atualizar(Math.max(0, tm - quebra), tm);
    lua.grupo.userData.material.uniforms.uQueima.value = 0;
    return flash;
  }
  function real(tr) {
    calmo(tr);
    const tx = tr - T_EXP_REAL;
    // a camada de ozônio aparece de leve quando a fala fala dela e some no rebobinar
    const kOz = suave(entre(tr, L0('C2') - 1.4, L0('C2') + 0.6)); const buraco = 1.15 * suavissimo(entre(tr, T_HIT_REAL + 0.1, T_HIT_REAL + 2.3));
    ozM.visible = kOz > 0.01 && tx > 0; ozM.material.uniforms.uA.value = 0.85 * kOz; ozM.material.uniforms.uHole.value = buraco; ozM.material.uniforms.uWarn.value = suave(entre(buraco, 0.05, 0.4)); ozM.material.uniforms.uTime.value = tr; ozM.position.fromArray(E);
    if (tx < 0) return 0;
    labaredas.forEach((m) => (m.visible = false));
    expR.grupo.visible = true; explode(expR, tx, 3.8, 1.5, '#e8f0ff');
    const rs = Math.max(0.01, V_REAL * tx); ondaPai.visible = true; ondaPai.scale.setScalar(rs); ondaPai.material.uniforms.uA.value = 0.9 * suave(entre(tx, 0, 0.6)) * (1 - suave(entre(rs, DIST_S + 14, DIST_S + 30))) * (1 - 0.8 * Math.exp(-Math.pow(rs - DIST_E, 2) / 7)); ondaPai.material.uniforms.uTime.value = tr;
    let flash = passagem(rs, '#e8f0ff', tr, T_HIT_REAL, V_REAL); flashAt = 'E';
    if (tx < 0.25) { flash += 0.28 * (1 - suave(tx / 0.25)); flashAt = 'P'; }
    // o lado da estrela esquenta e a camada vai embora na cauda
    terra.grupo.userData.material.uniforms.uQueima.value = 0.28 * suave(entre(tr, T_HIT_REAL + 0.3, T_HIT_REAL + 2.4)); terra.grupo.userData.material.uniforms.uTime.value = tr;
    return flash;
  }
  // corte transversal da camada de ozônio (palco ao lado)
  function corte(tt, calma = false) {
    const hole = calma ? 0 : 1.05 * suavissimo(entre(tt, TA.C3 + 1.35, TA.C3 + 2.45)); // o buraco abre depois que a onda chegou na Terra
    const pre = calma ? 1 : suave(entre(tt, TA.C2 + 0.4, TA.C2 + 1.2));
    ozS.material.uniforms.uA.value = 0.95 * pre; ozS.material.uniforms.uHole.value = hole; ozS.material.uniforms.uWarn.value = suave(entre(hole, 0.05, 0.5)); ozS.material.uniforms.uTime.value = tt; ozS.material.uniforms.uDir.value.set(0.12, 1, 0).normalize();
    atmS.material.uniforms.uA.value = 0.35 * pre; atmS.material.uniforms.uTime.value = tt;
    estrelaS.material.opacity = calma ? 0.32 + 0.05 * Math.sin(tt * 1.3) : 0.25 + 0.5 * suave(entre(tt, TA.C2 + 0.6, TA.C3)) + 0.4 * suave(entre(tt, TA.C3 + 1.3, TA.C3 + 2.0));
    soloMat.uniforms.uAq.value = 0.5 * suave(entre(hole, 0.3, 1.0));
    const holeDir = V3([0.12, 1, 0]).normalize(); let passou = 0;
    raios.forEach((r, i) => {
      if (calma) { r.l.visible = r.foton.visible = r.fa.visible = false; return; }
      const O = r.O, Dv = V3(D2), c = ozS.position;
      const s1 = sphInt(O, Dv, c, ROZ); if (s1 === null) { r.l.visible = r.foton.visible = r.fa.visible = false; return; }
      const X1 = O.clone().addScaledVector(Dv, s1); const ang = Math.acos(clamp(X1.clone().sub(c).normalize().dot(holeDir), -1, 1));
      const passa = hole > 0.04 && ang < hole * 0.93;
      let fim = X1; if (passa) { const s2 = sphInt(X1.clone().addScaledVector(Dv, 0.01), Dv, c, RSEC); if (s2 !== null) fim = X1.clone().addScaledVector(Dv, 0.01 + s2); }
      if (passa) passou++;
      const apareceR = suave(entre(tt, TA.C2 + 0.5 + i * 0.03, TA.C2 + 1.2 + i * 0.03)) * (1 - 0.0);
      r.l.visible = apareceR > 0.01; r.l.userData.definir([O, fim]); r.l.material.opacity = 0.42 * apareceR * (passa ? 1.5 : 1);
      const f = (tt * 0.55 + r.fase) % 1; const pos = O.clone().lerp(fim, f);
      r.foton.visible = r.l.visible; r.foton.position.copy(pos); r.foton.material.opacity = 0.95 * apareceR;
      const chega = f > 0.9; r.fa.visible = r.l.visible && chega; r.fa.position.copy(fim); r.fa.scale.setScalar(passa ? 0.55 : 0.36); r.fa.material.opacity = (passa ? 0.9 : 0.6) * suave(entre(f, 0.9, 0.97)) * (1 - suave(entre(f, 0.97, 1)));
    });
    brilhoCasa.material.opacity = calma ? 0.55 + 0.12 * Math.sin(tt * 2.1) : 0.15 + 0.85 * suave(entre(passou, 0, 4));
    pessoaLuz.visible = calma; pessoaLuz.material.opacity = 0.62 * costas(entre(tt, T_VOCE - 0.1, T_VOCE + 0.3), 2.2) * (1 + 0.1 * Math.sin(tt * 4));
    const veu = (passou > 2 ? 1 : 0); void veu;
    return passou;
  }

  // ---------- câmera ----------
  const setLuz = (b, v) => b.grupo.traverse((o) => { const u = o.material && o.material.uniforms; if (u) { if (u.uLuz && !u.uCob) u.uLuz.value.copy(v); if (u.uLight) u.uLight.value.copy(v); } });   // v11: a camada de nuvens também tem 'uLuz', mas é a COR dela (antes a luz de cinema a pintava de verde-neon)
  const luzSol = V3(S).sub(V3(E)).normalize(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3();
  function luzDeCinema() {
    // perto da Terra a luz vem do lado da câmera (para a Terra aparecer); de longe volta a vir do Sol
    const dE = camera.position.distanceTo(V3(E)); const k = 1 - suave(entre(dE, 5, 14));
    const dir = tmpA.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-0.55).addScaledVector(tmpB.setFromMatrixColumn(camera.matrixWorld, 1), 0.45).addScaledVector(tmpC.copy(camera.position).sub(V3(E)).normalize(), 0.75).normalize();
    const v = luzSol.clone().lerp(dir, k).normalize(); setLuz(terra, v); setLuz(lua, v);
  }
  const alvoV = new THREE.Vector3();
  function cam(s, tt) {
    const u = clamp((tt - s.t0) / (s.t1 - s.t0)); const e = CURVAS[s.curva || 'suave'](u);
    let C, T, mm;
    if (s.de.ft) ({ C, T, mm } = s.de.ft(tt));
    else if (s.de.f) ({ C, T, mm } = s.de.f(e));
    else { C = mix3(s.de.C, s.para.C, e); T = mix3(s.de.T, s.para.T, e); mm = lerp(s.de.mm, s.para.mm, e); }
    if (s.treme) {
      let k;
      if (s.modo === 'L') { const dd0 = Math.hypot(C[0] - T[0], C[1] - T[1], C[2] - T[2]) / 22; k = (0.05 * dd0 * acelera(entre(tt, EXG - 1.25, EXG)) + 0.16 * dd0 * suave(entre(tt, EXG, EXG + 0.05)) * (1 - suave(entre(tt, EXG + 0.1, EXG + 0.9)))); }
      else if (s.exq) { const dd0 = Math.hypot(C[0] - T[0], C[1] - T[1], C[2] - T[2]) / 12; k = 0.04 * dd0 * suave(entre(tt, T_EXQ, T_EXQ + 0.05)) * (1 - suave(entre(tt, T_EXQ + 0.1, T_EXQ + 0.7))); }
      else { const hit = s.modo === 'filme' ? T_HIT_FILME : T_HIT_REAL; k = 0.028 * suave(entre(tt, hit - 0.1, hit + 0.1)) * (1 - suave(entre(tt, hit + 0.3, hit + 1.2))); }
      C = add3(C, [Math.sin(tt * 61) * k, Math.sin(tt * 47 + 1) * k, Math.sin(tt * 53 + 2) * k]);
    }
    { const dd = Math.hypot(C[0] - T[0], C[1] - T[1], C[2] - T[2]) * 0.0014; C = add3(C, [Math.sin(tt * 0.9) * dd, Math.sin(tt * 0.7 + 1.3) * dd, Math.sin(tt * 0.5 + 2.1) * dd * 0.5]); }
    camera.position.fromArray(C); { const rl = 0.006 * Math.sin(tt * 0.4 + 1.3); camera.up.set(Math.sin(rl), Math.cos(rl), 0); }
    camera.fov = fovDeMm(mm, vertical); camera.near = 0.01; camera.far = 3000;
    camera.clearViewOffset(); camera.setViewOffset(W, H, (0.5 - 0.43) * W, (0.5 - (s.compoY ?? 0.38)) * H, W, H); camera.updateProjectionMatrix();
    camera.lookAt(alvoV.fromArray(T)); camera.updateMatrixWorld();
    return mm;
  }

  // ---------- texto: legenda palavra por palavra, por último ----------

  // ---------- análise: herói, objetos pedidos pela fala, eixo de tela, faixa da legenda ----------
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
  function analisar(s, tt) {
    scene.updateMatrixWorld(true);
    solidos.length = 0; scene.traverse((o) => { if (o.userData.ocl && o.isMesh) { let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (v) solidos.push(o); } });
    const objs = {};
    for (const [nome, o] of Object.entries(reg)) { if (o.c === null) { objs[nome] = 1; continue; } const m = medir(o.c, o.r); objs[nome] = m.dentro && !m.tapado && (m.rpx >= 5 || o.marcado) ? 1 : 0; }
    let hero = null;
    if (s.hero && reg[s.hero]) { const o = reg[s.hero]; const m = medir(o.c, o.r); hero = { x: Math.round(m.x), y: Math.round(m.y), r: Math.round(m.rpx), visivel: m.tapado ? 0 : 1, naJanela: m.x >= 0.04 * W && m.x <= 0.86 * W && m.y >= 0.12 * H && m.y <= 0.6 * H, grande: !s.macro && 2 * m.rpx > 0.85 * W, macro: !!s.macro, cortado: !s.macro && (m.x - m.rpx < 0.03 * W || m.x + m.rpx > 0.88 * W || m.y - m.rpx < 0.06 * H) }; }
    // objetos-chave que invadem a faixa da legenda (58% a 68% da altura)
    const faixa = []; for (const [nome, o] of Object.entries(reg)) { if (o.c === null || ['sistema', 'linha', 'aneis', 'sol', 'onda', 'luz', 'raios'].includes(nome) || (s.veuBaixo && ['terra', 'ozonio'].includes(nome)) || ['duas', 'oitavo'].includes(nome)) continue; const m = medir(o.c, o.r); if (m.dentro && m.rpx >= 18 && m.y + m.rpx > 0.575 * H && m.y - m.rpx < 0.685 * H && m.x + m.rpx > 0.06 * W && m.x - m.rpx < 0.86 * W) faixa.push(nome); }
    // objetos que têm de aparecer INTEIROS (grade, grandona, Sóis, anel, casa) e não podem se sobrepor sem querer
    const cortados = [], sobre = [];
    if (!s.macro) {
      const ins = Object.entries(reg).filter(([, o]) => o.inteiro && o.c !== null).map(([nome, o]) => ({ nome, ...medir(o.c, o.r) })).filter((m) => m.dentro && !m.atras);
      ins.forEach((m) => { if (m.x - m.rpx < 0.03 * W || m.x + m.rpx > 0.88 * W || m.y - m.rpx < 0.06 * H || m.y + m.rpx > 0.62 * H) cortados.push(m.nome); });
      if (!s.colide) for (let i = 0; i < ins.length; i++) for (let j = i + 1; j < ins.length; j++) { const A = ins[i], B = ins[j]; const dd = Math.hypot(A.x - B.x, A.y - B.y); if ((A.rpx + B.rpx - dd) / Math.min(A.rpx, B.rpx) > 0.2) sobre.push(A.nome + '+' + B.nome); }
    }
    const camColide = [];
    { const cp = camera.position; const chk = (nome, gr, r) => { if (!gr.visible) return; const d = cp.distanceTo(gr.position); if (d < r * 1.5) camColide.push(nome + ':' + (d / r).toFixed(2)); };
      chk('sol', sol.grupo, RS); chk('terra', terra.grupo, RE); chk('lua', lua.grupo, RE * 0.27); chk('prox', prox.grupo, RP); chk('gigante', gig.grupo, gig.grupo.scale.x); chk('solcomp', solComp.grupo, RS);
      planetas.forEach((b, i) => chk('planeta' + i, b.grupo, b.grupo.scale.x)); sois8.forEach((b, i) => chk('sol8_' + i, b.grupo, b.grupo.scale.x)); }
    const a = V3(S).project(camera), b = V3(P).project(camera);
    const eixo = s.modo === 'corte' ? 35 : s.modo === 'oito' ? null : a.z < 1 && b.z < 1 ? Math.round((Math.atan2(-(b.y - a.y) * H, (b.x - a.x) * W) * 180) / Math.PI) : null;
    const fwv = new THREE.Vector3(); camera.getWorldDirection(fwv);
    window.__ana = { id: s.id, novo: s.novo, hero, objs, eixo, corte: ['corte', 'oito'].includes(s.modo), mundo: { E, P }, faixa, cortados, sobre, camColide, cam: { p: camera.position.toArray().map((v) => +v.toFixed(3)), f: fwv.toArray().map((v) => +v.toFixed(3)), fov: +camera.fov.toFixed(2) } };
  }
  // depois do render: quanto da faixa da legenda está ocupado por imagem (a legenda é desenhada por último e tem de caber)
  const mini = document.createElement('canvas'); mini.width = 108; mini.height = 192; const mctx = mini.getContext('2d', { willReadFrequently: true });
  function aposRender(canvas) {
    if (!window.__ana) return;
    mctx.drawImage(canvas, 0, 0, W, H, 0, 0, 108, 192);
    const x0 = Math.round(0.06 * 108), x1 = Math.round(0.86 * 108), y0 = Math.round(0.575 * 192), y1 = Math.round(0.685 * 192);
    const d = mctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; let ocup = 0, lum = 0; const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]); lum += m; if (m > 88) ocup++; }
    window.__ana.banda = { ocup: +(ocup / n).toFixed(3), lum: +(lum / n / 255).toFixed(3) };
  }

  return {
    duracao: DUR, aposRender,
    desenhar(t) {
      const tt = clamp(t, 0, DUR - 0.001);
      const s = SHOTS.find((x) => tt < x.t1) || SHOTS[SHOTS.length - 1];
      const u = clamp((tt - s.t0) / (s.t1 - s.t0));
      const mm = cam(s, tt);
      // borrão de movimento da câmera: a câmera de 1 quadro antes (mesmo plano) dá o deslocamento de cada pixel
      let mb = null;
      { const dq = 1 / 24, tp = tt - dq, sp = tp >= 0 ? (SHOTS.find((x) => tp < x.t1) || s) : null;
        if (sp && sp.id === s.id) { cam(sp, tp); const prev = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); cam(s, tt); const inv = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert(); mb = { invVP: inv, prevVP: prev, k: 1, max: 0.04 }; } }
      [ceu1, ceu2].forEach((c) => { c.position.copy(camera.position); c.scale.setScalar((camera.far * 0.45) / 220); });
      marcs.forEach((m) => (m.visible = false));
      for (const k of Object.keys(reg)) delete reg[k];
      luzDeCinema();
      const noCorte = ['corte', 'oito'].includes(s.modo);
      poeiraEsp.visible = !noCorte; poeiraEsp.material.uniforms.uT.value = tt;
      g.visible = !noCorte; gSec.visible = s.modo === 'corte'; gG8.visible = s.modo === 'oito';
      let flash = 0, fade = 0;
      if (!noCorte) {
        if (s.modo === 'filme') flash = filme(tt);
        else if (s.modo === 'volta1') filme(T_FIM_FILME * (1 - CURVAS.meio(u)));
        else if (s.modo === 'real') flash = real(tt);
        else if (s.modo === 'volta2') real(T_EXP_REAL + (T_FIM_REAL - T_EXP_REAL) * (1 - CURVAS.meio(u)));
        else { calmo(tt); if (s.tenta) { const k = Math.max(0, Math.sin((tt - (TA.D0 + 1.8)) * 7)) * 0.12 * suave(entre(tt, TA.D0 + 1.6, TA.D0 + 2.2)) * (1 - 0.4 * suave(entre(tt, T_PIOR, T_PIOR + 0.6))); prox.grupo.userData.material.uniforms.uBrilho.value = 1 + k * 3; prox.grupo.userData.halo.scale.setScalar(4.2 + 22 * k); } }
        perigoGlow.visible = !!s.perigo; if (s.perigo) { const k = suave(entre(tt, TA.C1, TA.C2)); perigoGlow.position.copy(V3(E).addScaledVector(V3(TOSTAR), 0.9)); perigoGlow.scale.setScalar(0.3 + 2.2 * k); perigoGlow.material.opacity = 0.15 + 0.6 * k; }
        // comparação de tamanho: o Sol ao lado da Próxima, a grandona, oito Sóis que CAEM nela (cada batida acende e sacode) e a explosão
        if (s.modo === 'L') {
          calmo(tt);
          const tO = tw('D1', 'oito');
          const chega = suavissimo(entre(tt, TA.D1, TA.D1 + 0.9));
          const longe = add3(P, mul3(norm3(add3(S, mul3(P, -1))), 18));
          const foco8 = tt > tO - 0.3; // daqui em diante o quadro é só da grandona e dos Sóis
          solComp.grupo.visible = !foco8; const pc = mix3(longe, SOLC, chega); solComp.grupo.position.fromArray(pc);
          if (foco8) { prox.grupo.visible = false; sol.grupo.visible = false; planetas.forEach((b) => (b.grupo.visible = false)); }
          const gv = costas(entre(tt, TA.D1 + 1.5, TA.D1 + 2.1), 2.0);
          const tA0 = EXG - 1.3; // o primeiro Sol começa a cair
          const ev = sois8.map((b, i) => ({ b, i, tap: tO - 0.1 + i * 0.07, t0: tA0 + i * 0.09, tc: tA0 + i * 0.09 + 0.5 }));
          let hits = 0, bump = 0;
          ev.forEach(({ b, i, tap, t0, tc }) => {
            const ap = costas(entre(tt, tap, tap + 0.4), 2.2), u = entre(tt, t0, tc);
            const dir = norm3(add3(b.grupo.userData.p, mul3(GIG, -1)));
            const contato = add3(GIG, mul3(dir, RG + RS * 0.9)), fundo = add3(GIG, mul3(dir, RG - RS * 0.25));
            const afunda = suave(entre(tt, tc, tc + 0.14));
            b.grupo.position.fromArray(mix3(mix3(b.grupo.userData.p, contato, acelera(u)), fundo, afunda));
            { const tr = trilhasSois[i], pa = mix3(b.grupo.userData.p, contato, acelera(Math.max(0, u - 0.22))), pb = mix3(b.grupo.userData.p, contato, acelera(u)); tr.visible = u > 0.03 && u < 1 && tt < tc; if (tr.visible) { tr.userData.definir([V3(pa), V3(pb)]); tr.material.opacity = 0.55 * Math.min(1, u * 3); } }
            b.grupo.visible = tt > tap && tt < tc + 0.16;
            b.grupo.scale.setScalar(Math.max(0.01, RS * ap * (1 - 0.8 * afunda)));
            const ti = tt - tc, c = choques[i];
            c.gl.visible = ti > 0 && ti < 0.45; c.gl.position.fromArray(contato); c.gl.scale.setScalar(1.2 + 3.6 * suave(entre(ti, 0, 0.14))); c.gl.material.opacity = 1.0 * (1 - suave(entre(ti, 0.03, 0.4)));
            c.an.visible = ti > 0 && ti < 0.45; c.an.position.fromArray(contato); c.an.userData.pxv = 30 + 110 * suave(entre(ti, 0, 0.4)); c.an.material.opacity = 0.95 * (1 - suave(entre(ti, 0.05, 0.42)));
            if (tt >= tc) { hits++; bump += 0.035 * Math.exp(-(tt - tc) / 0.11) * Math.cos((tt - tc) * 38); }
            if (b.grupo.visible) registrar('sol8_' + i, b.grupo.position.toArray(), RS * 1.05, false, tt < t0);
          });
          const carga = hits / 8;
          const gOk = gv > 0.01 && tt < EXG + 0.12; gig.grupo.visible = gOk;
          gig.grupo.scale.setScalar(Math.max(0.01, RG * gv * (1 + 0.1 * carga + bump)));
          gig.grupo.userData.material.uniforms.uBrilho.value = 1 + 0.14 * carga + 0.5 * suave(entre(tt, EXG - 0.05, EXG + 0.1));
          gig.grupo.userData.halo.scale.setScalar(3.6 + 2.2 * carga);
          const bk = entre(tt, EXG, EXG + 1.7); expG.grupo.visible = bk > 0 && bk < 1;   // v11: esfria mais depressa, para a estrutura da bola de fogo aparecer dentro do plano
          if (bk > 0) { expG.atualizar(bk, RG * 2.5, tt); expG.anel.quaternion.copy(camera.quaternion); }
          if (tt >= EXG && tt < EXG + 0.35) { flash = 0.3 * (1 - suave(entre(tt, EXG, EXG + 0.35))); flashAt = 'G'; }
          if (solComp.grupo.visible) registrar('solcomp', pc, RS);
          gig.grupo.children[0].userData.ocl = tt < EXG - 0.3; if (gOk && tt < EXG) registrar('gigante', GIG, RG, false, true);
          if (sois8[0].grupo.visible || sois8[7].grupo.visible) registrar('sois8', sois8[3].grupo.position.toArray(), RS);
          if (expG.grupo.visible || (tt > EXG - 0.3 && tt < EXG + 1.5)) registrar('explosaoG', GIG, RG * (0.9 + 0.6 * suave(entre(tt, EXG, EXG + 0.95))), true);
        }
        // a estrela explode na pergunta final ("se a estrela explodisse")
        if (s.exq) {
          const pre = suave(entre(tt, T_EXQ - 0.9, T_EXQ)) * (tt < T_EXQ ? 1 : 0), tx = tt - T_EXQ;
          labaredas.forEach((m) => (m.visible = false));
          prox.grupo.userData.material.uniforms.uBrilho.value = 1 + 1.3 * pre; prox.grupo.userData.halo.scale.setScalar(4.2 + 9 * pre + 1.4 * Math.sin(tt * 26) * pre);
          marcP.userData.pxv = 44 + 110 * pre;
          if (tx >= 0) { expR.grupo.visible = true; explode(expR, tx, 1.8, 1.5, '#e8f0ff', 0.2); if (tx < 0.45) { flash = 0.4 * (1 - suave(tx / 0.45)); flashAt = 'P'; } }
        }
        if (s.anel || s.limpo) { orbitas.forEach((l) => (l.visible = false)); planetas.forEach((b) => (b.grupo.visible = false)); sol.grupo.visible = false; marcSol.visible = false; if (s.anel || s.limpo) lua.grupo.visible = false; }
        anel4(tt, !!s.anel);
        // linha, anéis e pulso de luz
        const lv = !!s.linha; linha.visible = lv;
        if (lv) { const k = Array.isArray(s.linha) ? suave(entre(tt, s.linha[0], s.linha[1])) : 1; linha.userData.definir([V3(P), V3(P).lerp(V3(E), Math.max(0.001, k))]); }
        const up = entre(tt, TP0, TP1); const pv = !!s.pulso && tt >= TP0 && tt < TP1 + 0.2;
        pulso.visible = pulsoH.visible = pv; { const pp = V3(P).lerp(V3(E), suave(up)); pulso.position.copy(pp); pulsoH.position.copy(pp); marcPulso.position.copy(pp); marcPulso.visible = pv; marcPulso.userData.pxv = 22; if (pv) registrar('luz', pp.toArray(), 0.25, true); }
        const rsOnda = s.modo === 'real' ? V_REAL * (tt - T_EXP_REAL) : -1; const kk = (k) => (s.modo === 'real' ? rsOnda >= DIST_S - (k / 4.24) * DIST_E ? 1 : 0 : 0);
        aneis.forEach((l, i) => { const ka = Array.isArray(s.aneis) ? suave(entre(tt, s.aneis[0] + i * 0.12, s.aneis[0] + i * 0.12 + 0.25)) : 1; l.visible = (!!s.aneis && ka > 0.01) || !!s.pulso; const aceso = s.pulso ? up >= (i + 1) / 4.24 : s.modo === 'real' ? kk(i + 1) : true; l.material.color.set(aceso ? '#FFD166' : '#5b4f78'); l.scale.setScalar(Math.max(0.01, ka)); });
        if (lv) registrar('linha', mix3(P, E, 0.5), 2, true);
        { const vis = aneis.filter((l) => l.visible); for (const l of vis) { const m = medir(l.position.toArray(), 1.4); if (m.dentro) { registrar('aneis', l.position.toArray(), 1.4, true); break; } } }
        planetas.forEach((b, i) => { const idx = [0, 1, 3, 4, 5][i]; const a = ANG[idx] + tt * 0.06 / Math.sqrt(ORB[idx]); b.grupo.position.set(Math.cos(a) * ORB[idx], 0, Math.sin(a) * ORB[idx]); });
        { const al = tt * 0.9; lua.grupo.position.fromArray(add3(E, [0.45 * Math.cos(al + 0.4), 0.08, 0.45 * Math.sin(al + 0.4)])); }
        if (s.hero === 'sol') { sol.grupo.userData.material.uniforms.uBrilho.value = 1.08 + 0.1 * Math.sin(tt * 3.1); sol.grupo.userData.halo.scale.setScalar(5 + 0.5 * Math.sin(tt * 2.2)); }
        // atualizar corpos visíveis
        todosCorpos.forEach((c) => { if (c.grupo.visible) c.atualizar(tt, { spin: c === sol ? 0.04 : 0.08 }); });
        const dE = camera.position.distanceTo(V3(E)), dP = camera.position.distanceTo(V3(P)), dS = camera.position.distanceTo(V3(S));
        marcTerra.visible = terra.grupo.visible && dE > 9; marcP.visible = (prox.grupo.visible || expF.grupo.visible || expR.grupo.visible) && dP > 6; marcSol.visible = dS > 25;
        if (s.modo !== 'filme' && s.modo !== 'volta1') { marcP.userData.pxv = 40; marcP.material.color.set('#ff5e4d'); }
        if (terra.grupo.visible || estil.grupo.visible) registrar('terra', E, RE, marcTerra.visible);
        registrar('sol', S, RS, marcSol.visible); registrar('sistema', [0, 0, 0], ORB[4], true);
        if (prox.grupo.visible || expF.grupo.visible || expR.grupo.visible) registrar('estrela', P, RP * 1.2, marcP.visible);
        if (expF.grupo.visible || expR.grupo.visible || anelExp.visible) registrar('explosao', P, Math.max(RP * 2, ultRaioExp * 0.8), true);
        const ow = onda.visible ? onda : ondaPai.visible ? ondaPai : null; if (ow) registrar('onda', V3(P).addScaledVector(V3(D), ow.scale.x).toArray(), 3, true);
        if (frente.visible || proa.visible || poeira.visible) registrar('onda', E, 0.6, true);
        if (ozM.visible) registrar('ozonio', E, RE * 1.1, true);
        ui.limpar && 0;
      } else {
        if (s.modo === 'corte') {
          const passou = corte(tt, !!s.casa);
          if (s.casa) registrar('casa', pessoaMundo, 0.14, true, true);
          else { registrar('terra', CSEC, RSEC, true); registrar('ozonio', add3(CSEC, [0, RSEC, 0]), 1.2, true); if (raios.some((r) => r.l.visible)) registrar('raios', add3(SEC, [0.3, 0.6, 0]), 1.5, true); }
          void passou;
        } else if (s.modo === 'oito') grade8(tt);
        todosCorpos.forEach((c) => (c.grupo.visible = false));
      }
      marcs.forEach((m) => m.visible && m.userData.ajustar(camera));
      // rebobinar e véu da legenda no corte
      const volta = s.modo === 'volta1' || s.modo === 'volta2'; rew.style.display = volta ? 'block' : 'none';
      if (volta) { const k = costas((tt - s.t0) / 0.32, 2.6) * suave(clamp((s.t1 - tt) / 0.25)); rewIco.style.opacity = clamp(k).toFixed(3); rewIco.style.transform = `translateX(${((1 - clamp(k)) * -0.07 * W).toFixed(1)}px) scale(${(0.72 + 0.28 * k).toFixed(3)})`; rewLin.style.opacity = (0.5 + 0.4 * Math.abs(Math.sin(tt * 9))).toFixed(2); rewLin.style.backgroundPositionY = ((tt * 110) % 7).toFixed(1) + 'px'; rew.style.opacity = '1'; registrar('rebobina', null, 0); }
      veuBaixo.style.opacity = s.veuBaixo ? String(suave(entre(tt, s.t0, s.t0 + 0.3))) : '0';
      // v10: sem fade no fim. O vídeo não pode parecer que acabou (a pessoa sai); o ponto de luz segue girando.

      // ---- por último: a legenda, UMA palavra por vez, pequena e no centro, com "pop" ----
      ui.limpar();
      const pw = palavraEm(tt);
      if (pw) {
        const pop = costas(pw.u / 0.2, 4.0);
        ui.legendaPalavra({ texto: pw.w.t, ouro: pw.w.ouro, cor: pw.w.cor, escala: (0.8 + 0.2 * pop) * (1 - 0.03 * pw.sai), alpha: clamp(pw.u / 0.07) * (1 - pw.sai), dy: 0.008 * H * (1 - suave(clamp(pw.u / 0.2))) - 0.004 * H * suave(clamp((pw.u - 0.2) / 0.6)), y: s.leg ?? 0.64 });
      }
      if (s.hero && reg[s.hero]) comp.registrar(V3(reg[s.hero].c), reg[s.hero].r, { heroi: true, macro: !!s.macro });
      analisar(s, tt);
      let flashC = [0.5, 0.5];
      { const alvoF = flashAt === 'P' ? P : flashAt === 'G' ? GIG : E; const pr = V3(alvoF).project(camera); flashC = [pr.x * 0.5 + 0.5, pr.y * 0.5 + 0.5]; }
      return { mm, f: 8, flash, fade, bloom: 0.34 + 0.25 * clamp(flash * 2), grao: 0.012, grade: 1, mb, flashC, flashR: 0.6, flashCor: s.modo === 'filme' || s.modo === 'volta1' ? [1, 0.93, 0.8] : [0.8, 0.9, 1.0] };
    },
  };
}
