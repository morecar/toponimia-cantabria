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
 * Returns flat array of [lat, lng] pairs (junction endpoints are NOT deduplicated here).
 */
export function joinWaysOrdered(ways) {
  if (!ways.length) return []
  if (ways.length === 1) return ways[0]

  const segs = ways.map(w => [...w])      // shallow copies (we may reverse)
  const chain = [segs.shift()]

  while (segs.length) {
    const tail = chain[chain.length - 1].at(-1)
    let picked = false

    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      const dHead = ptDist(tail, s[0])
      const dTail = ptDist(tail, s[s.length - 1])

      if (dHead < 0.0005) {                     // head of s connects → append as-is
        chain.push(segs.splice(i, 1)[0])
        picked = true; break
      }
      if (dTail < 0.0005) {                     // tail of s connects → append reversed
        chain.push(segs.splice(i, 1)[0].reverse())
        picked = true; break
      }
    }

    if (!picked) chain.push(segs.shift())       // disconnected segment, just append
  }

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
