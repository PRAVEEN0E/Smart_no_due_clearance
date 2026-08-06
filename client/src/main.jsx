import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { initSentry } from './lib/sentry'
import { registerServiceWorker } from './registerSW'

initSentry()
registerServiceWorker()

/* Suppress browser extension messaging errors ("Could not establish connection.
   Receiving end does not exist") caused by React DevTools / Redux DevTools
   trying to message disconnected content scripts during HMR. */
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('Could not establish connection') ||
      String(e.reason).includes('Receiving end does not exist')) {
    e.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter future={{ 
                v7_relativeSplatPath: true, 
                v7_startTransition: true,
                v7_fetcherPersist: true,
                v7_normalizeFormMethod: true,
                v7_partialHydration: true,
                v7_skipActionErrorRevalidation: true
            }}>
                <App />
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>,
)
