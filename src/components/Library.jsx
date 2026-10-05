import { useState } from 'react'
import { Plus, Trash2, ExternalLink, Search, Pencil, X } from 'lucide-react'
import { directUrl, searchUrl } from '../lib/lacuerda'
import { ConfirmDialog } from './ui'

export default function Library({ state, update, addSong, addToList }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // song | null | 'new'
  const [deleting, setDeleting] = useState(null) // song a eliminar

  const filtered = state.songs.filter(s =>
    `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3">
          <Search size={16} className="text-slate-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar canción..."
            className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
        </div>
        <button onClick={() => setEditing('new')} className="rounded-xl bg-amber-500 text-slate-950 px-3"><Plus size={20} /></button>
      </div>

      {filtered.length === 0 && <p className="text-slate-500 text-sm text-center pt-8">Biblioteca vacía. Agrega canciones manualmente o desde Explorar.</p>}

      {!q && [...new Set(filtered.map(s => s.artist))].sort((a, b) => a.localeCompare(b, 'es')).map(artist => (
        <div key={artist} className="pt-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide pb-1">{artist}</div>
          <div className="space-y-3">
            {filtered.filter(s => s.artist === artist).sort((a, b) => a.title.localeCompare(b.title, 'es')).map(renderSong)}
          </div>
        </div>
      ))}

      {q && filtered.map(renderSong)}
      {renderDialogs()}
    </div>
  )

  function renderSong(s) {
    return (
        <div key={s.id} className="rounded-xl bg-slate-900 border border-slate-800 p-3">
          <div className="flex items-start gap-2">
            {s.art && <img src={s.art} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{s.title}</div>
              <div className="text-xs text-slate-500">{s.artist}{s.album ? ` · ${s.album}` : ''}{s.year ? ` (${s.year})` : ''}</div>
              {(s.capo || s.tuning) && (
                <div className="flex gap-1.5 mt-1">
                  {s.capo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">Capo {s.capo}</span>}
                  {s.tuning && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 font-semibold">{s.tuning}</span>}
                </div>
              )}
              {s.notes && <div className="text-xs text-amber-500/80 mt-1">📝 {s.notes}</div>}
              <div className="text-[10px] text-slate-600 mt-1">En {state.lists.filter(l => l.songIds.includes(s.id)).map(l => l.name).join(', ') || 'ninguna lista'}</div>
            </div>
            <a href={s.url || searchUrl(s.artist, s.title)} target="_blank" rel="noreferrer" className="p-2 text-amber-400"><ExternalLink size={18} /></a>
            <button onClick={() => setEditing(s)} className="p-2 text-slate-500"><Pencil size={16} /></button>
            <button onClick={() => setDeleting(s)} className="p-2 text-slate-600 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
    )
  }

  function renderDialogs() { return (<>
      {deleting && <ConfirmDialog title="Eliminar canción"
        message={`Se eliminará "${deleting.title}" de la biblioteca y de todas las listas.`}
        onConfirm={() => {
          update(st => ({
            songs: st.songs.filter(x => x.id !== deleting.id),
            lists: st.lists.map(l => ({ ...l, songIds: l.songIds.filter(id => id !== deleting.id) })),
          }))
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)} />}

      {editing && <SongForm song={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(data) => {
          if (editing === 'new') addSong(data)
          else update(st => ({ songs: st.songs.map(x => x.id === editing.id ? { ...x, ...data } : x) }))
          setEditing(null)
        }} />}
  </>)
  }
}

function SongForm({ song, onClose, onSave }) {
  const [f, setF] = useState({ title: '', artist: '', album: '', year: '', capo: '', tuning: '', notes: '', ...song })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const field = (k, label, props = {}) => (
    <label className="block text-xs text-slate-400 space-y-1">
      {label}
      <input value={f[k]} onChange={e => set(k, e.target.value)} {...props}
        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-amber-500" />
    </label>
  )
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{song ? 'Editar canción' : 'Nueva canción'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        {field('title', 'Título *')}
        {field('artist', 'Artista *')}
        <div className="grid grid-cols-2 gap-3">{field('album', 'Álbum')}{field('year', 'Año', { inputMode: 'numeric' })}</div>
        <div className="grid grid-cols-2 gap-3">{field('capo', 'Capo', { placeholder: 'ej. 2' })}{field('tuning', 'Afinación', { placeholder: 'ej. Drop D, Eb' })}</div>
        {field('notes', 'Notas rápidas (opcional)', { placeholder: 'ej. capo 2, afinación drop D' })}
        <button onClick={() => {
          if (!f.title.trim() || !f.artist.trim()) return
          // Regenerar siempre el slug: si se edito titulo/artista el link viejo quedaba roto
          onSave({ ...f, url: directUrl(f.artist, f.title) })
        }} className="w-full rounded-xl bg-amber-500 text-slate-950 font-semibold py-3">Guardar</button>
      </div>
    </div>
  )
}
