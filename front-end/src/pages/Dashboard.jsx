import { useAuth } from '../context/AuthContext'

const GREET = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard() {
  const { user } = useAuth()
  const cards = [
    { label:'Pedidos hoje',      value:'18',     sub:'↑ 3 vs ontem',  color:'var(--gold)',  icon:'🧾' },
    { label:'Faturamento do dia',value:'R$ 547', sub:'↑ 12% vs média',color:'var(--green)', icon:'💰' },
    { label:'Itens em estoque',  value:'34',     sub:'2 com alerta',  color:'var(--amber)', icon:'📦' },
    { label:'Ticket médio',      value:'R$ 30',  sub:'por pedido',    color:'var(--text2)', icon:'🎯' },
  ]
  const recentOrders = [
    { id:'#0042', item:'Espresso Duplo',      valor:'R$ 9',  status:'entregue', time:'14:32' },
    { id:'#0041', item:'Latte + Pão de Mel',  valor:'R$ 22', status:'entregue', time:'14:18' },
    { id:'#0040', item:'Cappuccino',           valor:'R$ 12', status:'entregue', time:'13:55' },
    { id:'#0039', item:'Cold Brew Especial',   valor:'R$ 16', status:'entregue', time:'13:40' },
    { id:'#0038', item:'Filtrado Ethiopia',    valor:'R$ 14', status:'entregue', time:'13:22' },
  ]
  const lowStock = [
    { produto:'Café Ethiopia (250g)',    qt:3,  min:5,  cor:'var(--red)' },
    { produto:'Leite integral (1L)',     qt:4,  min:10, cor:'var(--red)' },
    { produto:'Grão Bourbon (500g)',     qt:6,  min:5,  cor:'var(--amber)' },
  ]

  const HOURLY = [4,7,12,19,24,18,14,9,6]
  const LABELS = ['9h','10h','11h','12h','13h','14h','15h','16h','17h']
  const MAX    = Math.max(...HOURLY)

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontFamily:'var(--mono)', fontSize:'28px', fontWeight:'lighter', letterSpacing:'-0.3px', color:'var(--text)' }}>
          {GREET()}, {user?.name?.split(' ')[0]}
        </h2>
        <p style={{ fontSize:'13px', color:'var(--text3)', marginTop:'3px', fontFamily:'var(--mono)' }}>
          {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})} &nbsp;·&nbsp; Café Grão
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
        {cards.map(({ label, value, sub, color, icon }, i) => (
          <div key={label} className={`stagger-${i+1}`}
            style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', position:'relative', overflow:'hidden', animation:'fadeUp 0.4s ease both', animationDelay:`${i*0.07}s` }}>
            <div style={{ position:'absolute', top:0, right:0, bottom:0, width:'3px', background:color, opacity:0.7 }} />
            <div style={{ fontSize:'20px', marginBottom:'10px' }}>{icon}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'30px', fontWeight:500, color, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)', marginTop:'6px' }}>{label}</div>
            <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'2px', fontFamily:'var(--mono)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
        {/* Hourly bar */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
            <div>
              <h3 style={{ fontSize:'14px', fontWeight:500 }}>Pedidos por hora</h3>
              <p style={{ fontSize:'12px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px' }}>hoje</p>
            </div>
            <span style={{ padding:'3px 10px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'20px', fontSize:'11px', color:'var(--gold)', fontFamily:'var(--mono)' }}>113 total</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', height:'110px' }}>
            {HOURLY.map((v, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontSize:'10px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{v}</span>
                <div style={{ width:'100%', borderRadius:'4px 4px 2px 2px', background:`linear-gradient(180deg, var(--gold2) 0%, var(--gold) 100%)`, height:`${(v/MAX)*100}%`, minHeight:'4px', opacity:0.85 }} />
                <span style={{ fontSize:'9px', color:'var(--text3)' }}>{LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alert */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:500 }}>Alerta de estoque</h3>
            <span style={{ fontSize:'11px', color:'var(--red)', fontFamily:'var(--mono)' }}>{lowStock.filter(i=>i.qt<i.min).length} críticos</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {lowStock.map(item => (
              <div key={item.produto}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                  <span style={{ fontSize:'12px', color:'var(--text)', fontWeight:500 }}>{item.produto}</span>
                  <span style={{ fontSize:'12px', color:item.cor, fontFamily:'var(--mono)', fontWeight:600 }}>{item.qt}</span>
                </div>
                <div style={{ height:'4px', background:'var(--bg3)', borderRadius:'2px' }}>
                  <div style={{ height:'100%', width:`${Math.min((item.qt/item.min)*100,100)}%`, background:item.cor, borderRadius:'2px', transition:'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize:'10px', color:'var(--text3)', marginTop:'3px', fontFamily:'var(--mono)' }}>mín. {item.min} unid.</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:'14px', fontWeight:500 }}>Últimos pedidos</h3>
          <span style={{ fontSize:'12px', color:'var(--text3)', fontFamily:'var(--mono)' }}>hoje</span>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <tbody>
            {recentOrders.map((o, i) => (
              <tr key={o.id} style={{ borderBottom: i<recentOrders.length-1 ? '1px solid var(--border)' : 'none', transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <td style={{ padding:'12px 20px', fontSize:'12px', fontFamily:'var(--mono)', color:'var(--text3)', width:'70px' }}>{o.id}</td>
                <td style={{ padding:'12px 8px', fontSize:'13px', fontWeight:500, color:'var(--text)' }}>{o.item}</td>
                <td style={{ padding:'12px 8px', fontSize:'13px', color:'var(--gold)', fontFamily:'var(--mono)', fontWeight:500 }}>{o.valor}</td>
                <td style={{ padding:'12px 8px' }}>
                  <span style={{ padding:'2px 8px', background:'var(--green-bg)', border:'1px solid rgba(122,184,122,0.25)', borderRadius:'20px', fontSize:'10px', color:'var(--green)', fontFamily:'var(--mono)' }}>✓ {o.status}</span>
                </td>
                <td style={{ padding:'12px 20px', fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', textAlign:'right' }}>{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}