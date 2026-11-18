import { emCentavos, formatarCentavos, LIMITES } from '../../lib/carrinho'
import { Stepper } from './Cardapio'

export default function Resumo({
  nomeCafe, numeroMesa, itens, totalEmCentavos, observacao, enviando, erro,
  onObservacao, onAlterar, onVoltar, onConcluir,
}) {
  return (
    <section className="mesa-tela" aria-label="Resumo do pedido">
      <header className="mesa-topo">
        <span className="mesa-marca">{nomeCafe}</span>
        <span className="mesa-pill">Mesa {numeroMesa}</span>
      </header>

      <h2 className="mesa-titulo">Seu pedido</h2>

      {itens.length === 0 ? (
        <p className="mesa-vazio">Seu pedido está vazio. Volte e escolha algo gostoso.</p>
      ) : (
        <ul className="mesa-resumo-lista">
          {itens.map(({ produto, quantidade, subtotal }) => (
            <li key={produto.id} className="mesa-resumo-item">
              <div>
                <strong>{produto.nome}</strong>
                <span className="mesa-desc">{formatarCentavos(emCentavos(produto.preco))} cada</span>
              </div>
              <Stepper
                produto={produto}
                quantidade={quantidade}
                maximo={Math.min(produto.max_quantidade ?? LIMITES.maxQuantidadePorItem, LIMITES.maxQuantidadePorItem)}
                onAlterar={onAlterar}
              />
              <span className="mesa-preco">{formatarCentavos(subtotal)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mesa-obs">
        <label htmlFor="mesa-obs">Observações (opcional)</label>
        <textarea
          id="mesa-obs"
          rows={3}
          maxLength={LIMITES.maxObservacao}
          placeholder="Ex.: Café sem açúcar"
          value={observacao}
          onChange={(e) => onObservacao(e.target.value)}
        />
        <small>{observacao.length}/{LIMITES.maxObservacao}</small>
      </div>

      <p className="mesa-total"><span>Total</span><strong>{formatarCentavos(totalEmCentavos)}</strong></p>

      {erro && <p className="mesa-erro" role="alert">{erro}</p>}

      <div className="mesa-acoes">
        <button type="button" className="mesa-btn mesa-btn-ghost" onClick={onVoltar} disabled={enviando}>Voltar</button>
        <button type="button" className="mesa-btn mesa-btn-ouro mesa-btn-grande" onClick={onConcluir} disabled={enviando || itens.length === 0}>
          {enviando ? 'Enviando…' : 'Concluir pedido'}
        </button>
      </div>
    </section>
  )
}
