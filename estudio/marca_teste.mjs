// Prova, em cada motor, que a marca d'água do canal está de fato no quadro que o renderizador entrega.
// Para cada motor: sobe a página do renderizador, instala a marca (como o render.mjs faz), pede UM quadro pelo caminho
// normal do motor e compara com o MESMO quadro sem a marca (lido pelo toDataURL nativo de outra janela). A diferença tem
// que existir dentro da caixa que a agenda prevê e não existir fora dela.
//   node estudio/marca_teste.mjs                     (todos os motores)
//   node estudio/marca_teste.mjs --motor esportes    (esportes | motor3d | leve | episodio)
//   --t 2   instante do quadro (s)     --png pasta   salva o quadro com a marca em <pasta>/marca_<motor>.png
// Sem --motor testa os motores que o kit traz (o esportes é obrigatório; um motor cuja página não existe é pulado e listado). Um motor
// que existe é testado por inteiro, e pedir um motor pelo nome que o kit não traz falha.
// Sai com código 1 se algum motor falhar. O motor do espaço não entra aqui: a marca dele é do pós-processamento (pos.js)
// e é conferida por `npm run conferir -- marca` e por um quadro renderizado (render.mjs --cena sol).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from './motor3d/node_modules/playwright-core/index.mjs';
import { opcoesNavegador } from './ambiente.mjs';
import { instalarMarca } from './marca_pagina.mjs';
import { MARCA, agendaMarca, tamanhoMarca } from './espaco/marca_agenda.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf' };
const A = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) A[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;

const MOTORES = {
  esportes: { arquivo: 'esportes/video.html', obrigatorio: true, raiz: '.', url: '/esportes/video.html?w=540&h=960&am=2', tipo: 'motor', viewport: [600, 1000] },
  motor3d: { arquivo: 'motor3d/pagina/index.html', raiz: 'motor3d', url: '/pagina/index.html?tl=/prova1/timeline.json&escala=1', tipo: 'motor', swiftshader: true, viewport: [540, 960] },
  leve: { arquivo: 'treino/3d-toon/pagina.html', raiz: '.', url: '/treino/3d-toon/pagina.html?tl=/treino/3d-toon/exemplo/timeline.json&escala=1', tipo: 'motor', swiftshader: true, viewport: [540, 960] },
  episodio: { arquivo: 'motor3d/render_episodio.html', raiz: 'motor3d', url: '/render_episodio.html?ep=ep01&w=540&h=960&fps=30&semente=1&grao=0.018&qualidade=rapida', tipo: 'episodio', fps: 30, viewport: [400, 720], extras: ['--autoplay-policy=no-user-gesture-required'] },
};
// no espaco-em-codigo o motor principal é o do espaço (conferido por `npm run conferir -- marca`), e o esportes não vem no kit
const nomeKit = (() => { try { return JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'package.json'), 'utf8')).name; } catch { return ''; } })();
if (nomeKit === 'espaco-em-codigo') MOTORES.esportes.obrigatorio = false;
const t = Number(A.t ?? 2);
const noKit = (n) => !!MOTORES[n] && fs.existsSync(path.join(AQUI, MOTORES[n].arquivo));
const todos = !A.motor || A.motor === true || A.motor === 'todos';
const escolhidos = todos ? Object.keys(MOTORES).filter((n) => MOTORES[n].obrigatorio || noKit(n)) : String(A.motor).split(',');
const pulados = todos ? Object.keys(MOTORES).filter((n) => !escolhidos.includes(n)) : [];

