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
| GET  | `/api/publico/mesa/:numero/cardapio` | `{ mesa, produtos: [{ id, nome, descricao, preco, categoria, imagem_url, disponivel, max_quantidade }] }` — `max_quantidade` é o máximo que o cliente pode pedir do item (teto de 10; não é o estoque real). `imagem_url` é relativa (`/uploads/produtos/...`): o front deve prefixar com a origem da API. |
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

## Imagens dos produtos (upload de arquivo)

| Método | Rota | Perfis |
|---|---|---|
| POST   | `/api/produtos/:id/imagem` — `multipart/form-data`, campo **`imagem`** | proprietário, gerente |
| DELETE | `/api/produtos/:id/imagem` | proprietário, gerente |

- Aceita **JPG, PNG e WebP** de até **2 MB**. O tipo é conferido pelos bytes do arquivo (o nome e o
  `Content-Type` enviados são ignorados); **SVG é recusado** de propósito (pode carregar script).
- O arquivo é salvo com nome aleatório em `UPLOADS_DIR` (padrão `back-end/uploads`) e servido em
  `/uploads/produtos/<nome>`. A resposta traz `imagem_url` (caminho relativo).
- Trocar a imagem apaga a anterior; se algo falhar no meio, não sobra arquivo órfão.
- **Docker:** o `docker-compose` já monta o volume `uploads`. Sem volume, as imagens somem quando o container
  é recriado. **Kubernetes:** com mais de 1 réplica do back-end, cada pod teria a sua própria pasta; use um
  volume compartilhado (PVC) ou armazenamento de objetos (S3).
- Exemplo: `curl -X POST http://localhost:3000/api/produtos/1/imagem -H "Authorization: Bearer <token>" -F imagem=@cafe.jpg`

## Front-end (tela do cliente)

Rota pública `/mesa/:numero?t=<token>` (`front-end/src/pages/public/MesaPage.jsx`).
Fluxo: boas-vindas animada → cardápio (incluir/quantidade) → **Avançar** (só aparece com ≥ 1 item) →
resumo + observação → **Concluir pedido** → confirmação.

Variáveis de build do front (o Vite as embute na hora do `build`):

| Variável | Para quê | Padrão |
|---|---|---|
| `VITE_API_URL` | URL da API, ex.: `https://api.meucafe.com/api` | `http://127.0.0.1:3000/api` |
| `VITE_NOME_CAFE` | Nome na tela de boas-vindas | `Café Grão` |

O servidor web do front precisa devolver `index.html` para rotas desconhecidas (o `nginx.conf` do projeto já faz
isso). Sem isso, abrir `/mesa/7` direto, que é o que o QR code faz, dá 404.
Testes: `cd front-end && npm test`.

## QR codes e teste pelo celular

- No painel, entre como proprietário ou gerente e abra **Mesas (QR)**: cada mesa mostra o QR code
  com o link `http://<ip-do-computador>:5173/mesa/<numero>?t=<token>`, prontos para imprimir.
- Em desenvolvimento o Vite descobre sozinho o IP do computador na rede e repassa `/api` e
  `/uploads` para o back-end (`vite.config.js`). Assim o celular só precisa alcançar a porta 5173.
  O campo "Endereço do site" na página permite trocar o endereço (ex.: domínio em produção);
  `VITE_URL_PUBLICA` define o padrão no build.
- O celular precisa estar no mesmo Wi-Fi. Se não abrir, libere o Node.js no Firewall do Windows.
- Depois de concluir, o cliente toca em **Acompanhar meu pedido**: a tela consulta
  `GET /api/publico/mesa/:numero/pedidos/:id` a cada 5 s e mostra Recebido → Em preparo → Pronto →
  Entregue. A equipe muda o status em **Pedidos** no painel (que agora lê os pedidos reais da API).
