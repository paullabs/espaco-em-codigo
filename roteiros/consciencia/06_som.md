# 06 · Som: o que o roteiro precisa pedir

O roteiro não escolhe a trilha, mas marca **onde a música cai, onde sobe, onde entra um golpe e onde tudo para**. Tudo aqui é **medido** na música e efeitos separados da voz (demucs): `03_medidas/<RVnn>/fundo.json`. Quem mede não ouve o timbre; "cai", "sobe" e "golpe" são variações de nível e ataques fortes.

## Os números

| | RV01 | RV02 | RV03 | RV04 | RV05 |
|---|---|---|---|---|---|
| Fundo presente | 60% | 37% | 72% | 67% | 46% |
| Fundo abaixo da voz, enquanto fala | ~30 dB | ~18 dB | ~21 dB | ~30 dB | ~22 dB |
| Quanto o fundo sobe quando a voz para | +9 dB | +5 dB | +3 dB | +11 dB | +3 dB |
| Quedas de música dentro de pausas ≥ 0,7 s | 11 de 34 | **19 de 28** | **18 de 20** | 10 de 25 | 0 de 21 |
| Golpes fortes dentro de pausas | 13 de 38 | **13 de 18** | **16 de 26** | 7 de 31 | 19 de 59 |

## As regras

1. **A música respira com o texto.** Fica 18–30 dB abaixo da voz enquanto alguém fala e sobe quando a voz para (+3 a +11 dB). Nos vídeos que mais respiram (RV02, RV03), quase toda queda e quase todo golpe caem dentro de um silêncio da narração: a trilha é coreografada com as pausas do roteiro. **Regra de escrita:** cada silêncio planejado no roteiro diz o que o som faz nele (sobe, cai, golpe, nada).
2. **A música cai na revelação.** Depois de "you're the last person on Earth" (RV01 0:27), de "So, what if your reaction time was 10 times faster?" (RV02 0:34), de "And your tea is still hot." (RV03 0:14), a música cai junto com o silêncio. O vazio sonoro faz a frase pesar.
3. **O golpe paga a imagem, não a palavra.** O impacto cai no silêncio depois da frase, quando a imagem mostra o resultado (a bola pega, o soco, a porta).
4. **No clímax, tira a música.** O maior silêncio de cada vídeo começa com o fundo caindo: "The ball (1.2) or the boy?" + 10,6 s (RV02 5:29); "You should get the door." + 10,4 s (RV03 7:17), onde o fundo cai duas vezes e volta a subir antes da próxima fala. Num respiro preso, a música fica 13 dB abaixo, só respiração e coração.
5. **Documentário pede fundo baixo e constante.** RV01 e RV04 deixam a trilha 30 dB abaixo da voz e a fazem subir nas transições de fase (+9 a +11 dB): a música marca a passagem do tempo, não a piada.
6. **Herdado de uma série de terceiros** (análise de áudio interna em `referencias/`): a trilha sobe nos respiros e some de repente nos sustos; os efeitos marcam eventos da história (título, regra, tiro, revelação, cartela), não os cortes; a imagem corta na fala, não na batida da música; um episódio inteiro quase sem música também funciona.

7. **A música sobe no silêncio e cai 10–18 dB em cima da palavra-soco:** "Caught." (−18 dB), "You don't. You watch…" (−17,7 dB), "Okay. I give up." (−16,2 dB) (RV02).
8. **Silêncio total, uma vez só por vídeo,** no momento de maior peso, e a saída dele em crescendo: voz e música zeradas por 1,9 s (−82 dB) depois de "Now, there's nobody up there either." (RV01 7:09); o fundo a −71,5 dB por 3,5 s em "Eighty thousand people go silent." até o aplauso (RV02 5:48).
9. **Tire a música quando o mundo para e quando o vilão fala:** acento forte, queda de ~20 dB por 16 s, e a fala do vilão sem nada por baixo (RV05 10:01–10:40).
10. **Antes do clímax, o narrador sai da ficção numa frase seca e a música sai junto:** "Everything up to now scientists more or less agree on. This next part, nobody can tell you." com a música a −56 dB (RV01 10:22).
11. **A revelação maior acontece sem voz, com a música no pico do vídeo:** a superfície (~6,5 s, fundo até −20 dB) e a carta que vira a Terra (~9 s, até −17,5 dB), contra −43 dB de mediana sob a voz (RV04).
12. **Corte a música 1–2 s antes do pagamento para ele estourar** (RV03: o fundo cai a −40 dB em 8:01 e sobe 10,7 dB em 8:03, na volta do diagrama de giz).
13. **Na confissão mais dura, a música vai para o piso** (≈ −47 dB, RV03 5:22–5:39).

## Como marcar no roteiro

Na coluna "Som" e no campo `som`/`musica` do `roteiro.json`:
- `musica`: entra · segue · sobe · cai · para · volta.
- `som`: os efeitos que a história pede, com o momento ("golpe grave no corte para a cidade", "coração 64 bpm", "chiado de rádio").
- `silencio.preenche`: o que ocupa cada silêncio (reação, ação, gag, música, efeito, nada).
