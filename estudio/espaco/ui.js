// Texto do quadro. REGRAS RAIZ DO PROJETO (autor, 2026-10-25):
// 1) quem assiste não lê: texto só quando é didático, UM por vez, grande, com muito espaço vazio; sem subtítulo nem nota.
// 2) composição: todo texto é MEDIDO e fica dentro da área segura; fica no lado oposto ao herói (contrapeso);
//    sobre fundo claro ganha um véu escuro suave. O render confere cada quadro (composicao.js).
import { COR, FONTE, REGRAS } from './design.js';

export function criarUI(raiz, W, H) {
  raiz.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none';
  raiz.appendChild(svg);
  const px = (f) => Math.round(f * H);
  const MX = REGRAS.margemX * W;
  const MY = REGRAS.margemY * H;
  let n = 0;
  const clamp = (x, a, b) => Math.min(Math.max(x, a), Math.max(a, b));

  function projetar(p, camera) {
    const v = p.clone().project(camera);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
  }

  // véu escuro suave atrás do texto (legibilidade sobre objetos claros)
  function veu(rect, alpha) {
    const d = document.createElement('div');
    d.setAttribute('data-veu', '1');
    const pad = 0.05 * W;
    d.style.cssText = `position:absolute;left:${rect.left - pad}px;top:${rect.top - pad * 0.7}px;width:${rect.width + pad * 2}px;height:${rect.height + pad * 1.4}px;` +
      `background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));opacity:${alpha};pointer-events:none`;
    raiz.insertBefore(d, raiz.firstChild.nextSibling);
  }

  // rótulo: nome (e UM número) numa COLUNA fixa (dir: começa em 62% da largura; esq: termina em 38%), com linha-guia até o alvo.
  // Medido: se não couber na área segura, desliza para dentro. y fixo (0,5 = meio) deixa o olho saber onde olhar.
  function rotulo({ alvo, camera, coluna = 'dir', y = 0.5, titulo, valor, alpha = 1, corLinha = '#fff' }) {
    n++;
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'rotulo');
    t.style.cssText = `position:absolute;white-space:nowrap;opacity:${alpha};text-shadow:0 2px 12px rgba(0,0,0,.75);left:0;top:0;visibility:hidden;text-align:${coluna === 'dir' ? 'left' : 'right'}`;
    t.innerHTML = valor
      ? `<div style="font:700 ${px(REGRAS.tamanhoRotulo)}px ${FONTE.rotulo};letter-spacing:${REGRAS.espacamentoRotulo};text-transform:uppercase;color:${COR.texto.branco}">${titulo}</div>` +
        `<div style="font:800 ${px(REGRAS.tamanhoValor)}px ${FONTE.titulo};color:${COR.texto.ouro};line-height:1.02;margin-top:${px(0.006)}px">${valor}</div>`
      : `<div style="font:800 ${px(REGRAS.tamanhoValor * 0.86)}px ${FONTE.titulo};color:${COR.texto.branco};line-height:1.02;letter-spacing:-.01em">${titulo}</div>`;
    raiz.appendChild(t);
    const r0 = t.getBoundingClientRect();
    const w = r0.width;
    const h = r0.height;
    const x0 = coluna === 'dir' ? REGRAS.colunaDir * W : REGRAS.colunaEsq * W - w;
    const left = clamp(x0, MX, W - MX - w);
    const top = clamp(y * H - h / 2, MY, H - MY - h);
    t.style.left = left + 'px';
    t.style.top = top + 'px';
    t.style.visibility = 'visible';
    veu({ left, top, width: w, height: h }, alpha * 0.9);

    const a = projetar(alvo, camera);
    const ey = top + h / 2;
    const ex = coluna === 'dir' ? left - 16 : left + w + 16;
    const cot = coluna === 'dir' ? Math.max(a.x, ex - 0.045 * W) : Math.min(a.x, ex + 0.045 * W); // diagonal curta e entrada horizontal no texto
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('opacity', alpha);
    const sombra = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    sombra.setAttribute('points', `${a.x},${a.y} ${cot},${ey} ${ex},${ey}`);
    sombra.setAttribute('fill', 'none');
    sombra.setAttribute('stroke', 'rgba(0,0,0,.55)');
    sombra.setAttribute('stroke-width', REGRAS.linhaGuia * (H / 1080) + 3);
    sombra.setAttribute('stroke-linejoin', 'round');
    const linha = sombra.cloneNode();
    linha.setAttribute('stroke', corLinha);
    linha.setAttribute('stroke-width', REGRAS.linhaGuia * (H / 1080));
    linha.setAttribute('stroke-linecap', 'round');
    const ponto = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ponto.setAttribute('cx', a.x);
    ponto.setAttribute('cy', a.y);
    ponto.setAttribute('r', 6 * (H / 1080));
    ponto.setAttribute('fill', corLinha);
    ponto.setAttribute('stroke', 'rgba(0,0,0,.6)');
    ponto.setAttribute('stroke-width', 2);
    g.append(sombra, linha, ponto);
    svg.appendChild(g);
  }

  // número grande, sozinho (contador, medida). x,y = centro do texto (fração do quadro); mantido na área segura
  function numero({ valor, x = 0.5, y = 0.1, alpha = 1, cor = COR.texto.branco, tam = 1 }) {
    n++;
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'numero');
    t.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;opacity:${alpha};white-space:nowrap;text-shadow:0 3px 18px rgba(0,0,0,.8)`;
    t.innerHTML = `<div style="font:800 ${px(REGRAS.tamanhoNumero * tam)}px ${FONTE.titulo};color:${cor};line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.01em">${valor}</div>`;
    raiz.appendChild(t);
    const r0 = t.getBoundingClientRect();
    const left = clamp(x * W - r0.width / 2, MX, W - MX - r0.width);
    const top = clamp(y * H - r0.height / 2, MY, H - MY - r0.height);
    t.style.left = left + 'px';
    t.style.top = top + 'px';
    t.style.visibility = 'visible';
    veu({ left, top, width: r0.width, height: r0.height }, alpha * 0.8);
  }

  // frase de fechamento: palavra-chave em ouro + complemento curto em branco
  function fechamento({ chave, resto, x = 0.07, y = 0.5, alpha = 1 }) {
    n++;
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'fechamento');
    t.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;opacity:${alpha};text-shadow:0 3px 20px rgba(0,0,0,.8);white-space:nowrap`;
    t.innerHTML =
      `<div style="font:800 ${px(0.11)}px ${FONTE.titulo};color:${COR.texto.ouro};line-height:.98;letter-spacing:-.015em">${chave}</div>` +
      (resto ? `<div style="font:600 ${px(0.048)}px ${FONTE.titulo};color:${COR.texto.branco};margin-top:${px(0.01)}px">${resto}</div>` : '');
    raiz.appendChild(t);
    const r0 = t.getBoundingClientRect();
    const left = clamp(x * W, MX, W - MX - r0.width);
    const top = clamp(y * H - r0.height / 2, MY, H - MY - r0.height);
    t.style.left = left + 'px';
    t.style.top = top + 'px';
    t.style.visibility = 'visible';
    veu({ left, top, width: r0.width, height: r0.height }, alpha * 0.8);
  }

  // legenda da fala: uma linha no topo, branca em negrito, com palavras em dourado (partes: [{ t, d }])
  function legenda({ partes, alpha = 1, y = null }) {
    n++;
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'legenda');
    t.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;opacity:${alpha};white-space:nowrap;text-shadow:0 2px 10px rgba(0,0,0,.85)`;
    t.innerHTML = `<div style="font:800 ${Math.round(Math.min(0.056 * H, 0.075 * W))}px ${FONTE.titulo};color:${COR.texto.branco};text-align:center">` +
      partes.map((p) => (p.d ? `<span style="color:${COR.texto.ouro}">${p.t}</span>` : p.t)).join(' ') + '</div>';
    raiz.appendChild(t);
    // cabe na faixa segura (no vertical a direita tem 14% de interface): se não couber, a fonte diminui
    const mE = 0.06 * W, mD = (H > W ? 0.14 : 0.06) * W, livre = W - mE - mD;
    let r0 = t.getBoundingClientRect();
    if (r0.width > livre) { const fs = parseFloat(t.firstChild.style.fontSize) * (livre / r0.width) * 0.98; t.firstChild.style.fontSize = fs + 'px'; r0 = t.getBoundingClientRect(); }
    const lx = clamp(mE + livre / 2 - r0.width / 2, mE, W - mD - r0.width);
    const ty = y === null ? clamp(MY + 0.02 * H, MY, H - MY - r0.height) : y * H - r0.height / 2;
    t.style.left = lx + 'px';
    t.style.top = ty + 'px';
    t.style.visibility = 'visible';
    veu({ left: lx, top: ty, width: r0.width, height: r0.height }, alpha * 0.85);
  }

  // legenda PALAVRA POR PALAVRA (entra por último): todas as palavras já ocupam o lugar final, então o texto não anda;
  // cada uma só aparece quando é falada (a: 0..1 por palavra). palavras: [{ t, d (dourado), a }]
  function legendaPalavras({ palavras, alpha = 1, y = 0.63 }) {
    n++;
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'legenda');
    t.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap`;
    const fs = Math.round(Math.min(0.056 * H, 0.075 * W));
    t.innerHTML = `<div style="font:800 ${fs}px ${FONTE.titulo};color:${COR.texto.branco};text-align:center">` +
      palavras.map((p, i) => `<span data-w="${i}" style="display:inline-block;margin:0 ${Math.round(fs * 0.13)}px;opacity:${(p.a * alpha).toFixed(3)};transform:translateY(${((1 - p.a) * fs * 0.22).toFixed(1)}px);text-shadow:0 2px 10px rgba(0,0,0,.85);color:${p.cor || (p.d ? COR.texto.ouro : COR.texto.branco)}">${p.t}</span>`).join('') + '</div>';
    raiz.appendChild(t);
    const mE = 0.06 * W, mD = (H > W ? 0.14 : 0.06) * W, livre = W - mE - mD;
    let r0 = t.getBoundingClientRect();
    if (r0.width > livre) { const k = (livre / r0.width) * 0.98; t.firstChild.style.fontSize = fs * k + 'px'; t.querySelectorAll('span').forEach((sp) => (sp.style.margin = `0 ${Math.round(fs * k * 0.13)}px`)); r0 = t.getBoundingClientRect(); }
    const lx = clamp(mE + livre / 2 - r0.width / 2, mE, W - mD - r0.width);
    const ty = y * H - r0.height / 2;
    t.style.left = lx + 'px'; t.style.top = ty + 'px'; t.style.visibility = 'visible';
    const vis = Math.max(0, ...palavras.map((p) => p.a)) * alpha;
    if (vis > 0.02) veu({ left: lx, top: ty, width: r0.width, height: r0.height }, vis * 0.85);
    return { left: lx, top: ty, width: r0.width, height: r0.height };
  }

  // legenda de UMA palavra por vez (autor, retorno do v8): pequena, no centro, trocando a cada palavra falada.
  // escala/dy/alpha vêm da cena (entrada "pop" com ressalto e saída suave); o retângulo medido é o da palavra em escala 1.
  function legendaPalavra({ texto, cor = null, ouro = false, escala = 1, alpha = 1, dy = 0, y = 0.64, x = 0.465, estilo = {} }) {
    const peso = estilo.peso ?? 800, sombra = estilo.sombra ?? 1, espaco = estilo.espaco ?? '-.005em', usaVeu = estilo.veu ?? true;
    n++;
    const fs = Math.round(Math.min(0.036 * H, 0.058 * W));
    const t = document.createElement('div');
    t.setAttribute('data-texto', 'legenda');
    t.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:${peso} ${fs}px ${FONTE.titulo};letter-spacing:${espaco};color:${cor || (ouro ? COR.texto.ouro : COR.texto.branco)};text-shadow:0 2px 10px rgba(0,0,0,${0.9 * sombra}),0 0 3px rgba(0,0,0,${0.75 * sombra});transform-origin:50% 55%`;
    t.textContent = texto;
    raiz.appendChild(t);
    const r0 = t.getBoundingClientRect();
    const mE = 0.06 * W, mD = (H > W ? 0.14 : 0.06) * W;
    const left = clamp(x * W - r0.width / 2, mE, W - mD - r0.width);
    const top = y * H - r0.height / 2;
    t.style.left = left + 'px'; t.style.top = top + 'px';
    t.style.opacity = alpha.toFixed(3);
    t.style.transform = `translateY(${dy.toFixed(1)}px) scale(${escala.toFixed(4)})`;
    t.style.visibility = 'visible';
    if (usaVeu && alpha > 0.05) veu({ left, top, width: r0.width, height: r0.height }, alpha * 0.55);
    return { left, top, width: r0.width, height: r0.height };
  }

  return {
    rotulo, numero, fechamento, legenda, legendaPalavras, legendaPalavra, projetar,
    total: () => n,
    limpar: () => { n = 0; svg.innerHTML = ''; [...raiz.querySelectorAll('div')].forEach((d) => d.remove()); },
  };
}
