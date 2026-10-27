---
name: novo-video
description: Guia um vídeo novo de espaço e ciência no projeto espaco-em-codigo, do tema à entrega, em portões com o sim da pessoa. Use quando a pessoa pedir um vídeo, um Short ou um Reels de espaço, astronomia ou ciência ("faz um vídeo sobre buraco negro", "e se o Sol apagasse", "quero um vídeo de marés"), disser "novo vídeo" ou digitar /espaco-em-codigo:novo-video. Se a pasta ainda não é um projeto, começa pela skill novo-projeto.
---

# Novo vídeo de espaço e ciência

1. **Confira se está num projeto:** precisa existir `estudio/espaco/ferramentas/video.mjs` e um `package.json` com `"name": "espaco-em-codigo"`. Se não existir, use a skill `novo-projeto` deste plugin e volte.
2. **Leia, nesta ordem:**
   - `perfil/perfil_da_casa.md`: quem aprova e o que precisa do sim. Vale mais que tudo.
   - `.claude/skills/video-espaco/SKILL.md`: o método, os portões e as regras.
   - `estudio/espaco/projetos/LEIA_O_PLANO.md`: o formato do roteiro e do plano.
3. **Combine o tema numa conversa curta.** Se a pessoa não trouxe um, ofereça **três** perguntas "e se…" ou "por que…" concretas e visuais, e deixe ela escolher. Não adivinhe. Uma boa pergunta tem um objeto real que dá para mostrar, uma resposta que qualquer pessoa repete depois e um perigo ou surpresa honesto. Se ela trouxer um vídeo de referência, meça com `npm run video -- referencia <nome> <arquivo ou link>`: é só para estudo, e o conteúdo do vídeo novo é original.
4. **Crie o projeto:** `npm run video -- novo <nome_curto>` (letras minúsculas e `_`). Para partir do exemplo completo, acrescente `--de exemplo_lua`. Diga a linha de crédito do canal (bloco `canal` do `estudio.config.json`) e lembre da marca d'água.
5. **Siga os portões da skill `video-espaco`:**
   1. Pergunta e roteiro: mostre o `IDEIAS.md` e o `roteiro.json` e **espere o sim**.
   2. Plano de cenas.
   3. Rascunho com `npm run video -- rascunho <nome>`, até zero alertas no `CONFERENCIA.md`.
   4. Mostre o rascunho e a folha e **espere o sim**.
   5. Voz final (mostre o custo antes; só com `--confirmo` e o sim de quem paga) e `npm run video -- final <nome>`.
6. **Entregue:** a pasta `estudio/espaco/projetos/<nome>/entrega/`, com a linha de crédito. Publicar é com a pessoa.

## O que dizer à pessoa em cada passo

Fale simples e curto: o que foi feito, o que ela precisa olhar e o que você precisa dela (um sim, uma escolha). Mostre os quadros e o rascunho (abra o arquivo ou mande a imagem) em vez de descrever.
