// Renderiza cenas do estúdio de espaço no Chrome sem janela.
// Quadros: node render.mjs --cena sol --t 0,2,4 --saida saida/sol_{t}.png [--w 1920 --h 1080]
// Projeto do kit (cena genérica): node render.mjs --cena video --projeto <nome> ... (pasta projetos/<nome>/)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../motor3d/node_modules/playwright-core/index.mjs';
import { opcoesNavegador, FFMPEG, FFPROBE } from '../ambiente.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // estudio/
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const A = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (k.startsWith('--')) A[k.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
}
const servidor = http.createServer((req, res) => {
  let u = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const p = path.normalize(path.join(RAIZ, u.startsWith('/motor3d') ? u : '/espaco' + u));
  if (!p.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('nao encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
const W = +(A.w || 1920), H = +(A.h || 1080);
const nav = await chromium.launch(opcoesNavegador({ chrome: A.chrome, swiftshader: true }));
const pag = await nav.newPage({ viewport: { width: W, height: H } });
pag.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[pagina]', m.type(), m.text()); });
pag.on('pageerror', (e) => console.log('[pagina-erro]', e.message));
await pag.goto(`http://127.0.0.1:${porta}/index.html?cena=${A.cena || 'sol'}&w=${W}&h=${H}&estilo=${A.estilo || 'classico'}${A.projeto ? '&projeto=' + encodeURIComponent(A.projeto) : ''}`);
await pag.waitForFunction(() => window.__pronto || window.__erro, null, { timeout: 120000 });
const erro = await pag.evaluate(() => window.__erro);
if (erro) { console.error('ERRO NA PAGINA\n' + erro); await nav.close(); servidor.close(); process.exit(1); }
if (A.video) {
  // node render.mjs --cena apagao --video saida/apagao.mp4 --fps 24 --dur 12.4 --w 1280 --h 720
  const fps = +(A.fps || 24);
  const dur = +(A.dur || (await pag.evaluate(() => window.__dur)) || 10);
  const tmp = path.resolve(AQUI, A.tmp || 'saida/_quadros'); // --tmp: cada projeto com a sua pasta (dois renders ao mesmo tempo não se atropelam)
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const n = Math.round(dur * fps);
  const i0 = Math.round(+(A.t0 || 0) * fps); // render parcial: começa neste tempo (s)
  let maxTextos = 0; const excesso = []; const aud = {}; const anas = [];
  for (let i = i0; i < n; i++) {
    await pag.evaluate((t) => window.__desenhar(t), i / fps);
    await pag.screenshot({ path: `${tmp}/q_${String(i).padStart(5, '0')}.png` });
    const nt = await pag.evaluate(() => window.__textos); maxTextos = Math.max(maxTextos, nt); if (nt > 1) excesso.push(i);
    const am = await pag.evaluate(() => window.__aud || []);
    for (const m of am) { aud[m] = aud[m] || []; aud[m].push(i); }
    if (A.ana) anas.push({ q: i, t: +(i / fps).toFixed(3), aud: am, textos: nt, ...(await pag.evaluate(() => window.__ana || {})) });
    if (A.folga) await new Promise((r) => setTimeout(r, +A.folga * 40));
    if (A.progresso && (i - i0) % Math.max(1, Math.round((n - i0) / 10)) === 0) console.log(`  quadro ${i - i0 + 1} de ${n - i0} (${Math.round((100 * (i - i0)) / Math.max(1, n - i0))}%)`);
  }
  const feitos = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).length;
  console.log('quadros gravados:', feitos, 'de', n);
  const { spawnSync } = await import('node:child_process');
  const out = path.resolve(AQUI, A.video);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  spawnSync(FFMPEG, ['-y', '-v', 'error', '-framerate', String(fps), '-start_number', String(i0), '-i', `${tmp}/q_%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], { stdio: 'inherit' });
  { const r = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]); console.log('duracao do video:', String(r.stdout).trim(), 's'); }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (A.ana) { fs.mkdirSync(path.dirname(path.resolve(AQUI, A.ana)), { recursive: true }); fs.writeFileSync(path.resolve(AQUI, A.ana), JSON.stringify(anas)); }
  for (const [m, q] of Object.entries(aud)) console.log('  COMPOSICAO', m, q.length + ' quadros', '(ex.: ' + q.slice(0, 4).join(',') + ')');
  console.log('video', A.video, n, 'quadros; maximo de textos por quadro:', maxTextos, excesso.length ? 'EXCESSO nos quadros ' + excesso.slice(0, 10).join(',') : 'ok (regra: 1)');
  await nav.close();
  servidor.close();
  process.exit(0);
}
const ts = String(A.t || '0').split(',').map(Number);
const anasQ = [];
for (const t of ts) {
  await pag.evaluate((t) => window.__desenhar(t), t);
  const saida = (A.saida || `saida/${A.cena || 'sol'}_{t}.png`).replace('{t}', String(t));
  fs.mkdirSync(path.dirname(path.resolve(AQUI, saida)), { recursive: true });
  await pag.screenshot({ path: path.resolve(AQUI, saida) });
  const ana = await pag.evaluate(() => window.__ana || null);
  if (A.ana) anasQ.push({ t, textos: await pag.evaluate(() => window.__textos), aud: await pag.evaluate(() => window.__aud || []), ...(ana || {}) });
  console.log('ok', saida, 'textos:', await pag.evaluate(() => window.__textos), (await pag.evaluate(() => window.__aud || [])).join(' | '), ana ? ' ana: ' + JSON.stringify(ana.hero ? { id: ana.id, ...ana.hero } : { id: ana.id }) : '');
}
if (A.ana) { fs.mkdirSync(path.dirname(path.resolve(AQUI, A.ana)), { recursive: true }); fs.writeFileSync(path.resolve(AQUI, A.ana), JSON.stringify(anasQ)); }
await nav.close();
servidor.close();
