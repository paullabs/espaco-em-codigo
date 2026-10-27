---
name: novo-projeto
description: Cria, numa pasta da pessoa, um projeto do espaco-em-codigo (estúdio de vídeos de espaço e ciência em código) a partir deste plugin. Copia o estúdio sem sobrescrever nada, instala as dependências, confere o computador, renderiza o exemplo e deixa o perfil para preencher. Use quando a pessoa disser "começar", "criar meu projeto", "instalar o espaco-em-codigo", "quero fazer vídeos de espaço" ou abrir o Claude Code numa pasta vazia depois de instalar o plugin.
---

# Novo projeto espaco-em-codigo

Este plugin traz o estúdio inteiro: o motor 3D, as ferramentas, os exemplos e a skill do método. Esta skill só copia o estúdio para uma pasta da pessoa. Os vídeos são feitos **dentro dessa pasta**, com a skill `video-espaco`, que vai junto na cópia em `.claude/skills/`, e com a skill `novo-video` deste plugin.

## Passos

1. **Veja onde está:** rode `pwd` e `ls -A`.
   - Se a pasta já tem `estudio/espaco/` e um `package.json` com `"name": "espaco-em-codigo"`, ela **já é um projeto**: não copie nada e siga para a skill `novo-video`.
   - Se a pasta tem outras coisas e não está claro que é ali, **pergunte antes** e sugira uma pasta nova (por exemplo `~/videos-de-espaco`). O script não sobrescreve nada: se houver conflito, ele para sem copiar.
2. **Confira o básico:** `node --version` (precisa de 18 ou mais) e `ffmpeg -version`. Se faltar algum, diga o comando de instalação (no Mac, `brew install node ffmpeg`; no Windows, `winget install OpenJS.NodeJS Gyan.FFmpeg`) e **espere o sim** antes de instalar. O Chrome e a placa de vídeo são conferidos pelo `doctor`.
3. **Copie o estúdio** para a pasta:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/novo_projeto.mjs" "<pasta>"
   ```
   Sem a pasta, ele usa a atual. Com `--simular`, só mostra o que copiaria. Se `${CLAUDE_PLUGIN_ROOT}` não vier preenchido, a pasta do plugin fica duas pastas acima da pasta desta skill, e o script está em `estudio/novo_projeto.mjs` dentro dela.
4. **Instale e confira, na pasta do projeto:** rode `npm run instalar` uma vez (baixa o three.js e o Playwright) e depois `npm run doctor`. Explique cada `[FALTA]` e `[AVISO]` em palavras simples. Só `[FALTA]` impede de renderizar.
5. **Mostre que funciona:** rode `npm run video -- rascunho exemplo_lua`. São uns 30 s num computador recente, com a voz-guia grátis do sistema; sem voz no sistema, o rascunho sai mudo. O resultado é `estudio/espaco/projetos/exemplo_lua/saida/rascunho.mp4`: "E se a Lua sumisse?", com 19 s. Abra o vídeo ou a folha `saida/folha.jpg` para a pessoa ver. Se o computador estiver pesado, acrescente `--leve`.
6. **Perfil da casa:** `perfil/perfil_da_casa.md` diz quem aprova, o que precisa do sim (gastar crédito, render inteiro, publicar), o idioma e os gostos. Ofereça preencher conversando.
7. **Diga as duas condições, numa frase:** o estúdio tem licença própria (`LICENSE`) e **todo vídeo publicado leva a marca d'água fraca do canal do Titular**. Diga também, em uma linha, que o kit é do canal do bloco `canal` do `estudio.config.json`, com o nome e o link.
8. **Próximo passo:** a pessoa abre o Claude Code **dentro da pasta do projeto** (se a skill `video-espaco` não aparecer, fecha e abre de novo) e pede o vídeo, ou digita `/espaco-em-codigo:novo-video`.

## Regras

- Nunca copie para dentro da pasta do próprio plugin nem sobrescreva arquivos.
- Não gaste crédito de voz ou de qualquer serviço pago, e não publique nada, sem o sim da pessoa.
- A voz final usa a chave da ElevenLabs **da própria pessoa**, no `.env` do projeto (veja `.env.example`). Nunca peça a chave no chat: ela mesma cola no arquivo.
