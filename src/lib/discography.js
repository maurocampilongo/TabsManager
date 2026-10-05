// Busqueda de artistas/discografia: MusicBrainz (principal) + iTunes (respaldo)

// B4: fetch con retry + backoff exponencial para el rate limit de MusicBrainz
async function mbFetch(url, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'TabManager/1.0 ( tabmanager app )' } })
    if (res.ok) return res
    if ((res.status === 503 || res.status === 429) && i < retries) {
      await new Promise(r => setTimeout(r, 1200 * (i + 1)))
      continue
    }
    throw new Error('MusicBrainz error')
  }
}
export async function searchArtists(query) {
  const mb = { headers: { 'User-Agent': 'TabManager/1.0 ( tabmanager app )' } }
  const map = a => ({
    id: a.id,
    name: a.name,
    isAR: a.country === 'AR',
    detail: [a.disambiguation || null, a.country, a['life-span']?.begin?.slice(0, 4)]
      .filter(Boolean).join(' · '),
  })
  const fetchQ = async (q) => {
    const res = await mbFetch(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&fmt=json&limit=12`)
    return ((await res.json()).artists || []).map(map)
  }
  // 1) Artistas argentinos primero
  const ar = await fetchQ(`${query} AND country:AR`)
  // 2) Completar con resultados globales (rate limit MusicBrainz: 1 req/s)
  await new Promise(r => setTimeout(r, 1100))
  const global = await fetchQ(query)
  const seen = new Set(ar.map(a => a.id))
  return [...ar, ...global.filter(a => !seen.has(a.id))].slice(0, 15)
}

export async function artistReleases(artistId) {
  const url = `https://musicbrainz.org/ws/2/release-group/?artist=${artistId}&type=album&fmt=json&limit=100`
  const data = await (await mbFetch(url)).json()
  return (data['release-groups'] || [])
    .map(r => ({ id: r.id, title: r.title, year: r['first-release-date']?.slice(0, 4) || '' }))
    .sort((a, b) => (a.year || '').localeCompare(b.year || ''))
}

export async function releaseTracks(releaseGroupId) {
  // B5: elegir el mejor release del grupo: oficial > edicion AR/mundial > mas antiguo
  const relData = await (await mbFetch(`https://musicbrainz.org/ws/2/release/?release-group=${releaseGroupId}&fmt=json&limit=25`)).json()
  const rels = relData.releases || []
  if (!rels.length) return []
  const score = r =>
    (r.status === 'Official' ? 4 : 0) +
    (r.country === 'AR' ? 2 : r.country === 'XW' ? 1 : 0)
  const best = [...rels].sort((a, b) =>
    (score(b) - score(a)) || (a.date || '').localeCompare(b.date || ''))[0]
  // 2) Obtener las grabaciones de ese release
  const data = await (await mbFetch(`https://musicbrainz.org/ws/2/recording/?release=${best.id}&fmt=json&limit=100`)).json()
  const seen = new Set()
  return (data.recordings || []).map(r => r.title).filter(t => {
    const k = t.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}

export async function itunesTracks(artist, album) {
  const q = encodeURIComponent(`${artist} ${album}`)
  const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=50`)
  if (!res.ok) throw new Error('iTunes error')
  const data = await res.json()
  return (data.results || []).filter(r =>
    r.collectionName?.toLowerCase().includes(album.toLowerCase().slice(0, 10))
  ).map(r => ({ title: r.trackName, artist: r.artistName, album: r.collectionName, year: r.releaseDate?.slice(0, 4), art: r.artworkUrl100 }))
}

export async function itunesArtistAlbums(artist) {
  const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=album&limit=50`)
  if (!res.ok) throw new Error('iTunes error')
  const data = await res.json()
  return (data.results || []).map(r => ({ id: r.collectionId, title: r.collectionName, year: r.releaseDate?.slice(0, 4), art: r.artworkUrl100, artist: r.artistName }))
}
