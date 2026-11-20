import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { img } from '../api.js'
import { openChat } from './Chat.jsx'

const NAV = [['#servicios', 'Servicios'], ['#proceso', 'Proceso'], ['#asistente', 'Asistente IA'], ['#contacto', 'Contacto']]

// Barra fija: transparente sobre el hero y oscura al hacer scroll. En celular se abre como menú.
export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled || open ? 'bg-ink/95 shadow-lg backdrop-blur' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20 md:px-6">
        <a href="#top" className="flex items-center gap-3" aria-label="MotoLux, ir al inicio">
          <img src={img('logo-full.webp')} alt="" className="size-10 rounded-full object-cover ring-2 ring-gold/60 md:size-12" />
          <span className="font-display text-xl font-semibold tracking-wide text-ink-foreground md:text-2xl">MOTO<span className="text-gold">LUX</span></span>
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {NAV.map(([href, label]) => <a key={href} href={href} className="text-sm font-medium text-ink-foreground/80 transition-colors hover:text-gold">{label}</a>)}
          <button onClick={() => openChat()} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]">Agendar cita</button>
        </nav>
        <button className="rounded-md p-2 text-ink-foreground md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Móvil" className="border-t border-white/10 px-4 pb-6 md:hidden">
          <ul className="flex flex-col gap-1 pt-3">
            {NAV.map(([href, label]) => <li key={href}><a href={href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 text-base font-medium text-ink-foreground hover:bg-white/5">{label}</a></li>)}
          </ul>
          <button onClick={() => { setOpen(false); openChat() }} className="mt-3 w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink">Agendar cita con IA</button>
        </nav>
      )}
    </header>
  )
}
