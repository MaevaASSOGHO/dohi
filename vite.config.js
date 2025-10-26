import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,           // écoute sur 0.0.0.0
    port: 5173,
    hmr: { host: '192.168.1.4' }, // ← ton IP
  },
})
