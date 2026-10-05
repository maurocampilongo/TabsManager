import { useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import { gistHistory, gistAtVersion } from '../lib/gist'
import { ConfirmDialog, timeAgo } from './ui'

export default function Settings({ state, update, syncNow, syncMsg }) {
  const [token, setToken] = useState(state.settings.githubToken)
  const [volatileToken, setVolatileToken] = useState(!!state.settings.tokenVolatile)
  const [history, setHistory] = useState(null)
  const [histErr, setHistErr] = useState('')
  const [restoreVer, setRestoreVer] = useState(null)
  const [importErr, setImportErr] = useState('')

  const loadHistory = async () => {
    setHistErr('')
    try { setHistory(await gistHistory(state.settings.githubToken, state.settings.gistId)) }
    catch (e) { setHistErr(e.message) }
  }

  const restore = async () => {
    const ver = restoreVer
    setRestoreVer(null)
    try {
      const data = await gistAtVersion(state.settings.githubToken, state.settings.gistId, ver.version)
      if (!data) throw new Error('versión vacía')
      update(() => ({ songs: data.songs || [], lists: data.lists || [] }))
      setTimeout(syncNow, 200) // empujar la restauracion al gist
      setHistory(null)
    } catch (e) { setHistErr(e.message) }
  }

  // B3: validar estructura antes de importar
  const importJSON = async (file) => {
    setImportErr('')
    try {
      const d = JSON.parse(await file.text())
      if (!d || typeof d !== 'object' || !Array.isArray(d.songs) || !Array.isArray(d.lists))
        throw new Error('El archivo no tiene el formato de TabManager (faltan songs/lists)')
      if (d.songs.some(s => !s.id || !s.title || !s.artist))
        throw new Error('Hay canciones sin id/título/artista')
      if (d.lists.some(l => !l.id || !l.name || !Array.isArray(l.songIds)))
        throw new Error('Hay listas con formato inválido')
      update(() => ({ songs: d.songs, lists: d.lists }))
    } catch (e) { setImportErr(e.message) }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold">Sincronización con GitHub Gist</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        Crea un <a className="text-amber-400 underline" href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">Personal Access Token</a> con
        permiso <code>gist</code> y pégalo aquí. Tus datos se guardan en un Gist privado (<code>tabmanager_data.json</code>) y se sincronizan entre tus dispositivos.
      </p>
      <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..."
        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-amber-500" />
      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input type="checkbox" checked={volatileToken} onChange={e => setVolatileToken(e.target.checked)} className="accent-amber-500" />
        No guardar el token en este dispositivo (pedir en cada sesión)
      </label>
      {state.settings.gistId && <p className="text-[11px] text-slate-600 break-all">Gist ID: {state.settings.gistId}</p>}
      <button onClick={() => { update(s => ({ settings: { ...s.settings, githubToken: token.trim(), tokenVolatile: volatileToken } })); setTimeout(syncNow, 100) }}
        className="w-full rounded-xl bg-amber-500 text-slate-950 font-semibold py-3">
        Guardar y sincronizar
      </button>
      {syncMsg && <p className="text-sm text-slate-400">{syncMsg}</p>}

      {state.settings.gistId && (
        <>
          <h2 className="font-bold pt-4">Historial de versiones</h2>
          <p className="text-xs text-slate-500">El Gist guarda cada sincronización como una versión. Podés volver atrás si algo se rompió.</p>
          {!history && (
            <button onClick={loadHistory} className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 py-3 text-sm">
              <History size={16} /> Ver versiones
            </button>
          )}
          {histErr && <p className="text-red-400 text-sm">{histErr}</p>}
          {history && (
            <div className="space-y-2">
              {history.map(v => (
                <div key={v.version} className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{new Date(v.at).toLocaleString('es-AR')}</div>
                    <div className="text-xs text-slate-500">
                      {v.changes.total != null && `${v.changes.total} cambios`} {v.changes.additions != null && `(+${v.changes.additions}/-${v.changes.deletions})`}
                    </div>
                  </div>
                  <button onClick={() => setRestoreVer(v)} className="p-2 text-slate-500 hover:text-amber-400" title="Restaurar esta versión">
                    <RotateCcw size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => setHistory(null)} className="w-full text-xs text-slate-500 py-1">Ocultar</button>
            </div>
          )}
          {restoreVer && <ConfirmDialog title="Restaurar versión"
            message={`Se reemplazarán tus datos actuales por la versión de ${new Date(restoreVer.at).toLocaleString('es-AR')} (quedará como nueva sincronización; no se pierde el historial).`}
            confirmLabel="Restaurar" danger={false} onConfirm={restore} onCancel={() => setRestoreVer(null)} />}
        </>
      )}

      <h2 className="font-bold pt-4">Instalar como app</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-400">Android/Chrome:</strong> botón "Instalar" en la barra superior o menú → "Agregar a pantalla de inicio".<br />
        <strong className="text-slate-400">iPhone/Safari:</strong> botón Compartir → "Add to Home Screen".
      </p>

      <h2 className="font-bold pt-4">Datos</h2>
      <button onClick={() => {
        const blob = new Blob([JSON.stringify({ songs: state.songs, lists: state.lists }, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob); a.download = 'tabmanager_data.json'; a.click()
      }} className="w-full rounded-xl border border-slate-700 py-3 text-sm">Exportar JSON</button>
      <label className="block w-full rounded-xl border border-slate-700 py-3 text-sm text-center cursor-pointer">
        Importar JSON
        <input type="file" accept=".json" className="hidden" onChange={e => {
          const f = e.target.files?.[0]; if (f) importJSON(f)
          e.target.value = ''
        }} />
      </label>
      {importErr && <p className="text-red-400 text-sm">⚠ {importErr}</p>}
    </div>
  )
}
