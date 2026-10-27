// Marca d'água do canal nos motores que leem o quadro pelo canvas (leve, dramático, esportes e o 3D base):
// `await instalarMarca(pagina)` depois que a página do renderizador estiver pronta. Ele
//  1) guarda o tempo do quadro (window.__motor.renderAt(t) ou window.__render.quadro(i));
//  2) na hora em que o renderizador pede o quadro (canvas.toDataURL), compõe a marca no quadro, na posição da agenda.
// A agenda e o desenho vêm de estudio/espaco/marca_agenda.js (um arquivo só para todos os motores).
// O motor do espaço não usa isto: o pos.js dele já desenha a marca no passe final.
// Documentado no LEIAME do kit; `npm run conferir -- marca` confere que cada renderizador chama isto.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const ARQ_AGENDA = path.join(AQUI, 'espaco', 'marca_agenda.js');
export const ARQ_FONTE = path.join(AQUI, 'espaco', 'fontes', 'Outfit.ttf');

export async function instalarMarca(pagina, { fps = 24 } = {}) {
  const codigo = fs.readFileSync(ARQ_AGENDA, 'utf8').replace(/^export\s+/gm, '');
  const fonte = fs.readFileSync(ARQ_FONTE).toString('base64');
  await pagina.evaluate(async ({ codigo, fps, fonte }) => {
    if (window.__marcaOk) return;
    // a fonte da marca viaja junto: o desenho é o mesmo em qualquer página, sem depender das fontes dela
    const bytes = Uint8Array.from(atob(fonte), (c) => c.charCodeAt(0));
    const face = new FontFace('MarcaLabs', bytes.buffer, { weight: '100 900' });
    document.fonts.add(await face.load());
    const { MARCA, agendaMarca, tamanhoMarca, desenharMarca } = new Function(`${codigo}\nreturn { MARCA, agendaMarca, tamanhoMarca, desenharMarca };`)();
    // 1) o tempo do quadro
    const m = window.__motor, r = window.__render;
    if (m && m.renderAt) { const f = m.renderAt; m.renderAt = function (t) { window.__marcaT = t; return f.apply(this, arguments); }; }
    if (r && r.quadro) { const f = r.quadro; r.quadro = function (i) { window.__marcaT = i / (r.fps || fps); return f.apply(this, arguments); }; }
    // 2) a marca entra no quadro na leitura do canvas (só nos canvases com formato de vídeo: 9:16, 16:9 ou 4:5)
    const original = HTMLCanvasElement.prototype.toDataURL;
    const cache = {}; let dentro = false;
    HTMLCanvasElement.prototype.toDataURL = function () {
      const W = this.width, H = this.height, ar = W / H;
      const video = Math.min(W, H) >= 270 && [9 / 16, 16 / 9, 4 / 5].some((x) => Math.abs(ar - x) < 0.02);
      if (dentro || !video) return original.apply(this, arguments);
      let tmp = cache.tmp;
      if (!tmp || tmp.width !== W || tmp.height !== H) { tmp = cache.tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; }
      const g = tmp.getContext('2d');
      g.globalAlpha = 1; g.drawImage(this, 0, 0);
      const tam = tamanhoMarca(W, H), chave = `${W}x${H}`;
      let mk = cache[chave];
      if (!mk) { mk = cache[chave] = document.createElement('canvas'); mk.width = tam.cw; mk.height = tam.ch; desenharMarca(mk.getContext('2d'), tam); }
      const ag = agendaMarca(window.__marcaT || 0, H > W);
      g.globalAlpha = MARCA.opacidade * ag.a;
      g.drawImage(mk, Math.round((ag.lado === 'e' ? ag.x : ag.x - tam.cw / W) * W), Math.round(ag.y * H));
      g.globalAlpha = 1;
      dentro = true;
      try { return original.apply(tmp, arguments); } finally { dentro = false; }
    };
    window.__marcaOk = true;
  }, { codigo, fps, fonte });
}
