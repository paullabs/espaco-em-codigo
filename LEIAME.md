# espaco-em-codigo

Um estúdio para fazer **vídeos curtos de espaço e ciência** (Shorts, Reels e TikTok, 9:16) em 3D feito em código: planetas, estrelas, órbitas, explosões, marés e luz viajando, com câmera de cinema, legenda de uma palavra por vez e voz. Nenhuma imagem ou vídeo de terceiros entra: tudo é geometria e shader renderizados quadro a quadro no seu computador.

Você descreve o vídeo em dois arquivos de texto: **o que é dito** e **o que aparece**. O estúdio cuida do resto.

- Monta a câmera, os corpos e os efeitos.
- Põe cada coisa na hora da palavra que fala dela.
- Confere se cada frase mostrou o que disse.
- Mixa o som e entrega o MP4.

O seu agente (Claude Code, Codex ou outro) faz isso com você, em portões, pedindo o seu sim antes de gastar qualquer crédito.

## Do que precisa

- **Node 18 ou mais** e **ffmpeg** (no Mac: `brew install node ffmpeg`; no Windows: `winget install OpenJS.NodeJS Gyan.FFmpeg`; no Linux: o gerenciador de pacotes).
- **Google Chrome**, ou o Chromium que o Playwright baixa. O `doctor` acha o Chrome sozinho.
- Uma placa de vídeo ajuda muito; sem ela funciona, mais devagar (o `doctor` estima o tempo).
- **Voz-guia grátis:**
  - no Mac já vem (voz Luciana, ou outra em português);
  - no Windows, é a voz do sistema (Microsoft Maria, que vem com o pacote de fala em português);
  - no Linux, instale o `espeak-ng`.

  Sem voz no sistema, o rascunho sai mudo, com os tempos estimados.
- **Voz final (opcional, paga):** uma conta na ElevenLabs com a **sua** chave no `.env`.

## Primeiro uso

```bash
npm run instalar                          # uma vez: baixa o three.js e o Playwright
npm run doctor                            # confere o computador
npm run video -- rascunho exemplo_lua     # o exemplo "E se a Lua sumisse?" (19 s), em uns 30 s
```

O rascunho sai em `estudio/espaco/projetos/exemplo_lua/saida/rascunho.mp4`. Há um exemplo completo e mais rico, `lua_mares` (39 s, um palco só: a Terra e a Lua no mesmo quadro, a luz da Lua que some junto com ela, as setas do puxão, a água esticada em volta da Terra, a curva da maré e o Sol): leia o `IDEIAS.md` dele para ver como cada ideia ganha uma imagem própria e como foi conferido palavra por palavra. Junto vêm a folha de contato (`folha.jpg`, um quadro por segundo) e a conferência (`CONFERENCIA.md`).

## Fazer o seu vídeo

Abra o Claude Code nesta pasta e peça ("quero um vídeo sobre buraco negro"), ou digite `/espaco-em-codigo:novo-video` se instalou o plugin. O caminho é sempre o mesmo:

| Passo | Comando | O que sai |
|---|---|---|
| Criar | `npm run video -- novo meu_video` | `projetos/meu_video/` com o modelo |
| Escrever | edite `roteiro.json` e `plano.json` (formato em `estudio/espaco/projetos/LEIA_O_PLANO.md`) | |
| Ver quadros | `npm run video -- quadros meu_video --t 1,4,8` | PNGs para acertar a câmera |
| Escolher o estilo | `npm run video -- estilos meu_video --t 4` | o mesmo quadro em classico, limpo e vivo |
| Rascunho | `npm run video -- rascunho meu_video` | animática com voz-guia, conferência e folha |
| Voz final | `npm run video -- voz-final meu_video` (mostra o custo) e `--confirmo` (gera) | voz da ElevenLabs com o tempo de cada palavra |
| Final | `npm run video -- final meu_video` | 1080×1920, 24 qps, −14 LUFS, em `entrega/` |

