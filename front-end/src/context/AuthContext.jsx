import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const ROLES = {
  ADMIN:   'admin',
  GERENTE: 'gerente',
  BARISTA: 'barista',
}

const MOCK_USERS = [
  { id:1, name:'Rafael Moura',   email:'dono@cafegrao.com',    password:'123456', role:ROLES.ADMIN,   avatar:'RM', cargo:'Proprietário',   since:'2022-03-01' },
  { id:2, name:'Camila Torres',  email:'gerente@cafegrao.com', password:'123456', role:ROLES.GERENTE, avatar:'CT', cargo:'Gerente',         since:'2022-05-10' },
  { id:3, name:'Lucas Ferreira', email:'barista@cafegrao.com', password:'123456', role:ROLES.BARISTA, avatar:'LF', cargo:'Barista',         since:'2023-01-15' },
]

const PERMISSIONS = {
  [ROLES.ADMIN]:   [
    'view_dashboard','manage_users','manage_roles',
    'view_orders','manage_orders',
    'view_inventory','manage_inventory',
    'view_products','manage_products',
    'view_reports','manage_settings','view_logs',
  ],
  [ROLES.GERENTE]: [
    'view_dashboard',
    'view_orders','manage_orders',
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

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('cafe_user')
    if (s) setUser(JSON.parse(s))
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    await new Promise(r => setTimeout(r, 700))
    const found = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('E-mail ou senha incorretos')
    const { password: _, ...safe } = found
    setUser(safe)
    localStorage.setItem('cafe_user', JSON.stringify(safe))
    return safe
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cafe_user')
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