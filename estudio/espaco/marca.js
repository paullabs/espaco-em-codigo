// Marca d'água do canal no MOTOR DO ESPAÇO: o pós-processamento (pos.js) desenha esta textura em todo quadro, e nenhuma
// cena, estilo ou flag a liga ou desliga. Onde, quando e como ela aparece está em marca_agenda.js (o mesmo arquivo vale para
// os outros motores, via estudio/marca_pagina.mjs). Documentada no LEIAME do kit: os vídeos feitos com ele levam essa marca.
import * as THREE from 'three';
import { MARCA, agendaMarca, tamanhoMarca, desenharMarca } from './marca_agenda.js';

export { MARCA, agendaMarca };

// textura da marca (tamanho relativo ao menor lado do quadro)
export function texturaMarca(W, H) {
  const tam = tamanhoMarca(W, H);
  const c = document.createElement('canvas'); c.width = tam.cw; c.height = tam.ch;
  desenharMarca(c.getContext('2d'), tam);
  const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  return { tex, uw: tam.cw / W, uh: tam.ch / H };
}
