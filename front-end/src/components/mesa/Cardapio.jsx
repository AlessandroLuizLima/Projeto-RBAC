import { useState } from 'react'
import { Coffee, Minus, Plus } from 'lucide-react'
import { emCentavos, formatarCentavos, LIMITES, quantidadeTotal } from '../../lib/carrinho'
import { urlImagem } from '../../services/publicoApi'

const ROTULOS = { cafe: 'Cafés', salgado: 'Salgados', doce: 'Doces' }
const rotulo = (cat) => ROTULOS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)

function agrupar(produtos) {
  const grupos = new Map()
  for (const p of produtos) {
    if (!grupos.has(p.categoria)) grupos.set(p.categoria, [])
    grupos.get(p.categoria).push(p)
  }
  return [...grupos.entries()]
}

function Imagem({ produto }) {
  const [falhou, setFalhou] = useState(false)
  const src = urlImagem(produto.imagem_url)
  if (!src || falhou) {
    return <div className="mesa-img mesa-img-vazia" aria-hidden="true"><Coffee size={28} /></div>
  }
  return <img className="mesa-img" src={src} alt="" loading="lazy" onError={() => setFalhou(true)} />
}

export function Stepper({ produto, quantidade, maximo, onAlterar }) {
  return (
    <div className="mesa-stepper" role="group" aria-label={`Quantidade de ${produto.nome}`}>
      <button type="button" aria-label={`Diminuir ${produto.nome}`} onClick={() => onAlterar(produto, -1)}>
        <Minus size={16} />
      </button>
      <output aria-live="polite">{quantidade}</output>
      <button type="button" aria-label={`Aumentar ${produto.nome}`} disabled={quantidade >= maximo} onClick={() => onAlterar(produto, 1)}>
        <Plus size={16} />
      </button>
    </div>
  )
}

function ProdutoCard({ produto, quantidade, onAlterar }) {
  const maximo = Math.min(produto.max_quantidade ?? LIMITES.maxQuantidadePorItem, LIMITES.maxQuantidadePorItem)
  return (
    <li className={`mesa-card${produto.disponivel ? '' : ' esgotado'}`}>
      <Imagem produto={produto} />
      <div className="mesa-card-corpo">
        <h4>{produto.nome}</h4>
        {produto.descricao && <p className="mesa-desc">{produto.descricao}</p>}
        <div className="mesa-card-rodape">
          <span className="mesa-preco">{formatarCentavos(emCentavos(produto.preco))}</span>
          {!produto.disponivel ? (
            <button type="button" className="mesa-btn mesa-btn-peq" disabled>Indisponível</button>
          ) : quantidade === 0 ? (
            <button type="button" className="mesa-btn mesa-btn-ouro mesa-btn-peq" aria-label={`Incluir ${produto.nome}`} onClick={() => onAlterar(produto, 1)}>
              Incluir
            </button>
          ) : (
            <Stepper produto={produto} quantidade={quantidade} maximo={maximo} onAlterar={onAlterar} />
          )}
        </div>
      </div>
    </li>
  )
}

export default function Cardapio({
  nomeCafe, numeroMesa, estado, erro, aviso, produtos, carrinho, totalEmCentavos,
  onAlterar, onAvancar, onTentarNovamente,
}) {
  const qtd = quantidadeTotal(carrinho)

  return (
    <section className="mesa-tela" aria-label="Cardápio">
      <header className="mesa-topo">
        <span className="mesa-marca">{nomeCafe}</span>
        <span className="mesa-pill">Mesa {numeroMesa}</span>
      </header>

      <h2 className="mesa-titulo">Faça o seu pedido</h2>

      {aviso && <p role="status" className="mesa-aviso">{aviso}</p>}

      {estado === 'carregando' && (
        <div className="mesa-skeletons" aria-busy="true" aria-label="Carregando cardápio">
          <div /><div /><div />
        </div>
      )}

      {estado === 'erro' && (
        <div className="mesa-erro" role="alert">
          <p>{erro}</p>
          <button type="button" className="mesa-btn mesa-btn-ouro" onClick={onTentarNovamente}>Tentar de novo</button>
        </div>
      )}

      {estado === 'pronto' && produtos.length === 0 && (
        <p className="mesa-vazio">O cardápio está indisponível no momento. Chame um atendente.</p>
      )}

      {estado === 'pronto' && agrupar(produtos).map(([cat, lista]) => (
        <section key={cat} aria-label={rotulo(cat)}>
          <h3 className="mesa-categoria">{rotulo(cat)}</h3>
          <ul className="mesa-lista">
            {lista.map((p) => (
              <ProdutoCard key={p.id} produto={p} quantidade={carrinho[p.id] || 0} onAlterar={onAlterar} />
            ))}
          </ul>
        </section>
      ))}

      {qtd > 0 && (
        <div className="mesa-barra">
          <button type="button" className="mesa-btn mesa-btn-ouro mesa-btn-grande" onClick={onAvancar}>
            <span>Avançar</span>
            <span className="mesa-barra-info" aria-live="polite">
              {qtd} {qtd === 1 ? 'item' : 'itens'} · {formatarCentavos(totalEmCentavos)}
            </span>
          </button>
        </div>
      )}
    </section>
  )
}
