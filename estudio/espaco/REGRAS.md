# Regras fixas do estúdio de espaço e ciência

Valem para todo vídeo do canal. Foram dadas pelo autor em 2026-10-25 e estão conferidas pelo render sempre que possível.
Mudança nestas regras só com quem aprova (perfil da casa).

## 0. Processo de produção (autor, 2026-10-25, depois de reprovar o v3)
Nenhum vídeo vai direto para os ativos finais. Ordem fixa, cena por cena só no fim:
1. **Planejar** a cena e a explicação juntas (o que a pessoa precisa entender, o que é novo a cada plano).
2. **Desenhar** (storyboard em formas simples, com as zonas das plataformas).
3. **Rascunho com formas simples** em 3D (`cenas/rascunho4.js`): esferas, caixas e linhas, câmera e legenda presas às falas.
4. **Posicionar** os elementos na janela de ação.
5. **Analisar**: herói visível (nada na frente), dentro da janela, nem pequeno nem grande demais; nenhum plano de mais de 1,8 s; sem plano repetido; auditoria de composição limpa (`desenho/plano_cenas.py` gera o relatório).
6. **Idealizar** a cena junto com a explicação e só então aplicar os ativos finais, uma cena por vez.
A fala é escrita como gente conversando: frases inteiras e ligadas, a legenda é pedaço da própria fala.
Hoje esses passos rodam pela cena genérica e pelo comando `npm run video` (`projetos/LEIA_O_PLANO.md`): o rascunho é `npm run video -- rascunho <nome>` e o relatório é o `CONFERENCIA.md`. Os arquivos citados acima (`rascunho4.js`, `plano_cenas.py`) são do vídeo da supernova e não vêm no kit.

## 1. Texto: quem assiste não lê
1. A voz explica, a tela mostra. Texto só quando é didático.
2. **Um elemento de texto por vez** (conferido por quadro).
3. Sem título com subtítulo, sem nota, sem explicação escrita, sem número que a voz já disse.
4. **Legenda da fala**: no topo, branca em negrito, 2 a 4 palavras por bloco, **uma palavra em dourado**.
5. Rótulo com número: nome pequeno e número grande dourado. Rótulo só com nome: nome grande.
6. Muito espaço vazio. O olho precisa saber onde olhar.

## 2. Composição: harmonia, peso e hierarquia
1. Área segura: 6% nas laterais, 7% em cima e embaixo. Texto medido entra inteiro.
2. Herói num terço do quadro; o texto vai para o lado oposto, na mesma altura em toda a cena. No formato vertical: herói no meio ou no terço de baixo, texto no topo.
3. Hierarquia: um herói (45% a 100% da altura; macro intencional pode cortar), apoio menor, fundo calmo. Nada concorre com o herói.
4. Peso visual: o que é grande, claro e saturado pesa mais; equilibrar com vazio e texto do lado oposto.
5. Entradas com lógica: da esquerda para a direita (sentido de leitura) ou de onde o plano anterior terminou; o que se move ganha espaço à frente.
6. Auditoria automática por quadro: A texto fora da área segura, B texto sobre o herói, C herói cortado, D tamanho do herói, E texto do mesmo lado. Entrega só com a auditoria limpa (macro intencional é declarado no plano).

## 2b. Zonas seguras das plataformas (Reels, Shorts, TikTok), formato 1080×1920
1. Livre de interface: topo 12% (≈230 px), base 24% (≈460 px), direita 14% (≈150 px). Nada importante nesses cantos.
2. Herói com o centro em cerca de 40% da altura (nunca abaixo de 48%); a Terra e os objetos principais ficam no terço de cima/meio.
3. Legenda na faixa de 58% a 68% da altura, centralizada, abaixo do herói e acima da zona da plataforma.
4. A auditoria usa estas margens no formato vertical; a legenda é medida e conferida em cada quadro.

## 2c. Ritmo e choque (retenção)
1. Corte médio de **cerca de 1,2 s** (planos de 0,7 a 2 s). Planos de até 3 s só para algo muito específico (uma metáfora que precisa ser lida).
2. **Choque logo no começo** (até 8 s; nos Shorts, já nos 2 primeiros): primeiro um evento forte (explosão, impacto, destruição, mudança de escala) e só depois a explicação.
3. **Camadas**: em cada plano, no mínimo fundo (estrelas e poeira), objeto principal, efeito (brilho, partículas, onda) e câmera em movimento.
4. **Dramatização honesta**: cenas de impacto que não aconteceriam na vida real são marcadas na fala ("nos filmes…") e seguidas do corte para a realidade ("na vida real…").
5. Câmera tremida só em impacto; clarão e fade só como tempero, nunca no lugar de conteúdo.

## 3. Cinema
1. Câmera nunca parada. Cada plano tem ângulo, **lente em mm** (24, 35, 50, 85), **abertura f**, foco e **curva de tempo estilo After Effects** (`suave`, `parte`, `chega`, `meio`).
2. Vários ângulos por cena: abertura, close, de cima, macro, recuo. O movimento atravessa o corte.
3. **Espaço preto**, estrelas em camadas, poeira em 3D para paralaxe, profundidade de campo, bloom, vinheta e grão leves.
4. Ritmo de cerca de 24 planos por minuto nos vídeos de explicação; planos de 1 a 3 s na abertura e no clímax.
5. Ideia criativa por bloco: cada bloco do roteiro ganha uma metáfora visual própria, nunca só a ilustração literal.

## 4. Design
1. Paleta e fontes só do `design.js` (Outfit para números e títulos, Space Grotesk para rótulos). Dourado = números e luz; branco = rótulo; lilás = apoio.
2. Sombra nunca é preta: puxa para o roxo. Luz puxa para o quente.
3. Cada camada tem cor interna e externa e linha de divisa. Texturas identificáveis (crateras, cristais, estratos), nunca blocos de baixa qualidade.
4. 3D feito em código (Three.js), sem modelo de imagem.

## 5. Roteiro
1. Português natural, falado: palavras simples, frases curtas, sem listas de fragmentos.
2. Uma pergunta-mãe no começo, respondida só no fim; perguntas menores no meio.
3. Uma ideia por plano. A história fecha: nenhuma pista solta.
4. Original sempre: de referência se tira estrutura, ritmo e estilo; o texto é nosso.

## 6. Honestidade
1. Todo número vem de fonte (lista em `roteiros/fontes_a_conferir.md`) antes de ir ao ar.
2. Escala ou distância ilustrativa precisa estar marcada no arquivo da cena e no roteiro.
3. Medidas incertas (gigantes, raios gama) entram com a ressalva.

## 7. Entrega
1. **Sempre em 1080p**, sem exceção, inclusive prévias: Short 1080×1920, vídeo longo 1920×1080, 24 fps, Short até 60 s. Nada de 720p nem de resolução reduzida nas entregas. Otimizar o render nunca baixa a resolução nem a qualidade dos shaders.
2. Voz-guia (Luciana) até a voz final; áudio normalizado a -14 LUFS, trilha baixa, poucos efeitos e só tonais, nunca chiado.
3. Arquivos prontos em `saida/entrega/`, com o roteiro e o relatório da auditoria.
4. Máquina leve: renders longos em segundo plano com `--folga`.
