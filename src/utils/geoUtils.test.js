import { joinWaysOrdered, sanitizeLineCoords } from './geoUtils'

// ── joinWaysOrdered ───────────────────────────────────────────────────────────

describe('joinWaysOrdered', () => {
  test('empty input returns empty array', () => {
    expect(joinWaysOrdered([])).toEqual([])
  })

  test('single way returned as-is', () => {
    const way = [[1, 0], [2, 0], [3, 0]]
    expect(joinWaysOrdered([way])).toEqual([[1, 0], [2, 0], [3, 0]])
  })

  test('two ways that connect head-to-tail are joined', () => {
    const w1 = [[1, 0], [2, 0]]
    const w2 = [[2, 0], [3, 0]]
    // junction point C appears twice (deduplication is a separate step)
    expect(joinWaysOrdered([w1, w2])).toEqual([[1, 0], [2, 0], [2, 0], [3, 0]])
  })

  test('second way is reversed when tail connects', () => {
    const w1 = [[1, 0], [2, 0]]
    const w2 = [[3, 0], [2, 0]]   // stored reversed in OSM
    expect(joinWaysOrdered([w1, w2])).toEqual([[1, 0], [2, 0], [2, 0], [3, 0]])
  })

  test('three ways in wrong order are reordered', () => {
    const w1 = [[1, 0], [2, 0]]
    const w3 = [[3, 0], [4, 0]]
    const w2 = [[2, 0], [3, 0]]   // out of order
    expect(joinWaysOrdered([w1, w3, w2])).toEqual([
      [1, 0], [2, 0],
      [2, 0], [3, 0],
      [3, 0], [4, 0],
    ])
  })

  test('disconnected way is appended when no neighbour found', () => {
    const w1 = [[1, 0], [2, 0]]
    const w2 = [[9, 0], [10, 0]]   // no connection
    const result = joinWaysOrdered([w1, w2])
    expect(result).toEqual([[1, 0], [2, 0], [9, 0], [10, 0]])
  })
})

// ── sanitizeLineCoords ────────────────────────────────────────────────────────

describe('sanitizeLineCoords', () => {
  test('empty array unchanged', () => {
    expect(sanitizeLineCoords([])).toEqual([])
  })

  test('single point unchanged', () => {
    expect(sanitizeLineCoords([[1, 0]])).toEqual([[1, 0]])
  })

  test('non-loop, no duplicates — unchanged', () => {
    const coords = [[1, 0], [2, 0], [3, 0]]
    expect(sanitizeLineCoords(coords)).toEqual([[1, 0], [2, 0], [3, 0]])
  })

  test('removes consecutive duplicate junction points', () => {
    // joinWaysOrdered produces [A, B, C, C, D, E] at junctions
    const coords = [[1, 0], [2, 0], [2, 0], [3, 0]]
    expect(sanitizeLineCoords(coords)).toEqual([[1, 0], [2, 0], [3, 0]])
  })

  test('removes multiple consecutive duplicates', () => {
    const coords = [[1, 0], [2, 0], [2, 0], [2, 0], [3, 0]]
    expect(sanitizeLineCoords(coords)).toEqual([[1, 0], [2, 0], [3, 0]])
  })

  test('removes closing point when first == last (exact)', () => {
    const coords = [[43.228, -3.603], [43.250, -3.550], [43.228, -3.603]]
    expect(sanitizeLineCoords(coords)).toEqual([[43.228, -3.603], [43.250, -3.550]])
  })

  test('removes closing point when first ≈ last (within loop tolerance)', () => {
    // 0.0005° apart — ways that cycle back via joinWaysOrdered
    const first = [43.228, -3.603]
    const last  = [43.2284, -3.6034]   // ~50 m away, within PT_LOOP_TOL
    const coords = [first, [43.250, -3.550], last]
    const result = sanitizeLineCoords(coords)
    expect(result.length).toBe(2)
    expect(result[0]).toEqual(first)
  })

  test('does NOT remove last point when river genuinely reaches far from start', () => {
    // source and mouth of Río Asón are ~17 km apart — must NOT be treated as loop
    const first = [43.2279, -3.6031]
    const last  = [43.2655, -3.4566]   // ~17 km away
    const coords = [first, [43.250, -3.550], last]
    const result = sanitizeLineCoords(coords)
    expect(result.length).toBe(3)
    expect(result[result.length - 1]).toEqual(last)
  })
})
