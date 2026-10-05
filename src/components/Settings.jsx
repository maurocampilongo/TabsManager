import { useState } from 'react'

export default function Settings({ state, update, syncNow, syncMsg }) {
  const [token, setToken] = useState(state.settings.githubToken)
  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold">Sincronización con GitHub Gist</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        Crea un <a className="text-amber-400 underline" href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">Personal Access Token</a> con
        permiso <code>gist</code> y pégalo aquí. Tus datos se guardan en un Gist privado (<code>tabmanager_data.json</code>) y se sincronizan entre tus dispositivos.
      </p>
      <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..."
        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-amber-500" />
      {state.settings.gistId && <p className="text-[11px] text-slate-600 break-all">Gist ID: {state.settings.gistId}</p>}
      <button onClick={() => { update(s => ({ settings: { ...s.settings, githubToken: token.trim() } })); setTimeout(syncNow, 100) }}
        className="w-full rounded-xl bg-amber-500 text-slate-950 font-semibold py-3">
        Guardar y sincronizar
      </button>
      {syncMsg && <p className="text-sm text-slate-400">{syncMsg}</p>}

      <h2 className="font-bold pt-4">Datos</h2>
      <button onClick={() => {
        const blob = new Blob([JSON.stringify({ songs: state.songs, lists: state.lists }, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob); a.download = 'tabmanager_data.json'; a.click()
      }} className="w-full rounded-xl border border-slate-700 py-3 text-sm">Exportar JSON</button>
      <label className="block w-full rounded-xl border border-slate-700 py-3 text-sm text-center cursor-pointer">
        Importar JSON
        <input type="file" accept=".json" className="hidden" onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          f.text().then(t => { const d = JSON.parse(t); update(() => ({ songs: d.songs || [], lists: d.lists || [] })) })
        }} />
      </label>
    </div>
  )
}
