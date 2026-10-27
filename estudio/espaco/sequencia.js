// Corte em camadas, filmado como cinema: vários planos (lente em mm, abertura f, foco, curva de tempo estilo
// After Effects), o corte abre no começo e fecha no fim, uma camada por vez ganha foco e UM rótulo aparece.
// Sem título, sem subtítulo, sem nota: a explicação é da narração. Fundo preto.
import * as THREE from 'three';
import { criarCorte } from './corte.js';
import { criarEstrelas, criarPoeiraMundo } from './fundo.js';
import { Rig, sph, resolverPadrao } from './camera.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const entre = (t, a, b) => clamp((t - a) / (b - a));

// cfg: { modo, camadas, semente, luz, duracao, planos:[...], passos:[{ foco:[lo,hi], r, lado, y, titulo, valor, t0, t1 }],
//        abre:[t0,t1], fecha:[t0,t1], extras(ctx) -> { aCada(t, corte) } }
// planos padrão do corte: 5 planos com herói no terço esquerdo (texto na coluna da direita), alturas de 50% a 95% do quadro
export const planosCorte = (rim) => [
  { t0: 0, t1: 4.2, curva: 'parte', de: { az: -38, el: -7, r: 15.5, mm: 24, f: 4, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } }, para: { az: -6, el: 3, r: 10.4, mm: 24, f: 4, alvo: [0, 0, 0], compo: { x: 0.37, y: 0.5 } } },
  { t0: 4.2, t1: 8.6, curva: 'meio', de: { az: 32, el: 6, r: 21.5, mm: 50, f: 2, alvo: [0, 0, 0], compo: { x: 0.34, y: 0.5 } }, para: { az: -6, el: 17, r: 18.4, mm: 50, f: 2, alvo: [0, 0, 0], compo: { x: 0.34, y: 0.5 } } },
  { t0: 8.6, t1: 13, curva: 'suave', de: { az: -22, el: 64, r: 15.4, mm: 35, f: 3.2, alvo: [0, 0, 0], compo: { x: 0.36, y: 0.5 } }, para: { az: 18, el: 46, r: 13.2, mm: 35, f: 3.2, alvo: [0, 0, 0], compo: { x: 0.35, y: 0.5 } } },
  { t0: 13, t1: 17.8, curva: 'chega', macro: true, de: { az: 24, el: 8, r: 15, mm: 85, f: 1.8, alvo: rim, compo: { x: 0.38, y: 0.5 } }, para: { az: 10, el: 14, r: 10.5, mm: 85, f: 1.8, alvo: rim, compo: { x: 0.38, y: 0.5 } } },
  { t0: 17.8, t1: 22, curva: 'suave', de: { az: -12, el: 2, r: 10.4, mm: 24, f: 4, alvo: [0, 0, 0], compo: { x: 0.37, y: 0.5 } }, para: { az: -40, el: -4, r: 15.5, mm: 24, f: 5.6, alvo: [0, 0, 0], compo: { x: 0.5, y: 0.5 } } },
];

export function montarCorte({ scene, camera, ui, comp, W, H }, cfg) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 1500, raio: 70, semente: cfg.semente || 5, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 260, raio: 40, semente: (cfg.semente || 5) + 3, tamanho: (H / 1080) * 1.8 }));
  const centro = new THREE.Vector3(0, 0, 0);
  const raio = 2.25;
  scene.add(criarPoeiraMundo({ n: 160, centro, raioMin: 4, raioMax: 20, tam: H / 1080, semente: cfg.semente || 5 }));
  const corte = criarCorte({ modo: cfg.modo, camadas: cfg.camadas, centro, raio, luz: cfg.luz });
  scene.add(corte);
  const ext = cfg.extras ? cfg.extras({ scene, centro, raio, corte }) : {};
  const [a0, a1] = cfg.abre || [0.6, 3.4];
  const [f0, f1] = cfg.fecha || [cfg.duracao - 4.5, cfg.duracao - 1.5];

  return {
    duracao: cfg.duracao,
    desenhar(t) {
      const u = corte.material.uniforms;
      u.uTime.value = t;
      corte.userData.giro(t * (cfg.modo === 'sol' ? 0.05 : 0.07));

      // 1) câmera: posição vem do plano; o corte olha para a câmera, um pouco para cima e para a direita
      const q = rig.quadro(t, cfg.planos);
      const dir = sph(q.az + 29, q.el + 24, 1);
      corte.userData.orientar(dir, 0.14 * Math.sin(t * 0.25));
      // 2) abertura: o corte se abre no começo e se fecha no fim
      const aberto = suave(entre(t, a0, a1)) * (1 - suave(entre(t, f0, f1)));
      u.uCutD.value = 0.62 * (1 - aberto);
      // 3) alvo (pode depender do corte já orientado) e lente
      const alvo = q.resolverAlvo((k) => (Array.isArray(k) ? new THREE.Vector3().fromArray(k) : k(corte)));
      const lente = rig.aplicar(q, alvo, t);
      comp.registrar(centro, raio, { heroi: true, macro: !!q.plano.macro, nome: cfg.modo });
      ui.limpar();

      // 4) um passo por vez: camada em foco + um rótulo
      let ativo = null;
      let f = 0;
      for (const p of cfg.passos) {
        const a = suave(entre(t, p.t0, p.t0 + 0.5)) * (1 - suave(entre(t, p.t1 - 0.5, p.t1)));
        if (a > f) { f = a; ativo = p; }
      }
      u.uFocoF.value = ativo ? f : 0;
      if (ativo) {
        u.uFocoLo.value = ativo.foco[0];
        u.uFocoHi.value = ativo.foco[1];
        const p = corte.userData.melhorPonto(camera, ativo.r, 'dir', W, H, 0.5 * H);
        if (f > 0.02) ui.rotulo({ alvo: p, camera, coluna: 'dir', y: 0.5, titulo: ativo.titulo, valor: ativo.valor, alpha: f });
      }
      if (ext.aCada) ext.aCada(t, corte, aberto);
      return lente;
    },
  };
}
