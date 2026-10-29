#!/usr/bin/env node
// npm run preparar: deixa este computador pronto para o estúdio, no Mac e no Windows.
// Confere o que já está instalado (Node, pacotes, ffmpeg, navegador), mostra o que falta e, com o seu sim, baixa só isso.
// Nada de administrador e nada fora da pasta do projeto: o que falta vai para estudio/ferramentas_locais e estudio/motor3d.
// Quem já tem ffmpeg, Chrome, Chromium ou Edge instalados não baixa nada.
//
//   node estudio/preparar.mjs              confere, mostra o plano e pergunta (se estiver num terminal)
//   node estudio/preparar.mjs --simular    só confere e mostra o plano (não instala nada)
//   node estudio/preparar.mjs --sim        instala o que falta sem perguntar (use depois de ter o sim da pessoa)
//   node estudio/preparar.mjs --json       a conferência em JSON (para scripts e para o Claude Code); não instala
//   node estudio/preparar.mjs --sem-doctor não roda o doctor no fim
// Códigos de saída: 0 pronto, 1 algo falhou ou precisa de você, 2 uso errado, 4 há o que instalar e ninguém disse sim.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_PROJETO, PASTA_NAVEGADOR_LOCAL, acharChrome, acharPrograma, binarioLocal, dentroDoLocal } from './ambiente.mjs';

const ARGS = process.argv.slice(2);
const CONHECIDOS = new Set(['--simular', '--sim', '--json', '--sem-doctor', '--ajuda', '-h']);
const win = process.platform === 'win32';
const SISTEMA = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[process.platform] || process.platform;
const rel = (p) => path.relative(RAIZ_PROJETO, p).split(path.sep).join('/');

if (ARGS.includes('--ajuda') || ARGS.includes('-h')) {
  const linhas = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1);
  console.log(linhas.slice(0, linhas.findIndex((l) => !l.startsWith('//'))).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
const desconhecidos = ARGS.filter((a) => !CONHECIDOS.has(a));
if (desconhecidos.length) { console.error(`Opção desconhecida: ${desconhecidos.join(' ')}. Veja: node estudio/preparar.mjs --ajuda`); process.exit(2); }
const A = new Set(ARGS);
const JSON_ = A.has('--json');

// A pasta do plugin (cópia guardada pelo Claude Code) não é um projeto: o que baixássemos ali sumiria na próxima atualização.
if (/[\\/]plugins[\\/]cache[\\/]/.test(RAIZ_PROJETO)) {
  console.error('Esta é a pasta do plugin, não a de um projeto. Crie o projeto numa pasta sua (skill novo-projeto) e rode o preparar de lá.');
  process.exit(2);
}
if (!fs.existsSync(path.join(RAIZ_PROJETO, 'estudio', 'motor3d', 'package.json'))) {
  console.error(`Não achei estudio/motor3d/package.json em ${RAIZ_PROJETO}. Rode isto dentro da pasta do projeto.`);
  process.exit(2);
}

const rodar = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 20000 });
  return { ok: r.status === 0 && !r.error, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
};

// o que a pessoa faz à mão quando o download automático não pode rodar (rede fechada, por exemplo)
const MANUAL = {
  pacotes: { darwin: 'npm --prefix estudio/motor3d install   (dentro da pasta do projeto, com internet)', win32: 'npm --prefix estudio\\motor3d install   (dentro da pasta do projeto, com internet; no PowerShell, npm.cmd)', linux: 'npm --prefix estudio/motor3d install   (dentro da pasta do projeto, com internet)' },
  node: { darwin: 'brew install node   (ou o instalador de nodejs.org)', win32: 'winget install --id OpenJS.NodeJS.LTS -e   (ou o instalador de nodejs.org); depois feche e abra o terminal', linux: 'o gerenciador de pacotes da sua distribuição, ou nodejs.org' },
  ffmpeg: { darwin: 'brew install ffmpeg', win32: 'winget install --id Gyan.FFmpeg -e   (depois feche e abra o terminal)', linux: 'sudo apt install ffmpeg   (ou o gerenciador da sua distribuição)' },
  navegador: { darwin: 'brew install --cask google-chrome   (ou baixe em google.com/chrome)', win32: 'o Edge já vem com o Windows; ou: winget install --id Google.Chrome -e', linux: 'sudo apt install chromium   (ou o gerenciador da sua distribuição)' },
};
const manual = (id) => MANUAL[id][process.platform] || MANUAL[id].linux;

