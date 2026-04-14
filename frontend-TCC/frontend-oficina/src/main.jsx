import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // ADICIONA ESTA LINHA
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* ADICIONA O WRAPPER AQUI */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)