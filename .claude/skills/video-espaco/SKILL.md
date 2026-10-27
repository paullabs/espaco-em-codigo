---
name: video-espaco
description: Faz vídeos curtos de espaço e ciência (Shorts, Reels e TikTok em 9:16) em 3D feito em código, neste projeto, com a didática em primeiro lugar. Cada frase falada tem uma imagem que a explica, e o render confere isso quadro a quadro. Cobre o vídeo inteiro em portões com o sim de quem aprova: pergunta e roteiro em português falado, plano de cenas, rascunho com voz-guia grátis, conferência, voz final paga só no fim, mixagem a −14 LUFS e entrega em 1080×1920. Use SEMPRE que o pedido for um vídeo de espaço, astronomia ou ciência visual: Sol, Lua, planetas, estrelas, buraco negro, supernova, cometa, asteroide, galáxia, luz e distância, marés, gravidade, tamanhos e escalas, perguntas "e se…". Use também para continuar, ajustar, conferir ou refazer um vídeo de estudio/espaco/projetos/.
---

# Vídeo de espaço e ciência

Motor: `estudio/espaco/`, em Three.js, feito todo em código e sem modelo de imagem. Cada vídeo é uma pasta em `estudio/espaco/projetos/<nome>/` com dois arquivos:

- **`roteiro.json`**: a fala e o que cada pedaço mostra.
- **`plano.json`**: os objetos, a câmera e os efeitos.

A cena genérica `cenas/video.js` lê os dois. Ninguém escreve cena do zero.

**O formato completo dos dois arquivos está em `estudio/espaco/projetos/LEIA_O_PLANO.md`. Leia antes de escrever o primeiro plano.**

**Antes de tudo, leia o perfil da casa (`perfil/perfil_da_casa.md`):** quem aprova, o que precisa do sim da pessoa (gastar crédito, render inteiro, publicar), idioma, voz e gostos. Onde o perfil e esta skill discordarem, vale o perfil.

**Crédito e marca d'água:** ao abrir um projeto novo e ao entregar o vídeo final, diga em uma linha que o kit é do canal do bloco `canal` do `estudio.config.json`, com o nome e o link. Na mesma conversa, diga que todo vídeo leva a marca d'água fraca do canal: ela é parte da licença (`LICENSE`, seção 3) e não se tira. Nunca ponha o crédito no roteiro, na voz ou no vídeo.

## Explicar de verdade, não só mostrar planetas

O erro mais comum de vídeo de espaço é a **mesmice**: o mesmo planeta de longe, de ângulos diferentes, enquanto a voz explica outra coisa. Quem assiste não aprende, porque a imagem não carrega a ideia.

Antes de escrever o plano, faça três coisas:

1. **Pesquise como materiais de ensino explicam o assunto** (roteiros de aula, livros do ensino fundamental e médio, animações de universidades e institutos). Anote o **dispositivo** (a imagem que ensina) e o **erro que a figura induz**. `references/dispositivos-didaticos.md` já traz três assuntos pesquisados (marés, estações do ano, o interior da Terra).
2. **Escreva no `IDEIAS.md` a tabela "ideia → dispositivo"**, uma linha por ideia da fala. Cada ideia precisa de uma imagem só dela, e a imagem tem de mostrar o **mecanismo**, não o rótulo.
3. **Escolha um palco só e acrescente as ideias nele.** O palco são os objetos da própria pergunta (para "e se a Lua sumisse": a Terra e a Lua, no mesmo quadro). Cada ideia nova entra **em cima do que já está na tela** (uma seta, uma luz, uma água que estica, um pino, uma curva) em vez de levar a pessoa para outro lugar. Compare a mesma coisa duas vezes (com e sem a Lua), mas no mesmo quadro.