const nomeDoNavegador = (c) => (/msedge|Microsoft Edge/i.test(c) ? 'Microsoft Edge' : /chromium/i.test(c) ? 'Chromium' : 'Google Chrome');

function detectar() {
  const itens = [];

  const major = Number(process.versions.node.split('.')[0]);
  itens.push(major >= 18
    ? { id: 'node', nome: `Node ${process.versions.node}`, ok: true }
    : { id: 'node', nome: `Node ${process.versions.node} (é antigo, precisa do 18 ou mais novo)`, ok: false, manual: manual('node') });

  const nm = path.join(RAIZ_PROJETO, 'estudio', 'motor3d', 'node_modules');
  const faltam = ['playwright-core', 'three'].filter((p) => !fs.existsSync(path.join(nm, p, 'package.json')));
  const atalho = fs.existsSync(path.join(RAIZ_PROJETO, 'estudio', 'node_modules', 'three', 'package.json'));
  if (!faltam.length && atalho) itens.push({ id: 'pacotes', nome: 'Pacotes do estúdio (three.js e Playwright)', ok: true });
  else itens.push({ id: 'pacotes', nome: 'Pacotes do estúdio (three.js e Playwright)', ok: false, motivo: faltam.length ? `faltam: ${faltam.join(', ')}` : 'falta o atalho estudio/node_modules', falta: { titulo: 'Baixar o three.js e o Playwright', tamanho: 'uns 40 MB', onde: 'estudio/motor3d/node_modules' } });

  const ff = acharPrograma('ffmpeg');
  const fp = acharPrograma('ffprobe');
  const vff = rodar(ff.caminho, ['-hide_banner', '-version']);
  const x264 = vff.ok && /\blibx264\b/.test(rodar(ff.caminho, ['-hide_banner', '-encoders']).out);
  const vfp = rodar(fp.caminho, ['-hide_banner', '-version']);
  const explicito = (o) => o === 'variável de ambiente' || o === 'estudio.config.json';
  const NOME_FF = 'ffmpeg (com libx264) e ffprobe';
  const ffRuim = explicito(ff.origem) && !(vff.ok && x264); // o ffmpeg que a pessoa escolheu não serve
  const fpRuim = explicito(fp.origem) && !vfp.ok; // o ffprobe que a pessoa escolheu não funciona
  if (vff.ok && x264 && vfp.ok) {
    itens.push({ id: 'ffmpeg', nome: NOME_FF, ok: true, origem: ff.origem, detalhe: `${vff.out.split('\n')[0].replace(/ Copyright.*/, '')} — ${ff.origem === 'projeto' ? 'cópia deste projeto' : ff.origem === 'sistema' ? 'já instalado no computador' : `de ${ff.origem}`} (${ff.caminho})` });
  } else if (ffRuim || fpRuim) {
    const motivo = ffRuim ? `o ffmpeg escolhido por você (${ff.caminho}, de ${ff.origem}) não funciona ou não tem libx264` : `o ffprobe escolhido por você (${fp.caminho}, de ${fp.origem}) não funciona`;
    itens.push({ id: 'ffmpeg', nome: NOME_FF, ok: false, motivo, manual: 'corrija FFMPEG_PATH / FFPROBE_PATH no .env (ou "ffmpeg" / "ffprobe" no estudio.config.json), ou apague essas linhas para o estúdio procurar sozinho' });
  } else {
    const motivo = !vff.ok ? 'ffmpeg não encontrado' : !x264 ? 'o ffmpeg do computador não tem o codificador libx264' : 'ffprobe não encontrado';
    // não existe cópia pronta para o Windows em processador ARM (o ffmpeg para x64 roda lá por emulação, mas o npm não o instala nesse caso)
    if (win && process.arch === 'arm64') itens.push({ id: 'ffmpeg', nome: NOME_FF, ok: false, motivo, manual: manual('ffmpeg') });
    else itens.push({ id: 'ffmpeg', nome: NOME_FF, ok: false, motivo, falta: { titulo: 'Baixar o ffmpeg e o ffprobe (a cópia fica só neste projeto)', tamanho: 'uns 50 MB', onde: 'estudio/ferramentas_locais' } });
  }

  let nav = null, erro = null;
  try { nav = acharChrome(); } catch (e) { erro = e.message; }
  if (nav) {
    const doProjeto = dentroDoLocal(nav);
    itens.push({ id: 'navegador', nome: 'Navegador (Chrome, Chromium ou Edge)', ok: true, origem: doProjeto ? 'projeto' : 'sistema', detalhe: `${doProjeto ? 'Chromium, cópia deste projeto' : `${nomeDoNavegador(nav)}, já instalado no computador`} (${nav})` });
  } else if (/^Chrome não encontrado em/.test(erro || '')) {
    itens.push({ id: 'navegador', nome: 'Navegador (Chrome, Chromium ou Edge)', ok: false, motivo: erro, manual: 'corrija CHROME_PATH no .env (ou "chrome" no estudio.config.json), ou apague essa linha para o estúdio procurar sozinho' });
  } else {
    itens.push({ id: 'navegador', nome: 'Navegador (Chrome, Chromium ou Edge)', ok: false, motivo: 'nenhum navegador encontrado', falta: { titulo: 'Baixar o Chromium (o navegador que o estúdio abre sem janela; a cópia fica só neste projeto)', tamanho: 'uns 300 MB', onde: rel(PASTA_NAVEGADOR_LOCAL) } });
  }
  return itens;
}

