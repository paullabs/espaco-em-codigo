# Como escrever um vídeo novo (roteiro.json e plano.json)

Cada vídeo é uma pasta aqui (`estudio/espaco/projetos/<nome>/`) com dois arquivos que você (ou o seu agente) escreve:

- **`roteiro.json`**: a fala, em pedaços, e o que cada pedaço precisa mostrar na tela.
- **`plano.json`**: os objetos do mundo, os planos de câmera e os efeitos, cada tempo preso a uma palavra da fala.

Ninguém escreve código de cena: a cena genérica `cenas/video.js` lê os dois arquivos. Quem quiser um efeito que não existe escreve um `extra.js` (fim desta página).

```bash
npm run video -- novo meu_video             # copia o modelo (_modelo); --de exemplo_lua copia o exemplo
npm run video -- quadros meu_video --t 1,4  # quadros soltos para posicionar a câmera
npm run video -- rascunho meu_video         # voz-guia + animática leve + conferência + folha de contato
npm run video -- final meu_video            # 1080x1920, 24 qps, -14 LUFS, pasta entrega/
```

## A ordem de trabalho

1. Escreva o `roteiro.json`.
2. Rode `npm run video -- voz <nome>`. São alguns segundos por fala, porque ele mede onde cada palavra termina.
3. **Abra o `linhas.json`**: ali está o tempo de cada pedaço e de cada palavra. Divida os planos pelos pedaços, com um plano a cada 0,9 a 1,8 s.
4. Escreva o `plano.json`, começando pelos objetos e depois os planos.
5. Rode `npm run video -- quadros <nome> --t ...` num instante de cada plano. Olhe os PNGs e leia a lista que ele imprime: em cada quadro, o pedaço que está sendo dito, o que ele pede e se a tela mostra.
6. Rode `npm run video -- rascunho <nome>` e corrija até zero alertas no `CONFERENCIA.md`. Com a máquina livre, um vídeo de 20 s sai em menos de 1 min; com a máquina ocupada, leva alguns minutos, e o render mostra o andamento a cada 10%.

## roteiro.json

```json
{
 "titulo": "E se a Lua sumisse?",
 "pergunta_mae": "E se a Lua sumisse agora?",
 "fontes": ["de onde sai cada número dito"],
 "voz_guia": { "mac": "Luciana", "taxa": 190 },
 "voz_final": { "id": "", "modelo": "eleven_multilingual_v2" },
 "falas": [
  { "id": "A1", "pausa": 0.25, "pedacos": ["E se a *Lua*|lua", "sumisse agora?|lua,terra"] }
 ]
}
```

- **`falas`**: na ordem em que são ditas. `id` é curto (A1, A2, B1, Q1...) e é por ele que o plano se prende à fala. `pausa` é o silêncio depois da fala, em segundos.
- **`pedacos`**: de 2 a 4 palavras cada, escritos como se fala. O que vem depois da barra são os **nomes do plano que a tela tem de mostrar** enquanto o pedaço é dito. A conferência mede isso quadro a quadro e dá **alerta** quando a tela não mostra.
- **`*palavra*`** sai em dourado na legenda. A legenda é a própria fala, uma palavra por vez; não existe outro texto na tela. Evite dourado em cima de um corpo amarelo (o Sol, Saturno): o contraste some.
- **Escreva números por extenso** ("setenta por cento", não "70%"). A voz lê do jeito certo, e a legenda mostra uma palavra de cada vez em vez de segurar um número.
- A voz-guia é grátis e refeita sozinha quando o roteiro muda. A voz final (ElevenLabs, com a chave da pessoa) só sai com `npm run video -- voz-final <nome> --confirmo`.

## plano.json

```json
{
 "titulo": "...",
 "estilo": "vivo",
 "cauda": 1.7,
 "luz": { "de": "sol" },
 "objetos": { ... },
 "planos": [ ... ],
 "eventos": [ ... ]
}
```

