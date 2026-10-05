import { useEffect, useRef, useState, useCallback } from 'react'
import { Guitar, ListMusic, Compass, Settings as SettingsIcon, RefreshCw, Download } from 'lucide-react'
import { useToasts, Toasts, timeAgo } from './components/ui'
import { loadLocal, saveLocal, uid, mergeStates } from './lib/store'
import { pullFromGist, pushToGist, findExistingGist } from './lib/gist'
import { directUrl } from './lib/lacuerda'
import Library from './components/Library'
import Lists from './components/Lists'
import Explore from './components/Explore'
import Settings from './components/Settings'

export default function App() {
  const [state, setState] = useState(loadLocal)
  const [tab, setTab] = useState('lists')
  const [syncMsg, setSyncMsg] = useState('')
  const [syncing, setSyncing] = useState(false)
  const { toasts, push: toast } = useToasts()
  const [deferredInstall, setDeferredInstall] = useState(null)
  const [, forceTick] = useState(0) // re-render para tiempo relativo

  // D2: capturar evento de instalacion PWA
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredInstall(() => e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // refrescar el "hace X min" cada 60s
  useEffect(() => {
    const t = setInterval(() => forceTick(n => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  // Ref al estado actual para que syncNow no use closures viejas
  const stateRef = useRef(state)
  stateRef.current = state
  const syncingRef = useRef(false)

  useEffect(() => { saveLocal(state) }, [state])

  // Cada edicion local actualiza updatedAt (clave para el merge de sync)
  const update = useCallback((fn) => setState(s => ({ ...s, ...fn(s), updatedAt: Date.now() })), [])

  const addSong = useCallback((song) => {
    const full = { id: uid(), notes: '', album: '', year: '', url: directUrl(song.artist, song.title), ...song }
    update(s => ({ songs: [...s.songs, full] }))
    return full.id
  }, [update])

  const addToList = useCallback((listId, songId) => {
    update(s => ({
      lists: s.lists.map(l => l.id === listId && !l.songIds.includes(songId)
        ? { ...l, songIds: [...l.songIds, songId] } : l),
    }))
  }, [update])

  const syncNow = useCallback(async ({ quiet = false } = {}) => {
    if (syncingRef.current) return
    const cur = stateRef.current
    const { githubToken } = cur.settings
    if (!githubToken) { if (!quiet) setSyncMsg('Configura tu token en Ajustes'); return }
    syncingRef.current = true
    setSyncing(true)
    if (!quiet) setSyncMsg('')
    try {
      // Si no hay gistId guardado (dispositivo nuevo), buscar uno existente
      let id = cur.settings.gistId
      if (!id) {
        id = await findExistingGist(githubToken)
        if (id) update(st => ({ settings: { ...st.settings, gistId: id } }))
      }
      const remote = await pullFromGist(githubToken, id)
      // Merge por items: nunca se pierden datos de ningun dispositivo
      const merged = remote
        ? mergeStates(stateRef.current, remote)
        : { songs: stateRef.current.songs, lists: stateRef.current.lists }
      const now = Date.now()
      const newId = await pushToGist(githubToken, id, { ...merged, updatedAt: now })
      update(() => ({ ...merged, updatedAt: now, lastSyncAt: now, settings: { ...stateRef.current.settings, gistId: newId } }))
      setSyncMsg('')
      toast('Sincronizado con GitHub ✓', 'success')
    } catch (e) {
      // Si el gist guardado fue eliminado (404), olvidarlo y reintentar una vez
      if (e.message.includes('404') && cur.settings.gistId) {
        update(st => ({ settings: { ...st.settings, gistId: '' } }))
        syncingRef.current = false; setSyncing(false)
        return setTimeout(() => syncNow({ quiet }), 100)
      }
      setSyncMsg('Error')
      toast('Error de sync: ' + e.message, 'error')
    }
    syncingRef.current = false
    setSyncing(false)
  }, [update])

  // Auto-sync: al abrir la app y al volver a la pestaña
  useEffect(() => {
    syncNow({ quiet: true })
    const onVisible = () => { if (document.visibilityState === 'visible') syncNow({ quiet: true }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncNow])

  // Auto-sync con debounce 30s despues de ediciones locales
  const dataKey = `${state.songs.length}|${state.lists.length}|${state.updatedAt}`
  useEffect(() => {
    if (!state.settings.githubToken) return
    const t = setTimeout(() => syncNow({ quiet: true }), 30000)
    return () => clearTimeout(t)
  }, [dataKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { id: 'lists', label: 'Setlists', icon: ListMusic },
    { id: 'library', label: 'Canciones', icon: Guitar },
    { id: 'explore', label: 'Explorar', icon: Compass },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
  ]

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Guitar className="text-amber-500" size={22} /> TabManager
        </h1>
        <div className="flex items-center gap-3">
          {deferredInstall && (
            <button onClick={async () => { deferredInstall.prompt(); await deferredInstall.userChoice; setDeferredInstall(null) }}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300" title="Instalar app">
              <Download size={14} /> Instalar
            </button>
          )}
          <button onClick={() => syncNow()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {state.settings.githubToken ? (
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${syncing ? 'bg-sky-400' : (state.lastSyncAt || 0) >= (state.updatedAt || 0) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {syncing ? 'Sincronizando' : syncMsg || timeAgo(state.lastSyncAt)}
              </span>
            ) : 'Sync'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'lists' && <Lists state={state} update={update} />}
        {tab === 'library' && <Library state={state} update={update} addSong={addSong} addToList={addToList} />}
        {tab === 'explore' && <Explore state={state} addSong={addSong} />}
        {tab === 'settings' && <Settings state={state} update={update} syncNow={() => syncNow()} syncMsg={syncMsg} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] ${tab === id ? 'text-amber-400' : 'text-slate-500'}`}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
      </nav>
      <Toasts toasts={toasts} />
    </div>
  )
}
