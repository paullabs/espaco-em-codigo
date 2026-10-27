# Tudo o que foi feito (v1 a v11) e como começar o próximo vídeo já no nível do v11

Registro pedido pelo autor em 2026-10-25, depois que o v10 foi aprovado ("ficou bom"): guardar todas as alterações para os próximos vídeos de espaço começarem **neste nível**, sem refazer o caminho. Os arquivos citados ficam em `estudio/espaco/` (menos onde indicado). O v11 é o v10 refinado (mesma fala, mesmos tempos), e a voz final entra depois dele.

## 1. Linha do tempo: o que o autor disse, o que mudou, onde está no código

| Versão | Retorno do autor | O que mudou | Onde |
|---|---|---|---|
| ativos | "amador", fonte ruim, poluído de texto | Sol, Terra e buraco negro em corte; regra de um texto por vez | `design.js`, `corpos.js`, `ui.js` |
| ativos 2 | faltava câmera, lente, foco, ângulos | câmera em mm, curvas de After Effects, foco | `camera.js`, `pos.js` |
| v1, v2 | margens, Terra baixa, sem choque, cortes lentos | zonas seguras (12% topo, 24% base, 14% direita), choque no início, corte ~1,2 s | `REGRAS.md`, `composicao.js` |
| v3 | "nada novo aos 6 s, planeta escondido aos 21 s, frases não humanas" | **portões**: planejar, desenhar, rascunho com formas simples, posicionar, analisar, idealizar; só depois ativo final | `REGRAS.md` regra 0, `desenho/` |
| v4 | "confuso, não dá para entender nada" | cortar metáforas (laranja, ervilha, torre); mostrar a estrela, a Terra e a explosão | roteiro |
| v5 | "bem melhor; cortes desconexos; efeito da onda; mostrar o Sistema Solar" | um palco só, zoom da Terra ao Sistema Solar e à estrela, passagem da onda pela Terra | `cenas/rascunho5.js` |
| v6 | "ficou bom, só refinar ângulos, mostrar a camada de ozônio, texturas, poucas cores, legenda por último e palavra por palavra" | mundo único, frase → imagem medida, projeção de câmera antes de renderizar | `desenho/projetar.py`, `busca_camera.py`, `plano_cenas.py` |
| v7 | "faltam ganchos e uma pergunta de escolha" | ativos finais, corte transversal do ozônio, legenda por palavra, 24 qps | `cenas/supernova7.js`, `ui.legendaPalavras` |
| v8 | (ver v9) | 3 ganchos, grade de oito caixas de Sol, pergunta vermelha ou azul | `cenas/supernova8.js`, `audio/mix_v8.py` |
| v9 | "copie minha pergunta; enquadramento (o zoom cortava o Sol); legenda feia, uma palavra, menor, com balanço; colisão ruim" | pergunta dos 4 anos, **legenda de uma palavra**, explosões novas, oito Sóis que caem, enquadramento medido | `cenas/supernova9.js`, `ui.legendaPalavra`, `explosao.js` (paletas), `pos.js` (clarão radial), `plano_cenas.py` (checagens) |
| v10 | "ficou bom, mas a pergunta podia ser mais objetiva; não fale que a Terra fica bem; nunca um vídeo pode parecer que acabou" | pergunta de 5 s, sem frase de calma, sem fade, ponto de luz girando; 58,9 s | `cenas/supernova10.js`, `desenho/gerar_shots10.py`, `audio/mix_v10.py` |
| v11 | "refinar animações, texturas, presença dos modelos e design" | ver seção 3 | `cenas/supernova11.js`, `corpos.js`, `planeta.js`, `fundo.js`, `pos.js` |

## 2. Regras que o autor cobrou (consolidadas)

**Processo.** Planejar a cena e a explicação → desenhar → rascunho com formas simples → posicionar → analisar → idealizar a cena junto com a explicação → só então aplicar os ativos finais, cena por cena. Nada de renderizar caro "à toa".

**Roteiro.**
- Fala de gente (frases inteiras e ligadas, palavras simples). "O que está sendo dito tem de estar sendo visto": cada pedaço de fala tem `|objeto` no `linhas.py`, e o relatório mede quanto da fala o objeto aparece na tela.
- Uma pergunta-mãe no começo, perguntas menores no meio (ganchos a cada ~10 a 12 s, cada um com a resposta mais adiante), e a última pergunta **nunca** fecha.
- **Nunca um vídeo pode parecer que acabou:** sem frase de calma ("a Terra fica tranquila" saiu), sem resumo, sem fade para preto, sem acorde que resolve; o último quadro segue em movimento e parece o primeiro.
- Pergunta final **curta e objetiva**, direto depois da resposta: "E se a estrela explodisse hoje? O que você faria nos próximos quatro anos?" (5 s).
- Nomeie certo ("a mais próxima do Sol"); honestidade (o perigo real é dito; escala ilustrativa anotada; fatos em `fontes_a_conferir.md`).

