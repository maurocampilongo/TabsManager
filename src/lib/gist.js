// Sincronizacion con GitHub Gist: archivo tabmanager_data.json
const FILE = 'tabmanager_data.json'

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

export async function pullFromGist(token, gistId) {
  if (!token || !gistId) return null
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const gist = await res.json()
  const f = gist.files?.[FILE]
  if (!f?.content) return null
  return JSON.parse(f.content)
}

// Busca un gist existente que contenga tabmanager_data.json (para reutilizarlo
// en otros dispositivos en lugar de crear duplicados)
export async function findExistingGist(token) {
  const res = await fetch('https://api.github.com/gists?per_page=100', { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const gists = await res.json()
  const found = gists.find(g => g.files && g.files[FILE])
  return found?.id || null
}

export async function pushToGist(token, gistId, data) {
  if (!token) throw new Error('Falta token')
  const body = JSON.stringify({ files: { [FILE]: { content: JSON.stringify(data, null, 2) } } })
  if (gistId) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH', headers: headers(token), body,
    })
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    return gistId
  }
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST', headers: headers(token),
    body: JSON.stringify({ description: 'TabManager data', public: false, files: { [FILE]: { content: JSON.stringify(data, null, 2) } } }),
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  return (await res.json()).id
}

// A4: historial de versiones del Gist
export async function gistHistory(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const gist = await res.json()
  return (gist.history || [])
    .map(h => ({ version: h.version, at: h.committed_at, changes: h.change_status }))
    .slice(0, 15)
}

export async function gistAtVersion(token, gistId, sha) {
  const res = await fetch(`https://api.github.com/gists/${gistId}/${sha}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const gist = await res.json()
  const f = gist.files?.[FILE]
  return f?.content ? JSON.parse(f.content) : null
}
