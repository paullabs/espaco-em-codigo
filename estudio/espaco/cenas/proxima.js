// Roteiro "Uma supernova perto do Sol", bloco 2 (0–4 s do trecho): a câmera sai da Terra e viaja até a anã vermelha.
// Distância ILUSTRATIVA (não está em escala): 4,24 anos-luz não cabem no quadro, então o trajeto é comprimido.
import * as THREE from 'three';
import { criarCorpo } from '../corpos.js';
import { criarEstrelas, criarPoeiraMundo } from '../fundo.js';
import { Rig, resolverPadrao } from '../camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 1800, raio: 140, semente: 31, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 300, raio: 80, semente: 33, tamanho: (H / 1080) * 1.8 }));
  scene.add(criarPoeiraMundo({ n: 110, centro: new THREE.Vector3(30, 0, 0), raioMin: 8, raioMax: 40, tam: H / 1080, semente: 9 }));

  const luz = new THREE.Vector3(-1, 0.35, 0.7);
  const terra = criarCorpo('terra', { luz });
  terra.grupo.position.set(0, -0.2, -2.6); // a Terra fica à esquerda da rota da câmera: aparece no começo e sai de quadro sem ser atravessada
  scene.add(terra.grupo);
  const anA = criarCorpo('estrelaM', { luz });
  anA.grupo.position.set(60, 0, 0);
  anA.grupo.scale.setScalar(3.2);
  scene.add(anA.grupo);

  const duracao = 4;
  const planos = [
    {
      t0: 0, t1: duracao, curva: 'parte',
      de: { centro: [1.2, 0, 0], az: -90, el: 0, r: 9, mm: 35, f: 4, alvo: [3.5, 0, 0], compo: { x: 0.5, y: 0.5 } },
      para: { centro: [60, 0, 0], az: -90, el: 0, r: 38, mm: 50, f: 2.8, alvo: [60, 0, 0], compo: { x: 0.5, y: 0.5 } },
    },
  ];

  return {
    duracao,
    desenhar(t) {
      const q = rig.quadro(Math.min(t, duracao - 0.01), planos);
      const alvo = q.resolverAlvo(resolverPadrao);
      const lente = rig.aplicar(q, alvo, t);
      terra.atualizar(t, { spin: 0.08 });
      anA.atualizar(t, { spin: 0.04 });
      comp.registrar(new THREE.Vector3(60, 0, 0), 3.2, { heroi: true, macro: false, nome: 'proxima' });
      ui.limpar();
      // legenda: entra em 0,2 s, sai no fim do trecho
      const a = suave(entre(t, 0.2, 0.6)) * (1 - suave(entre(t, duracao - 0.4, duracao)));
      if (a > 0.02) ui.legenda({ partes: [{ t: '4,24', d: true }, { t: 'anos-luz' }], alpha: a });
      return lente;
    },
  };
}