- **`estilo`**: `classico`, `limpo` ou `vivo` (design de `estilos.js`; `npm run video -- estilos <nome> --t 3` mostra o mesmo quadro nos três).
- **`cauda`**: quanto tempo o vídeo segue depois da última palavra. O padrão é 1,7 s, e a câmera continua andando: o vídeo nunca pode parecer que acabou.
- **`luz`**: de onde vem a luz dos planetas. `{ "de": "sol" }` vem de um objeto. `"camera"` vem do lado da câmera (bom para close). `[x, y, z]` é uma direção fixa. Sem `luz`, ela vem da primeira estrela do plano ou, se não houver estrela, da câmera. Cada plano de câmera pode trocar a luz com o mesmo campo.
- **`musica`**: `{ "arquivo": "musica.mp3", "volume": -20 }`, um arquivo da pessoa, com licença dela, na pasta do projeto. Sem música entra um fundo tonal baixo; `"fundo": false` desliga o fundo.

### Tempos: sempre presos à fala

Todo campo de tempo (`de`, `ate`, `em`, `aparece`, `some`, `mostrar`) aceita:

| escreva | quer dizer |
|---|---|
| `2.5` | 2,5 segundos |
| `"A1"` / `"A1.fim"` | começo / fim da fala A1 |
| `"A1.2"` / `"A1.2.fim"` | começo / fim do 2º pedaço da fala A1 |
| `"A1:lua"` / `"A1:lua.fim"` | quando começa / acaba a **primeira** palavra que começa com "lua" na fala A1 (sem acento nem maiúscula) |
| `"A1.2:lua"` | a mesma busca, só dentro do 2º pedaço |
| `"inicio"`, `"fim"` | começo do vídeo, fim da fala inteira |
| `"A1:lua-0.4"`, `"A2.fim+0.3"` | qualquer um acima, mais ou menos segundos |

Assim, quando a voz final troca os tempos, o vídeo inteiro acompanha sozinho.

A palavra casa pelo começo, então `"A6:por"` acha o primeiro "por" (de "por cento", por exemplo). Quando a busca casa com mais de uma palavra, o render avisa (`[pagina] warning ...`). Use uma palavra única (`"A6:cima"`) ou o pedaço (`"A6.3:por"`).

Em `mostrar`, uma janela sem fim, `[["B1"]]` ou `[["B1", null]]`, fica até o fim do vídeo, inclusive na cauda. `"fim"` é o fim da fala, e depois dele ainda vem a cauda.

### objetos

Cada objeto tem um nome (é o nome que o roteiro usa depois da barra). Os tipos:

| tipo | o que é | campos |
|---|---|---|
| `corpo` (padrão quando tem `corpo`) | planeta, lua ou estrela do estúdio | `corpo` (abaixo), `pos`, `raio`, `girar` (velocidade do giro), `inclinar` (graus do eixo, que levam os anéis junto; `inclinar_giro` vira para o lado), `halo` (estrelas), `marcador` (anel na tela quando fica pequeno demais) |
| `casca` | película transparente: atmosfera, maré, campo, escudo, ou água (achatada) | `em` (segue um objeto ou fica num ponto), `raio`, `esticar` (1 = esfera; maior que 1 alonga, menor que 1 achata num disco), `aponta` (o eixo do esticar: um objeto, ou um ponto como `[0, 100, 0]` para vertical), `esticar_ao_longo: [{ "de", "ate", "para": 1.05 }]`, `cor`, `opacidade`, `borda` |
| `orbita` | linha da órbita | `em`, `raio`, `inclinacao`, `tracejada`, `destaque` (cor da órbita principal do estilo), `cor`, `largura`, `opacidade` |
| `linha` | reta entre dois objetos ou pontos | `de`, `para`, `desenha: [de, ate]` (vai se desenhando), `cor`, `largura`, `tracejada` |
| `brilho` | brilho redondo (luz, ponto quente) | `pos` ou `em`, `raio`, `cor`, `opacidade` |
| `corte` | a Terra, o Sol ou a Lua **por dentro**: um pedaço se abre e mostra as camadas | `modo` (`terra`, `sol`, `lua`), `pos`, `raio`, `abre: [de, ate]`, `fecha: [de, ate]`, `destaque: [{ "nome": "nucleo", "de", "ate", "camadas": [0, 1] }]` (acende as camadas, 0 é o centro; o `nome` é o que o roteiro pede depois da barra). Na Terra: 0 e 1 núcleo, 2 e 3 manto, 4 crosta. No Sol: 0 núcleo, 1 zona radiativa, 2 convectiva, 3 fotosfera |
| `buraco` | buraco negro com a luz curvada de verdade (disco, anel de fótons, jatos) | `raio` (o disco; padrão 10,5). Fica sempre em `[0, 0, 0]`: ponha o resto em volta |

