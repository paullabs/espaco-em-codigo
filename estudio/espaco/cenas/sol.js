// O Sol por dentro, filmado: abertura larga, close nas camadas, ângulo alto, macro na superfície, recuo final.
import * as THREE from 'three';
import { CAMADAS_SOL } from '../corte.js';
import { texturaHalo, texturaRaios } from '../fundo.js';
import { criarHaloSol } from '../planeta.js';
import { montarCorte, planosCorte } from '../sequencia.js';

const rimDaSuperficie = (corte) => corte.userData.pontoNoCorte(2, 1.0, 0.97);

export function montar(ctx) {
  return montarCorte(ctx, {
    modo: 'sol', camadas: CAMADAS_SOL(), semente: 5, duracao: 22,
    abre: [0.8, 3.8], fecha: [18.0, 21.0],
    planos: planosCorte(rimDaSuperficie),
    passos: [
      { foco: [0, 0], r: 0.12, lado: 'esq', y: 0.40, titulo: 'Núcleo', valor: '15 milhões °C', t0: 4.9, t1: 6.7 },
      { foco: [1, 1], r: 0.43, lado: 'dir', y: 0.62, titulo: 'Zona radiativa', valor: '7 milhões °C', t0: 6.9, t1: 8.5 },
      { foco: [2, 2], r: 0.76, lado: 'esq', y: 0.62, titulo: 'Zona convectiva', valor: '2 milhões °C', t0: 9.4, t1: 11.6 },
      { foco: [3, 4], r: 0.94, lado: 'dir', y: 0.30, titulo: 'Superfície', valor: '5.500 °C', t0: 14.0, t1: 16.9 },
    ],
    extras({ scene, centro, raio }) {
      const halo = criarHaloSol({
        centro, raio, escala: 1,
        texHalo: texturaHalo([[0, 'rgba(255,190,90,0.55)'], [0.22, 'rgba(255,150,70,0.34)'], [0.4, 'rgba(255,94,126,0.16)'], [0.6, 'rgba(160,60,200,0.07)'], [1, 'rgba(40,20,90,0)']]),
        texRaios: texturaRaios(36, '255,190,110'),
      });
      halo.position.z = -0.5;
      halo.userData.raios.material.opacity = 0.16;
      scene.add(halo);
      return {
        aCada(t, corte) {
          // o halo olha sempre para a câmera (sprite), fica atrás do disco em relação à câmera
          halo.userData.raios.material.rotation = t * 0.02;
          halo.userData.halo.scale.setScalar(raio * 5.2 * (1 + 0.012 * Math.sin(t * 1.4)));
          halo.position.set(0, 0, 0);
        },
      };
    },
  });
}
