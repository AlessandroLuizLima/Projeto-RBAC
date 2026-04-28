import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [erro, setErro]       = useState('')
  const [loading, setLoading] = useState(false)
  const [hints, setHints]     = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const submit = async (e) => {
    e.preventDefault(); setErro(''); setLoading(true)
    try { await login(email, senha); navigate('/') }
    catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }

  const fill = (role) => {
    const c = { admin:['dono@cafegrao.com','123456'], gerente:['gerente@cafegrao.com','123456'], barista:['barista@cafegrao.com','123456'] }
    setEmail(c[role][0]); setSenha(c[role][1]); setHints(false)
  }

  const inp = {
    width:'100%', padding:'11px 14px',
    background:'var(--bg2)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', color:'var(--text)',
    fontSize:'14px', outline:'none', transition:'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', overflow:'hidden' }}>
      {/* Left panel – decorative */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px', background:'var(--bg1)', borderRight:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
        {/* subtle grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--border) 1px, transparent 1px)', backgroundSize:'32px 32px', opacity:0.5 }} />
        {/* glow */}
        <div style={{ position:'absolute', bottom:'-100px', left:'50%', transform:'translateX(-50%)', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', textAlign:'center' }}>
          <div style={{ fontSize:'72px', marginBottom:'24px', filter:'drop-shadow(0 0 24px rgba(201,168,76,0.3))' }}>☕</div>
          <h1 style={{ fontFamily:'var(--serif)', fontSize:'48px', fontWeight:600, color:'var(--gold2)', letterSpacing:'-0.5px', lineHeight:1.1, marginBottom:'16px' }}>
            Café<br />Grão
          </h1>
          <div style={{ width:'40px', height:'1px', background:'var(--gold)', margin:'0 auto 16px' }} />
          <p style={{ color:'var(--text3)', fontSize:'13px', fontFamily:'var(--mono)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Painel Administrativo</p>
        </div>
        <div style={{ position:'absolute', bottom:'32px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'24px' }}>
          {['Pedidos','Estoque','Equipe'].map(t => (
            <span key={t} style={{ fontSize:'11px', color:'var(--text3)', fontFamily:'var(--mono)', letterSpacing:'0.08em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{ width:'420px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
        <div style={{ width:'100%', maxWidth:'340px' }}>
          <h2 style={{ fontFamily:'var(--serif)', fontSize:'28px', fontWeight:600, marginBottom:'6px', color:'var(--text)' }}>Bem-vindo</h2>
          <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'32px' }}>Entre com suas credenciais para acessar o painel.</p>

          {erro && (
            <div style={{ background:'var(--red-bg)', border:'1px solid rgba(217,112,112,0.3)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:'20px', fontSize:'13px', color:'var(--red)' }}>
              {erro}
            </div>
          )}

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'var(--text3)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)' }}>E-mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@cafegrao.com" style={inp}
                onFocus={e=>e.target.style.borderColor='var(--gold)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:500, color:'var(--text3)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)' }}>Senha</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} required placeholder="••••••" style={inp}
                onFocus={e=>e.target.style.borderColor='var(--gold)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding:'12px', background: loading ? 'var(--bg3)' : 'var(--gold)', color: loading ? 'var(--text2)' : '#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'14px', marginTop:'4px', transition:'all 0.2s', letterSpacing:'0.01em', boxShadow: loading ? 'none' : 'var(--shadow-gold)' }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>

          {/* Hint box */}
          <div style={{ marginTop:'28px', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
            <button onClick={()=>setHints(h=>!h)}
              style={{ width:'100%', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--text3)', fontSize:'12px', fontFamily:'var(--mono)', background:'var(--bg2)', transition:'background 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--bg2)'}
            >
              <span>// demo credentials</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform:hints?'rotate(180deg)':'none', transition:'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {hints && (
              <div style={{ padding:'10px', display:'flex', flexDirection:'column', gap:'6px', background:'var(--bg1)' }}>
                {[
                  { key:'admin',   label:'Dono',    color:'var(--gold)',  desc:'Acesso total' },
                  { key:'gerente', label:'Gerente', color:'var(--text)',  desc:'Gestão operacional' },
                  { key:'barista', label:'Barista', color:'var(--text2)', desc:'Pedidos & estoque' },
                ].map(({ key, label, color, desc }) => (
                  <button key={key} onClick={()=>fill(key)}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', borderRadius:'var(--radius)', background:'var(--bg2)', border:'1px solid var(--border)', textAlign:'left', transition:'border-color 0.15s', width:'100%' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-border)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                  >
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:color, flexShrink:0 }} />
                    <span style={{ fontSize:'13px', fontWeight:500, color:'var(--text)', minWidth:'58px' }}>{label}</span>
                    <span style={{ fontSize:'12px', color:'var(--text3)', fontFamily:'var(--mono)' }}>{desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}