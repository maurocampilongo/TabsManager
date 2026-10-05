import { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

// ---- Modal base ----
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---- D1: reemplazo de confirm() nativo ----
export function ConfirmDialog({ title = 'Confirmar', message, confirmLabel = 'Eliminar', danger = true, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-400">{message}</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="rounded-xl border border-slate-700 py-2.5 text-sm">Cancelar</button>
        <button onClick={onConfirm}
          className={`rounded-xl py-2.5 text-sm font-semibold ${danger ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ---- D1: reemplazo de prompt() nativo ----
export function PromptDialog({ title, placeholder = '', initial = '', submitLabel = 'Crear', onSubmit, onCancel }) {
  const [value, setValue] = useState(initial)
  const submit = () => { if (value.trim()) onSubmit(value.trim()) }
  return (
    <Modal title={title} onClose={onCancel}>
      <input autoFocus value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-amber-500" />
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="rounded-xl border border-slate-700 py-2.5 text-sm">Cancelar</button>
        <button onClick={submit} className="rounded-xl bg-amber-500 text-slate-950 py-2.5 text-sm font-semibold">{submitLabel}</button>
      </div>
    </Modal>
  )
}

// ---- D4: Toasts ----
export function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = (msg, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  return { toasts, push }
}

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
const colors = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-sky-400' }

export function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map(t => {
        const Icon = icons[t.type] || Info
        return (
          <div key={t.id} className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm shadow-xl animate-[fadein_.2s_ease-out]">
            <Icon size={16} className={colors[t.type] || colors.info} />
            <span>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---- D3: tiempo relativo ----
export function timeAgo(ts) {
  if (!ts) return 'nunca'
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} d`
}
