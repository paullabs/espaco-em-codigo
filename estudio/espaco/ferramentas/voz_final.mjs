// Voz final do projeto na ElevenLabs, com a CHAVE DA PRÓPRIA PESSOA (no .env da raiz do projeto):
//   ELEVENLABS_API_KEY=...        a chave (elevenlabs.io > Developers > API Keys)
//   ELEVENLABS_VOZ_ID=...         a voz escolhida (Voices > a voz > ID); ou "voz_final": { "id": "..." } no roteiro.json
//   node estudio/espaco/ferramentas/voz_final.mjs <projeto>               só mostra quantos caracteres (créditos) vai gastar
//   node estudio/espaco/ferramentas/voz_final.mjs <projeto> --confirmo    gera: UMA tomada por fala, sem variações
//   node estudio/espaco/ferramentas/voz_final.mjs <projeto> --simular     testa o caminho sem internet (usa a voz-guia)
// Cada fala vem com o tempo de cada letra (endpoint with-timestamps), então os tempos de cada palavra saem exatos,
// sem Whisper. O linhas.json da voz-guia fica guardado em linhas_guia.json.
import fs from 'node:fs';
import path from 'node:path';
import { args, pastaProjeto, lerRoteiro, lerJson, montarLinhas, gravarJson, rodar, duracao, palavrasDe, FFMPEG, RAIZ_PROJETO, sair } from './comum.mjs';

const A = args();
const nome = A._[0];
const pasta = pastaProjeto(nome);
const roteiro = lerRoteiro(pasta);
const cfg = roteiro.voz_final || {};
function lerEnv() {
  const out = {};
  const arq = path.join(RAIZ_PROJETO, '.env');
  if (fs.existsSync(arq)) for (const l of fs.readFileSync(arq, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#')) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2'); }
  return { ...out, ...process.env };
}
const env = lerEnv();
const CHAVE = env.ELEVENLABS_API_KEY, VOZ = cfg.id || env.ELEVENLABS_VOZ_ID, MODELO = cfg.modelo || env.ELEVENLABS_MODELO || 'eleven_multilingual_v2';
const caracteres = roteiro.falas.reduce((a, f) => a + f.texto.length, 0);

if (!A.simular && !A.confirmo) {
  console.log(`voz final de "${roteiro.titulo || nome}": ${roteiro.falas.length} falas, ${caracteres} caracteres (no ${MODELO}, ~1 crédito por caractere; uma tomada por fala, sem variações).`);
  console.log(CHAVE ? 'chave: ok (.env)' : 'chave: FALTA ELEVENLABS_API_KEY no .env da raiz do projeto');
  console.log(VOZ ? `voz: ${VOZ}` : 'voz: FALTA ELEVENLABS_VOZ_ID no .env (ou "voz_final": { "id": "..." } no roteiro.json)');
  console.log(`para gerar, com o sim de quem paga: npm run video -- voz-final ${nome} --confirmo`);
  process.exit(0);
}
if (!A.simular && (!CHAVE || !VOZ)) sair('falta a chave ou a voz no .env (ELEVENLABS_API_KEY e ELEVENLABS_VOZ_ID); veja o .env.example');

const SAI = path.join(pasta, 'voz_final');
fs.mkdirSync(SAI, { recursive: true });
const guia = fs.existsSync(path.join(pasta, 'linhas.json')) ? lerJson(path.join(pasta, 'linhas.json')) : null;

async function pedir(f, i) {
  if (A.simular) {
    // sem internet: monta a mesma resposta da API a partir da voz-guia (tempo de cada letra espalhado na palavra)
    if (!guia || guia.voz === 'final') sair('para simular, rode antes a voz-guia (npm run video -- voz ' + nome + ')');
    const l = guia.linhas.find((x) => x.id === f.id);
    const ws = l.pedacos.flatMap((p) => p.palavras);
    const chars = [], ini = [], fim = [];
    ws.forEach((w, k) => {
      const t = palavrasDe(f.pedacos.map((p) => p.bruto).join(' '))[k];
      for (let c = 0; c < t.length; c++) { chars.push(t[c]); ini.push(w.t0 - l.t0 + ((w.t1 - w.t0) * c) / t.length); fim.push(w.t0 - l.t0 + ((w.t1 - w.t0) * (c + 1)) / t.length); }
      if (k < ws.length - 1) { chars.push(' '); ini.push(w.t1 - l.t0); fim.push(w.t1 - l.t0); }
    });
    return { audio: fs.readFileSync(path.join(pasta, l.arquivo)), ext: 'wav', alinhamento: { characters: chars, character_start_times_seconds: ini, character_end_times_seconds: fim } };
  }
  const corpo = {
    text: f.texto, model_id: MODELO,
    voice_settings: { stability: cfg.estabilidade ?? 0.45, similarity_boost: cfg.semelhanca ?? 0.8, style: cfg.estilo ?? 0.2, use_speaker_boost: true },
    previous_text: i > 0 ? roteiro.falas[i - 1].texto : undefined, next_text: roteiro.falas[i + 1] ? roteiro.falas[i + 1].texto : undefined,
  };
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOZ)}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    if (r.ok) { const j = await r.json(); return { audio: Buffer.from(j.audio_base64, 'base64'), ext: 'mp3', alinhamento: j.alignment || j.normalized_alignment }; }
    const txt = (await r.text()).slice(0, 400);
    if (r.status === 401) sair('a ElevenLabs recusou a chave (401): confira ELEVENLABS_API_KEY no .env');
    if (r.status === 402 || /quota|credits/i.test(txt)) sair('sem créditos na ElevenLabs para esta fala: ' + txt);
    if (r.status === 404) sair('voz não encontrada (404): confira ELEVENLABS_VOZ_ID');
    if (r.status === 429 || r.status >= 500) { console.log(`  a ElevenLabs pediu calma (${r.status}); tento de novo em ${tentativa * 4} s`); await new Promise((ok) => setTimeout(ok, tentativa * 4000)); continue; }
    sair(`a ElevenLabs respondeu ${r.status}: ${txt}`);
  }
  sair('a ElevenLabs não respondeu depois de 3 tentativas; nada foi cobrado a mais (cada tentativa que falha não gera áudio)');
}

