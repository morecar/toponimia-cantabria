import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import BackofficeMap from './BackofficeMap'
import {
  getDrafts, saveDraft, deleteDraft, newDraftId, exportDrafts,
  getDraftEtymologies, saveDraftEtymology, newDraftEtymId,
} from '../model/draftStore'
import { ROUTE_HOME } from '../resources/routes'

const EMPTY_FORM = () => ({
  draftId: null,
  name: '',
  vernacular: '',
  type: 'point',
  coordinates: [],
  tags: [],
  attestations: [],
  etymology_ids: [],
})

const EMPTY_ATTESTATION = () => ({ year: '', highlight: '', source: '', quote: '', url: '' })
const EMPTY_NEW_ETYM = () => ({ origin: '', meaning: '', notes: '' })

// ── Tag color by category ─────────────────────────────────────────────────────
function tagColor(tag) {
  if (tag.startsWith('etymology:')) return '#2563eb'
  if (tag.startsWith('feature:'))   return '#d97706'
  return '#6c757d'
}

// ── Tag autocomplete input ────────────────────────────────────────────────────
function TagInput({ tags, knownTags, loc, onChange }) {
  const [query, setQuery]               = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = knownTags.filter(
    t => !tags.includes(t) && t.toLowerCase().includes(query.toLowerCase())
  )
  const trimmed   = query.trim()
  const canCreate = trimmed && !knownTags.includes(trimmed) && !tags.includes(trimmed)

  const addTag = (tag) => {
    onChange([...tags, tag])
    setQuery('')
    setShowDropdown(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) addTag(filtered[0])
      else if (canCreate)       addTag(trimmed)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  return (
    <div className="bo-tag-input-wrap" ref={wrapRef}>
      <div className="bo-tag-chips">
        {tags.map(tag => (
          <span key={tag} className="bo-tag-chip" style={{ background: tagColor(tag) }}>
            {loc.get(`tag_${tag}`) || tag}
            <button className="bo-tag-chip-remove" onClick={() => onChange(tags.filter(t => t !== tag))}>×</button>
          </span>
        ))}
        <input
          className="bo-tag-search"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? '' : 'Buscar o crear etiqueta…'}
        />
      </div>
      {showDropdown && (filtered.length > 0 || canCreate) && (
        <div className="bo-dropdown">
          {filtered.map(tag => (
            <button key={tag} className="bo-dropdown-item" onClick={() => addTag(tag)}>
              <span className="bo-dropdown-dot" style={{ background: tagColor(tag) }} />
              {loc.get(`tag_${tag}`) || tag}
            </button>
          ))}
          {canCreate && (
            <button className="bo-dropdown-item bo-dropdown-create" onClick={() => addTag(trimmed)}>
              + Crear: <em>"{trimmed}"</em>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Etymology selector ────────────────────────────────────────────────────────
function EtymologySelector({ etymology_ids, etymologyStore, onChange }) {
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

  const allEtymologies = [
    ...Array.from(etymologyStore?.byId?.values() || []),
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
            <strong>{e.origin}</strong>
            {e.meaning && <span> — {e.meaning}</span>}
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
                    <strong>{e.origin}</strong>
                    {e.meaning && <span className="bo-dropdown-sub"> — {e.meaning}</span>}
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

// ── Attestation editor row ────────────────────────────────────────────────────
function AttestationRow({ att, onChange, onRemove }) {
  const field = (key, value) => onChange({ ...att, [key]: value })
  return (
    <div className="bo-attestation-row">
      <div className="bo-attestation-row-top">
        <input className="bo-input bo-input-sm" placeholder="Año" type="number"
          value={att.year} onChange={e => field('year', e.target.value)} />
        <input className="bo-input" placeholder="Forma atestiguada"
          value={att.highlight} onChange={e => field('highlight', e.target.value)} />
        <button className="bo-btn-icon" onClick={onRemove} title="Eliminar">×</button>
      </div>
      <input className="bo-input" placeholder="Fuente"
        value={att.source} onChange={e => field('source', e.target.value)} />
      <textarea className="bo-input bo-textarea" placeholder="Cita"
        value={att.quote} onChange={e => field('quote', e.target.value)} rows={2} />
      <input className="bo-input" placeholder="URL"
        value={att.url} onChange={e => field('url', e.target.value)} />
    </div>
  )
}

// ── Draft list item ───────────────────────────────────────────────────────────
function DraftItem({ draft, onEdit, onDelete }) {
  const typeLabel = { point: 'Puntual', line: 'Lineal', poly: 'Zonal' }[draft.type] || draft.type
  return (
    <div className="bo-draft-item">
      <div className="bo-draft-item-info">
        <span className="bo-draft-name">{draft.name || <em>Sin nombre</em>}</span>
        <span className="bo-draft-meta">{draft.draftId} · {typeLabel}</span>
      </div>
      <div className="bo-draft-item-actions">
        <button className="bo-btn bo-btn-sm" onClick={() => onEdit(draft)}>Editar</button>
        <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => onDelete(draft.draftId)}>✕</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BackofficePage({ repository, etymologyStore, loc }) {
  const navigate = useNavigate()
  const [drafts, setDrafts]         = useState(() => getDrafts())
  const [view, setView]             = useState('list')
  const [form, setForm]             = useState(EMPTY_FORM)
  const [isDrawing, setIsDrawing]   = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [error, setError]           = useState('')

  const knownTags = loc
    ? Object.keys(loc.repository).filter(k => k.startsWith('tag_')).map(k => k.slice(4))
    : []

  // ── Draft CRUD ──────────────────────────────────────────────────────────────
  const refreshDrafts = () => setDrafts(getDrafts())

  const handleNew = () => {
    setForm({ ...EMPTY_FORM(), draftId: newDraftId() })
    setCurrentPoints([])
    setIsDrawing(false)
    setError('')
    setView('form')
  }

  const handleEdit = (draft) => {
    setForm({ ...draft })
    setCurrentPoints(draft.coordinates || [])
    setIsDrawing(false)
    setError('')
    setView('form')
  }

  const handleDelete = (draftId) => {
    deleteDraft(draftId)
    refreshDrafts()
  }

  const handleCancel = () => {
    setIsDrawing(false)
    setCurrentPoints([])
    setView('list')
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    saveDraft({ ...form, coordinates: currentPoints })
    refreshDrafts()
    setIsDrawing(false)
    setCurrentPoints([])
    setView('list')
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  const handleAddPoint = useCallback((latlng) => {
    if (form.type === 'point') {
      setCurrentPoints([latlng])
      setIsDrawing(false)
    } else {
      setCurrentPoints(prev => [...prev, latlng])
    }
  }, [form.type])

  const handleFinishDrawing = () => setIsDrawing(false)
  const handleClearDrawing  = () => { setCurrentPoints([]); setIsDrawing(false) }
  const handleStartDrawing  = () => { setCurrentPoints([]); setIsDrawing(true) }

  const setType = (type) => {
    setForm(f => ({ ...f, type }))
    setCurrentPoints([])
    setIsDrawing(false)
  }

  // ── Attestations ────────────────────────────────────────────────────────────
  const addAttestation = () =>
    setForm(f => ({ ...f, attestations: [...f.attestations, EMPTY_ATTESTATION()] }))

  const updateAttestation = (i, att) =>
    setForm(f => ({ ...f, attestations: f.attestations.map((a, idx) => idx === i ? att : a) }))

  const removeAttestation = (i) =>
    setForm(f => ({ ...f, attestations: f.attestations.filter((_, idx) => idx !== i) }))

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const content = exportDrafts(drafts)
    const blob = new Blob([content], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'nuevos-toponimos.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Coordinates display ─────────────────────────────────────────────────────
  const coordsLabel = (() => {
    if (!currentPoints.length) return 'Sin coordenadas'
    if (form.type === 'point') return `${currentPoints[0][0].toFixed(5)}, ${currentPoints[0][1].toFixed(5)}`
    return `${currentPoints.length} vértice${currentPoints.length !== 1 ? 's' : ''}`
  })()

  const canFinish = (form.type === 'line' && currentPoints.length >= 2)
                 || (form.type === 'poly' && currentPoints.length >= 3)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bo-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_HOME)}>←</button>
        <Navbar.Brand className="bo-brand">Editor de topónimos</Navbar.Brand>
      </Navbar>

      <div className="bo-body">
        {/* ── LEFT PANEL ── */}
        <div className="bo-panel">
          {view === 'list' ? (
            <>
              <div className="bo-panel-header">
                <button className="bo-btn bo-btn-primary" onClick={handleNew}>+ Nuevo topónimo</button>
                {drafts.length > 0 && (
                  <button className="bo-btn" onClick={handleExport}>↓ Exportar</button>
                )}
              </div>

              {drafts.length === 0 ? (
                <p className="bo-empty">Sin borradores guardados.</p>
              ) : (
                <div className="bo-draft-list">
                  {drafts.map(d => (
                    <DraftItem key={d.draftId} draft={d}
                      onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bo-form">
              {/* Nombre */}
              <div className="bo-form-section">
                <label className="bo-label">Nombre <span className="bo-required">*</span></label>
                <input className={`bo-input${error ? ' bo-input-error' : ''}`}
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }}
                  placeholder="Nombre del topónimo"
                />
                {error && <span className="bo-error">{error}</span>}
              </div>

              {/* Forma patrimonial */}
              <div className="bo-form-section">
                <label className="bo-label">Forma patrimonial <span className="bo-optional">(opcional)</span></label>
                <input className="bo-input"
                  value={form.vernacular || ''}
                  onChange={e => setForm(f => ({ ...f, vernacular: e.target.value }))}
                  placeholder="Forma dialectal o popular, si difiere del nombre oficial"
                />
              </div>

              {/* Tipo */}
              <div className="bo-form-section">
                <label className="bo-label">Tipo</label>
                <div className="bo-type-btns">
                  {['point', 'line', 'poly'].map(t => (
                    <button key={t}
                      className={`bo-type-btn${form.type === t ? ' active' : ''}`}
                      onClick={() => setType(t)}>
                      {{ point: 'Punto', line: 'Línea', poly: 'Área' }[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometría */}
              <div className="bo-form-section">
                <label className="bo-label">Geometría</label>
                <div className="bo-draw-row">
                  {!isDrawing ? (
                    <button className="bo-btn bo-btn-primary" onClick={handleStartDrawing}>
                      ✎ Marcar en mapa
                    </button>
                  ) : (
                    <>
                      {(form.type === 'line' || form.type === 'poly') && (
                        <button className="bo-btn bo-btn-primary"
                          disabled={!canFinish} onClick={handleFinishDrawing}>
                          ✓ Finalizar
                        </button>
                      )}
                      <button className="bo-btn" onClick={handleClearDrawing}>✕ Limpiar</button>
                    </>
                  )}
                </div>
                <span className="bo-coords-label">{coordsLabel}</span>
                {isDrawing && (
                  <p className="bo-draw-hint">
                    {form.type === 'point'
                      ? 'Haz clic en el mapa para colocar el punto.'
                      : 'Haz clic para añadir vértices. Pulsa "Finalizar" cuando termines.'}
                  </p>
                )}
              </div>

              {/* Etiquetas */}
              <div className="bo-form-section">
                <label className="bo-label">Etiquetas</label>
                <TagInput
                  tags={form.tags}
                  knownTags={knownTags}
                  loc={loc}
                  onChange={tags => setForm(f => ({ ...f, tags }))}
                />
              </div>

              {/* Atestaciones */}
              <div className="bo-form-section">
                <label className="bo-label">Atestaciones</label>
                {form.attestations.map((att, i) => (
                  <AttestationRow key={i} att={att}
                    onChange={updated => updateAttestation(i, updated)}
                    onRemove={() => removeAttestation(i)} />
                ))}
                <button className="bo-btn bo-btn-sm" onClick={addAttestation}>+ Añadir atestación</button>
              </div>

              {/* Etimología */}
              <div className="bo-form-section">
                <label className="bo-label">Etimología</label>
                <EtymologySelector
                  etymology_ids={form.etymology_ids || []}
                  etymologyStore={etymologyStore}
                  onChange={etymology_ids => setForm(f => ({ ...f, etymology_ids }))}
                />
              </div>

              <div className="bo-form-actions">
                <button className="bo-btn bo-btn-primary" onClick={handleSave}>Guardar</button>
                <button className="bo-btn" onClick={handleCancel}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── MAP ── */}
        <div className="bo-map-wrap">
          <BackofficeMap
            isDrawing={isDrawing}
            drawingType={form.type}
            currentPoints={currentPoints}
            onAddPoint={handleAddPoint}
            drafts={drafts}
            selectedDraftId={view === 'form' ? form.draftId : null}
            onDraftClick={draftId => {
              const d = drafts.find(x => x.draftId === draftId)
              if (d) handleEdit(d)
            }}
            repository={repository}
          />
        </div>
      </div>
    </div>
  )
}
