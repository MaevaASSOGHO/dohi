import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,           // écoute sur 0.0.0.0
    port: 5173,
    // hmr: { host: '10.10.148.70',
    //    clientPort: 5173,
    //   protocol: 'ws', 
    //  }, // ← ton IP
  },
})
