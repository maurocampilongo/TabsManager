// Busqueda de artistas/discografia: MusicBrainz (principal) + iTunes (respaldo)
export async function searchArtists(query) {
  const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=12`
  const res = await fetch(url, { headers: { 'User-Agent': 'TabManager/1.0 ( tabmanager app )' } })
  if (!res.ok) throw new Error('MusicBrainz error')
  const data = await res.json()
  return (data.artists || []).map(a => ({
    id: a.id,
    name: a.name,
    detail: [a.country, a['life-span']?.begin?.slice(0, 4)].filter(Boolean).join(' · '),
  }))
}

export async function artistReleases(artistId) {
  const url = `https://musicbrainz.org/ws/2/release-group/?artist=${artistId}&type=album&fmt=json&limit=100`
  const res = await fetch(url, { headers: { 'User-Agent': 'TabManager/1.0 ( tabmanager app )' } })
  if (!res.ok) throw new Error('MusicBrainz error')
  const data = await res.json()
  return (data['release-groups'] || [])
    .map(r => ({ id: r.id, title: r.title, year: r['first-release-date']?.slice(0, 4) || '' }))
    .sort((a, b) => (a.year || '').localeCompare(b.year || ''))
}

export async function releaseTracks(releaseGroupId) {
  const mb = { headers: { 'User-Agent': 'TabManager/1.0 ( tabmanager app )' } }
  // 1) Buscar el primer release oficial del grupo
  const relRes = await fetch(`https://musicbrainz.org/ws/2/release/?release-group=${releaseGroupId}&fmt=json&limit=10`, mb)
  if (!relRes.ok) throw new Error('MusicBrainz error')
  const rels = (await relRes.json()).releases || []
  if (!rels.length) return []
  // 2) Obtener las grabaciones de ese release
  const recRes = await fetch(`https://musicbrainz.org/ws/2/recording/?release=${rels[0].id}&fmt=json&limit=100`, mb)
  if (!recRes.ok) throw new Error('MusicBrainz error')
  const data = await recRes.json()
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
