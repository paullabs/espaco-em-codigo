// npm run instalar: instala o three.js e o Playwright (em estudio/motor3d) e faz o atalho estudio/node_modules,
// para os scripts do Node de qualquer pasta (auditorias, preparo da anatomia...) acharem o three.
//   node estudio/instalar.mjs            instala e cria o atalho
//   node estudio/instalar.mjs --so-atalho   só (re)faz o atalho, sem rodar o npm
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ_PROJETO } from './ambiente.mjs';

const A = new Set(process.argv.slice(2));
const win = process.platform === 'win32';

if (!A.has('--so-atalho')) {
  // no Windows o npm é um .cmd, que o Node só abre por um shell; uma linha só (sem lista de argumentos) evita o aviso DEP0190 do Node 24
  const args = ['--prefix', path.join('estudio', 'motor3d'), 'install'];
  const r = win ? spawnSync(['npm', ...args].join(' '), { cwd: RAIZ_PROJETO, stdio: 'inherit', shell: true }) : spawnSync('npm', args, { cwd: RAIZ_PROJETO, stdio: 'inherit' });
  if (r.status !== 0) { console.error('O npm não conseguiu instalar. Confira a internet e rode de novo.'); process.exit(r.status || 1); }
}

const origem = path.join(RAIZ_PROJETO, 'estudio', 'motor3d', 'node_modules');
const atalho = path.join(RAIZ_PROJETO, 'estudio', 'node_modules');
if (!fs.existsSync(origem)) { console.error('Não achei estudio/motor3d/node_modules: a instalação não terminou.'); process.exit(1); }
let existe = false, ehLink = false;
try { ehLink = fs.lstatSync(atalho).isSymbolicLink(); existe = true; } catch { /* não existe */ }
// um atalho que aponta para outro lugar (projeto movido, renomeado ou copiado) ou para o nada é refeito; uma pasta de verdade é deixada em paz
let certo = false;
if (existe && ehLink) { try { certo = fs.realpathSync(atalho) === fs.realpathSync(origem); } catch { certo = false; } }
if (existe && (certo || !ehLink)) console.log('estudio/node_modules já existe.');
else {
  try {
    if (existe) fs.unlinkSync(atalho);
    fs.symlinkSync(win ? origem : path.join('motor3d', 'node_modules'), atalho, 'junction');
  } catch (e) {
    console.error(`Não consegui criar o atalho estudio/node_modules (${e.code || e.message}). Isso acontece em pen drives FAT/exFAT e em pastas de rede: copie o projeto para o disco do computador e rode de novo.`);
    process.exit(1);
  }
  console.log(`${existe ? 'Refiz' : 'Criei'} estudio/node_modules → motor3d/node_modules (os scripts do Node acham o three daí).`);
}
