import { useState, useMemo } from 'react'
import { getDrafts, saveDraft, newDraftId } from '../../model/draftStore'
import { toFlexiblePattern } from './scanUtils'
import { EMPTY_FORM } from './constants'
import {
  getTextProjects, saveTextProject, deleteTextProject, newTextProjectId,
} from './textProjectStore'

// ── Context extraction ────────────────────────────────────────────────────────
function extractContext(text, matchStart, matchEnd, maxWords = 10) {
  let leftStart = matchStart
  let words = 0
  for (let i = matchStart - 1; i >= 0; i--) {
    const c = text[i]
    if (c === '.' || c === ',' || c === ';' || c === ':') { leftStart = i + 1; break }
    if (/\s/.test(c)) words++
    if (words > maxWords) { leftStart = i + 1; break }
    leftStart = i
  }
  let rightEnd = matchEnd
  words = 0
  for (let i = matchEnd; i < text.length; i++) {
    rightEnd = i + 1
    const c = text[i]
    if (c === '.' || c === ',' || c === ';' || c === ':') break
    if (/\s/.test(c)) words++
    if (words > maxWords) { rightEnd = i; break }
  }
  return text.slice(leftStart, rightEnd).trim()
}

// ── Occurrence finder ─────────────────────────────────────────────────────────
function findOccurrences(text, name, extraForms) {
  if (!text || !name) return []
  const forms = [name, ...extraForms].filter(f => f.trim().length >= 2)
  const results = []
  const seen = new Set()
  for (const form of forms) {
    try {
      const pattern = toFlexiblePattern(form.trim())
      const re = new RegExp(`(?<![\\wÀ-ÿ])${pattern}(?![\\wÀ-ÿ])`, 'gi')
      let m
      while ((m = re.exec(text)) !== null) {
        const key = `${m.index}:${m[0].length}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push({
          start:   m.index,
          end:     m.index + m[0].length,
          form:    m[0],
          context: extractContext(text, m.index, m.index + m[0].length),
        })
      }
    } catch {}
  }
  return results.sort((a, b) => a.start - b.start)
}

// ── Highlighted text renderer ─────────────────────────────────────────────────
function HighlightedText({ text, occurrences, selected, onToggle, onManualSelect }) {
  const handleMouseUp = () => {
    const sel = window.getSelection()?.toString().trim()
    if (sel && onManualSelect) onManualSelect(sel)
  }

  if (!text) return <pre className="bo-text-display bo-text-empty">Sin texto cargado.</pre>
  if (!occurrences.length) return <pre className="bo-text-display" onMouseUp={handleMouseUp}>{text}</pre>

  const segments = []
  let last = 0
  occurrences.forEach((occ, i) => {
    if (occ.start > last) segments.push({ t: 'text', s: text.slice(last, occ.start) })
    segments.push({ t: 'mark', s: text.slice(occ.start, occ.end), i, sel: selected.has(i) })
    last = occ.end
  })
  if (last < text.length) segments.push({ t: 'text', s: text.slice(last) })

  return (
    <pre className="bo-text-display" onMouseUp={handleMouseUp}>
      {segments.map((seg, k) =>
        seg.t === 'text' ? seg.s : (
          <mark key={k}
            className={`bo-text-match${seg.sel ? ' selected' : ''}`}
            onClick={() => onToggle(seg.i)}
            title="Clic para seleccionar / deseleccionar"
          >
            {seg.s}
          </mark>
        )
      )}
    </pre>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const EMPTY_PROJ_FORM = () => ({ title: '', year: '', url: '', text: '' })
const EMPTY_NEW_TOPO  = (name = '') => ({ name, vernacular: '', type: 'point', notes: '' })

export default function ScannerView({ repository, refreshDrafts, refreshTextProjects, startProjectId, onBack }) {
  const allProjects = getTextProjects()
  const initialProj = startProjectId ? allProjects.find(p => p.id === startProjectId) ?? null : null

  const [projects,    setProjects]    = useState(allProjects)
  const [subview,     setSubview]     = useState(initialProj ? 'annotate' : 'projects')
  const [projForm,    setProjForm]    = useState(EMPTY_PROJ_FORM)
  const [activeProj,  setActiveProj]  = useState(initialProj)

  // Auto-scan state
  const [topoSearch,   setTopoSearch]   = useState('')
  const [selectedTopo, setSelectedTopo] = useState(null)
  const [extraForms,   setExtraForms]   = useState([])
  const [selected,     setSelected]     = useState(new Set())

  // Manual selection state
  const [manualSelection,  setManualSelection]  = useState('')
  const [manualTopoSearch, setManualTopoSearch] = useState('')
  const [manualTopo,       setManualTopo]       = useState(null)
  const [showNewTopo,      setShowNewTopo]      = useState(false)
  const [newTopoForm,      setNewTopoForm]      = useState(EMPTY_NEW_TOPO)

  const refreshProjects = () => {
    setProjects(getTextProjects())
    refreshTextProjects?.()
  }

  // Merge indexed results with new (hash-less) drafts matching a query
  const searchWithDrafts = (q, limit = 10) => {
    const indexed = (repository?.getFromQueryString(q, false) || []).slice(0, limit)
    const indexedTitles = new Set(indexed.map(t => t.title?.toLowerCase()))
    const draftMatches = getDrafts()
      .filter(d => !d.deleted && !d.hash && d.name?.toLowerCase().includes(q.toLowerCase()))
      .map(d => ({ draftId: d.draftId, hash: null, title: d.name }))
      .filter(d => !indexedTitles.has(d.title?.toLowerCase()))
    return [...indexed, ...draftMatches].slice(0, limit)
  }

  // Auto-scan toponym search results
  const topoResults = useMemo(() => {
    const q = topoSearch.trim()
    if (q.length < 2) return []
    return searchWithDrafts(q, 10)
  }, [topoSearch, repository]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual toponym search results
  const manualTopoResults = useMemo(() => {
    const q = manualTopoSearch.trim()
    if (q.length < 2) return []
    return searchWithDrafts(q, 8)
  }, [manualTopoSearch, repository]) // eslint-disable-line react-hooks/exhaustive-deps

  // Occurrences of the selected toponym in the active project
  const occurrences = useMemo(() => {
    if (!activeProj?.text || !selectedTopo) return []
    return findOccurrences(activeProj.text, selectedTopo.title, extraForms)
  }, [activeProj, selectedTopo, extraForms])

  // Reset selection when occurrences change
  const prevOccKey = useMemo(() => occurrences.map(o => o.start).join(','), [occurrences])
  const [lastOccKey, setLastOccKey] = useState('')
  if (prevOccKey !== lastOccKey) {
    setLastOccKey(prevOccKey)
    setSelected(new Set(occurrences.map((_, i) => i)))
  }

  const toggleOcc = (i) => setSelected(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })
  const toggleAll = () => {
    if (selected.size === occurrences.length) setSelected(new Set())
    else setSelected(new Set(occurrences.map((_, i) => i)))
  }

  const openProject = (proj) => {
    setActiveProj(proj)
    setSelectedTopo(null)
    setTopoSearch('')
    setExtraForms([])
    setManualSelection('')
    setManualTopo(null)
    setManualTopoSearch('')
    setSubview('annotate')
  }

  const openEdit = (proj) => {
    setProjForm(proj
      ? { id: proj.id, title: proj.title, year: proj.year, url: proj.url || '', text: proj.text }
      : EMPTY_PROJ_FORM()
    )
    setSubview('edit')
  }

  const saveProject = () => {
    if (!projForm.title.trim()) return
    const id = projForm.id || newTextProjectId()
    const saved = { ...projForm, id, createdAt: projForm.createdAt || new Date().toISOString() }
    saveTextProject(saved)
    refreshProjects()
    if (activeProj?.id === id) setActiveProj(saved)
    setSubview(activeProj ? 'annotate' : 'projects')
  }

  const deleteProject = (id) => {
    deleteTextProject(id)
    refreshProjects()
    if (activeProj?.id === id) { setActiveProj(null); setSubview('projects') }
  }

  // ── Auto-scan import ───────────────────────────────────────────────────────
  const importOccurrences = () => {
    if (!selectedTopo || selected.size === 0 || !activeProj) return
    const entry = repository?.getFromId(selectedTopo.hash)
    const att = {
      year:        activeProj.year,
      source:      activeProj.title,
      url:         activeProj.url || '',
      occurrences: [...selected].sort((a, b) => a - b).map(i => ({
        highlight: occurrences[i].form,
        quote:     occurrences[i].context,
      })),
    }
    const currentDrafts = getDrafts()
    const existing = entry
      ? currentDrafts.find(d => d.hash === entry.hash)
      : currentDrafts.find(d => d.name?.toLowerCase() === selectedTopo.title?.toLowerCase())
    if (existing) {
      saveDraft({ ...existing, attestations: [...(existing.attestations || []), att] })
    } else {
      saveDraft({
        draftId:      newDraftId(),
        hash:         entry?.hash ?? null,
        name:         selectedTopo.title,
        vernacular:   entry?.vernacular || '',
        type:         entry?.type || 'point',
        coordinates:  entry?.coordinates || [],
        tags:         entry?.tags || [],
        attestations: [att],
        etymology_ids: entry?.etymology_ids || [],
        notes:        entry?.notes || '',
      })
    }
    refreshDrafts()
    setSelected(new Set(occurrences.map((_, i) => i)))
    setSelectedTopo(null)
    setTopoSearch('')
    setExtraForms([])
  }

  // ── Manual attestation ────────────────────────────────────────────────────
  const addManualAttestation = () => {
    if (!manualTopo || !manualSelection.trim() || !activeProj) return
    const att = {
      year:      activeProj.year,
      source:    activeProj.title,
      url:       activeProj.url || '',
      highlight: manualSelection,
      quote:     manualSelection,
    }
    const entry = manualTopo.hash ? repository?.getFromId(manualTopo.hash) : null
    const currentDrafts = getDrafts()
    const existing = manualTopo.draftId
      ? currentDrafts.find(d => d.draftId === manualTopo.draftId)
      : currentDrafts.find(d => d.hash === manualTopo.hash)
    if (existing) {
      saveDraft({ ...existing, attestations: [...(existing.attestations || []), att] })
    } else {
      saveDraft({
        draftId:      manualTopo.draftId || newDraftId(),
        hash:         manualTopo.hash,
        name:         manualTopo.title,
        vernacular:   entry?.vernacular || '',
        type:         entry?.type || 'point',
        coordinates:  entry?.coordinates || [],
        tags:         entry?.tags || [],
        attestations: [att],
        etymology_ids: entry?.etymology_ids || [],
        notes:        entry?.notes || '',
      })
    }
    refreshDrafts()
    setManualSelection('')
    setManualTopo(null)
    setManualTopoSearch('')
  }

  const clearManual = () => {
    setManualSelection('')
    setManualTopo(null)
    setManualTopoSearch('')
  }

  // ── New toponym (from manual section) ────────────────────────────────────
  const openNewTopo = () => {
    setNewTopoForm(EMPTY_NEW_TOPO(manualTopoSearch.trim()))
    setShowNewTopo(true)
  }

  const saveNewTopo = () => {
    if (!newTopoForm.name.trim()) return
    const draftId = newDraftId()
    const draft = {
      ...EMPTY_FORM(),
      draftId,
      hash:       null,
      name:       newTopoForm.name.trim(),
      vernacular: newTopoForm.vernacular.trim(),
      type:       newTopoForm.type,
      notes:      newTopoForm.notes.trim(),
    }
    saveDraft(draft)
    refreshDrafts()
    setManualTopo({ draftId, hash: null, title: draft.name })
    setManualTopoSearch(draft.name)
    setShowNewTopo(false)
  }

  // ── Subview: project list ─────────────────────────────────────────────────
  if (subview === 'projects') return (
    <div className="bo-form">
      <div className="bo-scanner-header">
        <h3 className="bo-scanner-title">Textos históricos</h3>
        <p className="bo-scanner-desc">
          Guarda documentos históricos como proyectos para anotar atestiguaciones topónimo a topónimo.
        </p>
      </div>
      <div className="bo-panel-header">
        <button className="bo-btn bo-btn-primary" onClick={() => openEdit(null)}>+ Nuevo texto</button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>
      {projects.length === 0 && (
        <p className="bo-empty">Sin textos guardados todavía.</p>
      )}
      <div className="bo-proj-list">
        {projects.map(p => (
          <div key={p.id} className="bo-proj-item">
            <div className="bo-proj-meta">
              <span className="bo-proj-title">{p.title}</span>
              {p.year && <span className="bo-proj-year">{p.year}</span>}
              {p.text && <span className="bo-proj-chars">{p.text.length.toLocaleString()} car.</span>}
            </div>
            <div className="bo-proj-actions">
              <button className="bo-btn bo-btn-primary bo-btn-sm" onClick={() => openProject(p)}>Abrir</button>
              <button className="bo-btn bo-btn-sm" onClick={() => openEdit(p)}>Editar</button>
              <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => deleteProject(p.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Subview: project editor ───────────────────────────────────────────────
  if (subview === 'edit') return (
    <div className="bo-form">
      <h3 className="bo-scanner-title">{projForm.id ? 'Editar texto' : 'Nuevo texto histórico'}</h3>
      <div className="bo-form-section">
        <label className="bo-label">Título / Fuente <span className="bo-required">*</span></label>
        <input className="bo-input" placeholder="p.ej. Catastro de Ensenada, Libro de la Montería…"
          value={projForm.title}
          onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="bo-form-row">
        <div className="bo-form-section">
          <label className="bo-label">Año</label>
          <input className="bo-input" placeholder="1749"
            value={projForm.year}
            onChange={e => setProjForm(f => ({ ...f, year: e.target.value }))} />
        </div>
        <div className="bo-form-section" style={{ flex: 2 }}>
          <label className="bo-label">URL <span className="bo-optional">(opcional)</span></label>
          <input className="bo-input" placeholder="https://…"
            value={projForm.url}
            onChange={e => setProjForm(f => ({ ...f, url: e.target.value }))} />
        </div>
      </div>
      <div className="bo-form-section bo-manual-text-section">
        <label className="bo-label">Texto del documento</label>
        <textarea className="bo-input bo-textarea bo-manual-textarea"
          placeholder="Pega aquí el texto histórico completo…"
          value={projForm.text}
          onChange={e => setProjForm(f => ({ ...f, text: e.target.value }))} />
      </div>
      <div className="bo-form-actions">
        <button className="bo-btn bo-btn-primary" disabled={!projForm.title.trim()} onClick={saveProject}>
          Guardar
        </button>
        <button className="bo-btn" onClick={() => setSubview(activeProj ? 'annotate' : 'projects')}>
          Cancelar
        </button>
      </div>
    </div>
  )

  // ── Subview: annotate ─────────────────────────────────────────────────────
  return (
    <div className="bo-annotate-layout">
      {/* ─── Left: text display ─── */}
      <div className="bo-annotate-text">
        <div className="bo-annotate-text-toolbar">
          <button className="bo-btn bo-btn-sm" onClick={() => setSubview('projects')}>← Textos</button>
          <span className="bo-annotate-proj-name">
            {activeProj.title}{activeProj.year ? ` (${activeProj.year})` : ''}
          </span>
          <button className="bo-btn bo-btn-sm" onClick={() => openEdit(activeProj)}>Editar texto</button>
        </div>
        <HighlightedText
          text={activeProj.text}
          occurrences={occurrences}
          selected={selected}
          onToggle={toggleOcc}
          onManualSelect={sel => { setManualSelection(sel); setManualTopo(null); setManualTopoSearch('') }}
        />
      </div>

      {/* ─── Right: toponym panel ─── */}
      <div className="bo-annotate-panel">

        {/* ── Manual selection section ── */}
        {manualSelection && (
          <div className="bo-manual-section">
            <div className="bo-manual-section-header">
              <label className="bo-label">Cita seleccionada</label>
              <button className="bo-btn-icon" onClick={clearManual} title="Limpiar selección">×</button>
            </div>
            <blockquote className="bo-scan-quote">{manualSelection}</blockquote>
            <input
              className="bo-input"
              placeholder="Buscar topónimo…"
              value={manualTopoSearch}
              onChange={e => { setManualTopoSearch(e.target.value); setManualTopo(null) }}
            />
            {!manualTopo && manualTopoSearch.trim().length >= 2 && (
              <div className="bo-search-results">
                {manualTopoResults.map(t => (
                  <button key={t.hash} className="bo-search-result-item"
                    onClick={() => { setManualTopo(t); setManualTopoSearch(t.title) }}>
                    <span className="bo-search-result-name">{t.title}</span>
                    <span className="bo-search-result-hash">{t.hash}</span>
                  </button>
                ))}
              </div>
            )}
            {!manualTopo && (
              <button className="bo-btn bo-btn-sm" style={{ marginTop: '0.25rem' }} onClick={openNewTopo}>
                + Crear nuevo topónimo{manualTopoSearch.trim().length >= 2 ? ` «${manualTopoSearch.trim()}»` : ''}
              </button>
            )}
            <div className="bo-scanner-actions" style={{ marginTop: '0.75rem' }}>
              <button className="bo-btn bo-btn-primary" disabled={!manualTopo} onClick={addManualAttestation}>
                Añadir cita
              </button>
            </div>
          </div>
        )}

        {manualSelection && <hr className="bo-panel-divider" />}

        {/* ── Auto-scan section ── */}
        <div className="bo-form-section">
          <label className="bo-label">Detectar en el texto</label>
          <input
            className="bo-input"
            placeholder="Busca un topónimo para resaltar sus apariciones…"
            value={topoSearch}
            onChange={e => { setTopoSearch(e.target.value); if (selectedTopo) { setSelectedTopo(null); setExtraForms([]) } }}
          />
          {topoResults.length > 0 && !selectedTopo && (
            <div className="bo-search-results">
              {topoResults.map(t => (
                <button key={t.hash} className="bo-search-result-item"
                  onClick={() => { setSelectedTopo(t); setTopoSearch(t.title) }}>
                  <span className="bo-search-result-name">{t.title}</span>
                  <span className="bo-search-result-hash">{t.hash}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTopo && (
          <>
            <div className="bo-form-section">
              <label className="bo-label bo-label-sm">Formas alternativas en el texto</label>
              {extraForms.map((f, i) => (
                <div key={i} className="bo-extra-form-row">
                  <input className="bo-input bo-input-sm"
                    value={f}
                    onChange={e => setExtraForms(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                    placeholder="Forma histórica…"
                  />
                  <button className="bo-btn-icon" onClick={() => setExtraForms(prev => prev.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button className="bo-btn bo-btn-sm" style={{ marginTop: '0.25rem' }}
                onClick={() => setExtraForms(prev => [...prev, ''])}>
                + Añadir forma
              </button>
            </div>

            <div className="bo-form-section">
              <div className="bo-occ-header">
                <label className="bo-label">
                  {occurrences.length === 0
                    ? 'Sin apariciones'
                    : `${occurrences.length} aparición${occurrences.length !== 1 ? 'es' : ''}`}
                </label>
                {occurrences.length > 1 && (
                  <button className="bo-btn bo-btn-sm" onClick={toggleAll}>
                    {selected.size === occurrences.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                )}
              </div>

              {occurrences.length === 0 && (
                <p className="bo-empty bo-empty-sm">
                  No se encontró «{selectedTopo.title}» en el texto.
                  Prueba a añadir formas alternativas.
                </p>
              )}

              <div className="bo-occ-list">
                {occurrences.map((occ, i) => (
                  <label key={i} className={`bo-occ-item${selected.has(i) ? ' selected' : ''}`}>
                    <input type="checkbox" checked={selected.has(i)} onChange={() => toggleOcc(i)} />
                    <span className="bo-occ-body">
                      <span className="bo-occ-form">{occ.form}</span>
                      <span className="bo-occ-context">{occ.context}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bo-scanner-actions">
              <button
                className="bo-btn bo-btn-primary"
                disabled={selected.size === 0}
                onClick={importOccurrences}
              >
                ↓ Importar {selected.size > 0 ? `(${selected.size})` : ''}
              </button>
              <button className="bo-btn bo-btn-sm"
                onClick={() => { setSelectedTopo(null); setTopoSearch(''); setExtraForms([]) }}>
                Limpiar
              </button>
            </div>
          </>
        )}

        {!selectedTopo && !manualSelection && (
          <p className="bo-empty bo-manual-hint">
            Selecciona texto con el ratón para añadir una cita, o busca un topónimo para detectar sus apariciones.
          </p>
        )}

        {/* ── New toponym overlay ── */}
        {showNewTopo && (
          <div className="bo-new-topo-overlay">
            <div className="bo-new-topo-header">
              <span className="bo-new-topo-title">Nuevo topónimo</span>
              <button className="bo-btn-icon" onClick={() => setShowNewTopo(false)}>×</button>
            </div>
            <div className="bo-form-section">
              <label className="bo-label">Nombre <span className="bo-required">*</span></label>
              <input className="bo-input" autoFocus
                value={newTopoForm.name}
                onChange={e => setNewTopoForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del topónimo"
              />
            </div>
            <div className="bo-form-section">
              <label className="bo-label">Forma patrimonial <span className="bo-optional">(opcional)</span></label>
              <input className="bo-input"
                value={newTopoForm.vernacular}
                onChange={e => setNewTopoForm(f => ({ ...f, vernacular: e.target.value }))}
                placeholder="Forma dialectal o popular"
              />
            </div>
            <div className="bo-form-section">
              <label className="bo-label">Tipo</label>
              <div className="bo-type-btns">
                {['point', 'line', 'poly'].map(t => (
                  <button key={t}
                    className={`bo-type-btn${newTopoForm.type === t ? ' active' : ''}`}
                    onClick={() => setNewTopoForm(f => ({ ...f, type: t }))}>
                    {{ point: 'Punto', line: 'Línea', poly: 'Área' }[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="bo-form-section">
              <label className="bo-label">Notas <span className="bo-optional">(opcional)</span></label>
              <textarea className="bo-input bo-textarea" rows={3}
                value={newTopoForm.notes}
                onChange={e => setNewTopoForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Evolución fonética, contexto histórico…"
              />
            </div>
            <p className="bo-new-topo-hint">
              La geometría se puede añadir después desde la lista de topónimos.
            </p>
            <div className="bo-form-actions">
              <button className="bo-btn bo-btn-primary"
                disabled={!newTopoForm.name.trim()} onClick={saveNewTopo}>
                Crear y seleccionar
              </button>
              <button className="bo-btn" onClick={() => setShowNewTopo(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
