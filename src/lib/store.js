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
