import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

// Vite only auto-detects JSX in .jsx/.tsx; this plugin makes .js files work too.
const jsAsJsx = {
  name: 'js-as-jsx',
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null
    return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic', jsxImportSource: 'react' })
  },
}

export default defineConfig({
  base: '/toponimia-cantabria/',
  plugins: [jsAsJsx, react()],
  envPrefix: 'REACT_APP_',
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})
