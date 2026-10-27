// Ambiente do estúdio: acha o Chrome, escolhe o backend de GPU, lê a configuração.
// Só usa módulos do Node (nada a instalar), para o `doctor` rodar mesmo com a máquina em branco.
// Todos os renderizadores abrem o Chrome por aqui: `chromium.launch(opcoesNavegador({ ... }))`.
//
// Ordem para achar o Chrome: --chrome (argumento) > variável CHROME_PATH (ou .env) > "chrome" do
// estudio.config.json > procura nos lugares de costume do sistema.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ_PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// .env simples (CHAVE=valor); o que já está no ambiente do terminal vale mais.
function lerEnv() {
  const arq = path.join(RAIZ_PROJETO, '.env');
  const out = {};
  if (!fs.existsSync(arq)) return out;
  for (const linha of fs.readFileSync(arq, 'utf8').split(/\r?\n/)) {
    if (linha.trim().startsWith('#')) continue;
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}
const env = { ...lerEnv(), ...process.env };
export const temVariavel = (nome) => !!env[nome];

// Modo leve (padrão): o render roda em prioridade baixa, para o computador continuar utilizável enquanto o vídeo sai.
// O Chrome e o ffmpeg herdam a prioridade. Para desligar: ESTUDIO_PRIORIDADE=normal (no .env ou no terminal).
if (env.ESTUDIO_PRIORIDADE !== 'normal') {
  try { os.setPriority(0, os.constants.priority.PRIORITY_LOW); } catch { /* sem permissão: segue na prioridade normal */ }
}

const PADRAO = { chrome: null, ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', gpu: 'auto', canal: null }; // canal: { nome, url, texto } = chamada de inscrição em todo vídeo
function lerConfig() {
  const arq = path.join(RAIZ_PROJETO, 'estudio.config.json');
  if (!fs.existsSync(arq)) return { ...PADRAO };
  try { return { ...PADRAO, ...JSON.parse(fs.readFileSync(arq, 'utf8')) }; }
  catch (e) { throw new Error(`estudio.config.json não é um JSON válido: ${e.message}`); }
}
export const config = lerConfig();

// Programas de linha de comando (precisam estar no PATH, ou apontados por FFMPEG_PATH / config).
export const FFMPEG = env.FFMPEG_PATH || config.ffmpeg;
export const FFPROBE = env.FFPROBE_PATH || config.ffprobe;

function noPath(nome) {
  const win = process.platform === 'win32';
  for (const dir of (process.env.PATH || '').split(win ? ';' : ':')) {
    for (const ext of win ? ['.exe', '.cmd', ''] : ['']) {
      const c = path.join(dir, nome + ext);
      try { if (fs.statSync(c).isFile()) return c; } catch { /* segue */ }
    }
  }
  return null;
}

export function candidatosChrome() {
  const h = os.homedir();
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(h, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    ];
  }
  if (process.platform === 'win32') {
    const e = process.env;
    const rel = 'Google\\Chrome\\Application\\chrome.exe';
    return [e.PROGRAMFILES, e['PROGRAMFILES(X86)'], e.LOCALAPPDATA].filter(Boolean).map((b) => path.join(b, rel));
  }
  return [...['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].map(noPath), '/snap/bin/chromium'].filter(Boolean);
}

export function acharChrome(pedido) {
  const dados = [[pedido, 'o argumento --chrome'], [env.CHROME_PATH, 'CHROME_PATH'], [config.chrome, '"chrome" do estudio.config.json']];
  for (const [caminho, origem] of dados) {
    if (!caminho) continue;
    if (fs.existsSync(caminho)) return caminho;
    throw new Error(`Chrome não encontrado em "${caminho}" (veio de ${origem}). Corrija o caminho ou apague essa configuração para eu procurar sozinho.`);
  }
  for (const c of candidatosChrome()) if (fs.existsSync(c)) return c;
  throw new Error('Não achei o Google Chrome (nem o Chromium). Instale o Chrome ou diga onde ele está: CHROME_PATH=/caminho/do/chrome no .env, ou "chrome" no estudio.config.json.');
}

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
