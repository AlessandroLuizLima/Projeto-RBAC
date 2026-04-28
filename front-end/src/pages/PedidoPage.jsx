import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const STATUS_CFG = {
  pendente:   { label:'Pendente',   color:'var(--amber)', bg:'var(--amber-bg)' },
  preparo:    { label:'Em preparo', color:'var(--gold)',  bg:'var(--gold-bg)'  },
  entregue:   { label:'Entregue',   color:'var(--green)', bg:'var(--green-bg)' },
  cancelado:  { label:'Cancelado',  color:'var(--red)',   bg:'var(--red-bg)'   },
}

const INIT = [
  { id:'#0042', cliente:'Mesa 4',    itens:['Espresso Duplo'],           total:'R$ 9',  status:'entregue',  time:'14:32', pago:true  },
  { id:'#0043', cliente:'Balcão',    itens:['Latte','Croissant'],         total:'R$ 28', status:'entregue',  time:'14:38', pago:true  },
  { id:'#0044', cliente:'Mesa 2',    itens:['Cappuccino','Pão de Mel'],   total:'R$ 19', status:'preparo',   time:'14:45', pago:false },
  { id:'#0045', cliente:'Delivery',  itens:['Cold Brew x2','Bolo Cenoura'],total:'R$ 52',status:'pendente',  time:'14:50', pago:false },
  { id:'#0046', cliente:'Mesa 1',    itens:['Filtrado Ethiopia'],         total:'R$ 14', status:'pendente',  time:'14:52', pago:false },
  { id:'#0047', cliente:'Balcão',    itens:['Espresso','Água 500ml'],     total:'R$ 11', status:'cancelado', time:'14:20', pago:false },
]

const MENU = ['Espresso','Espresso Duplo','Latte','Cappuccino','Cold Brew','Filtrado Ethiopia','Filtrado Bourbon','Mocha','Água 500ml','Croissant','Pão de Mel','Bolo Cenoura','Brownie']

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
      <div className="animate-fade" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'460px', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'15px', fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ color:'var(--text3)' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:'22px' }}>{children}</div>
      </div>
    </div>
  )
}

