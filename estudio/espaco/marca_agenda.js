// Marca d'água do canal (crédito do kit): AGENDA e DESENHO, sem dependências, para valer em TODOS os motores.
// - motor do espaço: marca.js cria a textura e o pos.js a desenha em todo quadro (passe final);
// - leve, dramático e esportes: estudio/marca_pagina.mjs injeta este arquivo na página do renderizador e compõe a marca no
//   canvas na hora de ler o quadro. Um arquivo só decide onde e quando a marca aparece: a mesma agenda em qualquer motor.
//
// - 1,5% de opacidade, só as letras LABS e metade do tamanho de antes (versão 2: 4%, barra dourada e o dobro do tamanho):
//   quase ninguém repara, mas está em todos os vídeos.
// - Fica bem na ponta de um dos quatro cantos (a olho de espectador, é onde ninguém olha; um botão ou o título da plataforma
//   pode cobrir a marca na tela, mas o arquivo do vídeo a leva) e MUDA de canto a cada 5 a 9 s, numa agenda fixa (mesma em qualquer render).
// - Ao trocar de canto ela some e volta em 0,4 s, para não "pular".
//
// O que isto NÃO é: proteção contra remoção. Num kit aberto quem tem o código pode editá-lo. A defesa real é a licença
// (crédito obrigatório) e o selo conferido por `npm run conferir -- marca`, que acusa se os arquivos da marca ou os
// renderizadores foram alterados. A marca está documentada no LEIAME do kit.
export const MARCA = { nome: 'LABS', opacidade: 0.015, versao: 3 };

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// os quatro cantos (fração da tela). x é a borda esquerda (cantos E) ou a direita (cantos D); y é o topo da marca.
// A marca tem uns 0,011 da altura (vertical) ou 0,02 (horizontal): 0,02 aqui deixa o canto de baixo dentro do quadro nos dois formatos.
function cantos(vertical) {
  const mx = vertical ? 0.04 : 0.03, mt = vertical ? 0.065 : 0.05, mb = vertical ? 0.1 : 0.05, h = 0.02;
  return [
    { id: 'SE', lado: 'e', x: mx, y: mt },
    { id: 'SD', lado: 'd', x: 1 - mx, y: mt },
    { id: 'IE', lado: 'e', x: mx, y: 1 - mb - h },
    { id: 'ID', lado: 'd', x: 1 - mx, y: 1 - mb - h },
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
      const c = C[k], jx = (r() - 0.5) * 0.012, jy = (r() - 0.5) * 0.012, u = Math.max(0, t - ini);
      const a = Math.min(1, u / 0.4) * Math.min(1, (dur - u) / 0.4);
      return { id: c.id, lado: c.lado, x: c.x + jx, y: c.y + jy, a: Math.max(0, a), seg: i };
    }
    ini += dur; anterior = k;
  }
}

// tamanho da marca em pixels (relativo ao menor lado do quadro)
export function tamanhoMarca(W, H) {
  const fB = Math.max(6, Math.round(Math.min(W, H) * 0.013));
  return { fB, cw: Math.ceil(fB * 3.4), ch: Math.ceil(fB * 1.5) };
}

// desenha a marca (só o nome, em letras pequenas) num contexto 2D de tamanho cw x ch
export function desenharMarca(g, tam) {
  const { fB, cw, ch } = tam;
  g.clearRect(0, 0, cw, ch);
  g.fillStyle = '#ffffff'; g.font = `700 ${fB}px MarcaLabs, Outfit, sans-serif`; g.textBaseline = 'middle';
  if ('letterSpacing' in g) g.letterSpacing = `${(fB * 0.2).toFixed(1)}px`;
  g.fillText(MARCA.nome, 0, Math.round(ch / 2) + 1);
}
