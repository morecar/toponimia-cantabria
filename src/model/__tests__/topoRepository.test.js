import { describe, it, expect } from 'vitest'
import { _TopoRepository as TopoRepository } from '../topoRepository'

const DB = [
  { hash: 'h1', title: 'Abanillas',      type: 'point', tags: ['geo:localidad'], etymology_ids: [], attestations: [], coordinates: [], notes: '' },
  { hash: 'h2', title: 'Río Asón',       type: 'line',  tags: ['geo:rio'],       etymology_ids: [], attestations: [], coordinates: [], notes: '' },
  { hash: 'h3', title: 'Monte Hijedo',   type: 'point', tags: ['geo:monte'],     etymology_ids: [], attestations: [], coordinates: [], notes: '' },
  { hash: 'h4', title: 'Valle de Buelna', type: 'poly', tags: ['geo:valle'],     etymology_ids: [], attestations: [], coordinates: [], notes: '' },
]

describe('TopoRepository', () => {
  it('sorts entries alphabetically on construction', () => {
    const repo = new TopoRepository(DB)
    const titles = repo.getAllEntries().map(e => e.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })

  it('handles null/undefined database gracefully', () => {
    const repo = new TopoRepository(null)
    expect(repo.getAllEntries()).toHaveLength(0)
  })

  it('getAllEntries returns all items', () => {
    const repo = new TopoRepository(DB)
    expect(repo.getAllEntries()).toHaveLength(4)
  })

  it('getFromId finds by hash', () => {
    const repo = new TopoRepository(DB)
    expect(repo.getFromId('h2').title).toBe('Río Asón')
  })

  it('getFromId returns undefined for unknown hash', () => {
    const repo = new TopoRepository(DB)
    expect(repo.getFromId('zzz')).toBeUndefined()
  })

  it('getAllTags returns unique tag set', () => {
    const repo = new TopoRepository(DB)
    const tags = repo.getAllTags()
    expect(tags).toContain('geo:rio')
    expect(tags).toContain('geo:monte')
    expect(new Set(tags).size).toBe(tags.length)
  })

  describe('getFromQueryString (non-regex)', () => {
    it('returns all entries for empty query', () => {
      const repo = new TopoRepository(DB)
      expect(repo.getFromQueryString('', false)).toHaveLength(4)
    })

    it('filters by substring (case-insensitive)', () => {
      const repo = new TopoRepository(DB)
      const results = repo.getFromQueryString('asón', false)
      expect(results).toHaveLength(1)
      expect(results[0].hash).toBe('h2')
    })

    it('returns empty when no match', () => {
      const repo = new TopoRepository(DB)
      expect(repo.getFromQueryString('Zaragoza', false)).toHaveLength(0)
    })
  })

  describe('getFromQueryString (regex mode)', () => {
    it('matches exact title pattern (regex wraps as ^...$)', () => {
      // Regex mode wraps query as `^${query}$` for full-title match
      const repo = new TopoRepository(DB)
      const results = repo.getFromQueryString('Río Asón', true)
      expect(results).toHaveLength(1)
      expect(results[0].hash).toBe('h2')
    })

    it('matches title with regex wildcards', () => {
      const repo = new TopoRepository(DB)
      const results = repo.getFromQueryString('Río.*', true)
      expect(results).toHaveLength(1)
      expect(results[0].hash).toBe('h2')
    })

    it('evaluates tag filter expression', () => {
      const repo = new TopoRepository(DB)
      const results = repo.getFromQueryString('geo:rio', true)
      expect(results).toHaveLength(1)
      expect(results[0].hash).toBe('h2')
    })

    it('evaluates negation tag filter', () => {
      const repo = new TopoRepository(DB)
      const results = repo.getFromQueryString('!geo:rio', true)
      expect(results.every(e => e.hash !== 'h2')).toBe(true)
    })
  })
})
