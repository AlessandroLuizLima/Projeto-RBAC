// Lógica pura do carrinho (sem React), para ser fácil de testar.
// O carrinho é um objeto { [produtoId]: quantidade }.
// Os limites espelham os do back-end (publicoController.js).

export const LIMITES = Object.freeze({
  maxQuantidadePorItem: 10,
  maxItensDistintos: 20,
  maxObservacao: 200,
})

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// O preço chega como texto ("9.00"). Trabalhamos em centavos para não ter erro de ponto flutuante.
export const emCentavos = (preco) => Math.round(Number(preco) * 100)
export const formatarCentavos = (centavos) => formatador.format(centavos / 100)

function maximoDo(produto) {
  const m = produto && Number.isInteger(produto.max_quantidade) ? produto.max_quantidade : LIMITES.maxQuantidadePorItem
  return Math.min(m, LIMITES.maxQuantidadePorItem)
}

// Soma (ou subtrai) quantidade de um produto, respeitando os limites.
// `produto` é opcional: quando informado, o teto é o `max_quantidade` dele.
export function alterar(carrinho, produtoId, delta, produto) {
  const atual = carrinho[produtoId] || 0
  const maximo = maximoDo(produto)
  const nova = Math.min(atual + delta, maximo)

  if (nova <= 0) {
    if (!(produtoId in carrinho)) return carrinho
    const { [produtoId]: _removido, ...resto } = carrinho
    return resto
  }
  if (atual === 0 && Object.keys(carrinho).length >= LIMITES.maxItensDistintos) return carrinho
  if (nova === atual) return carrinho
  return { ...carrinho, [produtoId]: nova }
}

export const quantidadeTotal = (carrinho) => Object.values(carrinho).reduce((soma, q) => soma + q, 0)

// Linhas do carrinho na ordem do cardápio; ignora o que não está no cardápio.
export function linhas(carrinho, produtos) {
  return produtos
    .filter((p) => carrinho[p.id] > 0)
    .map((p) => ({
      produto: p,
      quantidade: carrinho[p.id],
      subtotal: emCentavos(p.preco) * carrinho[p.id],
    }))
}

export const totalCentavos = (carrinho, produtos) =>
  linhas(carrinho, produtos).reduce((soma, l) => soma + l.subtotal, 0)

// Depois de recarregar o cardápio: tira o que sumiu ou esgotou e ajusta quantidades
// acima do novo máximo. Devolve também o que foi removido/ajustado, para avisar o cliente.
export function reconciliar(carrinho, produtos) {
  const porId = new Map(produtos.map((p) => [String(p.id), p]))
  const novo = {}
  const removidos = []
  const ajustados = []

  for (const [id, quantidade] of Object.entries(carrinho)) {
    const produto = porId.get(id)
    if (!produto || !produto.disponivel) {
      removidos.push(produto ? produto.nome : 'Um item')
      continue
    }
    const maximo = maximoDo(produto)
    if (quantidade > maximo) {
      novo[id] = maximo
      ajustados.push(produto.nome)
    } else {
      novo[id] = quantidade
    }
  }
  return { carrinho: novo, removidos, ajustados }
}

// Corpo do POST /publico/mesa/:n/pedidos. O preço NÃO vai: o servidor usa o do banco.
export function montarPedido(carrinho, observacao) {
  const itens = Object.entries(carrinho).map(([id, quantidade]) => ({ produto_id: Number(id), quantidade }))
  const texto = (observacao || '').trim()
  return texto ? { itens, observacao: texto } : { itens }
}
