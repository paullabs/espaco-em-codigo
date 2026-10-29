// Ambiente do estúdio: acha o Chrome e o ffmpeg, escolhe o backend de GPU, lê a configuração.
// Só usa módulos do Node (nada a instalar), para o `doctor` e o `preparar` rodarem mesmo com a máquina em branco.
// Todos os renderizadores abrem o Chrome por aqui: `chromium.launch(opcoesNavegador({ ... }))`.
//
// Ordem para achar o Chrome: --chrome (argumento) > variável CHROME_PATH (ou .env) > "chrome" do estudio.config.json >
// os lugares de costume do sistema (Chrome, Chromium, Edge) > o Chromium que o `npm run preparar` baixou para este
// projeto (estudio/ferramentas_locais/navegador).
// Ordem para o ffmpeg e o ffprobe: FFMPEG_PATH / FFPROBE_PATH (ou .env) > "ffmpeg" / "ffprobe" do estudio.config.json
// (se a pessoa trocou o nome por um caminho) > PATH e os lugares de costume do sistema > a cópia que o
// `npm run preparar` baixou para este projeto (estudio/ferramentas_locais). Quem já tem os programas nunca baixa nada.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const RAIZ_PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Lê um arquivo de texto aceitando o que o Windows grava: UTF-8 com BOM (Bloco de Notas) e UTF-16 (PowerShell 5.1: echo X=1 > .env).
function lerTexto(arq) {
  const b = fs.readFileSync(arq);
  return (b[0] === 0xff && b[1] === 0xfe ? b.toString('utf16le') : b.toString('utf8')).replace(/^\uFEFF/, '');
}