// tempo de cada palavra a partir do tempo de cada letra
function palavrasDoAlinhamento(al, texto) {
  const ch = al.characters, a = al.character_start_times_seconds, b = al.character_end_times_seconds;
  const out = []; let atual = null;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) { if (atual) { out.push(atual); atual = null; } continue; }
    if (!atual) atual = { t0: a[i], t1: b[i] }; else atual.t1 = b[i];
  }
  if (atual) out.push(atual);
  const esperadas = palavrasDe(texto).length;
  if (out.length !== esperadas) sair(`o alinhamento da ElevenLabs tem ${out.length} palavras e o texto tem ${esperadas} ("${texto}")`);
  return out;
}

const falas = [];
for (const [i, f] of roteiro.falas.entries()) {
  const r = await pedir(f, i);
  const bruto = path.join(SAI, `${f.id}.${r.ext}`), wav = path.join(SAI, `${f.id}.wav`);
  if (r.ext !== 'wav') fs.writeFileSync(bruto, r.audio);
  if (r.ext === 'wav') fs.writeFileSync(wav, r.audio); else rodar(FFMPEG, ['-nostdin', '-v', 'error', '-y', '-i', bruto, '-ar', '44100', '-ac', '1', wav]);
  const dur = duracao(wav);
  falas.push({ dur, palavras: palavrasDoAlinhamento(r.alinhamento, f.pedacos.map((p) => p.bruto).join(' ')), arquivo: `voz_final/${f.id}.wav` });
  console.log(`${f.id.padEnd(4)} ${dur.toFixed(2)} s  ${f.texto}`);
}
if (guia && guia.voz !== 'final') gravarJson(path.join(pasta, 'linhas_guia.json'), guia);
const lin = montarLinhas(roteiro, falas);
lin.voz = A.simular ? 'final-simulada' : 'final';
gravarJson(path.join(pasta, 'linhas.json'), lin);
console.log(`linhas.json com a voz ${lin.voz}: fala inteira em ${lin.total.toFixed(1)} s (${caracteres} caracteres). Agora: npm run video -- final ${nome}`);
