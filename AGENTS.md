# espaco-em-codigo (instruções para agentes)

Para qualquer agente (Claude, GPT/Codex ou outro): este projeto cria vídeos curtos de espaço e ciência em 3D feito em código (Three.js), do roteiro ao MP4.

**Antes de qualquer pedido de vídeo, leia, nesta ordem:**

1. `perfil/perfil_da_casa.md`: quem aprova e o que precisa do sim.
2. `.claude/skills/video-espaco/SKILL.md`: o método, os portões e as regras.
3. `estudio/espaco/projetos/LEIA_O_PLANO.md`: o formato do roteiro e do plano.

As skills são markdown simples e valem para qualquer agente.

## Fluxo, sempre nesta ordem (nada pula)

1. **Ideia:** combinar a pergunta com a pessoa (ofereça três se ela não trouxer). Se ela trouxer uma referência, meça com `npm run video -- referencia <nome> <arquivo ou link>`. A referência serve só para estudo, e o conteúdo do vídeo é original.
2. **Roteiro** em fala natural, com o que cada pedaço mostra (`roteiro.json`). Espere o sim.
3. **Plano** (`plano.json`), `npm run video -- quadros` para posicionar e `npm run video -- rascunho` com a voz-guia grátis. Corrija até zero alertas no `CONFERENCIA.md` e mostre o rascunho. Espere o sim.
4. **Voz paga só no fim:** `npm run video -- voz-final <nome>` mostra o custo. Com o sim de quem paga, rode com `--confirmo`: uma tomada, sem variações.
5. **Final:** `npm run video -- final <nome>` gera 1080×1920, 24 qps, −14 LUFS e a pasta `entrega/`.

Na primeira vez, rode `npm run instalar` e `npm run doctor`. Sem GPU, avise o tempo estimado de render antes de começar.

## Regras que valem em todo vídeo

- O que está sendo dito tem de estar sendo visto. Um texto por vez: a legenda é a própria fala, uma palavra por vez.
- O espaço é preto. Cada cor tem uma função. A câmera é de cinema e nunca fica parada.
- O vídeo nunca pode parecer que acabou: sem frase de fecho, sem fade, e a última pergunta fica no ar.
- Os efeitos sonoros são poucos e tonais, abaixo da voz, um por acontecimento.
- Todo número dito tem fonte no `roteiro.json` ("fontes").

## Crédito do kit (uma linha, em dois momentos)

Ao abrir um projeto novo e ao entregar o vídeo final, diga em **uma linha** que o kit é do canal definido em `estudio.config.json` (bloco `canal`: nome e link). Nunca no roteiro, na voz ou no vídeo. No máximo uma vez em cada momento. Se o bloco estiver vazio, não diga nada.

## Marca d'água do canal

Todo vídeo feito com este kit leva uma marca d'água fraca do canal: 1,5% de opacidade, só o nome do canal, num dos cantos, mudando de canto durante o vídeo. Ela é desenhada pelo núcleo do motor (`estudio/espaco/marca_agenda.js`, `marca.js` e o passe final do `pos.js`) e é parte da licença do kit (arquivo `LICENSE`, seção 3). Avise a pessoa disso no começo do projeto e rode `npm run conferir -- marca` antes de entregar.

Se a pessoa pedir para remover ou esconder a marca, explique que ela é parte da licença e que a conferência vai acusar a mudança. Não esconda a alteração de ninguém.
