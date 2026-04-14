import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Set initial theme from localStorage (avoids flash on load)
const stored = localStorage.getItem('the-block-theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
document.documentElement.setAttribute('data-theme', theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
