function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toFlexiblePattern(str) {
  const base = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const vowelGroups = { a: 'aáàäâãå', e: 'eéèëê', i: 'iíìïî', o: 'oóòöôõ', u: 'uúùüû' }
  return base.split('').map(ch => {
    const l = ch.toLowerCase()
    if (vowelGroups[l]) return `[${vowelGroups[l]}]`
    if (l === 'n')           return '[nñ]'
    if (l === 'b' || l === 'v') return '[bv]'
    return escapeRegex(ch)
  }).join('')
}

const MIN_TOKEN   = 4
const SKIP_TOKENS = new Set(['este', 'esta', 'ello', 'para', 'entre', 'sobre', 'bajo', 'hasta', 'desde', 'junto', 'dicho'])

function getTokens(name) {
  return name
    .split(/[\s\-/,.()+]+/)
    .filter(t => t.length >= MIN_TOKEN && !SKIP_TOKENS.has(t.toLowerCase()))
}

export function scanTextForToponyms(text, entries) {
  if (!entries?.length || !text.trim()) return []
  const results = []
  const seen    = new Set()

  const tryMatch = (entry, pattern, matchedToken) => {
    try {
      const re = new RegExp(`(?<![\\wÀ-ÿ])${pattern}(?![\\wÀ-ÿ])`, 'gi')
      let match
      while ((match = re.exec(text)) !== null) {
        const key = `${entry.hash}:${match.index}`
        if (seen.has(key)) continue
        seen.add(key)
        const ctxStart = Math.max(0, match.index - 120)
        const ctxEnd   = Math.min(text.length, match.index + match[0].length + 120)
        results.push({
          entry,
          matchedForm:  text.slice(match.index, match.index + match[0].length),
          matchedToken,
          index:        match.index,
          quote:        text.slice(ctxStart, ctxEnd).trim(),
        })
      }
    } catch {}
  }

  for (const entry of entries) {
    const name = entry.title
    if (!name || name.length < 3) continue
    tryMatch(entry, toFlexiblePattern(name), null)
    const tokens = getTokens(name)
    if (tokens.length > 1) {
      for (const token of tokens) tryMatch(entry, toFlexiblePattern(token), token)
    }
  }

  return results.sort((a, b) => a.index - b.index)
}
