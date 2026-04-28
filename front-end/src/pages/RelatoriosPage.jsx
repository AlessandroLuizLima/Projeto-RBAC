const SEMANA = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const VENDAS  = [87, 102, 94, 118, 143, 167, 76]
const RECEITA = [621, 728, 671, 842, 1019, 1194, 543]
const VMAX = Math.max(...VENDAS), RMAX = Math.max(...RECEITA)

const TOP = [
  { nome:'Latte',             qt:84,  receita:'R$ 1.176', pct:18 },
  { nome:'Espresso Duplo',    qt:76,  receita:'R$ 684',   pct:16 },
  { nome:'Cold Brew Especial',qt:61,  receita:'R$ 976',   pct:13 },
  { nome:'Cappuccino',        qt:58,  receita:'R$ 696',   pct:12 },
  { nome:'Filtrado Ethiopia', qt:47,  receita:'R$ 658',   pct:10 },
]

export default function RelatoriosPage() {
  const totalVendas   = VENDAS.reduce((a,b)=>a+b,0)
  const totalReceita  = RECEITA.reduce((a,b)=>a+b,0)
  const ticketMedio   = Math.round(totalReceita / totalVendas)

  return (
    <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
        {[
          { label:'Vendas na semana',  value:totalVendas,           suffix:'',    color:'var(--gold)'  },
          { label:'Receita semana',    value:`R$ ${totalReceita.toLocaleString('pt-BR')}`, suffix:'', color:'var(--green)' },
          { label:'Ticket médio',      value:`R$ ${ticketMedio}`,   suffix:'',    color:'var(--amber)' },
          { label:'Melhor dia',        value:'Sábado',              suffix:'167 vendas', color:'var(--text)' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px 20px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'26px', fontWeight:500, color, lineHeight:1, marginBottom:'6px' }}>{value}</div>
            <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)' }}>{label}</div>
            {suffix && <div style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px' }}>{suffix}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        {/* Vendas chart */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
            <div>
              <h3 style={{ fontSize:'14px', fontWeight:500 }}>Pedidos por dia</h3>
              <p style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px' }}>esta semana</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'120px' }}>
            {VENDAS.map((v,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontSize:'10px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{v}</span>
                <div style={{ width:'100%', background:`linear-gradient(180deg, var(--gold2) 0%, var(--gold) 100%)`, borderRadius:'4px 4px 2px 2px', height:`${(v/VMAX)*100}%`, minHeight:'4px', opacity: i===5?1:0.7 }} />
                <span style={{ fontSize:'10px', color: i===5 ? 'var(--gold)' : 'var(--text3)', fontWeight: i===5 ? 600 : 400 }}>{SEMANA[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Receita chart */}
        <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
            <div>
              <h3 style={{ fontSize:'14px', fontWeight:500 }}>Receita por dia</h3>
              <p style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', marginTop:'2px' }}>em R$</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', height:'120px' }}>
            {RECEITA.map((v,i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', height:'100%', justifyContent:'flex-end' }}>
                <span style={{ fontSize:'9px', color:'var(--text3)', fontFamily:'var(--mono)' }}>R${v}</span>
                <div style={{ width:'100%', background:`linear-gradient(180deg, var(--green) 0%, rgba(122,184,122,0.5) 100%)`, borderRadius:'4px 4px 2px 2px', height:`${(v/RMAX)*100}%`, minHeight:'4px', opacity: i===5?1:0.7 }} />
                <span style={{ fontSize:'10px', color: i===5 ? 'var(--green)' : 'var(--text3)', fontWeight: i===5 ? 600 : 400 }}>{SEMANA[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:'14px', fontWeight:500 }}>Top produtos da semana</h3>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Produto','Vendas','Receita','% do total'].map(h=>(
                <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:'10px', color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP.map((t,i)=>(
              <tr key={t.nome} style={{ borderBottom: i<TOP.length-1?'1px solid var(--border)':'none', transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <td style={{ padding:'13px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'11px', color:'var(--text3)', minWidth:'18px' }}>#{i+1}</span>
                    <span style={{ fontSize:'13px', fontWeight:500 }}>{t.nome}</span>
                  </div>
                </td>
                <td style={{ padding:'13px 20px', fontSize:'13px', fontFamily:'var(--mono)', color:'var(--text2)' }}>{t.qt}</td>
                <td style={{ padding:'13px 20px', fontSize:'13px', fontFamily:'var(--mono)', color:'var(--gold)', fontWeight:500 }}>{t.receita}</td>
                <td style={{ padding:'13px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ flex:1, height:'4px', background:'var(--bg3)', borderRadius:'2px', maxWidth:'80px' }}>
                      <div style={{ height:'100%', width:`${t.pct/20*100}%`, background:'var(--gold)', borderRadius:'2px' }}/>
                    </div>
                    <span style={{ fontSize:'12px', color:'var(--text2)', fontFamily:'var(--mono)' }}>{t.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}