export default function PedidosPage() {
  const { hasPermission } = useAuth()
  const [pedidos, setPedidos] = useState(INIT)
  const [filter, setFilter]   = useState('todos')
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState({ cliente:'', itens:[], status:'pendente', pago:false })
  const [itemInput, setItemInput] = useState('')

  const canEdit = hasPermission('manage_orders')

  const filtered = filter === 'todos' ? pedidos : pedidos.filter(p => p.status === filter)

  const addItem = () => {
    if (itemInput.trim()) { setForm(p=>({...p, itens:[...p.itens, itemInput.trim()]})); setItemInput('') }
  }

  const saveOrder = () => {
    if (modal === 'create') {
      const total = form.itens.length * 12
      setPedidos(p => [...p, { ...form, id:`#${String(pedidos.length+43).padStart(4,'0')}`, time: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), total:`R$ ${total}` }])
    } else {
      setPedidos(p => p.map(o => o.id === form.id ? { ...o, ...form } : o))
    }
    setModal(null)
  }

  const changeStatus = (id, status) => setPedidos(p => p.map(o => o.id === id ? { ...o, status } : o))

  const inp = { width:'100%', padding:'9px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:'13px', outline:'none' }

  return (
    <div className="animate-fade">
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        {['todos','pendente','preparo','entregue','cancelado'].map(f => {
          const cfg = STATUS_CFG[f]
          const active = filter === f
          return (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'7px 13px', borderRadius:'var(--radius)', fontSize:'12px', fontFamily:'var(--mono)', background: active ? (cfg?.bg||'var(--bg3)') : 'transparent', border:'1px solid', borderColor: active ? (cfg?.color||'var(--border2)') : 'var(--border)', color: active ? (cfg?.color||'var(--text)') : 'var(--text2)', transition:'all 0.15s', textTransform:'capitalize' }}
            >{f === 'todos' ? `todos (${pedidos.length})` : `${cfg?.label} (${pedidos.filter(p=>p.status===f).length})`}</button>
          )
        })}
        <div style={{ flex:1 }} />
        {canEdit && (
          <button onClick={()=>{ setForm({cliente:'',itens:[],status:'pendente',pago:false}); setModal('create') }}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', transition:'opacity 0.2s', boxShadow:'var(--shadow-gold)' }}
            onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo pedido
          </button>
        )}
      </div>

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
        {filtered.map(p => {
          const cfg = STATUS_CFG[p.status]
          return (
            <div key={p.id} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <span style={{ fontSize:'13px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--gold)' }}>{p.id}</span>
                <span style={{ padding:'3px 9px', background:cfg.bg, border:`1px solid ${cfg.color}44`, borderRadius:'20px', fontSize:'10px', color:cfg.color, fontFamily:'var(--mono)' }}>{cfg.label}</span>
              </div>
              <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'6px' }}>{p.cliente}</div>
              <div style={{ fontSize:'12px', color:'var(--text2)', marginBottom:'12px' }}>{p.itens.join(', ')}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:'18px', fontWeight:600, color:'var(--gold2)' }}>{p.total}</span>
                <span style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{p.time} · {p.pago ? '✓ pago' : 'pendente'}</span>
              </div>
              {canEdit && p.status !== 'entregue' && p.status !== 'cancelado' && (
                <div style={{ display:'flex', gap:'6px', marginTop:'12px', paddingTop:'12px', borderTop:'1px solid var(--border)' }}>
                  {p.status === 'pendente' && (
                    <button onClick={()=>changeStatus(p.id,'preparo')}
                      style={{ flex:1, padding:'7px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--gold)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,0.2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='var(--gold-bg)'}
                    >→ Preparo</button>
                  )}
                  {p.status === 'preparo' && (
                    <button onClick={()=>changeStatus(p.id,'entregue')}
                      style={{ flex:1, padding:'7px', background:'var(--green-bg)', border:'1px solid rgba(122,184,122,0.3)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--green)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                    >✓ Entregar</button>
                  )}
                  <button onClick={()=>changeStatus(p.id,'cancelado')}
                    style={{ padding:'7px 10px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text3)'}}
                  >Cancelar</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:'13px' }}>nenhum pedido encontrado</div>
      )}

      {/* Create Modal */}
      {modal === 'create' && (
        <Modal title="Novo Pedido" onClose={()=>setModal(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', color:'var(--text3)', marginBottom:'6px', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Cliente / Mesa</label>
              <input value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))} style={inp} placeholder="Ex: Mesa 3, Balcão, Delivery..."
                onFocus={e=>e.target.style.borderColor='var(--gold)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', color:'var(--text3)', marginBottom:'6px', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Itens do pedido</label>
              <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                <select value={itemInput} onChange={e=>setItemInput(e.target.value)} style={{ ...inp, flex:1 }}>
                  <option value="">Selecionar item...</option>
                  {MENU.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={addItem} style={{ padding:'9px 14px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px' }}>+</button>
              </div>
              {form.itens.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {form.itens.map((item,i) => (
                    <span key={i} style={{ padding:'3px 10px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'12px', color:'var(--text2)', display:'flex', alignItems:'center', gap:'6px' }}>
                      {item}
                      <button onClick={()=>setForm(p=>({...p,itens:p.itens.filter((_,j)=>j!==i)}))} style={{ color:'var(--text3)', lineHeight:1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'4px' }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text2)', fontSize:'13px', fontWeight:500 }}>Cancelar</button>
              <button onClick={saveOrder} disabled={!form.cliente||!form.itens.length}
                style={{ padding:'9px 16px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', opacity:(!form.cliente||!form.itens.length)?0.5:1 }}>
                Criar pedido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}