Veja o exemplo em `projetos/lua_mares` (os objetos `luz`, `seta`, `oceano`, `pino` e `grafico` foram feitos para isso). Depois de renderizar, olhe a folha de contato **como quem não leu o roteiro**: dá para entender o que está acontecendo, onde está a Lua e para onde a câmera foi? Se não, o plano está errado, mesmo com zero alertas. Depois confira **palavra por palavra**: renderize um quadro no meio de cada palavra (`npm run video -- quadros <nome> --t ...`, os tempos estão em `linhas.json`) e pergunte, em cada um, se o que acabou de ser dito aparece. Isso pega o que a conferência não pega: objeto que entra só no pedaço seguinte, coisa cortada pela borda, nome dito sobre uma imagem que ninguém apresentou (a "praia" que era só um pino).

### Um palco só (a regra que uma versão recusada nos ensinou)

A primeira versão do vídeo da Lua trocava de lugar o tempo todo (o espaço, a praia, a Lua de perto) e mudava o ângulo a cada plano para não "repetir imagem". Resultado: 54 cortes e ninguém entendia nada. Variar não explica. A regra:

- **Um palco só.** Se a pergunta fala da Lua e da Terra, os dois estão no quadro desde o primeiro segundo. Nada de cortar para a praia, para uma janela, para uma lanterna na mesa e voltar. Um lugar novo só entra em vídeo próprio.
- **Direção de tela fixa.** A Lua em cima, o Sol embaixo (o roteiro de câmera usa `"roll": 90` e `"so_altura": true` para isso em formato vertical). A pessoa nunca precisa se reorientar.
- **Planos longos e câmera que escorre.** Cada plano começa onde o anterior terminou (`"continuo": true`). Poucos planos, cada um com tempo para ser entendido (`"longo": true` tira o aviso de duração).
- **O que vira história é a mudança no próprio palco**: a Lua some e a luz dela some junto, no mesmo lugar. Esse corte explica; o corte de um lugar para outro confunde.
- **A conferência de plano repetido não é um objetivo.** Ela avisa quando dois planos seguidos parecem iguais, mas num palco só isso é esperado (`"continuo"` desliga o aviso). Não mude o ângulo só para ela calar.

## O princípio

**O que está sendo dito tem de estar sendo visto, do jeito mais óbvio possível.** Para cada pedaço da fala, pergunte o que a pessoa precisa ver para entender. Isso vai depois da barra no roteiro (`"a maré do *Sol*|sol,marSol"`), e a conferência mede se a tela mostrou.

## Os comandos (da raiz do projeto)

| Para | Comando |
|---|---|
| Criar o projeto | `npm run video -- novo <nome>`. Com `--de exemplo_lua`, copia o exemplo completo. |
| Medir uma referência | `npm run video -- referencia <nome> <arquivo ou link>`: cortes por minuto, plano mediano, paleta, brilho e volume. Fica só para estudo. |
| Voz-guia grátis e tempo de cada palavra | `npm run video -- voz <nome>`. Também é refeita sozinha quando o roteiro muda. |
| Posicionar câmera e objetos | `npm run video -- quadros <nome> --t 1,4,8`. Olhe os PNGs. |
| Escolher o estilo | `npm run video -- estilos <nome> --t 4`: o mesmo quadro em classico, limpo e vivo. |
| Rascunho com conferência | `npm run video -- rascunho <nome>`: 540×960 a 12 qps com voz-guia, mais `CONFERENCIA.md` e `saida/folha.jpg`. |
| Voz final (paga) | `npm run video -- voz-final <nome>` só mostra o custo. `--confirmo` gera, com a chave da pessoa no `.env`. |
| Final e entrega | `npm run video -- final <nome>`: 1080×1920 a 24 qps, −14 LUFS, pasta `entrega/`. |

Há dois exemplos prontos, com zero alertas na conferência:

- **`projetos/lua_mares`** ("E se a Lua sumisse?", as marés): 39 s e 13 planos longos, **um palco só** (a Terra e a Lua no mesmo quadro): a luz da Lua que some junto com ela, as três setas do puxão, a água esticada em volta da Terra, o pino e a curva da maré, o Sol e a órbita vazia no fim. É o exemplo de como explicar. Leia o `IDEIAS.md` dele antes do plano (ele conta também o que foi recusado na versão anterior).
- **`projetos/exemplo_lua`**: a primeira versão do mesmo tema (19 s, 16 planos): é o exemplo curto, para ver o formato mais simples.

