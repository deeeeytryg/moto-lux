import { motion } from 'framer-motion'
import { Bot, CalendarCheck, KeyRound, Sparkles } from 'lucide-react'
import { openChat } from './Chat.jsx'

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } }
const STEPS = [
  [Bot, 'Habla con Lux', 'Cuéntale qué moto tienes y qué necesita. Te recomienda el servicio ideal.'],
  [CalendarCheck, 'Elige día y hora', 'Lux consulta la agenda del taller en tiempo real y reserva tu cupo.'],
  [KeyRound, 'Entrega tu moto', 'Te recibimos con inspección visual y registro fotográfico del estado.'],
  [Sparkles, 'Recógela impecable', 'Entregamos tu moto lista para rodar, con recomendaciones de cuidado.'],
]
const SUGGESTIONS = ['¿Qué servicio me recomiendas para una Pulsar NS200?', '¿Cuánto cuesta el recubrimiento cerámico?', 'Quiero agendar un mantenimiento para mañana']

// "Cómo funciona" + presentación del asistente de IA (con preguntas de ejemplo que abren el chat).
export default function Process() {
  return (
    <>
      <section id="proceso" className="scroll-mt-20 bg-secondary/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">Cómo funciona</p>
          <h2 className="mt-2 max-w-xl text-4xl font-bold uppercase md:text-5xl">De la cita a la entrega</h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([Icon, title, text], i) => (
              <motion.li key={title} {...fade} transition={{ duration: 0.6, delay: i * 0.08 }} className="rounded-2xl bg-card p-6">
                <span className="font-display text-5xl font-bold text-accent/30" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                <Icon className="mt-2 size-7 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold uppercase">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
      <section id="asistente" className="scroll-mt-20 bg-primary py-20 text-primary-foreground md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <motion.div {...fade}>
            <p className="text-sm font-semibold tracking-[0.2em] text-gold uppercase">Asistente con IA</p>
            <h2 className="mt-2 text-4xl font-bold uppercase md:text-5xl">Conoce a Lux</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-primary-foreground/80">Lux conoce todo nuestro catálogo, precios y horarios. Resuelve tus dudas al instante, te recomienda el servicio adecuado según tu moto y agenda tu cita directamente en la agenda del taller, las 24 horas.</p>
            <button onClick={() => openChat()} className="mt-8 h-12 rounded-full bg-gold px-7 font-semibold text-ink hover:bg-gold/90">Iniciar conversación</button>
          </motion.div>
          <motion.div {...fade} className="rounded-2xl border border-white/10 bg-ink/40 p-6">
            <p className="text-sm font-medium text-primary-foreground/70">Prueba preguntando:</p>
            <ul className="mt-4 flex flex-col gap-3">
              {SUGGESTIONS.map((s) => <li key={s}><button onClick={() => openChat(s)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm hover:bg-white/10">{s}</button></li>)}
            </ul>
          </motion.div>
        </div>
      </section>
    </>
  )
}
