import { useEffect } from 'react'

// Tempo até seguir sozinho para o cardápio. O cliente também pode tocar para pular.
const DURACAO_MS = 3400

function Xicara() {
  return (
    <svg viewBox="0 0 160 150" width="150" height="140" role="img" aria-label="Xícara de café">
      <ellipse cx="80" cy="130" rx="60" ry="10" fill="#2e2e2e" stroke="#c9a84c" strokeWidth="2" />
      <path d="M122 70 C150 66 150 104 118 100" fill="none" stroke="#c9a84c" strokeWidth="7" strokeLinecap="round" />
      <path d="M38 60 H122 V84 C122 110 104 126 80 126 C56 126 38 110 38 84 Z" fill="#1c1c1c" stroke="#c9a84c" strokeWidth="3" />
      <ellipse cx="80" cy="60" rx="42" ry="9" fill="#5a3a22" stroke="#e8c97a" strokeWidth="2" />
      <path d="M62 46 C54 36 70 30 62 18" className="mesa-vapor v1" />
      <path d="M80 46 C72 36 88 30 80 14" className="mesa-vapor v2" />
      <path d="M98 46 C90 36 106 30 98 18" className="mesa-vapor v3" />
    </svg>
  )
}

export default function BoasVindas({ nomeCafe, numeroMesa, onComecar }) {
  useEffect(() => {
    const t = setTimeout(onComecar, DURACAO_MS)
    return () => clearTimeout(t)
  }, [onComecar])

  return (
    <section className="mesa-boasvindas" aria-label="Boas-vindas">
      <div className="mesa-palco">
        <div className="mesa-cup-pulo">
          <div className="mesa-cup-giro"><Xicara /></div>
        </div>
        <div className="mesa-sombra" aria-hidden="true" />
      </div>

      <div className="mesa-boasvindas-texto">
        <p className="mesa-pill">Mesa {numeroMesa}</p>
        <h1>
          Seja muito bem-vindo à Cafeteria
          <span>{nomeCafe}</span>
        </h1>
        <p className="mesa-sub">Faça o seu pedido pelo celular, sem fila.</p>
      </div>

      <button type="button" className="mesa-btn mesa-btn-ghost mesa-comecar" onClick={onComecar}>
        Toque para começar
      </button>
    </section>
  )
}
