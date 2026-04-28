import { getCachedRegex } from '../utils/regexCache'

/**
 * Parses an advanced boolean expression (regex mode) into OR groups of AND terms.
 *
 * Syntax:
 *   expr   = clause (' | ' clause)*
 *   clause = term   (' & ' term)*
 *   term   = ['!'] (tagKey | regexPattern)
 *
 * Tag keys: exact match against knownTags (case-insensitive, spaces around ':' ignored).
 * Returns null if input is empty.
 */
export function normalizeQuery(input) {
  return input
    .replace(/\s*\|{1,2}\s*/g, ' | ')
    .replace(/\s*&{1,2}\s*/g, ' & ')
}

export function parseExpression(input, knownTags) {
  if (!input || !input.trim()) return null

  const src = normalizeQuery(input)
  const groups = src.split(' | ').map(clause =>
    clause.split(' & ').map(term => {
      const t = term.trim()
      if (!t) return null
      const negated = t.startsWith('!')
      const val = negated ? t.slice(1).trim() : t
      const normTag = val.toLowerCase().replace(/\s*:\s*/, ':')
      const isTag = knownTags.includes(normTag)
      return { type: isTag ? 'tag' : 'regex', key: normTag, pattern: val, negated }
    }).filter(Boolean)
  ).filter(g => g.length > 0)

  return groups.length > 0 ? groups : null
}

/**
 * Returns true when the parsed expression is "interesting" enough to show a preview:
 * at least one tag token, boolean operator, or negation.
 */
export function shouldShowPreview(groups) {
  if (!groups || groups.length === 0) return false
  if (groups.length > 1) return true               // OR operator
  if (groups[0].length > 1) return true            // AND operator
  const term = groups[0][0]
  return term.negated || term.type === 'tag'
}

/**
 * Evaluates entry against the parsed expression.
 * groups: output of parseExpression
 * useRegex: whether regex terms do regexp matching (vs plain text)
 */
export function evaluateExpression(entry, groups, useRegex) {
  return groups.some(andTerms =>
    andTerms.every(term => {
      let matches
      if (term.type === 'tag') {
        matches = (entry.tags || []).includes(term.key)
      } else if (useRegex) {
        try { matches = getCachedRegex(term.pattern, 'i').test(entry.title) }
        catch { matches = false }
      } else {
        matches = entry.title.toLowerCase().includes(term.pattern.toLowerCase())
      }
      return term.negated ? !matches : matches
    })
  )
}
