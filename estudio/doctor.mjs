// npm run doctor: confere se esta máquina consegue fazer vídeo com o estúdio e estima o tempo de render.
// Só lê e mede: não instala nada, não grava nada fora da memória. Sai com código 1 se algo essencial faltar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { RAIZ_PROJETO, dentroDoLocal, FFMPEG, FFPROBE, ORIGEM_PROGRAMAS, acharChrome, opcoesNavegador, backendGpu, temVariavel } from './ambiente.mjs';

const deOnde = (origem) => (origem === 'projeto' ? 'cópia deste projeto' : origem === 'sistema' ? 'instalado no computador' : origem ? `de ${origem}` : '');

// Medido pelos autores em 26/10/2026 (MacBook Pro com Apple M5 Pro, com o computador em uso):
// segundos por quadro de uma cena de teste de cada linha, 1080×1920, e o tempo do teste de GPU abaixo.
const REFERENCIA = {
  maquina: 'Apple M5 Pro',
  benchMs: 6.5,
  linhas: [
    ['Dramática (floresta)', 0.06, 'estudio/motor3d/render_episodio.mjs'],
    ['Leve (3D toon)', 0.147, 'estudio/treino/comum/render.mjs'],
    ['Espaço', 0.36, 'estudio/espaco/render.mjs'],
    ['Esportes, a luta (atleta, --am 4)', 0.59, 'estudio/esportes/render.mjs'],
  ],
};
const QPS = 30;

const cor = process.stdout.isTTY ? { ok: '\x1b[32m', aviso: '\x1b[33m', falta: '\x1b[31m', fim: '\x1b[0m', dim: '\x1b[2m' } : { ok: '', aviso: '', falta: '', fim: '', dim: '' };
const problemas = [];
const avisos = [];
function ok(t, d = '') { console.log(`  ${cor.ok}[ok]${cor.fim}     ${t}${d ? `  ${cor.dim}${d}${cor.fim}` : ''}`); }
function aviso(t, como) { avisos.push(t); console.log(`  ${cor.aviso}[AVISO]${cor.fim}  ${t}${como ? `\n            ${como}` : ''}`); }
function falta(t, como) { problemas.push(t); console.log(`  ${cor.falta}[FALTA]${cor.fim}  ${t}${como ? `\n            ${como}` : ''}`); }
function titulo(t) { console.log(`\n${t}`); }

function rodar(cmd, args, opc = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000, ...opc });
  return { ok: r.status === 0 && !r.error, out: ((r.stdout || '') + (r.stderr || '')).trim(), erro: r.error };
}

console.log('Doctor do estúdio · ' + new Date().toLocaleString('pt-BR'));

// 1. Sistema
titulo('Sistema');
const cpu = os.cpus()[0]?.model || 'CPU desconhecida';
ok(`${os.type()} ${os.release()} (${process.platform}/${process.arch})`, cpu);
ok(`${(os.totalmem() / 2 ** 30).toFixed(0)} GB de memória`);
const major = +process.versions.node.split('.')[0];
if (major >= 18) ok(`Node ${process.versions.node}`);
else falta(`Node ${process.versions.node} é antigo`, 'Instale o Node 18 ou mais novo (nodejs.org).');
try {
  const s = fs.statfsSync(RAIZ_PROJETO);
  const gb = (s.bavail * s.bsize) / 2 ** 30;
  if (gb >= 10) ok(`${gb.toFixed(0)} GB livres no disco`);
  else aviso(`só ${gb.toFixed(1)} GB livres no disco`, 'Um vídeo de 1 minuto gera milhares de quadros temporários; libere pelo menos 10 GB.');
} catch { /* statfs não existe neste Node: segue */ }

