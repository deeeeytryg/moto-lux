import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { api } from '../api.js'

const HELLO = '¡Hola! Soy Lux, el asistente de MotoLux 🏍️ Te cuento de nuestros servicios o agendamos tu cita. ¿Qué necesita tu moto?'

export default function Chat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: HELLO }])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const end = useRef(null)

  useEffect(() => { // permite abrir el chat desde cualquier botón con un evento global
    const h = (e) => { setOpen(true); if (e.detail) send(e.detail) }
    window.addEventListener('motolux:chat', h); return () => window.removeEventListener('motolux:chat', h)
  })
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])

  async function send(content) {
    if (!content.trim() || busy) return
    const next = [...msgs, { role: 'user', content: content.trim() }]
    setMsgs(next); setText(''); setBusy(true); setError('')
    try {
      const { reply, booking } = await api('/api/chat', { method: 'POST', body: { messages: next.map(({ role, content }) => ({ role, content })) } })
      setMsgs([...next, { role: 'assistant', content: reply, booking }])
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Abrir asistente" className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-semibold text-ink shadow-xl hover:scale-105 transition">
          <MessageCircle className="size-5" /> Lux IA
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            aria-label="Asistente Lux" className="fixed inset-x-2 bottom-2 z-50 flex h-[34rem] max-h-[85svh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:right-4 sm:left-auto sm:w-96">
            <header className="flex items-center justify-between bg-ink px-4 py-3 text-ink-foreground">
              <p className="font-display text-lg font-semibold">Lux · Asistente MotoLux</p>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded p-1 hover:bg-white/10"><X className="size-5" /></button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start gap-2'}>
                  <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{m.content}</p>
                  {m.booking?.ok && (
                    <div className="flex gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
                      <CheckCircle2 className="size-5 text-success" />
                      <div><p className="font-semibold">Cita registrada #{m.booking.id}</p><p>{m.booking.servicio} · {m.booking.fecha} {m.booking.hora}</p></div>
                    </div>
                  )}
                </div>
              ))}
              {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Lux está escribiendo…</p>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div ref={end} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex gap-2 border-t border-border p-3">
              <label htmlFor="chat-input" className="sr-only">Mensaje</label>
              <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Escribe tu mensaje…" className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
              <button disabled={busy || !text.trim()} aria-label="Enviar" className="grid size-10 place-items-center rounded-lg bg-gold text-ink disabled:opacity-50"><Send className="size-4" /></button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
export const openChat = (msg) => window.dispatchEvent(new CustomEvent('motolux:chat', { detail: msg }))