O método de escrever a fala (as leis do roteiro que segura a atenção, a estrutura, a abertura, o ritmo e as pausas, o som) fica em `roteiros/consciencia/`; o agente lê antes de escrever. O `LEIAME.md` de lá diz o que não vem neste plugin.

Para estudar um vídeo que você admira: `npm run video -- referencia meu_video video.mp4` (ou um link, com o `yt-dlp` instalado). Ele mede cortes por minuto, duração dos planos, paleta, brilho e volume. O vídeo de referência fica só na sua máquina e nada dele entra no seu vídeo.

## Atualizar o seu projeto

O plugin instala uma **cópia** do estúdio na sua pasta. Quando o plugin atualiza (`claude plugin update espaco-em-codigo@espaco-em-codigo`), os projetos que você já criou continuam com a cópia antiga. Para levar a nova, abra o Claude Code na pasta do projeto e peça `/espaco-em-codigo:atualizar-projeto`, ou rode na mão:

```bash
node "<pasta do plugin>/estudio/atualizar_projeto.mjs" --simular   # só mostra o plano
node "<pasta do plugin>/estudio/atualizar_projeto.mjs"             # aplica
```

Nunca toca no seu `perfil/`, no `.env`, no `estudio.config.json` nem em nenhum vídeo seu em `estudio/espaco/projetos/` (nem nos exemplos, que você pode ter mexido). O que ele substitui (o motor, as ferramentas, a skill do método, o método de roteiro) tem a cópia do antigo em `.atualizacao/`. O que mudou em cada versão está no `CHANGELOG.md`.

## Computador travando?

Acrescente `--leve` a qualquer comando de render: fica mais devagar e deixa a máquina livre. O render já roda em prioridade baixa. O rascunho é leve (540×960, 12 qps); só o `final` é pesado (uns 3 min para 20 s num computador recente).

## Voz final com a sua chave

Copie o `.env.example` para `.env` e preencha `ELEVENLABS_API_KEY` e `ELEVENLABS_VOZ_ID` (na ElevenLabs: Voices → a voz → ID). O comando sem `--confirmo` mostra quantos caracteres vai gastar. Com `--confirmo`, ele gera **uma** tomada por fala, sem variações, e os tempos de cada palavra vêm da própria ElevenLabs.

## A marca d'água

Todo vídeo feito com este estúdio leva uma **marca d'água fraca do canal LABS**: 1,5% de opacidade, só o nome em letras pequenas, num dos cantos, mudando de canto durante o vídeo. Ela é condição da licença (arquivo `LICENSE`, seção 3), e `npm run conferir -- marca` confere se ela está intacta. O resto do vídeo é seu: roteiro, ideias, publicação e monetização.

## O que ainda não foi testado

- **Só foi usado num Mac com chip Apple.** Windows e Linux têm os caminhos escritos (voz do sistema, Chrome, ffmpeg), mas ninguém rodou lá ainda: se algo falhar, o `npm run doctor` diz o que falta.
- **A voz final da ElevenLabs** (`voz-final`) foi escrita contra a documentação, mas nunca rodou de ponta a ponta com uma chave de verdade. Rode primeiro sem `--confirmo` e confira o custo.
- **Nenhuma pessoa de fora usou o estúdio ainda.** Um agente de fora refez um vídeo só pelo texto, mas vale a sua revisão do que ele entrega.

## O que não vem

- Vídeos, imagens ou textos de outros canais.
- Músicas: use as suas, com licença, em `"musica"` no plano. Sem música, entra um fundo tonal baixinho.
- A voz paga: é com a sua conta.

## Licença

Licença própria (arquivo `LICENSE`): uso livre, inclusive comercial, com uma condição: todo vídeo publicado leva a marca d'água do canal do Titular. Não é permitido vender o estúdio como produto, curso ou template. Os componentes de terceiros (three.js, Playwright, fontes) seguem as licenças deles (`LICENCAS_TERCEIROS.md`).
