import { useEffect } from 'react'

// Tempo até seguir sozinho para o cardápio (dá para ver o copo pular umas 3 vezes).
// O cliente também pode tocar para pular.
const DURACAO_MS = 8000

// Copo de cappuccino para viagem, estilo propaganda: tampa, luva de papelão, brilho e vapor.
function CopoCappuccino() {
  return (
    <svg viewBox="0 0 200 250" width="150" height="188" role="img" aria-label="Copo de cappuccino">
      <defs>
        <linearGradient id="cp-copo" x1="0" x2="1">
          <stop offset="0" stopColor="#f3ece2" />
          <stop offset=".35" stopColor="#ffffff" />
          <stop offset=".75" stopColor="#efe6da" />
          <stop offset="1" stopColor="#d9cbb8" />
        </linearGradient>
        <linearGradient id="cp-luva" x1="0" x2="1">
          <stop offset="0" stopColor="#8a5a34" />
          <stop offset=".4" stopColor="#b07a4a" />
          <stop offset="1" stopColor="#6e4425" />
        </linearGradient>
        <linearGradient id="cp-tampa" x1="0" x2="1">
          <stop offset="0" stopColor="#3b2a1e" />
          <stop offset=".4" stopColor="#5b4231" />
          <stop offset="1" stopColor="#2a1d14" />
        </linearGradient>
        <radialGradient id="cp-espuma" cx=".45" cy=".4" r=".7">
          <stop offset="0" stopColor="#fff7ea" />
          <stop offset="1" stopColor="#e7cfa8" />
        </radialGradient>
      </defs>

      {/* vapor */}
      <path d="M78 46 C68 34 88 26 78 10" className="mesa-vapor v1" />
      <path d="M100 42 C90 30 110 22 100 4" className="mesa-vapor v2" />
      <path d="M122 46 C112 34 132 26 122 10" className="mesa-vapor v3" />

      {/* corpo do copo (afunila para baixo) */}
      <path d="M44 84 L156 84 L142 236 Q100 244 58 236 Z" fill="url(#cp-copo)" stroke="#c9b79f" strokeWidth="1.5" />
      {/* brilho */}
      <path d="M60 92 L70 92 L78 228 L70 228 Z" fill="#fff" opacity=".8" />

      {/* luva de papelão com selo */}
      <path d="M49 132 L151 132 L145 196 Q100 203 55 196 Z" fill="url(#cp-luva)" />
      <circle cx="100" cy="164" r="20" fill="#f6e7cf" />
      <ellipse cx="100" cy="164" rx="8" ry="12" fill="#6e4425" transform="rotate(25 100 164)" />
      <path d="M95 154 Q103 164 96 174" stroke="#f6e7cf" strokeWidth="2.5" fill="none" strokeLinecap="round" transform="rotate(25 100 164)" />

      {/* espuma aparecendo pela borda */}
      <ellipse cx="100" cy="82" rx="58" ry="10" fill="url(#cp-espuma)" />

      {/* tampa */}
      <path d="M38 84 Q38 74 48 72 L152 72 Q162 74 162 84 Z" fill="url(#cp-tampa)" />
      <path d="M56 72 Q60 52 78 50 L122 50 Q140 52 144 72 Z" fill="url(#cp-tampa)" />
      <rect x="88" y="54" width="24" height="6" rx="3" fill="#1a120c" />
      <path d="M64 70 Q68 58 80 56" stroke="#8a6a52" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
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
        <div className="mesa-cup-entrada">
          <div className="mesa-cup-pulo">
            <div className="mesa-cup-giro"><CopoCappuccino /></div>
          </div>
        </div>
        <div className="mesa-brilhos" aria-hidden="true"><i /><i /><i /><i /></div>
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

      <button type="button" className="mesa-btn mesa-btn-ouro mesa-comecar" onClick={onComecar}>
        Toque para começar
      </button>
    </section>
  )
}
