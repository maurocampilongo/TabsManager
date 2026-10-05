// Estado global simple con persistencia en localStorage + sync opcional con Gist
const KEY = 'tabmanager_state_v1'

export const emptyState = () => ({
  songs: [], // {id,title,artist,album,year,url,notes}
  lists: [], // {id,name,songIds:[]}
  settings: { githubToken: '', gistId: '' },
})

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState()
  } catch { return emptyState() }
}

export function saveLocal(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

// Fusiona estado local y remoto por items (union), sin pisar datos del otro dispositivo.
// En conflicto de una misma cancion gana la version local (dispositivo actual).
// Los songIds de una misma lista se unen preservando el orden local y
// agregando al final los que solo existan en remoto.
export function mergeStates(local, remote) {
  const songMap = new Map()
  for (const s of remote.songs || []) songMap.set(s.id, s)
  for (const s of local.songs || []) songMap.set(s.id, { ...songMap.get(s.id), ...s })

  const listMap = new Map()
  for (const l of remote.lists || []) listMap.set(l.id, l)
  for (const l of local.lists || []) {
    const prev = listMap.get(l.id)
    if (!prev) { listMap.set(l.id, l); continue }
    const ids = [...l.songIds]
    for (const id of prev.songIds) if (!ids.includes(id)) ids.push(id)
    listMap.set(l.id, { ...prev, ...l, songIds: ids })
  }

  return { songs: [...songMap.values()], lists: [...listMap.values()] }
}
