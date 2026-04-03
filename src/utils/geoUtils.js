// ── Geometry helpers for OSM way processing ──────────────────────────────────

// Degrees threshold for considering two points "the same" (~11 m)
const PT_DEDUP_TOL  = 0.0001
// Degrees threshold for detecting a closing loop (~110 m)
const PT_LOOP_TOL   = 0.001

export function ptDist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/**
 * Join OSM ways into a single ordered polyline.
 * Ways in a relation can be stored in any order and direction; this greedy
 * algorithm finds the next connecting segment and reverses it if needed.
 * Extends from BOTH ends of the chain so it works regardless of starting direction.
 * Disconnected segments (gaps > 0.0005°) are silently dropped — force-connecting
 * them with straight lines creates visual artefacts (diamonds, polygons).
 * Returns flat array of [lat, lng] pairs (junction endpoints are NOT deduplicated here).
 */
export function joinWaysOrdered(ways) {
  if (!ways.length) return []
  if (ways.length === 1) return ways[0]

  const segs = ways.map(w => [...w])      // shallow copies (we may reverse)
  const chain = [segs.shift()]

  let progress = true
  while (segs.length && progress) {
    progress = false

    // Try to extend from the tail
    const tail = chain[chain.length - 1].at(-1)
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (ptDist(tail, s[0]) < 0.0005) {
        chain.push(segs.splice(i, 1)[0]); progress = true; break
      }
      if (ptDist(tail, s[s.length - 1]) < 0.0005) {
        chain.push(segs.splice(i, 1)[0].reverse()); progress = true; break
      }
    }
    if (progress) continue

    // Try to extend from the head
    const head = chain[0][0]
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (ptDist(head, s[s.length - 1]) < 0.0005) {
        chain.unshift(segs.splice(i, 1)[0]); progress = true; break
      }
      if (ptDist(head, s[0]) < 0.0005) {
        chain.unshift(segs.splice(i, 1)[0].reverse()); progress = true; break
      }
    }
  }
  // Remaining segs that couldn't connect are dropped (avoids visual teleport lines)

  return chain.flat()
}

/**
 * Sanitize a polyline coordinate array:
 *  1. Remove consecutive duplicate points (junction endpoints are stored twice).
 *  2. Break closing loops: if first ≈ last, remove the last point so the
 *     polyline is open (rivers and canals don't form real loops).
 */
export function sanitizeLineCoords(coords) {
  if (coords.length < 2) return coords

  // 1. Deduplicate consecutive near-identical points
  const deduped = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    if (ptDist(coords[i], deduped[deduped.length - 1]) > PT_DEDUP_TOL) {
      deduped.push(coords[i])
    }
  }

  // 2. Break closing loop (ways that form a cycle in OSM)
  if (deduped.length >= 2 && ptDist(deduped[0], deduped[deduped.length - 1]) < PT_LOOP_TOL) {
    return deduped.slice(0, -1)
  }

  return deduped
}
