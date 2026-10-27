// Voz-guia GRÁTIS do projeto e os tempos de cada palavra (linhas.json), para montar e conferir o vídeo antes
// de gastar com a voz final. No macOS usa o "say" (voz Luciana, ou a primeira voz em português do Brasil);
// no Windows, a voz do sistema (SAPI, de preferência Microsoft Maria); no Linux, o espeak-ng; sem nenhum, faz uma voz muda com tempos estimados (o vídeo sai igual, sem som de fala).
//   node estudio/espaco/ferramentas/voz_guia.mjs <projeto> [--voz Luciana] [--taxa 190] [--muda]
// Tempo de cada palavra: sintetiza os começos da frase ("E", "E se", "E se a"...) e mede onde cada um termina.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { args, pastaProjeto, lerRoteiro, montarLinhas, gravarJson, rodar, existe, duracao, trechoFalado, palavrasDe, FFMPEG } from './comum.mjs';

const A = args();
const pasta = pastaProjeto(A._[0]);
const roteiro = lerRoteiro(pasta);
const cfg = roteiro.voz_guia || {};
const VOZ = path.join(pasta, 'voz');
fs.rmSync(VOZ, { recursive: true, force: true });
fs.mkdirSync(VOZ, { recursive: true });

function motor() {
  if (A.muda) return { tipo: 'muda' };
  if (process.platform === 'darwin' && existe('say')) {
    const lista = rodar('say', ['-v', '?']);
    const pedida = A.voz || cfg.mac || 'Luciana';
    const tem = (n) => lista.split('\n').some((l) => l.startsWith(n + ' ') || l.startsWith(n + '\t'));
    let voz = tem(pedida) ? pedida : null;
    if (!voz) { const l = lista.split('\n').find((x) => /pt_BR/.test(x)); voz = l ? l.split(/\s{2,}|\s+\(/)[0].trim() : null; }
    if (!voz) console.log('AVISO: nenhuma voz em português do Brasil no macOS (Ajustes > Acessibilidade > Conteúdo Falado > Vozes do Sistema); usando a voz padrão');
    return { tipo: 'say', voz, taxa: +(A.taxa || cfg.taxa || 190) };
  }
  if (process.platform === 'win32') {
    // Windows: a voz do sistema (SAPI), de preferência uma em português do Brasil (Microsoft Maria vem com o pacote de idioma)
    const r = spawnSync('powershell', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices() | % { $_.VoiceInfo.Name + '|' + $_.VoiceInfo.Culture }"], { encoding: 'utf8' });
    const vozes = (r.stdout || '').split(/\r?\n/).filter(Boolean).map((l) => l.split('|'));
    if (!r.error && vozes.length) { const pt = vozes.find((v) => /pt-BR/i.test(v[1])) || vozes.find((v) => /^pt/i.test(v[1])); if (!pt) console.log('AVISO: o Windows não tem voz em português (Configurações > Hora e idioma > Fala); usando a primeira voz'); return { tipo: 'sapi', voz: (pt || vozes[0])[0] }; }
  }
  for (const b of ['espeak-ng', 'espeak']) if (existe(b)) return { tipo: 'espeak', bin: b, taxa: +(A.taxa || cfg.espeak || 165) };
  console.log('AVISO: sem voz do sistema (no Linux instale o espeak-ng); a voz-guia sai muda, com tempos estimados');
  return { tipo: 'muda' };
}
const M = motor();

function falar(texto, wav) {
  if (M.tipo === 'say') {
    const aiff = wav.replace(/\.wav$/, '.aiff');
    rodar('say', [...(M.voz ? ['-v', M.voz] : []), '-r', String(M.taxa), '-o', aiff, texto]);
    rodar(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-i', aiff, '-ar', '44100', '-ac', '1', wav]);
    fs.rmSync(aiff, { force: true });
  } else if (M.tipo === 'sapi') {
    const esc = (x) => x.replace(/'/g, "''");
    rodar('powershell', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoice('${esc(M.voz)}'); $s.SetOutputToWaveFile('${esc(wav)}'); $s.Speak('${esc(texto)}'); $s.Dispose()`]);
  } else if (M.tipo === 'espeak') {
    rodar(M.bin, ['-v', 'pt-br', '-s', String(M.taxa), '-w', wav, texto]);
  } else {
    const d = Math.max(0.6, texto.replace(/\s+/g, '').length / 14.5); // ~14,5 letras por segundo: fala calma
    rodar(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', d.toFixed(3), wav]);
  }
  return duracao(wav);
}

console.log(`voz-guia (${M.tipo === 'muda' ? 'muda' : M.voz || M.tipo}): ${roteiro.falas.length} falas; cada uma leva alguns segundos (mede onde cada palavra termina)`);
const tmp = path.join(VOZ, '_prefixo.wav');
const falas = [];
for (const f of roteiro.falas) {
  const wav = path.join(VOZ, `${f.id}.wav`);
  const dur = falar(f.texto, wav);
  const ws = f.pedacos.flatMap((p) => palavrasDe(p.bruto));
  let fins;
  if (M.tipo === 'muda' || A.rapido) {
    // sem voz (ou com pressa): divide a fala pelas letras de cada palavra, com uma folga nas vírgulas
    const pesos = ws.map((w) => w.length + 1.5 + (/[,.;:?!]$/.test(w) ? 2.5 : 0)); const tot = pesos.reduce((a, b) => a + b, 0);
    let a = 0; fins = pesos.map((p) => (a += (dur * p) / tot));
  } else {
    // fim de cada começo de frase, sem o silêncio do fim (que o "say" põe em todo arquivo)
    const todo = trechoFalado(wav);
    fins = [];
    for (let k = 1; k < ws.length; k++) { falar(ws.slice(0, k).join(' '), tmp); fins.push(trechoFalado(tmp).fim); }
    fins.push(todo.fim);
    // um começo curto demais ("E") sai soletrado e mais longo que o seguinte: de trás para a frente, ninguém passa do próximo
    for (let k = fins.length - 2; k >= 0; k--) fins[k] = Math.min(fins[k], fins[k + 1] - 0.06);
    for (let k = 0; k < fins.length; k++) fins[k] = Math.max(fins[k], (k ? fins[k - 1] : todo.ini) + 0.04);
    const esc = (todo.fim - todo.ini) / (fins[fins.length - 1] - todo.ini || 1);
    fins = fins.map((x) => todo.ini + (x - todo.ini) * esc);
    fins.ini = todo.ini;
  }
  const palavras = fins.map((fim, k) => ({ t0: k === 0 ? (fins.ini ?? 0.02) : fins[k - 1], t1: fim }));
  falas.push({ dur, palavras, arquivo: `voz/${f.id}.wav` });
  console.log(`${f.id.padEnd(4)} ${dur.toFixed(2)} s  ${f.texto}`);
}
fs.rmSync(tmp, { force: true });
const lin = montarLinhas(roteiro, falas);
lin.voz = M.tipo === 'muda' ? 'muda' : 'guia';
gravarJson(path.join(pasta, 'linhas.json'), lin);
console.log(`linhas.json: ${lin.linhas.length} falas, fala inteira em ${lin.total.toFixed(1)} s (voz ${lin.voz}${M.voz ? ': ' + M.voz : ''})`);
if (lin.total > 75) console.log('AVISO: passou de 75 s; corte primeiro as frases de transição');
