import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scheduleDriveSync } from './driveSync'

// Custom storage keeps the existing localStorage key names so Drive sync is unaffected.
const legacyStorage = {
  getItem: () => ({
    state: {
      drafts:            JSON.parse(localStorage.getItem('draftToponyms')    ?? '[]'),
      draftEtymologies:  JSON.parse(localStorage.getItem('draftEtymologies') ?? '[]'),
    },
  }),
  setItem: (_, { state }) => {
    localStorage.setItem('draftToponyms',    JSON.stringify(state.drafts))
    localStorage.setItem('draftEtymologies', JSON.stringify(state.draftEtymologies))
  },
  removeItem: () => {
    localStorage.removeItem('draftToponyms')
    localStorage.removeItem('draftEtymologies')
  },
}

export const useDraftStore = create(
  persist(
    (set, get) => ({
      drafts: [],
      draftEtymologies: [],

      // ── Draft toponyms ──────────────────────────────────────────────────────
      saveDraft: (draft) => {
        set(s => {
          const idx = s.drafts.findIndex(d => d.draftId === draft.draftId)
          return {
            drafts: idx >= 0
              ? s.drafts.map((d, i) => i === idx ? draft : d)
              : [...s.drafts, draft],
          }
        })
        scheduleDriveSync()
      },

      deleteDraft: (draftId) => {
        set(s => ({ drafts: s.drafts.filter(d => d.draftId !== draftId) }))
        scheduleDriveSync()
      },

      newDraftId: () => {
        const nums = get().drafts.map(d => parseInt(d.draftId.replace('draft-', '')) || 0)
        return `draft-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
      },

      // ── Draft etymologies ───────────────────────────────────────────────────
      saveDraftEtymology: (etym) => {
        set(s => {
          const idx = s.draftEtymologies.findIndex(e => e.id === etym.id)
          return {
            draftEtymologies: idx >= 0
              ? s.draftEtymologies.map((e, i) => i === idx ? etym : e)
              : [...s.draftEtymologies, etym],
          }
        })
        scheduleDriveSync()
      },

      deleteDraftEtymology: (id) => {
        set(s => ({ draftEtymologies: s.draftEtymologies.filter(e => e.id !== id) }))
        scheduleDriveSync()
      },

      newDraftEtymId: () => {
        const nums = get().draftEtymologies.map(e => parseInt(e.id.replace('draftEtym-', '')) || 0)
        return `draftEtym-${String(Math.max(0, ...nums) + 1).padStart(3, '0')}`
      },
    }),
    { name: 'draft-store', storage: legacyStorage }
  )
)

// ── Backwards-compatible non-hook accessors ───────────────────────────────────
// Components not yet using hooks can still call these directly.
export const getDrafts            = () => useDraftStore.getState().drafts
export const getDraftEtymologies  = () => useDraftStore.getState().draftEtymologies
export const saveDraft            = (d)  => useDraftStore.getState().saveDraft(d)
export const deleteDraft          = (id) => useDraftStore.getState().deleteDraft(id)
export const newDraftId           = ()   => useDraftStore.getState().newDraftId()
export const saveDraftEtymology   = (e)  => useDraftStore.getState().saveDraftEtymology(e)
export const deleteDraftEtymology = (id) => useDraftStore.getState().deleteDraftEtymology(id)
export const newDraftEtymId       = ()   => useDraftStore.getState().newDraftEtymId()

// ── Export ────────────────────────────────────────────────────────────────────
export function exportDrafts(drafts) {
  const active  = drafts.filter(d => !d.deleted)
  const deleted = drafts.filter(d =>  d.deleted && d.hash)

  const toponyms = active.map(d => ({
    hash: d.hash || 'PENDING',
    name: d.name,
    type: d.type,
    coordinates: coordsToString(d.type, d.coordinates),
    tags: (d.tags || []).join(','),
    ...(d.vernacular             ? { vernacular: d.vernacular }        : {}),
    ...(d.notes                  ? { notes: d.notes }                  : {}),
    ...(d.attestations?.length   ? { attestations: d.attestations }   : {}),
    ...(d.etymology_ids?.length  ? { etymology_ids: d.etymology_ids } : {}),
  }))

  const allDraftEtyms       = getDraftEtymologies()
  const newEtymologies      = allDraftEtyms.filter(e => !e.deleted)
  const deletedEtymologies  = allDraftEtyms.filter(e =>  e.deleted).map(e => e.id)

  const out = { toponyms }
  if (deleted.length)             out.to_delete_toponyms    = deleted.map(d => d.hash)
  if (newEtymologies.length)      out.new_etymologies       = newEtymologies
  if (deletedEtymologies.length)  out.to_delete_etymologies = deletedEtymologies
  return JSON.stringify(out, null, 2)
}

function coordsToString(type, coordinates) {
  if (!coordinates?.length) return ''
  if (type === 'point') return `${coordinates[0][0]},${coordinates[0][1]}`
  return coordinates.map(([lat, lng]) => `${lat},${lng}`).join(';')
}
