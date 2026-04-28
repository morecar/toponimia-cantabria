import { describe, it, expect } from 'vitest'
import { parseExpression, evaluateExpression, shouldShowPreview, normalizeQuery } from '../queryParser'

describe('normalizeQuery', () => {
  it('normalizes pipe operators', () => {
    expect(normalizeQuery('a||b')).toBe('a | b')
    expect(normalizeQuery('a |b')).toBe('a | b')
  })

  it('normalizes ampersand operators', () => {
    expect(normalizeQuery('a&&b')).toBe('a & b')
    expect(normalizeQuery('a &b')).toBe('a & b')
  })
})

describe('parseExpression', () => {
  it('returns null for empty input', () => {
    expect(parseExpression('', [])).toBeNull()
    expect(parseExpression('   ', [])).toBeNull()
  })

  it('parses a simple regex term', () => {
    const groups = parseExpression('valle', [])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(1)
    expect(groups[0][0]).toMatchObject({ type: 'regex', pattern: 'valle', negated: false })
  })

  it('recognises a known tag', () => {
    const groups = parseExpression('geo:rio', ['geo:rio', 'geo:monte'])
    expect(groups[0][0]).toMatchObject({ type: 'tag', key: 'geo:rio' })
  })

  it('parses OR clauses', () => {
    const groups = parseExpression('rio | monte', [])
    expect(groups).toHaveLength(2)
  })

  it('parses AND terms', () => {
    const groups = parseExpression('rio & ason', [])
    expect(groups[0]).toHaveLength(2)
  })

  it('parses negation', () => {
    const groups = parseExpression('!valle', [])
    expect(groups[0][0].negated).toBe(true)
  })
})

describe('shouldShowPreview', () => {
  it('returns false for a single plain regex term', () => {
    const groups = parseExpression('valle', [])
    expect(shouldShowPreview(groups)).toBe(false)
  })

  it('returns true for OR expression', () => {
    const groups = parseExpression('rio | monte', [])
    expect(shouldShowPreview(groups)).toBe(true)
  })

  it('returns true for AND expression', () => {
    const groups = parseExpression('rio & ason', [])
    expect(shouldShowPreview(groups)).toBe(true)
  })

  it('returns true for negated term', () => {
    const groups = parseExpression('!valle', [])
    expect(shouldShowPreview(groups)).toBe(true)
  })

  it('returns true for a tag term', () => {
    const groups = parseExpression('geo:rio', ['geo:rio'])
    expect(shouldShowPreview(groups)).toBe(true)
  })
})

describe('evaluateExpression', () => {
  // Entry without accents so plain-text includes() works predictably
  const entry = { title: 'Rio Ason', tags: ['geo:rio', 'region:oriental'] }

  it('matches plain text (case-insensitive)', () => {
    const groups = parseExpression('ason', [])
    expect(evaluateExpression(entry, groups, false)).toBe(true)
    expect(evaluateExpression({ title: 'Monte Mayor', tags: [] }, groups, false)).toBe(false)
  })

  it('matches regex pattern', () => {
    const groups = parseExpression('Rio.*', [])
    expect(evaluateExpression(entry, groups, true)).toBe(true)
    expect(evaluateExpression({ title: 'Monte Mayor', tags: [] }, groups, true)).toBe(false)
  })

  it('matches tag', () => {
    const groups = parseExpression('geo:rio', ['geo:rio'])
    expect(evaluateExpression(entry, groups, true)).toBe(true)
    expect(evaluateExpression({ title: 'Rio Ason', tags: ['geo:monte'] }, groups, true)).toBe(false)
  })

  it('evaluates negation', () => {
    const groups = parseExpression('!ason', [])
    expect(evaluateExpression(entry, groups, false)).toBe(false)
    expect(evaluateExpression({ title: 'Monte Mayor', tags: [] }, groups, false)).toBe(true)
  })

  it('evaluates OR: matches either clause', () => {
    const groups = parseExpression('ason | lamazon', [])
    expect(evaluateExpression(entry, groups, false)).toBe(true)
    expect(evaluateExpression({ title: 'Rio Lamazon', tags: [] }, groups, false)).toBe(true)
    expect(evaluateExpression({ title: 'Monte Mayor', tags: [] }, groups, false)).toBe(false)
  })

  it('evaluates AND: requires all terms', () => {
    const groups = parseExpression('rio & ason', [])
    expect(evaluateExpression(entry, groups, false)).toBe(true)
    expect(evaluateExpression({ title: 'Rio Mayor', tags: [] }, groups, false)).toBe(false)
  })
})
