import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const INIT = [
  { id:1,  nome:'Café Ethiopia Yirgacheffe', cat:'Grãos',      qt:3,   un:'kg',  min:5,   custo:'R$ 85/kg',   fornecedor:'Importadora Verde' },
  { id:2,  nome:'Café Bourbon Amarelo',      cat:'Grãos',      qt:8,   un:'kg',  min:5,   custo:'R$ 62/kg',   fornecedor:'Fazenda Primavera' },
  { id:3,  nome:'Café Robusta Blend',        cat:'Grãos',      qt:12,  un:'kg',  min:8,   custo:'R$ 38/kg',   fornecedor:'Distribuidora Sul' },
  { id:4,  nome:'Leite Integral',            cat:'Laticínios', qt:4,   un:'L',   min:10,  custo:'R$ 5,20/L',  fornecedor:'Laticínios Belo'   },
  { id:5,  nome:'Leite Desnatado',           cat:'Laticínios', qt:6,   un:'L',   min:8,   custo:'R$ 4,80/L',  fornecedor:'Laticínios Belo'   },
  { id:6,  nome:'Creme de Leite',            cat:'Laticínios', qt:9,   un:'un',  min:6,   custo:'R$ 4,50',    fornecedor:'Distribuidora Sul' },
  { id:7,  nome:'Copos Descartáveis 200ml',  cat:'Embalagens', qt:180, un:'un',  min:100, custo:'R$ 0,22',    fornecedor:'Embalagens SP'     },
  { id:8,  nome:'Tampas Descartáveis',       cat:'Embalagens', qt:95,  un:'un',  min:100, custo:'R$ 0,18',    fornecedor:'Embalagens SP'     },
  { id:9,  nome:'Açúcar',                    cat:'Insumos',    qt:7,   un:'kg',  min:5,   custo:'R$ 3,90/kg', fornecedor:'Atacadão'          },
  { id:10, nome:'Adoçante Sachê',            cat:'Insumos',    qt:120, un:'un',  min:50,  custo:'R$ 0,15',    fornecedor:'Atacadão'          },
]

function statusInfo(qt, min) {
  const r = qt / min
  if (r < 0.7) return { label:'Crítico', color:'var(--red)',   bg:'var(--red-bg)'   }
  if (r < 1)   return { label:'Baixo',   color:'var(--amber)', bg:'var(--amber-bg)' }
  return             { label:'Normal',   color:'var(--green)', bg:'var(--green-bg)' }
}

