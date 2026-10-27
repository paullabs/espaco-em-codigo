# Perfil da casa

Este arquivo é seu. As skills do estúdio leem aqui, antes de cada vídeo, **quem aprova**, **o que precisa do seu sim** e **os números que dependem de gosto**. Mude o que quiser: a skill passa a seguir o que está escrito aqui. Onde este arquivo e uma skill discordarem, vale este arquivo. O canal e o crédito do kit ficam em `estudio.config.json`.

**Para o agente:** um campo em branco (`________`) quer dizer que a pessoa ainda não decidiu. Pergunte uma vez, na hora em que o campo for preciso, e ofereça escrever a resposta aqui. Até lá, siga o padrão escrito ao lado.

## 1. Quem aprova

- Aprovador: **você** (escreva o seu nome aqui: ________).
- Nada é publicado, enviado nem pago por você sem o seu sim.

## 2. O que pede o seu sim, sempre

Antes de acontecer, a skill mostra o que vai fazer (e o custo, se houver) e espera a sua resposta:

1. **Gastar crédito:** voz paga, música, qualquer geração paga. Uma geração, uma variação, e o valor antes.
2. **Render inteiro em 1080×1920** (`npm run video -- final`). O rascunho leve e os quadros soltos não pedem.
3. **Publicar ou enviar qualquer coisa,** inclusive página privada. Padrão de visibilidade: não listado.
4. **Criar uma skill nova ou mudar uma existente.**

Apague ou acrescente linhas à vontade.

## 3. Idioma

- Narração, roteiro e legenda: **português do Brasil** (padrão). Outro idioma funciona se a voz do sistema e a voz final falarem esse idioma: troque `voz_guia.mac` no `roteiro.json` por uma voz daquele idioma (`say -v '?'` lista as do Mac). A legenda mostra o texto do roteiro como está escrito.
- Conversa e documentação: português do Brasil.

## 4. Voz e música

- Enquanto o vídeo está em construção: voz-guia grátis do sistema (no macOS a Luciana; no Windows a Microsoft Maria; no Linux o espeak-ng).
- Voz final: ElevenLabs, na **sua** conta, com a chave e a voz no `.env` (`ELEVENLABS_API_KEY` e `ELEVENLABS_VOZ_ID`). Voz escolhida: ________ (em branco: a voz-guia vai até o fim, e o agente pergunta antes da voz final).
- A voz paga entra só no fim, depois do rascunho aprovado.
- Música: nenhuma (fundo tonal do kit). Para usar a sua, ponha o arquivo na pasta do projeto e `"musica": { "arquivo": "..." }` no plano.

## Números da linha espaço (padrões; mude se o seu gosto pedir)

| O quê | Padrão | Por que esse |
|---|---|---|
| Formato | 1080×1920 a 24 qps | rascunho a 12 qps parece travado |
| Texto na tela | um por vez; legenda de uma palavra por vez | quem assiste ouve e vê, não lê |
| Planos | de no máximo 1,8 s, algo novo a cada 0,9 a 1,8 s | retenção |
| Volume final | −14 LUFS | o `npm run conferir -- video` confere |
| Efeitos sonoros | poucos, só tons | chiado incomoda |
| Fim do vídeo | nunca parece que acabou: sem frase de fecho, sem fade, última pergunta no ar | quem sente o fim sai |
| Voz | voz-guia do sistema até a final | só a voz final gasta crédito |

## 5. O que você já reprovou

Escreva aqui, uma linha por vez, o que você viu e não quis ver de novo ("câmera parada", "legenda em cima do rosto"…). A skill lê esta lista antes de planejar e evita repetir. Comece vazio.

-
