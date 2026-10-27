# 03 · Ritmo e pausas: o silêncio também é fala

Tudo aqui é **medido** na voz separada da música (pausas com erro de ~0,1 s), salvo quando marcado. Fonte: `referencias/roteiros_virais/03_medidas/<RVnn>/medidas.json`, `decupagem.md` e `roteiro_respirado.txt`, e os cinco estudos em `roteiros/estudos/`.

**Correção de 19/10/2026:** a primeira medição emendava zumbidos, tons e música que vazavam na faixa de voz e apagava silêncios longos (os estudos de RV01 e RV04 remediram à mão e acharam o erro). O detector foi refeito (`medir.py`, etapa `fala`) e agora bate com o remedido: RV01 tem 13 silêncios ≥ 2,5 s e o maior de 12,8 s (antes, 7 e 8,7 s); RV04 tem 11 e o maior de 9,0 s (antes, 6 e 5,1 s). Os números abaixo já são os corrigidos.

## Os números das cinco referências

| | RV01 Último humano | RV02 Reflexo 10× | RV03 QI 500 | RV04 Debaixo d'água | RV05 Teletransporte |
|---|---|---|---|---|---|
| Views por inscrito | 47 | **93** | 24 | 19 | 6 |
| Fala ocupa | 67% | **42%** | 57% | 70% | 79% |
| Palavras/min no vídeo | 144 | 97 | 113 | 154 | 184 |
| Palavras/min **enquanto fala** | 217 | 229 | 198 | 222 | 234 |
| Frase mediana (palavras) | 8 | **4–5** | 5 | 7 | 7 |
| Pausa mediana entre frases | 0,53 s | **1,09 s** | 0,68 s | 0,52 s | 0,45 s |
| Pausas ≥ 0,7 s por minuto | 5,2 | **13,9** | 9,4 | 5,8 | 0,8 |
| Silêncios ≥ 2,5 s | 13 | **26** | 20 | 11 | 0 |
| Maior silêncio | 12,8 s | 10,6 s | 13,8 s | 9,0 s | 0,95 s |
| Pausas ≥ 0,35 s no meio da frase | 19 | 22 | **44** | 10 | 29 |
| Planos sem nenhuma palavra | 7% | **26%** | 22% | 1% | 1% |
| Planos/min (dois detectores) | 14–15 | 19–24 | 19–23 | 11–16 | 21–22 |
| Plano mediano | 3,0 s | 2,3 s | 2,0 s | 2,9 s | 2,3 s |

## As leis do ritmo

**1. A voz tem um andamento só; o ritmo do vídeo é desenhado com as pausas.** Enquanto fala, todo mundo fica entre 198 e 234 palavras por minuto (mediana ~222, o mesmo ~230 que a série de terceiros mede dentro da fala). A diferença entre um vídeo e outro está em quanto silêncio entra: RV02 fala 42% do tempo, RV05 fala 79%.

**2. Três maneiras de respirar, e as três funcionam.**
- **"Respira"** (RV02, RV03): frase de 4–5 palavras, uma frase por plano, e a ação acontece no silêncio depois da frase; 20–26 silêncios de 2,5 s ou mais; 22–26% dos planos sem palavra. RV02 chega a 27% do vídeo em silêncios longos. São os dois vídeos com mais views absolutas (3,9 mi e 1 mi).
- **"Corre e respira nas costuras"** (RV01, RV04): dentro do bloco, frase de 7–8 palavras atravessando dois planos e pausa de meio segundo, um fato novo por frase; nas trocas de ato, uma frase curta de emoção e 5–13 s sem narração com a imagem e o cartão de tempo ou lugar. Quase nenhum plano mudo dentro do bloco.
- **"Corre sempre, e quem respira é o corte"** (RV05): nenhuma pausa de 1 s; as 11 pausas de 0,6 s ou mais têm todas um corte para o rosto de quem ouviu; frases coladas na ação (seis seguidas no ginásio, 7:07–7:25); a pausa encolhe no pânico (Everest: 0,49 → 0,31 → 0,19 → 0,16 s).
- Correlação, não causa: o que mais respira (RV02) é o de mais views por inscrito (93); o que menos respira (RV05), o de menos (6). Canal, tema e embalagem também pesam.

**3. O tamanho do silêncio acompanha o peso do momento.**

