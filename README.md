# 🎸 TabManager

PWA mobile-first para guitarristas: organiza setlists con enlaces directos a **LaCuerda.net** y explora discografías (MusicBrainz + iTunes).

## Features
- 📋 **Setlists** con drag & drop (SortableJS), relación muchos-a-muchos canción↔lista
- 🎵 **Biblioteca** con título, artista, álbum, año, notas y link a LaCuerda.net (`acordes.lacuerda.net/{artista}/{cancion}` con fallback a búsqueda)
- 🔎 **Explorar**: discografías completas vía MusicBrainz API (sin API key)
- ☁️ **Sync** entre dispositivos con GitHub Gist privado (PAT con scope `gist`)
- 📱 **PWA** instalable (iOS/Android), modo oscuro

## Dev
```bash
npm install
npm run dev
```

## Deploy
Push a `main` → GitHub Actions publica en `https://<usuario>.github.io/tabmanager`.
Requiere habilitar GitHub Pages (Source: GitHub Actions) en Settings → Pages.
