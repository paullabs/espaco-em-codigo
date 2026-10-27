# Processo em portões (com checklists)

Cada portão termina com algo que quem aprova pode olhar. A voz paga e o render inteiro só vêm no fim: antes disso, tudo roda com a voz-guia grátis e o rascunho leve.

## Portão 1: pergunta e roteiro

- [ ] Uma pergunta-mãe que qualquer pessoa quer ver respondida, dita no primeiro quadro, com o objeto dela na tela.
- [ ] Uma resposta que um estranho repete depois ("a Lua puxa a água; sem ela, a maré fica com menos da metade").
- [ ] Três curiosidades reais no máximo, cada uma com um número e um objeto que dá para ver, e a fonte em `"fontes"`.
- [ ] Corrente de perguntas: cada bloco termina abrindo a próxima dúvida; um gancho a cada 10 a 12 s.
- [ ] Português falado: leia em voz alta. Sem fragmentos, com conectivos naturais e números por extenso.
- [ ] Mapa frase → imagem: cada pedaço é `"texto falado|objeto1,objeto2"` e usa os nomes que o plano vai ter.
- [ ] Pergunta final curta e pessoal, e nada depois dela.
- [ ] Mostre o `IDEIAS.md` e o `roteiro.json`. **Espere o sim.**

## Portão 2: plano de cenas

- [ ] `npm run video -- voz <nome>` e os tempos de cada pedaço no `linhas.json`.
- [ ] No `IDEIAS.md`, a tabela "plano → vê → entende → novo".
- [ ] Um palco só, a direção de tela fixa e o código de cor (cada cor com uma função).
- [ ] Os objetos do `plano.json` com os nomes que o roteiro pede.
- [ ] Planos de 0,9 a 1,8 s, presos aos pedaços, cada um com `novo`. Transições por movimento (`parte` e `chega`).

## Portão 3: posicionar e analisar

- [ ] `npm run video -- quadros <nome> --t ...` com um instante de cada plano. Olhe os PNGs e a lista frase → imagem que o comando imprime.
- [ ] `npm run video -- rascunho <nome>`. No `CONFERENCIA.md`, só passa com:
  - zero alertas: cada pedaço mostra o que pede, a câmera não encosta em nenhum corpo e nunca há mais de um texto na tela;
  - os avisos conferidos no quadro: plano longo ou relâmpago, herói cortado, pequeno ou grande demais, objeto ou brilho atrás da legenda.
- [ ] Olhe a `saida/folha.jpg` inteira, como um espectador que nunca viu o assunto.

## Portão 4: aprovação

Envie a quem aprova:

- o `saida/rascunho.mp4`, com a voz-guia;
- a `saida/folha.jpg`;
- o `CONFERENCIA.md`.

Pergunte uma coisa só: se a explicação ficou clara. **Espere o sim.**

## Portão 5: voz final, final e entrega

- [ ] `npm run video -- voz-final <nome>` mostra quantos caracteres vai gastar. Com o sim de quem paga, rode com `--confirmo`: uma tomada por fala, sem variações. Os tempos de cada palavra vêm da própria ElevenLabs.
- [ ] Rode o rascunho de novo, porque os tempos mudaram, e confira zero alertas.
- [ ] `npm run video -- final <nome>` (com o sim, porque é o render inteiro), depois `npm run conferir -- marca`.
- [ ] Entregue a pasta `entrega/` com a linha de crédito do kit.
