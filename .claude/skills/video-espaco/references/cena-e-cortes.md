# Cena, câmera e cortes

## Palco único

Monte o mundo uma vez, numa escala de diagrama, e faça todos os planos dentro dele. Exemplo da supernova v6:
- Sol no centro, raio 0,6, com órbitas no plano XZ (raios 1,6 a 9,4).
- Terra na órbita dela, raio 0,25 (aumentada).
- A Próxima a 55 unidades, raio 0,092 (0,154 do Sol, a proporção real).
- A comparação de tamanho acontece **perto da estrela** com um "Sol de comparação" que chega voando do lado do Sistema Solar, e não num lugar novo.

Escala ilustrativa sempre anotada no roteiro.

## Contexto por zoom

A pessoa precisa saber onde está antes de ver o que acontece:
1. Comece no objeto próximo: a Terra de perto, a estrela brilhando demais lá no alto.
2. Recue até o sistema (o Sol calmo no centro das órbitas).
3. Recue até a causa (a estrela pequena e longe explodindo).

O Sol **visível e calmo** no mesmo quadro da estrela que explode é o que tira a dúvida "é o Sol que explode?".

## Direção de tela

- Escolha um lado para a causa (estrela em cima à direita) e mantenha em todos os planos.
- Em close-ups da estrela, escolha a câmera de modo que o Sistema Solar fique embaixo à esquerda (busca por ângulo em `busca_camera.py`).
- Em close-ups da Terra, a estrela (fora do quadro) fica para cima e para a direita, e a onda entra de lá.
- O relatório mede o eixo "Terra → estrela" na tela em cada quadro, a partir da câmera. Salto acima de 60° num corte é alerta.

## Cortes

- **Emenda:** o plano seguinte continua o movimento da câmera. É a melhor forma de passar de um lugar do palco para outro.
- **Corte com eixo mantido:** muda tamanho ou ângulo de forma clara (mais de 30° ou mais que 1,3 vez o tamanho) e mantém o eixo.
- **Proibido:**
  - salto de eixo (a estrela troca de lado);
  - corte sem mudança (mesmo enquadramento: parece pulo);
  - corte para um lugar novo sem ponte.
- Se um plano só "passa" (voo vazio), olhe para o destino desde o começo (`voo(A, B, true)`) e mantenha a linha da distância na tela para orientar.

## Câmera calculada antes do render

- `desenho/projetar.py` reproduz a projeção da cena: quadro vertical, sensor de 24 mm na vertical e lente deslocada para o alvo cair em 43% × 40%.
- `desenho/busca_camera.py` procura posição, alvo e lente para pôr cada objeto em (x, y, raio em px). Use para o plano por cima do ombro, a vista do sistema e a vista da linha inteira, antes de qualquer quadro.
- Janela de ação no vertical: x de 4% a 86% e y de 12% a 60%. O herói cabe ali, com até 85% da largura salvo macro declarado.

## Novidade por plano

Todo plano tem `novo:`, a coisa que aparece ou muda ali, e dura de 0,9 a 1,8 s. Dois planos seguidos com a mesma novidade viram um só. Um plano que só espera ganha um acontecimento: anel que acende, pulso, contador.
