# espaco-em-codigo

Estúdio de **vídeos curtos de espaço e ciência em código**: Shorts e Reels 9:16 com planetas, estrelas, órbitas, explosões e marés em 3D (Three.js), câmera de cinema, legenda de uma palavra por vez, voz e mixagem. Você escreve o que é dito e o que aparece; o estúdio prende cada imagem à palavra que fala dela, confere quadro a quadro se a frase mostrou o que disse e entrega o MP4 em 1080×1920.

## Comece

Pelo plugin do Claude Code (não precisa clonar):

```bash
claude plugin marketplace add paullabs/espaco-em-codigo
claude plugin install espaco-em-codigo@espaco-em-codigo
```

Numa pasta nova, abra o Claude Code e peça `/espaco-em-codigo:novo-projeto`. Ele copia o estúdio para a pasta, instala as dependências, confere o computador e renderiza o exemplo "E se a Lua sumisse?". Depois peça o seu vídeo, ou use `/espaco-em-codigo:novo-video`.

Quando o plugin atualizar, `/espaco-em-codigo:atualizar-projeto` leva a versão nova para o projeto que você já criou, sem tocar nos seus vídeos ([CHANGELOG.md](CHANGELOG.md)).

Ou clone o repositório e siga o [LEIAME.md](LEIAME.md): requisitos, primeiro uso, comandos, voz com a sua chave e o que não vem.

## Licença

Licença própria (arquivo [LICENSE](LICENSE)): uso livre, inclusive comercial, com uma condição: todo vídeo publicado leva a marca d'água fraca do canal do Titular. Não é permitido vender o estúdio como produto, curso ou template. Os componentes de terceiros seguem as licenças deles ([LICENCAS_TERCEIROS.md](LICENCAS_TERCEIROS.md)).
