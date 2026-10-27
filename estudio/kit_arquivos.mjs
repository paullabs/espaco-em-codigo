// Quais arquivos do plugin entram na cópia de um projeto. Usado por novo_projeto.mjs e atualizar_projeto.mjs, para os dois concordarem.
// Não entram: .git, node_modules, as saídas (saida/, voz/, voz_final/, entrega/, referencias/), .atualizacao/ (cópias de segurança de uma atualização),
// .DS_Store e, na raiz, o que é só do plugin (.claude-plugin/ e skills/). A skill video-espaco vai junto, em .claude/skills/,
// na versão do motor que está sendo copiado.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EM_QUALQUER_LUGAR = new Set(['.git', 'node_modules', 'saida', 'voz', 'voz_final', 'entrega', 'referencias', '.atualizacao', '.DS_Store']);
const SO_NA_RAIZ = new Set(['.claude-plugin', 'skills']);
const ignorar = (partes) => partes.some((p) => EM_QUALQUER_LUGAR.has(p)) || SO_NA_RAIZ.has(partes[0]);

export const dentroDe = (filho, pai) => filho === pai || filho.startsWith(pai + path.sep);

// lista de caminhos (cada um é uma lista de nomes) dos arquivos do plugin, em ordem
export function listarArquivos(raiz = KIT) {
  const arquivos = [];
  (function andar(dir, partes) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = [...partes, e.name];
      if (ignorar(p) || e.isSymbolicLink()) continue;
      if (e.isDirectory()) andar(path.join(dir, e.name), p);
      else if (e.isFile()) arquivos.push(p);
    }
  })(raiz, []);
  return arquivos.sort((a, b) => a.join('/').localeCompare(b.join('/')));
}
