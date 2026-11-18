// Guarda o token da mesa e o carrinho no sessionStorage (vale só para a aba aberta,
// e sobrevive a um recarregamento da página, comum quando o cliente alterna de app).
import { LIMITES } from './carrinho'

const chave = (numero, nome) => `cafe:mesa:${numero}:${nome}`

function armazenamento() {
  try {
    return window.sessionStorage
  } catch {
    return null // modo privado/bloqueado: o app continua funcionando, só não persiste
  }
}

// O QR traz o token em ?t=. Guardamos para o caso de recarregar depois de a URL ser limpa.
export function resolverToken(numero, search) {
  const s = armazenamento()
  const token = new URLSearchParams(search).get('t')
  if (token) {
    try { s?.setItem(chave(numero, 'token'), token) } catch { /* ignora */ }
    return token
  }
  try { return s?.getItem(chave(numero, 'token')) || null } catch { return null }
}

export function lerCarrinho(numero) {
  try {
    const bruto = JSON.parse(armazenamento()?.getItem(chave(numero, 'carrinho')) || '{}')
    const limpo = {}
    for (const [id, q] of Object.entries(bruto)) {
      if (/^\d+$/.test(id) && Number.isInteger(q) && q > 0 && q <= LIMITES.maxQuantidadePorItem) limpo[id] = q
    }
    return limpo
  } catch {
    return {}
  }
}

export function salvarCarrinho(numero, carrinho) {
  try {
    const s = armazenamento()
    if (Object.keys(carrinho).length === 0) s?.removeItem(chave(numero, 'carrinho'))
    else s?.setItem(chave(numero, 'carrinho'), JSON.stringify(carrinho))
  } catch { /* ignora */ }
}
