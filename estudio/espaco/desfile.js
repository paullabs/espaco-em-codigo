// Desfile de ativos: câmera de cinema que passa por uma fila de corpos, um por vez (lente 50 mm, foco no corpo),
// com um rótulo por vez (nome e UM número). Movimento contínuo: fica no corpo e desliza para o próximo.
import * as THREE from 'three';
import { criarCorpo } from './corpos.js';
import { criarEstrelas, criarPoeiraMundo } from './fundo.js';
import { Rig, resolverPadrao } from './camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);

// itens: [{ chave, valor, escala(opcional: quanto afastar a câmera), spin }]
export function montarDesfile({ scene, camera, ui, comp, W, H }, { itens, T = 3.4, espaco = 11, luz = new THREE.Vector3(-1, 0.35, 0.7), mm = 50, f = 2.4, bloom = 0.55 }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 1700, raio: 90, semente: 3, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 300, raio: 50, semente: 8, tamanho: (H / 1080) * 1.8 }));
  scene.add(criarPoeiraMundo({ n: 120, centro: new THREE.Vector3(itens.length * espaco * 0.5, 0, 0), raioMin: 4, raioMax: 20 + itens.length * 4, tam: H / 1080, semente: 6 }));
  const corpos = itens.map((it, i) => {
    const c = criarCorpo(it.chave, { luz });
    c.grupo.position.set(i * espaco, 0, 0);
    c.grupo.scale.setScalar(it.raio || 1);
    scene.add(c.grupo);
    return c;
  });
  const dist = (it) => 12.0 * (it.escala || 1) * (it.raio || 1);
  const planos = [];
  itens.forEach((it, i) => {
    const t0 = i * T;
    const r = dist(it);
    const prox = itens[i + 1];
    planos.push({
      t0, t1: t0 + T * 0.64, curva: 'meio',
      de: { centro: [i * espaco, 0, 0], az: -24, el: 6, r, mm, f, alvo: [i * espaco, 0, 0], compo: { x: 0.36, y: 0.5 } },
      para: { centro: [i * espaco, 0, 0], az: 6, el: 10, r: r * 0.93, mm, f, alvo: [i * espaco, 0, 0], compo: { x: 0.36, y: 0.5 } },
    });
    if (prox) {
      planos.push({
        t0: t0 + T * 0.64, t1: t0 + T, curva: 'suave',
        de: { centro: [i * espaco, 0, 0], az: 6, el: 10, r: r * 0.93, mm, f, alvo: [i * espaco, 0, 0], compo: { x: 0.36, y: 0.5 } },
        para: { centro: [(i + 1) * espaco, 0, 0], az: -24, el: 6, r: dist(prox), mm, f, alvo: [(i + 1) * espaco, 0, 0], compo: { x: 0.36, y: 0.5 } },
      });
    }
  });
  const duracao = itens.length * T;
  return {
    duracao,
    desenhar(t) {
      const tt = Math.min(t, duracao - 0.01);
      const q = rig.quadro(tt, planos);
      const alvo = q.resolverAlvo(resolverPadrao);
      const lente = rig.aplicar(q, alvo, tt);
      corpos.forEach((c, i) => c.atualizar(t, { spin: itens[i].spin ?? 0.1 }));
      ui.limpar();
      comp.registrar(corpos[Math.min(itens.length - 1, Math.floor(tt / T))].grupo.position, (itens[Math.min(itens.length - 1, Math.floor(tt / T))].raio || 1) * (itens[Math.min(itens.length - 1, Math.floor(tt / T))].aro || 1), { heroi: true });
      const i = Math.min(itens.length - 1, Math.floor(tt / T));
      const u = (tt - i * T) / T;
      const a = suave(clamp((u - 0.1) / 0.12)) * (1 - suave(clamp((u - 0.55) / 0.1)));
      if (a > 0.02) {
        const it = itens[i];
        const R = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        const U = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
        const raio = (it.raio || 1) * (it.ancora || 1);
        const p = corpos[i].grupo.position.clone().add(R.multiplyScalar(raio * 0.8)).add(U.multiplyScalar(raio * 0.2));
        ui.rotulo({ alvo: p, camera, coluna: 'dir', y: 0.5, titulo: corpos[i].dados.nome, valor: it.valor, alpha: a });
      }
      return { ...lente, bloom };
    },
  };
}