// 1b. Memória e processos: o que mais faz o computador travar durante o render
titulo('Memória e processos');
try {
  let usado = null, total = null;
  if (process.platform === 'darwin') {
    const m = rodar('sysctl', ['-n', 'vm.swapusage']).out.match(/total = ([\d.]+)M\s+used = ([\d.]+)M/);
    if (m) { total = +m[1]; usado = +m[2]; }
  } else if (process.platform === 'linux') {
    const t = fs.readFileSync('/proc/meminfo', 'utf8');
    const tot = +(t.match(/SwapTotal:\s+(\d+)/) || [])[1], livre = +(t.match(/SwapFree:\s+(\d+)/) || [])[1];
    if (tot) { total = tot / 1024; usado = (tot - livre) / 1024; }
  }
  if (total && usado / total > 0.75) aviso(`o computador usa ${(usado / 1024).toFixed(1)} GB dos ${(total / 1024).toFixed(1)} GB de swap (memória em disco)`, 'Isso faz tudo travar. Feche navegadores e aplicativos pesados antes de renderizar e use --leve nos renders.');
  else if (total) ok(`swap em uso: ${(usado / 1024).toFixed(1)} de ${(total / 1024).toFixed(1)} GB`);
  if (process.platform !== 'win32') {
    const orfaos = rodar('ps', ['-Ao', 'pid=,ppid=,rss=,command=']).out.split('\n')
      .map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/))
      .filter((m) => m && m[2] === '1' && /--headless/.test(m[4]) && /chrom/i.test(m[4]) && !/--type=/.test(m[4]));
    if (orfaos.length) aviso(`${orfaos.length} Chrome(s) sem janela esquecido(s), parados, ocupando uns ${Math.round(orfaos.reduce((s2, m) => s2 + +m[3], 0) / 1024)} MB`, `Se não for um render seu em andamento, feche com: kill ${orfaos.slice(0, 6).map((m) => m[1]).join(' ')}${orfaos.length > 6 ? ' …' : ''}`);
    else ok('nenhum Chrome sem janela esquecido');
  }
} catch { /* sem as ferramentas do sistema: segue */ }

// 2. Programas
titulo('Programas');
let chrome = null;
try {
  chrome = acharChrome();
  const v = rodar(chrome, ['--version']);
  ok('Navegador', `${v.ok ? v.out : ''} (${dentroDoLocal(chrome) ? 'cópia deste projeto, ' : ''}${chrome})`);
} catch (e) { falta('Navegador não encontrado', e.message); }

const ff = rodar(FFMPEG, ['-hide_banner', '-version']);
if (!ff.ok) falta('ffmpeg não encontrado', 'Rode: npm run preparar (ele baixa uma cópia só para este projeto). Ou instale o ffmpeg e deixe no PATH (Mac: brew install ffmpeg; Windows: winget install --id Gyan.FFmpeg -e), ou aponte em FFMPEG_PATH / "ffmpeg" do estudio.config.json.');
else {
  ok('ffmpeg', `${ff.out.split('\n')[0]}${ORIGEM_PROGRAMAS.ffmpeg ? ` (${deOnde(ORIGEM_PROGRAMAS.ffmpeg)})` : ''}`);
  const enc = rodar(FFMPEG, ['-hide_banner', '-encoders']);
  if (/\blibx264\b/.test(enc.out)) ok('ffmpeg com libx264 (o render usa)');
  else falta('este ffmpeg não tem o codificador libx264', 'Rode: npm run preparar (baixa um ffmpeg completo para este projeto) ou instale um ffmpeg completo.');
}
const fp = rodar(FFPROBE, ['-hide_banner', '-version']);
if (fp.ok) ok('ffprobe', ORIGEM_PROGRAMAS.ffprobe ? deOnde(ORIGEM_PROGRAMAS.ffprobe) : ''); else falta('ffprobe não encontrado', 'Ele vem junto com o ffmpeg. Rode: npm run preparar.');

// o Python só importa para as linhas que têm ferramentas de roteiro, áudio e medida (o kit da luta não tem nenhuma)
const usaPython = ['roteiros/ferramentas', 'estudio/treino/comum', 'estudio/espaco/audio', 'estudio/espaco/desenho'].some((d) => fs.existsSync(path.join(RAIZ_PROJETO, d)));
const py = usaPython ? (process.platform === 'win32' ? ['python', 'py'] : ['python3']).find((c) => rodar(c, ['--version']).ok) : null; // no Windows o "python" pode ser só o atalho da Microsoft Store; o "py" é o lançador oficial
if (!usaPython) { /* nada a conferir */ } else if (!py) aviso('Python 3 não encontrado', 'Só as ferramentas de áudio, roteiro e medidas usam Python; o render de vídeo não.');
else {
  ok(rodar(py, ['--version']).out);
  // sem -I: o isolado esconde os pacotes instalados na pasta do usuário; roda da pasta temporária para nada local fazer sombra
  const faltam = ['numpy', 'PIL', 'scipy', 'librosa'].filter((m) => !rodar(py, ['-c', `import ${m}`], { cwd: os.tmpdir() }).ok);
  if (faltam.length) aviso(`faltam módulos Python: ${faltam.join(', ')}`, 'Só para as ferramentas de áudio e de medida. Instale com: pip install numpy pillow scipy librosa');
  else ok('módulos Python de áudio e medidas (numpy, PIL, scipy, librosa)');
}

