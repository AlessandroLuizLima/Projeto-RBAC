import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BoasVindas from '../../components/mesa/BoasVindas'
import Cardapio from '../../components/mesa/Cardapio'
import Resumo from '../../components/mesa/Resumo'
import Confirmacao from '../../components/mesa/Confirmacao'
import { NOME_CAFE } from '../../config/cafe'
import { alterar, linhas, montarPedido, reconciliar, totalCentavos } from '../../lib/carrinho'
import { lerCarrinho, resolverToken, salvarCarrinho } from '../../lib/sessaoMesa'
import { buscarCardapio, enviarPedido } from '../../services/publicoApi'
import '../../styles/mesa.css'

function QrInvalido() {
  return (
    <main className="mesa-app">
      <section className="mesa-tela mesa-confirmacao" role="alert">
        <h1 className="mesa-titulo">QR code inválido</h1>
        <p className="mesa-sub">
          Não conseguimos abrir esta mesa. Escaneie o QR code da mesa de novo ou chame um atendente.
        </p>
      </section>
    </main>
  )
}

function MesaFluxo({ numero }) {
  const location = useLocation()
  const navigate = useNavigate()

  // O token vem do QR (?t=) e é guardado na sessão; fica no estado para sobreviver à limpeza da URL.
  const [token] = useState(() => resolverToken(numero, location.search))

  const [etapa, setEtapa] = useState('boas-vindas') // boas-vindas | cardapio | resumo | confirmado
  const [cardapio, setCardapio] = useState({ estado: token ? 'carregando' : 'invalido', produtos: [], erro: '' })
  const [carrinho, setCarrinho] = useState(() => lerCarrinho(numero))
  const [observacao, setObservacao] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [pedido, setPedido] = useState(null)
  const enviandoRef = useRef(false) // trava duplo clique antes mesmo do re-render

  // Tira o token da barra de endereço (não fica no histórico nem em prints/compartilhamentos).
  useEffect(() => {
    if (new URLSearchParams(location.search).has('t')) navigate(location.pathname, { replace: true })
  }, [location.pathname, location.search, navigate])

  useEffect(() => {
    document.title = `${NOME_CAFE} · Mesa ${numero}`
  }, [numero])

  useEffect(() => {
    salvarCarrinho(numero, carrinho)
  }, [numero, carrinho])

  const carregar = useCallback(async () => {
    try {
      const dados = await buscarCardapio(numero, token)
      setCardapio({ estado: 'pronto', produtos: dados.produtos, erro: '' })
      return dados.produtos
    } catch (e) {
      setCardapio({ estado: e.status === 401 ? 'invalido' : 'erro', produtos: [], erro: e.message })
      return null
    }
  }, [numero, token])

  useEffect(() => {
    if (!token) return undefined
    let ativo = true
    carregar().then((produtos) => {
      if (ativo && produtos) setCarrinho((atual) => reconciliar(atual, produtos).carrinho)
    })
    return () => { ativo = false }
  }, [token, carregar])

  const comecar = useCallback(() => setEtapa('cardapio'), [])

  const irPara = (proxima) => {
    setEtapa(proxima)
    window.scrollTo?.(0, 0)
  }

  const aoAlterar = (produto, delta) => {
    setAviso('')
    setCarrinho((atual) => alterar(atual, produto.id, delta, produto))
  }

  const tentarNovamente = () => {
    setCardapio((c) => ({ ...c, estado: 'carregando' }))
    carregar().then((produtos) => {
      if (produtos) setCarrinho((atual) => reconciliar(atual, produtos).carrinho)
    })
  }

  const concluir = async () => {
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    setErroEnvio('')

    try {
      const criado = await enviarPedido(numero, token, montarPedido(carrinho, observacao))
      setPedido(criado)
      setCarrinho({})
      setObservacao('')
      irPara('confirmado')
    } catch (e) {
      if (e.status === 401) {
        setCardapio((c) => ({ ...c, estado: 'invalido' }))
      } else if (e.status === 409) {
        // Alguém levou o último item enquanto o cliente decidia: atualiza e devolve ao cardápio.
        const produtos = await carregar()
        if (produtos) setCarrinho(reconciliar(carrinho, produtos).carrinho)
        setAviso(`${e.message} Revise o seu pedido e tente de novo.`)
        irPara('cardapio')
      } else if (e.status === 429) {
        setErroEnvio('Você fez muitos pedidos em pouco tempo. Chame um atendente.')
      } else {
        setErroEnvio(e.message)
      }
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  if (cardapio.estado === 'invalido') return <QrInvalido />

  const itens = linhas(carrinho, cardapio.produtos)
  const total = totalCentavos(carrinho, cardapio.produtos)

  return (
    <main className="mesa-app">
      {etapa === 'boas-vindas' && <BoasVindas nomeCafe={NOME_CAFE} numeroMesa={numero} onComecar={comecar} />}

      {etapa === 'cardapio' && (
        <Cardapio
          nomeCafe={NOME_CAFE}
          numeroMesa={numero}
          estado={cardapio.estado}
          erro={cardapio.erro}
          aviso={aviso}
          produtos={cardapio.produtos}
          carrinho={carrinho}
          totalEmCentavos={total}
          onAlterar={aoAlterar}
          onAvancar={() => irPara('resumo')}
          onTentarNovamente={tentarNovamente}
        />
      )}

      {etapa === 'resumo' && (
        <Resumo
          nomeCafe={NOME_CAFE}
          numeroMesa={numero}
          itens={itens}
          totalEmCentavos={total}
          observacao={observacao}
          enviando={enviando}
          erro={erroEnvio}
          onObservacao={setObservacao}
          onAlterar={aoAlterar}
          onVoltar={() => irPara('cardapio')}
          onConcluir={concluir}
        />
      )}

      {etapa === 'confirmado' && pedido && (
        <Confirmacao pedido={pedido} onNovoPedido={() => { setPedido(null); carregar(); irPara('cardapio') }} />
      )}
    </main>
  )
}

export default function MesaPage() {
  const { numero } = useParams()
  // key: trocar de mesa na URL reinicia todo o fluxo (token, carrinho, etapa).
  return <MesaFluxo key={numero} numero={numero} />
}
