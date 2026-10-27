// Peças comuns das ferramentas de projeto (voz, conferência, mixagem, o comando "video").
// Um projeto é uma pasta em estudio/espaco/projetos/<nome>/ com roteiro.json, plano.json e o que as ferramentas gravam.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FFMPEG, FFPROBE, RAIZ_PROJETO } from '../../ambiente.mjs';

export { FFMPEG, FFPROBE, RAIZ_PROJETO };
export const ESPACO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROJETOS = path.join(ESPACO, 'projetos');

export function args(argv = process.argv.slice(2)) {
  const A = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) A[k.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    else A._.push(k);
  }
  return A;
}

export function pastaProjeto(nome) {
  if (!nome) sair('diga o nome do projeto (a pasta em estudio/espaco/projetos/)');
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(nome)) sair(`nome de projeto "${nome}": use só letras minúsculas, números, - e _ (sem espaço nem acento)`);
  const p = path.join(PROJETOS, nome);
  if (!fs.existsSync(p)) sair(`o projeto "${nome}" não existe em estudio/espaco/projetos/ (crie com: npm run video -- novo ${nome})`);
  return p;
}

export function lerJson(arq, dica = '') {
  if (!fs.existsSync(arq)) sair(`não achei ${path.relative(RAIZ_PROJETO, arq)}${dica ? ' (' + dica + ')' : ''}`);
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')); } catch (e) { sair(`${path.relative(RAIZ_PROJETO, arq)} não é um JSON válido: ${e.message}`); }
}
export const gravarJson = (arq, obj) => fs.writeFileSync(arq, JSON.stringify(obj, null, 1) + '\n');

export function sair(msg, codigo = 1) { console.error('ERRO: ' + msg); process.exit(codigo); }

