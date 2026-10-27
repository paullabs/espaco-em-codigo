// Conferência do vídeo, quadro a quadro, a partir da análise do render (--ana) e do roteiro:
//  1) frase -> imagem: cada pedaço da fala mostra o que o roteiro pede (campo depois da barra: "texto|lua,terra")
//  2) planos: até 1,8 s, nenhum relâmpago (< 0,5 s), cada um diz o que tem de novo
//  3) herói: visível, inteiro, nem grande nem pequeno demais, longe da faixa da legenda
//  4) legenda: a faixa de 58% a 68% da altura livre quando tem palavra; nunca mais de um texto na tela
//  5) câmera: nunca encosta nem atravessa um corpo
// Grava CONFERENCIA.md no projeto e a folha de contato (1 quadro por segundo) quando recebe o vídeo.
//   node estudio/espaco/ferramentas/conferir_video.mjs <projeto> [--ana saida/analise.json] [--video saida/rascunho.mp4]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { args, pastaProjeto, lerJson, rodar, FFMPEG } from './comum.mjs';

const A = args();
const nome = A._[0];
const pasta = pastaProjeto(nome);
const ana = lerJson(path.join(pasta, A.ana || 'saida/analise.json'), 'rode antes o rascunho: npm run video -- rascunho ' + nome);
const lin = lerJson(path.join(pasta, 'linhas.json'));
const plano = lerJson(path.join(pasta, 'plano.json'));
if (!ana.length) { console.error('análise vazia'); process.exit(1); }
const fps = ana.length > 1 ? Math.round(1 / (ana[1].t - ana[0].t)) : 12;
const nomesValidos = new Set([...Object.keys(plano.objetos || {}), ...(plano.eventos || []).map((e) => e.nome || e.tipo), ...Object.values(plano.objetos || {}).flatMap((o) => (Array.isArray(o.destaque) ? o.destaque : []).map((d) => d.nome).filter(Boolean))]);

const alertas = [], avisos = [];
const linhas = ['# Conferência: ' + (plano.titulo || nome), '', `Análise de ${ana.length} quadros a ${fps} qps (${(ana.length / fps).toFixed(1)} s).`, ''];

// 1) frase -> imagem
linhas.push('## Frase → imagem', '', '| fala | pedaço | pede | visto | |', '|---|---|---|---|---|');
for (const l of lin.linhas) for (const [i, p] of l.pedacos.entries()) {
  if (!p.ver || !p.ver.length) continue;
  const qs = ana.filter((q) => q.t >= p.t0 && q.t < Math.max(p.t1, p.t0 + 1 / fps));
  const vis = p.ver.map((v) => {
    if (!nomesValidos.has(v)) return { v, f: null };
    const f = qs.length ? qs.filter((q) => q.objs && q.objs[v]).length / qs.length : 0;
    return { v, f };
  });
  const ruim = vis.filter((x) => x.f === null || x.f < 0.6);
  for (const x of ruim) {
    const msg = x.f === null ? `${l.id}.${i + 1} "${p.texto}": "${x.v}" não é nome de objeto nem de efeito do plano` : `${l.id}.${i + 1} "${p.texto}": pede "${x.v}" e a tela mostra só ${(x.f * 100).toFixed(0)}% do tempo`;
    alertas.push(msg);
  }
  linhas.push(`| ${l.id}.${i + 1} | ${p.texto} | ${p.ver.join(', ')} | ${vis.map((x) => (x.f === null ? `${x.v}: ?` : `${x.v} ${(x.f * 100).toFixed(0)}%`)).join(', ')} | ${ruim.length ? 'ALERTA' : 'ok'} |`);
}

