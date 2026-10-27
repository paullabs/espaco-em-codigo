// Roteiro "Uma supernova perto do Sol", bloco 5: Próxima é uma anã vermelha: pequena, fria e fraca.
// Sol e Próxima no mesmo quadro (proporção de tamanho real ~6,5:1; distância ILUSTRATIVA); a câmera se aproxima de Próxima até ela ser o herói.
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
  scene.add(criarEstrelas({ n: 1800, raio: 140, semente: 51, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 260, raio: 80, semente: 53, tamanho: (H / 1080) * 1.8 }));
  scene.add(criarPoeiraMundo({ n: 90, centro: new THREE.Vector3(0, 0, 0), raioMin: 6, raioMax: 34, tam: H / 1080, semente: 7 }));
  const sol = criarCorpo('estrelaG');
  sol.grupo.position.set(-5.6, 0, 0);
  sol.grupo.scale.setScalar(2.8);
  scene.add(sol.grupo);
  const prox = criarCorpo('estrelaM');
  prox.grupo.position.set(5.6, 0, 0);
  prox.grupo.scale.setScalar(2.8 / 6.5);
  scene.add(prox.grupo);

  // linha tracejada entre as duas estrelas
  const xA = -5.6 + 2.8 + 0.5, xB = 5.6 - 0.43 - 0.4;
  const linha = new THREE.Mesh(
    new THREE.PlaneGeometry(xB - xA, 0.035),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uA: { value: 0 }, uLen: { value: xB - xA } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'precision highp float; varying vec2 vUv; uniform float uA,uLen; void main(){ float d=step(0.5,fract(vUv.x*uLen*2.6)); float e=1.0-abs(vUv.y*2.0-1.0); gl_FragColor=vec4(vec3(0.78,0.74,0.98),d*uA*e*0.8); }',
    })
  );
  linha.position.set((xA + xB) / 2, 0, 0.1);
  scene.add(linha);

  const duracao = 5;
  const planos = [{
    t0: 0, t1: duracao, curva: 'suave',
    de: { centro: [0, 0, 0], az: 0, el: 2, r: 26, mm: 35, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } },
    para: { centro: [5.6, 0, 0], az: 0, el: 2, r: 6.2, mm: 50, f: 2.8, alvo: [5.6, 0, 0], compo: { x: 0.5, y: 0.5 } },
  }];
  return {
    duracao,
    desenhar(t) {
      const q = rig.quadro(Math.min(t, duracao - 0.01), planos);
      const lente = rig.aplicar(q, q.resolverAlvo(resolverPadrao), t);
      sol.atualizar(t, { spin: 0.04 });
      prox.atualizar(t, { spin: 0.04 });
      linha.material.uniforms.uA.value = suave(entre(t, 0.4, 1.0)) * (1 - suave(entre(t, 1.8, 2.6)));
      ui.limpar();
      const a = suave(entre(t, 0.3, 0.7)) * (1 - suave(entre(t, duracao - 0.4, duracao)));
      if (a > 0.02) ui.legenda({ partes: [{ t: 'anã' }, { t: 'vermelha', d: true }], alpha: a });
      return lente;
    },
  };
}
