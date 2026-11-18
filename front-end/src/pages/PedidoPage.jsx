import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { pedidosApi } from '../services/api'

// Pedidos reais (GET /api/pedidos). Os pedidos feitos pelo QR code da mesa aparecem aqui,
// e cada mudança de status é o que o cliente vê na tela "Acompanhar meu pedido".
const STATUS_CFG = {
  pendente:   { label:'Pendente',   color:'var(--amber)', bg:'var(--amber-bg)' },
  em_preparo: { label:'Em preparo', color:'var(--gold)',  bg:'var(--gold-bg)'  },
  pronto:     { label:'Pronto',     color:'var(--blue, #6fa8dc)', bg:'rgba(111,168,220,0.12)' },
  entregue:   { label:'Entregue',   color:'var(--green)', bg:'var(--green-bg)' },
  cancelado:  { label:'Cancelado',  color:'var(--red)',   bg:'var(--red-bg)'   },
}

// Próximo passo de cada status (botão principal do card).
const PROXIMO = {
  pendente:   { status:'em_preparo', label:'→ Iniciar preparo' },
  em_preparo: { status:'pronto',     label:'✓ Marcar pronto' },
  pronto:     { status:'entregue',   label:'✓ Entregue na mesa' },
}

const ATUALIZAR_MS = 5000
const brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' })
const horaDe = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })

export default function PedidosPage() {
  const { user, hasPermission } = useAuth()
  const [pedidos, setPedidos] = useState(null)
  const [erro, setErro]       = useState('')
  const [filter, setFilter]   = useState('todos')
  const [salvando, setSalvando] = useState(null)

  const canEdit = hasPermission('manage_orders')
  const podeCancelar = canEdit && user?.role !== 'barista'

  const carregar = useCallback(async () => {
    try {
      setPedidos(await pedidosApi.listar())
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }, [])

  // Atualiza sozinho para os pedidos novos das mesas aparecerem sem recarregar.
  useEffect(() => {
    carregar()
    const t = setInterval(carregar, ATUALIZAR_MS)
    return () => clearInterval(t)
  }, [carregar])

  const changeStatus = async (id, status) => {
    setSalvando(id)
    try {
      await pedidosApi.atualizarStatus(id, status)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(null)
    }
  }

  const lista = pedidos || []
  const filtered = filter === 'todos' ? lista : lista.filter(p => p.status === filter)

  return (
    <div className="animate-fade">
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        {['todos', ...Object.keys(STATUS_CFG)].map(f => {
          const cfg = STATUS_CFG[f]
          const active = filter === f
          return (
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:'7px 13px', borderRadius:'var(--radius)', fontSize:'12px', fontFamily:'var(--mono)', background: active ? (cfg?.bg||'var(--bg3)') : 'transparent', border:'1px solid', borderColor: active ? (cfg?.color||'var(--border2)') : 'var(--border)', color: active ? (cfg?.color||'var(--text)') : 'var(--text2)', transition:'all 0.15s' }}
            >{f === 'todos' ? `todos (${lista.length})` : `${cfg.label} (${lista.filter(p=>p.status===f).length})`}</button>
          )
        })}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}>atualiza a cada {ATUALIZAR_MS / 1000}s</span>
      </div>

      {erro && <p role="alert" style={{ color:'var(--red)', fontSize:'13px', marginBottom:'14px' }}>{erro}</p>}
      {pedidos === null && !erro && <p style={{ color:'var(--text2)', fontSize:'13px' }}>Carregando pedidos...</p>}

      {/* Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
        {filtered.map(p => {
          const cfg = STATUS_CFG[p.status] || STATUS_CFG.pendente
          const prox = PROXIMO[p.status]
          const itens = (p.itens || []).filter(i => i.produto_nome)
          const ocupado = salvando === p.id
          return (
            <div key={p.id} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <span style={{ fontSize:'13px', fontFamily:'var(--mono)', fontWeight:600, color:'var(--gold)' }}>#{String(p.id).padStart(4,'0')}</span>
                <span style={{ padding:'3px 9px', background:cfg.bg, border:`1px solid ${cfg.color}`, borderRadius:'20px', fontSize:'10px', color:cfg.color, fontFamily:'var(--mono)' }}>{cfg.label}</span>
              </div>
              <div style={{ fontSize:'13px', fontWeight:500, marginBottom:'6px' }}>
                {p.mesa ? `Mesa ${p.mesa}` : 'Balcão'}
                {p.origem === 'mesa' && <span style={{ marginLeft:'8px', fontSize:'10px', color:'var(--text3)', fontFamily:'var(--mono)' }}>via QR code</span>}
              </div>
              <div style={{ fontSize:'12px', color:'var(--text2)', marginBottom: p.observacao ? '6px' : '12px' }}>
                {itens.map(i => `${i.quantidade}× ${i.produto_nome}`).join(', ') || 'sem itens'}
              </div>
              {p.observacao && <div style={{ fontSize:'12px', color:'var(--amber)', marginBottom:'12px' }}>Obs.: {p.observacao}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:'18px', fontWeight:600, color:'var(--gold2)' }}>{brl.format(Number(p.total))}</span>
                <span style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{horaDe(p.created_at)}</span>
              </div>
              {canEdit && (prox || (podeCancelar && p.status !== 'entregue' && p.status !== 'cancelado')) && (
                <div style={{ display:'flex', gap:'6px', marginTop:'12px', paddingTop:'12px', borderTop:'1px solid var(--border)' }}>
                  {prox && (
                    <button onClick={()=>changeStatus(p.id, prox.status)} disabled={ocupado}
                      style={{ flex:1, padding:'7px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--gold)', fontFamily:'var(--mono)', opacity: ocupado ? .5 : 1 }}
                    >{prox.label}</button>
                  )}
                  {podeCancelar && p.status !== 'entregue' && p.status !== 'cancelado' && (
                    <button onClick={()=>changeStatus(p.id,'cancelado')} disabled={ocupado}
                      style={{ padding:'7px 10px', background:'transparent', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text3)'}}
                    >Cancelar</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {pedidos && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:'13px' }}>nenhum pedido encontrado</div>
      )}
    </div>
  )
}