// 2 e 3) planos e herói
const porPlano = new Map();
for (const q of ana) { if (!porPlano.has(q.id)) porPlano.set(q.id, []); porPlano.get(q.id).push(q); }
linhas.push('', '## Planos', '', '| plano | de | dura | novo | herói | |', '|---|---|---|---|---|---|');
const cauda = plano.cauda ?? 1.7;
for (const [id, qs] of porPlano) {
  const t0 = qs[0].t, dur = qs.length / fps, nota = [];
  const longo = !!(plano.planos || []).find((x, i) => (x.id || 'p' + String(i + 1).padStart(2, '0')) === id)?.longo;   // plano longo de propósito: câmera quase parada e algo novo entrando no quadro a cada poucos segundos
  const ultimo = id === [...porPlano.keys()].pop(); // o último segura a pergunta final em movimento: pode ter a cauda a mais
  const maximo = 1.85 + (ultimo ? cauda : 0);
  if (dur > maximo && !longo) nota.push(`dura ${dur.toFixed(2)} s (máximo ${ultimo ? (1.8 + cauda).toFixed(1).replace('.', ',') + ' no último' : '1,8'})`);
  if (dur < 0.5 && t0 > 0) nota.push(`relâmpago de ${dur.toFixed(2)} s`);
  if (!qs[0].novo) nota.push('sem "novo"');
  const hs = qs.filter((q) => q.hero);
  let her = qs[0].heroi || '—';
  if (qs[0].heroi && !hs.length) nota.push(`herói "${qs[0].heroi}" não está registrado (nome errado?)`);
  if (hs.length) {
    const frac = (f) => hs.filter(f).length / hs.length;
    if (frac((q) => !q.hero.visivel) > 0.2) nota.push('herói fora da tela ou tapado');
    if (frac((q) => q.hero.cortado) > 0.1) nota.push('herói cortado pela borda');
    if (frac((q) => q.hero.grande) > 0.1) nota.push('herói maior que a largura (afaste a câmera ou use "macro": true)');
    if (frac((q) => q.hero.pequeno && !q.hero.macro) > 0.5) nota.push('herói pequeno demais (menos de 6% da altura)');
    if (frac((q) => !q.hero.naJanela) > 0.3) nota.push('herói fora da janela (entre 12% e 60% da altura)');
    her += ` ${Math.round((200 * hs[0].hero.r) / ((hs[0].tela || [0, 1920])[1]))}% da altura`;
  }
  const colide = qs.filter((q) => q.camColide && q.camColide.length);
  if (colide.length) { alertas.push(`${id}: a câmera encosta em ${colide[0].camColide.join(', ')}`); nota.push('câmera encostando'); }
  for (const n of nota) if (n !== 'câmera encostando') avisos.push(`${id} (${t0.toFixed(1)} s): ${n}`);
  linhas.push(`| ${id} | ${t0.toFixed(2)} | ${dur.toFixed(2)} | ${qs[0].novo || ''} | ${her} | ${nota.join('; ') || 'ok'} |`);
}

