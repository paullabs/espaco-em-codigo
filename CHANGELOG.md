# Novidades por versão

## 0.4.0

- **Mac e Windows, com instalação sozinha do que faltar.** `npm run preparar` confere o Node, os pacotes do estúdio, o ffmpeg (com o ffprobe) e o navegador, mostra o que falta com o tamanho e, com o seu sim, baixa só isso para dentro do projeto, sem senha de administrador. **Quem já tem ffmpeg, Chrome, Chromium ou Edge instalados não baixa nada** (o Windows já vem com o Edge). Sem o seu sim ele não instala nada.
- O estúdio acha o ffmpeg e o navegador também fora do PATH: Homebrew, MacPorts, winget, Chocolatey, Scoop, Edge. `ESTUDIO_IGNORAR=ffmpeg,chrome` faz usar só as cópias do projeto.
- `npm run doctor` diz de onde vem cada programa e aponta o `preparar` quando algo falta.
- As skills `novo-projeto` e `atualizar-projeto` usam o `preparar` e não dependem mais de comandos só do Mac (`pwd`, `ls`); o `~` vale no Windows.
- **O que foi testado:** o Mac com chip Apple, de ponta a ponta, e a busca de programas e o plano de instalação por simulação do Windows e do Linux. O download, o render e a voz do sistema (PowerShell) num Windows de verdade ainda não foram rodados.
- Quem já tem um projeto e usa git: o `.gitignore` do projeto é seu e não é tocado. Acrescente nele a linha `estudio/ferramentas_locais/navegador/` (o navegador baixado tem uns 300 MB). Projetos novos já vêm com ela.
- **Instala igual no Claude Code e no Codex.** O README traz os comandos do Codex (`codex plugin marketplace add` e `codex plugin add`) e o `--scope user`, que instala para todas as suas pastas. As skills explicam como achar a pasta do plugin quando o agente não preenche a variável CLAUDE_PLUGIN_ROOT (o Codex não preenche), e `novo-projeto` confere se o plugin está instalado para todas as pastas (`scope: user`) e avisa se está só em uma. **O que foi testado:** instalar nos dois com configuração limpa e ver as skills carregadas; um agente do Codex seguindo o texto de ponta a ponta ainda não foi rodado.

## 0.3.1

- **Marca d'água mais discreta**: 1,5% de opacidade (era 4%), só o nome do canal (sem a barra dourada), metade do tamanho e mais perto das pontas dos cantos. Continua mudando de canto. `npm run conferir -- marca` passa a aceitar de 1% a 3%. Quem já criou um projeto leva a mudança com `/espaco-em-codigo:atualizar-projeto`.

## 0.3.0

- **`/espaco-em-codigo:atualizar-projeto`**: leva o motor e o método novos para um projeto que você já criou. Não toca no seu perfil, no `.env`, no `estudio.config.json` nem em nenhum vídeo seu em `estudio/espaco/projetos/` (nem nos exemplos, que você pode ter mexido); guarda cópia de tudo o que substitui em `.atualizacao/`. Um exemplo novo que o plugin traga entra sozinho.
- Este `CHANGELOG.md`.
- `novo_projeto.mjs` e `atualizar_projeto.mjs` passam a usar a mesma lista de arquivos (`kit_arquivos.mjs`).

## 0.2.1

- O método de roteiro (`roteiros/consciencia/`) troca as frases literais, em inglês, dos vídeos de terceiros por `[frase]`. Ficam os números, os tempos e as regras. A montagem do plugin para com erro se sobrar uma frase dessas.

## 0.2.0

- O método de escrever a fala vem no plugin: `roteiros/consciencia/` (as leis do roteiro que segura a atenção, a estrutura, a abertura, o ritmo e as pausas, o som, a verificação) e o modelo de narrativa. Saem dali o nome da série dramática e os exemplos das outras linhas.

## 0.1.0

- Primeira versão: o motor 3D de espaço, a cena genérica de vídeo (`cenas/video.js`) guiada por `roteiro.json` e `plano.json`, as ferramentas `npm run video` (novo, quadros, estilos, rascunho, conferir, referência, voz-final, final), os objetos didáticos (seta, luz, bola, campo, oceano com realce, pino, gráfico, praia), os exemplos `exemplo_lua` e `lua_mares`, e as skills `novo-projeto`, `novo-video` e `video-espaco`.