// 3. Pacotes do Node
titulo('Pacotes do Node (estudio/motor3d)');
const nm = path.join(RAIZ_PROJETO, 'estudio/motor3d/node_modules');
let pacotesOk = true;
for (const p of ['playwright-core', 'three']) {
  const arq = path.join(nm, p, 'package.json');
  if (fs.existsSync(arq)) ok(`${p} ${JSON.parse(fs.readFileSync(arq, 'utf8')).version}`);
  else { pacotesOk = false; falta(`${p} não instalado`, 'Rode: npm run preparar'); }
}
if (pacotesOk && !fs.existsSync(path.join(RAIZ_PROJETO, 'estudio/node_modules/three/package.json'))) aviso('os scripts do Node fora de motor3d (auditorias, preparo da anatomia) não acham o three', 'Rode: npm run preparar (ele cria o atalho estudio/node_modules).');

// 4. GPU, WebGL2 e teste de velocidade
titulo('Placa de vídeo e WebGL2');
let benchMs = null;
if (!chrome || !pacotesOk) {
  aviso('teste de GPU pulado (falta o Chrome ou os pacotes acima)');
} else {
  const FRAG = `#version 300 es
precision highp float;
uniform vec2 R; uniform float T; out vec4 o;
float sdf(vec3 p){
  float d = 1e9;
  for (int i = 0; i < 24; i++) {
    float f = float(i);
    vec3 c = vec3(sin(f*1.7+T)*0.6, cos(f*2.3)*0.9, sin(f*0.9)*0.3);
    vec3 r = vec3(0.15+0.05*sin(f), 0.2, 0.15);
    float s = (length((p-c)/r)-1.0)*0.15;
    float h = clamp(0.5+0.5*(d-s)/0.1, 0.0, 1.0);
    d = mix(d, s, h) - 0.1*h*(1.0-h);
  }
  return d;
}
void main(){
  vec2 uv = (gl_FragCoord.xy*2.0-R)/R.y;
  vec3 ro = vec3(0,0,-3), rd = normalize(vec3(uv,1.8));
  float t = 0.0;
  for (int i = 0; i < 72; i++) { float d = sdf(ro+rd*t); if (d < 0.001 || t > 8.0) break; t += d; }
  vec3 col = vec3(0.08);
  if (t < 8.0) {
    vec3 p = ro+rd*t; vec2 e = vec2(0.002, 0.0);
    vec3 n = normalize(vec3(sdf(p+e.xyy)-sdf(p-e.xyy), sdf(p+e.yxy)-sdf(p-e.yxy), sdf(p+e.yyx)-sdf(p-e.yyx)));
    col = vec3(0.5+0.5*dot(n, normalize(vec3(0.5,0.8,-0.4))));
  }
  o = vec4(col, 1.0);
}`;
  let nav;
  try {
    const { chromium } = await import(pathToFileURL(path.join(nm, 'playwright-core/index.mjs')).href);
    nav = await chromium.launch(opcoesNavegador({ swiftshader: true }));
    const pag = await nav.newPage({ viewport: { width: 540, height: 960 } });
    await pag.setContent('<canvas id="c" width="540" height="960"></canvas>');
    const r = await pag.evaluate((frag) => {
      const c = document.getElementById('c');
      const gl = c.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
      if (!gl) return { semWebgl2: true };
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const renderizador = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const extras = { floatFbo: !!gl.getExtension('EXT_color_buffer_float'), halfFbo: !!gl.getExtension('EXT_color_buffer_half_float') };
      const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\nvoid main(){ vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      gl.uniform2f(gl.getUniformLocation(prog, 'R'), c.width, c.height);
      const tl = gl.getUniformLocation(prog, 'T');
      const px = new Uint8Array(4);
      const quadro = (i) => { gl.uniform1f(tl, i * 0.1); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
      const t0 = performance.now(); quadro(0); const primeiro = performance.now() - t0; // compila e aquece
      const tempos = [];
      const limite = performance.now() + (primeiro > 1500 ? 4000 : 2500);
      for (let i = 1; i <= 40 && performance.now() < limite; i++) { const a = performance.now(); quadro(i); tempos.push(performance.now() - a); }
      tempos.sort((a, b) => a - b);
      return { renderizador, extras, primeiro, n: tempos.length, mediana: tempos.length ? tempos[tempos.length >> 1] : primeiro };
    }, FRAG);
    if (r.semWebgl2) falta('o Chrome não abriu WebGL2', 'Atualize o Chrome e os drivers da placa; confira chrome://gpu. Em alguns Linux use "gpu": "swiftshader" no estudio.config.json (lento).');
    else {
      const software = /swiftshader|llvmpipe|software|softpipe/i.test(r.renderizador);
      ok(`WebGL2 ativo (backend ${backendGpu()})`, r.renderizador);
      if (software) aviso('o Chrome está desenhando por software, sem usar a placa de vídeo', 'O render vai ser dezenas de vezes mais lento. Confira chrome://gpu e o "gpu" do estudio.config.json.');
      if (r.extras.floatFbo || r.extras.halfFbo) ok('buffers de cor em ponto flutuante (o raio X da linha esportes usa)');
      else aviso('sem buffers de cor em ponto flutuante', 'A linha esportes com raio X pode não funcionar nesta máquina.');
      benchMs = r.mediana; // ms por quadro de 540×960; a referência foi medida do mesmo jeito
      ok(`teste de velocidade: ${r.mediana.toFixed(1)} ms por quadro (referência ${REFERENCIA.maquina}: ${REFERENCIA.benchMs} ms)`, `${r.n} quadros medidos`);
    }
  } catch (e) {
    falta('o teste de GPU falhou', String(e.message || e).split('\n')[0]);
  } finally {
    if (nav) await nav.close().catch(() => {});
  }
}

// 5. Voz
titulo('Voz e música (opcional)');
if (temVariavel('ELEVENLABS_API_KEY')) ok('chave da ElevenLabs encontrada (.env ou ambiente)');
else aviso('sem chave da ElevenLabs', 'Opcional: copie .env.example para .env e preencha. Sem ela use a voz-guia do sistema ou grave a sua.');

// 6. Estimativa
if (benchMs) {
  titulo(`Quanto custa um minuto de vídeo (${QPS} qps, 1080×1920)`);
  const fator = benchMs / REFERENCIA.benchMs;
  console.log(`  ${cor.dim}Estimativa grosseira: a medida dos autores (${REFERENCIA.maquina}) corrigida pela velocidade do teste acima (${fator.toFixed(1)}× o tempo deles).${cor.fim}`);
  for (const [nome, seg, arq] of REFERENCIA.linhas) {
    if (!fs.existsSync(path.join(RAIZ_PROJETO, arq))) continue; // só as linhas que este kit leva
    const min = (seg * fator * QPS * 60) / 60;
    console.log(`    ${nome.padEnd(42)} ~${min < 10 ? min.toFixed(1) : Math.round(min)} min de render por minuto de vídeo`);
  }
  if (fator > 15) aviso('esta máquina é muito mais lenta que a de referência', 'Prefira vídeos curtos e a qualidade "leve"; teste primeiro com 2 segundos.');
}

// Resumo
console.log('');
if (problemas.length) {
  console.log(`${cor.falta}Ainda não dá para renderizar:${cor.fim} ${problemas.length} item(ns) essencial(is) faltando (veja [FALTA] acima).`);
  process.exit(1);
}
console.log(`${cor.ok}Pronto para renderizar.${cor.fim}${avisos.length ? ` ${avisos.length} aviso(s) acima.` : ''}`);
for (const [arq, cmd, o_que] of [['estudio/treino/3d-toon/exemplo/timeline.json', 'exemplo:leve', '3 segundos de vídeo'], ['estudio/espaco/render.mjs', 'exemplo:espaco', '3 segundos de vídeo'], ['estudio/motor3d/render_episodio.mjs', 'exemplo:dramatica', '4 quadros'], ['estudio/esportes/render.mjs', 'exemplo:esportes', '2 segundos de vídeo']]) {
  if (fs.existsSync(path.join(RAIZ_PROJETO, arq))) console.log(`${cor.dim}Para testar o motor: npm run ${cmd} (${o_que})${cor.fim}`);
}
