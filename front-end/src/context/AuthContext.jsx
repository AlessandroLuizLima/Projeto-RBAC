import { createContext, useContext, useState } from 'react'
import { authApi, clearTokens } from '../services/api'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN:   'admin',
  GERENTE: 'gerente',
  BARISTA: 'barista',
}

// O back-end usa "proprietario"; o painel chama esse perfil de "admin".
const ROLE_DO_BACKEND = { proprietario: ROLES.ADMIN, gerente: ROLES.GERENTE, barista: ROLES.BARISTA }
const CARGOS = { [ROLES.ADMIN]: 'Proprietário', [ROLES.GERENTE]: 'Gerente', [ROLES.BARISTA]: 'Barista' }

function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes.at(-1)[0] : '')).toUpperCase() || '?'
}

// Converte o usuário da API ({ id, nome, email, role }) no formato usado pelas telas.
function paraUsuarioDoPainel(u) {
  const role = ROLE_DO_BACKEND[u.role] || ROLES.BARISTA
  return { id: u.id, name: u.nome, email: u.email, role, avatar: iniciais(u.nome), cargo: CARGOS[role] }
}

const PERMISSIONS = {
  [ROLES.ADMIN]:   [
    'view_dashboard','manage_users','manage_roles',
    'view_orders','manage_orders','manage_tables',
    'view_inventory','manage_inventory',
    'view_products','manage_products',
    'view_reports','manage_settings','view_logs',
  ],
  [ROLES.GERENTE]: [
    'view_dashboard',
    'view_orders','manage_orders','manage_tables',
    'view_inventory','manage_inventory',
    'view_products','manage_products',
    'view_reports',
  ],
  [ROLES.BARISTA]: [
    'view_dashboard',
    'view_orders','manage_orders',
    'view_inventory',
    'view_products',
  ],
}

// Só restaura a sessão se também houver token (sessões antigas do login de teste não têm).
function lerSessaoSalva() {
  try {
    const s = localStorage.getItem('cafe_user')
    if (s && localStorage.getItem('cafe_token')) return JSON.parse(s)
    clearTokens()
  } catch { /* armazenamento indisponível: começa deslogado */ }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(lerSessaoSalva)
  const loading = false // a sessão é lida de forma síncrona, já no primeiro render

  const login = async (email, password) => {
    let usuario
    try {
      usuario = await authApi.login(email, password)
    } catch (e) {
      if (/credenciais/i.test(e.message)) throw new Error('E-mail ou senha incorretos')
      throw e
    }
    const u = paraUsuarioDoPainel(usuario)
    setUser(u)
    localStorage.setItem('cafe_user', JSON.stringify(u))
    return u
  }

  const logout = () => {
    setUser(null)
    authApi.logout()
  }

  const hasPermission = (p) => !p || (user && PERMISSIONS[user.role]?.includes(p))

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, ROLES, PERMISSIONS }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}