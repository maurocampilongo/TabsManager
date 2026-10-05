import { useEffect, useRef, useState } from 'react'
import { X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { searchUrl } from '../lib/lacuerda'

// Modo escenario: vista full-screen para tocar en vivo.
// Texto grande, navegacion simple, pantalla siempre encendida (Wake Lock).
export default function StageMode({ list, songs, entryNotes = {}, onClose }) {
  const [current, setCurrent] = useState(0)
  const wakeLock = useRef(null)

  useEffect(() => {
    let released = false
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && !released) wakeLock.current = await navigator.wakeLock.request('screen')
      } catch { /* no soportado o denegado */ }
    }
    acquire()
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      wakeLock.current?.release().catch(() => {})
    }
  }, [])

  const song = songs[current]

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="min-w-0">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Modo escenario</div>
          <div className="font-bold truncate">{list.name}</div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={26} /></button>
      </div>

      {/* Cancion actual */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
        <div className="text-slate-500 text-lg">{current + 1} / {songs.length}</div>
        {song ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">{song.title}</h2>
            <div className="text-xl text-slate-400">{song.artist}</div>
            {(song.capo || song.tuning) && (
              <div className="flex gap-2 justify-center">
                {song.capo && <span className="text-sm px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 font-bold">Capo {song.capo}</span>}
                {song.tuning && <span className="text-sm px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 font-bold">{song.tuning}</span>}
              </div>
            )}
            {song.notes && <div className="text-amber-400 text-lg">📝 {song.notes}</div>}
            {entryNotes[song.id] && <div className="text-sky-400 text-lg">📝 {entryNotes[song.id]}</div>}
            <a href={song.url || searchUrl(song.artist, song.title)} target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-amber-500 text-slate-950 font-bold px-8 py-4 text-lg">
              <ExternalLink size={22} /> Ver acordes
            </a>
          </>
        ) : <p className="text-slate-500">Lista vacía</p>}
      </div>

      {/* Navegacion */}
      <div className="grid grid-cols-2 border-t border-slate-800">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="flex items-center justify-center gap-2 py-5 text-lg font-semibold text-slate-300 disabled:opacity-30 active:bg-slate-900">
          <ChevronUp size={24} /> Anterior
        </button>
        <button onClick={() => setCurrent(c => Math.min(songs.length - 1, c + 1))} disabled={current >= songs.length - 1}
          className="flex items-center justify-center gap-2 py-5 text-lg font-semibold text-amber-400 disabled:opacity-30 active:bg-slate-900 border-l border-slate-800">
          Siguiente <ChevronDown size={24} />
        </button>
      </div>

      {/* Mini-indice de la setlist */}
      <div className="max-h-36 overflow-y-auto border-t border-slate-800 px-4 py-2">
        {songs.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)}
            className={`w-full text-left py-1.5 text-sm truncate ${i === current ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
            {i + 1}. {s.title}
          </button>
        ))}
      </div>
    </div>
  )
}
