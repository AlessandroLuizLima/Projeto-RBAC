import { useEffect, useRef, useState } from 'react'
import { Bell, Check, ChefHat, ClipboardCheck, Coffee, X } from 'lucide-react'
import { emCentavos, formatarCentavos } from '../../lib/carrinho'
import { buscarPedido } from '../../services/publicoApi'

// A cada quantos ms o status é consultado de novo.
const INTERVALO_MS = 5000

const ETAPAS = [
  { status: 'pendente',   titulo: 'Pedido recebido', texto: 'A equipe já viu o seu pedido.',        Icone: ClipboardCheck },
  { status: 'em_preparo', titulo: 'Em preparo',      texto: 'O barista está preparando agora.',      Icone: ChefHat },
  { status: 'pronto',     titulo: 'Pronto',          texto: 'Já está saindo para a sua mesa.',       Icone: Bell },
  { status: 'entregue',   titulo: 'Entregue',        texto: 'Bom apetite! Aproveite o seu café.',   Icone: Coffee },
]
const FINAIS = ['entregue', 'cancelado']

const hora = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export default function Acompanhamento({ numeroMesa, token, pedidoId, onNovoPedido }) {
  const [pedido, setPedido] = useState(null)
  const [erro, setErro] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const statusRef = useRef(null)

  useEffect(() => {
    let ativo = true
    let timer

    const consultar = async () => {
      try {
        const dados = await buscarPedido(numeroMesa, token, pedidoId)
        if (!ativo) return
        setPedido(dados)
        setErro('')
        setAtualizadoEm(new Date())
        statusRef.current = dados.status
      } catch (e) {
        if (ativo) setErro(e.status === 404 ? 'Não encontramos este pedido.' : e.message)
      }
      // Para de consultar quando o pedido termina (entregue ou cancelado).
      if (ativo && !FINAIS.includes(statusRef.current)) timer = setTimeout(consultar, INTERVALO_MS)
    }

    consultar()
    return () => { ativo = false; clearTimeout(timer) }
  }, [numeroMesa, token, pedidoId])

  const cancelado = pedido?.status === 'cancelado'
  const indiceAtual = pedido ? ETAPAS.findIndex((e) => e.status === pedido.status) : -1

  return (
    <section className="mesa-tela mesa-confirmacao" aria-label="Acompanhar pedido">
      <h2 className="mesa-titulo">Pedido #{pedidoId}</h2>
      <p className="mesa-pill">Mesa {numeroMesa}</p>

      {!pedido && !erro && <p className="mesa-sub" aria-busy="true">Buscando o seu pedido...</p>}
      {erro && <p className="mesa-erro" role="alert">{erro}</p>}

      {pedido && cancelado && (
        <div className="mesa-erro" role="status">
          <p><X size={16} style={{ verticalAlign: '-3px' }} /> Este pedido foi cancelado. Chame um atendente se precisar de ajuda.</p>
        </div>
      )}

      {pedido && !cancelado && (
        <ol className="mesa-etapas" aria-live="polite">
          {ETAPAS.map((etapa, i) => {
            const { status, titulo, texto, Icone } = etapa
            const classe = i < indiceAtual || pedido.status === 'entregue' ? 'feita' : i === indiceAtual ? 'atual' : ''
            return (
              <li key={status} className={`mesa-etapa ${classe}`} aria-current={i === indiceAtual ? 'step' : undefined}>
                <span className="mesa-etapa-icone">{classe === 'feita' ? <Check size={20} /> : <Icone size={20} />}</span>
                <span>
                  <strong>{titulo}</strong>
                  {i === indiceAtual && <small>{texto}</small>}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      {pedido && (
        <div className="mesa-cartao">
          <strong>Seu pedido</strong>
          <ul>
            {pedido.itens.map((item, i) => (
              <li key={i}>
                <span>{item.quantidade}× {item.produto_nome}</span>
                <span>{formatarCentavos(emCentavos(item.preco_unitario) * item.quantidade)}</span>
              </li>
            ))}
          </ul>
          <p className="mesa-total"><span>Total</span><strong>{formatarCentavos(emCentavos(pedido.total))}</strong></p>
        </div>
      )}

      {atualizadoEm && !FINAIS.includes(pedido?.status) && (
        <p className="mesa-atualizado">Atualiza sozinho · última consulta às {hora(atualizadoEm)}</p>
      )}

      <button type="button" className="mesa-btn mesa-btn-ghost mesa-largo" onClick={onNovoPedido}>Fazer outro pedido</button>
    </section>
  )
}
