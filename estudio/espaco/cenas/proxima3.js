// Roteiro "Uma supernova perto do Sol", bloco 3: a luz da estrela leva mais de quatro anos para chegar até a Terra.
// Distância e velocidade ILUSTRATIVAS (não estão em escala).
import * as THREE from 'three';
import { criarCorpo } from '../corpos.js';
import { criarEstrelas, criarPoeiraMundo, texturaHalo } from '../fundo.js';
import { Rig, resolverPadrao } from '../camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 1800, raio: 140, semente: 41, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 260, raio: 80, semente: 43, tamanho: (H / 1080) * 1.8 }));
  scene.add(criarPoeiraMundo({ n: 100, centro: new THREE.Vector3(0, 0, 0), raioMin: 6, raioMax: 36, tam: H / 1080, semente: 5 }));
  const luz = new THREE.Vector3(1, 0.3, 0.7); // a luz vem da estrela, à direita
  const terra = criarCorpo('terra', { luz });
  terra.grupo.position.set(-11, 0, 0);
  terra.grupo.scale.setScalar(2.4);
  scene.add(terra.grupo);
  const estrela = criarCorpo('estrelaM', { luz });
  estrela.grupo.position.set(11, 0, 0);
  estrela.grupo.scale.setScalar(4.0);
  scene.add(estrela.grupo);

  const xE = 11 - 4.0, xT = -11 + 2.4 + 0.2, y = 0;
  const linha = new THREE.Mesh(
    new THREE.PlaneGeometry(xE - xT, 0.04),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uA: { value: 0 }, uProg: { value: 0 }, uLen: { value: xE - xT } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `precision highp float; varying vec2 vUv; uniform float uA,uProg,uLen;
        void main(){ float d=step(0.5,fract(vUv.x*uLen*3.0)); float ate=step(1.0-vUv.x,uProg); float e=1.0-abs(vUv.y*2.0-1.0);
        vec3 c=mix(vec3(0.72,0.68,0.95),vec3(1.0,0.86,0.45),ate); gl_FragColor=vec4(c,d*uA*e*mix(0.45,1.0,ate)); }`,
    })
  );
  linha.position.set((xE + xT) / 2, y, 0.1);
  scene.add(linha);
  const grao = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texturaHalo([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,236,170,0.95)'], [0.45, 'rgba(255,170,80,0.35)'], [1, 'rgba(255,120,60,0)']], 256),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  scene.add(grao);

  const duracao = 4;
  const planos = [{
    t0: 0, t1: duracao, curva: 'suave',
    de: { az: 6, el: 3, r: 42, mm: 24, f: 5.6, alvo: [1.5, 0, 0], compo: { x: 0.5, y: 0.5 } },
    para: { az: -6, el: 2, r: 36, mm: 24, f: 5.6, alvo: [-1.5, 0, 0], compo: { x: 0.5, y: 0.5 } },
  }];

  return {
    duracao,
    desenhar(t) {
      const q = rig.quadro(Math.min(t, duracao - 0.01), planos);
      const lente = rig.aplicar(q, q.resolverAlvo(resolverPadrao), t);
      terra.atualizar(t, { spin: 0.08 });
      estrela.atualizar(t, { spin: 0.04 });
      // o grão de luz sai da estrela e chega à Terra no fim do trecho
      const u = suave(entre(t, 0.5, 3.6));
      grao.position.set(xE + (xT - xE) * u, y, 0.3);
      grao.scale.setScalar(1.3 + 0.15 * Math.sin(t * 9));
      grao.material.opacity = u > 0 && u < 1 ? 1 : 0;
      linha.material.uniforms.uA.value = suave(entre(t, 0.2, 0.7));
      linha.material.uniforms.uProg.value = u;
      ui.limpar();
      const a = suave(entre(t, 0.2, 0.6)) * (1 - suave(entre(t, duracao - 0.4, duracao)));
      if (a > 0.02) ui.legenda({ partes: [{ t: 'mais de' }, { t: 'quatro', d: true }, { t: 'anos' }], alpha: a });
      return lente;
    },
  };
}
