// Estilos de design do estúdio de espaço.
// Cada estilo é um conjunto de TOKENS: quem desenha (cena, legenda, pós-processamento) só LÊ o estilo, nunca escolhe um valor solto.
// Para criar um estilo novo, copie um bloco, troque os valores e render com:  node render.mjs --cena supernova12 --estilo meu_estilo ...
// O estilo "classico" reproduz exatamente o v11 aprovado (conferido quadro a quadro).
export const ESTILOS = {
  classico: {
    nome: 'Clássico (v11)',
    paleta: 'padrao', // cores do design.js (PALETAS)
    // órbitas do Sistema Solar: a da Terra em destaque, as outras discretas
    orbita: { terra: { cor: '#8FEBE3', largura: 2.4, op: 0.7 }, outras: { cor: '#B9B3E8', largura: 1.6, op: 0.32 } },
    poeira: 0.5, // grãos de poeira que dão profundidade (0 desliga)
    risco: true, // risco de lente horizontal nas estrelas M e B
    coroa: 1, // intensidade da coroa de raios das estrelas
    // legenda de uma palavra
    legenda: { peso: 800, pop: 4.0, sombra: 1, veu: true, espaco: '-.005em', deriva: 1 },
    // anel dos quatro anos
    anel: { dimCor: '#B9B3E8', dimLarg: 4.6, dimOp: 0.42, onLarg: 10, onOp: 0.96, glowLarg: 30, glowOp: 0.16 },
    // pós-processamento
    pos: { bloom: 0.34, grao: 0.012, grade: 1, sat: 0, vinheta: 0.5 },
    camera: { roll: 0.006, mb: 1 },
  },
  limpo: {
    nome: 'Limpo (Clean Pro)',
    paleta: 'padrao',
    // menos linhas e mais calmas: a Terra continua guiando o olho, o resto some no fundo
    orbita: { terra: { cor: '#7FD6CF', largura: 1.8, op: 0.45 }, outras: { cor: '#8F98C0', largura: 1.1, op: 0.2 } },
    poeira: 0.28,
    risco: false,
    coroa: 0.65,
    // legenda mais fina, sem véu e com entrada mais suave (menos ressalto)
    legenda: { peso: 700, pop: 2.6, sombra: 0.55, veu: false, espaco: '.01em', deriva: 0.5 },
    // anel mais fino e com pouco brilho
    anel: { dimCor: '#9AA3C7', dimLarg: 3.4, dimOp: 0.28, onLarg: 7.5, onOp: 0.92, glowLarg: 20, glowOp: 0.06 },
    // imagem mais limpa: menos bloom e grão, cor um pouco menos saturada, vinheta leve
    pos: { bloom: 0.26, grao: 0.006, grade: 0.7, sat: -0.06, vinheta: 0.4 },
    camera: { roll: 0.004, mb: 0.85 },
  },
  // paleta 'vivo' (design.js) no espaço preto-azulado, com o mesmo acabamento de cinema do clássico
  vivo: {
    nome: 'Vivo (cores de vetor)',
    paleta: 'vivo',
    nebulosa: true, // fundo preto que puxa de leve para azul muito escuro (design.js, paleta 'vivo')
    orbita: { terra: { cor: '#26E4E7', largura: 2.2, op: 0.6 }, outras: { cor: '#9C5AB5', largura: 1.5, op: 0.3 } },
    poeira: 0.35,
    risco: false,
    coroa: 0.8,
    legenda: { peso: 800, pop: 4.0, sombra: 1, veu: true, espaco: '-.005em', deriva: 1 },
    anel: { dimCor: '#2D6BC9', dimLarg: 4.2, dimOp: 0.5, onLarg: 9, onOp: 0.95, glowLarg: 26, glowOp: 0.12 },
    // desenho dos planetas da referência (corpos.js): dois tons com divisão limpa entre luz e sombra, e halo suave na cor do planeta
    corpo: { chapado: 1, halo: 0.3 },
    // acabamento de cinema igual ao clássico (aprovado): bloom, grão, grade e vinheta; o contraste vem do fundo escuro
    pos: { bloom: 0.34, grao: 0.012, grade: 1, sat: 0, vinheta: 0.5 },
    camera: { roll: 0.006, mb: 1 },
  },
};

// lê o estilo da URL (?estilo=nome) com volta ao clássico
export function estiloDaUrl(busca = (typeof location !== 'undefined' ? location.search : '')) {
  const nome = new URLSearchParams(busca).get('estilo');
  return ESTILOS[nome] || ESTILOS.classico;
}
