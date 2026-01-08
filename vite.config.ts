import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use root base path so built assets resolve correctly on direct-route refreshes
  base: '/',
  plugins: [react()],
})
