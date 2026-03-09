const KEY = 'draftToponyms'

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

export function exportDrafts(drafts) {
  const rows = drafts.map(d => ({
    hash: 'PENDING',
    name: d.name,
    type: d.type,
    coordinates: coordsToString(d.type, d.coordinates),
    tags: (d.tags || []).join(','),
    ...(d.attestations?.length   ? { attestations: d.attestations }     : {}),
    ...(d.etymology_ids?.length  ? { etymology_ids: d.etymology_ids }   : {}),
  }))
  return JSON.stringify(rows, null, 2)
}

function coordsToString(type, coordinates) {
  if (!coordinates?.length) return ''
  if (type === 'point') return `${coordinates[0][0]},${coordinates[0][1]}`
  return coordinates.map(([lat, lng]) => `${lat},${lng}`).join(';')
}