Saturno: os anéis vão bem além do raio do planeta, e o `enquadrar` mede só o planeta. Use um `ocupa` menor (uns 0,2) para os anéis caberem, e `inclinar` (uns 26°) para eles não ficarem de lado.

**Objetos didáticos** (os que os livros usam; a pesquisa e as regras de uso estão em `references/dispositivos-didaticos.md` da skill):

| tipo | o que é | campos |
|---|---|---|
| `seta` | uma seta que cresce de um ponto a outro (um puxão, um sentido) | `de`, `para` (objetos ou pontos), `largura`, `cor`, `desenha: [de, ate]`. Dê `pos` (o meio) e `raio` (metade do comprimento) para o `enquadrar` conseguir enquadrá-la |
| `bola` | uma bolinha sólida com um brilho (experimentos: três bolinhas caindo, uma corda esticando) | `pos`, `raio`, `cor`; mova com `movimentos`. Ligue duas bolas com um objeto `linha` (de e para são os nomes das bolas): a corda acompanha |
| `campo` | um anel de setas em volta de um corpo: a **força de maré** | `em` (o corpo), `fonte` (o que puxa), `modo` (`mare`: o puxão que sobra, para fora nos dois lados e para dentro nas laterais; `superficie`: só a parte que corre ao longo da superfície, a que empurra a água), `raio` do anel, `eixo` (`[0,1,0]` o anel aparece de frente; `[0,0,1]` aparece de cima), `n`, `comprimento`, `crescer: [{ de, ate, para }]` |
| `oceano` | a água em volta de um planeta, esticada pela maré (bem exagerada) | `em`, `raio` (use pelo menos 1,15 para a Terra, senão a água fica abaixo do planeta nas laterais), `opacidade`, `mares: [{ "de": "lua", "amplitude": [{ de, ate, para }] }]` (até 3 fontes; amplitude 0,2 é um bojo bem visível), `realce: [{ "de": "A2:mar-0.12", "ate": "A2:mar+0.05", "para": 1 }, { "de": "A2:mar.fim", "ate": "A2:mar.fim+0.5", "para": 0 }]` (a água acende no instante em que a fala diz o nome dela: sem isso, a água parece uma bolha de vidro). Para enquadrar a água, use `enquadrar: ["agua"]` |
| `pino` | um marcador na superfície de um planeta que gira (a praia vista do espaço) | `em`, `lat`, `lon`, `tamanho`, `oceano` (o nome do objeto `oceano`: o pino anda em cima da água e acende sob um bojo) |
| `grafico` | uma curva ao lado (a maré do dia) com um ponto que anda | `pos`, `largura`, `altura`, `ciclos`, `ponto: [{ de, ate, para (0 a 1), "curva": "linear" }]`. Fica sempre de frente para a câmera |
| `praia` | o chão onde a pessoa vive: areia, mar com ondas e espuma, céu da noite, régua de maré, luar | `pos` (o mundo da praia fica longe do espaço, por exemplo `[0,-400,0]`), `luar` (o objeto que ilumina; some a luz quando ele some ou desce do horizonte), `nivel: [{ de, ate, para }]` (a altura da água; a régua marca de −1 a 1), `nivel_inicial`, `marcas: [{ nivel, cor, aparece }]` (barras brilhantes na régua), `ambiente` (luz das estrelas, padrão 0,22), `lampada` (a lâmpada da régua, 1 ou 0), `inclinacao`, `regua: { x, z, altura }`. Para filmar, use a câmera `em: "praia"` (veja abaixo) |

**Corpos que existem** (`dados.js`): `lua`, `mercurio`, `venus`, `terra`, `marte`, `jupiter`, `saturno`, `urano`, `netuno`, `estrelaO`, `estrelaB`, `estrelaA`, `estrelaF`, `estrelaG` (o Sol), `estrelaK`, `estrelaM` (anã vermelha), `gigante`, `supergigante`, `vyCma`, `anaBranca`, `neutrons` (com pulsar), `anaMarrom`.

**Onde e quando** (vale para todos os tipos):

