// ─── Base config ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api'

const getToken = () => localStorage.getItem('cafe_token')
const setToken = (t) => localStorage.setItem('cafe_token', t)
const setRefreshToken = (t) => localStorage.setItem('cafe_refresh', t)
const getRefreshToken = () => localStorage.getItem('cafe_refresh')
const clearTokens = () => {
  localStorage.removeItem('cafe_token')
  localStorage.removeItem('cafe_refresh')
  localStorage.removeItem('cafe_user')
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Token expired — try refresh once
  if (res.status === 401 && path !== '/auth/login') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`
      res = await fetch(`${BASE}${path}`, { ...options, headers })
    } else {
      clearTokens()
      window.location.href = '/login'
      return
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

async function tryRefresh() {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
    if (!res.ok) return false
    const { accessToken, refreshToken } = await res.json()
    setToken(accessToken)
    setRefreshToken(refreshToken)
    return true
  } catch {
    return false
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  async login(email, senha) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    localStorage.setItem('cafe_user', JSON.stringify(data.user))
    return data.user
  },

  async logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
    clearTokens()
  },

  async me() {
    return apiFetch('/auth/me')
  },

  getStoredUser() {
    const s = localStorage.getItem('cafe_user')
    return s ? JSON.parse(s) : null
  },
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
    apiFetch(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
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