// Quebra "R$ 85/kg" → { custoValor: '85', custoUnidade: 'kg' }
// Suporta "R$ 5,20/L", "R$ 0,22" (sem unidade), "85/kg", "85"
function parseCusto(custo = '') {
  const s = custo.replace('R$', '').trim()
  const parts = s.split('/')
  const valor = parts[0].trim()
  const unidade = parts[1] ? parts[1].trim() : ''
  return { custoValor: valor, custoUnidade: unidade }
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

// ─── FormModal com estado LOCAL ────────────────────────────────────────────────
// O estado do formulário fica DENTRO do modal, não no componente pai.
// Isso garante que cada keystroke não re-renderize EstoquePage,
// o que desmontaria e remontaria o input fazendo perder o foco.
function FormModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial)

  const set = (key) => (e) => setF(prev => ({ ...prev, [key]: e.target.value }))

  const isCreate = !initial.id
  const canSave  = f.nome.trim() !== '' && f.qt !== '' && f.min !== ''

  const handleSave = () => {
    const custo = f.custoValor.trim()
      ? f.custoUnidade.trim()
        ? `R$ ${f.custoValor.trim()}/${f.custoUnidade.trim()}`
        : `R$ ${f.custoValor.trim()}`
      : ''
    onSave({ ...f, custo, qt: Number(f.qt), min: Number(f.min) })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
      <div className="animate-fade" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'480px', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'15px', fontWeight:600 }}>{isCreate ? 'Novo Item' : 'Editar Item'}</h3>
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
          <Field label="Nome do produto">
            <input
              value={f.nome}
              onChange={set('nome')}
              style={inp}
              placeholder="Ex: Café Ethiopia 250g"
              autoFocus
              onFocus={e => e.target.style.borderColor='var(--gold)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Field label="Categoria">
              <select value={f.cat} onChange={set('cat')} style={inp}>
                {['Grãos','Laticínios','Embalagens','Insumos'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Unidade">
              <select value={f.un} onChange={set('un')} style={inp}>
                <option value="kg">kg</option>
                <option value="L">L (litro)</option>
                <option value="un">un (unidade)</option>
                <option value="g">g (gramas)</option>
              </select>
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Field label="Quantidade atual">
              <input
                value={f.qt}
                onChange={set('qt')}
                style={inp}
                type="number"
                min="0"
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </Field>
            <Field label="Estoque mínimo">
              <input
                value={f.min}
                onChange={set('min')}
                style={inp}
                type="number"
                min="0"
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </Field>
          </div>

          <Field label="Custo unitário">
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <span style={{ fontSize:'13px', color:'var(--text2)', fontFamily:'var(--mono)', flexShrink:0 }}>R$</span>
              <input
                value={f.custoValor}
                onChange={set('custoValor')}
                style={{ ...inp, flex:1 }}
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
              <span style={{ fontSize:'13px', color:'var(--text2)', flexShrink:0 }}>/</span>
              <input
                value={f.custoUnidade}
                onChange={set('custoUnidade')}
                style={{ ...inp, width:'80px' }}
                placeholder="kg, L, un"
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </div>
          </Field>

          <Field label="Fornecedor">
            <input
              value={f.fornecedor}
              onChange={set('fornecedor')}
              style={inp}
              placeholder="Nome do fornecedor"
              onFocus={e => e.target.style.borderColor='var(--gold)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
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

// ─── DeleteModal ───────────────────────────────────────────────────────────────
function DeleteModal({ item, onConfirm, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
      <div className="animate-fade" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'420px', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'15px', fontWeight:600 }}>Remover item</h3>
          <button onClick={onClose} style={{ color:'var(--text3)' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ padding:'22px' }}>
          <p style={{ color:'var(--text2)', marginBottom:'20px', fontSize:'14px' }}>
            Remover <strong style={{ color:'var(--text)' }}>{item.nome}</strong> do estoque?
          </p>
          <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
            <button
              onClick={onClose}
              style={{ padding:'9px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text2)', fontSize:'13px' }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{ padding:'9px 16px', background:'var(--red-bg)', border:'1px solid rgba(217,112,112,0.3)', borderRadius:'var(--radius)', color:'var(--red)', fontWeight:600, fontSize:'13px' }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CATS = ['Todos','Grãos','Laticínios','Embalagens','Insumos']
const EMPTY = { nome:'', cat:'Grãos', qt:'', un:'kg', min:'', custoValor:'', custoUnidade:'kg', fornecedor:'' }

// ─── Página principal ──────────────────────────────────────────────────────────
export default function EstoquePage() {
  const { hasPermission } = useAuth()
  const [items, setItems]       = useState(INIT)
  const [cat, setCat]           = useState('Todos')
  const [modal, setModal]       = useState(null)    // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const canEdit = hasPermission('manage_inventory')

  const filtered = cat === 'Todos' ? items : items.filter(i => i.cat === cat)
  const alerts   = items.filter(i => i.qt < i.min)

  const openCreate = () => { setSelected(null); setModal('create') }
  const openEdit   = (item) => { setSelected(item); setModal('edit') }
  const openDelete = (item) => { setSelected(item); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = (data) => {
    if (modal === 'create') {
      setItems(prev => [...prev, { ...data, id: Date.now() }])
    } else {
      setItems(prev => prev.map(i => i.id === selected.id ? { ...data, id: selected.id } : i))
    }
    closeModal()
  }

  const handleDelete = () => {
    setItems(prev => prev.filter(i => i.id !== selected.id))
    closeModal()
  }

  return (
    <div className="animate-fade">
      {/* Alert banner */}
      {alerts.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', background:'var(--red-bg)', border:'1px solid rgba(217,112,112,0.25)', borderRadius:'var(--radius)', marginBottom:'18px', fontSize:'13px', color:'var(--red)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <strong>{alerts.length}</strong> {alerts.length === 1 ? 'item abaixo' : 'itens abaixo'} do estoque mínimo:&nbsp;
          <span style={{ fontFamily:'var(--mono)' }}>{alerts.map(a => a.nome.split(' ')[0]).join(', ')}</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'18px', flexWrap:'wrap', alignItems:'center' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding:'7px 13px', borderRadius:'var(--radius)', fontSize:'12px', fontFamily:'var(--mono)', background: cat===c ? 'var(--bg3)' : 'transparent', border:'1px solid', borderColor: cat===c ? 'var(--border2)' : 'var(--border)', color: cat===c ? 'var(--text)' : 'var(--text2)', transition:'all 0.15s' }}
          >
            {c} {c !== 'Todos' ? `(${items.filter(i => i.cat===c).length})` : `(${items.length})`}
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
            Novo item
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['Produto','Categoria','Quantidade','Mín.','Status','Custo unit.','Fornecedor', canEdit ? 'Ações' : null]
                .filter(Boolean)
                .map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'10px', color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const st = statusInfo(item.qt, item.min)
              return (
                <tr key={item.id}
                  style={{ borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'12px 16px', fontSize:'13px', fontWeight:500, color:'var(--text)' }}>{item.nome}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'2px 8px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'20px', fontSize:'10px', color:'var(--text2)', fontFamily:'var(--mono)' }}>
                      {item.cat}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:'14px', fontWeight:600, color: item.qt < item.min ? 'var(--red)' : 'var(--text)' }}>
                    {item.qt} <span style={{ fontSize:'11px', fontWeight:400, color:'var(--text3)' }}>{item.un}</span>
                  </td>
                  <td style={{ padding:'12px 16px', fontFamily:'var(--mono)', fontSize:'12px', color:'var(--text3)' }}>{item.min}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'2px 9px', background:st.bg, border:`1px solid ${st.color}33`, borderRadius:'20px', fontSize:'10px', color:st.color, fontFamily:'var(--mono)' }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:'12px', color:'var(--text2)', fontFamily:'var(--mono)' }}>{item.custo}</td>
                  <td style={{ padding:'12px 16px', fontSize:'12px', color:'var(--text2)', maxWidth:'140px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.fornecedor}</td>
                  {canEdit && (
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button
                          onClick={() => openEdit(item)}
                          style={{ padding:'4px 10px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'11px', color:'var(--text2)', transition:'all 0.15s', fontFamily:'var(--mono)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openDelete(item)}
                          style={{ padding:'4px 10px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'11px', color:'var(--text2)', transition:'all 0.15s', fontFamily:'var(--mono)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--red)'; e.currentTarget.style.color='var(--red)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
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
            ...selected,
            qt: String(selected.qt),
            min: String(selected.min),
            ...parseCusto(selected.custo),
          }}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
      {modal === 'delete' && selected && (
        <DeleteModal
          item={selected}
          onConfirm={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  )
}