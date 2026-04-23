import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/KEL12-Dashboard/',   // nome repo GitHub — aggiorna se necessario
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