// ---- instalação
function passo(cmd, args, extraEnv = {}) {
  const opc = { cwd: RAIZ_PROJETO, stdio: 'inherit', env: { ...process.env, ...extraEnv } };
  // no Windows o npm é um .cmd, que o Node só abre por um shell; uma linha só (sem lista de argumentos) evita o aviso DEP0190 do Node 24
  const r = win && cmd === 'npm' ? spawnSync([cmd, ...args].join(' '), { ...opc, shell: true }) : spawnSync(cmd, args, opc);
  return r.status === 0 && !r.error;
}
const INSTALAR = {
  pacotes: () => passo(process.execPath, [path.join('estudio', 'instalar.mjs')]),
  ffmpeg: () => {
    const ok = passo('npm', ['--prefix', path.join('estudio', 'ferramentas_locais'), 'install', '--no-audit', '--no-fund']);
    // alguns npm novos não rodam o chmod que o pacote pede; garantimos que os binários são executáveis
    if (!win) for (const n of ['ffmpeg', 'ffprobe']) { const c = binarioLocal(n); if (c) try { fs.chmodSync(c, 0o755); } catch { /* segue */ } }
    return ok;
  },
  navegador: () => {
    const cli = path.join(RAIZ_PROJETO, 'estudio', 'motor3d', 'node_modules', 'playwright-core', 'cli.js');
    if (!fs.existsSync(cli)) { console.error('Faltam os pacotes do estúdio (playwright-core); eles são instalados antes do navegador.'); return false; }
    fs.mkdirSync(PASTA_NAVEGADOR_LOCAL, { recursive: true });
    return passo(process.execPath, [cli, 'install', 'chromium', '--no-shell'], { PLAYWRIGHT_BROWSERS_PATH: PASTA_NAVEGADOR_LOCAL });
  },
};
const ORDEM = ['pacotes', 'ffmpeg', 'navegador'];

