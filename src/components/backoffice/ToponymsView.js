import { useState, useMemo, useCallback } from 'react'
import {
  getDrafts, saveDraft, deleteDraft, newDraftId,
} from '../../model/draftStore'
import {
  EMPTY_FORM, EMPTY_ATTESTATION, SOURCE_TEMPLATES,
} from './constants'
import TagInput from './TagInput'
import EtymologySelector from './EtymologySelector'
import AttestationRow from './AttestationRow'
import BackofficeMap from '../BackofficeMap'

// ── Toponym list item ─────────────────────────────────────────────────────────
function TopoListItem({ item, isDraft, isDeleted, isOverride, onEdit, onDelete, onMarkDeleted, onUndelete }) {
  const typeLabel = { point: 'Puntual', line: 'Lineal', poly: 'Zonal' }[item.type] || item.type
  return (
    <div className={`bo-etym-list-item${isDraft && !isDeleted ? '' : ''}${isDeleted ? ' bo-etym-list-item--deleted' : ''}${!isDraft ? ' bo-etym-list-item--committed' : ''}`}>
      <div className="bo-etym-list-body">
        <strong>{item.name || item.title || <em>Sin nombre</em>}</strong>
        {isOverride  && <span className="bo-etym-override-badge">editado</span>}
        {isDeleted   && <span className="bo-deleted-badge">borrado</span>}
        <span className="bo-etym-meaning"> · {typeLabel}</span>
        {(item.vernacular) && <span className="bo-etym-meaning"> · <em>{item.vernacular}</em></span>}
        {!isDraft && <span className="bo-etym-committed-badge">{item.hash}</span>}
      </div>
      <div className="bo-etym-list-actions">
        {isDeleted
          ? <button className="bo-btn bo-btn-sm" onClick={onUndelete}>Deshacer</button>
          : <>
              {onEdit      && <button className="bo-btn bo-btn-sm" onClick={onEdit}>Editar</button>}
              {onDelete    && <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={onDelete} title={isOverride ? 'Descartar edición' : 'Eliminar'}>✕</button>}
              {onMarkDeleted && <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={onMarkDeleted}>Borrar</button>}
            </>
        }
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ToponymsView({ repository, etymologyStore, loc, startSubview, onBack }) {
  const [drafts,        setDrafts]        = useState(() => getDrafts())
  const [subview,       setSubview]       = useState(startSubview === 'new' ? 'form' : 'list')
  const [form,          setForm]          = useState(() => startSubview === 'new' ? { ...EMPTY_FORM(), draftId: newDraftId() } : EMPTY_FORM())
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [showBulk,      setShowBulk]      = useState(false)
  const [bulkText,      setBulkText]      = useState('')
  const [showMap,       setShowMap]       = useState(false)
  const [isDrawing,     setIsDrawing]     = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])

  const refresh = () => setDrafts(getDrafts())

  const knownTags = loc
    ? Object.keys(loc.repository).filter(k => k.startsWith('tag_')).map(k => k.slice(4))
    : []

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openNew = () => {
    setForm({ ...EMPTY_FORM(), draftId: newDraftId() })
    setError('')
    setSubview('form')
  }

  const openEdit = (draft) => {
    setForm({ ...draft })
    setError('')
    setSubview('form')
  }

  const openEditCommitted = (topo) => {
    const existingDraft = drafts.find(d => d.hash === topo.hash && !d.deleted)
    if (existingDraft) { openEdit(existingDraft); return }
    setForm({
      draftId:      newDraftId(),
      hash:         topo.hash,
      name:         topo.title,
      vernacular:   topo.vernacular || '',
      type:         topo.type,
      coordinates:  topo.coordinates || [],
      tags:         topo.tags || [],
      attestations: topo.attestations || [],
      etymology_ids: topo.etymology_ids || [],
      notes:        topo.notes || '',
    })
    setError('')
    setSubview('form')
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    saveDraft(form)
    refresh()
    setSubview('list')
  }

  const handleDelete = (draftId) => { deleteDraft(draftId); refresh() }

  const handleMarkDeleted = (topo) => {
    const existing = drafts.find(d => d.hash === topo.hash)
    if (existing) {
      saveDraft({ ...existing, deleted: true })
    } else {
      saveDraft({
        draftId:      newDraftId(),
        hash:         topo.hash,
        name:         topo.title,
        type:         topo.type,
        coordinates:  [],
        tags:         [],
        attestations: [],
        etymology_ids: [],
        notes:        '',
        deleted:      true,
      })
    }
    refresh()
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

  const handleStartDrawing  = () => { setCurrentPoints([]); setIsDrawing(true) }
  const handleFinishDrawing = () => setIsDrawing(false)
  const handleClearDrawing  = () => { setCurrentPoints([]); setIsDrawing(false) }

  const handleConfirmGeometry = () => {
    setForm(f => ({ ...f, coordinates: currentPoints }))
    setShowMap(false)
    setIsDrawing(false)
  }

  const openMap = () => {
    setCurrentPoints(form.coordinates || [])
    setShowMap(true)
  }

  const closeMap = () => {
    setCurrentPoints([])
    setShowMap(false)
    setIsDrawing(false)
  }

  const canFinish = (form.type === 'line' && currentPoints.length >= 2)
                 || (form.type === 'poly' && currentPoints.length >= 3)

  // ── Attestations ────────────────────────────────────────────────────────────
  const addAttestation = () =>
    setForm(f => ({ ...f, attestations: [...f.attestations, EMPTY_ATTESTATION()] }))
  const updateAttestation = (i, att) =>
    setForm(f => ({ ...f, attestations: f.attestations.map((a, idx) => idx === i ? att : a) }))
  const removeAttestation = (i) =>
    setForm(f => ({ ...f, attestations: f.attestations.filter((_, idx) => idx !== i) }))
  const addAttestationFromTemplate = (t) =>
    setForm(f => ({ ...f, attestations: [...f.attestations, { ...EMPTY_ATTESTATION(), year: t.year, source: t.source, url: t.url || '' }] }))

  const parseBulkImport = () => {
    const newAtts = bulkText.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const [year = '', highlight = '', source = '', quote = '', url = ''] = line.split('|').map(p => p.trim())
      return { year, highlight, source, quote, url }
    }).filter(a => a.year || a.highlight)
    if (!newAtts.length) return
    setForm(f => ({ ...f, attestations: [...f.attestations, ...newAtts] }))
    setBulkText('')
    setShowBulk(false)
  }

  // ── Derived lists ────────────────────────────────────────────────────────────
  const draftHashes  = new Set(drafts.map(d => d.hash).filter(Boolean))
  const activeDrafts  = drafts.filter(d => !d.deleted)
  const deletedDrafts = drafts.filter(d =>  d.deleted)

  const searchResults = useMemo(() => {
    const q = search.trim()
    if (q.length < 2) return []
    return (repository?.getFromQueryString(q, false) || [])
      .filter(t => !draftHashes.has(t.hash))
      .slice(0, 12)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, repository, drafts])

  // ── Form subview ─────────────────────────────────────────────────────────────
  if (subview === 'form') {
    const isCommittedEdit = form.hash && repository?.getFromId(form.hash)
    const coordsLabel = (() => {
      const pts = form.coordinates || []
      if (!pts.length) return 'Sin coordenadas'
      if (form.type === 'point') return `${pts[0][0].toFixed(5)}, ${pts[0][1].toFixed(5)}`
      return `${pts.length} vértice${pts.length !== 1 ? 's' : ''}`
    })()

    return (
      <div className="bo-form">
        {isCommittedEdit && (
          <div className="bo-edit-notice">
            Editando topónimo del índice · <code>{form.hash}</code>
          </div>
        )}

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
          <label className="bo-label">Forma patrimonial <span className="bo-optional">(opcional)</span></label>
          <input className="bo-input"
            value={form.vernacular || ''}
            onChange={e => setForm(f => ({ ...f, vernacular: e.target.value }))}
            placeholder="Forma dialectal o popular"
          />
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Tipo</label>
          <div className="bo-type-btns">
            {['point', 'line', 'poly'].map(t => (
              <button key={t}
                className={`bo-type-btn${form.type === t ? ' active' : ''}`}
                onClick={() => { setForm(f => ({ ...f, type: t, coordinates: [] })); setCurrentPoints([]); setIsDrawing(false) }}>
                {{ point: 'Punto', line: 'Línea', poly: 'Área' }[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Geometría</label>
          <div className="bo-draw-row">
            <button className="bo-btn bo-btn-primary" onClick={openMap}>
              ✎ Marcar en mapa
            </button>
            {(form.coordinates?.length > 0) && (
              <button className="bo-btn bo-btn-sm" onClick={() => setForm(f => ({ ...f, coordinates: [] }))}>
                ✕ Limpiar
              </button>
            )}
          </div>
          <span className="bo-coords-label">{coordsLabel}</span>
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Etiquetas</label>
          <TagInput
            tags={form.tags}
            knownTags={knownTags}
            loc={loc}
            onChange={tags => setForm(f => ({ ...f, tags }))}
          />
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Atestaciones</label>
          {form.attestations.map((att, i) => (
            <AttestationRow key={i} att={att}
              onChange={updated => updateAttestation(i, updated)}
              onRemove={() => removeAttestation(i)} />
          ))}
          <div className="bo-att-actions">
            <button className="bo-btn bo-btn-sm" onClick={addAttestation}>+ Vacía</button>
            {SOURCE_TEMPLATES.map(t => (
              <button key={t.label} className="bo-btn bo-btn-sm bo-btn-template"
                onClick={() => addAttestationFromTemplate(t)}>
                + {t.label}
              </button>
            ))}
            <button className="bo-btn bo-btn-sm" onClick={() => setShowBulk(b => !b)}>
              {showBulk ? '× Cerrar' : '↓ Varias a la vez'}
            </button>
          </div>
          {showBulk && (
            <div className="bo-bulk-import">
              <p className="bo-bulk-hint">Una por línea: <code>AÑO | FORMA | FUENTE | CITA | URL</code></p>
              <textarea className="bo-input bo-textarea" rows={5}
                value={bulkText} onChange={e => setBulkText(e.target.value)}
                placeholder={'1749 | Abanillas | Catastro de Ensenada\n1352 | Abanyllas | Becerro de Behetrías | en término de Abanyllas...'}
              />
              <div className="bo-bulk-actions">
                <button className="bo-btn bo-btn-primary bo-btn-sm"
                  disabled={!bulkText.trim()} onClick={parseBulkImport}>
                  Parsear e importar
                </button>
                <button className="bo-btn bo-btn-sm"
                  onClick={() => { setShowBulk(false); setBulkText('') }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Etimología</label>
          <EtymologySelector
            etymology_ids={form.etymology_ids || []}
            etymologyStore={etymologyStore}
            onChange={etymology_ids => setForm(f => ({ ...f, etymology_ids }))}
          />
        </div>

        <div className="bo-form-section">
          <label className="bo-label">Notas <span className="bo-optional">(opcional)</span></label>
          <textarea className="bo-input bo-textarea" rows={4}
            value={form.notes || ''}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Evolución fonética, contexto histórico…"
          />
        </div>

        <div className="bo-form-actions">
          <button className="bo-btn bo-btn-primary" onClick={handleSave}>Guardar</button>
          {form.draftId && !isCommittedEdit && (
            <button className="bo-btn bo-btn-danger"
              onClick={() => { handleDelete(form.draftId); setSubview('list') }}>
              Eliminar
            </button>
          )}
          <button className="bo-btn" onClick={() => setSubview('list')}>Cancelar</button>
        </div>

        {/* ── Slide-in map panel ── */}
        <div className={`bo-geom-map-panel${showMap ? ' open' : ''}`}>
          <div className="bo-geom-map-toolbar">
            <span className="bo-geom-map-title">
              Geometría · {{ point: 'Punto', line: 'Línea', poly: 'Área' }[form.type]}
            </span>
            <div className="bo-geom-map-controls">
              {!isDrawing ? (
                <button className="bo-btn bo-btn-primary bo-btn-sm" onClick={handleStartDrawing}>
                  ✎ Dibujar
                </button>
              ) : (
                <>
                  {(form.type === 'line' || form.type === 'poly') && (
                    <button className="bo-btn bo-btn-primary bo-btn-sm"
                      disabled={!canFinish} onClick={handleFinishDrawing}>
                      ✓ Finalizar
                    </button>
                  )}
                  <button className="bo-btn bo-btn-sm" onClick={handleClearDrawing}>✕ Limpiar</button>
                </>
              )}
              {currentPoints.length > 0 && !isDrawing && (
                <button className="bo-btn bo-btn-primary bo-btn-sm" onClick={handleConfirmGeometry}>
                  ✓ Confirmar
                </button>
              )}
              <button className="bo-btn bo-btn-sm" onClick={closeMap}>Cerrar</button>
            </div>
          </div>
          {showMap && (
            <div className="bo-geom-map-body">
              <BackofficeMap
                isDrawing={isDrawing}
                drawingType={form.type}
                currentPoints={currentPoints}
                onAddPoint={handleAddPoint}
                drafts={drafts.filter(d => d.draftId !== form.draftId)}
                selectedDraftId={null}
                onDraftClick={() => {}}
                repository={repository}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── List subview ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="bo-panel-header">
        <button className="bo-btn bo-btn-primary" onClick={openNew}>+ Nuevo</button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>

      <div className="bo-search-existing">
        <input className="bo-input"
          placeholder="Buscar topónimo del índice…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {(activeDrafts.length > 0 || deletedDrafts.length > 0) && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">Borradores</h4>
          {activeDrafts.map(d => {
            const isOverride = !!(d.hash && repository?.getFromId(d.hash))
            return (
              <TopoListItem key={d.draftId}
                item={d} isDraft isOverride={isOverride}
                onEdit={() => openEdit(d)}
                onDelete={() => handleDelete(d.draftId)}
              />
            )
          })}
          {deletedDrafts.map(d => (
            <TopoListItem key={d.draftId}
              item={d} isDraft isDeleted
              onUndelete={() => handleDelete(d.draftId)}
            />
          ))}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">En el índice</h4>
          {searchResults.map(t => (
            <TopoListItem key={t.hash}
              item={t}
              onEdit={() => openEditCommitted(t)}
              onMarkDeleted={() => handleMarkDeleted(t)}
            />
          ))}
        </div>
      )}

      {drafts.length === 0 && search.trim().length < 2 && (
        <p className="bo-empty">Sin borradores. Busca un topónimo del índice o crea uno nuevo.</p>
      )}
    </>
  )
}
