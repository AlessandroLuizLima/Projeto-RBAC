import { describe, test, expect, vi } from 'vitest'
import { lerCarrinho, resolverToken, salvarCarrinho } from './sessaoMesa'

describe('resolverToken()', () => {
  test('lê ?t= e guarda para depois que a URL for limpa', () => {
    expect(resolverToken('7', '?t=abc123')).toBe('abc123')
    expect(resolverToken('7', '')).toBe('abc123')
  })
  test('token é por mesa (mesa 8 não herda o da mesa 7)', () => {
    resolverToken('7', '?t=abc123')
    expect(resolverToken('8', '')).toBeNull()
  })
  test('sem token em lugar nenhum → null', () => expect(resolverToken('7', '')).toBeNull())
  test('sessionStorage bloqueado: ainda devolve o token da URL, sem estourar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(resolverToken('7', '?t=xyz')).toBe('xyz')
  })
})

describe('carrinho persistido', () => {
  test('salva e recupera', () => {
    salvarCarrinho('7', { 1: 2, 4: 1 })
    expect(lerCarrinho('7')).toEqual({ 1: 2, 4: 1 })
  })
  test('carrinho vazio remove a chave', () => {
    salvarCarrinho('7', { 1: 1 })
    salvarCarrinho('7', {})
    expect(sessionStorage.getItem('cafe:mesa:7:carrinho')).toBeNull()
  })
  test('é por mesa', () => {
    salvarCarrinho('7', { 1: 1 })
    expect(lerCarrinho('8')).toEqual({})
  })
  test('descarta lixo e valores fora do limite (storage adulterado)', () => {
    sessionStorage.setItem('cafe:mesa:7:carrinho', JSON.stringify({ 1: 2, abc: 1, 2: -1, 3: 999, 4: 1.5, 5: 'x' }))
    expect(lerCarrinho('7')).toEqual({ 1: 2 })
  })
  test('JSON corrompido → carrinho vazio, sem erro', () => {
    sessionStorage.setItem('cafe:mesa:7:carrinho', '{quebrado')
    expect(lerCarrinho('7')).toEqual({})
  })
})
