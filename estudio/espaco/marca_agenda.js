// Marca d'água do canal (crédito do kit): AGENDA e DESENHO, sem dependências, para valer em TODOS os motores.
// - motor do espaço: marca.js cria a textura e o pos.js a desenha em todo quadro (passe final);
// - leve, dramático e esportes: estudio/marca_pagina.mjs injeta este arquivo na página do renderizador e compõe a marca no
//   canvas na hora de ler o quadro. Um arquivo só decide onde e quando a marca aparece: a mesma agenda em qualquer motor.
//
// - 4% de opacidade: quase ninguém repara, mas está em todos os vídeos.
// - Fica num dos quatro cantos, dentro da área segura (abaixo da zona de cima, acima da zona de baixo, fora da coluna da
//   direita das plataformas e nunca na faixa da legenda) e MUDA de canto a cada 5 a 9 s, numa agenda fixa (mesma em qualquer render).
// - Ao trocar de canto ela some e volta em 0,4 s, para não "pular".
//
// O que isto NÃO é: proteção contra remoção. Num kit aberto quem tem o código pode editá-lo. A defesa real é a licença
// (crédito obrigatório) e o selo conferido por `npm run conferir -- marca`, que acusa se os arquivos da marca ou os
// renderizadores foram alterados. A marca está documentada no LEIAME do kit.
export const MARCA = { nome: 'LABS', opacidade: 0.04, versao: 2 };

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// os quatro cantos (fração da tela). x é a borda esquerda (cantos E) ou a direita (cantos D); y é o topo da marca.
function cantos(vertical) {
  const mx = 0.06, mxD = vertical ? 0.14 : 0.06, mt = vertical ? 0.125 : 0.07, mb = vertical ? 0.24 : 0.07;
  return [
    { id: 'SE', lado: 'e', x: mx, y: mt },
    { id: 'SD', lado: 'd', x: 1 - mxD, y: mt },
    { id: 'IE', lado: 'e', x: mx, y: 1 - mb - 0.045 },
    { id: 'ID', lado: 'd', x: 1 - mxD, y: 1 - mb - 0.045 },
  ];
}

// onde a marca está no tempo t (s): canto, posição e fator de opacidade (0..1)
export function agendaMarca(t, vertical = true) {
  const C = cantos(vertical);
  let ini = 0, anterior = -1;
  for (let i = 0; ; i++) {
    const r = mulberry32(0x51A0 + i * 7919);
    const dur = 5 + 4 * r();
    let k = Math.floor(r() * 4);
    if (k === anterior) k = (k + 1 + Math.floor(r() * 3)) % 4;
    if (t < ini + dur || i > 600) {
      const c = C[k], jx = (r() - 0.5) * 0.024, jy = (r() - 0.5) * 0.024, u = Math.max(0, t - ini);
      const a = Math.min(1, u / 0.4) * Math.min(1, (dur - u) / 0.4);
      return { id: c.id, lado: c.lado, x: c.x + jx, y: c.y + jy, a: Math.max(0, a), seg: i };
    }
    ini += dur; anterior = k;
  }
}

// tamanho da marca em pixels (relativo ao menor lado do quadro)
export function tamanhoMarca(W, H) {
  const fB = Math.max(10, Math.round(Math.min(W, H) * 0.026));
  return { fB, cw: Math.ceil(fB * 5.4), ch: Math.ceil(fB * 1.5) };
}

// desenha a marca (barra dourada e o nome em letras pequenas) num contexto 2D de tamanho cw x ch
export function desenharMarca(g, tam) {
  const { fB, cw, ch } = tam;
  g.clearRect(0, 0, cw, ch);
  g.fillStyle = '#FFD166'; g.fillRect(0, Math.round((ch - fB * 1.1) / 2), Math.max(2, Math.round(fB * 0.2)), Math.round(fB * 1.1));
  g.fillStyle = '#ffffff'; g.font = `700 ${fB}px MarcaLabs, Outfit, sans-serif`; g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${(fB * 0.2).toFixed(1)}px`;
  g.fillText(MARCA.nome, Math.round(fB * 0.7), Math.round(ch / 2) + 1);
}