function mostrar(itens) {
  for (const i of itens) {
    console.log(`  ${i.ok ? '✔' : '✖'} ${i.nome}${i.ok && i.detalhe ? ` — ${i.detalhe}` : ''}${!i.ok && i.motivo ? ` — ${i.motivo}` : ''}`);
    if (!i.ok && i.manual) console.log(`      Faça à mão: ${i.manual}`);
  }
}

let itens = detectar();
const aInstalar = () => itens.filter((i) => !i.ok && i.falta);
const semSolucao = () => itens.filter((i) => !i.ok && !i.falta);

if (JSON_) {
  console.log(JSON.stringify({ sistema: SISTEMA, plataforma: process.platform, arquitetura: process.arch, pronto: itens.every((i) => i.ok), itens: itens.map(({ id, ok, nome, origem, detalhe, motivo, falta, manual: m }) => ({ id, ok, nome, origem, detalhe, motivo, falta, manual: m })) }, null, 2));
  process.exit(0);
}

console.log(`Conferindo este computador (${SISTEMA}, ${process.arch})...`);
mostrar(itens);

if (!aInstalar().length && !semSolucao().length) {
  console.log('\nTudo o que o estúdio precisa já está aí. Nada a instalar.');
} else if (!aInstalar().length) {
  console.log('\nNão consigo resolver sozinho o que está marcado com ✖ acima; faça o que está indicado e rode de novo.');
  process.exit(1);
} else {
  console.log('\nFalta baixar (tudo vai para a pasta deste projeto; não pede senha de administrador e não mexe no resto do computador):');
  aInstalar().forEach((i, n) => console.log(`  ${n + 1}. ${i.falta.titulo} — ${i.falta.tamanho}, em ${i.falta.onde}`));
  if (A.has('--simular')) { console.log('\n(simulação: nada foi instalado. Para instalar: node estudio/preparar.mjs --sim)'); process.exit(0); }
  if (!A.has('--sim')) {
    if (!process.stdin.isTTY) { console.log('\nNada foi instalado: preciso do seu sim. Rode de novo com --sim (o Git Bash do Windows também cai aqui; lá use --sim).'); process.exit(4); }
    const { default: readline } = await import('node:readline/promises'); // só aqui: num Node muito antigo o aviso "Node é antigo" acima ainda aparece
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const r = (await rl.question('\nPosso baixar isso agora? (s/n) ')).trim().toLowerCase();
    rl.close();
    if (!/^(s|sim|y|yes)$/.test(r)) { console.log('Tudo bem, não baixei nada.'); process.exit(1); }
  }

  console.log('\nIsto pode levar alguns minutos, conforme a internet. Se for interrompido, rode de novo: ele confere tudo outra vez e refaz o que ficou pela metade.');
  const falhou = [];
  for (const id of ORDEM) {
    if (!aInstalar().some((i) => i.id === id)) continue;
    console.log(`\n▶ ${itens.find((i) => i.id === id).falta.titulo}...`);
    if (!INSTALAR[id]()) falhou.push(id);
    itens = detectar();
  }
  console.log('\nDepois da instalação:');
  mostrar(itens);
  const ainda = itens.filter((i) => !i.ok);
  if (ainda.length) {
    console.log('\nAinda falta:');
    for (const i of ainda) console.log(`  - ${i.nome}: ${i.manual || manual(i.id)}`);
    console.log('Se a sua rede bloqueia downloads, use os comandos acima e rode "npm run preparar" de novo.');
    process.exit(1);
  }
}

if (!A.has('--sem-doctor')) {
  console.log('\nConferindo a placa de vídeo e o resto (npm run doctor)...\n');
  const d = spawnSync(process.execPath, [path.join('estudio', 'doctor.mjs')], { cwd: RAIZ_PROJETO, stdio: 'inherit' });
  process.exit(d.status === 0 ? 0 : 1);
}
