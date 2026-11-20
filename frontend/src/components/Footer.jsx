import { Link } from 'react-router-dom'
import { Clock, MessageCircle, Phone } from 'lucide-react'
import { img } from '../api.js'
import { BUSINESS } from '../business.js'

export default function Footer() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-6">
        <div className="flex items-center gap-4">
          <img src={img('logo-full.webp')} alt="Logo de MotoLux" className="size-16 rounded-full object-cover ring-2 ring-gold/50" />
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide">MOTO<span className="text-gold">LUX</span></p>
            <p className="text-sm text-ink-foreground/60">Detailing · Premium Care · Mecánica</p>
          </div>
        </div>
        <ul className="grid gap-2 text-sm text-ink-foreground/80">
          <li className="flex items-center gap-2"><Phone className="size-4 text-gold" aria-hidden />{BUSINESS.phone}</li>
          <li className="flex items-center gap-2"><Clock className="size-4 text-gold" aria-hidden />{BUSINESS.hours}</li>
          <li className="flex items-center gap-2"><MessageCircle className="size-4 text-gold" aria-hidden />
            <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Escríbenos por WhatsApp</a></li>
        </ul>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-foreground/70 md:col-span-2">
          <a href="#servicios" className="hover:text-gold">Servicios</a>
          <a href="#contacto" className="hover:text-gold">Contacto</a>
          <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Instagram</a>
          <Link to="/admin" className="hover:text-gold">Panel administrativo</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ink-foreground/50">© {new Date().getFullYear()} MotoLux. Todos los derechos reservados.</div>
    </footer>
  )
}
