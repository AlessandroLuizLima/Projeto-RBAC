import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import MesaPage from './MesaPage'

const PRODUTOS = [
  { id: 1, nome: 'Espresso', descricao: 'Café puro', preco: '5.00', categoria: 'cafe', imagem_url: '/uploads/produtos/a.png', disponivel: true, max_quantidade: 10 },
  { id: 2, nome: 'Cappuccino', descricao: 'Com leite', preco: '9.00', categoria: 'cafe', imagem_url: null, disponivel: true, max_quantidade: 2 },
  { id: 3, nome: 'Croissant', descricao: 'Manteiga', preco: '8.00', categoria: 'salgado', imagem_url: null, disponivel: false, max_quantidade: 0 },
]

const json = (status, corpo) => Promise.resolve({ ok: status < 400, status, json: async () => corpo })

// Servidor falso. `postHandler` permite simular sucesso, 409, 429, lentidão...
function instalarFetch({ cardapio = () => json(200, { mesa: 7, produtos: PRODUTOS }), post = () => json(201, { id: 55, mesa: 7, status: 'pendente', total: 23 }) } = {}) {
  const fn = vi.fn((url, opts = {}) => (opts.method === 'POST' ? post(url, opts) : cardapio(url, opts)))
  globalThis.fetch = fn
  return fn
}

function Local() {
  const l = useLocation()
  return <div data-testid="local">{l.pathname + l.search}</div>
}

function abrir(url = '/mesa/7?t=tok123') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes><Route path="/mesa/:numero" element={<MesaPage />} /></Routes>
      <Local />
    </MemoryRouter>,
  )
}

async function irParaCardapio(user) {
  await user.click(screen.getByRole('button', { name: /toque para começar/i }))
  await screen.findByText('Espresso')
}

const posts = (fetchFn) => fetchFn.mock.calls.filter(([, o]) => o?.method === 'POST')

beforeEach(() => instalarFetch())

describe('fluxo completo do cliente', () => {
  test('boas-vindas → cardápio → incluir → avançar → observação → concluir → confirmação', async () => {
    const fetchFn = instalarFetch()
    const user = userEvent.setup()
    abrir()

    // 1) boas-vindas
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/seja muito bem-vindo à cafeteria\s*café grão/i)
    await irParaCardapio(user)

    // 2) sem itens não existe "Avançar"
    expect(screen.queryByRole('button', { name: /avançar/i })).not.toBeInTheDocument()
    expect(screen.getByText('Café puro')).toBeInTheDocument() // descrição
    expect(screen.getByText(/R\$\s*5,00/)).toBeInTheDocument() // valor

    // 3) incluir 1 Espresso + 2 Cappuccino
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: 'Incluir Cappuccino' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar Cappuccino' }))
    const avancar = screen.getByRole('button', { name: /avançar/i })
    expect(avancar).toHaveTextContent(/3 itens · R\$\s*23,00/)

    // 4) resumo com observação
    await user.click(avancar)
    expect(screen.getByRole('heading', { name: 'Seu pedido' })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/observações/i), 'Café sem açúcar')
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))

    // 5) confirmação
    expect(await screen.findByRole('heading', { name: /pedido enviado/i })).toBeInTheDocument()
    expect(screen.getByText(/aguarde um instante/i)).toBeInTheDocument()
    expect(screen.getByText('#55')).toBeInTheDocument()

    // O que foi para o servidor: token no header, itens e observação, SEM preço/total
    const [url, opts] = posts(fetchFn)[0]
    expect(url).toMatch(/\/publico\/mesa\/7\/pedidos$/)
    expect(opts.headers['x-mesa-token']).toBe('tok123')
    expect(JSON.parse(opts.body)).toEqual({
      itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 2, quantidade: 2 }],
      observacao: 'Café sem açúcar',
    })
  })

  test('"Fazer outro pedido" volta ao cardápio com o carrinho vazio', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))
    await user.click(await screen.findByRole('button', { name: /fazer outro pedido/i }))
    expect(await screen.findByRole('button', { name: 'Incluir Espresso' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /avançar/i })).not.toBeInTheDocument()
  })

  test('"Acompanhar meu pedido" mostra o status atual e os itens do pedido', async () => {
    const PEDIDO = { id: 55, status: 'em_preparo', total: '5.00', observacao: null,
      itens: [{ produto_nome: 'Espresso', quantidade: 1, preco_unitario: '5.00' }] }
    const fetchFn = instalarFetch({
      cardapio: (url) => (/\/pedidos\/55$/.test(url) ? json(200, PEDIDO) : json(200, { mesa: 7, produtos: PRODUTOS })),
    })
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))
    await user.click(await screen.findByRole('button', { name: /acompanhar meu pedido/i }))

    expect(await screen.findByText('1× Espresso')).toBeInTheDocument()
    const atual = document.querySelector('[aria-current="step"]')
    expect(atual).toHaveTextContent(/em preparo/i)
    const consulta = fetchFn.mock.calls.find(([url]) => /\/pedidos\/55$/.test(url))
    expect(consulta[1].headers['x-mesa-token']).toBe('tok123')

    // Ao voltar ao cardápio, continua dando para acompanhar o pedido.
    await user.click(screen.getByRole('button', { name: /fazer outro pedido/i }))
    expect(await screen.findByRole('button', { name: /acompanhar pedido #55/i })).toBeInTheDocument()
  })

  test('segue sozinho para o cardápio depois da animação', async () => {
    vi.useFakeTimers()
    abrir()
    await act(async () => { await vi.advanceTimersByTimeAsync(8100) })
    expect(screen.getByRole('heading', { name: /faça o seu pedido/i })).toBeInTheDocument()
  })
})

