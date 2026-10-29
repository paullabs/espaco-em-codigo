---
name: novo-projeto
description: Cria, numa pasta da pessoa, um projeto do espaco-em-codigo (estúdio de vídeos de espaço e ciência em código) a partir deste plugin, no Mac ou no Windows. Copia o estúdio sem sobrescrever nada, confere o computador e baixa só o que faltar (ffmpeg, navegador, pacotes), renderiza o exemplo e deixa o perfil para preencher. Use quando a pessoa disser "começar", "criar meu projeto", "instalar o espaco-em-codigo", "quero fazer vídeos de espaço" ou abrir o Claude Code numa pasta vazia depois de instalar o plugin.
---

# Novo projeto espaco-em-codigo

Este plugin traz o estúdio inteiro: o motor 3D, as ferramentas, os exemplos e a skill do método. Esta skill só copia o estúdio para uma pasta da pessoa. Os vídeos são feitos **dentro dessa pasta**, com a skill `video-espaco`, que vai junto na cópia em `.claude/skills/`, e com a skill `novo-video` deste plugin.

Os comandos `node ...` e `npm run ...` abaixo são iguais no Mac e no Windows. Use o terminal que o Claude Code já usa (no Windows, PowerShell ou Git Bash). No PowerShell do Windows, se `npm` der o erro "a execução de scripts está desabilitada neste sistema", troque `npm` por `npm.cmd` (por exemplo `npm.cmd run video -- rascunho exemplo_lua`); os comandos `node ...` não têm esse problema.

> **Raiz do plugin (Claude Code e Codex).** Os comandos abaixo precisam da pasta do plugin, que o Claude Code chama de CLAUDE_PLUGIN_ROOT. O Claude Code troca a variável pelo caminho antes de você ler este texto. O Codex e outros agentes não trocam: lá a variável sai vazia, e o comando falha com "Cannot find module" ou "No such file". Se os comandos abaixo ainda mostram a variável escrita com cifrão e chaves, em vez de um caminho de pasta, **pare antes de rodar qualquer um**: a raiz do plugin é a pasta duas acima da pasta desta skill, a que tem o arquivo `.claude-plugin/plugin.json`. Confirme que o arquivo existe lá e use esse caminho absoluto no lugar da variável em todos os comandos. Nunca rode um comando com a raiz vazia.

## Antes de começar: o plugin está instalado para todas as pastas?

Se a pessoa instalou o plugin só para uma pasta, ele some quando ela abre o Claude Code em outra. Confira isto antes de copiar qualquer coisa, sem instalar nada ainda:

1. **Claude Code:** rode `claude plugin list --json` e procure o item `espaco-em-codigo@espaco-em-codigo`.
   - Existe um item com `"scope": "user"` e `"enabled": true`: está **global**. Siga.
   - Só existe com `"scope": "project"` ou `"local"` (vem junto o `projectPath`): **não está global**, vale só para aquela pasta. Diga isso numa frase e ofereça `claude plugin install espaco-em-codigo@espaco-em-codigo --scope user`. Só rode com o sim da pessoa.
   - Não aparece: o plugin foi carregado de uma pasta avulsa, ou o `claude` do terminal não é o da pessoa. Diga que **não está instalado**, mostre os comandos de instalação do `README.md` e siga só se ela quiser.
2. **Codex:** rode `codex plugin list` e procure `espaco-em-codigo@espaco-em-codigo`: tem de dizer `installed, enabled`. Se não disser, ofereça `codex plugin add espaco-em-codigo@espaco-em-codigo`.
3. Se o comando `claude` ou `codex` não existir, ignore aquele item: a pessoa pode usar só um dos dois.

## Passos

1. **Veja onde está:** liste a pasta atual (com as suas ferramentas de arquivo, ou `ls -A` no Mac e `dir -Force` no PowerShell).
   - Se a pasta já tem `estudio/espaco/` e um `package.json` com `"name": "espaco-em-codigo"`, ela **já é um projeto**: não copie nada. Se o plugin tem versão mais nova que a do projeto (compare os `package.json`), use a skill `atualizar-projeto`; se não, siga para a skill `novo-video`.
   - Se a pasta tem outras coisas e não está claro que é ali, **pergunte antes** e sugira uma pasta nova (por exemplo `videos-de-espaco`). O script não sobrescreve nada: se houver conflito, ele para sem copiar.
