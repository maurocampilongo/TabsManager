import { useEffect, useMemo, useState, useCallback } from 'react'
import { Guitar, ListMusic, Compass, Settings as SettingsIcon, RefreshCw } from 'lucide-react'
import { loadLocal, saveLocal, uid } from './lib/store'
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

  useEffect(() => { saveLocal(state) }, [state])

  const update = useCallback((fn) => setState(s => ({ ...s, ...fn(s) })), [])

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

  const syncNow = async () => {
    const { githubToken, gistId } = state.settings
    if (!githubToken) { setSyncMsg('Configura tu token en Ajustes'); return }
    setSyncing(true); setSyncMsg('')
    try {
      // Si no hay gistId guardado (dispositivo nuevo), buscar uno existente
      let id = gistId
      if (!id) {
        id = await findExistingGist(githubToken)
        if (id) update(st => ({ settings: { ...st.settings, gistId: id } }))
      }
      const remote = await pullFromGist(githubToken, id)
      let data = { songs: state.songs, lists: state.lists }
      if (remote?.updatedAt && remote.updatedAt > (state.updatedAt || 0)) {
        data = { songs: remote.songs || [], lists: remote.lists || [] }
      }
      const newId = await pushToGist(githubToken, id, { ...data, updatedAt: Date.now() })
      update(() => ({ ...data, updatedAt: Date.now(), settings: { ...state.settings, gistId: newId } }))
      setSyncMsg('Sincronizado ✓')
    } catch (e) { setSyncMsg('Error: ' + e.message) }
    setSyncing(false)
  }

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
        <button onClick={syncNow} className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncMsg || 'Sync'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'lists' && <Lists state={state} update={update} />}
        {tab === 'library' && <Library state={state} update={update} addSong={addSong} addToList={addToList} />}
        {tab === 'explore' && <Explore state={state} addSong={addSong} />}
        {tab === 'settings' && <Settings state={state} update={update} syncNow={syncNow} syncMsg={syncMsg} />}
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
    </div>
  )
}