**Imagem.**
- Um texto por vez; quem assiste não lê. Legenda = **uma palavra por vez**, no centro (x 46,5%, y 64%), pequena, com pop (80% → 108% → 100% em 0,2 s), troca seca, some suave na pausa. Entra por último e a imagem entra ~0,4 s antes.
- Tudo o que a fala pede para ver aparece **inteiro e centrado** (nada cortado pela borda, nada sobreposto sem querer, a câmera nunca atravessa um corpo). Formações cabem no quadro vertical em elipse.
- Poucas cores, cada uma com papel (ouro: Sol e distância; vermelho: estrela e perigo; azul/verde: Terra; ciano: ozônio; branco-quente: ondas; laranja: versão de filme; azul-branco: explosão de verdade e a grandona). Planetas que não importam em cinza-lilás.
- Impacto tem de ser **visto**: quem bate encosta, solta clarão e anel, e o alvo sacode e acende. Explosão tem núcleo, anel duplo, fagulhas, tremor de câmera. Clarão de tela cheia nasce no lugar do impacto.
- Movimento de motion design: tudo que entra usa pop com ressalto ou aceleração, em fila; nada liga e desliga de uma vez; câmera com curvas e respiração.
- Entrega sempre em 1080×1920, 24 qps, −14 LUFS; voz-guia Luciana até a voz final; só efeitos tonais e poucos.

## 3. O nível do v11 (o que foi acrescentado no refino)

Tudo isto é **opcional por parâmetro** nos módulos compartilhados (os vídeos antigos não mudam) e está **ligado** em `cenas/supernova11.js`.

1. **Presença dos modelos** (`criarCorpo(chave, { presenca: true, luz, halo })`): borda de luz mais viva, textura fina (ondas no oceano, grão na terra e nas rochas), faixa quente de entardecer na Terra, atmosfera 30% mais forte, e para as estrelas **coroa viva** (raios finos girando em sentidos opostos, cor por tipo de estrela) e **risco de lente** horizontal nas estrelas M e B.
2. **Nuvens de verdade:** cobertura 53,5% com borda suave (`criarNuvens({ cobertura, suavidade })`). **Defeito antigo corrigido:** a luz de cinema (`setLuz`) escrevia no uniforme `uLuz` de tudo, inclusive na COR das nuvens, e as pintava de verde-neon. Agora ela pula a camada de nuvens (`!u.uCob`).
3. **Poeira espacial** (`fundo.js`, `criarPoeiraEspacial`): 520 grãos em rede periódica em volta da câmera; dá paralaxe, profundidade e velocidade; some nos planos de palco (grade, corte).
4. **Borrão de movimento da câmera** (`pos.js`, passe `MB`): usa a profundidade e a câmera de 1 quadro antes (mesmo plano) para dar um obturador de 180°; máximo de 4% da tela; desligado no primeiro quadro de cada plano.
5. **Gradação de cor** (`lente.grade = 1`): sombras frias, luzes quentes, curva em S suave, +7% de cor, halo quente no brilho.
6. **Animações:** rolagem leve da câmera (±0,34°), legenda que sobe um fio enquanto a palavra está na tela, **cauda de cometa** atrás do ponto de luz do anel, **marcas dos quatro anos** nas divisões do anel, **trilhas de luz** nos Sóis que caem, explosões que esfriam mais depressa (a bola de fogo mostra textura dentro do plano).
7. **Céu:** 2300 + 380 estrelas (antes 1500 + 240).

## 4. Biblioteca do estúdio (o que existe agora)

| Módulo | O que oferece |
|---|---|
| `corpos.js` | `criarCorpo(chave, { luz, halo, presenca })`: Sol (estrelaG), Terra, Lua, Próxima (estrelaM), grandona (estrelaB), planetas |
| `explosao.js` | `criarExplosao({ tom, n, semente, paleta })` com `PALETA_AZUL`, `PALETA_FOGO_FORTE` (núcleo sólido, calor, ganho, anel duplo) |
| `estilhaco.js` | Terra em brasa e quebrando (o exagero de filme) |
| `pos.js` | bloom, vinheta, grão, **clarão radial** (`flashC`, `flashR`, `flashCor`), **borrão de movimento** (`lente.mb`), **gradação** (`lente.grade`) |
| `ui.js` | `legendaPalavra` (uma palavra, pop), `legendaPalavras` (versões antigas) |
| `fundo.js` | `criarEstrelas`, `criarNebulosa`, `criarPoeiraEspacial`, `texturaHalo` |
| `linhas.js` | linhas grossas (`linhaGorda`; **sempre o mesmo número de pontos ao redesenhar**), círculos, marcadores de tamanho fixo na tela |
| `composicao.js` | auditoria por quadro (texto na área segura, herói cortado, tamanho do herói) |
| `render.mjs` | `--video`, `--fps`, `--ana` (medidas por quadro), `--t0` (render parcial), `--folga` |
| `desenho/gerar_shots10.py` | lista de planos presa às falas (muda a voz, os cortes seguem) |
| `desenho/plano_cenas.py` | relatório: frase → imagem, faixa da legenda, continuidade de cortes, herói cortado, objetos inteiros, sobreposição, câmera encostando |
| `audio/mix_v10.py` | pad tonal, efeitos tonais presos à fala, voz, −14 LUFS; sem fade final |
| `roteiros/<hist>/linhas.py` | voz-guia e tempos palavra por palavra (prefixos sintetizados), mapa frase → imagem |