| Tipo de momento | Silêncio medido | Exemplos |
|---|---|---|
| Piada seca ou ironia | 0,3–1,2 s, e segue | "That part was designed for nobody." 0,95 s (RV01 1:27) · "This morning, you." 0,47 s (RV04 0:52) · depois da piada, 0,45–0,56 s e corte (RV05) |
| Soco de uma demonstração (a imagem paga a frase) | 4–8 s | "You just (0.6) catch it." + 4,4 s (RV02 0:06) · "Caught that, too." + 7,9 s (RV02 1:39) · "Lucky guess." + 3,9 s (RV03 1:06) |
| Fecho de item ou de bloco, no rosto do herói ou de quem viu | 1,6–8 s | os seis fechos do livro-caixa de RV03, 1,56–3,24 s · "That's not humanly possible." + 6,6 s (RV02 1:08) · "I give up." + 7,8 s (RV02 3:21) |
| Revelação da premissa | 2,5–3,7 s | "you're the last person on Earth" + 3,7 s sobre DAY 1 (RV01 0:27) · "500." + 2,6 s (RV03 0:31) · a pergunta do título + 2,9 s (RV02 0:34) |
| Troca de ato ou passagem de tempo | 4,5–13 s | RV04: 4,8 / 4,7 / 4,1 / 4,6 s nas quatro trocas · RV01: "…somewhere a person could actually live." + 8,8 s → "Day 50." · "You're still here." + 10,7 s · "Calling anyone." + 12,8 s |
| Emoção que precisa assentar | 4–10 s | o nome da cadela + 9,5 s (RV01 4:40) · "The first light in the city you made yourself." + 10,2 s (RV01 5:55) · "Inside it is somewhere else." + 6,6 s (RV04 8:24) · o avô vira a carta + 9,0 s (RV04 9:36) |
| **A frase da escolha ou do clímax** | **10–11 s** | "The ball (1.2) or the boy?" + 10,6 s com 8 cortes (RV02 5:31) · "You should get the door." + 10,4 s com 8 cortes (RV03 7:18) |
| A porta aberta do fim | até 14 s | "…your computer turned on by itself and someone started typing." + 13,8 s, com o texto digitado na tela (RV03 8:20) |

**4. A pausa antes da última palavra é o suspense de bolso.** De 0,4 a 1,9 s no meio da frase, logo antes da palavra que paga: "You just (0.6) catch it." · "The ball (1.2) or the boy?" · "You watch it the whole way, (1.9) and crush it." · "Not the dark, (0.4) the quiet." · "C Q (0.5) still here." · "Worth it, (0.5) mostly." RV03 tem 44 pausas assim, e 16 caem antes da palavra da virada; o canal marca essas pausas com reticências na própria legenda (RV02).

**5. Lista corre, virada freia.** Lista cômica com 0,3–0,7 s entre itens e um plano por item: "Save. Save. Goal. Top corner. Nobody could stop it." (RV02 4:55) · "The world feels slow. (0.7) Movies feel like slideshows. (0.7) Headaches." (RV02 4:32). Lista terna respira mais, 0,9–1,4 s entre itens (RV03 4:21–4:31). Antes da virada, a frase encurta, a música cai e o silêncio cresce (RV02 5:02–5:29).

**6. O último terço desacelera pelo silêncio, não pela fala lenta.** Em RV04 as palavras por minuto caem de 160–178 para 94 no último minuto, mas a velocidade da fala é a mesma: o que cresce é o silêncio (fala de 88% para 54% do tempo) e a fatia de frases curtas (de 24–30% para 41%). RV05 faz o mesmo em escala menor: a pausa mediana sobe de 0,35 s para 0,44 s quando a história vira drama, e todas as pausas de 0,6 s ou mais estão depois de 7:50.

**7. A imagem estica o tempo da fala.** O que a narração diz em meio segundo pode durar muito na tela: os 0,4 s da bola de beisebol viram 8 s, e o meio segundo da escolha vira 19 s (RV02). O silêncio é o espaço que a imagem precisa.

**8. Mostrar e contar se alternam.** Blocos que mostram têm voz em cerca de um terço do tempo; blocos que contam, em cerca de 60%. Os capítulos de demonstração de RV02 têm 31% e 35% de fala; o do goleiro, 58% (estudo do RV02).

**9. A narração termina perto do fim.** A última palavra cai entre 2 e 10 s antes do fim do vídeo. No longo não há cartela longa e muda; no Short da série de terceiros, a cartela tem 4–5 s.

## Doses por linha (ponto de partida; o `parametros.json` usa estes números)

| | Leve (humor) | Dramática (tensão) |
|---|---|---|
| Maneira de respirar | "respira" (RV02, RV03); se o texto correr como o RV05, cada pausa longa precisa de um corte para quem ouviu | "corre e respira nas costuras" (RV01, RV04) no longo; no Short, silêncios nos pontos de peso |
| Fala no tempo total, longo | 42–80% (mirar 45–60%) | 55–80% (mirar 65–70%) |
| Fala no tempo total, Short | 55–85% | 35–65% (um roteiro de teste do autor tinha 47%: 18,9 s de fala em 40 s) |
| Palavras/min enquanto fala | ~225 (as referências ficam em 198–234) | ~190 (narrador grave, mais lento que os "What If") |
| Frase mediana | 4–7 palavras, quando a imagem e o diálogo fazem o resto | 7–12 palavras, frases completas com contexto (RV01 8, RV04 7) |
| Frases de até 3 palavras | no máximo 30% (RV02 30%, RV03 24%) | no máximo 15% (RV01 13%, RV04 10%) |
| Silêncio depois do soco de gag | 1–4 s, com a reação na tela | — |
| Silêncio nas trocas de ato | 1,5–3 s com cartela (os fechos do livro-caixa) | 4,5–13 s no longo; 1,5–3 s no Short |
| Silêncio depois da escolha ou virada | ≥ 1,5 s no Short; 6–11 s no longo | ≥ 2 s no Short; 6–13 s no longo |
| Pausa antes da palavra que paga | 0,4–1,2 s, uma ou duas por bloco | 0,4–1,9 s, nas frases de peso |

**Inferência** (vale até medir nas nossas cenas): no Short, os silêncios encolhem mais ou menos na proporção da duração, mas o silêncio da escolha não deve cair abaixo de 1,5 s, porque é o momento que a pessoa precisa sentir.