- Todo campo que aponta para um objeto (`em`, `de`, `para`, `aponta`, `alvo`) aceita também um ponto `[x, y, z]`.
- `pos: [x, y, z]`: as unidades são livres, mas use uma escala de diagrama. A Terra com raio 1 e a Lua a 3,4 funcionam; o Sol de verdade não cabe, então ponha ele longe e com raio menor.
- `orbita: { "em": "terra", "raio": 3.4, "periodo": 90, "fase": 0.1, "inclinacao": 6 }`: o objeto gira em volta de outro (período em segundos de vídeo).
- `aparece` e `some` (uma vez), ou `mostrar: [[de, ate], [de, ate]]` para sumir e voltar. A entrada é com pop (`"entra": "cresce"` ou `"direto"`) e a saída encolhendo (`"sai": "direto"`).
- `movimentos: [{ "de": "B1", "ate": "B1.fim", "para": [x, y, z] ou "objeto", "curva": "suave" }]`: o objeto anda até um ponto ou até outro objeto. Enquanto anda, para de orbitar.
- `giro: [{ "de", "ate", "para": graus, "curva": "linear" }]` (em corpos): o ângulo exato do planeta, em vez de girar sozinho. Útil para sincronizar a Terra com um pino e uma curva (uma volta = 360°). `giro_inicial` é o ângulo antes do primeiro trecho. A curva `linear` é a de velocidade constante.
- `escala: [{ "de", "ate", "para": 2.0 }]` multiplica o raio. `brilho: [{ "de", "ate", "para": 0.1 }]` acende ou apaga uma estrela (o halo e a coroa vão junto).
- `inteiro: true`: a conferência avisa quando o objeto sai cortado pela borda. `fundo: true`: o objeto pode passar pela faixa da legenda.

### planos (câmera)

```json
{ "de": "A1:sumisse", "novo": "a Lua some; a Terra fica sozinha", "heroi": "terra",
  "camera": { "de": { "enquadrar": ["terra"], "ocupa": 0.42, "az": 40, "el": 8, "mm": 35 },
              "para": { "az": 34 }, "curva": "chega" },
  "compo": { "x": 0.46, "y": 0.37 } }
```

- Cada plano vai do seu `de` até o `de` do próximo (ou até `ate`). Mantenha cada um com **no máximo 1,8 s**; o último pode segurar a cauda. Cada plano diz em `novo` o que mostra de novo: a conferência cobra.
- **`camera.de` / `camera.para`**: a câmera anda de uma chave para a outra na `curva`:
  - `suave`: devagar no começo e no fim.
  - `parte`: sai rápido e atravessa o corte.
  - `chega`: vem rápido do corte e pousa.
  - `meio`: velocidade quase constante.

  O `para` só precisa ter o que muda.
- **Uma chave de câmera** pode ser de dois jeitos:
  - **Em volta de um alvo**: `alvo` (objeto ou `[x, y, z]`), `az` (graus em volta, 0 = de frente para +z), `el` (graus de altura), `dist`, `mm` (lente: 24 grande angular, 35, 50, 85 tele), `roll`.
  - **Posição exata**: `pos: [x, y, z]` mais `alvo`.
  - Com `"em": "praia"` na chave, os pontos `pos` e `alvo` são medidos a partir desse objeto: `{ "em": "praia", "pos": [0, 3, 14], "alvo": [1, 0.6, -10], "mm": 28 }` é uma câmera em pé na areia (3 m de altura do chão, olhando para o mar e para a régua).
- **`enquadrar: ["terra", "lua"]`** calcula a distância sozinho. **Use isto em vez de `dist` sempre que puder**: é o jeito de nunca cortar o herói.
  - `ocupa` é o **diâmetro** do grupo como fração da altura do quadro (padrão 0,42). No 9:16, acima de uns 0,46 quem manda é a largura: o grupo nunca passa de 82% da largura.
  - Com `enquadrar`, a câmera mira o centro do grupo. Um `alvo` junto troca o ponto de mira sem mudar a distância, por exemplo para mirar a linha d'água.
  - Se for usar `dist` à mão, a conta é **dist ≈ raio × mm ÷ (12 × ocupa)**. Um corpo de raio 3, a 35 mm, ocupando 0,42 da altura, fica a uns 21.