export function rodar(cmd, lista, { mostrar = false, cwd } = {}) {
  const r = spawnSync(cmd, lista, { cwd, encoding: 'utf8', stdio: mostrar ? 'inherit' : 'pipe', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) sair(`não consegui rodar ${cmd}: ${r.error.message}`);
  if (r.status !== 0) sair(`${cmd} falhou (${r.status}):\n${(r.stderr || '').slice(-1500)}`);
  return r.stdout || '';
}
export const existe = (cmd) => { const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' }); return !r.error; };

export function duracao(arq) {
  const out = rodar(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', arq]);
  return parseFloat(out.trim());
}

// onde a fala começa e termina dentro de um wav (sem o silêncio da frente e do fim)
export function trechoFalado(arq, limiar = -42) {
  const r = spawnSync(FFMPEG, ['-nostdin', '-hide_banner', '-i', arq, '-af', `silencedetect=noise=${limiar}dB:d=0.06`, '-f', 'null', '-'], { encoding: 'utf8' });
  const txt = r.stderr || '';
  const total = duracao(arq);
  const ini = [...txt.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const fim = [...txt.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  let a = 0, b = total;
  if (ini.length && ini[0] < 0.02 && fim.length) a = fim[0];
  if (ini.length && ini[ini.length - 1] > a && (fim.length < ini.length || fim[fim.length - 1] >= total - 0.02)) b = ini[ini.length - 1];
  return { ini: a, fim: Math.max(a + 0.05, b), total };
}

// palavras de um pedaço: "a *Lua* sumisse" -> ['a', 'Lua', 'sumisse']
export const palavrasDe = (texto) => texto.replace(/\*/g, '').split(/\s+/).filter(Boolean);

// o roteiro: falas com pedaços "texto falado|objetos que a tela tem de mostrar"
export function lerRoteiro(pasta) {
  const r = lerJson(path.join(pasta, 'roteiro.json'), 'o roteiro do projeto');
  if (!Array.isArray(r.falas) || !r.falas.length) sair('roteiro.json precisa de "falas": [ { "id": "A1", "pedacos": ["texto|objetos", ...] } ]');
  const ids = new Set();
  for (const f of r.falas) {
    if (!f.id || !/^[A-Za-z][A-Za-z0-9_]*$/.test(f.id)) sair(`fala sem id válido (letras e números, começando por letra): ${JSON.stringify(f).slice(0, 80)}`);
    if (ids.has(f.id)) sair(`id repetido no roteiro: ${f.id}`);
    ids.add(f.id);
    if (!Array.isArray(f.pedacos) || !f.pedacos.length) sair(`a fala ${f.id} não tem "pedacos"`);
    f.pedacos = f.pedacos.map((p) => {
      const [bruto, ver = ''] = String(p).split('|');
      return { bruto: bruto.trim(), texto: bruto.replace(/\*/g, '').trim(), ouro: [...bruto.matchAll(/\*(.+?)\*/g)].map((m) => m[1]), ver: ver.split(',').map((x) => x.trim()).filter(Boolean) };
    });
    f.texto = f.pedacos.map((p) => p.texto).join(' ');
  }
  return r;
}

// monta linhas.json: cada fala no tempo dela, pedaços e palavras com começo e fim
export function montarLinhas(roteiro, falas) {
  // falas: [{ id, dur, palavras: [{ t0, t1 }] (relativos ao começo da fala) }] na ordem do roteiro
  let t = roteiro.inicio ?? 0.25;
  const linhas = [];
  roteiro.falas.forEach((f, i) => {
    const m = falas[i];
    const ws = f.pedacos.flatMap((p) => palavrasDe(p.bruto));
    if (m.palavras.length !== ws.length) sair(`fala ${f.id}: ${ws.length} palavras no roteiro e ${m.palavras.length} na voz`);
    let k = 0;
    const pedacos = f.pedacos.map((p) => {
      const pw = palavrasDe(p.bruto).map((w) => { const x = m.palavras[k++]; return { t: w, t0: +(t + x.t0).toFixed(3), t1: +(t + x.t1).toFixed(3) }; });
      return { texto: p.texto, bruto: p.bruto, ouro: p.ouro, ver: p.ver, t0: pw[0].t0, t1: pw[pw.length - 1].t1, palavras: pw };
    });
    linhas.push({ id: f.id, texto: f.texto, t0: +t.toFixed(3), t1: +(t + m.dur).toFixed(3), dur: +m.dur.toFixed(3), pausa: f.pausa ?? 0.3, arquivo: m.arquivo, pedacos });
    t += m.dur + (f.pausa ?? 0.3);
  });
  return { titulo: roteiro.titulo || '', total: +t.toFixed(3), linhas };
}

// o mesmo jeito de prender um tempo à fala que a cena usa (cenas/video.js): 2.5, "A1", "A1.fim", "A1.2", "A1:lua", "fim", "+/- s"
const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function tempoNaFala(lin, x, onde = 'tempo') {
  if (x === undefined || x === null || x === '') return null;
  if (typeof x === 'number') return x;
  const LP = Object.fromEntries(lin.linhas.map((l) => [l.id, l]));
  const fimFala = Math.max(...lin.linhas.map((l) => l.t1));
  let s = String(x).trim(), off = 0;
  const m = s.match(/^(.+?)\s*([+-])\s*(\d+(?:[.,]\d+)?)$/);
  if (m && !/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) { s = m[1]; off = (m[2] === '-' ? -1 : 1) * parseFloat(m[3].replace(',', '.')); }
  if (/^[+-]?\d+(?:[.,]\d+)?$/.test(s)) return parseFloat(s.replace(',', '.')) + off;
  if (s === 'inicio') return off;
  if (s === 'fim') return fimFala + off;
  let fim = false;
  if (s.endsWith('.fim')) { fim = true; s = s.slice(0, -4); }
  const [idp, pal] = s.split(':');
  const [id, np] = idp.split('.');
  const l = LP[id];
  if (!l) throw new Error(`${onde}: a fala "${id}" não existe`);
  if (pal) {
    const alvo = semAcento(pal).replace(/[^a-z0-9]/g, '');
    for (const p of l.pedacos) for (const w of p.palavras || []) if (semAcento(w.t).replace(/[^a-z0-9]/g, '').startsWith(alvo)) return (fim ? w.t1 : w.t0) + off;
    throw new Error(`${onde}: a palavra "${pal}" não está na fala ${id}`);
  }
  if (np) { const p = l.pedacos[+np - 1]; if (!p) throw new Error(`${onde}: a fala ${id} não tem o pedaço ${np}`); return (fim ? p.t1 : p.t0) + off; }
  return (fim ? l.t1 : l.t0) + off;
}
