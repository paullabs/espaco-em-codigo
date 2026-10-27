// A Lua por dentro: núcleo sólido, núcleo líquido, camada parcialmente fundida, manto de cristais, crosta em estratos.
import * as THREE from 'three';
import { CAMADAS_LUA } from '../corte.js';
import { montarCorte, planosCorte } from '../sequencia.js';

const rim = (corte) => corte.userData.pontoNoCorte(2, 1.0, 0.975);

export function montar(ctx) {
  return montarCorte(ctx, {
    modo: 'lua', camadas: CAMADAS_LUA(), semente: 14, luz: new THREE.Vector3(-0.9, 0.5, 0.7), duracao: 22,
    abre: [0.8, 3.8], fecha: [18.0, 21.0],
    planos: planosCorte(rim),
    passos: [
      { foco: [0, 1], r: 0.17, lado: 'esq', y: 0.40, titulo: 'Núcleo', valor: '350 km', t0: 4.9, t1: 8.3 },
      { foco: [3, 3], r: 0.62, lado: 'dir', y: 0.62, titulo: 'Manto', valor: '1.350 km', t0: 9.4, t1: 11.9 },
      { foco: [4, 5], r: 0.97, lado: 'dir', y: 0.30, titulo: 'Crosta', valor: '40 km', t0: 14.0, t1: 16.9 },
    ],
  });
}
