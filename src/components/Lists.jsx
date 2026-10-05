import { useEffect, useRef, useState } from 'react'
import Sortable from 'sortablejs'
import { Plus, Trash2, ExternalLink, GripVertical, ChevronLeft, StickyNote, Play, Share2, Pencil } from 'lucide-react'
import StageMode from './StageMode'
import { ConfirmDialog, PromptDialog } from './ui'
import { uid } from '../lib/store'
import { searchUrl } from '../lib/lacuerda'

export default function Lists({ state, update }) {
  const [activeId, setActiveId] = useState(null)
  const active = state.lists.find(l => l.id === activeId)

  if (active) return <SetlistDetail list={active} state={state} update={update} onBack={() => setActiveId(null)} />

  const [promptNew, setPromptNew] = useState(false)
  const createList = (name) => {
    setPromptNew(false)
    update(s => ({ lists: [...s.lists, { id: uid(), name, songIds: [] }] }))
  }

  return (
    <div className="p-4 space-y-3">
      <button onClick={() => setPromptNew(true)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-950 font-semibold py-3">
        <Plus size={18} /> Nueva lista
      </button>
      {state.lists.length === 0 && <p className="text-slate-500 text-sm text-center pt-8">Crea tu primera setlist para empezar.</p>}
      {state.lists.map(l => (
        <button key={l.id} onClick={() => setActiveId(l.id)}
          className="w-full text-left rounded-xl bg-slate-900 border border-slate-800 p-4 hover:border-amber-500/50">
          <div className="font-semibold">{l.name}</div>
          <div className="text-xs text-slate-500">{l.songIds.length} canciones</div>
        </button>
      ))}
      {promptNew && <PromptDialog title="Nueva lista" placeholder="Repertorio Rock, Ensayos, Acústico..." onSubmit={createList} onCancel={() => setPromptNew(false)} />}
    </div>
  )
}

function SetlistDetail({ list, state, update, onBack }) {
  const ref = useRef(null)
  const [pickMode, setPickMode] = useState(false)
  const [stageMode, setStageMode] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [noteFor, setNoteFor] = useState(null) // songId al que se le edita la nota de esta lista
  const [shareMsg, setShareMsg] = useState(false)

  // C2: compartir setlist como texto (WhatsApp, etc.)
  const shareList = async () => {
    const lines = songs.map((s, i) => `${i + 1}. ${s.title} - ${s.artist}`)
    const text = `🎸 ${list.name}\n\n` + lines.join('\n')
    if (navigator.share) {
      try { await navigator.share({ title: list.name, text }); return } catch { /* cancelado */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {})
    setShareMsg(true); setTimeout(() => setShareMsg(false), 2000)
  }

  // C3: guardar nota especifica de la entrada en esta lista
  const saveEntryNote = (songId, text) => {
    setNoteFor(null)
    update(st => ({
      lists: st.lists.map(l => l.id === list.id
        ? { ...l, notes: { ...(l.notes || {}), [songId]: text } }
        : l),
    }))
  }

  useEffect(() => {
    if (!ref.current || pickMode) return
    const sortable = Sortable.create(ref.current, {
      handle: '.drag-handle',
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        update(s => ({
          lists: s.lists.map(l => {
            if (l.id !== list.id) return l
            const ids = [...l.songIds]
            const [moved] = ids.splice(oldIndex, 1)
            ids.splice(newIndex, 0, moved)
            return { ...l, songIds: ids }
          }),
        }))
      },
    })
    return () => sortable.destroy()
  }, [list.id, pickMode, update])

  const songs = list.songIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean)
  const available = state.songs.filter(s => !list.songIds.includes(s.id))

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 text-slate-400"><ChevronLeft size={22} /></button>
        <h2 className="flex-1 font-bold truncate">{list.name}</h2>
        <button onClick={() => setConfirmDel(true)}
          className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={18} /></button>
      </div>

      {songs.length > 0 && (
        <button onClick={() => setStageMode(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-950 py-2.5 text-sm font-bold">
          <Play size={16} /> Modo escenario
        </button>
      )}

      {songs.length > 0 && (
        <button onClick={shareList}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 text-slate-300 py-2.5 text-sm font-semibold">
          <Share2 size={16} /> {shareMsg ? 'Copiada al portapapeles ✓' : 'Compartir setlist'}
        </button>
      )}

      {stageMode && <StageMode list={list} songs={songs} entryNotes={list.notes || {}} onClose={() => setStageMode(false)} />}
      {noteFor && <PromptDialog title={`Nota en "${list.name}"`} placeholder="ej. en esta fecha la tocamos en Bm"
        initial={list.notes?.[noteFor] || ''} submitLabel="Guardar"
        onSubmit={text => saveEntryNote(noteFor, text)} onCancel={() => setNoteFor(null)} />}
      {confirmDel && <ConfirmDialog title="Eliminar lista" message={`Se eliminará "${list.name}". Las canciones quedan en la biblioteca.`}
        onConfirm={() => { update(s => ({ lists: s.lists.filter(l => l.id !== list.id) })); onBack() }}
        onCancel={() => setConfirmDel(false)} />}

      <button onClick={() => setPickMode(p => !p)} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/60 text-amber-400 py-2.5 text-sm font-semibold">
        <Plus size={16} /> {pickMode ? 'Listo' : 'Agregar canciones'}
      </button>

      {pickMode ? (
        available.length === 0
          ? <p className="text-slate-500 text-sm text-center pt-4">No hay más canciones en la biblioteca.</p>
          : available.map(s => (
            <button key={s.id} onClick={() => update(st => ({ lists: st.lists.map(l => l.id === list.id ? { ...l, songIds: [...l.songIds, s.id] } : l) }))}
              className="w-full text-left rounded-xl bg-slate-900 border border-slate-800 p-3 hover:border-amber-500/50">
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-slate-500">{s.artist}{s.album ? ` · ${s.album}` : ''}</div>
            </button>
          ))
      ) : (
        <div ref={ref} className="space-y-2">
          {songs.length === 0 && <p className="text-slate-500 text-sm text-center pt-4">Lista vacía.</p>}
          {songs.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-3">
              <span className="drag-handle cursor-grab text-slate-600"><GripVertical size={18} /></span>
              <span className="text-xs text-slate-500 w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-xs text-slate-500 truncate">{s.artist}{s.album ? ` · ${s.album} ${s.year || ''}` : ''}</div>
                {s.notes && <div className="text-xs text-amber-500/80 flex items-center gap-1 mt-0.5"><StickyNote size={11} />{s.notes}</div>}
                {list.notes?.[s.id] && <div className="text-xs text-sky-400/90 flex items-center gap-1 mt-0.5"><StickyNote size={11} />{list.notes[s.id]} <span className="text-slate-600">(esta lista)</span></div>}
              </div>
              <button onClick={() => setNoteFor(s.id)} className="p-2 text-slate-600 hover:text-sky-400" title="Nota para esta lista">
                <Pencil size={15} />
              </button>
              <a href={s.url || searchUrl(s.artist, s.title)} target="_blank" rel="noreferrer"
                className="p-2 text-amber-400 hover:text-amber-300" title="Ver acordes en LaCuerda.net">
                <ExternalLink size={18} />
              </a>
              <button onClick={() => update(st => ({ lists: st.lists.map(l => l.id === list.id ? { ...l, songIds: l.songIds.filter(id => id !== s.id) } : l) }))}
                className="p-2 text-slate-600 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
