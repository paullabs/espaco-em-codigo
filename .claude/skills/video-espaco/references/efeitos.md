# Catálogo de efeitos (formas simples, em `cenas/rascunho6.js`)

Cada efeito tem um jeito de rascunho, que é barato e mostra a ideia, e vira ativo final no portão 6.

| Efeito | O que a pessoa entende | Rascunho (v6) | Ativo final |
|---|---|---|---|
| Estrela "brilhando demais" | algo vai acontecer lá | marcador que cresce de 44 a ~150 px, cor indo para o branco, cintilando | `corpos.js` estrela + `uBrilho` |
| Explosão | a estrela explodiu | `explosao(tx)`: bola laranja + núcleo branco + anel na tela + nuvem roxa que fica + luz pontual | `explosao.js` (bola turbulenta, anel de choque, ejeção) |
| Onda | a explosão anda pelo espaço | esfera com **borda brilhante** (shader de borda, expoente 6): lê como uma bolha, não como névoa | idem com ruído e espessura |
| Onda varrendo o Sistema Solar | chegou aqui | cada órbita muda de cor quando a frente alcança o raio dela; planetas e Sol acendem | idem |
| Passagem da onda pela Terra | a onda bateu e passou | `passagem()`: frente de luz (disco com borda) atravessando, **poeira arrastada** (riscos com rastro), **onda de proa** (parabolóide de borda), **cauda** saindo do lado oposto, o lado da Terra virado para a estrela acende, câmera treme | partículas e volume |
| Terra em brasa e quebrando (filme) | versão exagerada | casca de lava + rachaduras + pedaços que se afastam | `estilhaco.js` |
| Camada de ozônio arrancada | perigo real | meia-casca azul do lado da estrela: pisca, fica vermelha, é empurrada para trás e some; fica uma ferida vermelha | shader de atmosfera |
| Rebobinar (◀◀) | aquilo não aconteceu (era hipótese) | o estado é calculado por uma função do tempo (`filme(tm)`, `real(tr)`); no rebobinar o tempo anda para trás. Ícone ◀◀ e linhas de vídeo | idem |
| Distância | é muito longe | linha tracejada da estrela até a Terra; vista "da Terra olhando a linha" em que ela some no fundo | idem |
| A luz leva N anos | tempo de viagem | pulso de luz andando pela linha; **um anel por ano-luz** que acende quando ele passa; a legenda não some (o número vem dos anéis, não de um contador) | idem |
| Tamanho (pequena demais) | comparação honesta | Sol de comparação chega voando do lado do Sistema Solar e para ao lado; raios na proporção real | `corpos.js` |
| "Oito vezes o peso do Sol" | quanto pesa | 8 Sóis aparecem em volta da grandona e entram nela; ela incha e brilha | idem |

Regras dos efeitos:
- Brilho que cobre a tela inteira não explica nada. Prefira borda (bolha) a névoa e limite o halo das explosões em close.
- O flash de impacto dura ≤ 0,35 s. Um quadro solto com véu cinza é o flash, não um erro.
- Todo efeito que representa algo pedido pela fala é registrado por nome (`registrar('onda', ...)`) para a conferência frase → imagem.

## Acrescentados no v7 (ativos finais)

| Efeito | O que a pessoa entende | Como foi feito |
|---|---|---|
| Camada de ozônio (corte transversal) | é um escudo fino no alto que barra os raios | palco ao lado: chão escuro liso, camada em ciano com textura suave (esfera fina vista de lado vira um arco), casinha com janela dourada e uma pessoa, raios retos com fótons que correm e faíscas onde são barrados |
| Camada destruída | a radiação abre um buraco e chega no chão | a mesma esfera com um buraco que cresce (contorno irregular por ruído, brasa só na borda); os raios dentro do buraco passam até o chão e o chão esquenta |
| Passagem da onda pela Terra | a onda bate e passa | frente em anel (só a borda), poeira como pontos aditivos arrastados, riscos de velocidade, onda de proa e cauda com borda brilhante, lado da estrela acende; impacto com tremor de câmera que decai e clarão curto (≤ 0,3 s e fraco: clarão forte vira véu cinza no espaço preto) |
| Luz de cinema na Terra | ver a Terra | de perto, a luz vem do lado da câmera (volta a vir do Sol de longe, com transição suave); a mesma luz vale para a Lua e as peças |
| Legenda por palavra | o que se ouve é o que se lê, na hora | `ui.legendaPalavras`: palavras no lugar final, cada uma aparece na hora falada; véu só quando há palavra visível |

