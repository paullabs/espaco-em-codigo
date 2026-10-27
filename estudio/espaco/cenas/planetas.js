// Catálogo de corpos rochosos e gigantes: Lua, Mercúrio, Marte, Vênus, Terra, Júpiter, Saturno, Urano, Netuno.
import { montarDesfile } from '../desfile.js';
export function montar(ctx) {
  return montarDesfile(ctx, {
    itens: [
      { chave: 'lua', valor: '3.474 km' },
      { chave: 'mercurio', valor: '4.879 km' },
      { chave: 'marte', valor: '6.779 km' },
      { chave: 'venus', valor: '12.104 km' },
      { chave: 'terra', valor: '12.742 km' },
      { chave: 'jupiter', valor: '139.822 km' },
      { chave: 'saturno', valor: '116.464 km', escala: 1.75, ancora: 1.4, aro: 1.0 },
      { chave: 'urano', valor: '50.724 km' },
      { chave: 'netuno', valor: '49.244 km' },
    ],
  });
}
