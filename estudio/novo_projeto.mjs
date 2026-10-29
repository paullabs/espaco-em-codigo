#!/usr/bin/env node
// Cria um projeto do espaco-em-codigo numa pasta: copia o estúdio para lá, sem sobrescrever nada.
//   node estudio/novo_projeto.mjs [pasta-destino] [--simular]
// Sem pasta, usa a pasta atual. Pelo plugin do Claude Code o caminho é o da instalação do plugin:
//   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs" ~/videos-de-espaco
// Se algum arquivo do destino já existir, nada é copiado e o script lista os conflitos (código 1).
// Quais arquivos entram (e quais não) está em kit_arquivos.mjs, o mesmo critério do atualizar_projeto.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KIT, dentroDe, listarArquivos } from './kit_arquivos.mjs';

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const destino = path.resolve((args.find((a) => !a.startsWith('--')) || process.cwd()).replace(/^~(?=$|[\\/])/, os.homedir())); // ~ vale no Mac e no Windows

if (dentroDe(destino, KIT)) {
  console.error(`O destino (${destino}) está dentro do próprio plugin.\nUse uma pasta nova para os seus vídeos (por exemplo ~/videos-de-espaco) e rode de lá.`);
  process.exit(2);
}

const arquivos = listarArquivos();

const conflitos = arquivos.filter((p) => {
  try { fs.lstatSync(path.join(destino, ...p)); return true; } catch { return false; }
});
if (conflitos.length) {
  console.error(`Nada foi copiado: ${conflitos.length} arquivo(s) já existem em ${destino}:`);
  for (const p of conflitos.slice(0, 10)) console.error(`  ${p.join('/')}`);
  if (conflitos.length > 10) console.error(`  ... e mais ${conflitos.length - 10}`);
  console.error('Use uma pasta vazia (ou sem estes nomes). O script nunca sobrescreve.');
  process.exit(1);
}

if (!simular) {
  for (const p of arquivos) {
    const para = path.join(destino, ...p);
    fs.mkdirSync(path.dirname(para), { recursive: true });
    fs.copyFileSync(path.join(KIT, ...p), para, fs.constants.COPYFILE_EXCL);
  }
}
console.log(`${simular ? '[simulação] copiaria' : 'Copiei'} ${arquivos.length} arquivos para ${destino}`);
console.log([
  'Próximos passos, nessa pasta:',
  '  npm run preparar                     (uma vez: confere o computador e baixa só o que falta, no Mac ou no Windows)',
  '  npm run video -- rascunho exemplo_lua  (o exemplo "E se a Lua sumisse?" em uns 30 s)',
  'Depois edite perfil/perfil_da_casa.md e abra o Claude Code nesta pasta para pedir o seu vídeo (ou /espaco-em-codigo:novo-video).',
].join('\n'));
