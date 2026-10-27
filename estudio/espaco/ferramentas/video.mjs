// O comando do kit para fazer um vídeo de espaço e ciência, do roteiro à entrega. Rode da raiz do projeto:
//   npm run video -- novo <nome> [--de exemplo_lua]   cria estudio/espaco/projetos/<nome> (a partir do modelo ou de outro projeto)
//   npm run video -- referencia <nome> <arquivo|link>  mede um vídeo de referência (cortes por minuto, planos, paleta, brilho, volume)
//   npm run video -- voz <nome>                        voz-guia grátis e os tempos de cada palavra (linhas.json)
//   npm run video -- quadros <nome> --t 1,4,8          quadros soltos (para posicionar câmera e objetos)
//   npm run video -- estilos <nome> --t 4              o mesmo quadro em cada estilo de design, lado a lado
//   npm run video -- rascunho <nome>                   animática leve (540x960, 12 qps) com voz-guia, conferência e folha de contato
//   npm run video -- conferir <nome>                   só a conferência do último render
//   npm run video -- voz-final <nome> [--confirmo]     voz da ElevenLabs com a chave da pessoa (custa créditos; sem --confirmo só mostra o custo)
//   npm run video -- final <nome>                      1080x1920, 24 qps, conferência e mixagem a -14 LUFS, pasta de entrega
// Opções: --estilo classico|limpo|vivo (padrão: "estilo" do plano, senão classico)  --leve (mais devagar, a máquina fica livre)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { args, pastaProjeto, lerJson, sair, ESPACO, PROJETOS, RAIZ_PROJETO, FFMPEG } from './comum.mjs';
import { ESTILOS } from '../estilos.js';

const A = args();
const [cmd, nome] = A._;
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const node = (arq, lista, opc = {}) => {
  const r = spawnSync(process.execPath, [arq, ...lista], { stdio: 'inherit', cwd: opc.cwd || RAIZ_PROJETO });
  if (r.status !== 0 && !opc.aceita?.includes(r.status)) process.exit(r.status || 1);
  return r.status;
};
const ferramenta = (f, lista, opc) => node(path.join(AQUI, f), lista, opc);
const render = (lista) => node(path.join(ESPACO, 'render.mjs'), lista, { cwd: ESPACO });
const relEsp = (p) => path.relative(ESPACO, p);

function estiloDe(pasta) {
  const e = A.estilo || lerJson(path.join(pasta, 'plano.json')).estilo || 'classico';
  if (!ESTILOS[e]) sair(`estilo "${e}" não existe (estilos: ${Object.keys(ESTILOS).join(', ')})`);
  return e;
}
// a voz-guia é refeita sozinha quando o roteiro muda; a voz final nunca é apagada sem a pessoa pedir
function vozEmDia(pasta) {
  const rot = path.join(pasta, 'roteiro.json'), lin = path.join(pasta, 'linhas.json');
  if (!fs.existsSync(lin)) return ferramenta('voz_guia.mjs', [nome]);
  const L = lerJson(lin);
  const faltaAudio = L.voz !== 'muda' && L.linhas.some((l) => !fs.existsSync(path.join(pasta, l.arquivo || `voz/${l.id}.wav`)));
  if (faltaAudio && L.voz !== 'final') return ferramenta('voz_guia.mjs', [nome]); // projeto copiado sem os áudios: refaz a voz-guia
  if (fs.statSync(rot).mtimeMs <= fs.statSync(lin).mtimeMs) return;
  if (L.voz === 'final') { console.log('AVISO: o roteiro mudou depois da voz final; o vídeo usa a voz final antiga (refaça com voz-final, ou apague linhas.json para voltar à voz-guia)'); return; }
  ferramenta('voz_guia.mjs', [nome]);
}

