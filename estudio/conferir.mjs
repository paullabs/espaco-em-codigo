// npm run conferir: um só comando para os verificadores do estúdio.
// Cada conferência chama a ferramenta que já existe (auditoria de colisão, conferência de roteiro, enquadramento)
// e lê o resultado dela; a conferência "video" é um medidor pequeno em cima do ffmpeg (formato, volume, silêncio).
//
//   npm run conferir                                lista as conferências
//   npm run conferir -- video saida/meu_video.mp4   formato, volume (LUFS) e silêncio morto
//   npm run conferir -- roteiro roteiros/historias/<código>/roteiro.json
//   npm run conferir -- esportes-aula               colisões da aula de boxe (todos os quadros)
//   npm run conferir -- esportes-reels              colisões dos Reels
//   npm run conferir -- leve-colisao --pagina /treino/x/pagina.html --tl /treino/x/saida/timeline.json
//   npm run conferir -- espaco-textos estudio/espaco/saida/<v>/render.log
//   npm run conferir -- enquadramento-cocegas       enquadramento dos planos (hoje só a cena Cócegas)
//
// Sai com código 1 se alguma conferência falhar. As auditorias renderizam no Chrome e rodam com nice, para não pesar.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_PROJETO, FFMPEG, FFPROBE } from './ambiente.mjs';

const ESTUDIO = path.join(RAIZ_PROJETO, 'estudio');
const cor = process.stdout.isTTY ? { ok: '\x1b[32m', aviso: '\x1b[33m', falhou: '\x1b[31m', fim: '\x1b[0m', dim: '\x1b[2m' } : { ok: '', aviso: '', falhou: '', fim: '', dim: '' };

// ---- argumentos: o primeiro sem "--" é a conferência; o segundo, a entrada
const pos = [];
const A = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (k.startsWith('--')) A[k.slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
  else pos.push(k);
}
const [nome, entrada] = pos;

