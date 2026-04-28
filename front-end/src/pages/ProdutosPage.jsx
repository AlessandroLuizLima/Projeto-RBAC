import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const INIT = [
  { id:1,  nome:'Espresso',           cat:'Café',     precoValor: 7,  desc:'Shot simples de espresso extraído na pressão',     ativo:true,  destaque:true  },
  { id:2,  nome:'Espresso Duplo',     cat:'Café',     precoValor: 9,  desc:'Dose dupla de espresso',                           ativo:true,  destaque:false },
  { id:3,  nome:'Latte',              cat:'Café',     precoValor:14,  desc:'Espresso com leite vaporizado',                    ativo:true,  destaque:true  },
  { id:4,  nome:'Cappuccino',         cat:'Café',     precoValor:12,  desc:'Espresso com espuma cremosa de leite',             ativo:true,  destaque:false },
  { id:5,  nome:'Mocha',              cat:'Café',     precoValor:16,  desc:'Espresso com chocolate e leite vaporizado',        ativo:true,  destaque:false },
  { id:6,  nome:'Cold Brew Especial', cat:'Cold',     precoValor:16,  desc:'Infusão a frio 18h — origem Etiópia',             ativo:true,  destaque:true  },
  { id:7,  nome:'Filtrado Ethiopia',  cat:'Especial', precoValor:14,  desc:'Yirgacheffe — notas de frutas vermelhas e floral', ativo:true,  destaque:true  },
  { id:8,  nome:'Filtrado Bourbon',   cat:'Especial', precoValor:13,  desc:'Bourbon amarelo — notas de caramelo e noz',        ativo:true,  destaque:false },
  { id:9,  nome:'Croissant',          cat:'Comida',   precoValor:10,  desc:'Croissant francês com manteiga importada',         ativo:true,  destaque:false },
  { id:10, nome:'Pão de Mel',         cat:'Comida',   precoValor: 9,  desc:'Artesanal com recheio de brigadeiro',              ativo:true,  destaque:false },
  { id:11, nome:'Brownie',            cat:'Comida',   precoValor:12,  desc:'Chocolate 70% cacau com nozes',                   ativo:true,  destaque:false },
  { id:12, nome:'Bolo Cenoura',       cat:'Comida',   precoValor:11,  desc:'Bolo caseiro com cobertura de brigadeiro',         ativo:false, destaque:false },
]

const CAT_COLORS = {
  Café:    'var(--gold)',
  Cold:    'var(--text)',
  Especial:'var(--amber)',
  Comida:  'var(--text2)',
}

const inp = {
  width:'100%', padding:'9px 12px',
  background:'var(--bg2)', border:'1px solid var(--border)',
  borderRadius:'var(--radius)', color:'var(--text)',
  fontSize:'13px', outline:'none',
}

