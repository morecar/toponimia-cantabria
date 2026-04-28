import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock driveSync so tests don't fire real network calls
vi.mock('../driveSync', () => ({ scheduleDriveSync: vi.fn() }))

import { useDraftStore, saveDraft, deleteDraft, newDraftId, saveDraftEtymology, deleteDraftEtymology, newDraftEtymId, getDrafts, getDraftEtymologies } from '../draftStore'

const DRAFT = (id = 'draft-001') => ({
  draftId: id, hash: null, name: 'Lugar de prueba', type: 'point',
  coordinates: [[43.1, -3.8]], tags: [], attestations: [], etymology_ids: [], notes: '',
})

const ETYM = (id = 'draftEtym-001') => ({ id, origin: 'VALLIS', meaning: 'valle', notes: '', tags: '' })

beforeEach(() => {
  // Reset store state between tests
  useDraftStore.setState({ drafts: [], draftEtymologies: [] })
  localStorage.clear()
})

describe('draft toponyms', () => {
  it('saveDraft adds a new draft', () => {
    saveDraft(DRAFT())
    expect(getDrafts()).toHaveLength(1)
    expect(getDrafts()[0].name).toBe('Lugar de prueba')
  })

  it('saveDraft updates an existing draft with same draftId', () => {
    saveDraft(DRAFT())
    saveDraft({ ...DRAFT(), name: 'Nombre actualizado' })
    const drafts = getDrafts()
    expect(drafts).toHaveLength(1)
    expect(drafts[0].name).toBe('Nombre actualizado')
  })

  it('deleteDraft removes the draft', () => {
    saveDraft(DRAFT())
    deleteDraft('draft-001')
    expect(getDrafts()).toHaveLength(0)
  })

  it('deleteDraft is a no-op for unknown id', () => {
    saveDraft(DRAFT())
    deleteDraft('draft-999')
    expect(getDrafts()).toHaveLength(1)
  })

  it('newDraftId returns draft-001 when store is empty', () => {
    expect(newDraftId()).toBe('draft-001')
  })

  it('newDraftId increments from highest existing id', () => {
    saveDraft(DRAFT('draft-005'))
    expect(newDraftId()).toBe('draft-006')
  })
})

describe('draft etymologies', () => {
  it('saveDraftEtymology adds a new etymology', () => {
    saveDraftEtymology(ETYM())
    expect(getDraftEtymologies()).toHaveLength(1)
    expect(getDraftEtymologies()[0].origin).toBe('VALLIS')
  })

  it('saveDraftEtymology updates existing by id', () => {
    saveDraftEtymology(ETYM())
    saveDraftEtymology({ ...ETYM(), origin: 'AQUA' })
    const etyms = getDraftEtymologies()
    expect(etyms).toHaveLength(1)
    expect(etyms[0].origin).toBe('AQUA')
  })

  it('deleteDraftEtymology removes the etymology', () => {
    saveDraftEtymology(ETYM())
    deleteDraftEtymology('draftEtym-001')
    expect(getDraftEtymologies()).toHaveLength(0)
  })

  it('newDraftEtymId returns draftEtym-001 when store is empty', () => {
    expect(newDraftEtymId()).toBe('draftEtym-001')
  })

  it('newDraftEtymId increments from highest existing id', () => {
    saveDraftEtymology(ETYM('draftEtym-003'))
    expect(newDraftEtymId()).toBe('draftEtym-004')
  })
})
