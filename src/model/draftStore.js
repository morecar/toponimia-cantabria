const KEY      = 'draftToponyms'
const ETYM_KEY = 'draftEtymologies'

// ── Draft toponyms ────────────────────────────────────────────────────────────
export function getDrafts() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function saveDraft(draft) {
  const drafts = getDrafts()
  const idx = drafts.findIndex(d => d.draftId === draft.draftId)
  if (idx >= 0) drafts[idx] = draft
  else drafts.push(draft)
  localStorage.setItem(KEY, JSON.stringify(drafts))
}

export function deleteDraft(draftId) {
  localStorage.setItem(KEY, JSON.stringify(getDrafts().filter(d => d.draftId !== draftId)))
}

export function newDraftId() {
  const nums = getDrafts().map(d => parseInt(d.draftId.replace('draft-', '')) || 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `draft-${String(next).padStart(3, '0')}`
}

// ── Draft etymologies ─────────────────────────────────────────────────────────
export function getDraftEtymologies() {
  try { return JSON.parse(localStorage.getItem(ETYM_KEY)) || [] }
  catch { return [] }
}

export function saveDraftEtymology(etym) {
  const all = getDraftEtymologies()
  const idx = all.findIndex(e => e.id === etym.id)
  if (idx >= 0) all[idx] = etym
  else all.push(etym)
  localStorage.setItem(ETYM_KEY, JSON.stringify(all))
}

export function deleteDraftEtymology(id) {
  localStorage.setItem(ETYM_KEY, JSON.stringify(getDraftEtymologies().filter(e => e.id !== id)))
}

export function newDraftEtymId() {
  const nums = getDraftEtymologies().map(e => parseInt(e.id.replace('draftEtym-', '')) || 0)
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `draftEtym-${String(next).padStart(3, '0')}`
}

// ── Export ────────────────────────────────────────────────────────────────────
export function exportDrafts(drafts) {
  const toponyms = drafts.map(d => ({
    hash: 'PENDING',
    name: d.name,
    type: d.type,
    coordinates: coordsToString(d.type, d.coordinates),
    tags: (d.tags || []).join(','),
    ...(d.vernacular             ? { vernacular: d.vernacular }          : {}),
    ...(d.attestations?.length   ? { attestations: d.attestations }     : {}),
    ...(d.etymology_ids?.length  ? { etymology_ids: d.etymology_ids }   : {}),
  }))
  const newEtymologies = getDraftEtymologies()
  return JSON.stringify(
    newEtymologies.length ? { toponyms, new_etymologies: newEtymologies } : { toponyms },
    null, 2
  )
}

function coordsToString(type, coordinates) {
  if (!coordinates?.length) return ''
  if (type === 'point') return `${coordinates[0][0]},${coordinates[0][1]}`
  return coordinates.map(([lat, lng]) => `${lat},${lng}`).join(';')
}
