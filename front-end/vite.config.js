/* global process */
import os from 'node:os'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PORTA = 5173
const API_LOCAL = process.env.API_LOCAL || 'http://127.0.0.1:3000'

// IP deste computador na rede Wi-Fi/cabo (ex.: 192.168.0.10). O painel usa para montar
// o link do QR code, já que "localhost" no celular é o próprio celular.
// Ignora adaptadores virtuais (WSL, Hyper-V, VirtualBox, Docker, VPN).
function ipDaRede() {
  const virtual = /vethernet|wsl|hyper-v|virtualbox|vmware|docker|loopback|tailscale|zerotier/i
  const candidatos = []
  for (const [nome, enderecos] of Object.entries(os.networkInterfaces())) {
    if (virtual.test(nome)) continue
    for (const e of enderecos || []) {
      if (e.family === 'IPv4' && !e.internal) candidatos.push(e.address)
    }
  }
  const prioridade = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2)
  return candidatos.sort((a, b) => prioridade(a) - prioridade(b))[0] || null
}

const ip = ipDaRede()

export default defineConfig({
  plugins: [react()],
  define: {
    __URL_REDE__: JSON.stringify(ip ? `http://${ip}:${PORTA}` : ''),
  },
  server: {
    port: PORTA,
    host: true,
    // O front chama /api e /uploads no mesmo endereço; o Vite repassa para o back-end.
    // Assim o celular só precisa alcançar a porta 5173.
    proxy: {
      '/api': API_LOCAL,
      '/uploads': API_LOCAL,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
