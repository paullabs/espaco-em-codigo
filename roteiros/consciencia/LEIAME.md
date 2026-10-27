# Consciência de roteiro

O que o estúdio sabe sobre escrever roteiros que seguram a atenção, tirado de vídeos de muita audiência e dos nossos episódios. É escrita para virar skill, mas só depois que um vídeo feito com ela for postado e tiver bons resultados (regra do autor, 19/10/2026): `00_PRINCIPIOS.md` é o núcleo, os demais arquivos são as referências, `parametros.json` são os limites medidos e `../ferramentas/conferir_roteiro.py` confere um roteiro contra eles.

| Arquivo | O que tem |
|---|---|
| `00_PRINCIPIOS.md` | As 17 leis, com prova e jeito de conferir, e a ordem de leitura |
| `01_estrutura.md` | O esqueleto em sete movimentos e o molde de blocos para o longo e o Short |
| `02_abertura.md` | Os primeiros 30 s das cinco referências e as regras da abertura |
| `03_ritmo_e_pausas.md` | Os números de fala e silêncio, onde caem as pausas longas, doses por linha |
| `04_fala_e_imagem.md` | O que mostrar enquanto se fala; número como objeto; planos sem fala |
| `05_reacoes_e_dialogo.md` | Quem reage, quando, com que fala e quanto silêncio |
| `06_som.md` | Como a música respira com o texto; quedas, golpes e o silêncio do clímax |
| `07_linha_dramatica.md` | A linha dramática (tensão) e a crítica do autor a um primeiro roteiro |
| `08_linha_leve.md` | A linha leve (humor) e a fórmula "What If" |
| `09_verificacao.md` | O que conferir antes de aprovar: o medido e o lido |
| `parametros.json` | Os limites usados pelo `conferir_roteiro.py`, por linha e formato |

**Como cresce:** cada vídeo novo vira um estudo em `../estudos/`; o que ele trouxer de novo (uma lei, uma exceção, um número) entra aqui com a prova (código e minuto). Se um número mudar, muda no texto e no `parametros.json` juntos.

**Marcas usadas:** **(medido)** saiu de script sobre o áudio, os quadros ou a legenda; **(visto)** foi conferido nas folhas de quadros; **(inferência)** é hipótese a testar nas nossas cenas.


## Neste plugin (espaco-em-codigo)

Aqui vem o **método** de escrever um roteiro que segura a atenção. As frases literais dos vídeos de referência foram trocadas por `[frase]`; ficam os números, os tempos (`RV02 5:29` é o vídeo e o minuto, na pasta de referências de quem montou o método) e as regras. Não vêm: o `conferir_roteiro.py` e os moldes de história com personagens (`ROTEIRO.md`, `roteiro.schema.json`), que são de outro formato de vídeo; a pasta `../estudos/`, as análises dos vídeos de referência (`referencias/`) e os roteiros das outras linhas. Onde um arquivo daqui citar uma dessas coisas, leia como contexto.

No vídeo de espaço, o roteiro tem outro formato (`roteiro.json` com falas e pedaços; veja `estudio/espaco/projetos/LEIA_O_PLANO.md`) e a conferência é a do `npm run video -- conferir`. Os limites medidos de `parametros.json` continuam valendo como referência de ritmo e de pausa.
