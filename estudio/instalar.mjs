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
  const r = spawnSync('npm', ['--prefix', path.join('estudio', 'motor3d'), 'install'], { cwd: RAIZ_PROJETO, stdio: 'inherit', shell: win });
  if (r.status !== 0) { console.error('O npm não conseguiu instalar. Confira a internet e rode de novo.'); process.exit(r.status || 1); }
}

const origem = path.join(RAIZ_PROJETO, 'estudio', 'motor3d', 'node_modules');
const atalho = path.join(RAIZ_PROJETO, 'estudio', 'node_modules');
if (!fs.existsSync(origem)) { console.error('Não achei estudio/motor3d/node_modules: a instalação não terminou.'); process.exit(1); }
let existe = false;
try { fs.lstatSync(atalho); existe = true; } catch { /* não existe */ }
if (existe) console.log('estudio/node_modules já existe.');
else {
  fs.symlinkSync(win ? origem : path.join('motor3d', 'node_modules'), atalho, 'junction');
  console.log('Criei estudio/node_modules → motor3d/node_modules (os scripts do Node acham o three daí).');
}
