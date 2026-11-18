// ─── Base config ─────────────────────────────────────────────────────────────
// Sem VITE_API_URL, usa /api no mesmo endereço do site (o Vite repassa ao back-end).
const BASE = import.meta.env.VITE_API_URL || '/api'

const getToken = () => localStorage.getItem('cafe_token')
const setToken = (t) => localStorage.setItem('cafe_token', t)
export const clearTokens = () => {
  localStorage.removeItem('cafe_token')
  localStorage.removeItem('cafe_user')
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
// O back-end responde erros como { erro: '...' } e não tem refresh token:
// com o token vencido (401), limpa a sessão e volta para o login.
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('Sem conexão com o servidor.')
  }

  if (res.status === 401 && path !== '/auth/login') {
    clearTokens()
    window.location.href = '/login'
    return new Promise(() => {}) // a página vai recarregar
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.erro || body?.error || `HTTP ${res.status}`)
  return body
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  // Devolve { token, usuario: { id, nome, email, role } }
  async login(email, senha) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setToken(data.token)
    return data.usuario
  },

  logout() {
    clearTokens()
  },

  perfil() {
    return apiFetch('/auth/perfil')
  },
}

// ─── Mesas (QR code) ──────────────────────────────────────────────────────────
export const mesasApi = {
  listar: ()       => apiFetch('/mesas'),
  criar:  (numero) => apiFetch('/mesas', { method: 'POST', body: JSON.stringify({ numero }) }),
}

// ─── Usuários ─────────────────────────────────────────────────────────────────
export const usuariosApi = {
  listar: (params = {}) => apiFetch('/usuarios?' + new URLSearchParams(params)),
  buscar: (id)          => apiFetch(`/usuarios/${id}`),
  criar:  (body)        => apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remover:   (id)       => apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────
export const pedidosApi = {
  listar: (params = {}) => apiFetch('/pedidos?' + new URLSearchParams(params)),
  buscar: (id)          => apiFetch(`/pedidos/${id}`),
  criar:  (body)        => apiFetch('/pedidos', { method: 'POST', body: JSON.stringify(body) }),
  atualizarStatus: (id, status) =>
    apiFetch(`/pedidos/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  marcarPago: (id) =>
    apiFetch(`/pedidos/${id}/pago`, { method: 'PATCH' }),
}

// ─── Estoque ──────────────────────────────────────────────────────────────────
export const estoqueApi = {
  listar: (params = {}) => apiFetch('/estoque?' + new URLSearchParams(params)),
  buscar: (id)          => apiFetch(`/estoque/${id}`),
  criar:  (body)        => apiFetch('/estoque', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => apiFetch(`/estoque/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  ajustar: (id, delta, motivo) =>
    apiFetch(`/estoque/${id}/ajuste`, { method: 'PATCH', body: JSON.stringify({ delta, motivo }) }),
  remover: (id) => apiFetch(`/estoque/${id}`, { method: 'DELETE' }),
}

// ─── Produtos ─────────────────────────────────────────────────────────────────
export const produtosApi = {
  listar: (params = {}) => apiFetch('/produtos?' + new URLSearchParams(params)),
  buscar: (id)          => apiFetch(`/produtos/${id}`),
  criar:  (body)        => apiFetch('/produtos', { method: 'POST', body: JSON.stringify(body) }),
  atualizar: (id, body) => apiFetch(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remover:   (id)       => apiFetch(`/produtos/${id}`, { method: 'DELETE' }),
}

// ─── Relatórios ───────────────────────────────────────────────────────────────
export const relatoriosApi = {
  dashboard: ()            => apiFetch('/relatorios/dashboard'),
  vendas:    (periodo)     => apiFetch(`/relatorios/vendas?periodo=${periodo}`),
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
export const logsApi = {
  listar: (params = {}) => apiFetch('/logs?' + new URLSearchParams(params)),
}