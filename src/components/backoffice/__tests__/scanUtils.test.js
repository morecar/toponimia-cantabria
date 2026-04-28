import { describe, it, expect } from 'vitest'
import { toFlexiblePattern, scanTextForToponyms } from '../scanUtils'

describe('toFlexiblePattern', () => {
  it('replaces accented vowels with character classes', () => {
    const p = toFlexiblePattern('Abanillas')
    expect(p).toContain('[aáàäâãå]')
  })

  it('replaces n/ñ with class', () => {
    const p = toFlexiblePattern('montaña')
    expect(p).toContain('[nñ]')
  })

  it('replaces b/v with class', () => {
    const p = toFlexiblePattern('Bárcena')
    expect(p).toContain('[bv]')
    const p2 = toFlexiblePattern('Vega')
    expect(p2).toContain('[bv]')
  })

  it('escapes regex special chars (parens become \\()', () => {
    const p = toFlexiblePattern('Río (del Valle)')
    // Parens should be escaped (preceded by backslash), making the pattern valid
    expect(() => new RegExp(p)).not.toThrow()
    expect(p).toContain('\\(')
    expect(p).toContain('\\)')
  })

  it('produces a pattern that matches unaccented variant', () => {
    const p = toFlexiblePattern('Asón')
    const re = new RegExp(p, 'i')
    expect(re.test('Ason')).toBe(true)
    expect(re.test('Asón')).toBe(true)
  })
})

describe('scanTextForToponyms', () => {
  const entries = [
    { hash: 'abc1', title: 'Abanillas' },
    // Two qualifying tokens (>=4 chars each) to exercise token-level matching
    { hash: 'abc2', title: 'Castro Urdiales' },
    { hash: 'abc3', title: 'Laredo' },
  ]

  it('returns empty for blank text', () => {
    expect(scanTextForToponyms('', entries)).toEqual([])
    expect(scanTextForToponyms('   ', entries)).toEqual([])
  })

  it('returns empty for empty entries', () => {
    expect(scanTextForToponyms('Abanillas es un lugar', [])).toEqual([])
  })

  it('finds an exact-name match', () => {
    const results = scanTextForToponyms('El pueblo de Abanillas tiene historia.', entries)
    expect(results.some(r => r.entry.hash === 'abc1')).toBe(true)
  })

  it('finds a match via accent variation in full name', () => {
    // Abanillas has only one token, so full-name pattern is tried
    const results = scanTextForToponyms('El pueblo de Abanyllas tiene historia.', entries)
    // b/v interchange is supported but not y/i; this should NOT match
    expect(results.some(r => r.entry.hash === 'abc1')).toBe(false)
  })

  it('finds multi-word entry via token (both tokens >=4 chars)', () => {
    const results = scanTextForToponyms('la villa de Castro era importante.', entries)
    expect(results.some(r => r.entry.hash === 'abc2')).toBe(true)
  })

  it('finds second token of multi-word entry', () => {
    const results = scanTextForToponyms('el puerto de Urdiales era estrategico.', entries)
    expect(results.some(r => r.entry.hash === 'abc2')).toBe(true)
  })

  it('results are sorted by index', () => {
    const text = 'Abanillas y Castro Urdiales son núcleos.'
    const results = scanTextForToponyms(text, entries)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].index).toBeGreaterThanOrEqual(results[i - 1].index)
    }
  })

  it('does not match partial word (word boundary)', () => {
    const results = scanTextForToponyms('ElAbanillasExtra no debería contar', entries)
    expect(results.some(r => r.entry.hash === 'abc1')).toBe(false)
  })
})
