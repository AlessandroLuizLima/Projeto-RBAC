import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const ROLE_CFG  = { admin:{label:'Proprietário',color:'var(--gold)'}, gerente:{label:'Gerente',color:'var(--text)'}, barista:{label:'Barista',color:'var(--text2)'} }
const ROLE_PERMS = {
  admin:   ['view_dashboard','view_orders','manage_orders','view_inventory','manage_inventory','view_products','manage_products','view_reports','manage_users','manage_roles','manage_settings','view_logs'],
  gerente: ['view_dashboard','view_orders','manage_orders','view_inventory','manage_inventory','view_products','manage_products','view_reports','manage_users'],
  barista: ['view_dashboard','view_orders','manage_orders','view_inventory','view_products'],
}
const PERM_LABELS = {
  view_dashboard:'Ver Dashboard', view_orders:'Ver Pedidos', manage_orders:'Gerenciar Pedidos',
  view_inventory:'Ver Estoque', manage_inventory:'Gerenciar Estoque', view_products:'Ver Produtos',
  manage_products:'Gerenciar Produtos', view_reports:'Ver Relatórios', manage_users:'Gerenciar Equipe',
  manage_roles:'Gerenciar Permissões', manage_settings:'Configurações', view_logs:'Ver Logs',
}

export default function PerfilPage() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [nome, setNome]   = useState(user?.name || '')
  const rc = ROLE_CFG[user?.role] || { label:'', color:'var(--text2)' }
  const perms = ROLE_PERMS[user?.role] || []

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000) }
  const inp = { width:'100%', padding:'9px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:'13px', outline:'none', transition:'border-color 0.2s' }

  return (
    <div className="animate-fade" style={{ maxWidth:'600px', display:'flex', flexDirection:'column', gap:'14px' }}>
      {/* Profile header */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'26px', display:'flex', alignItems:'center', gap:'20px' }}>
        <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'var(--bg3)', border:`1.5px solid ${rc.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:700, color:rc.color, flexShrink:0 }}>{user?.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--serif)', fontSize:'22px', fontWeight:600, letterSpacing:'-0.2px' }}>{user?.name}</div>
          <div style={{ fontSize:'13px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px' }}>{user?.email}</div>
          <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
            <span style={{ padding:'3px 10px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'20px', fontSize:'11px', color:rc.color, fontFamily:'var(--mono)' }}>{rc.label}</span>
            <span style={{ padding:'3px 10px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{user?.cargo}</span>
          </div>
        </div>
      </div>

      {/* Edit */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
        <h3 style={{ fontSize:'11px', fontWeight:500, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)', marginBottom:'16px' }}>Informações pessoais</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--text3)', marginBottom:'5px', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Nome</label>
            <input value={nome} onChange={e=>setNome(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--text3)', marginBottom:'5px', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>E-mail</label>
            <input value={user?.email||''} disabled style={{ ...inp, opacity:0.45, cursor:'not-allowed' }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', justifyContent:'flex-end', marginTop:'4px' }}>
            {saved && <span style={{ fontSize:'12px', color:'var(--green)', fontFamily:'var(--mono)' }}>✓ salvo</span>}
            <button onClick={save} style={{ padding:'9px 18px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', boxShadow:'var(--shadow-gold)', transition:'opacity 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>Salvar</button>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
        <h3 style={{ fontSize:'11px', fontWeight:500, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)', marginBottom:'14px' }}>
          Minhas permissões
          <span style={{ color:rc.color, marginLeft:'8px', fontStyle:'normal' }}>— {rc.label}</span>
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:'7px' }}>
          {perms.map(p => (
            <div key={p} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 11px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'var(--radius)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize:'12px', color:'var(--text)', fontWeight:400 }}>{PERM_LABELS[p]||p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div style={{ background:'var(--bg1)', border:'1px solid rgba(217,112,112,0.2)', borderRadius:'var(--radius-lg)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:'13px', fontWeight:500 }}>Encerrar sessão</div>
          <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'2px' }}>Você voltará para a tela de login</div>
        </div>
        <button onClick={logout}
          style={{ padding:'8px 18px', background:'var(--red-bg)', border:'1px solid rgba(217,112,112,0.25)', borderRadius:'var(--radius)', color:'var(--red)', fontWeight:500, fontSize:'13px', transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--red)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(217,112,112,0.25)'}
        >Sair</button>
      </div>
    </div>
  )
}