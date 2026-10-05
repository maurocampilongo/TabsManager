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
    const st = raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState()
    // E1: si el usuario eligio no persistir el token, se recupera de sessionStorage
    const sessionToken = sessionStorage.getItem('tabmanager_token')
    if (sessionToken) st.settings.githubToken = sessionToken
    return st
  } catch { return emptyState() }
}

export function saveLocal(state) {
  // E1: token volatil -> solo en sessionStorage, nunca en localStorage
  if (state.settings?.tokenVolatile && state.settings.githubToken) {
    sessionStorage.setItem('tabmanager_token', state.settings.githubToken)
    const { githubToken, ...rest } = state.settings
    localStorage.setItem(KEY, JSON.stringify({ ...state, settings: { ...rest, tokenVolatile: true } }))
    return
  }
  sessionStorage.removeItem('tabmanager_token')
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
    listMap.set(l.id, { ...prev, ...l, songIds: ids, notes: { ...(prev.notes || {}), ...(l.notes || {}) } })
  }

  return { songs: [...songMap.values()], lists: [...listMap.values()] }
}
