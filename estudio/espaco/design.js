// Sistema de design do canal de espaço e ciência (linha B: 3D cartunesco profissional).
// Regra de ouro: cada cor tem uma função. Todo ativo sai destas famílias, com 3 a 4 subcores
// (claro, base, sombra, brilho). Sombra nunca é preto: ela puxa para o roxo; luz puxa para o quente.

import { estiloDaUrl } from './estilos.js';

const PADRAO = {
  espaco: {
    base: '#000000', // o espaço é PRETO; a cor vem dos objetos e das luzes
    fundo1: '#0C0A30', // índigo profundo
    fundo2: '#1A1052', // violeta
    brilho: '#3B1D7A',
    nebulaMagenta: '#7A2BA8',
    nebulaAzul: '#0E5A9A',
  },
  sol: {
    nucleo: ['#FFFBE6', '#FFF08A'],
    radiativa: ['#FFE94F', '#FFC02E'],
    convectiva: ['#FF8A1F', '#FF4A24'],
    fotosfera: ['#F2305A', '#C41E5C'],
    corona: '#FF5E7E',
    halo: '#FFB347',
    mancha: ['#7A1E34', '#C23A2A'],
  },
  terra: {
    oceano: { fundo: '#0B3A8C', medio: '#1767C9', raso: '#2FB5D6', espuma: '#8FEBE3' },
    terra: { areia: '#F7DC8E', deserto: '#F2B84B', savana: '#BFD64F', campo: '#5BC94B', floresta: '#1FA05A', selva: '#0E7F52', rocha: '#A68266', neve: '#F5FAFF' },
    nuvem: { luz: '#FFFFFF', sombra: '#BFB8F2' },
    atmosfera: ['#5BE0FF', '#2A5BFF'],
    luzCidade: '#FFC857',
    nucleoInterno: ['#FFF6B0', '#FFE066'],
    nucleoExterno: ['#FFC233', '#FF9A1F'],
    mantoInferior: ['#FF6B2C', '#E8412F'],
    mantoSuperior: ['#D9366B', '#A82A86'],
    crosta: ['#9B6B4A', '#6E452F'],
    lua: { luz: '#E4DEFA', meio: '#B4ABE0', sombra: '#6F64B4', cratera: '#8E84C8' },
  },
  buraco: {
    horizonte: '#04020C',
    disco: ['#FFF6D6', '#FFD36B', '#FF9A2E', '#FF4F6A', '#B02CC9', '#4B2A9A'],
    anel: '#FFE9A8',
    jato: '#46D9FF',
  },
  texto: { branco: '#FFFFFF', ouro: '#FFD166', lilas: '#B9B3E8', sombra: '#07061A' },
};

// Paleta 'vivo': cores chapadas e vibrantes, tiradas de um vídeo de vetor de referência (26/10/2026, medidas por k-means
// nos quadros). Só o espaço, a Terra e o texto mudam; o sol, a estrela e o buraco negro seguem a padrão, por enquanto.
const VIVO = {
  ...PADRAO,
  // o espaço continua PRETO (regra do canal); só puxa de leve para um azul muito escuro, para os corpos contrastarem
  espaco: {
    base: '#000000',
    fundo1: '#02050F', // preto azulado
    fundo2: '#07122B', // azul quase preto (medido no quadro: ~RGB 3,7,18 no meio)
    brilho: '#0B1A3A',
    nebulaMagenta: '#000000', // sem nuvem roxa
    nebulaAzul: '#0A1D40',
  },
  terra: {
    ...PADRAO.terra,
    oceano: { fundo: '#1E3F9E', medio: '#2D6BC9', raso: '#26E4E7', espuma: '#A1F0DC' },
    terra: { ...PADRAO.terra.terra, areia: '#ECD03F', deserto: '#F0B43A', campo: '#269761', floresta: '#1E7A4E' },
    nuvem: { luz: '#F3FBF5', sombra: '#9C8BD8' },
    atmosfera: ['#26E4E7', '#2D6BC9'],
    lua: { luz: '#F3FBF5', meio: '#A1F0DC', sombra: '#3B14A2', cratera: '#7FB8D8' },
  },
  texto: { branco: '#F3FBF5', ouro: '#ECD03F', lilas: '#A1F0DC', sombra: '#13092E' },
};

const PALETAS = { padrao: PADRAO, vivo: VIVO };

// a paleta vem do estilo escolhido (?estilo=nome, ver estilos.js); fora do navegador (testes, Node) fica a padrão
export const COR = PALETAS[estiloDaUrl().paleta] || PADRAO;

export const FONTE = {
  titulo: "'Outfit', sans-serif", // números e títulos: 700 a 800
  rotulo: "'Space Grotesk', sans-serif", // legendas pequenas e unidades: 500 a 700, caixa alta
};

// REGRA RAIZ (autor, 2026-10-25): quem assiste não lê. O vídeo é um guia imersivo: a pessoa entende
// ouvindo e vendo. A narração explica; a tela mostra. Texto só quando é didático, UM por vez, grande,
// com muito espaço vazio. Sem título com subtítulo, sem notas, sem explicação escrita.
export const REGRAS = {
  maxTextoSimultaneo: 1,
  // composição (fração do quadro): área segura, colunas de texto, onde o herói fica
  margemX: 0.06,
  margemY: 0.07,
  colunaDir: 0.62, // o texto da direita começa aqui
  colunaEsq: 0.38, // o texto da esquerda termina aqui
  heroiEsq: 0.37, // herói no terço esquerdo quando o texto vai à direita
  heroiDir: 0.63,
  alturaHeroi: [0.45, 1.05], // diâmetro do herói / altura do quadro (fora disso só em macro intencional) // elementos de texto na tela ao mesmo tempo (o render confere quadro a quadro)
  tamanhoRotulo: 0.026, // nome da camada/objeto, fração da altura do quadro
  tamanhoValor: 0.072, // o único número do rótulo
  tamanhoNumero: 0.1, // contador e medidas soltas
  espacamentoRotulo: '0.14em',
  linhaGuia: 2, // px em 1080p
};
