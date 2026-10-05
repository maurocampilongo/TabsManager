// Construye enlaces a LaCuerda.net (Opcion A: enlace directo verificado + fallback busqueda)
export function slugify(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function directUrl(artist, title) {
  return `https://acordes.lacuerda.net/${slugify(artist)}/${slugify(title)}`
}

export function searchUrl(artist, title) {
  // Cada termino se encodea por separado; los '+' literales actuan como espacios
  const q = `${artist} ${title}`.trim().split(/\s+/).map(encodeURIComponent).join('+')
  return `https://acordes.lacuerda.net/busca.php?exp=${q}`
}
