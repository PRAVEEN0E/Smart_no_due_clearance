import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const plugins = [react()]

// Async-load the built CSS bundle: the booting screen + body styles are already
// inline in index.html, so index.css is not needed for first paint. Blocking on
// it wastes ~1s under Lighthouse throttling. Loaded as preload-as-style + onload
// swap so it still applies before React renders (JS ships slower than 16KB CSS).
// Transform only built files (dev serves CSS via its own pipeline).
const asyncCssPlugin = {
    name: 'async-css',
    apply: 'build',
    transformIndexHtml: {
        order: 'post',
        handler(html) {
            return html.replace(
                /<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g,
                (match, href) => `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'" />\n  <noscript><link rel="stylesheet" href="${href}" /></noscript>`
            )
        },
    },
}

if (process.env.ANALYZE === 'true') {
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }))
}

export default defineConfig({
    plugins: [...plugins, asyncCssPlugin],
    build: {
        minify: process.env.NO_MINIFY === 'true' ? false : 'terser',
        cssMinify: true,
        target: 'es2020',
        terserOptions: {
            compress: {
                passes: 2,
                drop_console: true,
                pure_funcs: ['console.log', 'console.debug'],
            },
            mangle: true,
        },
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // react/jsx-runtime MUST stay in the eager vendor-react group:
                    // recharts/framer-motion claim it first otherwise, and since
                    // every JSX file imports jsx-runtime, vendor-ui would get
                    // pulled into EVERY chunk including the landing entry.
                    // (Function form, NOT the array form: the jsx-runtime module
                    // id is 'react/jsx-runtime.js?commonjs-module' etc., which
                    // never equals the array-form entry 'react/jsx-runtime'.)
                    if (id.includes('node_modules')) {
                        if (id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) return 'vendor-react';
                        // lucide-react MUST stay separate from framer-motion/recharts:
                        // the landing page uses lucide icons eagerly (PublicLayout),
                        // so grouping it with the heavy dashboard libs would pull
                        // the whole vendor-ui chunk onto public routes.
                        if (id.includes('lucide-react')) return 'vendor-icons';
                        if (id.includes('framer-motion') || id.includes('recharts')) return 'vendor-ui';
                        if (id.includes('axios') || id.includes('zustand') || id.includes('react-hot-toast')) return 'vendor-utils';
                        if (id.includes('react-markdown') || id.includes('rehype-sanitize') || id.includes('remark-gfm')) return 'vendor-markdown';
                        if (id.includes('html5-qrcode')) return 'vendor-scanner';
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-helmet-async')) return 'vendor-react';
                    }
                },
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
