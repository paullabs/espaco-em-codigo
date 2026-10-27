// Dados dos corpos: tipo de superfície, paleta (4 cores) e tamanho real. Raios em km.
// Valores de referência (conferir fonte antes de usar numa legenda): NASA/IAU e artigos de interferometria para as estrelas gigantes.
export const R_SOL = 695700;

const planeta = (nome, tipo, raioKm, pal, extra = {}) => ({ nome, tipo, raioKm, pal, ...extra });
const estrela = (nome, raioSol, pal, extra = {}) => ({ nome, tipo: 'estrela', raioKm: raioSol * R_SOL, pal, celEsc: 9, celContr: 1, mancha: 0, brilho: 1, ...extra });

export const DADOS = {
  // corpos rochosos
  lua: planeta('Lua', 'lua', 1737, ['#ECE7DE', '#C9C2B6', '#8C867B', '#6E695E'], { luz: 1, rim: '#D8D0C4' }),
  mercurio: planeta('Mercúrio', 'mercurio', 2440, ['#D4CAC0', '#AFA396', '#74685D', '#8E8174'], { rim: '#D8D0C4' }),
  marte: planeta('Marte', 'marte', 3390, ['#EC9A5E', '#CF5E34', '#7A3426', '#B8481F'], { atm: ['#FFB27A', '#E8663C'], atmForca: 0.35 }),
  venus: planeta('Vênus', 'venus', 6052, ['#FFE8AE', '#F4B860', '#DB7E3F', '#C95E3A'], { atm: ['#FFE08A', '#F0903C'], atmForca: 0.8 }),
  terra: planeta('Terra', 'terra', 6371, ['#fff', '#fff', '#fff', '#fff'], { atm: ['#5BE0FF', '#2A5BFF'], atmForca: 0.9, nuvens: true }),
  // gigantes
  jupiter: planeta('Júpiter', 'jupiter', 69911, ['#F7E8CB', '#E4B27C', '#A8643C', '#C8432C'], { atm: ['#FFD9A0', '#E89A5A'], atmForca: 0.35 }),
  saturno: planeta('Saturno', 'saturno', 58232, ['#F6E3AA', '#E4C47C', '#B8905A', '#8FA3BC'], { aneis: true, atm: ['#FFE9B0', '#E8B860'], atmForca: 0.3 }),
  urano: planeta('Urano', 'urano', 25362, ['#C4F6F2', '#86DCE0', '#4FA8C0', '#B8F2F0'], { atm: ['#B8FFF8', '#4FC8E0'], atmForca: 0.7 }),
  netuno: planeta('Netuno', 'netuno', 24622, ['#78A4FF', '#4272F2', '#1F2F9E', '#9CC0FF'], { atm: ['#8FB8FF', '#3A58E8'], atmForca: 0.75 }),

  // estrelas por classe espectral (raio em raios solares; ver nota)
  estrelaO: estrela('Classe O', 7, ['#D8E6FF', '#A9C2FF', '#7B98FF', '#4A5FE8'], { celEsc: 16, celContr: 0.5, halo: 'rgba(140,170,255,0.75)', rim: '#7F9BFF' }),
  estrelaB: estrela('Classe B', 4.5, ['#E4EDFF', '#BCD0FF', '#92AEFF', '#6A84F0'], { celEsc: 14, celContr: 0.55, halo: 'rgba(170,195,255,0.7)', rim: '#9DB4FF' }),
  estrelaA: estrela('Classe A', 1.7, ['#F6F8FF', '#E2EAFF', '#C4D4FF', '#94AAFF'], { celEsc: 12, celContr: 0.6, halo: 'rgba(210,225,255,0.65)', rim: '#C8D6FF' }),
  estrelaF: estrela('Classe F', 1.3, ['#FFF6E0', '#FFE9B8', '#FFD38A', '#FFAE66'], { celEsc: 10, celContr: 0.8, mancha: 0.25, halo: 'rgba(255,238,190,0.7)', rim: '#FFE0A8' }),
  estrelaG: estrela('Classe G', 1, ['#FFF4A8', '#FFD34F', '#FF8A2E', '#E8284A'], { celEsc: 8.5, celContr: 1, mancha: 0.7, halo: 'rgba(255,190,90,0.7)', rim: '#FF6A4A' }),
  estrelaK: estrela('Classe K', 0.8, ['#FFE2AE', '#FFB45E', '#FF8A3A', '#D8492E'], { celEsc: 7, celContr: 1, celSoft: 0.2, mancha: 0.6, halo: 'rgba(255,160,80,0.7)', rim: '#FF7A3A' }),
  estrelaM: estrela('Classe M', 0.3, ['#FFC6A2', '#FF7C56', '#E8442E', '#A8203A'], { celEsc: 5, celContr: 0.9, celSoft: 0.4, mancha: 0.5, halo: 'rgba(255,100,70,0.7)', rim: '#FF4A3A' }),
  gigante: estrela('Gigante vermelha', 25, ['#FFD2A0', '#FF9A52', '#F2602E', '#B02A32'], { celEsc: 3.2, celContr: 0.85, celSoft: 0.9, mancha: 0.15, halo: 'rgba(255,130,70,0.6)', rim: '#FF6A3A' }),
  supergigante: estrela('Supergigante vermelha', 764, ['#FFC8A0', '#FF8250', '#E8442E', '#9A1E34'], { celEsc: 2.0, celContr: 0.95, celSoft: 1.0, mancha: 0.3, halo: 'rgba(255,96,60,0.6)', rim: '#FF4A3A' }),
  vyCma: estrela('VY Canis Majoris', 1420, ['#FFC4A0', '#FF7A4C', '#E03E2E', '#8E1A30'], { celEsc: 1.8, celContr: 0.95, celSoft: 1.0, mancha: 0.3, halo: 'rgba(255,90,56,0.6)', rim: '#FF4A3A' }),
  anaBranca: estrela('Anã branca', 0.0084, ['#F4FAFF', '#D8EAFF', '#A8C8FF', '#7AA0F0'], { celEsc: 30, celContr: 0, halo: 'rgba(200,225,255,0.85)', rim: '#C8E0FF', brilho: 0.9 }),
  neutrons: estrela('Estrela de nêutrons', 12 / R_SOL, ['#F0F8FF', '#CFE6FF', '#9CC8FF', '#6EA0F0'], { celEsc: 40, celContr: 0, halo: 'rgba(160,210,255,0.9)', rim: '#9CCBFF', pulsar: true, brilho: 0.95 }),
  anaMarrom: planeta('Anã marrom', 'jupiter', 70000, ['#C77A9A', '#8E4670', '#4E2548', '#E8607A'], { atm: ['#E8809A', '#8A3A70'], atmForca: 0.5, escura: true }),
};
