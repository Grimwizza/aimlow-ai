import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react'; // Import the tracker
import App from './App.jsx'
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Analytics /> {/* This runs silently in the background */}
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)