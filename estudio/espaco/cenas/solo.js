// O solo por dentro, filmado: bloco de terreno com os horizontes (folhas, solo fértil, argila, rocha em pedaços, rocha-mãe).
import * as THREE from 'three';
import { criarSolo } from '../solo.js';
import { criarEstrelas, criarPoeiraMundo } from '../fundo.js';
import { Rig, resolverPadrao } from '../camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 900, raio: 80, semente: 12, tamanho: (H / 1080) * 1.0 }));
  scene.add(criarPoeiraMundo({ n: 90, centro: new THREE.Vector3(0, 0, 0), raioMin: 6, raioMax: 22, tam: H / 1080, semente: 2, tons: ['#FFE9B0', '#B9B3E8', '#7FD8A0'] }));
  const solo = criarSolo();
  scene.add(solo);

  const planos = [
    { t0: 0, t1: 4.5, curva: 'parte', de: { az: -34, el: 16, r: 26, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } }, para: { az: -20, el: 11, r: 21.5, mm: 35, f: 4, alvo: [0, 0, 0], compo: { x: 0.31, y: 0.5 } } },
    { t0: 4.5, t1: 9, curva: 'meio', macro: true, de: { az: -14, el: 7, r: 25, mm: 50, f: 2, alvo: [0.6, 0.9, 1.7], compo: { x: 0.31, y: 0.5 } }, para: { az: -3, el: 4, r: 20, mm: 50, f: 2, alvo: [0.8, 0.5, 1.7], compo: { x: 0.31, y: 0.5 } } },
    { t0: 9, t1: 13.5, curva: 'suave', de: { az: -38, el: 3, r: 23, mm: 35, f: 3.2, alvo: [0, -0.7, 0], compo: { x: 0.31, y: 0.5 } }, para: { az: -24, el: 1, r: 20, mm: 35, f: 3.2, alvo: [0, -0.7, 0], compo: { x: 0.31, y: 0.5 } } },
    { t0: 13.5, t1: 17.5, curva: 'chega', macro: true, de: { az: -10, el: 5, r: 30, mm: 85, f: 1.8, alvo: [-0.2, -1.0, 1.7], compo: { x: 0.31, y: 0.5 } }, para: { az: -2, el: 3, r: 23, mm: 85, f: 1.8, alvo: [0.3, -1.0, 1.7], compo: { x: 0.31, y: 0.5 } } },
    { t0: 17.5, t1: 22, curva: 'suave', de: { az: -22, el: 10, r: 15, mm: 24, f: 4, alvo: [0, 0, 0], compo: { x: 0.31, y: 0.5 } }, para: { az: -42, el: 20, r: 24, mm: 24, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } } },
  ];
  const passos = [
    { idx: 0, titulo: 'Folhas', t0: 1.8, t1: 3.8 },
    { idx: 1, titulo: 'Solo fértil', t0: 5.2, t1: 7.2 },
    { idx: 2, titulo: 'Argila', t0: 7.4, t1: 8.9 },
    { idx: 3, titulo: 'Rocha em pedaços', t0: 9.8, t1: 12.0 },
    { idx: 4, titulo: 'Rocha-mãe', t0: 14.2, t1: 17.0 },
  ];
  return {
    duracao: 22,
    desenhar(t) {
      const q = rig.quadro(t, planos);
      const alvo = q.resolverAlvo(resolverPadrao);
      const lente = rig.aplicar(q, alvo, t);
      solo.updateMatrixWorld(true);
      comp.registrar(new THREE.Vector3(0, 0, 0), 3.4, { heroi: true, macro: !!q.plano.macro, nome: 'solo' });
      const u = solo.userData.material.uniforms;
      u.uTime.value = t;
      ui.limpar();
      let ativo = null;
      let f = 0;
      for (const p of passos) {
        const a = suave(entre(t, p.t0, p.t0 + 0.5)) * (1 - suave(entre(t, p.t1 - 0.5, p.t1)));
        if (a > f) { f = a; ativo = p; }
      }
      u.uFocoF.value = ativo ? f : 0;
      if (ativo) {
        u.uFocoLo.value = ativo.idx;
        u.uFocoHi.value = ativo.idx;
        if (f > 0.02) ui.rotulo({ alvo: solo.userData.pontoDoHorizonte(ativo.idx, 0.82), camera, coluna: 'dir', y: 0.5, titulo: ativo.titulo, alpha: f });
      }
      return lente;
    },
  };
}