function renderVideo(pasta, { w, h, fps, base }) {
  const est = estiloDe(pasta);
  const mudo = path.join(pasta, 'saida', `${base}_mudo.mp4`);
  render(['--cena', 'video', '--projeto', nome, '--estilo', est, '--video', relEsp(mudo), '--fps', String(fps), '--w', String(w), '--h', String(h),
    '--ana', relEsp(path.join(pasta, 'saida', 'analise.json')), '--tmp', relEsp(path.join(pasta, 'saida', '_quadros')), '--progresso', ...(A.leve ? ['--folga', '0.5'] : [])]);
  ferramenta('conferir_video.mjs', [nome, '--video', `saida/${base}_mudo.mp4`], { aceita: [2] });
  ferramenta('mixar.mjs', [nome, '--video', `saida/${base}_mudo.mp4`, '--saida', `saida/${base}.mp4`]);
  fs.rmSync(mudo, { force: true });
  return est;
}

if (!cmd || cmd === 'ajuda' || A.help) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}

if (cmd === 'novo') {
  if (!nome || !/^[a-z0-9][a-z0-9_-]*$/.test(nome)) sair('diga um nome de projeto com letras minúsculas, números, - ou _ (ex.: npm run video -- novo buraco_negro)');
  const de = path.join(PROJETOS, A.de || '_modelo');
  if (!fs.existsSync(de)) sair(`não achei o projeto de origem ${path.relative(RAIZ_PROJETO, de)}`);
  const para = path.join(PROJETOS, nome);
  if (fs.existsSync(para)) sair(`já existe um projeto com esse nome: ${path.relative(RAIZ_PROJETO, para)}`);
  fs.mkdirSync(para, { recursive: true });
  for (const f of ['roteiro.json', 'plano.json', 'IDEIAS.md', 'extra.js']) if (fs.existsSync(path.join(de, f))) fs.copyFileSync(path.join(de, f), path.join(para, f));
  console.log(`criado: ${path.relative(RAIZ_PROJETO, para)}/ (roteiro.json, plano.json)`);
  console.log(`próximos passos: escreva o roteiro.json (falas e o que cada pedaço mostra), depois o plano.json; o formato está em estudio/espaco/projetos/LEIA_O_PLANO.md`);
  console.log(`e rode: npm run video -- rascunho ${nome}`);
  process.exit(0);
}

const pasta = pastaProjeto(nome);
fs.mkdirSync(path.join(pasta, 'saida'), { recursive: true });

