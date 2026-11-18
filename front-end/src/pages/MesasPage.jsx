/* global __URL_REDE__ */
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { useAuth } from '../context/AuthContext'
import { mesasApi } from '../services/api'

// Endereço que o CELULAR usa para abrir o site. "localhost" não serve (no celular,
// localhost é o próprio celular), então em dev o Vite injeta o IP deste computador na rede.
const ehLocal = (host) => ['localhost', '127.0.0.1', '[::1]'].includes(host)
const URL_PADRAO =
  import.meta.env.VITE_URL_PUBLICA ||
  (!ehLocal(window.location.hostname) ? window.location.origin : (typeof __URL_REDE__ !== 'undefined' && __URL_REDE__) || window.location.origin)

const CHAVE_URL = 'cafe_url_qr'

function lerUrlSalva() {
  try { return localStorage.getItem(CHAVE_URL) || URL_PADRAO } catch { return URL_PADRAO }
}

const linkDaMesa = (base, mesa) =>
  `${base.replace(/\/+$/, '')}/mesa/${mesa.numero}?t=${encodeURIComponent(mesa.token)}`

function QrMesa({ mesa, base }) {
  const [img, setImg] = useState('')
  const link = linkDaMesa(base, mesa)

  useEffect(() => {
    let ativo = true
    QRCode.toDataURL(link, { width: 520, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1a1208', light: '#ffffff' } })
      .then((url) => { if (ativo) setImg(url) })
      .catch(() => { if (ativo) setImg('') })
    return () => { ativo = false }
  }, [link])

  return (
    <div className="qr-card" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', opacity: mesa.ativa ? 1 : .5 }}>
      <div style={{ fontFamily:'var(--serif)', fontSize:'24px', fontWeight:600, color:'var(--gold2)' }}>Mesa {mesa.numero}</div>
      <div style={{ background:'#fff', padding:'10px', borderRadius:'12px', width:'100%', maxWidth:'220px', aspectRatio:'1' }}>
        {img
          ? <img src={img} alt={`QR code da mesa ${mesa.numero}`} style={{ width:'100%', height:'100%', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', background:'#eee', borderRadius:'6px' }} />}
      </div>
      <div className="qr-legenda" style={{ fontSize:'12px', color:'var(--text2)', textAlign:'center' }}>Aponte a câmera do celular para fazer o pedido</div>
      <div className="qr-acoes" style={{ display:'flex', gap:'8px', width:'100%' }}>
        <a href={link} target="_blank" rel="noreferrer"
          style={{ flex:1, textAlign:'center', padding:'8px', borderRadius:'var(--radius)', border:'1px solid var(--border2)', color:'var(--text)', fontSize:'12.5px', textDecoration:'none' }}>
          Abrir link
        </a>
        <button type="button" onClick={() => navigator.clipboard?.writeText(link)}
          style={{ flex:1, padding:'8px', borderRadius:'var(--radius)', border:'1px solid var(--border2)', color:'var(--text)', fontSize:'12.5px' }}>
          Copiar link
        </button>
      </div>
      {!mesa.ativa && <div style={{ fontSize:'11px', color:'var(--red)', fontFamily:'var(--mono)' }}>MESA INATIVA</div>}
    </div>
  )
}

export default function MesasPage() {
  const { user } = useAuth()
  const podeCriar = user?.role === 'admin'
  const [mesas, setMesas] = useState(null)
  const [erro, setErro] = useState('')
  const [base, setBase] = useState(lerUrlSalva)
  const [novaMesa, setNovaMesa] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = () => {
    setErro('')
    mesasApi.listar().then(setMesas).catch((e) => setErro(e.message))
  }
  useEffect(carregar, [])

  const alterarBase = (valor) => {
    setBase(valor)
    try { localStorage.setItem(CHAVE_URL, valor) } catch { /* ignora */ }
  }

  const baseEhLocal = useMemo(() => {
    try { return ehLocal(new URL(base).hostname) } catch { return true }
  }, [base])

  const criar = async (e) => {
    e.preventDefault()
    const numero = Number(novaMesa)
    if (!Number.isInteger(numero) || numero <= 0) { setErro('Informe um número de mesa válido.'); return }
    setCriando(true)
    try {
      await mesasApi.criar(numero)
      setNovaMesa('')
      carregar()
    } catch (e2) {
      setErro(e2.message)
    } finally {
      setCriando(false)
    }
  }

  const inp = { padding:'9px 12px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:'13px', outline:'none' }

  return (
    <div className="animate-fade">
      <style>{`
        @media print {
          aside, header, .qr-config, .qr-acoes { display: none !important; }
          body, main { background: #fff !important; }
          .qr-grade { grid-template-columns: repeat(2, 1fr) !important; }
          .qr-card { break-inside: avoid; background: #fff !important; border: 1px solid #999 !important; }
          .qr-card div, .qr-legenda { color: #000 !important; }
        }
      `}</style>

      <div className="qr-config" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px 18px', marginBottom:'20px', display:'grid', gap:'12px' }}>
        <label style={{ display:'grid', gap:'6px', fontSize:'12px', color:'var(--text2)' }}>
          Endereço do site usado no QR code
          <input value={base} onChange={(e) => alterarBase(e.target.value)} style={{ ...inp, fontFamily:'var(--mono)' }} />
        </label>
        {baseEhLocal ? (
          <p style={{ fontSize:'12.5px', color:'var(--amber)' }}>
            Este endereço só abre neste computador. Para o celular, use o IP do computador na rede (ex.: http://192.168.0.10:5173).
          </p>
        ) : (
          <p style={{ fontSize:'12.5px', color:'var(--text3)' }}>
            O celular precisa estar no mesmo Wi-Fi que este computador.
          </p>
        )}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
          <button type="button" onClick={() => window.print()}
            style={{ padding:'8px 14px', borderRadius:'var(--radius)', background:'var(--gold)', color:'#1a1405', fontSize:'13px', fontWeight:600 }}>
            Imprimir QR codes
          </button>
          {podeCriar && (
            <form onSubmit={criar} style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input type="number" min="1" placeholder="Nº da mesa" value={novaMesa} onChange={(e) => setNovaMesa(e.target.value)} style={{ ...inp, width:'120px' }} />
              <button type="submit" disabled={criando}
                style={{ padding:'8px 14px', borderRadius:'var(--radius)', border:'1px solid var(--gold-border)', color:'var(--gold2)', fontSize:'13px' }}>
                {criando ? 'Criando...' : 'Nova mesa'}
              </button>
            </form>
          )}
        </div>
      </div>

      {erro && <p role="alert" style={{ color:'var(--red)', fontSize:'13px', marginBottom:'14px' }}>{erro}</p>}
      {mesas === null && !erro && <p style={{ color:'var(--text2)', fontSize:'13px' }}>Carregando mesas...</p>}

      {mesas && (
        <div className="qr-grade" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'16px' }}>
          {mesas.map((m) => <QrMesa key={m.id} mesa={m} base={base} />)}
        </div>
      )}
    </div>
  )
}
