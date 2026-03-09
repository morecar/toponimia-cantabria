import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import BackofficeMap from './BackofficeMap'
import { getDrafts, saveDraft, deleteDraft, newDraftId, exportDrafts } from '../model/draftStore'
import { ROUTE_HOME } from '../resources/routes'

const EMPTY_FORM = () => ({
  draftId: null,
  name: '',
  type: 'point',
  coordinates: [],
  tags: [],
  attestations: [],
  etymology_ids: [],
})

const EMPTY_ATTESTATION = () => ({ year: '', highlight: '', source: '', quote: '', url: '' })

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
export default function BackofficePage({ repository, loc }) {
  const navigate = useNavigate()
  const [drafts, setDrafts]         = useState(() => getDrafts())
  const [view, setView]             = useState('list')   // 'list' | 'form'
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

  const handleClearDrawing = () => {
    setCurrentPoints([])
    setIsDrawing(false)
  }

  const handleStartDrawing = () => {
    setCurrentPoints([])
    setIsDrawing(true)
  }

  // ── Type change resets drawing ──────────────────────────────────────────────
  const setType = (type) => {
    setForm(f => ({ ...f, type }))
    setCurrentPoints([])
    setIsDrawing(false)
  }

  // ── Tag toggle ──────────────────────────────────────────────────────────────
  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }))
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
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
        <Navbar.Brand className="bo-brand">Backoffice</Navbar.Brand>
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
              <div className="bo-form-section">
                <label className="bo-label">Nombre <span className="bo-required">*</span></label>
                <input className={`bo-input${error ? ' bo-input-error' : ''}`}
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError('') }}
                  placeholder="Nombre del topónimo"
                />
                {error && <span className="bo-error">{error}</span>}
              </div>

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

              <div className="bo-form-section">
                <label className="bo-label">Etiquetas</label>
                <div className="bo-tags-grid">
                  {knownTags.map(tag => (
                    <label key={tag} className="bo-tag-check">
                      <input type="checkbox"
                        checked={form.tags.includes(tag)}
                        onChange={() => toggleTag(tag)} />
                      {' '}{loc.get(`tag_${tag}`)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bo-form-section">
                <label className="bo-label">Atestaciones</label>
                {form.attestations.map((att, i) => (
                  <AttestationRow key={i} att={att}
                    onChange={updated => updateAttestation(i, updated)}
                    onRemove={() => removeAttestation(i)} />
                ))}
                <button className="bo-btn bo-btn-sm" onClick={addAttestation}>+ Añadir atestación</button>
              </div>

              <div className="bo-form-section">
                <label className="bo-label">IDs de etimología</label>
                <input className="bo-input"
                  placeholder="etym001, etym002…"
                  value={(form.etymology_ids || []).join(', ')}
                  onChange={e => setForm(f => ({
                    ...f,
                    etymology_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))} />
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
