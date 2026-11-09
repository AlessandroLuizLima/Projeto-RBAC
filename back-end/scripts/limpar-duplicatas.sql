-- Limpa produtos e estoque duplicados pelo seed antigo (que rodava a cada
-- reinício do servidor). Rode UMA vez, em bancos que já existiam antes da correção:
--
--   psql -U postgres -d cafe_grao_db -f back-end/scripts/limpar-duplicatas.sql
--
-- Regras de segurança:
--  * mantém sempre o registro de MENOR id;
--  * só remove produto repetido que NUNCA foi vendido (sem itens_pedido);
--  * tudo dentro de uma transação.
BEGIN;

DELETE FROM produtos p
USING produtos mantido
WHERE p.nome = mantido.nome
  AND p.categoria = mantido.categoria
  AND p.preco = mantido.preco
  AND p.id > mantido.id
  AND NOT EXISTS (SELECT 1 FROM itens_pedido ip WHERE ip.produto_id = p.id);

DELETE FROM estoque e
USING estoque mantido
WHERE e.produto_id = mantido.produto_id
  AND e.id > mantido.id;

COMMIT;
