// Catálogo de estrelas por classe espectral e tipos extremos (tamanho igual para todas: aqui o que importa é a cor e a textura).
import { montarDesfile } from '../desfile.js';
export function montar(ctx) {
  return montarDesfile(ctx, {
    itens: [
      { chave: 'estrelaO', valor: '35.000 K' },
      { chave: 'estrelaB', valor: '20.000 K' },
      { chave: 'estrelaA', valor: '9.000 K' },
      { chave: 'estrelaF', valor: '6.800 K' },
      { chave: 'estrelaG', valor: '5.800 K' },
      { chave: 'estrelaK', valor: '4.500 K' },
      { chave: 'estrelaM', valor: '3.200 K' },
      { chave: 'gigante', valor: '4.300 K' },
      { chave: 'supergigante', valor: '3.600 K' },
      { chave: 'anaBranca', valor: '25.000 K' },
      { chave: 'neutrons', valor: '1.000.000 K', escala: 1.0, raio: 1.0 },
      { chave: 'anaMarrom', valor: '1.000 K' },
    ],
    espaco: 14,
    bloom: 0.3,
  });
}
