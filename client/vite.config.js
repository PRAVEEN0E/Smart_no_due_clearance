import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        minify: 'terser',
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['framer-motion', 'lucide-react', 'recharts'],
                    'vendor-utils': ['axios', 'zustand', 'react-hot-toast']
                }
            }
        },
        chunkSizeWarningLimit: 1000
    },
    server: {
        port: 5173,
        host: true,
        hmr: {
            port: 5173
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true
            }
        }
    }
})
