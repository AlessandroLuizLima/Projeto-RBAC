import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function NaoAutorizado() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px', padding:'20px' }}>
      <div style={{ width:'60px', height:'60px', background:'var(--red-bg)', border:'1px solid rgba(217,112,112,0.25)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px' }}>🔒</div>
      <h1 style={{ fontFamily:'var(--serif)', fontSize:'28px', fontWeight:600 }}>Acesso restrito</h1>
      <p style={{ fontSize:'14px', color:'var(--text2)', textAlign:'center', maxWidth:'300px' }}>
        Você não tem permissão para esta página.&nbsp;
        Perfil: <span style={{ color:'var(--gold)' }}>{user?.cargo || 'desconhecido'}</span>
      </p>
      <button onClick={()=>navigate('/')}
        style={{ padding:'10px 22px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', marginTop:'6px', boxShadow:'var(--shadow-gold)' }}
        onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e=>e.currentTarget.style.opacity='1'}
      >Voltar ao início</button>
    </div>
  )
}