#!/usr/bin/env node
// Leva a versão do plugin que está rodando este script para um projeto espaco-em-codigo que você já criou.
//   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs" [pasta-do-projeto] [--simular] [--forcar]
// Sem pasta, usa a pasta atual. --simular só mostra o plano. --forcar reaplica a mesma versão (para consertar um arquivo estragado).
//
// O que faz, e o que nunca faz:
//   - arquivos novos do plugin são acrescentados (inclusive um exemplo novo em estudio/espaco/projetos/);
//   - arquivos do motor que mudaram são substituídos, e a cópia do que estava lá vai para .atualizacao/<de>-para-<para>/arquivos-antigos/
//     (se você tinha mexido num arquivo do motor, ele não se perde: compare com a cópia);
//   - NÃO toca no que é seu: perfil/, .env, .gitignore, estudio.config.json e todo projeto de vídeo que já está em estudio/espaco/projetos/
//     (os seus e também os exemplos, que você pode ter mexido). Se a versão nova de um arquivo desses é diferente do seu, ela vai para
//     .atualizacao/<de>-para-<para>/modelos-novos/ para você comparar;
//   - não apaga nada, e não mexe em saida/, voz/, voz_final/, entrega/, referencias/ nem em node_modules.
import fs from 'node:fs';
import path from 'node:path';
import { KIT, dentroDe, listarArquivos } from './kit_arquivos.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const forcar = args.includes('--forcar');
const destino = path.resolve((args.find((a) => !a.startsWith('--')) || process.cwd()).replace(/^~(?=$|\/)/, process.env.HOME || '~'));

// do usuário em qualquer caso
const DO_USUARIO = [/^perfil\//, /^\.env$/, /^\.gitignore$/, /^estudio\.config\.json$/];
// uma pasta em estudio/espaco/projetos/<nome>/ é um projeto de vídeo: se já existe aí, é da pessoa (o _modelo é do motor)
const PROJETO = /^estudio\/espaco\/projetos\/(?!_modelo\/)([^/]+)\//;

const lerJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};
const numeros = (v) => String(v).split('.').map((x) => parseInt(x, 10) || 0);
const comparar = (a, b) => {
  const x = numeros(a);
  const y = numeros(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

if (dentroDe(destino, KIT)) {
  console.error('Rode de dentro da pasta do seu projeto (ou passe o caminho dela): este script é o do plugin, não o do projeto.');
  process.exit(2);
}
const novo = lerJson(path.join(KIT, 'package.json'));
const atual = lerJson(path.join(destino, 'package.json'));
if (!atual || atual.name !== 'espaco-em-codigo' || !fs.existsSync(path.join(destino, 'estudio', 'espaco'))) {
  console.error(`A pasta ${destino} não parece um projeto espaco-em-codigo (falta o package.json do plugin ou a pasta estudio/espaco/).\nPara começar um projeto novo use novo_projeto.mjs, numa pasta vazia.`);
  process.exit(2);
}
const de = atual.version || '0.0.0';
const para = novo.version;
if (comparar(de, para) > 0 && !forcar) {
  console.error(`O projeto (${de}) é mais novo que o plugin (${para}). Atualize o plugin antes: claude plugin update espaco-em-codigo@espaco-em-codigo`);
  process.exit(2);
}
if (comparar(de, para) === 0 && !forcar) {
  console.log(`O projeto já está na versão ${para}. Nada a fazer (use --forcar para reaplicar os arquivos do plugin).`);
  process.exit(0);
}

// ---- o plano
const existe = (p) => {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
};
const plano = { novos: [], iguais: [], substituidos: [], mantidos: [], exemplosNovos: new Set() };
for (const p of listarArquivos()) {
  const rel = p.join('/');
  const origem = path.join(KIT, ...p);
  const alvo = path.join(destino, ...p);
  const projeto = PROJETO.exec(rel);
  if (projeto) {
    const pastaDoProjeto = path.join(destino, 'estudio', 'espaco', 'projetos', projeto[1]);
    if (!existe(pastaDoProjeto)) {
      plano.novos.push(rel);
      plano.exemplosNovos.add(projeto[1]);
    } else if (!existe(alvo) || !fs.readFileSync(origem).equals(fs.readFileSync(alvo))) plano.mantidos.push(rel);
    else plano.iguais.push(rel);
    continue;
  }
  if (!existe(alvo)) plano.novos.push(rel);
  else if (fs.readFileSync(origem).equals(fs.readFileSync(alvo))) plano.iguais.push(rel);
  else if (DO_USUARIO.some((r) => r.test(rel))) plano.mantidos.push(rel);
  else plano.substituidos.push(rel);
}

const lista = (titulo, itens, max = 12) => {
  if (!itens.length) return;
  console.log(`${titulo} (${itens.length}):`);
  for (const r of itens.slice(0, max)) console.log(`  ${r}`);
  if (itens.length > max) console.log(`  ... e mais ${itens.length - max}`);
};
console.log(`${simular ? '[simulação] ' : ''}Projeto ${de} → plugin ${para}, em ${destino}`);
if (plano.exemplosNovos.size) console.log(`Exemplos de vídeo novos: ${[...plano.exemplosNovos].join(', ')}`);
lista('Arquivos novos', plano.novos);
lista('Arquivos do motor que mudam (a cópia do antigo fica em .atualizacao/)', plano.substituidos, 30);
lista('Seus arquivos e projetos que eu NÃO toco (a versão nova deles é diferente)', plano.mantidos);
console.log(`Já iguais: ${plano.iguais.length}`);

if (!simular) {
  let pasta = path.join(destino, '.atualizacao', `${de}-para-${para}`);
  if (existe(pasta)) pasta += `-${Date.now()}`;
  const copiar = (origem, alvo) => {
    fs.mkdirSync(path.dirname(alvo), { recursive: true });
    fs.copyFileSync(origem, alvo);
  };
  for (const rel of plano.substituidos) copiar(path.join(destino, rel), path.join(pasta, 'arquivos-antigos', rel)); // primeiro as cópias de segurança
  for (const rel of plano.mantidos) copiar(path.join(KIT, rel), path.join(pasta, 'modelos-novos', rel));
  for (const rel of [...plano.novos, ...plano.substituidos]) copiar(path.join(KIT, rel), path.join(destino, rel));
  console.log(`Pronto: ${plano.novos.length} arquivos novos e ${plano.substituidos.length} atualizados.`);
  if (plano.substituidos.length || plano.mantidos.length) console.log(`Cópias de segurança e versões novas para comparar: ${path.relative(destino, pasta)}/`);
}
const deps = [...plano.novos, ...plano.substituidos].some((r) => /^estudio\/motor3d\/package(-lock)?\.json$/.test(r));
console.log(`Próximos passos: ${deps ? 'npm run instalar (as dependências mudaram), ' : ''}npm run doctor, npm run conferir -- marca. O que mudou: CHANGELOG.md. Se o Claude Code estiver aberto nesta pasta, feche e abra de novo para ele ler a skill atualizada.`);