- **`heroi`** (opcional): o objeto principal do plano. A conferência mede se ele está inteiro, visível e no tamanho certo. Num plano largo ou de comparação, em que ninguém é herói, não ponha `heroi`. **`macro: true`** é um close de propósito, que pode cortar.
- **`compo`**: onde o alvo cai no quadro (fração da largura e da altura). Ele empurra a imagem inteira, não só o alvo. O padrão (0,46 e 0,37) deixa livre a faixa da legenda (58% a 68% da altura). O que fica embaixo do alvo, como água, anéis ou um segundo corpo, pode cair na faixa: suba com y 0,32 a 0,34.
- **`veu: true`**: escurece a metade de baixo, para close que enche o quadro (a legenda continua legível e a conferência não cobra a faixa).
- **`faixa: false`**: a imagem passa por trás da legenda de propósito neste plano (uma comparação de tamanho, por exemplo), e a conferência não cobra.
- **`longo: true`**: plano longo de propósito (num palco só, cada plano dura de 3 a 5 s ou mais), e a conferência não avisa sobre a duração.
- **`continuo: true`**: este plano continua o anterior no mesmo palco (a câmera sai de onde o outro parou). A conferência não cobra "plano repetido" nele. Use nos planos 2 em diante de um vídeo de palco único.
- **`roll` e `so_altura`** (na chave de câmera): `"roll": 90` gira o quadro 90° para o eixo Terra-Lua ficar na vertical do 9:16 (a Lua em cima, o Sol embaixo), e `"so_altura": true` faz a distância depender só da altura do quadro, não da largura. Juntos, deixam o grupo grande na tela vertical. Com `enquadrar`, o objeto não precisa estar visível no começo do plano: o enquadramento não depende de o objeto ter aparecido.
- **`borrao: false`**: desliga o borrão de movimento da câmera no plano, bom quando a câmera acompanha um objeto de perto.
- Outros campos: `luz` (troca a luz no plano), `legenda: false`, `leg` (altura da legenda, padrão 0,64), `foco` (objeto em foco com desfoque, mais `f`).

### eventos (efeitos)

| tipo | o que faz | campos |
|---|---|---|
| `explosao` | bola de fogo com núcleo, anel duplo, fagulhas, clarão radial e tremor; esconde o alvo | `em`, `alvo` (ou `pos`), `raio`, `cor` (`fogo` ou `azul`), `dur`, `clarao`, `tremor`, `esconde: false`, `som: false` |
| `clarao` | clarão que nasce no lugar do alvo | `em`, `alvo`, `forca`, `dur`, `cor` |
| `tremor` | câmera treme e acalma | `em`, `forca`, `dur` |
| `pulso` | ponto de luz que viaja de um objeto a outro, com rastro | `em`, `ate`, `de`, `para`, `cor`, `tamanho` |
| `onda` | esfera transparente que cresce a partir do alvo (choque, som, sinal) | `em`, `alvo` (ou `pos`), `raio0` (de onde começa), `raio` (até onde vai), `dur`, `cor` |
| `rebobinar` | ícone ◀◀ e linhas de vídeo (para a hipótese desfeita) | `em`, `ate` |
| `som` | efeito tonal na mixagem | `em`, `nota` (`plim`, `grave`, `impacto`, `tique`), `volume` |

Dê `nome` a um evento para o roteiro poder pedir por ele: `{ "tipo": "pulso", "nome": "luz", ... }` e no roteiro `"oito minutos|luz"`. Cada explosão já ganha um som de impacto. Use um som por acontecimento, poucos e tonais.

## Como pensar uma explicação (para não ficar na mesmice)

A regra: **para cada ideia da fala, uma imagem que só ela precisa.** Antes de montar os planos, escreva no `IDEIAS.md` uma tabela "ideia → dispositivo" (veja `projetos/lua_mares/IDEIAS.md`). Se duas ideias seguidas usam a mesma imagem (a Terra de longe, de outro ângulo), uma delas ainda não tem dispositivo.