## 5. Armadilhas aprendidas (para não repetir)

- **Linha grossa (`Line2`) que muda de tamanho por quadro:** o Three fixa o máximo de segmentos no primeiro desenho. Redesenhar com 2 pontos e depois com 41 deixa só 1 segmento. Use sempre o mesmo número de pontos. O erro só aparece no vídeo em sequência; quadros avulsos saem certos, então confira também quadros do vídeo final.
- **Câmera atravessando um corpo** (voo da Terra para a estrela passando pela Terra) gera quadro preto: use corte seco.
- **Uniforme com o mesmo nome em materiais diferentes** (`uLuz` luz vs cor das nuvens): a função que "ajusta a luz de todos" pintou as nuvens de verde.
- **Nome repetido no módulo** (`cauda` já existia): o erro derruba a página inteira; rode um quadro de teste antes do render.
- **Explosão com fogo aditivo** vira disco chapado branco ou marrom se o calor for alto e o núcleo for sólido demais: use calor 0,42, ganho 0,9 e dure ~1,7 s dentro do plano.
- **Clarão de tela cheia** vira véu cinza: radial, curto (≤ 0,35 s) e com a cor da explosão.
- **Alertas a 6 qps** de "corte sem mudança" ou "pouco tempo na tela" em falas de 0,2 s são ruído da amostragem; o juiz é o relatório do render a 24 qps.
- **Encurtar a fala de baixo para cima:** quase tudo é preso a `linhas.json`; reescreva o roteiro, rode `linhas.py` e `gerar_shots`, e confira que o começo não mudou (render de um quadro dos dois lados dá PSNR infinito) antes de reaproveitar o começo do vídeo anterior.

## 6. Como renderizar mais rápido sem perder qualidade

1. **Render parcial:** `node render.mjs ... --t0 <segundo de um keyframe do vídeo anterior> --video parte.mp4`; cortar o começo antigo com `ffmpeg -i antigo.mp4 -frames:v N -c copy head.mp4` (N = t0 × 24), juntar com `ffmpeg -f concat -safe 0 -i lista.txt -c copy novo.mp4` e só então juntar o áudio. Serve para trocar só o fim.
2. **Análise a 6 qps em 540×960** antes de qualquer render final (3 minutos): pega enquadramento, sobreposição e câmera encostando. O render final a 24 qps em 1080×1920 leva ~25 minutos.
3. **Quadros de teste** (`--t 1.2,5,9 --w 540 --h 960`) a cada mudança de efeito; comparar o plano novo com o antigo lado a lado.

## 7. Começar um vídeo novo já neste nível (checklist)

1. Pergunta-mãe + corrente de perguntas + **última pergunta curta que nunca fecha**; fala de gente; `ver` em cada pedaço (`linhas.py`).
2. Storyboard e rascunho em formas simples (portões); só depois copiar `modelos/cena_supernova11.js` (modelo da cena final), `modelos/gerar_shots10.py` e `modelos/mix_v10.py`.
3. Ligar o refino do v11 desde o começo: `presenca: true`, poeira, borrão, gradação.
4. Registrar cada coisa por nome (`registrar(nome, centro, raio, marcado, inteiro)`), rodar a análise a 6 qps, zerar os alertas.
5. Render final, relatório, storyboard, folha de 1 quadro por segundo.
6. Só então: voz final (veja abaixo) e `gerar_shots` de novo com os tempos reais.

## 8. Próximo passo: a voz

A voz-guia (Luciana, macOS `say`) é só marcação. A voz final sai da ElevenLabs, na conta de quem aprova, baixando **só pelo Histórico** (os botões do player geraram tomadas extras pagas). Depois: alinhar palavra por palavra com Whisper, gravar em `linhas.json`, rodar `gerar_shots10.py` (os cortes seguem a fala), render parcial ou total, mix com a voz nova e conferir a duração (≈ 60 s). Confirmar com o autor antes: voz escolhida, créditos e quantas tomadas.
