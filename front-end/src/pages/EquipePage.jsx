import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const INIT_EQUIPE = [
  { id:1, nome:'Rafael Moura',   cargo:'Proprietário', role:'admin',   email:'dono@cafegrao.com',    turno:'Integral', status:'ativo',  avatar:'RM', admissao:'2022-03-01' },
  { id:2, nome:'Camila Torres',  cargo:'Gerente',      role:'gerente', email:'gerente@cafegrao.com', turno:'Integral', status:'ativo',  avatar:'CT', admissao:'2022-05-10' },
  { id:3, nome:'Lucas Ferreira', cargo:'Barista',      role:'barista', email:'barista@cafegrao.com', turno:'Manhã',    status:'ativo',  avatar:'LF', admissao:'2023-01-15' },
  { id:4, nome:'Ana Lima',       cargo:'Barista',      role:'barista', email:'ana@cafegrao.com',     turno:'Tarde',    status:'ferias', avatar:'AL', admissao:'2023-06-20' },
]

const ROLE_CFG   = { admin:{label:'Proprietário',color:'var(--gold)'}, gerente:{label:'Gerente',color:'var(--text)'}, barista:{label:'Barista',color:'var(--text2)'} }
const STATUS_CFG = { ativo:{label:'Ativo',color:'var(--green)',bg:'var(--green-bg)'}, ferias:{label:'Férias',color:'var(--amber)',bg:'var(--amber-bg)'}, inativo:{label:'Inativo',color:'var(--text3)',bg:'var(--bg3)'} }

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

const EMPTY_MEMBRO = { nome:'', cargo:'Barista', role:'barista', email:'', turno:'Manhã', status:'ativo' }

// Estado local dentro do modal — evita re-render do pai a cada keystroke
function FormModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial)
  const set = (key) => (e) => setF(prev => ({ ...prev, [key]: e.target.value }))
  const isCreate = !initial.id
  const canSave  = f.nome.trim() !== '' && f.email.trim() !== ''

  const handleSave = () => {
    if (isCreate) {
      const avatar = f.nome.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      onSave({ ...f, avatar, admissao: new Date().toISOString().slice(0, 10) })
    } else {
      onSave(f)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
      <div className="animate-fade" style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'460px', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:'15px', fontWeight:600 }}>{isCreate ? 'Novo membro' : 'Editar membro'}</h3>
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
          <Field label="Nome completo">
            <input
              value={f.nome}
              onChange={set('nome')}
              style={inp}
              placeholder="Ex: João da Silva"
              autoFocus
              onFocus={e => e.target.style.borderColor='var(--gold)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
          </Field>

          <Field label="E-mail">
            <input
              value={f.email}
              onChange={set('email')}
              style={inp}
              type="email"
              placeholder="joao@cafegrao.com"
              onFocus={e => e.target.style.borderColor='var(--gold)'}
              onBlur={e  => e.target.style.borderColor='var(--border)'}
            />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Field label="Cargo">
              <input
                value={f.cargo}
                onChange={set('cargo')}
                style={inp}
                placeholder="Barista"
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e  => e.target.style.borderColor='var(--border)'}
              />
            </Field>
            <Field label="Role">
              <select value={f.role} onChange={set('role')} style={inp}>
                <option value="barista">Barista</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Proprietário</option>
              </select>
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <Field label="Turno">
              <select value={f.turno} onChange={set('turno')} style={inp}>
                {['Manhã','Tarde','Integral'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={f.status} onChange={set('status')} style={inp}>
                <option value="ativo">Ativo</option>
                <option value="ferias">Férias</option>
                <option value="inativo">Inativo</option>
              </select>
            </Field>
          </div>

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

export default function EquipePage() {
  const { user } = useAuth()
  const [equipe, setEquipe]     = useState(INIT_EQUIPE)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)

  const openCreate = () => { setSelected(null); setModal('create') }
  const openEdit   = (membro) => { setSelected(membro); setModal('edit') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = (data) => {
    if (modal === 'create') {
      setEquipe(prev => [...prev, { ...data, id: Date.now() }])
    } else {
      setEquipe(prev => prev.map(m => m.id === selected.id ? { ...m, ...data } : m))
    }
    closeModal()
  }

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px' }}>
        <button
          onClick={openCreate}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', background:'var(--gold)', color:'#0c0c0c', borderRadius:'var(--radius)', fontWeight:600, fontSize:'13px', boxShadow:'var(--shadow-gold)' }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar membro
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'12px' }}>
        {equipe.map(membro => {
          const rc = ROLE_CFG[membro.role]
          const sc = STATUS_CFG[membro.status]
          return (
            <div key={membro.id}
              style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', transition:'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'var(--bg3)', border:`1px solid ${rc.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:rc.color, flexShrink:0 }}>
                  {membro.avatar}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{membro.nome}</div>
                  <div style={{ fontSize:'12px', color:'var(--text3)', marginTop:'1px' }}>{membro.cargo}</div>
                </div>
                <span style={{ padding:'2px 8px', background:sc.bg, border:`1px solid ${sc.color}33`, borderRadius:'20px', fontSize:'10px', color:sc.color, fontFamily:'var(--mono)', flexShrink:0 }}>
                  {sc.label}
                </span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'14px' }}>
                {[
                  { key:'email', value: membro.email },
                  { key:'turno', value: membro.turno },
                  { key:'desde', value: membro.admissao },
                ].map(({ key, value }) => (
                  <div key={key} style={{ fontSize:'12px', display:'flex', gap:'6px' }}>
                    <span style={{ minWidth:'52px', color:'var(--text3)', fontFamily:'var(--mono)', fontSize:'11px' }}>{key}</span>
                    <span style={{ color:'var(--text2)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => openEdit(membro)}
                  style={{ width:'100%', padding:'7px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:'12px', color:'var(--text2)', fontFamily:'var(--mono)', transition:'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold-border)'; e.currentTarget.style.color='var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)' }}
                >
                  Editar
                </button>
              )}
            </div>
          )
        })}
      </div>

      {modal === 'create' && (
        <FormModal
          initial={EMPTY_MEMBRO}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
      {modal === 'edit' && selected && (
        <FormModal
          initial={selected}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}