import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TITLES = {
  '/':'/dashboard','/pedidos':'/pedidos','/estoque':'/estoque','/produtos':'/produtos',
  '/relatorios':'/relatorios','/equipe':'/equipe','/roles':'/permissoes',
  '/configuracoes':'/configuracoes','/perfil':'/perfil',
}
const ROLE_COLORS = { admin:'var(--gold)', gerente:'var(--text)', barista:'var(--text2)' }

export default function Topbar() {
  const { user } = useAuth()
  const location = useLocation()
  const path = TITLES[location.pathname] || location.pathname
  const rc = ROLE_COLORS[user?.role] || 'var(--text2)'

  return (
    <header style={{ height:'var(--topbar-h)', borderBottom:'1px solid var(--border)', background:'var(--bg1)', display:'flex', alignItems:'center', paddingInline:'28px', gap:'16px', flexShrink:0 }}>
      <span style={{ flex:1, fontSize:'13px', fontFamily:'var(--mono)', color:'var(--text3)', letterSpacing:'0.02em' }}>
        cafe-grao<span style={{ color:'var(--gold)' }}>{path}</span>
      </span>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ padding:'3px 10px', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'20px', fontSize:'11px', fontFamily:'var(--mono)', color:rc }}>
          {user?.cargo}
        </span>
      </div>
    </header>
  )
}