import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import BackofficeMap from './BackofficeMap'
import {
  getDrafts, saveDraft, deleteDraft, newDraftId, exportDrafts,
} from '../model/draftStore'
import { ROUTE_BACKOFFICE } from '../resources/routes'
import {
  EMPTY_FORM, EMPTY_ATTESTATION, SOURCE_TEMPLATES,
} from './backoffice/constants'
import TagInput from './backoffice/TagInput'
import EtymologySelector from './backoffice/EtymologySelector'
import AttestationRow from './backoffice/AttestationRow'
import DraftItem from './backoffice/DraftItem'
import ScannerView from './backoffice/ScannerView'
import { getTextProjects } from './backoffice/textProjectStore'
import ManualLinkView from './backoffice/ManualLinkView'
import EtymologiesView from './backoffice/EtymologiesView'
import NgbeImportView from './backoffice/NgbeImportView'

export default function BackofficePage({ repository, etymologyStore, loc }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const startView = location.state?.startView

  const [drafts, setDrafts] = useState(() => getDrafts())
  const [textProjects, setTextProjects] = useState(() => getTextProjects())
  const [startProjectId, setStartProjectId] = useState(null)

  const refreshTextProjects = () => setTextProjects(getTextProjects())

  const openTextProject = (proj) => {
    setStartProjectId(proj.id)
    setView('scanner')
  }
  const [view, setView]     = useState(() => {
    if (startView === 'scanner')     return 'scanner'
    if (startView === 'new')         return 'form'
    if (startView === 'etymologies') return 'etymologies'
    if (startView === 'ngbe')        return 'ngbe'
    if (startView === 'manual')      return 'manual'
    return 'list'
  })

  const initialForm = startView === 'new' ? { ...EMPTY_FORM(), draftId: newDraftId() } : EMPTY_FORM()
  const [form, setForm]             = useState(initialForm)
  const [isDrawing, setIsDrawing]   = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const [error, setError]           = useState('')
  const [bulkText, setBulkText]     = useState('')
  const [showBulk, setShowBulk]     = useState(false)

  // Shared scanner/manual state (preserved when switching between the two views)
  const [scanYear,   setScanYear]   = useState('')
  const [scanSource, setScanSource] = useState('')
  const [scanUrl,    setScanUrl]    = useState('')
  const [scanText,   setScanText]   = useState('')

  // Map state
  const [ngbeMapData, setNgbeMapData] = useState(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = searchQuery.trim().length >= 2
    ? (repository?.getFromQueryString(searchQuery, false) || []).slice(0, 8)
    : []

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

  const handleEditExisting = (topo) => {
    const existingDraft = drafts.find(d => d.hash === topo.hash)
    if (existingDraft) { handleEdit(existingDraft); return }
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
    setCurrentPoints(topo.coordinates || [])
    setIsDrawing(false)
    setError('')
    setSearchQuery('')
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

  const addAttestationFromTemplate = (template) =>
    setForm(f => ({ ...f, attestations: [...f.attestations, { ...EMPTY_ATTESTATION(), year: template.year, source: template.source, url: template.url || '' }] }))

  const parseBulkImport = () => {
    const newAtts = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const [year = '', highlight = '', source = '', quote = '', url = ''] = line.split('|').map(p => p.trim())
        return { year, highlight, source, quote, url }
      })
      .filter(a => a.year || a.highlight)
    if (!newAtts.length) return
    setForm(f => ({ ...f, attestations: [...f.attestations, ...newAtts] }))
    setBulkText('')
    setShowBulk(false)
  }

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

  const isFullscreen = view === 'scanner' || view === 'manual' || view === 'etymologies'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bo-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_BACKOFFICE)}>←</button>
        <Navbar.Brand className="bo-brand">Editor de topónimos</Navbar.Brand>
      </Navbar>

      <div className={`bo-body${isFullscreen ? ' bo-body--fullscreen' : ''}`}>
        {/* ── LEFT PANEL ── */}
        <div className="bo-panel">

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              <div className="bo-panel-header">
                <button className="bo-btn bo-btn-primary" onClick={handleNew}>+ Nuevo</button>
                <button className="bo-btn" onClick={() => setView('scanner')}>
                  ⌕ Escanear texto
                </button>
                <button className="bo-btn" onClick={() => setView('manual')}>
                  ✎ Enlazar citas
                </button>
                {drafts.length > 0 && (
                  <button className="bo-btn" onClick={handleExport}>↓ Exportar</button>
                )}
              </div>

              <div className="bo-search-existing">
                <input
                  className="bo-input"
                  placeholder="Buscar topónimo existente para editar…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="bo-search-results">
                    {searchResults.map(t => (
                      <button key={t.hash} className="bo-search-result-item"
                        onClick={() => handleEditExisting(t)}>
                        <span className="bo-search-result-name">{t.title}</span>
                        <span className="bo-search-result-hash">{t.hash}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {textProjects.length > 0 && (
                <div className="bo-home-section">
                  <div className="bo-home-section-header">
                    <span className="bo-home-section-title">Textos históricos</span>
                    <button className="bo-btn bo-btn-sm" onClick={() => { setStartProjectId(null); setView('scanner') }}>
                      Ver todos
                    </button>
                  </div>
                  <div className="bo-proj-list">
                    {textProjects.map(p => (
                      <div key={p.id} className="bo-proj-item">
                        <div className="bo-proj-meta">
                          <span className="bo-proj-title">{p.title}</span>
                          {p.year && <span className="bo-proj-year">{p.year}</span>}
                          {p.text && <span className="bo-proj-chars">{p.text.length.toLocaleString()} car.</span>}
                        </div>
                        <div className="bo-proj-actions">
                          <button className="bo-btn bo-btn-primary bo-btn-sm" onClick={() => openTextProject(p)}>
                            Abrir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
          )}

          {/* ── FORM VIEW ── */}
          {view === 'form' && (
            <div className="bo-form">
              {form.hash && (
                <div className="bo-edit-notice">
                  Editando topónimo existente · <code>{form.hash}</code>
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
                  placeholder="Forma dialectal o popular, si difiere del nombre oficial"
                />
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
                    <textarea
                      className="bo-input bo-textarea"
                      rows={5}
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
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
                <button className="bo-btn" onClick={handleCancel}>Cancelar</button>
              </div>
            </div>
          )}

          {/* ── SCANNER VIEW ── */}
          {view === 'scanner' && (
            <ScannerView
              repository={repository}
              refreshDrafts={refreshDrafts}
              refreshTextProjects={refreshTextProjects}
              startProjectId={startProjectId}
              onBack={() => { setStartProjectId(null); setView('list') }}
            />
          )}

          {/* ── MANUAL LINK VIEW ── */}
          {view === 'manual' && (
            <ManualLinkView
              scanSource={scanSource} setScanSource={setScanSource}
              scanYear={scanYear}     setScanYear={setScanYear}
              scanUrl={scanUrl}       setScanUrl={setScanUrl}
              scanText={scanText}     setScanText={setScanText}
              repository={repository}
              refreshDrafts={refreshDrafts}
              onBack={() => setView('list')}
            />
          )}

          {/* ── ETYMOLOGIES VIEW ── */}
          {view === 'etymologies' && (
            <EtymologiesView
              etymologyStore={etymologyStore}
              onBack={() => setView('list')}
            />
          )}

          {/* ── NGBE IMPORT WIZARD ── */}
          {view === 'ngbe' && (
            <NgbeImportView
              repository={repository}
              etymologyStore={etymologyStore}
              drafts={drafts}
              refreshDrafts={refreshDrafts}
              onBack={() => { setNgbeMapData(null); setView('list') }}
              onMapSync={setNgbeMapData}
            />
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
            onBoundsChange={null}
            onTopoClick={hash => {
              const topo = repository?.getFromId(hash)
              if (topo) handleEditExisting(topo)
            }}
            ngbePreview={view === 'ngbe' && ngbeMapData
              ? (ngbeMapData.step === 1 ? ngbeMapData.visible
                : ngbeMapData.step === 2 ? ngbeMapData.results.filter(e => ngbeMapData.selected.has(e.id))
                : null)
              : null}
            ngbeSelectedIds={ngbeMapData?.selected || new Set()}
            onNgbeItemClick={ngbeMapData?.toggleItem || null}
            ngbeOsmCache={ngbeMapData?.osmCache || {}}
          />
        </div>

        {/* ── Shared datalist for source autocomplete ── */}
        <datalist id="bo-source-list">
          {SOURCE_TEMPLATES.map(t => <option key={t.source} value={t.source} />)}
        </datalist>
      </div>
    </div>
  )
}
