// Escada de tamanhos: Lua, Terra, Júpiter, Sol, Arcturo, Betelgeuse, VY Canis Majoris.
// Cada passo mostra o corpo novo (herói, terço esquerdo) entrando pela esquerda enquanto o anterior ENCOLHE
// até virar um ponto ao lado, na proporção real. Texto: nome e quantas vezes maior (um por vez, coluna da direita).
import * as THREE from 'three';
import { criarCorpo } from '../corpos.js';
import { DADOS } from '../dados.js';
import { criarEstrelas, criarPoeiraMundo } from '../fundo.js';
import { Rig, resolverPadrao } from '../camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));

const ESCADA = [
  { chave: 'lua', nome: 'Lua' },
  { chave: 'terra', nome: 'Terra' },
  { chave: 'jupiter', nome: 'Júpiter' },
  { chave: 'estrelaG', nome: 'Sol' },
  { chave: 'gigante', nome: 'Arcturo' },
  { chave: 'supergigante', nome: 'Betelgeuse' },
  { chave: 'vyCma', nome: 'VY Canis Majoris' },
];
const fmt = (r) => (r < 10 ? r.toFixed(1).replace('.', ',') : String(Math.round(r))) + '×';

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  const luz = new THREE.Vector3(-1, 0.35, 0.7);
  scene.add(criarEstrelas({ n: 1500, raio: 90, semente: 21, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 240, raio: 50, semente: 24, tamanho: (H / 1080) * 1.8 }));
  scene.add(criarPoeiraMundo({ n: 100, centro: new THREE.Vector3(0, 0, 0), raioMin: 6, raioMax: 26, tam: H / 1080, semente: 8 }));
  const R0 = 2.25; // raio do herói em unidades da cena
  const corpos = ESCADA.map((e) => {
    const c = criarCorpo(e.chave, { luz });
    c.grupo.visible = false;
    scene.add(c.grupo);
    return c;
  });
  const raioKm = ESCADA.map((e) => DADOS[e.chave].raioKm);
  const razao = (i) => raioKm[i] / raioKm[i - 1];

  const T0 = 2.6; // começa a primeira transição (Lua -> Terra)
  const PASSO = 4.4;
  const TR = 1.6; // duração da transição
  const duracao = T0 + 6 * PASSO + 0.6;
  const posRef = (i) => { // posição do corpo anterior, já encolhido (à direita e embaixo do herói)
    const r = R0 / razao(i);
    return new THREE.Vector3(R0 + 1.1 + r, -1.55, 0.5);
  };

  const planos = [];
  for (let k = 0; k <= 6; k++) {
    const a = k === 0 ? 0 : T0 + (k - 1) * PASSO + TR * 0.5;
    const b = k === 6 ? duracao : T0 + k * PASSO + TR * 0.5;
    planos.push({
      t0: a, t1: b, curva: 'meio',
      de: { az: -16, el: 6, r: 16.2, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.36, y: 0.5 } },
      para: { az: -7, el: 8, r: 14.8, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.36, y: 0.5 } },
    });
  }

  return {
    duracao,
    desenhar(t) {
      const q = rig.quadro(t, planos);
      const lente = rig.aplicar(q, new THREE.Vector3(0, 0, 0), t);
      corpos.forEach((c) => (c.grupo.visible = false));
      // beat: i = índice do herói atual (o novo corpo), u = progresso da transição em direção a ele
      const i = clamp(Math.floor((t - T0 + 0.0001) / PASSO) + 1, 0, 6);
      const ini = T0 + (i - 1) * PASSO;
      const u = i === 0 ? 1 : suave(entre(t, ini, ini + TR));
      let heroi = corpos[i];
      const ajustar = (c, pos, raio) => { c.grupo.visible = raio > 1e-4; c.grupo.position.copy(pos); c.grupo.scale.setScalar(Math.max(raio, 1e-4)); };
      if (i === 0) {
        ajustar(corpos[0], new THREE.Vector3(0, 0, 0), R0);
      } else {
        const r = razao(i);
        // o novo entra pela esquerda (sentido de leitura) e para no terço esquerdo
        ajustar(corpos[i], new THREE.Vector3(-26 * (1 - u), 0, 0), R0);
        // o anterior encolhe na proporção real e vai para o lado do herói
        const rAnt = R0 * Math.pow(r, -u);
        const pFim = posRef(i);
        const pAnt = new THREE.Vector3(pFim.x * u, pFim.y * u, 0.5 * u);
        ajustar(corpos[i - 1], pAnt, rAnt);
        // o anterior ao anterior some (já era só um ponto)
        if (i >= 2) {
          const r2 = R0 / razao(i - 1) * Math.pow(razao(i), -u) * (1 - u);
          const p2 = posRef(i - 1).multiplyScalar(1 - u * 0.0);
          ajustar(corpos[i - 2], p2, r2 * 0.0 + Math.max(0, (R0 / razao(i - 1)) * (1 - u)));
        }
      }
      corpos.forEach((c, k) => c.atualizar(t, { spin: k === 3 ? 0.04 : 0.08 }));

      ui.limpar();
      comp.registrar(new THREE.Vector3(0, 0, 0), R0, { heroi: true, nome: ESCADA[i].nome });
      // rótulo do herói: aparece depois da transição, some antes da próxima
      const fim = i === 6 ? duracao : T0 + i * PASSO;
      const a = i === 0
        ? suave(entre(t, 0.8, 1.3)) * (1 - suave(entre(t, T0 - 0.5, T0 + 0.2)))
        : suave(entre(t, ini + TR * 0.8, ini + TR + 0.5)) * (1 - suave(entre(t, fim - 0.2, fim + 0.3)));
      if (a > 0.02) {
        const R = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const U = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const p = R.multiplyScalar(R0 * 0.82).add(U.multiplyScalar(R0 * 0.25));
        ui.rotulo({ alvo: p, camera, coluna: 'dir', y: 0.5, titulo: ESCADA[i].nome, valor: i === 0 ? null : fmt(razao(i)), alpha: a });
      }
      return lente;
    },
  };
}
