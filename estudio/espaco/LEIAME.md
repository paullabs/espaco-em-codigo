# Estúdio de espaço e ciência (linha B: 3D cartunesco profissional)

> **REGRA RAIZ (autor, 2026-10-25): quem assiste não lê.** O vídeo é um guia imersivo: a pessoa entende **ouvindo e vendo**, sem perder tempo lendo.
> A narração explica; a tela mostra. Texto só quando é didático, **um por vez**, grande, com **muito espaço vazio**.
> Nada de título com subtítulo, nota, legenda explicativa ou número que a voz já disse.
> O roteiro nasce com essa regra (ver `ROTEIRO.md`). O render confere: nenhum quadro passa de 1 elemento de texto.

Tudo em código (Three.js, shaders próprios), sem modelo de imagem. Cada ativo é uma função reutilizável.

## Cinema (regra do estúdio, autor 2026-10-25)
O espaço é **PRETO** (a cor vem dos objetos, das luzes e do bloom), com estrelas em camadas e poeira em 3D que dá paralaxe.
A câmera é de cinema, nunca parada, e cada plano tem seu ângulo:
- **Lente em mm** (sensor Super 35): 24 mm grande angular, 35 mm, 50 mm, 85 mm para macro e compressão.
- **Abertura f e foco**: profundidade de campo física (círculo de confusão real) com bokeh nas luzes; foco no alvo do plano.
- **Curvas de tempo estilo After Effects** por plano: `suave` (easy ease), `parte` (começa devagar, sai rápido e atravessa o corte), `chega` (chega do corte e pousa), `meio` (velocidade quase constante).
- **Vários ângulos por cena**: abertura larga e baixa, close, visão de cima, macro na borda, recuo. O corte da Terra/Sol se abre no começo e se fecha no fim.
- Pós: profundidade de campo, bloom, vinheta, grão leve, aberração cromática mínima.
Para um meteoro (ou qualquer ativo novo): escolher a lista de planos (ângulo, mm, f, curva) antes de animar, como numa decupagem.

## Composição (regra do estúdio, autor 2026-10-25)
O texto e os objetos seguem um desenho, não ficam onde calham:
- **Área segura**: 6% nas laterais, 7% em cima e embaixo. O texto é medido e entra inteiro.
- **Herói no terço** (deslocamento de lente `compo: { x, y }` em cada plano) e texto na **coluna oposta**, sempre na mesma altura, para o olho saber onde olhar.
- **Hierarquia e peso**: herói de 45% a 100% da altura (macro pode cortar de propósito), apoio menor, fundo calmo. Massa grande, clara ou saturada de um lado; texto e vazio fazem o contrapeso.
- **Entradas com lógica**: da esquerda para a direita (sentido de leitura) ou de onde o plano anterior terminou; o que se move ganha espaço à frente.
- **Legibilidade**: véu escuro suave atrás do texto. Nome sozinho = grande; nome + número = nome pequeno e número grande dourado.
- **Auditoria automática** por quadro (`composicao.js`): A texto fora da área segura, B texto sobre o herói, C herói cortado, D tamanho do herói, E texto do mesmo lado do herói. O render imprime as violações.

## Ativos
| Arquivo | O que faz |
|---|---|
| `design.js` | Paleta (cada cor com função e subcores), fontes (Outfit para números e títulos, Space Grotesk para rótulos), regras de texto |
| `corte.js` | Esfera com corte em camadas por traçado de raio: **Sol** (núcleo, zona radiativa, convectiva, fotosfera) e **Terra** (núcleo interno e externo, manto inferior e superior, crosta, pele de oceano e continentes). Também a superfície do Sol (granulação, manchas) e da Terra (oceano em 4 faixas de profundidade, 6 biomas, gelo, luzes de cidade) |
| `planeta.js` | Nuvens, atmosfera, Lua com crateras, halo e raios do Sol |
| `buraco.js` | Buraco negro com a luz realmente curvada (geodésica de Schwarzschild): disco de acreção, luz dobrada por cima e por baixo, anel de fótons, estrelas deformadas, jatos |
| `fundo.js` | Nebulosa em degradê e estrelas em camadas |
| `ui.js` | Rótulo com linha-guia, número grande, título, frase final |
| `camera.js` | Rig de câmera: planos com `de`/`para` (azimute, elevação, raio, alvo, mm, f, foco), curvas AE, respiração mínima |
| `pos.js` | Pós-processamento: profundidade de campo, bloom, vinheta, grão |
| `sequencia.js` | Corte em sequência: uma camada ganha foco por vez (as outras esmaecem) e aparece UM rótulo |
| `superficies.js`, `corpos.js`, `dados.js` | Biblioteca de corpos celestes: **Lua, Mercúrio e Marte** (crateras em 4 escalas com relevo, bacias escuras, raios de ejeção), **Vênus**, **Júpiter** (faixas, vórtices, Grande Mancha Vermelha), **Saturno** (anéis com divisões e sombra), **Urano**, **Netuno**, **Terra** e **estrelas por classe** (O, B, A, F, G, K, M, gigante, supergigante, anã branca, estrela de nêutrons com pulsar, anã marrom) com tamanhos e dados reais |
| `solo.js` | Perfil de solo em camadas: folhas, solo fértil (raízes, minhoca), argila (seixos), rocha em pedaços (lençol de água, fóssil), rocha-mãe (estratos, fraturas) |
| `desfile.js`, `composicao.js` | Desfile de corpos com câmera de cinema; auditoria de composição |
| `cenas/` | `sol`, `terra`, `lua`, `solo`, `buraco`, `apagao` (o Sol some: 8 min 20 s), `planetas`, `estrelas` |

## Rodar

**Exemplo de um comando** (da raiz do projeto, depois de `npm run preparar`): `npm run exemplo:espaco` renderiza 3 s da cena `sol` (o Sol com corte em camadas, 1080×1920, 24 qps, sem som) em `estudio/espaco/saida/exemplo_espaco.mp4`, em cerca de 30 s num Apple M5 Pro. O render imprime quantos textos há na tela (a regra é no máximo 1).

```bash
cd estudio/espaco
node render.mjs --cena sol --t 3,9 --saida "saida/sol_{t}.png"     # quadros (o render imprime quantos textos há em cada um)
node render.mjs --cena apagao --video saida/apagao.mp4 --fps 24   # vídeo (1920x1080; --w 1280 --h 720 para rascunho; --folga 0.5 para ir leve)
```
Cenas aceitam `t` em segundos. Quadros de teste ficam em `saida/`.

## Regras de design (o que mudou em relação à referência amadora)
1. Sombra nunca é preta: puxa para o roxo; luz puxa para o quente.
2. Cada camada tem cor interna e externa (gradiente) e uma linha de divisa mais escura.
3. Fundo com profundidade: nebulosa, 3 camadas de estrelas, poeira fora de foco, halo.
4. Um elemento de texto por vez (conferido quadro a quadro pelo render). Rótulo = nome curto + no máximo UM número, grande. Sem subtítulo, sem nota.
5. Dourado = números e luz; branco = rótulo; lilás = nota. Nada fora disso.
