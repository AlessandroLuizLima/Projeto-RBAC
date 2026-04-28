import { useState } from 'react'

const ROLES = [
  { key:'admin',   label:'Proprietário', color:'var(--gold)',  membros:1, desc:'Acesso irrestrito. Gerencia equipe, permissões, relatórios e configurações do sistema.' },
  { key:'gerente', label:'Gerente',      color:'var(--text)',  membros:1, desc:'Gestão operacional completa: pedidos, estoque, produtos, relatórios e equipe.' },
  { key:'barista', label:'Barista',      color:'var(--text2)', membros:2, desc:'Foco no atendimento: visualiza e gerencia pedidos, consulta estoque e cardápio.' },
]

const PERMS = [
  { key:'view_dashboard',    label:'Ver Dashboard',        grupo:'Geral'     },
  { key:'view_orders',       label:'Ver Pedidos',           grupo:'Pedidos'   },
  { key:'manage_orders',     label:'Gerenciar Pedidos',     grupo:'Pedidos'   },
  { key:'view_inventory',    label:'Ver Estoque',           grupo:'Estoque'   },
  { key:'manage_inventory',  label:'Gerenciar Estoque',     grupo:'Estoque'   },
  { key:'view_products',     label:'Ver Produtos',          grupo:'Produtos'  },
  { key:'manage_products',   label:'Gerenciar Produtos',    grupo:'Produtos'  },
  { key:'view_reports',      label:'Ver Relatórios',        grupo:'Relatórios'},
  { key:'manage_users',      label:'Gerenciar Equipe',      grupo:'Sistema'   },
  { key:'manage_roles',      label:'Gerenciar Permissões',  grupo:'Sistema'   },
  { key:'manage_settings',   label:'Configurações',         grupo:'Sistema'   },
  { key:'view_logs',         label:'Ver Logs',              grupo:'Sistema'   },
]

const ROLE_PERMS = {
  admin:   PERMS.map(p=>p.key),
  gerente: ['view_dashboard','view_orders','manage_orders','view_inventory','manage_inventory','view_products','manage_products','view_reports','manage_users'],
  barista: ['view_dashboard','view_orders','manage_orders','view_inventory','view_products'],
}

const grupos = [...new Set(PERMS.map(p=>p.grupo))]

export default function RolesPage() {
  const [sel, setSel] = useState(ROLES[0])

  return (
    <div className="animate-fade" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'14px', height:'calc(100vh - var(--topbar-h) - 80px)' }}>
      {/* Role list */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'11px', fontWeight:500, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)' }}>Roles do Café Grão</h3>
        </div>
        <div style={{ flex:1, padding:'8px', display:'flex', flexDirection:'column', gap:'4px' }}>
          {ROLES.map(r => (
            <button key={r.key} onClick={()=>setSel(r)}
              style={{ padding:'13px 14px', borderRadius:'var(--radius)', textAlign:'left', background:sel.key===r.key?'var(--bg3)':'transparent', border:'1px solid', borderColor:sel.key===r.key?'var(--border2)':'transparent', transition:'all 0.15s', width:'100%' }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:r.color }} />
                  <span style={{ fontSize:'14px', fontWeight:500, color:'var(--text)' }}>{r.label}</span>
                </div>
                <span style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{r.membros}×</span>
              </div>
              <div style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', paddingLeft:'16px' }}>{ROLE_PERMS[r.key].length} permissões</div>
            </button>
          ))}
        </div>
      </div>

      {/* Permissions matrix */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:sel.color }} />
            <h3 style={{ fontFamily:'var(--Mono)', fontSize:'20px', fontWeight:600 }}>{sel.label}</h3>
          </div>
          <p style={{ fontSize:'13px', color:'var(--text2)', maxWidth:'520px' }}>{sel.desc}</p>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {grupos.map(grupo => (
            <div key={grupo} style={{ marginBottom:'22px' }}>
              <h4 style={{ fontSize:'10px', fontWeight:500, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'var(--mono)', marginBottom:'9px' }}>{grupo}</h4>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {PERMS.filter(p=>p.grupo===grupo).map(perm => {
                  const has = ROLE_PERMS[sel.key].includes(perm.key)
                  return (
                    <div key={perm.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', background: has ? 'rgba(201,168,76,0.04)' : 'var(--bg2)', borderRadius:'var(--radius)', border:'1px solid', borderColor: has ? 'var(--gold-border)' : 'var(--border)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        {has
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        }
                        <span style={{ fontSize:'13px', color: has ? 'var(--text)' : 'var(--text3)', fontWeight: has ? 500 : 400 }}>{perm.label}</span>
                      </div>
                      <span style={{ fontSize:'10px', fontFamily:'var(--mono)', color:'var(--text3)' }}>{perm.key}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}