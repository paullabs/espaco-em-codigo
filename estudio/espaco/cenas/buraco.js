// Buraco negro, filmado: grande angular rasante, close 50 mm com desfoque, visão de cima, recuo por baixo do plano.
import * as THREE from 'three';
import { criarBuraco } from '../buraco.js';
import { criarEstrelas } from '../fundo.js';
import { Rig } from '../camera.js';

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  const bh = criarBuraco({ passos: 380 });
  scene.add(bh);
  const planos = [
    // 1) 24 mm: disco inteiro no terço esquerdo; o texto fica na coluna da direita
    { t0: 0, t1: 5, curva: 'parte', de: { az: -10, el: 4, r: 36, mm: 24, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } }, para: { az: 4, el: 10, r: 27.5, mm: 24, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } } },
    // 2) 50 mm aberto: close na sombra, disco vazando pelos lados (macro intencional)
    { t0: 5, t1: 10.5, curva: 'meio', macro: true, de: { az: 6, el: 13, r: 36, mm: 50, f: 2, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } }, para: { az: -10, el: 24, r: 30, mm: 50, f: 2, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } } },
    // 3) 35 mm de cima
    { t0: 10.5, t1: 16, curva: 'suave', macro: true, de: { az: -8, el: 56, r: 46, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } }, para: { az: 14, el: 72, r: 40, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } } },
    // 4) recuo 24 mm por baixo do plano do disco
    { t0: 16, t1: 22, curva: 'chega', de: { az: 10, el: 4, r: 26, mm: 24, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } }, para: { az: -6, el: -5, r: 36, mm: 24, f: 8, alvo: [0, 0, 0], compo: { x: 0.4, y: 0.5 } } },
  ];
  const passos = [
    { t0: 1.4, t1: 3.4, lado: 'dir', y: 0.70, titulo: 'Disco de gás', ponto: () => new THREE.Vector3(6.4, 0, 3.0) },
    { t0: 6.0, t1: 7.9, lado: 'esq', y: 0.72, titulo: 'Sem volta', ponto: (R, U) => R.clone().multiplyScalar(-2.62).add(U.clone().multiplyScalar(-0.25)) },
    { t0: 8.2, t1: 10.2, lado: 'esq', y: 0.24, titulo: 'Luz dobrada', ponto: (R, U) => U.clone().multiplyScalar(3.9).add(R.clone().multiplyScalar(-1.6)) },
    { t0: 17.0, t1: 19.4, lado: 'dir', y: 0.22, titulo: 'Jatos', ponto: () => new THREE.Vector3(0, 7.5, 0) },
  ];
  return {
    duracao: 22,
    desenhar(t) {
      const q = rig.quadro(t, planos);
      const lente = rig.aplicar(q, new THREE.Vector3(0, 0, 0), t);
      bh.userData.sincronizar(camera, W, H, lente.cx, lente.cy);
      comp.registrar(new THREE.Vector3(0, 0, 0), 7.4, { heroi: true, macro: !!q.plano.macro, nome: 'buraco' });
      bh.material.uniforms.uTime.value = t;
      ui.limpar();
      const R = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const U = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      for (const a of passos) {
        const f = Math.min(1, Math.max(0, (t - a.t0) / 0.5)) * (1 - Math.min(1, Math.max(0, (t - (a.t1 - 0.5)) / 0.5)));
        if (f < 0.02) continue;
        const p = a.ponto(R, U);
        ui.rotulo({ alvo: p, camera, coluna: 'dir', y: 0.5, titulo: a.titulo, alpha: f });
      }
      return lente;
    },
  };
}