## Acrescentados no v8 (retenção e engajamento)

| Efeito | O que a pessoa entende | Como foi feito |
|---|---|---|
| Gancho do Sol | "e o nosso Sol?" | a câmera voa até o Sol (textura granulada, respirando) e recua devagar; o fecho repete a mesma imagem |
| Oito caixas de Sol | o nosso Sol tem só 1/8 do peso que precisa | palco de grade 4×2: o Sol real na primeira caixa, as outras sete como contornos tracejados que acendem de leve (faltam sete) |
| Pergunta de escolha | vermelha ou azul | palco com as duas estrelas lado a lado; a legenda pinta cada palavra com a cor da opção; cada estrela acende quando é dita; a azul incha e solta faíscas em "um dia explode"; segura 1,7 s |
| Plim-plim do gancho | tem pergunta no ar | duas notas que sobem (660 e 880 Hz) a cada gancho |

## Acrescentados no v9 (colisão, enquadramento, pergunta dos quatro anos)

| Efeito | O que a pessoa entende | Como foi feito |
|---|---|---|
| Legenda de uma palavra | o que se ouve é o que se lê agora | `ui.legendaPalavra`: 1 palavra, centro, pequena, pop (`costas(u/0.2, 4)`: 80% → 108% → 100%), troca seca, some suave na pausa |
| Os 8 Sóis caem na grandona | pesa 8 vezes o Sol | formação em elipse (3,3 × 4,4); cada Sol cai com `acelera` (cubo), toca a superfície, afunda em 0,14 s e solta clarão (sprite) e anel (marcador); a grandona soma 3,5% de sacudida por batida (mola de 38 rad/s) e acende; tremor de câmera cresce até a oitava batida |
| Explosão da grandona | explode de verdade | `criarExplosao` com `PALETA_AZUL` (núcleo sólido, calor 0,42, ganho 0,9, anel duplo), raio 2,2× a grandona, câmera recua e treme; clarão radial no lugar do impacto (`flashC`, `flashR`, `flashCor`) |
| Grade das oito caixas | o Sol enche só uma | 4×2 inteira, câmera a 25,6 → 24 unidades (35 mm), Sol com ressalto na caixa 1, as sete outras entram em fila e uma onda de luz passa por elas |
| Casinha e pessoa | "você" | corte transversal calmo (`corte(tt, true)`: sem raios, sem buraco), pessoa com cabeça e uma luz que acende em "você" |
| Anel dos quatro anos | quatro anos pra viver | 4 arcos (raio 2,1× a Terra, sempre de frente para a câmera), um aceso por palavra (quatro, anos, pra, viver); "hoje" acende um ponto no topo; "nesses últimos quatro anos" um ponto de luz percorre o anel e cada arco brilha quando ele passa; planos limpos (sem órbitas, planetas, Sol, Lua) |
| Rebobinar com motion | voltou no tempo | ícone ◀◀ entra com ressalto, desliza e sai suave; linhas de vídeo andam |

Regra técnica (v9): linha grossa (`Line2`) que cresce ou muda por quadro (`userData.definir`) precisa ter **sempre o mesmo número de pontos**; o Three fixa o máximo de segmentos no primeiro desenho e, se o primeiro desenho tiver 2 pontos, a linha nunca passa de 1 segmento. O defeito só aparece em render em sequência (os quadros avulsos de teste saem certos); sempre confira também quadros do vídeo final.
