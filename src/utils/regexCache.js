const cache = new Map()

/**
 * Returns a cached RegExp for the given pattern and flags.
 * Global regexes (flag 'g' or 'gi') have lastIndex reset before being returned
 * so callers can safely start a fresh exec() loop each time.
 */
export function getCachedRegex(pattern, flags = '') {
  const key = `${flags}:${pattern}`
  let re = cache.get(key)
  if (!re) {
    re = new RegExp(pattern, flags)
    cache.set(key, re)
  }
  if (flags.includes('g')) re.lastIndex = 0
  return re
}
