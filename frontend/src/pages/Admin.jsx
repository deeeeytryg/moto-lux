import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, LogOut, Trash2 } from 'lucide-react'
import { api, cop, getToken, setToken } from '../api.js'

const STATUS = ['pendiente', 'confirmada', 'completada', 'cancelada']
const input = 'h-10 rounded-lg border border-input bg-background px-3 text-sm'

function Login({ onDone }) {
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { const d = await api('/api/admin/login', { method: 'POST', body: f }); setToken(d.token); onDone() }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4 rounded-2xl bg-card p-8">
        <h1 className="text-3xl font-bold uppercase">Admin MotoLux</h1>
        <label className="grid gap-1 text-sm">Correo<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={input} /></label>
        <label className="grid gap-1 text-sm">Contraseña<input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={input} /></label>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="h-11 rounded-lg bg-gold font-semibold text-ink disabled:opacity-60">{busy ? 'Entrando…' : 'Entrar'}</button>
        <Link to="/" className="text-center text-sm text-muted-foreground hover:underline">← Volver al sitio</Link>
      </form>
    </main>
  )
}

function Dashboard({ onLogout }) {
  const [data, setData] = useState(null); const [tab, setTab] = useState('citas'); const [err, setErr] = useState('')
  const load = useCallback(() => api('/api/admin/data').then(setData).catch((e) => { if (e.status === 401) onLogout(); else setErr(e.message) }), [onLogout])
  useEffect(() => { load() }, [load])
  const act = (path, method, body) => api(path, { method, body }).then(load).catch((e) => setErr(e.message))
  if (!data) return <p className="grid min-h-svh place-items-center">{err || <Loader2 className="animate-spin" />}</p>
  const name = (id) => data.services.find((s) => s.id === id)?.name ?? id
  const unread = data.messages.filter((m) => !m.read).length

  function NewService() {
    const [f, setF] = useState({ name: '', category: 'detailing', cilindraje: 'todas', priceFrom: 50000, durationMin: 60, description: '' })
    return (
      <form onSubmit={(e) => { e.preventDefault(); act('/api/admin/services', 'POST', f) }} className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
        <input required placeholder="Nombre" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={input}><option value="detailing">Detailing</option><option value="mecanica">Mecánica</option></select>
        <select value={f.cilindraje} onChange={(e) => setF({ ...f, cilindraje: e.target.value })} className={input}><option value="todas">Todo cilindraje</option><option value="bajo">Bajo</option><option value="alto">Alto</option></select>
        <input type="number" min={0} step={1000} value={f.priceFrom} onChange={(e) => setF({ ...f, priceFrom: Number(e.target.value) })} className={input} />
        <input type="number" min={15} step={15} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} className={input} />
        <input required placeholder="Descripción (mín. 10 caracteres)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={input} />
        <button className="h-10 rounded-lg bg-gold font-semibold text-ink sm:col-span-3">Agregar servicio</button>
      </form>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center justify-between bg-ink px-4 py-4 text-ink-foreground md:px-8">
        <p className="font-display text-xl font-semibold">MOTO<span className="text-gold">LUX</span> Admin</p>
        <div className="flex gap-3 text-sm"><Link to="/" className="hover:text-gold">Ver sitio</Link>
          <button onClick={() => { setToken(null); onLogout() }} className="flex items-center gap-1 hover:text-gold"><LogOut className="size-4" /> Salir</button></div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[['Citas', data.appointments.length], ['Pendientes', data.appointments.filter((a) => a.status === 'pendiente').length], ['Agendadas por IA', data.appointments.filter((a) => a.source === 'chatbot').length], ['Clientes', data.clients.length]].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-5"><dt className="text-sm text-muted-foreground">{l}</dt><dd className="font-display text-4xl font-semibold text-primary">{v}</dd></div>))}
        </dl>
        {err && <p role="alert" className="mt-4 text-destructive">{err}</p>}
        <div role="tablist" className="mt-8 flex gap-1 overflow-x-auto rounded-full bg-secondary p-1">
          {['citas', 'clientes', 'servicios', 'mensajes'].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'text-foreground/70'}`}>{t}{t === 'mensajes' && unread ? ` (${unread})` : ''}</button>))}
        </div>
        <div className="mt-6">
          {tab === 'citas' && (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-secondary/70 text-xs uppercase text-muted-foreground"><tr>{['Fecha', 'Cliente', 'Servicio', 'Origen', 'Estado', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>{data.appointments.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">{a.date}<br />{a.time}</td>
                  <td className="px-4 py-3 font-medium">{a.clientName}<br /><span className="font-normal text-muted-foreground">{a.phone} · {a.motorcycle}</span></td>
                  <td className="px-4 py-3">{name(a.serviceId)}</td><td className="px-4 py-3">{a.source}</td>
                  <td className="px-4 py-3"><select aria-label="Estado" value={a.status} onChange={(e) => act(`/api/admin/appointments/${a.id}`, 'PATCH', { status: e.target.value })} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="px-4 py-3"><button aria-label="Eliminar cita" onClick={() => confirm('¿Eliminar esta cita?') && act(`/api/admin/appointments/${a.id}`, 'DELETE')}><Trash2 className="size-4 text-destructive" /></button></td>
                </tr>))}</tbody></table></div>)}
          {tab === 'clientes' && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.clients.map((c) => <li key={c.phone} className="rounded-2xl border border-border bg-card p-5"><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.phone}</p><p className="mt-2 text-sm">{c.motorcycles.join(', ')}</p><p className="mt-1 text-xs">{c.appointments} cita(s)</p></li>)}</ul>}
          {tab === 'servicios' && <><NewService /><ul className="grid gap-4 md:grid-cols-2">{data.services.map((s) => (
            <li key={s.id} className={`rounded-2xl border border-border bg-card p-5 ${s.active ? '' : 'opacity-60'}`}>
              <p className="font-semibold uppercase">{s.name}</p><p className="text-sm text-muted-foreground">{cop(s.priceFrom)}</p>
              <div className="mt-3 flex items-center gap-2">
                <input type="number" step={1000} min={0} defaultValue={s.priceFrom} aria-label="Precio" onBlur={(e) => Number(e.target.value) !== s.priceFrom && act(`/api/admin/services/${s.id}`, 'PATCH', { priceFrom: Number(e.target.value) })} className={`${input} w-32`} />
                <button onClick={() => act(`/api/admin/services/${s.id}`, 'PATCH', { active: !s.active })} className="rounded-lg border border-border px-3 py-2 text-xs">{s.active ? 'Ocultar' : 'Activar'}</button></div></li>))}</ul></>}
          {tab === 'mensajes' && <ul className="grid gap-3">{data.messages.length === 0 && <p className="text-muted-foreground">Aún no hay mensajes.</p>}{data.messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-card p-5 ${m.read ? 'border-border' : 'border-l-4 border-gold'}`}>
              <p className="font-semibold">{m.name} <span className="font-normal text-muted-foreground">· {m.email} · {m.phone}</span></p><p className="mt-2 text-sm">{m.message}</p>
              {!m.read && <button onClick={() => act(`/api/admin/messages/${m.id}/read`, 'PATCH')} className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs">Marcar como leído</button>}</li>))}</ul>}
        </div>
      </main>
    </div>
  )
}

export default function Admin() {
  const [logged, setLogged] = useState(Boolean(getToken()))
  const out = useCallback(() => { setToken(null); setLogged(false) }, [])
  return logged ? <Dashboard onLogout={out} /> : <Login onDone={() => setLogged(true)} />
}
