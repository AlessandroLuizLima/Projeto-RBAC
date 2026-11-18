// Cliente da API pública (cliente na mesa, SEM login).
// Separado de services/api.js, que cuida do painel (JWT, refresh e redirecionamento para /login).

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'

// As imagens são servidas pela raiz da API (/uploads/...), fora de /api.
export const API_ORIGIN = BASE.replace(/\/api\/?$/, '')

export function urlImagem(imagemUrl) {
  if (!imagemUrl) return null
  if (/^https?:\/\//i.test(imagemUrl)) return imagemUrl
  return `${API_ORIGIN}${imagemUrl.startsWith('/') ? '' : '/'}${imagemUrl}`
}

async function requisitar(numero, token, caminho, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(`${BASE}/publico/mesa/${encodeURIComponent(numero)}${caminho}`, {
      ...opcoes,
      headers: { 'Content-Type': 'application/json', 'x-mesa-token': token },
    })
  } catch {
    const erro = new Error('Sem conexão. Verifique o Wi-Fi e tente de novo.')
    erro.status = 0
    throw erro
  }

  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const erro = new Error(corpo?.erro || 'Algo deu errado. Tente novamente.')
    erro.status = resposta.status
    throw erro
  }
  return corpo
}

export const buscarCardapio = (numero, token) => requisitar(numero, token, '/cardapio')

export const enviarPedido = (numero, token, pedido) =>
  requisitar(numero, token, '/pedidos', { method: 'POST', body: JSON.stringify(pedido) })