const Field = ({ label, children }) => (
  <div>
    <label style={{ display:'block', fontSize:'11px', color:'var(--text3)', marginBottom:'5px', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
      {label}
    </label>
    {children}
  </div>
)

// ─── FormModal com estado LOCAL ─────────────────────────────────────────────
// Estado interno evita re-render do pai a cada keystroke,
// o que desmontaria os inputs e causaria perda de foco.
function FormModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial)

  const set = (key) => (e) => setF(prev => ({ ...prev, [key]: e.target.value }))

  const isCreate = !initial.id
  const canSave  = f.nome.trim() !== '' && f.precoValor !== ''

  const handleSave = () => {
    // Monta o preço formatado a partir do valor numérico
    const precoNum = parseFloat(String(f.precoValor).replace(',', '.'))
    const preco = !isNaN(precoNum) ? `R$ ${precoNum.toFixed(2).replace('.', ',')}` : ''
    onSave({ ...f, precoValor: precoNum || 0, preco })
  }

  const focusGold = (e) => e.target.style.borderColor = 'var(--gold)'
  const blurBorder = (e) => e.target.style.borderColor = 'var(--border)'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
      <div className="animate-fade" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'440px', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'15px', fontWeight:600 }}>{isCreate ? 'Novo Produto' : 'Editar Produto'}</h3>
          <button onClick={onClose} style={{ color:'var(--text3)' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:'14px' }}>

          <Field label="Nome">
            <input
              value={f.nome}
              onChange={set('nome')}
              style={inp}
              placeholder="Ex: Cappuccino"
              autoFocus
              onFocus={focusGold}
              onBlur={blurBorder}
            />
          </Field>

          <Field label="Preço (R$)">
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'13px', color:'var(--text2)', fontFamily:'var(--mono)', flexShrink:0 }}>R$</span>
              <input
                value={f.precoValor}
                onChange={set('precoValor')}
                style={{ ...inp }}
                type="number"
                min="0"
                step="0.50"
                placeholder="0,00"
                onFocus={focusGold}
                onBlur={blurBorder}
              />
            </div>
          </Field>

          <Field label="Categoria">
            <select value={f.cat} onChange={set('cat')} style={inp}>
              {['Café','Cold','Especial','Comida'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Descrição">
            <textarea
              value={f.desc}
              onChange={set('desc')}
              style={{ ...inp, resize:'vertical', minHeight:'72px' }}
              placeholder="Descrição breve do produto"
              rows={3}
              onFocus={focusGold}
              onBlur={blurBorder}
            />
          </Field>

          <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'4px' }}>
            <button
              onClick={onClose}
              style={{ padding:'9px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text2)', fontSize:'13px', fontWeight:500 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{ padding:'9px 16px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}
            >
              {isCreate ? 'Adicionar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const EMPTY = { nome:'', cat:'Café', precoValor:'', desc:'' }

// ─── Página principal ──────────────────────────────────────────────────────
export default function ProdutosPage() {
  const { hasPermission } = useAuth()
  const [produtos, setProdutos] = useState(INIT)
  const [cat, setCat]           = useState('Todos')
  const [modal, setModal]       = useState(null)   // null | 'create' | 'edit'
  const [selected, setSelected] = useState(null)
  const canEdit = hasPermission('manage_products')

  const cats     = ['Todos', ...new Set(INIT.map(p => p.cat))]
  const filtered = cat === 'Todos' ? produtos : produtos.filter(p => p.cat === cat)

  const openCreate = () => { setSelected(null); setModal('create') }
  const openEdit   = (p) => { setSelected(p);   setModal('edit') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = (data) => {
    if (modal === 'create') {
      setProdutos(prev => [...prev, { ...data, id: Date.now(), ativo: true, destaque: false }])
    } else {
      setProdutos(prev => prev.map(p => p.id === selected.id ? { ...p, ...data } : p))
    }
    closeModal()
  }

  const toggle = (id, key) =>
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [key]: !p[key] } : p))

  return (
    <div className="animate-fade">
      {/* Toolbar */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding:'7px 13px', borderRadius:'var(--radius)', fontSize:'12px', fontFamily:'var(--mono)', background: cat===c ? 'var(--bg3)' : 'transparent', border:'1px solid', borderColor: cat===c ? 'var(--border2)' : 'var(--border)', color: cat===c ? 'var(--text)' : 'var(--text2)', transition:'all 0.15s' }}
          >
            {c}
          </button>
        ))}
        <div style={{ flex:1 }} />
        {canEdit && (
          <button
            onClick={openCreate}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', boxShadow:'var(--shadow-gold)' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo produto
          </button>
        )}
      </div>

      {/* Grid de cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'12px' }}>
        {filtered.map(p => (
          <div
            key={p.id}
            style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px', position:'relative', transition:'border-color 0.15s', opacity: p.ativo ? 1 : 0.55 }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            {p.destaque && (
              <div style={{ position:'absolute', top:'12px', right:'12px', padding:'2px 8px', background:'var(--gold-bg)', border:'1px solid var(--gold-border)', borderRadius:'20px', fontSize:'9px', color:'var(--gold)', fontFamily:'var(--mono)', letterSpacing:'0.06em' }}>
                DESTAQUE
              </div>
            )}

            <div style={{ marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', fontFamily:'var(--mono)', color: CAT_COLORS[p.cat] || 'var(--text2)' }}>
                {p.cat}
              </span>
            </div>

            <div style={{ fontFamily:'var(--mono)', fontSize:'18px', fontWeight:500, color:'var(--text)', marginBottom:'5px' }}>
              {p.nome}
            </div>

            <div style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'14px', lineHeight:1.5 }}>
              {p.desc}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {/* Preço sempre exibido com R$ + valor formatado */}
              <span style={{ fontFamily:'var(--mono)', fontSize:'20px', fontWeight:500, color:'var(--gold2)' }}>
                {p.preco || `R$ ${Number(p.precoValor).toFixed(2).replace('.', ',')}`}
              </span>

              {canEdit && (
                <div style={{ display:'flex', gap:'6px' }}>
                  <button
                    onClick={() => toggle(p.id, 'ativo')}
                    style={{ padding:'4px 9px', background:'transparent', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'10px', color: p.ativo ? 'var(--green)' : 'var(--text3)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    style={{ padding:'4px 9px', background:'transparent', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'10px', color:'var(--text3)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <FormModal
          initial={EMPTY}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
      {modal === 'edit' && selected && (
        <FormModal
          initial={{
            nome:       selected.nome,
            cat:        selected.cat,
            precoValor: String(selected.precoValor),
            desc:       selected.desc,
            id:         selected.id,
          }}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}