if (cmd === 'referencia') ferramenta('medir_referencia.mjs', [nome, A._[2], ...(A.nome ? ['--nome', A.nome] : [])]);
else if (cmd === 'voz') ferramenta('voz_guia.mjs', [nome, ...(A.muda ? ['--muda'] : []), ...(A.voz ? ['--voz', A.voz] : [])]);
else if (cmd === 'quadros') {
  vozEmDia(pasta);
  const est = estiloDe(pasta);
  const anaQ = path.join(pasta, 'saida', 'analise_quadros.json');
  render(['--cena', 'video', '--projeto', nome, '--estilo', est, '--w', String(A.w || 540), '--h', String(A.h || 960), '--t', String(A.t || '1'), '--saida', relEsp(path.join(pasta, 'saida', 'quadro_{t}.png')), '--ana', relEsp(anaQ)]);
  // o que cada quadro mostra contra o que a fala pede naquele instante (a mesma régua da conferência, quadro a quadro)
  const lin = lerJson(path.join(pasta, 'linhas.json'));
  console.log(`\nquadros em projetos/${nome}/saida/quadro_<t>.png (estilo ${est}). Frase → imagem em cada um:`);
  for (const q of lerJson(anaQ)) {
    const ped = lin.linhas.flatMap((l) => l.pedacos.map((p, i) => ({ ...p, id: `${l.id}.${i + 1}` }))).find((p) => q.t >= p.t0 - 0.02 && q.t < p.t1 + 0.24);
    const pede = ped ? ped.ver.map((v) => `${v} ${q.objs && q.objs[v] ? 'visto' : 'NÃO VISTO'}`).join(', ') : '';
    const h = q.hero ? ` herói ${Math.round((200 * q.hero.r) / q.tela[1])}% da altura${q.hero.cortado ? ' CORTADO' : ''}${!q.hero.visivel ? ' FORA/TAPADO' : ''}` : '';
    const fx = q.faixa && q.faixa.length && !q.veu ? ` na faixa da legenda: ${q.faixa.join(', ')}` : '';
    console.log(`  t=${q.t}  ${q.id} (${q.novo})  ${ped ? `${ped.id} "${ped.texto}": ${pede || 'nada pedido'}` : '(sem fala)'}${h}${fx}`);
  }
} else if (cmd === 'estilos') {
  vozEmDia(pasta);
  const t = String(A.t || '1').split(',')[0];
  const arqs = [];
  for (const est of Object.keys(ESTILOS)) {
    const arq = path.join(pasta, 'saida', `estilo_${est}.png`);
    render(['--cena', 'video', '--projeto', nome, '--estilo', est, '--w', '540', '--h', '960', '--t', t, '--saida', relEsp(arq)]);
    arqs.push(arq);
  }
  const sai = path.join(pasta, 'saida', 'estilos.jpg');
  spawnSync(FFMPEG, ['-nostdin', '-v', 'error', '-y', ...arqs.flatMap((a) => ['-i', a]), '-filter_complex', `hstack=${arqs.length}`, sai]);
  console.log(`estilos lado a lado (${Object.keys(ESTILOS).join(', ')}): projetos/${nome}/saida/estilos.jpg`);
} else if (cmd === 'rascunho') {
  vozEmDia(pasta);
  const est = renderVideo(pasta, { w: 540, h: 960, fps: 12, base: 'rascunho' });
  console.log(`\nrascunho pronto (estilo ${est}): projetos/${nome}/saida/rascunho.mp4, folha em saida/folha.jpg, conferência em CONFERENCIA.md`);
} else if (cmd === 'conferir') {
  // confere o último render (rascunho ou final, o mais novo), com a comparação de planos seguidos
  const vids = ['rascunho_mudo.mp4', 'rascunho.mp4', 'final.mp4'].map((f) => path.join(pasta, 'saida', f)).filter((f) => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  ferramenta('conferir_video.mjs', [nome, ...(vids.length ? ['--video', path.relative(pasta, vids[0])] : [])], { aceita: [2] });
} else if (cmd === 'voz-final') {
  ferramenta('voz_final.mjs', [nome, ...(A.confirmo ? ['--confirmo'] : []), ...(A.simular ? ['--simular'] : [])]);
} else if (cmd === 'final') {
  vozEmDia(pasta);
  const est = renderVideo(pasta, { w: 1080, h: 1920, fps: 24, base: 'final' });
  const ent = path.join(pasta, 'entrega');
  fs.rmSync(ent, { recursive: true, force: true }); fs.mkdirSync(ent, { recursive: true });
  for (const [de, para] of [['saida/final.mp4', `${nome}.mp4`], ['roteiro.json', 'roteiro.json'], ['CONFERENCIA.md', 'CONFERENCIA.md'], ['saida/folha.jpg', 'folha.jpg']]) if (fs.existsSync(path.join(pasta, de))) fs.copyFileSync(path.join(pasta, de), path.join(ent, para));
  const lin = lerJson(path.join(pasta, 'linhas.json'));
  console.log(`\nvídeo final (estilo ${est}, voz ${lin.voz}): projetos/${nome}/entrega/${nome}.mp4`);
  if (lin.voz === 'final-simulada') console.log('AVISO: voz final SIMULADA (a voz-guia no lugar da ElevenLabs); a de verdade vem com: npm run video -- voz-final ' + nome + ' --confirmo');
  else if (lin.voz !== 'final') console.log('AVISO: este final usa a voz-guia; a voz final vem com: npm run video -- voz-final ' + nome);
} else sair(`comando "${cmd}" não existe (rode: npm run video -- ajuda)`);