async function testar(nome) {
  const M = MOTORES[nome];
  if (!M) return { nome, ok: false, erro: `motor desconhecido (${Object.keys(MOTORES).join(', ')})` };
  if (!noKit(nome)) return { nome, ok: false, erro: `o motor não está neste kit (falta estudio/${M.arquivo})` };
  const RAIZ = path.resolve(AQUI, M.raiz);
  const srv = http.createServer((req, res) => {
    const p = path.normalize(path.join(RAIZ, decodeURIComponent(new URL(req.url, 'http://l').pathname)));
    if (!p.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
    fs.readFile(p, (e, d) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(d);
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const nav = await chromium.launch(opcoesNavegador({ swiftshader: !!M.swiftshader, extras: M.extras || [] }));
  try {
    const pg = await nav.newPage({ viewport: { width: M.viewport[0], height: M.viewport[1] } });
    pg.on('pageerror', (e) => console.log(`[${nome}] erro na página:`, e.message));
    await pg.goto(`http://127.0.0.1:${srv.address().port}${M.url}`);
    await pg.waitForFunction(() => window.__pronto || window.__erro, null, { timeout: 300000 });
    const erro = await pg.evaluate(() => window.__erro);
    if (erro) return { nome, ok: false, erro: `a página não abriu: ${String(erro).split('\n')[0]}` };
    await instalarMarca(pg, { fps: M.fps || 24 });
    // anota o canvas de onde o quadro foi lido (por fora da marca, que o compõe numa cópia)
    await pg.evaluate(() => {
      const marcado = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function () { window.__fonte = this; return marcado.apply(this, arguments); };
    });
    // o quadro, pelo caminho normal do motor
    const url = await pg.evaluate(([tt, tipo, fps]) => (tipo === 'episodio' ? window.__render.quadro(Math.round(tt * fps), 1.0) : (window.__motor.renderAt(tt), window.__motor.capturar('image/png'))), [t, M.tipo, M.fps || 24]);
    if (A.png) {
      fs.mkdirSync(path.resolve(A.png), { recursive: true });
      fs.writeFileSync(path.join(path.resolve(A.png), `marca_${nome}.${url.startsWith('data:image/jpeg') ? 'jpg' : 'png'}`), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    }
    const dim = await pg.evaluate(() => ({ W: window.__fonte.width, H: window.__fonte.height }));
    const tam = tamanhoMarca(dim.W, dim.H);
    const ag = agendaMarca(t, dim.H > dim.W);
    const caixa = { x: Math.round((ag.lado === 'e' ? ag.x : ag.x - tam.cw / dim.W) * dim.W), y: Math.round(ag.y * dim.H), w: tam.cw, h: tam.ch };
    const r = await pg.evaluate(async ({ url, caixa }) => {
      // o mesmo quadro sem a marca: toDataURL nativo, vindo de outra janela
      const f = document.createElement('iframe'); document.body.appendChild(f);
      // no mesmo formato do quadro entregue (JPEG no episódio): a diferença que sobra é só a marca
      const jpg = url.startsWith('data:image/jpeg');
      const puro = f.contentWindow.HTMLCanvasElement.prototype.toDataURL.call(window.__fonte, jpg ? 'image/jpeg' : 'image/png', 1.0);
      const ler = async (u) => {
        const im = await createImageBitmap(await (await fetch(u)).blob());
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        return g.getImageData(0, 0, im.width, im.height);
      };
      const a = await ler(url), b = await ler(puro);
      if (a.width !== b.width || a.height !== b.height) return { erro: `tamanhos diferentes ${a.width}x${a.height} / ${b.width}x${b.height}` };
      let dentro = 0, nDentro = 0, maxDentro = 0, fortesDentro = 0, fora = 0, nFora = 0, fortesFora = 0;
      for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
        const i = (y * a.width + x) * 4;
        const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
        if (x >= caixa.x && x < caixa.x + caixa.w && y >= caixa.y && y < caixa.y + caixa.h) { dentro += d; nDentro++; if (d > maxDentro) maxDentro = d; if (d >= 5) fortesDentro++; }
        else if (x < caixa.x - 16 || x >= caixa.x + caixa.w + 16 || y < caixa.y - 16 || y >= caixa.y + caixa.h + 16) { fora += d; nFora++; if (d >= 5) fortesFora++; } // sem a borda de 16 px: no JPEG os blocos vizinhos mudam junto
      }
      return { dentroMedia: dentro / nDentro, maxDentro, fortesDentro, foraMedia: fora / nFora, fortesFora, nFora };
    }, { url, caixa });
    if (r.erro) return { nome, ok: false, erro: r.erro };
    const jpeg = url.startsWith('data:image/jpeg');
    // dentro da caixa: pixels da marca com diferença clara; fora dela: nenhum
    const ok = r.fortesDentro >= 20 && r.fortesFora === 0;
    return { nome, ok, dim, ag: ag.id, caixa, ...r, jpeg };
  } finally {
    await nav.close();
    srv.close();
  }
}

if (!escolhidos.length) { console.log('Este kit não traz motor de página para este teste: a marca do espaço fica no pós (pos.js) e é conferida por npm run conferir -- marca.'); process.exit(0); }
let falhou = false;
console.log(`marca "${MARCA.nome}" a ${+(MARCA.opacidade * 100).toFixed(1)}% — quadro em t=${t} s`);
for (const nome of escolhidos) {
  const r = await testar(nome).catch((e) => ({ nome, ok: false, erro: e.message }));
  if (!r.ok) falhou = true;
  if (r.erro) console.log(`  ✗ ${nome}: ${r.erro}`);
  else console.log(`  ${r.ok ? '✓' : '✗'} ${nome}: canto ${r.ag} em ${r.caixa.x},${r.caixa.y} (${r.dim.W}x${r.dim.H}); dentro da caixa ${r.fortesDentro} pixels mudaram (máx ${r.maxDentro}), fora ${r.fortesFora} (média ${r.foraMedia.toFixed(3)})${r.jpeg ? ' [JPEG]' : ''}`);
}
for (const n of pulados) console.log(`  – ${n}: fora deste kit (falta estudio/${MOTORES[n].arquivo}); não testado`);
console.log(falhou ? 'FALHOU' : 'A marca está no quadro de todos os motores testados.');
process.exit(falhou ? 1 : 0);
