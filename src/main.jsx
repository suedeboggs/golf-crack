import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { RoundProvider } from './context/RoundContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoundProvider>
      <App />
    </RoundProvider>
  </React.StrictMode>,
)