describe('cardápio', () => {
  test('produto sem estoque aparece como Indisponível e não pode ser incluído', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    expect(screen.getByRole('button', { name: 'Indisponível' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Incluir Croissant' })).not.toBeInTheDocument()
  })

  test('o botão + para no máximo permitido pelo estoque (Cappuccino: 2)', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Cappuccino' }))
    await user.click(screen.getByRole('button', { name: 'Aumentar Cappuccino' }))
    expect(screen.getByRole('button', { name: 'Aumentar Cappuccino' })).toBeDisabled()
  })

  test('agrupa por categoria', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    expect(screen.getByRole('heading', { name: 'Cafés' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Salgados' })).toBeInTheDocument()
  })

  test('imagem do produto vem da API (mesmo endereço ou VITE_API_URL); sem imagem mostra o ícone padrão', async () => {
    const user = userEvent.setup()
    const { container } = abrir()
    await irParaCardapio(user)
    const imgs = container.querySelectorAll('img.mesa-img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0].getAttribute('src')).toMatch(/^(https?:\/\/[^/]+)?\/uploads\/produtos\/a\.png$/)
    expect(container.querySelectorAll('.mesa-img-vazia')).toHaveLength(2)
  })

  test('falha no carregamento mostra erro e "Tentar de novo" funciona', async () => {
    let tentativa = 0
    instalarFetch({ cardapio: () => (++tentativa === 1 ? Promise.reject(new TypeError('offline')) : json(200, { mesa: 7, produtos: PRODUTOS })) })
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByRole('button', { name: /toque para começar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sem conexão/i)
    await user.click(screen.getByRole('button', { name: /tentar de novo/i }))
    expect(await screen.findByText('Espresso')).toBeInTheDocument()
  })
})

describe('segurança da mesa / token', () => {
  test('sem token no link nem na sessão → "QR code inválido" e nenhuma chamada à API', () => {
    const fetchFn = instalarFetch()
    abrir('/mesa/7')
    expect(screen.getByRole('alert')).toHaveTextContent(/qr code inválido/i)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  test('API recusa o token (401) → "QR code inválido"', async () => {
    instalarFetch({ cardapio: () => json(401, { erro: 'Acesso à mesa não autorizado.' }) })
    abrir()
    expect(await screen.findByText(/qr code inválido/i)).toBeInTheDocument()
  })

  test('o token é tirado da barra de endereço, mas continua valendo ao recarregar', async () => {
    const { unmount } = abrir('/mesa/7?t=tok123')
    await waitFor(() => expect(screen.getByTestId('local')).toHaveTextContent(/^\/mesa\/7$/))
    unmount()
    const fetchFn = instalarFetch()
    abrir('/mesa/7') // "recarregou" sem ?t=
    await waitFor(() => expect(fetchFn).toHaveBeenCalled())
    expect(fetchFn.mock.calls[0][1].headers['x-mesa-token']).toBe('tok123')
  })
})

describe('envio do pedido', () => {
  test('duplo clique em "Concluir" envia UM pedido só', async () => {
    let liberar
    const fetchFn = instalarFetch({ post: () => new Promise((resolve) => { liberar = () => resolve({ ok: true, status: 201, json: async () => ({ id: 9, mesa: 7, status: 'pendente', total: 5 }) }) }) })
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    const concluir = screen.getByRole('button', { name: /concluir pedido/i })
    fireEvent.click(concluir)
    fireEvent.click(concluir)
    fireEvent.click(concluir)
    expect(posts(fetchFn)).toHaveLength(1)
    expect(await screen.findByRole('button', { name: /enviando/i })).toBeDisabled()
    await act(async () => liberar())
    expect(await screen.findByRole('heading', { name: /pedido enviado/i })).toBeInTheDocument()
    expect(posts(fetchFn)).toHaveLength(1)
  })

  test('409 (acabou o estoque): volta ao cardápio, atualiza e avisa', async () => {
    let cardapioCalls = 0
    instalarFetch({
      cardapio: () => {
        cardapioCalls += 1
        const produtos = cardapioCalls === 1 ? PRODUTOS : PRODUTOS.map((p) => (p.id === 1 ? { ...p, disponivel: false, max_quantidade: 0 } : p))
        return json(200, { mesa: 7, produtos })
      },
      post: () => json(409, { erro: 'Espresso está indisponível ou sem estoque suficiente.' }),
    })
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: 'Incluir Cappuccino' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))

    expect(await screen.findByText(/espresso está indisponível.*revise o seu pedido/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /faça o seu pedido/i })).toBeInTheDocument()
    // Espresso esgotou e saiu do carrinho; Cappuccino continua lá
    expect(screen.getAllByRole('button', { name: 'Indisponível' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /avançar/i })).toHaveTextContent(/1 item · R\$\s*9,00/)
  })

  test('429: mostra aviso e mantém o pedido na tela para tentar depois', async () => {
    instalarFetch({ post: () => json(429, { erro: 'Muitas requisições. Tente novamente em instantes.' }) })
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/muitos pedidos em pouco tempo/i)
    expect(screen.getByRole('button', { name: /concluir pedido/i })).toBeEnabled()
  })

  test('erro de rede no envio: mensagem e botão liberado (carrinho preservado)', async () => {
    instalarFetch({ post: () => Promise.reject(new TypeError('offline')) })
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: /concluir pedido/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sem conexão/i)
    expect(screen.getByRole('button', { name: /concluir pedido/i })).toBeEnabled()
    expect(screen.getByText('Espresso')).toBeInTheDocument()
  })

  test('observação limitada a 200 caracteres', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    expect(screen.getByLabelText(/observações/i)).toHaveAttribute('maxlength', '200')
  })

  test('no resumo dá para remover tudo: Concluir fica desabilitado', async () => {
    const user = userEvent.setup()
    abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    await user.click(screen.getByRole('button', { name: /avançar/i }))
    await user.click(screen.getByRole('button', { name: 'Diminuir Espresso' }))
    expect(screen.getByText(/seu pedido está vazio/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /concluir pedido/i })).toBeDisabled()
  })
})

describe('carrinho sobrevive a recarregar a página', () => {
  test('itens voltam depois de remontar (sessionStorage)', async () => {
    const user = userEvent.setup()
    const { unmount } = abrir()
    await irParaCardapio(user)
    await user.click(screen.getByRole('button', { name: 'Incluir Espresso' }))
    unmount()

    abrir('/mesa/7')
    await user.click(screen.getByRole('button', { name: /toque para começar/i }))
    expect(await screen.findByRole('button', { name: /avançar/i })).toHaveTextContent(/1 item/)
  })
})