// 3b) plano novo de verdade: o quadro do meio de cada plano, reduzido a 36x64 em cinza, comparado com o do plano anterior.
// A diferença média é medida em relação ao brilho do quadro (uma cena escura muda pouco em números absolutos, mas muda de verdade):
// abaixo de 0,30 a tela é quase a mesma (as mesmas coisas, no mesmo lugar e do mesmo tamanho) e o corte parece repetição.
// (Medido: planos bons cortam com 6% a 25% em cenas de brilho médio; os seis planos seguidos "duas bolas lado a lado" de um teste ficaram em 2,5% a 4,5%.)
const repetidos = [];
if (A.video && fs.existsSync(path.join(pasta, A.video))) {
  const vid = path.join(pasta, A.video);
  const miniatura = (t) => spawnSync(FFMPEG, ['-nostdin', '-v', 'error', '-ss', t.toFixed(3), '-i', vid, '-frames:v', '1', '-vf', 'scale=36:64,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 20 }).stdout;
  const ids = [...porPlano.keys()];
  const mins = ids.map((id) => { const qs = porPlano.get(id); return miniatura((qs[0].t + qs[qs.length - 1].t) / 2); });
  const continuo = (id) => !!(plano.planos || []).find((x, k) => (x.id || 'p' + String(k + 1).padStart(2, '0')) === id)?.continuo;   // plano que continua o anterior sem corte (a câmera flui): não é repetição
  for (let i = 1; i < ids.length; i++) {
    if (continuo(ids[i])) continue;
    const a = mins[i - 1], b = mins[i];
    if (!a || !b || a.length !== b.length || !a.length) continue;
    let soma = 0, ma = 0, mb = 0; for (let k = 0; k < a.length; k++) { soma += Math.abs(a[k] - b[k]); ma += a[k]; mb += b[k]; }
    const dif = soma / a.length / 255, brilho = (ma + mb) / (2 * a.length) / 255;
    const rel = dif / Math.max(brilho, 0.08);
    if (rel < 0.3) { repetidos.push(ids[i]); avisos.push(`${ids[i]}: a tela quase não muda em relação ao ${ids[i - 1]} (diferença ${(dif * 100).toFixed(1)}%, ${(rel * 100).toFixed(0)}% do brilho do quadro): o corte parece o mesmo plano repetido. Mude o tamanho (ocupa ou lente), o lado do quadro (compo), o assunto ou o ângulo de verdade, ou junte os dois planos`); }
  }
}

// 4) legenda e textos
const palavras = lin.linhas.flatMap((l) => l.pedacos.flatMap((p) => p.palavras || []));
const temPalavra = (t) => palavras.some((w) => t >= w.t0 - 0.02 && t < w.t1 + 0.24);
const faixa = {}, banda = {};
let excessoTexto = 0;
for (const q of ana) {
  if ((q.textos ?? 0) > 1) excessoTexto++;
  if (!temPalavra(q.t) || q.veu) continue; // com véu a metade de baixo fica escura de propósito
  for (const n of q.faixa || []) faixa[q.id + ':' + n] = (faixa[q.id + ':' + n] || 0) + 1;
  if (q.banda && q.banda.ocup > 0.3) banda[q.id] = (banda[q.id] || 0) + 1;
}
for (const [k, n] of Object.entries(faixa)) { const [pl, ob] = k.split(':'); if (n / fps > 0.25) avisos.push(`${pl}: "${ob}" fica atrás da legenda (faixa de 58% a 68% da altura) por ${(n / fps).toFixed(1)} s. Suba a imagem com "compo": {"y": 0.34}, afaste a câmera, ou, se for de propósito, ponha "veu": true (escurece embaixo) ou "faixa": false nesse plano`); }
for (const [k, n] of Object.entries(banda)) if (n / fps > 0.3) avisos.push(`${k}: a faixa da legenda fica clara por ${(n / fps).toFixed(1)} s (mais de 30% dos pixels claros atrás da palavra: água, anéis, um corpo brilhante); a palavra perde contraste. Mude o ângulo, tire o objeto claro de trás da palavra ou use "veu": true`);
if (excessoTexto) alertas.push(`${excessoTexto} quadros com mais de um texto na tela (regra: um por vez)`);
const comp = {};
for (const q of ana) for (const m of q.aud || []) if (/^[AB]:/.test(m)) comp[m] = (comp[m] || 0) + 1;
for (const [m, n] of Object.entries(comp)) if (n / fps > 0.3) avisos.push(`composição: ${m} em ${(n / fps).toFixed(1)} s`);

linhas.push('', '## Resultado', '', alertas.length ? `**${alertas.length} alerta(s)** (corrija antes de mostrar):` : '**Nenhum alerta.**', '', ...alertas.map((a) => '- ' + a), '', avisos.length ? `${avisos.length} aviso(s) (confira no quadro):` : 'Nenhum aviso.', '', ...avisos.map((a) => '- ' + a), '');

// folha de contato
if (A.video) {
  const vid = path.join(pasta, A.video);
  if (fs.existsSync(vid)) {
    const n = Math.ceil(ana.length / fps), col = 6, lin_ = Math.ceil(n / col);
    rodar(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-i', vid, '-vf', `fps=1,scale=216:-1,tile=${col}x${lin_}:padding=4:color=black`, '-frames:v', '1', path.join(pasta, 'saida', 'folha.jpg')]);
    linhas.push('Folha de contato (1 quadro por segundo): `saida/folha.jpg`', '');
  }
}
fs.writeFileSync(path.join(pasta, 'CONFERENCIA.md'), linhas.join('\n'));
console.log(`conferência: ${alertas.length} alerta(s), ${avisos.length} aviso(s) -> projetos/${nome}/CONFERENCIA.md`);
for (const a of alertas) console.log('  ALERTA ' + a);
for (const a of avisos.slice(0, 12)) console.log('  aviso  ' + a);
if (avisos.length > 12) console.log(`  ... mais ${avisos.length - 12} avisos no CONFERENCIA.md`);
process.exitCode = alertas.length ? 2 : 0;
