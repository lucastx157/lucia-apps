# Modelo de catálogo — LucIA Apps

Base usada no catálogo do Antônio Carlos (Seu Consultor de Casa). Serve para qualquer vendedor que
mande fotos de produtos e queira receber pedidos pelo WhatsApp.

## O que o modelo já tem
- Abertura de cinema (faixas pretas, nome com brilho, feixes de luz), preto e branco com degradê.
- Letreiro com os nomes das mercadorias passando, com botão de pausar.
- 4 destaques em tela cheia com animação: `towel` (bolhas e fios), `sheet` (tecido balançando, tema claro),
  `sound` (ondas sonoras e equalizador), `beam` (feixe de projetor).
- História do vendedor com foto.
- Catálogo por categorias, busca, cards com foto, vídeo ao tocar quando houver.
- Carrinho com nome, bairro, forma de pagamento e observação; o pedido chega organizado no WhatsApp.
- Botão redondo do WhatsApp fixo, condições de compra, QR Code e botões de compartilhar no final.
- Sem preços (só se o cliente pedir).

## Como fazer um cliente novo
1. Crie uma pasta com o nome do cliente (ex.: `maria-utilidades/`) com:
   - `img/` com as fotos (e `vid/` se houver vídeos);
   - `produtos.json`: lista de `{"id", "nome", "cat", "img"}` (e `"vid"` opcional);
   - `config.json`: copie `antonio-carlos/config.json` e troque nome, WhatsApp, história, categorias e os 4 destaques.
2. Rode `python3 modelo-catalogo/build.py maria-utilidades`.
3. Publique a pasta na Vercel (Root Directory = a pasta do cliente) com um endereço próprio.

## Regras
- Não inventar nome, preço nem informação de produto: só o que aparece na foto ou o que o cliente passar.
- Nomes dos produtos tirados do que está escrito na foto ou no catálogo do fornecedor.
- O texto da condição de devolução deve respeitar o Código de Defesa do Consumidor (compra fora da loja tem 7 dias para desistência).
