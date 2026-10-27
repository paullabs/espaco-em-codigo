# Conferência: E se a Lua sumisse? (as marés)

Análise de 464 quadros a 12 qps (38.7 s).

## Frase → imagem

| fala | pedaço | pede | visto | |
|---|---|---|---|---|
| A1.1 | E se a Lua | lua, terra | lua 100%, terra 100% | ok |
| A1.2 | sumisse agora? | lua, terra | lua 100%, terra 100% | ok |
| A2.1 | De noite, | lua, terra | lua 100%, terra 100% | ok |
| A2.2 | é ela que ilumina | luzLua, lua | luzLua 100%, lua 100% | ok |
| A2.3 | o mar. | luzLua, agua | luzLua 100%, agua 100% | ok |
| A3.1 | Sem ela, | terra, agua | terra 100%, agua 100% | ok |
| A3.2 | ia ficar | terra, agua | terra 100%, agua 100% | ok |
| A3.3 | bem mais escuro. | terra, agua | terra 100%, agua 100% | ok |
| B1.1 | Mas o pior | agua, lua | agua 100%, lua 78% | ok |
| B1.2 | acontece no mar. | agua, lua | agua 100%, lua 100% | ok |
| B2.1 | A Lua puxa | lua, puxaoCentro | lua 100%, puxaoCentro 100% | ok |
| B2.2 | a Terra inteira, | puxaoCentro, terra | puxaoCentro 100%, terra 100% | ok |
| B2.3 | mas puxa mais forte | puxaoPerto | puxaoPerto 100% | ok |
| B2.4 | o lado de cá | puxaoPerto | puxaoPerto 100% | ok |
| B3.1 | e mais fraco | puxaoLonge | puxaoLonge 100% | ok |
| B3.2 | o lado de lá. | puxaoLonge | puxaoLonge 100% | ok |
| B4.1 | Por isso a água | agua | agua 100% | ok |
| B4.2 | se estica | agua | agua 100% | ok |
| B4.3 | dos dois lados. | agua | agua 100% | ok |
| B4.4 | Aqui, bem exagerado. | agua | agua 100% | ok |
| B5.1 | E a Terra gira, e leva | terra | terra 100% | ok |
| B5.2 | esta praia | pino | pino 100% | ok |
| B5.3 | por baixo dessas duas ondas. | agua, pino | agua 100%, pino 100% | ok |
| B6.1 | Cada praia vê | pino | pino 100% | ok |
| B6.2 | o mar subir | pino, grafico | pino 100%, grafico 100% | ok |
| B6.3 | duas vezes por dia. | pino, grafico | pino 100%, grafico 100% | ok |
| C1.1 | O Sol também puxa, | sol, agua | sol 100%, agua 100% | ok |
| C1.2 | mas com menos | agua | agua 100% | ok |
| C1.3 | da metade da força. | agua, sol | agua 100%, sol 100% | ok |
| C2.1 | Sem a Lua, | agua | agua 100% | ok |
| C2.2 | sobra só | agua | agua 100% | ok |
| C2.3 | a maré do Sol. | agua, sol | agua 100%, sol 100% | ok |
| Q1.1 | E você, | terra | terra 100% | ok |
| Q1.2 | ia sentir falta dela? | terra | terra 100% | ok |

## Planos

| plano | de | dura | novo | herói | |
|---|---|---|---|---|---|
| p01 | 0.00 | 2.08 | a Terra e a Lua juntas | terra 24% da altura | ok |
| p02 | 2.08 | 2.50 | a luz da Lua chega no mar do lado da noite | terra 23% da altura | ok |
| p03 | 4.58 | 3.00 | a Lua some e a luz some com ela: a noite fica escura | terra 23% da altura | ok |
| p04 | 7.58 | 2.08 | rebobina: a Lua volta e o mar engrossa; a câmera recua | terra 23% da altura | ok |
| p05 | 9.67 | 4.25 | a Lua puxa: a seta do centro e a do lado de cá | terra 24% da altura | ok |
| p06 | 13.92 | 2.08 | a seta do lado de lá: as três juntas, de frente | terra 22% da altura | ok |
| p07 | 16.00 | 4.58 | a água se estica dos dois lados | terra 24% da altura | ok |
| p08 | 20.58 | 4.50 | a câmera sobe: a Terra gira e o pino anda em cima da água | terra 21% da altura | ok |
| p09 | 25.08 | 3.00 | a curva da maré: dois altos por volta | terra 22% da altura | ok |
| p10 | 28.08 | 4.00 | o Sol embaixo e o bojo dele, pequeno | terra 22% da altura | ok |
| p11 | 32.08 | 2.67 | a Lua some: o bojo grande desce e sobra o do Sol | terra 22% da altura | ok |
| p12 | 34.75 | 0.58 | a Terra sozinha, com a órbita vazia | terra 22% da altura | ok |
| p13 | 35.33 | 3.33 | a câmera continua chegando (não acaba) | terra 22% da altura | ok |

## Resultado

**Nenhum alerta.**


3 aviso(s) (confira no quadro):

- p08: "agua" fica atrás da legenda (faixa de 58% a 68% da altura) por 0.8 s. Suba a imagem com "compo": {"y": 0.34}, afaste a câmera, ou, se for de propósito, ponha "veu": true (escurece embaixo) ou "faixa": false nesse plano
- p09: "agua" fica atrás da legenda (faixa de 58% a 68% da altura) por 2.9 s. Suba a imagem com "compo": {"y": 0.34}, afaste a câmera, ou, se for de propósito, ponha "veu": true (escurece embaixo) ou "faixa": false nesse plano
- p10: "agua" fica atrás da legenda (faixa de 58% a 68% da altura) por 4.0 s. Suba a imagem com "compo": {"y": 0.34}, afaste a câmera, ou, se for de propósito, ponha "veu": true (escurece embaixo) ou "faixa": false nesse plano

Folha de contato (1 quadro por segundo): `saida/folha.jpg`
