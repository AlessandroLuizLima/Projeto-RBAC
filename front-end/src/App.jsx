import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout       from './components/layout/AppLayout'
import LoginPage       from './pages/LoginPage'
import Dashboard       from './pages/Dashboard'
import PedidosPage     from './pages/PedidoPage'
import EstoquePage     from './pages/EstoquePage'
import ProdutosPage    from './pages/ProdutosPage'
import RelatoriosPage  from './pages/RelatoriosPage'
import EquipePage      from './pages/EquipePage'
import RolesPage       from './pages/RolesPage'
import ConfigPage      from './pages/ConfigPage'
import PerfilPage      from './pages/PerfilPage'
import NaoAutorizado   from './pages/NaoAutorizado'

function Guard({ children, perm }) {
  const { user, loading, hasPermission } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',gap:'12px',color:'var(--text2)',fontFamily:'var(--mono)',fontSize:'13px'}}>
      <div style={{width:'16px',height:'16px',border:'2px solid var(--gold)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      Carregando...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (perm && !hasPermission(perm)) return <Navigate to="/nao-autorizado" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/nao-autorizado" element={<NaoAutorizado />} />
      <Route path="/" element={<Guard><AppLayout /></Guard>}>
        <Route index               element={<Guard perm="view_dashboard">  <Dashboard      /></Guard>} />
        <Route path="pedidos"      element={<Guard perm="view_orders">      <PedidosPage    /></Guard>} />
        <Route path="estoque"      element={<Guard perm="view_inventory">   <EstoquePage    /></Guard>} />
        <Route path="produtos"     element={<Guard perm="view_products">    <ProdutosPage   /></Guard>} />
        <Route path="relatorios"   element={<Guard perm="view_reports">     <RelatoriosPage /></Guard>} />
        <Route path="equipe"       element={<Guard perm="manage_users">     <EquipePage     /></Guard>} />
        <Route path="roles"        element={<Guard perm="manage_roles">     <RolesPage      /></Guard>} />
        <Route path="configuracoes"element={<Guard perm="manage_settings">  <ConfigPage     /></Guard>} />
        <Route path="perfil"       element={<Guard>                         <PerfilPage     /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}