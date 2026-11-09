# Pedido por mesa (QR code) — contrato da API

Fluxo: o cliente lê o QR da mesa → o front abre `/mesa/7?t=<token>` → o front chama a API
pública enviando o token no header `x-mesa-token` → o pedido aparece no painel (`GET /api/pedidos`)
com `mesa`, `origem = 'mesa'` e `atendente = null`.

O QR code deve conter a URL do **front**: `https://<dominio>/mesa/<numero>?t=<token>`.
Número e token vêm de `GET /api/mesas` (área interna).

## Rotas públicas (sem login)

Todas exigem `x-mesa-token: <token da mesa>` (ou `?t=`). Mesa inexistente, inativa e token
errado respondem igual (`401`), para não revelar quais mesas existem.

| Método | Rota | Resposta |
|---|---|---|
| GET  | `/api/publico/mesa/:numero/cardapio` | `{ mesa, produtos: [{ id, nome, descricao, preco, categoria, imagem_url, disponivel }] }` |
| POST | `/api/publico/mesa/:numero/pedidos` | `201 { id, mesa, status, total }` |
| GET  | `/api/publico/mesa/:numero/pedidos/:id` | `{ id, status, total, observacao, itens: [...] }` — só pedidos **da própria mesa** |

`POST` body: `{ "itens": [{ "produto_id": 1, "quantidade": 2 }], "observacao": "Sem açúcar" }`

- O **preço nunca é aceito do cliente**: é lido do banco.
- Limites: até 20 itens diferentes, 10 unidades por item, observação até 200 caracteres.
- Erros: `400` dados inválidos/produto indisponível · `401` mesa/token · `409` sem estoque
  (cardápio desatualizado: o front deve recarregar) · `429` limite de pedidos da mesa.

## Rotas internas (com login)

| Método | Rota | Perfis |
|---|---|---|
| GET  | `/api/mesas` | proprietário, gerente |
| POST | `/api/mesas` `{ "numero": 12 }` | proprietário |

## Limites (rate limit)

- Por **mesa**: 10 pedidos a cada 10 min (`PUBLICO_LIMITE_PEDIDOS_MESA`).
- Por **IP**: 300 req/min (`PUBLICO_LIMITE_IP_POR_MIN`). É folgado de propósito: numa cafeteria todos
  os clientes saem pelo mesmo IP do Wi-Fi.
- Atrás de proxy/ingress (Kubernetes), defina `TRUST_PROXY=1` para o limite enxergar o IP real.

## Banco

Tabela nova `mesas`; colunas novas `produtos.imagem_url`, `pedidos.mesa_id`, `pedidos.origem`.
As migrações são idempotentes e rodam no `initDB()`. Em bancos antigos com produtos duplicados
(seed antigo), rode uma vez `back-end/scripts/limpar-duplicatas.sql`.
