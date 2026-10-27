// A Terra por dentro, filmada: abertura larga, close nas camadas, ângulo alto, macro na crosta, recuo final.
import * as THREE from 'three';
import { CAMADAS_TERRA } from '../corte.js';
import { criarNuvens, criarAtmosfera } from '../planeta.js';
import { montarCorte, planosCorte } from '../sequencia.js';

const rimDaCrosta = (corte) => corte.userData.pontoNoCorte(2, 1.0, 0.97);

export function montar(ctx) {
  const luz = new THREE.Vector3(-0.9, 0.5, 0.7);
  return montarCorte(ctx, {
    modo: 'terra', camadas: CAMADAS_TERRA(), semente: 11, luz, duracao: 22,
    abre: [0.8, 3.8], fecha: [18.0, 21.0],
    planos: planosCorte(rimDaCrosta),
    passos: [
      { foco: [0, 0], r: 0.09, lado: 'esq', y: 0.40, titulo: 'Núcleo interno', valor: '5.400 °C', t0: 4.9, t1: 6.7 },
      { foco: [1, 1], r: 0.28, lado: 'dir', y: 0.62, titulo: 'Núcleo externo', valor: '4.500 °C', t0: 6.9, t1: 8.5 },
      { foco: [2, 3], r: 0.58, lado: 'esq', y: 0.62, titulo: 'Manto', valor: '2.900 km', t0: 9.4, t1: 11.6 },
      { foco: [4, 5], r: 0.93, lado: 'dir', y: 0.30, titulo: 'Crosta', valor: '5 a 70 km', t0: 14.0, t1: 16.9 },
    ],
    extras({ scene, centro, raio, corte }) {
      const nuvens = criarNuvens({ centro, raio });
      nuvens.material.uniforms.uCut.value = 1;
      nuvens.material.uniforms.uLight.value.copy(luz).normalize();
      scene.add(nuvens);
      const atm = criarAtmosfera({ centro, raio });
      atm.material.uniforms.uLight.value.copy(luz).normalize();
      atm.material.uniforms.uForca.value = 0.8;
      scene.add(atm);
      return {
        aCada(t) {
          const u = nuvens.material.uniforms;
          u.uTime.value = t;
          u.uCutRot.value.copy(corte.material.uniforms.uCutRot.value);
          u.uSpin.value.copy(corte.material.uniforms.uSpin.value);
          u.uCutD.value = corte.material.uniforms.uCutD.value;
        },
      };
    },
  });
}
