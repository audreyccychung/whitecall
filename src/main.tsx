import React from 'react'
import ReactDOM from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.tsx'
import './index.css'

// Register service worker for PWA functionality
// This enables: Add to Home Screen, standalone mode, future push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service worker registered:', registration.scope)

        // Check for updates on page load
        registration.update()

        // Listen for new service worker waiting to activate
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - for now, just log it
                // In the future, you could show a "refresh for updates" toast
                console.log('[App] New version available')
              }
            })
          }
        })
      })
      .catch((error) => {
        // Service worker registration failed - app still works, just without PWA features
        console.warn('[App] Service worker registration failed:', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <SpeedInsights />
  </React.StrictMode>,
)