- **Um palco só.** Os objetos da pergunta ficam no mesmo quadro o vídeo todo (a Lua em cima, o Sol embaixo) e cada ideia nova **entra em cima do que já está na tela**. Não corte entre lugares (espaço, praia, janela) e não mude o ângulo só para variar: use planos longos com `"longo": true` e `"continuo": true`, e a câmera `"roll": 90` com `"so_altura": true` para o formato vertical.
- **Compare duas vezes a mesma coisa** (com e sem a Lua, no verão e no inverno), no mesmo quadro: o que muda é o próprio palco (a Lua some e a luz some com ela).
- **Mostre o mecanismo em movimento** (as bolinhas que caem, o anel de setas, a água que sobe): é o que o livro faz com desenho e o vídeo pode fazer andando.
- **Exagere e diga** ("aqui, bem exagerado"). Sem dizer, é inexato; dizendo, é um modelo.
- **Cuidado com o erro da figura.** Desenhar a órbita da Terra achatada ensina o contrário.
- **Pesquise como materiais de ensino explicam** o assunto (aula, livro, animações de universidades) e escreva no `IDEIAS.md` qual dispositivo você vai usar e qual erro ele evita.
- **Confira palavra por palavra (o que a folha de contato não pega).** Pegue em `linhas.json` o começo e o fim de cada palavra, renderize um quadro no meio de cada uma (`npm run video -- quadros <nome> --t 0.41,0.6,...`) e, olhando cada quadro, pergunte: *o que acabou de ser dito aparece agora?* Na Lua isso achou, com zero alertas: um gráfico cortado pela borda de cima, a seta do Sol aparecendo 1,5 s depois de "puxa", a palavra "praia" dita sobre um pino que ninguém tinha apresentado, uma órbita que entrou três palavras antes da pergunta e "mar" dito sobre uma água que parecia vidro. Corrija pondo o objeto na palavra (`"C1:puxa"`) e não no pedaço, e, se uma palavra não tem imagem, mude a imagem ou a fala.
- **Veja a folha de contato como quem não leu o roteiro.** Se dá para perguntar "onde estamos?" ou "para onde a câmera foi?", o plano está errado, mesmo com zero alertas.

## A conferência (o que ela cobra)

`npm run video -- rascunho <nome>` grava `CONFERENCIA.md` e `saida/folha.jpg`.

- **Alerta** (corrija antes de mostrar):
  - um pedaço da fala sem o que ele pede na tela;
  - um nome do roteiro que não existe no plano;
  - a câmera encostando num corpo;
  - mais de um texto na tela.
- **Aviso** (confira no quadro):
  - plano com mais de 1,8 s, plano-relâmpago ou plano sem `novo`;
  - **plano que repete o anterior**: o quadro do meio de cada plano é comparado com o do plano anterior, e abaixo de 4,5% de diferença a tela é quase a mesma (as mesmas coisas, no mesmo lugar e do mesmo tamanho). Para o espectador, isso é o mesmo plano cortado duas vezes. Mude o tamanho, o lado do quadro, o assunto ou o ângulo de verdade (girar 10° em volta de uma esfera não muda nada na tela);
  - herói cortado, grande, pequeno ou fora da janela;
  - objeto na faixa da legenda;
  - composição.

Corrija pelo relatório, não pelo olho: mude o plano.json e rode o rascunho de novo. O `quadros` dá a mesma leitura, frase → imagem, sem esperar o rascunho.

**Faixa da legenda:**

- "Fica atrás da legenda" quer dizer que o círculo do objeto cruza a faixa de 58% a 68% da altura enquanto uma palavra está na tela.
- "Faixa clara" quer dizer que mais de 30% dos pixels atrás da palavra são claros (água, anéis, um corpo brilhante). A palavra perde contraste.
- Para corrigir: suba a imagem com `compo`, mude o ângulo, use `veu: true` ou, se for de propósito, `faixa: false`.

**As letras do log do render** (`COMPOSICAO A:...` até `E:...`) vêm da auditoria de composição do estúdio (`REGRAS.md`, seção 2):

- A: texto fora da área segura;
- B: texto sobre o herói;
- C: herói cortado;
- D: tamanho do herói;
- E: texto do mesmo lado do herói.

O `CONFERENCIA.md` cobra só A e B. C e D ele mede pelo herói, como aviso. Num plano largo sem herói, o D do log não vale.

## extra.js (para quem precisa de um efeito novo)

No plano, `"extra": "extra.js"`. O arquivo exporta `montar(ctx)`, que recebe `{ THREE, scene, camera, W, H, OBJ, tempo, posDe, registrar, PLANO, ST }` e devolve `{ desenhar(t, { plano, camera }) }`.

Use `tempo("A1:lua")` para prender ao roteiro e `registrar(nome, [x, y, z], raio)` para a conferência enxergar o efeito. Os outros ativos do estúdio estão em `estudio/espaco/LEIAME.md`: solo em camadas (`solo.js`), estilhaços (`estilhaco.js`), desfile de corpos (`desfile.js`).
