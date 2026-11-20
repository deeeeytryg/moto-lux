import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader2, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { api, cop, dur, img } from '../api.js'
import Chat, { openChat } from '../components/Chat.jsx'
import Header from '../components/Header.jsx'
import Process from '../components/Process.jsx'
import Footer from '../components/Footer.jsx'

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } }
const CAT = { detailing: 'Detailing', mecanica: 'Mecánica' }
const CC = { todas: 'Todo cilindraje', bajo: 'Bajo cilindraje', alto: 'Alto cilindraje' }

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      <img src={img('hero-moto.webp')} alt="Moto deportiva con acabado de detailing premium" className="absolute inset-0 -z-20 size-full object-cover object-right opacity-70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
      <div className="mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-4 py-24 md:px-6">
        <motion.p {...{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }} className="mb-5 w-fit rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-gold uppercase">Bajo y alto cilindraje</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl text-5xl leading-[1.02] font-bold uppercase md:text-7xl">Tu moto merece <span className="text-gold">brillar</span> y rodar perfecta</motion.h1>
        <p className="mt-6 max-w-xl text-lg text-ink-foreground/80">Detailing premium y mecánica de precisión. Agenda en segundos con Lux, nuestro asistente con inteligencia artificial.</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => openChat()} className="h-12 rounded-full bg-gold px-7 font-semibold text-ink hover:bg-gold/90">Agendar con el asistente IA</button>
          <a href="#servicios" className="inline-flex h-12 items-center justify-center rounded-full border border-ink-foreground/30 px-7 hover:border-gold hover:text-gold">Ver servicios</a>
        </div>
        <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-foreground/80">
          {[[Sparkles, 'Detailing premium'], [Wrench, 'Mecánica especializada'], [ShieldCheck, 'Garantía en cada servicio']].map(([I, t]) => <li key={t} className="flex items-center gap-2"><I className="size-4 text-gold" />{t}</li>)}
        </ul>
      </div>
    </section>
  )
}

function Services() {
  const [services, setServices] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todos')
  useEffect(() => { api('/api/services').then((d) => setServices(d.services)).catch((e) => setError(e.message)) }, [])
  const visible = (services ?? []).filter((s) => filter === 'todos' || s.category === filter)
  return (
    <section id="servicios" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div {...fade} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl"><p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">Catálogo</p>
            <h2 className="mt-2 text-4xl font-bold uppercase md:text-5xl">Servicios para tu nave</h2>
            <p className="mt-4 text-muted-foreground">Precios de referencia en pesos colombianos. El valor final depende del modelo y estado de la moto.</p></div>
          <div role="tablist" className="flex gap-1 rounded-full bg-secondary p-1">
            {[['todos', 'Todos'], ['detailing', 'Detailing'], ['mecanica', 'Mecánica']].map(([v, l]) => (
              <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`rounded-full px-5 py-2 text-sm font-medium ${filter === v ? 'bg-primary text-primary-foreground' : 'text-foreground/70'}`}>{l}</button>))}
          </div>
        </motion.div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[['detailing', 'detailing.webp', 'Detailing premium', 'Productos profesionales y protección duradera para pintura, cromados y plásticos.'], ['mecanica', 'mecanica.webp', 'Mecánica de precisión', 'Mantenimiento, frenos, transmisión y diagnóstico electrónico.']]
            .filter(([k]) => filter === 'todos' || filter === k).map(([k, f, t, d]) => (
              <motion.article key={k} {...fade} className={`relative isolate flex min-h-64 items-end overflow-hidden rounded-2xl p-6 text-ink-foreground ${filter !== 'todos' ? 'md:col-span-2' : ''}`}>
                <img src={img(f)} alt={t} loading="lazy" className="absolute inset-0 -z-20 size-full object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <div><h3 className="text-2xl font-semibold uppercase">{t}</h3><p className="mt-2 max-w-md text-sm">{d}</p></div></motion.article>))}
        </div>
        {!services && !error && <p className="mt-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando servicios… (si el servidor estaba dormido puede tardar unos segundos)</p>}
        {error && <p role="alert" className="mt-10 text-destructive">{error}</p>}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <motion.li key={s.id} {...fade} className="flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-accent hover:shadow-xl">
              <div className="flex items-center justify-between text-xs"><span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{CAT[s.category]}</span><span className="text-muted-foreground">{CC[s.cilindraje]}</span></div>
              <h3 className="mt-4 text-xl font-semibold uppercase leading-tight">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
                <div><p className="text-xs text-muted-foreground">Desde</p><p className="font-display text-2xl font-semibold text-primary">{cop(s.priceFrom)}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3.5" />{dur(s.durationMin)}</p></div>
                <button onClick={() => openChat(`Quiero agendar el servicio "${s.name}"`)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-ink">Agendar</button>
              </div>
            </motion.li>))}
        </ul>
      </div>
    </section>
  )
}

function Contact() {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' })
  const [state, setState] = useState({ busy: false, ok: '', error: '', fields: {} })
  async function submit(e) {
    e.preventDefault(); setState({ busy: true, ok: '', error: '', fields: {} })
    try { const d = await api('/api/contact', { method: 'POST', body: f }); setState({ busy: false, ok: d.message, error: '', fields: {} }); setF({ name: '', email: '', phone: '', message: '' }) }
    catch (err) { setState({ busy: false, ok: '', error: err.message, fields: err.fieldErrors ?? {} }) }
  }
  const field = (k, label, type = 'text') => (
    <div className="flex flex-col gap-1.5"><label htmlFor={k} className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</label>
      {k === 'message' ? <textarea id={k} rows={4} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="rounded-lg border border-input bg-background px-3 py-2" />
        : <input id={k} type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-11 rounded-lg border border-input bg-background px-3" />}
      {state.fields[k] && <p role="alert" className="text-sm text-destructive">{state.fields[k]}</p>}</div>)
  return (
    <section id="contacto" className="scroll-mt-20 bg-secondary/50 py-20">
      <div className="mx-auto max-w-2xl px-4">
        <motion.h2 {...fade} className="text-4xl font-bold uppercase">Contáctanos</motion.h2>
        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6">
          {field('name', 'Nombre')}{field('email', 'Correo', 'email')}{field('phone', 'Teléfono', 'tel')}{field('message', 'Mensaje')}
          {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
          {state.ok && <p role="status" className="text-sm text-success">{state.ok}</p>}
          <button disabled={state.busy} className="h-11 rounded-lg bg-gold font-semibold text-ink disabled:opacity-60">{state.busy ? 'Enviando…' : 'Enviar mensaje'}</button>
        </form>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Header />
      <main><Hero /><Services /><Process /><Contact /></main>
      <Footer />
      <Chat />
    </>
  )
}
