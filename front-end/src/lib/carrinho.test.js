import { describe, test, expect } from 'vitest'
import {
  alterar, emCentavos, formatarCentavos, linhas, LIMITES, montarPedido,
  quantidadeTotal, reconciliar, totalCentavos,
} from './carrinho'

const produtos = [
  { id: 1, nome: 'Espresso', preco: '5.00', disponivel: true, max_quantidade: 10 },
  { id: 2, nome: 'Cappuccino', preco: '9.00', disponivel: true, max_quantidade: 3 },
  { id: 3, nome: 'Bolo', preco: '7.50', disponivel: false, max_quantidade: 0 },
]

describe('dinheiro', () => {
  test('converte preço em texto para centavos sem erro de ponto flutuante', () => {
    expect(emCentavos('9.00')).toBe(900)
    expect(emCentavos('0.10') * 3).toBe(30) // em reais, 0.1 * 3 daria 0.30000000000000004
    expect(emCentavos('19.99')).toBe(1999)
  })
  test('formata em reais', () => {
    expect(formatarCentavos(2300).replace(/\s/g, ' ')).toBe('R$ 23,00')
  })
})

describe('alterar()', () => {
  test('inclui com +1 e soma', () => {
    let c = alterar({}, 1, 1, produtos[0])
    c = alterar(c, 1, 1, produtos[0])
    expect(c).toEqual({ 1: 2 })
  })
  test('chegar a zero remove o item do carrinho', () => {
    expect(alterar({ 1: 1 }, 1, -1, produtos[0])).toEqual({})
  })
  test('diminuir item que não existe não altera nada (mesma referência)', () => {
    const c = { 2: 1 }
    expect(alterar(c, 1, -1, produtos[0])).toBe(c)
  })
  test('respeita o max_quantidade do produto (estoque)', () => {
    let c = {}
    for (let i = 0; i < 8; i++) c = alterar(c, 2, 1, produtos[1])
    expect(c).toEqual({ 2: 3 })
  })
  test('nunca passa do limite por item, mesmo sem produto informado', () => {
    let c = {}
    for (let i = 0; i < 30; i++) c = alterar(c, 1, 1)
    expect(c[1]).toBe(LIMITES.maxQuantidadePorItem)
  })
  test('não adiciona o 21º item diferente', () => {
    const cheio = Object.fromEntries(Array.from({ length: LIMITES.maxItensDistintos }, (_, i) => [i + 1, 1]))
    expect(alterar(cheio, 999, 1)).toBe(cheio)
    expect(alterar(cheio, 1, 1)[1]).toBe(2) // mas aumentar um que já existe pode
  })
  test('é imutável: não altera o objeto original', () => {
    const original = { 1: 1 }
    alterar(original, 1, 1, produtos[0])
    expect(original).toEqual({ 1: 1 })
  })
  test('produto indisponível (max 0) não entra', () => {
    expect(alterar({}, 3, 1, produtos[2])).toEqual({})
  })
})

describe('totais e linhas', () => {
  const carrinho = { 1: 1, 2: 2 }
  test('quantidade total', () => expect(quantidadeTotal(carrinho)).toBe(3))
  test('total em centavos: 5,00 + 2 × 9,00 = 23,00', () => expect(totalCentavos(carrinho, produtos)).toBe(2300))
  test('linhas seguem a ordem do cardápio e trazem subtotal', () => {
    const l = linhas({ 2: 2, 1: 1 }, produtos)
    expect(l.map((x) => [x.produto.id, x.quantidade, x.subtotal])).toEqual([[1, 1, 500], [2, 2, 1800]])
  })
  test('ignora itens que não estão no cardápio', () => {
    expect(linhas({ 99: 2 }, produtos)).toEqual([])
    expect(totalCentavos({ 99: 2 }, produtos)).toBe(0)
  })
})

describe('reconciliar()', () => {
  test('remove item esgotado e avisa o nome', () => {
    const r = reconciliar({ 1: 1, 3: 2 }, produtos)
    expect(r.carrinho).toEqual({ 1: 1 })
    expect(r.removidos).toEqual(['Bolo'])
  })
  test('remove item que sumiu do cardápio', () => {
    const r = reconciliar({ 99: 1 }, produtos)
    expect(r.carrinho).toEqual({})
    expect(r.removidos).toEqual(['Um item'])
  })
  test('reduz quantidade acima do novo máximo', () => {
    const r = reconciliar({ 2: 9 }, produtos)
    expect(r.carrinho).toEqual({ 2: 3 })
    expect(r.ajustados).toEqual(['Cappuccino'])
  })
  test('carrinho válido passa intacto', () => {
    const r = reconciliar({ 1: 2, 2: 1 }, produtos)
    expect(r.carrinho).toEqual({ 1: 2, 2: 1 })
    expect(r.removidos).toEqual([])
  })
})

describe('montarPedido()', () => {
  test('monta itens numéricos e NÃO envia preço nem total', () => {
    const p = montarPedido({ 1: 1, 2: 2 }, '')
    expect(p).toEqual({ itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 2, quantidade: 2 }] })
    expect(JSON.stringify(p)).not.toMatch(/preco|total/)
  })
  test('inclui a observação com trim; vazia é omitida', () => {
    expect(montarPedido({ 1: 1 }, '  Café sem açúcar ').observacao).toBe('Café sem açúcar')
    expect('observacao' in montarPedido({ 1: 1 }, '   ')).toBe(false)
  })
})
