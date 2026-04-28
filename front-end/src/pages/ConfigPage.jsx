import { useState } from 'react'

export default function ConfigPage() {
  const [saved, setSaved] = useState(false)
  const [cfg, setCfg] = useState({
    nomeEstabelecimento: 'Café Grão',
    endereco: 'R. das Flores, 42 — Centro',
    telefone: '(41) 99999-0000',
    horarioAbertura: '08:00',
    horarioFechamento: '19:00',
    alertaEstoqueEmail: true,
    notifNovoPedido: false,
    sessionTimeout: '60',
    permitirAutoRegistro: false,
    backupAutomatico: true,
  })

  const set = (k, v) => setCfg(p=>({...p,[k]:v}))
  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2500) }

  const inp = { width:'100%', padding:'9px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:'13px', outline:'none', transition:'border-color 0.2s' }

  const Toggle = ({ val, onChange }) => (
    <button onClick={()=>onChange(!val)} style={{ width:'42px', height:'23px', borderRadius:'12px', background:val?'var(--gold)':'var(--bg3)', border:'1px solid', borderColor:val?'var(--gold)':'var(--border)', transition:'all 0.2s', position:'relative', flexShrink:0 }}>
      <span style={{ position:'absolute', top:'2px', left:val?'21px':'2px', width:'17px', height:'17px', borderRadius:'50%', background: val ? '#0c0c0c' : 'var(--text3)', transition:'left 0.2s' }}/>
    </button>
  )

  const Section = ({ title, children }) => (
    <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden', marginBottom:'14px' }}>
      <div style={{ padding:'13px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <h3 style={{ fontSize:'11px', fontWeight:500, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)' }}>{title}</h3>
      </div>
      <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:'15px' }}>{children}</div>
    </div>
  )

  const Row = ({ label, hint, children }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:'16px', alignItems:'center' }}>
      <div>
        <div style={{ fontSize:'13px', fontWeight:500, color:'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'1px' }}>{hint}</div>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="animate-fade" style={{ maxWidth:'660px' }}>
      <Section title="Estabelecimento">
        <Row label="Nome"><input value={cfg.nomeEstabelecimento} onChange={e=>set('nomeEstabelecimento',e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/></Row>
        <Row label="Endereço"><input value={cfg.endereco} onChange={e=>set('endereco',e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/></Row>
        <Row label="Telefone"><input value={cfg.telefone} onChange={e=>set('telefone',e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/></Row>
        <Row label="Horário de funcionamento">
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input type="time" value={cfg.horarioAbertura} onChange={e=>set('horarioAbertura',e.target.value)} style={{ ...inp, flex:1 }} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
            <span style={{ color:'var(--text3)', fontSize:'12px' }}>até</span>
            <input type="time" value={cfg.horarioFechamento} onChange={e=>set('horarioFechamento',e.target.value)} style={{ ...inp, flex:1 }} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          </div>
        </Row>
      </Section>

      <Section title="Notificações">
        <Row label="Alerta de estoque baixo" hint="Receber e-mail quando abaixo do mínimo"><Toggle val={cfg.alertaEstoqueEmail} onChange={v=>set('alertaEstoqueEmail',v)}/></Row>
        <Row label="Notificar novo pedido" hint="Som ou notificação ao receber pedido"><Toggle val={cfg.notifNovoPedido} onChange={v=>set('notifNovoPedido',v)}/></Row>
      </Section>

      <Section title="Segurança">
        <Row label="Timeout de sessão" hint="Minutos de inatividade">
          <input value={cfg.sessionTimeout} onChange={e=>set('sessionTimeout',e.target.value)} type="number" min="5" style={inp} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
        </Row>
        <Row label="Auto-registro" hint="Permitir novos cadastros sem convite"><Toggle val={cfg.permitirAutoRegistro} onChange={v=>set('permitirAutoRegistro',v)}/></Row>
        <Row label="Backup automático" hint="Backup diário dos dados"><Toggle val={cfg.backupAutomatico} onChange={v=>set('backupAutomatico',v)}/></Row>
      </Section>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'12px' }}>
        {saved && <span style={{ fontSize:'13px', color:'var(--green)', fontFamily:'var(--mono)' }}>✓ configurações salvas</span>}
        <button onClick={save}
          style={{ padding:'10px 24px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', boxShadow:'var(--shadow-gold)', transition:'opacity 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >Salvar configurações</button>
      </div>
    </div>
  )
}