2. **Node:** rode `node --version`: precisa de 18 ou mais. É a **única peça que o projeto não instala sozinho**, porque é ele que roda tudo o mais.
   - Se o comando não existir ou for antigo, diga isso em palavras simples, mostre o comando e **espere o sim**:
     - Windows: `winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements` (o instalador do Node pode abrir um pedido de permissão de administrador do Windows, o UAC, que só a pessoa consegue aceitar: avise antes)
     - Mac: `brew install node`; sem Homebrew, o instalador de nodejs.org.
   - Depois de instalar, a pessoa precisa **fechar e abrir o Claude Code** (um terminal que já estava aberto não enxerga o programa novo) e pedir de novo.
3. **Copie o estúdio** para a pasta:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs" "<pasta>"
   ```
   Sem a pasta, ele usa a atual. Escreva o caminho **sem barra no final** (no PowerShell 5, `"C:\a b\"` chega errado ao Node) e depois entre nessa pasta (`cd`) antes de seguir: os passos 4 e 5 rodam dentro dela. Com `--simular`, só mostra o que copiaria. O script está em `estudio/novo_projeto.mjs`, dentro da raiz do plugin (veja a nota sobre a raiz do plugin no começo desta skill).
4. **Prepare o computador, na pasta do projeto.** Primeiro só confira:
   ```bash
   node estudio/preparar.mjs --simular
   ```
   Ele olha o Node, os pacotes do estúdio, o ffmpeg (com o ffprobe) e o navegador. **O que a pessoa já tem é usado e não é baixado de novo**: serve ffmpeg do sistema, Chrome, Chromium ou Edge (o Windows já vem com o Edge). Conte em palavras simples o que já está pronto (✔) e o que falta, com os tamanhos. Se faltar algo, peça **um único sim** para baixar tudo (vai para a pasta do projeto, não pede senha de administrador e não mexe no resto do computador) e rode:
   ```bash
   node estudio/preparar.mjs --sim
   ```
   Esse comando **pode levar vários minutos** (baixa até uns 400 MB, e no Windows o antivírus ainda confere tudo): rode-o em segundo plano, ou com o tempo limite máximo da ferramenta, e espere ele terminar. Se for interrompido, é seguro rodar de novo: ele confere tudo outra vez e refaz o que ficou pela metade.
   No fim ele roda o `doctor` sozinho (placa de vídeo, WebGL2, estimativa de tempo). Explique cada `[FALTA]` e `[AVISO]` em palavras simples. Só `[FALTA]` impede de renderizar. Se um download falhar (rede fechada, por exemplo), o `preparar` imprime o comando manual de cada item (`brew` no Mac, `winget` no Windows): mostre e rode o `preparar` de novo depois.
5. **Mostre que funciona:** rode `npm run video -- rascunho exemplo_lua`. São uns 30 s num computador recente, com a voz-guia grátis do sistema (a Luciana no Mac, a voz em português do Windows); sem voz no sistema, o rascunho sai mudo. O resultado é `estudio/espaco/projetos/exemplo_lua/saida/rascunho.mp4`: "E se a Lua sumisse?", com 19 s. Abra o vídeo ou a folha `saida/folha.jpg` para a pessoa ver. Se o computador estiver pesado, acrescente `--leve`.
6. **Perfil da casa:** `perfil/perfil_da_casa.md` diz quem aprova, o que precisa do sim (gastar crédito, render inteiro, publicar), o idioma e os gostos. Ofereça preencher conversando.
7. **Diga as duas condições, numa frase:** o estúdio tem licença própria (`LICENSE`) e **todo vídeo publicado leva a marca d'água fraca do canal do Titular**. Diga também, em uma linha, que o kit é do canal do bloco `canal` do `estudio.config.json`, com o nome e o link.
8. **Próximo passo:** a pessoa abre o Claude Code **dentro da pasta do projeto** (se a skill `video-espaco` não aparecer, fecha e abre de novo) e pede o vídeo, ou digita `/espaco-em-codigo:novo-video`.

## Regras

- Nunca copie para dentro da pasta do próprio plugin nem sobrescreva arquivos.
- Nunca instale nada fora da pasta do projeto sem o sim da pessoa. O `preparar` só baixa para dentro do projeto; Node, `brew` e `winget` só com o sim dela.
- Não gaste crédito de voz ou de qualquer serviço pago, e não publique nada, sem o sim da pessoa.
- A voz final usa a chave da ElevenLabs **da própria pessoa**, no `.env` do projeto (veja `.env.example`). Nunca peça a chave no chat: ela mesma cola no arquivo.
- Só o Mac com chip Apple foi rodado de verdade. No Windows a busca de programas e o plano de instalação foram testados por simulação; o download, o render e a voz do sistema (PowerShell) estão escritos, mas ainda não foram rodados num Windows de verdade: se algo falhar, mostre a saída do `preparar` e do `doctor` e diga isso à pessoa.