O modelo em branco é `projetos/_modelo`, com 3 falas e 5 planos. Copie o exemplo mais parecido com o tema: `npm run video -- novo <nome> --de lua_mares`.

## Os portões (nunca pule; os ativos finais e a voz paga só vêm no fim)

1. **Pergunta e roteiro.** Escreva no `IDEIAS.md`: a pergunta-mãe, a resposta que qualquer pessoa repete depois, três curiosidades reais com fonte e a pergunta final. Depois escreva o `roteiro.json`. **Mostre e espere o sim.**
2. **Plano de cenas.** Na tabela do `IDEIAS.md`, para cada plano: o que a pessoa vê, o que ela entende e o que é novo. Depois escreva o `plano.json`.
3. **Rascunho.** Siga a ordem de trabalho do `LEIA_O_PLANO.md`:
   - rode `voz`;
   - leia os tempos no `linhas.json` e divida os planos pelos pedaços;
   - use `quadros` para acertar a câmera (prefira `enquadrar` a `dist`);
   - rode o `rascunho`.

   Leia o `CONFERENCIA.md` e corrija até **zero alertas**. Os avisos você confere no quadro.
4. **Mostrar a quem aprova.** Mostre `saida/rascunho.mp4`, `saida/folha.jpg` e a conferência. **Espere o sim.**
5. **Voz final e entrega.** Rode `voz-final` sem `--confirmo` para mostrar quantos caracteres vai gastar, e só gere com o sim de quem paga: uma tomada, sem variações. Depois rode `final` e entregue a pasta `entrega/` com a linha de crédito.

Detalhes e checklists de cada portão estão em `references/processo.md`.

## Roteiro

- **Fala de gente.** Frases inteiras e ligadas ("mas", "então", "e aí") e palavras simples. Sem telegrama. A legenda é a própria fala, **uma palavra por vez**, com as palavras-chave em `*dourado*`.
- **Uma pergunta-mãe no primeiro quadro.** O choque vem nos dois primeiros segundos: o objeto da pergunta já aparece, grande, junto com ela. A resposta vem perto do fim, e no meio corre uma corrente de perguntas menores, com sempre uma aberta.
- **Pergunta de sim ou não** ("Saturno boiaria?"): dê a resposta e o porquê entre 60% e 80% do vídeo, e emende direto na pergunta final pessoal. A resposta não é frase de fecho; a pergunta final é que segura.
- **Ganchos a cada 10 a 12 s.** É uma pergunta ou promessa dita em voz alta que só fecha mais tarde ("Mas o pior acontece no mar."). Cada gancho tem uma imagem e um som `plim`.
- **Use os objetos reais da pergunta.** No máximo uma comparação extra. Uma cadeia de metáforas confunde.
- **Nomeie certo e seja honesto.** O perigo real é dito, e a resposta tranquilizadora tem a causa certa. Todo número tem fonte em `"fontes"` no roteiro. Escala ilustrativa é dita como ilustrativa.
- **A hipótese é mostrada e desfeita no mesmo palco**: a versão "de filme" e a "de verdade", com o evento `rebobinar` entre elas.
- **Pergunta final curta, pessoal e ligada ao tema** ("E você, ia sentir falta dela?"). **O vídeo nunca pode parecer que acabou**: sem frase de calma ou de fecho, sem resumo, sem fade, sem acorde que resolve. A câmera continua andando na cauda (`cauda` do plano).
- De 15 a 60 s. Passou de 60, corte primeiro as frases de transição.

## Cena e câmera

