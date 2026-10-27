# Novidades por versão

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
