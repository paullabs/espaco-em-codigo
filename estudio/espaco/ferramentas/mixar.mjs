// Mixagem do projeto, só com o ffmpeg: a voz no tempo de cada fala, poucos efeitos TONAIS (um por acontecimento,
// sem chiado de ruído), um fundo calmo que abaixa quando a voz fala (ou a música da própria pessoa) e tudo a -14 LUFS.
//   node estudio/espaco/ferramentas/mixar.mjs <projeto> --video saida/rascunho_mudo.mp4 --saida saida/rascunho.mp4
// Efeitos: os eventos "som" do plano (nota: plim, grave, impacto, tique) e um "impacto" em cada explosão.
// Música: "musica": { "arquivo": "musica.mp3", "volume": -20 } no plano (o arquivo é da pessoa, com licença dela).
// Sem música, um fundo tonal baixinho (duas notas paradas, sem acorde que resolve): "fundo": false desliga.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { args, pastaProjeto, lerJson, rodar, duracao, tempoNaFala, FFMPEG, sair } from './comum.mjs';

const A = args();
const nome = A._[0];
const pasta = pastaProjeto(nome);
if (!A.video || !A.saida) sair('uso: mixar.mjs <projeto> --video saida/x_mudo.mp4 --saida saida/x.mp4');
const video = path.join(pasta, A.video), saida = path.join(pasta, A.saida);
const lin = lerJson(path.join(pasta, 'linhas.json'));
const plano = lerJson(path.join(pasta, 'plano.json'));
const DUR = duracao(video);

// notas: expressões do aevalsrc (seno com queda exponencial); sem vírgula dentro (o filtro usa vírgula como separador)
const NOTAS = {
  plim: [['0.30*sin(2*PI*1318.5*t)*exp(-7*t)+0.08*sin(2*PI*2637*t)*exp(-11*t)', 0.7, 0], ['0.30*sin(2*PI*1760*t)*exp(-7*t)+0.07*sin(2*PI*3520*t)*exp(-11*t)', 0.7, 0.09]],
  grave: [['0.55*sin(2*PI*82.41*t)*exp(-2.2*t)+0.22*sin(2*PI*164.8*t)*exp(-3.2*t)', 1.8, 0]],
  impacto: [['0.75*sin(2*PI*55*t)*exp(-3.0*t)+0.35*sin(2*PI*110*t)*exp(-5*t)+0.12*sin(2*PI*220*t)*exp(-9*t)', 1.4, 0]],
  tique: [['0.22*sin(2*PI*2093*t)*exp(-30*t)', 0.25, 0]],
};
const sons = [];
for (const [k, e] of (plano.eventos || []).entries()) {
  try {
    if (e.tipo === 'som') { if (!NOTAS[e.nota || 'plim']) sair(`evento ${k + 1}: nota "${e.nota}" não existe (notas: ${Object.keys(NOTAS).join(', ')})`); sons.push({ t: tempoNaFala(lin, e.em, `evento ${k + 1}`), nota: e.nota || 'plim', vol: e.volume ?? 1 }); }
    else if (e.tipo === 'explosao' && e.som !== false) sons.push({ t: tempoNaFala(lin, e.em, `evento ${k + 1}`), nota: 'impacto', vol: 1 });
  } catch (err) { sair(err.message); }
}

const ent = ['-i', video];
const f = [];
let n = 1;
// voz: cada fala no seu tempo
const vozes = [];
if (lin.voz !== 'muda') for (const l of lin.linhas) {
  const arq = path.join(pasta, l.arquivo || `voz/${l.id}.wav`);
  if (!fs.existsSync(arq)) sair(`falta o áudio da fala ${l.id}: ${path.relative(pasta, arq)} (rode a voz de novo)`);
  ent.push('-i', arq);
  f.push(`[${n}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${Math.round(l.t0 * 1000)}:all=1[v${n}]`);
  vozes.push(`[v${n}]`); n++;
}
if (vozes.length) f.push(`${vozes.join('')}amix=inputs=${vozes.length}:normalize=0:dropout_transition=0,apad,atrim=0:${DUR.toFixed(3)},asplit=2[voz][vozk]`);
else f.push(`anullsrc=r=44100:cl=mono,atrim=0:${DUR.toFixed(3)},asplit=2[voz][vozk]`);
// efeitos tonais
const fx = [];
sons.forEach((s, i) => NOTAS[s.nota].forEach(([ex, d, atraso], j) => {
  f.push(`aevalsrc=exprs=${ex}:s=44100:d=${d},volume=${s.vol},adelay=${Math.max(0, Math.round((s.t + atraso) * 1000))}:all=1[s${i}_${j}]`);
  fx.push(`[s${i}_${j}]`);
}));
if (fx.length) f.push(`${fx.join('')}amix=inputs=${fx.length}:normalize=0:dropout_transition=0,apad,atrim=0:${DUR.toFixed(3)},volume=0.55[efe]`);
else f.push(`anullsrc=r=44100:cl=mono,atrim=0:${DUR.toFixed(3)}[efe]`);
// fundo: a música da pessoa ou um fundo tonal calmo, que abaixa quando a voz fala
let temFundo = plano.fundo !== false;
if (plano.musica && plano.musica.arquivo) {
  const arq = path.join(pasta, plano.musica.arquivo);
  if (!fs.existsSync(arq)) sair(`a música ${plano.musica.arquivo} não está na pasta do projeto`);
  ent.push('-stream_loop', '-1', '-i', arq);
  f.push(`[${n}:a]aresample=44100,aformat=channel_layouts=mono,atrim=0:${DUR.toFixed(3)},volume=${plano.musica.volume ?? -20}dB,afade=t=in:d=0.8[cama]`);
  n++; temFundo = true;
} else if (temFundo) {
  f.push(`aevalsrc=exprs=0.05*sin(2*PI*110*t)*(0.85+0.15*sin(2*PI*0.21*t))+0.032*sin(2*PI*164.81*t)*(0.85+0.15*sin(2*PI*0.17*t+1))+0.014*sin(2*PI*329.6*t):s=44100:d=${DUR.toFixed(3)},afade=t=in:d=1.5[cama]`);
}
if (temFundo) { f.push('[cama][vozk]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=400[camad]'); f.push('[voz][efe][camad]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[mix]'); }
else { f.push('[vozk]anullsink'); f.push('[voz][efe]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[mix]'); }

fs.mkdirSync(path.dirname(saida), { recursive: true });
rodar(FFMPEG, ['-nostdin', '-v', 'error', '-y', ...ent, '-filter_complex', f.join(';'), '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-t', DUR.toFixed(3), saida]);
// sem framelog=quiet: essa opção só existe a partir do ffmpeg 5, e o ffmpeg de reserva do projeto (npm run preparar) é o 4.4; lê só o bloco Summary
const med = spawnSync(FFMPEG, ['-nostdin', '-nostats', '-hide_banner', '-i', saida, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const lufs = ((med.stderr || '').slice((med.stderr || '').lastIndexOf('Summary:')).match(/I:\s+(-?[\d.]+) LUFS/) || [])[0];
console.log(`mixado: projetos/${nome}/${A.saida} (${DUR.toFixed(1)} s; voz ${lin.voz || 'guia'}; ${sons.length} efeito(s); fundo ${plano.musica ? 'música da pessoa' : temFundo ? 'tonal' : 'nenhum'}; ${lufs ? lufs.replace(/\s+/g, ' ') : 'volume não medido'})`);