function rodar(cmd, args, { cwd = RAIZ_PROJETO, leve = false, timeout = 30 * 60 * 1000 } = {}) {
  const usaNice = leve && process.platform !== 'win32';
  const r = spawnSync(usaNice ? 'nice' : cmd, usaNice ? ['-n', '19', cmd, ...args] : args, { cwd, encoding: 'utf8', timeout, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: ((r.stdout || '') + (r.stderr || '')).trim(), erro: r.error };
}
const caminho = (p) => path.resolve(process.cwd(), p);
const falha = (resumo, detalhes = []) => ({ estado: 'falhou', resumo, detalhes });
const bom = (resumo, detalhes = []) => ({ estado: 'ok', resumo, detalhes });
const atencao = (resumo, detalhes = []) => ({ estado: 'aviso', resumo, detalhes });

// ---- as conferências
const CONFERENCIAS = {
  video: {
    uso: 'video <arquivo.mp4> [--lufs -14.5] [--tolerancia 1.5] [--silencio 1.5]',
    descricao: 'formato (tamanho, qps, codec), volume integrado e pico (LUFS) e silêncio morto no áudio',
    rodar() {
      if (!entrada) return falha('diga o arquivo: conferir video <arquivo.mp4>');
      const arq = caminho(entrada);
      if (!fs.existsSync(arq)) return falha(`arquivo não encontrado: ${arq}`);
      const meta = rodar(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', arq]);
      let info;
      try { info = JSON.parse(meta.out); } catch { return falha('o ffprobe não conseguiu ler o arquivo', [meta.out.split('\n')[0]]); }
      const v = info.streams.find((s) => s.codec_type === 'video');
      const a = info.streams.find((s) => s.codec_type === 'audio');
      if (!v) return falha('o arquivo não tem imagem');
      const det = [];
      let estado = 'ok';
      const sobe = (e) => { if (e === 'falhou' || (e === 'aviso' && estado === 'ok')) estado = e; };
      const [n, d] = v.r_frame_rate.split('/').map(Number);
      const qps = d ? n / d : n;
      det.push(`${v.width}×${v.height}, ${qps.toFixed(2)} qps, ${v.codec_name}/${v.pix_fmt}, ${(+info.format.duration).toFixed(1)} s`);
      const tamanhoOk = (v.width === 1080 && v.height === 1920) || (v.width === 1920 && v.height === 1080);
      if (!tamanhoOk) { det.push('AVISO: tamanho fora de 1080×1920 e 1920×1080'); sobe('aviso'); }
      if (v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p') { det.push('AVISO: o YouTube e o Instagram preferem h264 com yuv420p'); sobe('aviso'); }
      if (!a) { det.push('FALHOU: sem áudio'); sobe('falhou'); return { estado, resumo: 'sem áudio', detalhes: det }; }

      // as linhas usam −14 (espaço, leve) e −15 (esportes): o padrão aceita de −16 a −13
      const alvo = +(A.lufs ?? -14.5), tol = +(A.tolerancia ?? 1.5), gapMin = +(A.silencio ?? 1.5);
      const eb = rodar(FFMPEG, ['-nostats', '-hide_banner', '-i', arq, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
      const resumoEb = eb.out.slice(eb.out.lastIndexOf('Summary:'));
      const lufs = +(resumoEb.match(/I:\s+(-?[\d.]+) LUFS/) || [])[1];
      const pico = +(resumoEb.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1];
      if (Number.isFinite(lufs)) {
        const dif = lufs - alvo;
        det.push(`volume integrado ${lufs.toFixed(1)} LUFS (alvo ${alvo} ±${tol})`);
        if (Math.abs(dif) > tol) { det.push(`FALHOU: ${dif > 0 ? 'alto' : 'baixo'} demais por ${Math.abs(dif).toFixed(1)} LU`); sobe('falhou'); }
      } else { det.push('AVISO: não consegui medir o volume'); sobe('aviso'); }
      if (Number.isFinite(pico)) {
        det.push(`pico real ${pico.toFixed(1)} dBTP (limite −1,0)`);
        if (pico > -1) { det.push('FALHOU: pico acima de −1 dBTP (pode distorcer na plataforma)'); sobe('falhou'); }
      }
      const sil = rodar(FFMPEG, ['-nostats', '-hide_banner', '-i', arq, '-af', `silencedetect=noise=-45dB:d=${gapMin}`, '-f', 'null', '-']);
      const trechos = [...sil.out.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((m) => ({ t: +m[1], d: +m[2] }));
      const meio = trechos.filter((x) => x.t + x.d < +info.format.duration - 0.2); // o rabo final não conta
      if (meio.length) { det.push(`AVISO: ${meio.length} silêncio(s) de ${gapMin} s ou mais: ${meio.slice(0, 5).map((x) => `${x.t.toFixed(1)} s (${x.d.toFixed(1)} s)`).join(', ')}`); sobe('aviso'); }
      else det.push(`sem silêncio morto de ${gapMin} s ou mais no meio do áudio`);
      return { estado, resumo: estado === 'ok' ? 'formato, volume e silêncio dentro do esperado' : 'veja os detalhes', detalhes: det };
    },
  },

  roteiro: {
    uso: 'roteiro <roteiro.json>',
    descricao: 'confere o roteiro contra as regras medidas da consciência de roteiro (roteiros/ferramentas/conferir_roteiro.py); grava conferencia.md ao lado do roteiro',
    rodar() {
      if (!entrada) return falha('diga o arquivo: conferir roteiro <roteiro.json>');
      const py = process.platform === 'win32' ? 'python' : 'python3';
      const r = rodar(py, ['roteiros/ferramentas/conferir_roteiro.py', caminho(entrada)]);
      if (r.erro) return falha('não consegui rodar o Python', [String(r.erro.message)]);
      const linhas = r.out.split('\n');
      const resumo = (linhas.find((l) => /itens passam/.test(l)) || linhas.slice(-1)[0] || '').replace(/ · .*$/, '');
      // a ferramenta grava conferencia.md ao lado do roteiro; os itens que não passam são as linhas "| item | **não** | medida |"
      const md = path.join(path.dirname(caminho(entrada)), 'conferencia.md');
      const ruins = fs.existsSync(md)
        ? fs.readFileSync(md, 'utf8').split('\n').filter((l) => /\|\s*\*\*não\*\*\s*\|/.test(l)).map((l) => l.split('|').filter(Boolean).map((c) => c.trim()).filter((c) => c !== '**não**').join(' — ')).slice(0, 12)
        : [];
      return r.status === 0 ? bom(resumo, ['conferencia.md atualizada ao lado do roteiro']) : falha(resumo || 'o roteiro tem itens fora da regra', [...ruins, 'detalhe completo em conferencia.md, ao lado do roteiro']);
    },
  },

  'esportes-aula': {
    uso: 'esportes-aula',
    descricao: 'colisões da aula de boxe, quadro a quadro, com profundidade (estudio/esportes/auditar.mjs)',
    rodar: () => colisoesEsportes('esportes/auditar.mjs'),
  },
  'esportes-reels': {
    uso: 'esportes-reels',
    descricao: 'colisões dos Reels do atleta, mesmo critério (estudio/esportes/auditar_reels.mjs)',
    rodar: () => colisoesEsportes('esportes/auditar_reels.mjs'),
  },

  'leve-colisao': {
    uso: 'leve-colisao --pagina /treino/x/pagina.html --tl /treino/x/saida/timeline.json [--passo 0.0333]',
    descricao: 'colisões de uma cena da linha leve, no modo rigoroso (estudio/treino/comum/auditar.mjs)',
    rodar() {
      if (!A.pagina || !A.tl) return falha('faltam --pagina e --tl');
      const saida = path.posix.join(path.posix.dirname(A.tl).replace(/^\//, ''), 'colisoes_rigoroso.json');
      const r = rodar('node', ['treino/comum/auditar.mjs', '--pagina', A.pagina, '--tl', A.tl, '--rigoroso', '--passo', String(A.passo || 0.0333), '--saida', saida], { cwd: ESTUDIO, leve: true });
      const m = r.out.match(/atravessa: (\d+) pares/);
      if (!m) return falha('não achei o resultado da auditoria', r.out.split('\n').slice(-6));
      const n = +m[1];
      const ruins = r.out.split('\n').filter((l) => /ATRAVESSA|CAMERA|afunda/.test(l)).slice(0, 12);
      return n === 0 ? bom(`0 atravessamentos (detalhe em estudio/${saida})`) : falha(`${n} par(es) atravessando`, ruins);
    },
  },

  marca: {
    uso: 'marca',
    descricao: 'a marca d\'água do canal continua em todos os motores que o kit traz (o motor principal do kit é obrigatório): arquivos íntegros (selo), motor do espaço ligado ao pos.js, os renderizadores dos outros motores chamando instalarMarca, com a opacidade e os quatro cantos combinados',
    rodar() {
      const est = path.join(RAIZ_PROJETO, 'estudio');
      const arqSelo = path.join(est, 'espaco', 'marca.selo.json');
      const SELADOS = ['espaco/marca_agenda.js', 'espaco/marca.js', 'marca_pagina.mjs'];
      // a marca vale em todos os motores QUE O KIT TRAZ; o motor principal do kit é obrigatório (o esportes no atleta-em-codigo e no
      // projeto inteiro, o pós do espaço no espaco-em-codigo). Motor que existe é conferido por inteiro: a ausência do arquivo só
      // dispensa um motor que o kit não leva, nunca o principal.
      const MOTORES_MARCA = { 'motor3d/render.mjs': '3D base', 'motor3d/render_episodio.mjs': 'dramático', 'esportes/render.mjs': 'esportes', 'treino/comum/render.mjs': 'leve', 'espaco/pos.js': 'espaço' };
      const nomeKit = (() => { try { return JSON.parse(fs.readFileSync(path.join(RAIZ_PROJETO, 'package.json'), 'utf8')).name; } catch { return ''; } })();
      const OBRIGATORIOS = nomeKit === 'espaco-em-codigo' ? ['espaco/pos.js'] : ['esportes/render.mjs'];
      const RENDERIZADORES = Object.keys(MOTORES_MARCA).filter((r) => OBRIGATORIOS.includes(r) || fs.existsSync(path.join(est, r)));
      const foraDoKit = Object.keys(MOTORES_MARCA).filter((r) => !RENDERIZADORES.includes(r));
      for (const a of [arqSelo, ...SELADOS, ...RENDERIZADORES].map((r) => (path.isAbsolute(r) ? r : path.join(est, r)))) if (!fs.existsSync(a)) return falha(`faltando: ${path.relative(RAIZ_PROJETO, a)}`);
      const selo = JSON.parse(fs.readFileSync(arqSelo, 'utf8')), erros = [], det = [];
      // 1) os arquivos da marca estão como foram selados
      for (const r of SELADOS) {
        const hash = createHash('sha256').update(fs.readFileSync(path.join(est, r))).digest('hex');
        const esperado = selo.arquivos && selo.arquivos[r];
        if (hash !== esperado) erros.push(`${r} foi alterado (hash ${hash.slice(0, 12)}…, o selo diz ${String(esperado).slice(0, 12)}…)`);
      }
      // 2) o motor do espaço desenha a marca no passe final
      if (RENDERIZADORES.includes('espaco/pos.js')) {
        const pos = fs.readFileSync(path.join(est, 'espaco', 'pos.js'), 'utf8');
        if (!/from\s+'\.\/marca\.js'/.test(pos)) erros.push('o pos.js não importa a marca');
        for (const [trecho, porque] of [['agendaMarca(', 'o pos.js não calcula a posição da marca'], ['texturaMarca(', 'o pos.js não cria a textura da marca'], ['uMarcaOp', 'o passe final não desenha a marca']]) {
          if (!pos.includes(trecho)) erros.push(porque);
        }
      }
      // 3) os outros motores instalam a marca antes de ler o quadro
      for (const r of RENDERIZADORES.filter((x) => x.endsWith('.mjs'))) {
        // sem os comentários: uma chamada comentada não conta; a chamada tem que abrir a linha
        const t = fs.readFileSync(path.join(est, r), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        if (!/^import .*from '[./]+\/marca_pagina\.mjs'/m.test(t) || !/^\s*await instalarMarca\(/m.test(t)) erros.push(`${r} não instala a marca (instalarMarca)`);
      }
      // 4) opacidade e cantos combinados
      const agenda = fs.readFileSync(path.join(est, 'espaco', 'marca_agenda.js'), 'utf8');
      const m = agenda.match(/opacidade:\s*([0-9.]+)/);
      if (!m || +m[1] < 0.01 || +m[1] > 0.03) erros.push(`opacidade fora do combinado (1% a 3%): ${m ? m[1] : 'não achei'}`);
      for (const c of ["'SE'", "'SD'", "'IE'", "'ID'"]) if (!agenda.includes(c)) erros.push(`canto ${c} sumiu da agenda`);
      det.push(`opacidade ${m ? +(+m[1] * 100).toFixed(1) : '?'}%, ${SELADOS.length} arquivos selados, ${RENDERIZADORES.length} renderizador(es) ligado(s): ${RENDERIZADORES.map((r) => MOTORES_MARCA[r]).join(', ')}`);
      if (foraDoKit.length) det.push(`fora deste kit (não conferidos): ${foraDoKit.map((r) => MOTORES_MARCA[r]).join(', ')}`);
      det.push('o quadro de cada motor é provado por: node estudio/marca_teste.mjs');
      return erros.length ? falha('a marca d\'água do canal foi alterada ou desligada', [...erros, 'O kit exige a marca (veja o LEIAME). Restaure os arquivos originais.']) : bom(foraDoKit.length ? 'marca d\'água do canal íntegra e ligada a todos os motores deste kit' : 'marca d\'água do canal íntegra e ligada a todos os motores', det);
    },
  },
  'espaco-textos': {
    uso: 'espaco-textos <render.log>',
    descricao: 'densidade de texto na tela: no máximo 1 texto por quadro (linha do espaço), lida do log do render',
    rodar() {
      if (!entrada) return falha('diga o log: conferir espaco-textos <render.log>');
      const arq = caminho(entrada);
      if (!fs.existsSync(arq)) return falha(`arquivo não encontrado: ${arq}`);
      const l = fs.readFileSync(arq, 'utf8').split('\n').find((x) => /maximo de textos por quadro/.test(x));
      if (!l) return falha('esse log não tem a linha "máximo de textos por quadro" (foi render de vídeo?)');
      return /EXCESSO/.test(l) ? falha('mais de 1 texto no mesmo quadro', [l.trim()]) : bom(l.trim());
    },
  },

  'enquadramento-cocegas': {
    uso: 'enquadramento-cocegas [--planos p10,p17]',
    descricao: 'pós-análise de enquadramento dos planos: sujeito cortado, fora do centro, na faixa da legenda (hoje só a cena Cócegas)',
    rodar() {
      const args = ['treino/cocegas/analisar_enquadramento.mjs'];
      if (A.planos) args.push('--planos', A.planos);
      const r = rodar('node', args, { cwd: ESTUDIO, leve: true });
      const m = r.out.match(/(\d+) planos analisados, (\d+) com problema/);
      if (!m) return falha('não achei o resultado da análise', r.out.split('\n').slice(-6));
      const ruins = r.out.split('\n').filter((l) => /^p\d+ /.test(l)).slice(0, 12);
      return +m[2] === 0 ? bom(`${m[1]} planos analisados, nenhum com problema`) : falha(`${m[2]} de ${m[1]} planos com problema`, ruins);
    },
  },
};

function colisoesEsportes(script) {
  const r = rodar('node', [script], { cwd: ESTUDIO, leve: true });
  const m = r.out.match(/atravessa: (\d+) pares/);
  if (!m) return falha('não achei o resultado da auditoria', r.out.split('\n').slice(-6));
  const n = +m[1];
  const chao = r.out.match(/chão: ([\d.]+) cm \((ok|afunda)/);
  const detalhes = r.out.split('\n').filter((l) => /^\s+\S.* cm\s+t=/.test(l)).slice(0, 12);
  const chaoRuim = chao && chao[2] !== 'ok';
  const resumo = `${n} par(es) atravessando${chao ? `; chão ${chao[1]} cm (${chao[2]})` : ''}`;
  return n === 0 && !chaoRuim ? bom(resumo) : falha(resumo, detalhes);
}

// Cada conferência só existe quando o arquivo de que ela depende está no projeto (um kit leva só algumas linhas).
const PRECISA = {
  roteiro: 'roteiros/ferramentas/conferir_roteiro.py',
  'esportes-aula': 'estudio/esportes/auditar.mjs',
  'esportes-reels': 'estudio/esportes/auditar_reels.mjs',
  'leve-colisao': 'estudio/treino/comum/auditar.mjs',
  'espaco-textos': 'estudio/espaco/render.mjs',
  'enquadramento-cocegas': 'estudio/treino/cocegas/analisar_enquadramento.mjs',
  marca: 'estudio/marca_pagina.mjs',
};
for (const [k, arq] of Object.entries(PRECISA)) if (CONFERENCIAS[k] && !fs.existsSync(path.join(RAIZ_PROJETO, arq))) delete CONFERENCIAS[k];

// ---- execução
if (!nome || !CONFERENCIAS[nome]) {
  if (nome) console.log(`${cor.falhou}Não conheço a conferência "${nome}".${cor.fim}\n`);
  console.log('Conferências disponíveis (npm run conferir -- <nome> ...):\n');
  for (const [k, c] of Object.entries(CONFERENCIAS)) console.log(`  ${c.uso}\n      ${cor.dim}${c.descricao}${cor.fim}`);
  process.exit(nome ? 1 : 0);
}
console.log(`Conferindo: ${nome}${entrada ? ` ${entrada}` : ''}`);
const t0 = Date.now();
const r = CONFERENCIAS[nome].rodar();
const rotulo = { ok: `${cor.ok}[ok]${cor.fim}`, aviso: `${cor.aviso}[AVISO]${cor.fim}`, falhou: `${cor.falhou}[FALHOU]${cor.fim}` }[r.estado];
console.log(`\n${rotulo} ${r.resumo}  ${cor.dim}(${((Date.now() - t0) / 1000).toFixed(1)} s)${cor.fim}`);
for (const d of r.detalhes) console.log(`    ${d}`);
process.exit(r.estado === 'falhou' ? 1 : 0);
