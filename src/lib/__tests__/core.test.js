import { describe, it, expect } from 'vitest'
import { slugify, directUrl, searchUrl } from '../lacuerda'
import { mergeStates } from '../store'

describe('slugify (LaCuerda URLs)', () => {
  it('minúsculas y guiones bajos', () => {
    expect(slugify('De Música Ligera')).toBe('de_musica_ligera')
  })
  it('quita acentos', () => {
    expect(slugify('Corazón Delator')).toBe('corazon_delator')
    expect(slugify('Soda Stéreo')).toBe('soda_stereo')
  })
  it('quita apóstrofes y signos', () => {
    expect(slugify("Don't Cry")).toBe('dont_cry')
    expect(slugify('¿Y Ahora Qué?')).toBe('y_ahora_que')
  })
  it('urls conocidas', () => {
    expect(directUrl('Soda Stereo', 'De Música Ligera')).toBe('https://acordes.lacuerda.net/soda_stereo/de_musica_ligera')
    expect(directUrl('Airbag', 'Cae el Sol')).toBe('https://acordes.lacuerda.net/airbag/cae_el_sol')
  })
  it('fallback de búsqueda', () => {
    expect(searchUrl('Soda Stereo', 'Zoom')).toBe('https://acordes.lacuerda.net/busca.php?exp=Soda+Stereo+Zoom')
  })
})

describe('mergeStates (sync)', () => {
  const local = {
    songs: [{ id: 'a', title: 'T1', artist: 'X', notes: 'local' }, { id: 'b', title: 'T2', artist: 'X' }],
    lists: [{ id: 'l1', name: 'Rock', songIds: ['a', 'b'], notes: { a: 'nota local' } }],
  }
  const remote = {
    songs: [{ id: 'a', title: 'T1', artist: 'X', notes: '' }, { id: 'c', title: 'T3', artist: 'Y' }],
    lists: [{ id: 'l1', name: 'Rock', songIds: ['a', 'c'], notes: { a: 'nota remota', c: 'nueva' } }, { id: 'l2', name: 'Ensayos', songIds: ['c'] }],
  }
  const m = mergeStates(local, remote)

  it('une canciones sin duplicar', () => {
    expect(m.songs.map(s => s.id).sort()).toEqual(['a', 'b', 'c'])
  })
  it('en conflicto gana la versión local', () => {
    expect(m.songs.find(s => s.id === 'a').notes).toBe('local')
  })
  it('une listas y songIds preservando orden local', () => {
    expect(m.lists.find(l => l.id === 'l1').songIds).toEqual(['a', 'b', 'c'])
    expect(m.lists.some(l => l.id === 'l2')).toBe(true)
  })
  it('fusiona notas por entrada', () => {
    const notes = m.lists.find(l => l.id === 'l1').notes
    expect(notes.a).toBe('nota local')
    expect(notes.c).toBe('nueva')
  })
  it('tolera estados vacíos', () => {
    expect(mergeStates({ songs: [], lists: [] }, { songs: [], lists: [] })).toEqual({ songs: [], lists: [] })
  })
})
