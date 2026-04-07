import { useState, useRef, useEffect } from 'react'
import { getDraftEtymologies, saveDraftEtymology, newDraftEtymId } from '../../model/draftStore'
import { EMPTY_NEW_ETYM, stripFmt, stripFmtInline } from './constants'

// ── Wiktionary links for single-word Latin etyma ─────────────────────────────
function WiktLinks({ origin }) {
  const word = origin.replace(/^\*+(.+?)\*+$/, '$1')
  if (word.includes(' ')) return null
  const w = encodeURIComponent(word.toLowerCase())
  return (
    <span className="bo-wikt-links">
      <a href={`https://en.wiktionary.org/wiki/${w}#Latin`} target="_blank" rel="noreferrer" className="bo-wikt-link">en</a>
      <a href={`https://es.wiktionary.org/wiki/${w}#Latin`} target="_blank" rel="noreferrer" className="bo-wikt-link">es</a>
    </span>
  )
}

export default function EtymologySelector({ etymology_ids, etymologyStore, onChange }) {
  const [query, setQuery]               = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating]         = useState(false)
  const [newEtym, setNewEtym]           = useState(EMPTY_NEW_ETYM)
  const [draftEtyms, setDraftEtyms]     = useState(() => getDraftEtymologies())
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Prefer drafts over committed when IDs match (draft = edited override)
  const draftIds = new Set(draftEtyms.map(e => e.id))
  const allEtymologies = [
    ...Array.from(etymologyStore?.byId?.values() || []).filter(e => !draftIds.has(e.id)),
    ...draftEtyms,
  ]

  const lq = query.toLowerCase()
  const filtered = query.length > 0
    ? allEtymologies.filter(e =>
        (e.origin  || '').toLowerCase().includes(lq) ||
        (e.meaning || '').toLowerCase().includes(lq) ||
        (e.notes   || '').toLowerCase().includes(lq)
      )
    : allEtymologies

  const selectedEtymologies = etymology_ids.map(id =>
    allEtymologies.find(e => e.id === id)
  ).filter(Boolean)

  const handleSelect = (etym) => {
    if (!etymology_ids.includes(etym.id)) onChange([...etymology_ids, etym.id])
    setQuery('')
    setShowDropdown(false)
  }

  const handleCreate = () => {
    if (!newEtym.origin.trim()) return
    const id   = newDraftEtymId()
    const etym = { ...newEtym, id }
    saveDraftEtymology(etym)
    setDraftEtyms(getDraftEtymologies())
    onChange([...etymology_ids, id])
    setCreating(false)
    setNewEtym(EMPTY_NEW_ETYM)
  }

  const newField = (key, value) => setNewEtym(e => ({ ...e, [key]: value }))

  return (
    <div className="bo-etym-wrap" ref={wrapRef}>
      {selectedEtymologies.map(e => (
        <div key={e.id} className="bo-etym-chip">
          <div className="bo-etym-chip-body">
            <strong>{stripFmt(e.origin)}</strong>
            <WiktLinks origin={e.origin} />
            {e.meaning && <span> — {stripFmtInline(e.meaning)}</span>}
          </div>
          <button className="bo-btn-icon" onClick={() => onChange(etymology_ids.filter(id => id !== e.id))}>×</button>
        </div>
      ))}

      {!creating && (
        <div className="bo-etym-search-row">
          <div className="bo-etym-search-wrap">
            <input
              className="bo-input"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar etimología existente…"
            />
            {showDropdown && (
              <div className="bo-dropdown">
                {filtered.length === 0 && (
                  <div className="bo-dropdown-empty">Sin resultados</div>
                )}
                {filtered.map(e => (
                  <button key={e.id} className="bo-dropdown-item" onClick={() => handleSelect(e)}>
                    <strong>{stripFmt(e.origin)}</strong>
                    {e.meaning && <span className="bo-dropdown-sub"> — {stripFmtInline(e.meaning)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bo-btn bo-btn-sm" onClick={() => { setShowDropdown(false); setCreating(true) }}>
            + Nueva
          </button>
        </div>
      )}

      {creating && (
        <div className="bo-etym-new-form">
          <input className="bo-input" placeholder="Origen *" value={newEtym.origin}
            onChange={e => newField('origin', e.target.value)} />
          <input className="bo-input" placeholder="Significado" value={newEtym.meaning}
            onChange={e => newField('meaning', e.target.value)} />
          <textarea className="bo-input bo-textarea" placeholder="Notas" rows={2}
            value={newEtym.notes} onChange={e => newField('notes', e.target.value)} />
          <div className="bo-etym-new-actions">
            <button className="bo-btn bo-btn-primary bo-btn-sm"
              onClick={handleCreate} disabled={!newEtym.origin.trim()}>
              Añadir
            </button>
            <button className="bo-btn bo-btn-sm" onClick={() => { setCreating(false); setNewEtym(EMPTY_NEW_ETYM) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
