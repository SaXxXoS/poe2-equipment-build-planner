import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/poe2-equipment-build-planner/' : '/',
  plugins: [react()],
  build:{rollupOptions:{input:{main:'index.html',realPassiveWorker:'src/runtime/real-passive-worker/worker.ts'}}},
}))
