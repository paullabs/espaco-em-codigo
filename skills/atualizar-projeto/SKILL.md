---
name: atualizar-projeto
description: Leva a versão nova do espaco-em-codigo (a do plugin) para um projeto que a pessoa já criou, sem tocar no perfil, no .env e nos vídeos dela, e guardando cópia de tudo o que substitui. Use quando a pessoa disser "atualizar o projeto", "pegar a versão nova do estúdio", "atualizei o plugin e o meu projeto não tem a novidade", ou depois de rodar `claude plugin update espaco-em-codigo`.
---

# Atualizar um projeto espaco-em-codigo

O plugin instala uma **cópia** do estúdio na pasta da pessoa. Quando o plugin atualiza, os projetos que já existem continuam com o motor antigo até alguém rodar isto. Aqui você leva o motor novo (e o método de roteiro novo) sem estragar o que é dela.

## Passos

1. **Confirme que está num projeto.** `pwd` e `ls -A`: tem de haver `estudio/espaco/` e um `package.json` com `"name": "espaco-em-codigo"`. Se não houver, esta não é a skill (use `novo-projeto`, numa pasta vazia).
2. **Compare as versões.**
   ```bash
   node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version"
   node -p "JSON.parse(require('fs').readFileSync('${CLAUDE_PLUGIN_ROOT}/package.json','utf8')).version"
   ```
   A primeira é a do projeto, a segunda é a do plugin. Se a do projeto for maior, o plugin está velho: diga para rodar `claude plugin update espaco-em-codigo@espaco-em-codigo` e reiniciar o Claude Code. Se forem iguais, não há o que atualizar. Se `${CLAUDE_PLUGIN_ROOT}` não vier preenchido, a pasta do plugin fica duas pastas acima da pasta desta skill.
3. **Simule e conte o plano em palavras simples:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs" --simular
   ```
   Diga quantos arquivos são novos e quantos mudam, e o que o `CHANGELOG.md` do plugin (`${CLAUDE_PLUGIN_ROOT}/CHANGELOG.md`) conta de novo nas versões entre a do projeto e a do plugin. O que a pessoa não deve perder nunca é tocado: o `perfil/`, o `.env`, o `.gitignore`, o `estudio.config.json` e **todo vídeo que já está em `estudio/espaco/projetos/`** (os dela e também os exemplos, que ela pode ter mexido).
4. **Peça o ok e rode:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/estudio/atualizar_projeto.mjs"
   ```
   O script guarda a cópia de tudo o que substitui em `.atualizacao/<de>-para-<para>/arquivos-antigos/`. Se a pessoa tinha mexido num arquivo do motor, é lá que ele está.
5. **Confira:** `npm run instalar` só se o script disser que as dependências mudaram; depois `npm run doctor` e `npm run conferir -- marca`. Se a pessoa já tem vídeos, renderize um quadro de um deles para ver que o motor novo lê o plano antigo: `npm run video -- quadros <nome> --t 1`. Se algum plano antigo apontar para algo que o motor novo não entende, o comando diz qual.
6. **Termine dizendo:** o que ficou novo (em uma ou duas frases, do CHANGELOG), que a cópia de segurança está em `.atualizacao/`, e que o Claude Code deve ser fechado e aberto de novo nesta pasta para ler a skill `video-espaco` atualizada.

## Regras

- Nunca apague nada, nem a pasta `.atualizacao/`: é a rede de segurança da pessoa.
- Se o script avisar de "Seus arquivos e projetos que eu NÃO toco" (a versão nova é diferente da dela), diga que a versão nova está em `.atualizacao/<de>-para-<para>/modelos-novos/` e ofereça comparar os dois, sem sobrescrever o dela. Um exemplo que ela não mexeu e que ficou velho pode ser trocado pela versão nova **só se ela pedir**.
- O exemplo novo que o plugin trouxe (uma pasta nova em `projetos/`) entra sozinho; avise a pessoa de que ele existe.
- Não rode `--forcar` sem a pessoa pedir.
