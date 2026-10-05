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
