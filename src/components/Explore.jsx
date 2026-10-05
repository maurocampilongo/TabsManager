import { useState } from 'react'
import { Search, ChevronLeft, Plus, Check, Music } from 'lucide-react'
import { searchArtists, artistReleases, releaseTracks } from '../lib/discography'

export default function Explore({ state, addSong }) {
  const [q, setQ] = useState('')
  const [artists, setArtists] = useState([])
  const [artist, setArtist] = useState(null)
  const [albums, setAlbums] = useState(null)
  const [album, setAlbum] = useState(null)
  const [tracks, setTracks] = useState(null)
  const [added, setAdded] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const doSearch = async () => {
    if (!q.trim()) return
    setLoading(true); setErr(''); setArtist(null); setAlbums(null); setAlbum(null)
    try { setArtists(await searchArtists(q)) } catch { setErr('Error consultando MusicBrainz') }
    setLoading(false)
  }

  const pickArtist = async (a) => {
    setArtist(a); setAlbums(null); setAlbum(null); setLoading(true)
    try { setAlbums(await artistReleases(a.id)) } catch { setErr('Error cargando discografía') }
    setLoading(false)
  }

  const pickAlbum = async (al) => {
    setAlbum(al); setTracks(null); setLoading(true)
    try { setTracks(await releaseTracks(al.id)) } catch { setErr('Error cargando temas') }
    setLoading(false)
  }

  const add = (title) => {
    addSong({ title, artist: artist.name, album: album.title, year: album.year })
    setAdded(p => new Set(p).add(`${album.id}|${title}`))
  }

  return (
    <div className="p-4 space-y-3">
      {!artist && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3">
              <Search size={16} className="text-slate-500" />
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="Soda Stereo, Spinetta, Charly, Airbag..."
                className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
            </div>
            <button onClick={doSearch} className="rounded-xl bg-amber-500 text-slate-950 px-4 text-sm font-semibold">Buscar</button>
          </div>
          <p className="text-[11px] text-slate-600">Fuente: MusicBrainz API (discografías completas del rock argentino)</p>
          {artists.map(a => (
            <button key={a.id} onClick={() => pickArtist(a)}
              className="w-full text-left rounded-xl bg-slate-900 border border-slate-800 p-3 hover:border-amber-500/50">
              <div className="font-medium">{a.name}</div>
              {a.detail && <div className="text-xs text-slate-500">{a.detail}</div>}
            </button>
          ))}
        </>
      )}

      {artist && !album && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => { setArtist(null); setAlbums(null) }} className="p-1 text-slate-400"><ChevronLeft size={22} /></button>
            <h2 className="font-bold truncate">{artist.name}</h2>
          </div>
          {loading && <p className="text-slate-500 text-sm">Cargando discografía...</p>}
          {(albums || []).map(al => (
            <button key={al.id} onClick={() => pickAlbum(al)}
              className="w-full text-left rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-3 hover:border-amber-500/50">
              <Music size={18} className="text-slate-600 shrink-0" />
              <div><div className="font-medium">{al.title}</div>{al.year && <div className="text-xs text-slate-500">{al.year}</div>}</div>
            </button>
          ))}
        </>
      )}

      {album && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setAlbum(null)} className="p-1 text-slate-400"><ChevronLeft size={22} /></button>
            <h2 className="font-bold truncate">{album.title} <span className="text-slate-500 font-normal text-sm">{album.year}</span></h2>
          </div>
          {loading && <p className="text-slate-500 text-sm">Cargando temas...</p>}
          {(tracks || []).map(t => {
            const isAdded = added.has(`${album.id}|${t}`) || state.songs.some(s => s.title === t && s.artist === artist.name)
            return (
              <div key={t} className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-3">
                <div className="flex-1 font-medium truncate">{t}</div>
                <button onClick={() => !isAdded && add(t)} disabled={isAdded}
                  className={`p-2 rounded-lg ${isAdded ? 'text-emerald-500' : 'text-amber-400 hover:bg-slate-800'}`}>
                  {isAdded ? <Check size={18} /> : <Plus size={18} />}
                </button>
              </div>
            )
          })}
        </>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  )
}
