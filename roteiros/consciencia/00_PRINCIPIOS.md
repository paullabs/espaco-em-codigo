# 00 · Princípios: as leis de um roteiro que segura

O núcleo da consciência de roteiro: 17 leis. Cada lei tem a prova (código do vídeo e minuto) e o jeito de conferir. O detalhe e os números estão nos arquivos 01 a 09; os limites medidos, em `parametros.json`.

**Base (19/10/2026):** cinco vídeos "What if" de muita audiência mandados pelo autor (RV01–RV05; as análises ficam em `referencias/`, que não vai no kit), uma série de sobrevivência em Shorts (referência de terceiros), o formato novo de um canal de explicadores em Shorts (referência de terceiros) e a crítica do autor a um roteiro que passou nas medidas e mesmo assim foi achado fraco.

**As duas linhas:** a **leve** (humor) é para as coisas fúteis do dia a dia; a **dramática** (tensão) é para o que pede tensão. As leis valem para as duas; o que muda está em `07_linha_dramatica.md` e `08_linha_leve.md`.

---

## As leis

1. **Abra com a cena, não com a ideia.** A primeira frase põe alguém num lugar fazendo algo, e já acontece algo esquisito, engraçado ou ameaçador, sem explicação. "You're fourth in the queue for coffee," (RV01) · "A fly buzzes past your face." (RV02) · "You're late. Again." (RV05). *Confere:* nenhuma frase de contexto nos 3 primeiros segundos.

2. **Mostre a prova antes de dizer a premissa.** A pergunta ("So, what if…?"), o número que choca ("500.") ou a afirmação ("you're the last person on Earth") vem depois da demonstração, entre 17 e 49 s no longo, e ganha 2,5–3,7 s de silêncio com uma imagem-assinatura (RV02 0:34, RV03 0:31, RV05 0:26, RV01 0:24). Pode nem ser falada: RV03 a escreve num cartão no silêncio depois da piada da abertura, e RV01 e RV04 nunca dizem "what if". *Confere:* batida `pergunta_titulo` depois do `gancho`.

3. **Uma pergunta-mãe no começo, paga só no fim, e uma corrente de perguntas no meio.** Nos primeiros segundos, uma dúvida intrigante de verdade, dita de um jeito que faz um estranho querer a resposta; ela só é respondida na última batida (numa série, no fim da última parte), e nada a entrega antes, nem um nome. No meio, perguntas menores ligadas à história: cada batida responde uma e abre a próxima, para nunca existir um momento sem pergunta aberta. Regra do autor (19/10/2026): "tem que ter uma dúvida muito intrigante no começo… respondida apenas no final… dúvidas gerando dúvidas a cada momento do vídeo". As referências fazem isso: o que cai do teto (RV04, aberto a 0:01 e pago só a 8:01–9:11), "you're the last person on Earth" pago por "the radio answers" (RV01 0:24 → 10:30), a van preta (RV05 3:45 → 8:24). E a regra mais antiga do autor continua: impacto primeiro, depois explicar e "jogar as migalhas". *Confere:* no `roteiro.json`, `lacos` com `tipo: "mae"` (um só) e `"corrente"`; o `conferir_roteiro.py` checa onde a mãe abre e fecha e se toda batida abre ou responde alguma pergunta.

4. **Concreto vence genérico.** Detalhe que o espectador vê e número que ele mede: "Four coffees still steaming and a card machine beeping approved at nobody" (RV01 0:06) · "A normal person lets it drop 30 cm. You? 3 mm." (RV02 0:58) · "A mug that keeps tea at exactly 60° C" (RV03 1:34). *Confere:* um detalhe concreto ou número por bloco.

5. **Ancore o impossível no real.** Um fato verdadeiro, com ano, lugar ou medida, a cada um ou dois minutos no longo: o apagão de 2003 (RV01 1:12), os fótons teletransportados em Innsbruck em 1997 (RV05 0:33), a regra da largada queimada (RV02 4:20), os lobos de Chernobyl (RV01 8:22). *Confere:* fatos marcados no roteiro, com fonte.

6. **Suba em escada.** Do pequeno ao enorme, com plateia e aposta maiores a cada degrau: mosca, vaso, carro, games, tênis de mesa, beisebol, boxe, futebol, seleção, final da Copa (RV02). *Confere:* 3 degraus ou mais, nenhum repetido.

7. **Feche cada degrau com um soco.** Uma palavra ("Caught."), a fala curta de um coadjuvante ("Lucky guess.", "Who is this kid?") ou uma imagem que paga a frase, seguida de silêncio. *Confere:* o fim de cada batida de escalada.

8. **Toda vantagem tem um custo.** "And there's a cost." (RV02 4:30) · "Amazing and awful. Usually both at once." (RV03 0:51) · "an inheritance with a countdown" (RV01 2:40). O custo chega antes de 65% do tempo e muda o tom. *Confere:* batida `custo` antes de 65%.

