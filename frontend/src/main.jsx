import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Home from './pages/Home.jsx'
import Admin from './pages/Admin.jsx'

// HashRouter: GitHub Pages no soporta rutas del lado del servidor, por eso las rutas usan #/
createRoot(document.getElementById('root')).render(
  <HashRouter><Routes><Route path="/" element={<Home />} /><Route path="/admin" element={<Admin />} /></Routes></HashRouter>,
)
