// Mede um vídeo de referência (ritmo de cortes, cores, brilho, volume) e grava a RÉGUA no projeto.
// A referência é só para estudo: o vídeo baixado fica em projetos/<nome>/referencias/ (fora do git e do kit)
// e nada dele entra no seu vídeo; o que vem dela são números (cortes por minuto, duração dos planos, paleta).
//   node estudio/espaco/ferramentas/medir_referencia.mjs <projeto> <arquivo.mp4 | link> [--nome ref1] [--limiar 0.09]
// Link precisa do yt-dlp instalado (brew install yt-dlp / pip install yt-dlp). Arquivo local não precisa de nada.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { args, pastaProjeto, rodar, duracao, existe, FFMPEG, FFPROBE, sair } from './comum.mjs';

const A = args();
const [nome, fonte] = A._;
const pasta = pastaProjeto(nome);
if (!fonte) sair('diga o arquivo ou o link da referência');
const ref = A.nome || 'ref' + (fs.existsSync(path.join(pasta, 'referencias')) ? fs.readdirSync(path.join(pasta, 'referencias')).length + 1 : 1);
const dir = path.join(pasta, 'referencias', ref);
fs.mkdirSync(dir, { recursive: true });

let video;
if (/^https?:\/\//.test(fonte)) {
  if (!existe('yt-dlp')) sair('para medir um link, instale o yt-dlp (macOS: brew install yt-dlp; outros: pip install yt-dlp) ou baixe o vídeo e passe o arquivo');
  video = path.join(dir, 'video.mp4');
  rodar('yt-dlp', ['-f', 'bv*[height<=720]+ba/b[height<=720]/b', '--merge-output-format', 'mp4', '-o', video, '--no-playlist', fonte], { mostrar: true });
} else {
  video = path.resolve(fonte);
  if (!fs.existsSync(video)) sair('não achei o arquivo ' + fonte);
}

const dur = duracao(video);
const info = JSON.parse(rodar(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-of', 'json', video])).streams[0];
// cortes: mudança de cena acima do limiar (0,09 acha 14 dos 15 cortes do rascunho de exemplo, que corta entre planos parecidos;
// em referência com muito movimento suba para 0,2 com --limiar 0.2 e confira na folha)
const LIM = +(A.limiar || 0.09);
const cena = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-i', video, '-vf', `select='gt(scene,${LIM})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const cortes = [...(cena.stderr || '').matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
const marcos = [0, ...cortes, dur];
const planos = marcos.slice(1).map((t, i) => t - marcos[i]).filter((x) => x > 0.04);
const ord = [...planos].sort((a, b) => a - b);
const mediana = ord[Math.floor(ord.length / 2)] || dur;
const curtos = planos.filter((p) => p <= 1.8).length / (planos.length || 1);
// folha com o primeiro quadro de cada plano (até 36)
spawnSync(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-i', video, '-vf', `select='eq(n,0)+gt(scene,${LIM})',scale=216:-1,tile=6x6:padding=4:color=black`, '-frames:v', '1', '-an', path.join(dir, 'folha_cortes.jpg')]);
// paleta de 8 cores (1 quadro por segundo)
const pal = path.join(dir, 'paleta.png');
spawnSync(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-i', video, '-vf', 'fps=1,scale=96:-1,palettegen=max_colors=8:reserve_transparent=0:stats_mode=full', '-frames:v', '1', pal]);
const raw = spawnSync(FFMPEG, ['-nostdin', '-v', 'error', '-i', pal, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 }).stdout;
const cores = [];
for (let i = 0; raw && i + 2 < raw.length && cores.length < 8; i += 3) { const h = '#' + [raw[i], raw[i + 1], raw[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(); if (!cores.includes(h)) cores.push(h); }
// brilho médio (0 a 255) e volume integrado
const est = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-i', video, '-vf', 'fps=2,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const ys = [...(est.stderr || '').matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
const brilho = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
const vol = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-i', video, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' });
const lufs = ((vol.stderr || '').match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop();

const regua = {
  fonte: /^https?:/.test(fonte) ? fonte : path.basename(fonte), duracao_s: +dur.toFixed(2), tamanho: `${info.width}x${info.height}`, qps: info.r_frame_rate,
  cortes: cortes.length, cortes_por_minuto: +((cortes.length / dur) * 60).toFixed(1), plano_medio_s: +(dur / (planos.length || 1)).toFixed(2), plano_mediano_s: +mediana.toFixed(2),
  planos_ate_1_8s: Math.round(curtos * 100) + '%', plano_mais_longo_s: +Math.max(...planos).toFixed(2), paleta: cores, brilho_medio_0a255: brilho && +brilho.toFixed(1), volume: lufs ? lufs.replace(/\s+/g, ' ') : null,
};
fs.writeFileSync(path.join(dir, 'regua.json'), JSON.stringify(regua, null, 1) + '\n');
const md = [
  `# Referência ${ref}`, '', `Fonte: ${regua.fonte} (só para estudo: nada dela entra no vídeo nem no kit).`, '',
  '| medida | valor |', '|---|---|',
  ...Object.entries(regua).filter(([k]) => k !== 'fonte' && k !== 'paleta').map(([k, v]) => `| ${k.replace(/_/g, ' ')} | ${v} |`),
  `| paleta | ${cores.join(' ')} |`, '',
  'Folha com o primeiro quadro de cada plano: `folha_cortes.jpg`. Como usar: compare o ritmo e o brilho com o seu rascunho;',
  'a paleta é para entender o contraste, não para copiar (o espaço do kit continua preto e cada cor tem uma função).', '',
];
fs.writeFileSync(path.join(dir, 'REFERENCIA.md'), md.join('\n'));
console.log(`referência medida: ${cortes.length} cortes em ${dur.toFixed(1)} s (${regua.cortes_por_minuto}/min, plano mediano ${regua.plano_mediano_s} s, ${regua.planos_ate_1_8s} até 1,8 s), brilho ${regua.brilho_medio_0a255}, ${regua.volume || 'sem áudio'}`);
console.log(`-> projetos/${nome}/referencias/${ref}/REFERENCIA.md e folha_cortes.jpg`);
