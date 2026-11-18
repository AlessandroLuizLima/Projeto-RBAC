import { Check } from 'lucide-react'
import { emCentavos, formatarCentavos } from '../../lib/carrinho'

export default function Confirmacao({ pedido, onNovoPedido }) {
  return (
    <section className="mesa-tela mesa-confirmacao" aria-label="Pedido enviado">
      <div className="mesa-check" aria-hidden="true"><Check size={44} /></div>
      <h2 className="mesa-titulo">Pedido enviado!</h2>
      <p>Pedido <strong>#{pedido.id}</strong> · Mesa {pedido.mesa}</p>
      <p className="mesa-sub">
        Aguarde um instante: a equipe já recebeu o seu pedido e logo ele chega à sua mesa.
      </p>
      <p className="mesa-total"><span>Total</span><strong>{formatarCentavos(emCentavos(pedido.total))}</strong></p>
      <button type="button" className="mesa-btn mesa-btn-ghost" onClick={onNovoPedido}>Fazer outro pedido</button>
    </section>
  )
}