// .env simples (CHAVE=valor); o que já está no ambiente do terminal vale mais.
function lerEnv() {
  const arq = path.join(RAIZ_PROJETO, '.env');
  const out = {};
  if (!fs.existsSync(arq)) return out;
  for (const linha of lerTexto(arq).split(/\r?\n/)) {
    if (linha.trim().startsWith('#')) continue;
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}
const env = { ...lerEnv(), ...process.env };
// o Windows não diferencia maiúsculas de minúsculas nos nomes, e `set CHROME_PATH="C:\..."` deixa as aspas no valor
const lerVar = (nome) => { const k = Object.keys(env).find((x) => x.toLowerCase() === nome.toLowerCase()); return k == null ? undefined : String(env[k]).trim().replace(/^(['"])(.*)\1$/, '$2'); };
export const temVariavel = (nome) => !!lerVar(nome);

// Modo leve (padrão): o render roda em prioridade baixa, para o computador continuar utilizável enquanto o vídeo sai.
// O Chrome e o ffmpeg herdam a prioridade. Para desligar: ESTUDIO_PRIORIDADE=normal (no .env ou no terminal).
if (lerVar('ESTUDIO_PRIORIDADE') !== 'normal') {
  try { os.setPriority(0, process.platform === 'win32' ? os.constants.priority.PRIORITY_BELOW_NORMAL : os.constants.priority.PRIORITY_LOW); } catch { /* sem permissão: segue na prioridade normal */ }
}

const PADRAO = { chrome: null, ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', gpu: 'auto', canal: null }; // canal: { nome, url, texto } = chamada de inscrição em todo vídeo
function lerConfig() {
  const arq = path.join(RAIZ_PROJETO, 'estudio.config.json');
  if (!fs.existsSync(arq)) return { ...PADRAO };
  try { return { ...PADRAO, ...JSON.parse(lerTexto(arq)) }; }
  catch (e) { throw new Error(`estudio.config.json não é um JSON válido: ${e.message}`); }
}
export const config = lerConfig();

// ESTUDIO_IGNORAR=ffmpeg,chrome faz de conta que o sistema não tem esses programas: o estúdio passa a usar só as cópias
// deste projeto (e o `preparar` baixa as que faltarem). Serve para testar e para quem quer o projeto isolado do sistema.
const IGNORAR = new Set(String(lerVar('ESTUDIO_IGNORAR') || '').toLowerCase().split(/[,\s]+/).filter(Boolean));
export const ignorando = (nome) => IGNORAR.has(nome);

// Onde o `npm run preparar` guarda o que baixa (tudo dentro do projeto; nada de instalação no sistema).
export const PASTA_LOCAL = path.join(RAIZ_PROJETO, 'estudio', 'ferramentas_locais');
export const PASTA_NAVEGADOR_LOCAL = path.join(PASTA_LOCAL, 'navegador');

// As funções de busca recebem sistema, ambiente e "existe" como parâmetros (com o valor desta máquina por padrão),
// para os testes conferirem o que acontece no Windows e no Linux sem precisar de uma máquina de cada.
const caminhoDe = (plataforma) => (plataforma === 'win32' ? path.win32 : path.posix);
const variavel = (e, nome) => { const k = Object.keys(e).find((x) => x.toLowerCase() === nome.toLowerCase()); return k ? e[k] : undefined; };
const ehArquivo = (c) => { try { return fs.statSync(c).isFile(); } catch { return false; } };

// Pastas onde os instaladores costumam deixar programas e que nem sempre estão no PATH de um aplicativo aberto pelo Dock
// ou pelo Menu Iniciar (Homebrew, MacPorts, winget, Chocolatey, Scoop).
export function pastasExtras(plataforma = process.platform, e = process.env, casa = os.homedir()) {
  const P = caminhoDe(plataforma);
  if (plataforma === 'darwin') return ['/opt/homebrew/bin', '/usr/local/bin', '/opt/local/bin', P.join(casa, '.local', 'bin')];
  if (plataforma === 'win32') {
    const local = variavel(e, 'LOCALAPPDATA'), dados = variavel(e, 'ProgramData'), perfil = variavel(e, 'USERPROFILE') || casa;
    return [local && P.join(local, 'Microsoft', 'WinGet', 'Links'), dados && P.join(dados, 'chocolatey', 'bin'), perfil && P.join(perfil, 'scoop', 'shims'), 'C:\\ffmpeg\\bin'].filter(Boolean);
  }
  return ['/usr/local/bin', '/usr/bin', '/snap/bin', P.join(casa, '.local', 'bin')];
}

// Procura um programa no PATH e nos lugares de costume. Devolve o caminho completo ou null.
export function acharNoPath(nome, plataforma = process.platform, e = process.env, existe = ehArquivo) {
  const P = caminhoDe(plataforma);
  const win = plataforma === 'win32';
  const doPath = String(variavel(e, 'PATH') || '').split(win ? ';' : ':').map((d) => d.replace(/^"|"$/g, '')).filter(Boolean);
  for (const dir of [...doPath, ...pastasExtras(plataforma, e)]) {
    for (const ext of win ? ['.exe'] : ['']) {
      const c = P.join(dir, nome + ext);
      if (existe(c)) return c;
    }
  }
  return null;
}

// ffmpeg e ffprobe que o `preparar` instalou em estudio/ferramentas_locais (pacotes @ffmpeg-installer e @ffprobe-installer,
// um por sistema e processador: darwin-arm64, win32-x64, linux-x64...).
export function binarioLocal(nome, plataforma = process.platform, arquitetura = process.arch, base = PASTA_LOCAL, existe = ehArquivo) {
  const pacote = { ffmpeg: '@ffmpeg-installer', ffprobe: '@ffprobe-installer' }[nome];
  if (!pacote) return null;
  const c = caminhoDe(plataforma).join(base, 'node_modules', pacote, `${plataforma}-${arquitetura}`, nome + (plataforma === 'win32' ? '.exe' : ''));
  return existe(c) ? c : null;
}

// Chromium que o `preparar` baixou para este projeto (a pasta chromium-NNNN mais nova). Só vale se a instalação terminou: o Playwright
// grava o arquivo INSTALLATION_COMPLETE no fim, então uma pasta sem ele é um download interrompido (o chrome pode existir sem as outras peças).
export function navegadorLocal(plataforma = process.platform, base = PASTA_NAVEGADOR_LOCAL, existe = ehArquivo, listar = (d) => fs.readdirSync(d)) {
  let pastas;
  try { pastas = listar(base).filter((n) => /^chromium-\d+$/.test(n)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9))); } catch { return null; }
  const relativos = plataforma === 'darwin'
    ? ['chrome-mac', 'chrome-mac-arm64'].map((d) => [d, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'])
    : plataforma === 'win32'
      ? ['chrome-win', 'chrome-win64'].map((d) => [d, 'chrome.exe'])
      : ['chrome-linux', 'chrome-linux64'].map((d) => [d, 'chrome']);
  const P = caminhoDe(plataforma);
  for (const pasta of pastas) {
    if (!existe(P.join(base, pasta, 'INSTALLATION_COMPLETE'))) continue;
    for (const r of relativos) { const c = P.join(base, pasta, ...r); if (existe(c)) return c; }
  }
  return null;
}

// Navegadores já instalados no sistema, em ordem de preferência: Chrome, Chromium, Edge (o Windows já vem com o Edge).
export function candidatosChrome(plataforma = process.platform, e = process.env, casa = os.homedir(), existe = ehArquivo) {
  const P = caminhoDe(plataforma);
  if (plataforma === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      P.join(casa, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    ];
  }
  if (plataforma === 'win32') {
    const bases = ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA'].map((n) => variavel(e, n)).filter(Boolean);
    return [
      ...bases.map((b) => P.join(b, 'Google', 'Chrome', 'Application', 'chrome.exe')),
      ...bases.map((b) => P.join(b, 'Microsoft', 'Edge', 'Application', 'msedge.exe')),
    ];
  }
  const nomes = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
  return [...nomes.map((n) => acharNoPath(n, plataforma, e, existe)), '/snap/bin/chromium'].filter(Boolean);
}

// o caminho está dentro de estudio/ferramentas_locais? (para dizer "cópia do projeto" ou "do computador")
export function dentroDoLocal(caminho) {
  const r = path.relative(PASTA_LOCAL, path.resolve(caminho));
  return !!r && !r.startsWith('..') && !path.isAbsolute(r);
}

export function acharChrome(pedido) {
  const dados = [[pedido, 'o argumento --chrome'], [lerVar('CHROME_PATH'), 'CHROME_PATH'], [config.chrome, '"chrome" do estudio.config.json']];
  for (const [caminho, origem] of dados) {
    if (!caminho) continue;
    if (ehArquivo(caminho)) return caminho;
    throw new Error(`Chrome não encontrado em "${caminho}" (veio de ${origem}). Corrija o caminho ou apague essa configuração para eu procurar sozinho.`);
  }
  if (!IGNORAR.has('chrome')) for (const c of candidatosChrome()) if (ehArquivo(c)) return c;
  const local = navegadorLocal();
  if (local) return local;
  throw new Error('Não achei o Google Chrome, o Chromium nem o Edge. Rode "npm run preparar": ele baixa um navegador só para este projeto. Ou diga onde está o seu: CHROME_PATH=/caminho/do/chrome no .env, ou "chrome" no estudio.config.json.');
}

const roda = (caminho) => { const r = spawnSync(caminho, ['-version'], { stdio: 'ignore', timeout: 20000 }); return r.status === 0 && !r.error; };
const temX264 = (caminho) => {
  const r = spawnSync(caminho, ['-hide_banner', '-encoders'], { encoding: 'utf8', timeout: 20000 });
  return /\blibx264\b/.test(`${r.stdout || ''}${r.stderr || ''}`);
};

// ffmpeg / ffprobe: { caminho, origem }, com origem 'variável de ambiente', 'estudio.config.json', 'sistema', 'projeto' ou null (não achou).
export function acharPrograma(nome) {
  const pedidoEnv = lerVar(nome === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH');
  const pedidoConfig = nome === 'ffmpeg' ? config.ffmpeg : config.ffprobe;
  if (pedidoEnv) return { caminho: pedidoEnv, origem: 'variável de ambiente' };
  if (pedidoConfig && pedidoConfig !== nome) return { caminho: pedidoConfig, origem: 'estudio.config.json' };
  // quem escolheu o ffmpeg quase sempre tem o ffprobe na mesma pasta (é assim que os dois vêm instalados)
  if (nome === 'ffprobe') {
    const escolhido = lerVar('FFMPEG_PATH') || (config.ffmpeg !== 'ffmpeg' ? config.ffmpeg : null);
    const irmao = escolhido && path.join(path.dirname(escolhido), 'ffprobe' + (process.platform === 'win32' ? '.exe' : ''));
    if (irmao && ehArquivo(irmao)) return { caminho: irmao, origem: 'ao lado do ffmpeg escolhido' };
  }
  const local = binarioLocal(nome);
  let sistema = IGNORAR.has('ffmpeg') || IGNORAR.has(nome) ? null : acharNoPath(nome);
  // um programa do sistema que nem abre (atalho quebrado, por exemplo) não serve: se o projeto tem a cópia, ela passa na frente
  if (sistema && local && !roda(sistema)) sistema = null;
  // um ffmpeg do sistema sem libx264 não serve para o render: se o projeto tem a cópia dele, ela passa na frente
  if (sistema && local && nome === 'ffmpeg' && !temX264(sistema)) return { caminho: local, origem: 'projeto' };
  if (sistema) return { caminho: sistema, origem: 'sistema' };
  if (local) return { caminho: local, origem: 'projeto' };
  // não achou. Com o sistema ignorado, o nome puro seria achado pelo PATH do próprio sistema operacional, então devolvemos um nome que não existe.
  return { caminho: IGNORAR.has('ffmpeg') || IGNORAR.has(nome) ? `${nome}-ignorado` : (pedidoConfig || nome), origem: null };
}

// Programas de linha de comando.
const _ffmpeg = acharPrograma('ffmpeg');
const _ffprobe = acharPrograma('ffprobe');
export const FFMPEG = _ffmpeg.caminho;
export const FFPROBE = _ffprobe.caminho;
export const ORIGEM_PROGRAMAS = { ffmpeg: _ffmpeg.origem, ffprobe: _ffprobe.origem };

// Backend de GPU do Chrome (ANGLE). macOS: Metal; Windows: Direct3D 11; Linux: OpenGL.
// Só o macOS com chip Apple foi testado pelos autores. Para outro, ajuste "gpu" no estudio.config.json
// (metal, d3d11, gl, vulkan) ou use "swiftshader" (por software: roda em qualquer máquina, muito mais lento).
const ANGLE_DO_SISTEMA = { darwin: 'metal', win32: 'd3d11', linux: 'gl' };
export function backendGpu() {
  return config.gpu && config.gpu !== 'auto' ? config.gpu : (ANGLE_DO_SISTEMA[process.platform] || 'gl');
}

// Opções para `chromium.launch(...)`. Em macOS os argumentos saem iguais aos que os renderizadores
// já usavam: `gpu: false` tira as flags de GPU, `swiftshader: true` aceita o software como reserva,
// `extras` soma flags da página (por exemplo autoplay).
export function opcoesNavegador({ chrome, gpu = true, swiftshader = false, extras = [] } = {}) {
  return {
    executablePath: acharChrome(chrome),
    headless: true,
    args: [
      ...(gpu ? [`--use-angle=${backendGpu()}`, '--enable-gpu', '--ignore-gpu-blocklist'] : []),
      ...(swiftshader ? ['--enable-unsafe-swiftshader'] : []),
      ...extras,
    ],
  };
}