9. **O fútil abre a porta, o coração segura o fim.** Os três "What If" viram, da metade em diante, uma escolha moral por alguém: a bola ou o menino (RV02), a vingança ou a verdade (RV03), o segredo ou o amigo (RV05). A âncora é plantada antes, às vezes só na imagem: o menino de verde salvo duas vezes e já atrás do gol antes de ser revelado (RV02 1:25, 1:51, 4:56). Na dramática, o companheiro faz esse papel (a cadela, o avô). *Confere:* a âncora do coração entra antes da crise.

10. **Plante e pague, e escreva a lista depois de saber o final.** O que aparece no começo volta no fim com sentido novo: "you laugh a beat late on purpose" → "you laughed right on time" (RV03 1:25 → 8:09); a rima da chuva → "It isn't a fish." (RV04 1:05 → 9:11); a regra 2 → o clímax (RV05 2:17 → 11:04); a lata de pêssego → o último plano (RV01 3:08 → 10:53). Todo item da lista de vantagens e custos volta como arma ou pagamento; o que não volta sai. *Confere:* toda regra e todo laço pagos; dois retornos ou mais.

11. **O silêncio é fala, e o tamanho dele acompanha o peso.** A voz tem um andamento só (198–234 palavras por minuto enquanto fala, mediana ~222, em todos); o ritmo é desenhado com as pausas. Ironia seca até 1 s, soco de gag 4–8 s, revelação 2,5–3,7 s, troca de ato 4,5–13 s, **a frase da escolha 10–11 s** ("The ball (1.2) or the boy?" RV02 5:29; "You should get the door." RV03 7:17). Quem fala sem parar (RV05) faz o corte respirar: toda pausa longa vai para o rosto de quem ouviu. *Confere:* cada silêncio planejado diz o que o preenche.

12. **Uma ideia por frase, dita do jeito que se fala.** Frase completa, natural, com o contexto que a cena pede: quem, onde, por que importa. A frase curta e a pausa antes da palavra que paga ("You just (0.6) catch it.") são tempero, não regra. Os documentários dramáticos narram em frases de 7–8 palavras (RV01 e RV04: um terço das frases com 10 ou mais); os "What If" de humor descem para 4–5 porque a imagem e o diálogo fazem o resto (RV02, RV03). A primeira versão do roteiro da Segunda Guerra, com mediana de 5 palavras e fragmentos como "Alone." e "Land. Then north. Sweden.", ficou abstrata demais; o autor pediu: "não pode deixar muito direto, tem que deixar um pouco da narrativa para que a pessoa entenda". *Confere:* frase mediana dentro da faixa da linha e poucas frases de até 3 palavras no `conferir_roteiro.py`; e ler em voz alta.

13. **A imagem diz o que a fala não diz.** O número vira objeto (BATTERY 31 DAYS, o pontinho do 500), a mudança aparece tirando coisas do mesmo enquadramento (a fila que some), e a narração se cala quando a ação fala (19% de RV02 é só imagem). *Confere:* coluna "O que se vê" com ação e detalhe, não cenário.

14. **A reação é a pontuação.** Alguém de fora confirma o impossível; o coadjuvante fecha a gag; o rosto preenche o silêncio; a plateia cresce com a escada (RV02: do amigo a 80.000 pessoas). *Confere:* reação marcada em boa parte das batidas.

15. **Termine em três tempos: pouso, porta aberta, pergunta.** O alívio com um retorno, uma porta para mais ("Get in the car.", "someone started typing", "the radio answers") e, na linha leve, a pergunta sobre a escolha de quem assiste ("would you have jumped for that kid, too?"). *Confere:* `final.tipo` e a última fala.

16. **Mude a moldura antes de mudar o tom.** Quando a história vira de leve para dramática, tudo muda junto numa ponte de ~40 s: luz, barras de cinema, duração dos planos, tamanho das pausas, quantidade de diálogo (RV05 a partir de 5:55: brilho de 93 para 43, pausa mediana de 0,35 para 0,44 s; RV03 3:55–4:38: somem as gags e os selos, a cor esfria, a pausa entre frases dobra). O espectador sente a virada antes de entender. *Confere:* a batida antes da virada diz o que muda na imagem e no som.

17. **Quem nunca ouviu a história tem de entender o que vê, o que ouve e por que importa.** A narração dá o fio (quem é, o que está acontecendo, o que está em jogo) e deixa espaço para a imagem mostrar o resto. Palavra solta sem contexto deixa a cena sem sentido. Regra do autor (19/10/2026): "a linguagem natural é essencial", para que as pessoas entendam "o que está sendo dito, o que está sendo mostrado ou o que está sendo ouvido e percebido". *Confere:* ler o roteiro em voz alta para alguém que não conhece a história; se ele precisar perguntar o que aconteceu, falta narrativa.

---

## Ordem de leitura para escrever

1. Este arquivo.
2. A linha da história: `07_linha_dramatica.md` ou `08_linha_leve.md`.
3. `01_estrutura.md` (o esqueleto e o molde de blocos por formato) e `02_abertura.md`.
4. `03_ritmo_e_pausas.md`, `04_fala_e_imagem.md`, `05_reacoes_e_dialogo.md`, `06_som.md` enquanto escreve as batidas.
5. `09_verificacao.md` e o `conferir_roteiro.py` antes de mandar para aprovação.
6. Os estudos em `roteiros/estudos/` quando precisar ver como uma referência resolveu um trecho.
