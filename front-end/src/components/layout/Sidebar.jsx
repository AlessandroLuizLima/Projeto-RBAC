import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Icon = ({ d, size=17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const NAV = [
  { to:'/',              label:'Dashboard',  perm:'view_dashboard',  icon:['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10'] },
  { to:'/pedidos',       label:'Pedidos',    perm:'view_orders',     icon:['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2','M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z'] },
  { to:'/estoque',       label:'Estoque',    perm:'view_inventory',  icon:['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'] },
  { to:'/produtos',      label:'Produtos',   perm:'view_products',   icon:['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'] },
  { to:'/relatorios',    label:'Relatórios', perm:'view_reports',    icon:['M18 20V10','M12 20V4','M6 20v-6'] },
  { to:'/equipe',        label:'Equipe',     perm:'manage_users',    icon:['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'], circle:'9 7 4' },
  { to:'/roles',         label:'Permissões', perm:'manage_roles',    icon:['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'] },
  { to:'/configuracoes', label:'Config.',    perm:'manage_settings', icon:['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'] },
]

const ROLE_INFO = {
  admin:   { label:'Proprietário', color:'var(--gold)' },
  gerente: { label:'Gerente',      color:'var(--text)' },
  barista: { label:'Barista',      color:'var(--text2)' },
}

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const ri = ROLE_INFO[user?.role] || { label:'', color:'var(--text2)' }
  const visible = NAV.filter(n => hasPermission(n.perm))

  return (
    <aside style={{ width:'var(--sidebar-w)', flexShrink:0, background:'var(--bg1)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Brand */}
      <div style={{ padding:'20px 20px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'36px', height:'36px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>☕</div>
        <div>
          <div style={{ fontFamily:'var(--mono)', fontSize:'17px', fontWeight:500, color:'var(--gold2)', letterSpacing:'-0.2px', lineHeight:1 }}>Café Grão</div>
          <div style={{ fontSize:'10px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px', letterSpacing:'0.08em' }}>ADMIN PANEL</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:'1px', overflowY:'auto' }}>
        {visible.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to==='/'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'10px',
              padding:'9px 11px', borderRadius:'var(--radius)',
              fontSize:'13.5px', fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--gold2)' : 'var(--text2)',
              background: isActive ? 'var(--gold-bg)' : 'transparent',
              borderLeft: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
              transition:'all 0.15s',
            })}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('gold')) e.currentTarget.style.background='var(--bg2)' }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('gold')) e.currentTarget.style.background='transparent' }}
          >
            {Array.isArray(item.icon)
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon.map((p,i)=><path key={i} d={p}/>)}
                  {item.circle && <circle cx={item.circle.split(' ')[0]} cy={item.circle.split(' ')[1]} r={item.circle.split(' ')[2]}/>}
                </svg>
              : null
            }
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'10px' }}>
        <button onClick={()=>navigate('/perfil')}
          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', borderRadius:'var(--radius)', width:'100%', textAlign:'left', transition:'background 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'var(--bg3)', border:`1px solid ${ri.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, color:ri.color, flexShrink:0 }}>{user?.avatar}</div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name?.split(' ')[0]}</div>
            <div style={{ fontSize:'11px', color:ri.color, fontFamily:'var(--mono)' }}>{ri.label}</div>
          </div>
        </button>
        <button onClick={logout}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 11px', borderRadius:'var(--radius)', width:'100%', textAlign:'left', color:'var(--text3)', fontSize:'12px', transition:'all 0.15s', marginTop:'2px' }}
          onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.background='var(--red-bg)'}}
          onMouseLeave={e=>{e.currentTarget.style.color='var(--text3)';e.currentTarget.style.background='transparent'}}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>
  )
}