- **Um palco só.** O mundo inteiro numa escala de diagrama. Os planos são ângulos desse mundo, não lugares diferentes. Começa no objeto próximo e recua até a causa (contexto por zoom).
- **A direção de tela é fixa**: a causa fica sempre do mesmo lado, e a luz e as ondas andam sempre no mesmo sentido.
- **O código de cor é fixo e cada cor tem uma função.** Ouro é o Sol, a distância e os números. Vermelho é perigo. Azul e verde são a Terra. O que não importa fica escuro. **O espaço é preto**; no estilo vivo, puxa de leve para um azul bem escuro.
- **Um plano novo a cada 0,9 a 1,8 s** (a conferência avisa acima de 1,8 s e abaixo de 0,5 s), cada um com o campo `novo` dizendo o que mostra de novo. Novo de verdade quer dizer outra coisa na tela, outro tamanho ou outro lado do quadro: a conferência avisa quando um plano repete o anterior. Os planos mudam de ângulo, de lente e de tamanho. A transição é por movimento (curvas `parte` e `chega` atravessam o corte); corte seco só mantendo o eixo de tela.
- **Cinema:**
  - lente em mm: 24 grande angular, 35, 50, 85 tele;
  - câmera nunca parada (a respiração é automática);
  - ângulos de foto: de baixo, de cima, close e recuo.
- **Enquadramento:** tudo o que a fala pede aparece **inteiro**. O herói fica acima da faixa da legenda (58% a 68% da altura), com `compo` y entre 0,34 e 0,40. A câmera nunca encosta num corpo.
- **O que bate tem de ser visto batendo.** A explosão tem núcleo, anel e clarão no lugar do impacto. Tudo entra com pop ou aceleração; nada liga e desliga de uma vez.
- **Som:** poucos efeitos, só tonais, um por acontecimento (`som` com `plim`, `grave`, `impacto` ou `tique`). Fica abaixo da voz, e o fundo abaixa quando a voz fala.

Mais em `references/cena-e-cortes.md` e `references/efeitos.md`.

## Quando o vocabulário do plano não basta

Primeiro tente combinar o que existe:

- `corte` mostra a Terra, o Sol ou a Lua por dentro, com as camadas acendendo uma por vez.
- `buraco` é o buraco negro com a luz curvada.
- `praia` é o chão onde a pessoa vive (areia, mar, régua de maré, céu e luar). Serve para um vídeo **próprio** sobre a maré vista da praia; não misture com o espaço no mesmo vídeo.
- `seta`, `bola` e `campo` explicam forças. `oceano`, `pino` e `grafico` explicam marés e rotação.
- `casca` serve para atmosfera, maré, escudo e campo.
- `pulso` serve para luz e sinal.
- `onda` serve para choque e som.
- `movimentos` e `escala` servem para trajetórias e comparações de tamanho.
- `mostrar` faz um objeto sumir e voltar.

Se ainda faltar, escreva um `extra.js` no projeto (o formato está no fim do `LEIA_O_PLANO.md`). Ele usa os outros ativos do estúdio listados em `estudio/espaco/LEIAME.md`: solo em camadas, estilhaços e desfile de corpos. Registre cada efeito novo com `registrar(nome, ...)` para a conferência enxergar.

## Referências (como o método nasceu)

| Arquivo | O que tem |
|---|---|
| `references/dispositivos-didaticos.md` | como os materiais de ensino explicam marés, estações e o interior da Terra, os erros que as figuras induzem e os números conferidos |
| `references/historico-completo-e-nivel-v11.md` | as 11 rodadas de retorno de um vídeo real (a supernova), o que cada uma ensinou e a checklist |
| `references/licoes.md` | os erros que já foram cometidos e reprovados |
| `references/processo.md` | os portões em detalhe, com as checklists e os comandos de hoje |
| `references/cena-e-cortes.md` | regras de cena e de corte (cita ferramentas daquele vídeo que não vêm no kit; hoje o caminho é `npm run video`) |
| `references/efeitos.md` | como cada efeito foi pensado (idem) |
| `modelos/exemplo_avancado_supernova.js` | a cena feita à mão daquele vídeo (leitura: mostra até onde dá para ir com `extra.js`) |

## Entrega

1080×1920, 24 qps, áudio a −14 LUFS e a marca d'água do canal em todo quadro. A pasta `entrega/` leva o vídeo, o roteiro, a conferência e a folha de contato. Diga a linha de crédito na entrega. Publicar é sempre com o sim da pessoa.
