// Auditoria de composição, quadro a quadro. A cena registra os "sujeitos" (herói e apoio) com centro e raio no mundo;
// aqui eles viram círculos na tela e são conferidos junto com o texto medido no DOM:
//  A) texto fora da área segura          B) texto por cima do herói
//  C) herói cortado pela borda           D) herói pequeno ou grande demais (hierarquia)
//  E) texto no MESMO lado do herói (sem contrapeso)
import { REGRAS } from './design.js';

export function criarComp(camera, W, H) {
  let sujeitos = [];
  const proj = (p) => {
    const v = p.clone().project(camera);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
  };
  return {
    limpar() { sujeitos = []; },
    // raio no mundo; heroi: o foco da cena; macro: corte intencional (aproximação extrema)
    registrar(centro, raio, { heroi = false, macro = false, nome = '' } = {}) {
      camera.updateMatrixWorld();
      const c = proj(centro);
      const dir = new (centro.constructor)().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(raio);
      const e = proj(centro.clone().add(dir));
      sujeitos.push({ x: c.x, y: c.y, r: Math.hypot(e.x - c.x, e.y - c.y), heroi, macro, nome });
    },
    auditar(raiz) {
      const v = [];
      const textos = [...raiz.querySelectorAll('[data-texto]')].map((el) => el.getBoundingClientRect());
      // vertical (Reels, Shorts, TikTok): topo 12%, base 24%, direita 14% ocupados pela interface da plataforma
      const vert = H > W;
      const mxE = REGRAS.margemX * W - 1, mxD = (vert ? 0.14 : REGRAS.margemX) * W - 1;
      const myT = (vert ? 0.12 : REGRAS.margemY) * H - 1, myB = (vert ? 0.24 : REGRAS.margemY) * H - 1;
      for (const r of textos) {
        if (r.left < mxE || r.right > W - mxD || r.top < myT || r.bottom > H - myB) v.push('A:texto fora da area segura');
      }
      const heroi = sujeitos.find((s) => s.heroi);
      for (const s of sujeitos) {
        for (const r of textos) {
          const cx = Math.min(Math.max(s.x, r.left), r.right);
          const cy = Math.min(Math.max(s.y, r.top), r.bottom);
          if (s.heroi && !s.macro && Math.hypot(s.x - cx, s.y - cy) < s.r * 0.9) v.push('B:texto sobre o heroi');
        }
        if (s.heroi && !s.macro) {
          const fora = Math.max(0, s.r - s.x) + Math.max(0, s.x + s.r - W);
          const foraV = Math.max(0, s.r - s.y) + Math.max(0, s.y + s.r - H);
          if (fora / (2 * s.r) > 0.12 || foraV / (2 * s.r) > 0.12) v.push('C:heroi cortado pela borda');
          const d = (2 * s.r) / Math.min(W, H);
          if (d < 0.28 || d > REGRAS.alturaHeroi[1] + 0.05) v.push(`D:heroi com ${(d * 100).toFixed(0)}% da altura`);
        }
      }
      if (heroi && textos.length) {
        const tx = textos.reduce((a, r) => a + (r.left + r.right) / 2, 0) / textos.length / W;
        const hx = heroi.x / W;
        if ((hx - 0.5) * (tx - 0.5) > 0 && Math.abs(tx - 0.5) > 0.12 && Math.abs(hx - 0.5) > 0.08) v.push('E:texto do mesmo lado do heroi');
      }
      return [...new Set(v)];
    },
  };
}
