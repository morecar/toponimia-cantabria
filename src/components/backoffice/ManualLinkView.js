import { useState, useRef } from 'react'
import { getDrafts, saveDraft, newDraftId } from '../../model/draftStore'
import { SOURCE_TEMPLATES } from './constants'

export default function ManualLinkView({
  scanSource, setScanSource, scanYear, setScanYear, scanUrl, setScanUrl,
  scanText, setScanText, repository, refreshDrafts, onBack,
}) {
  const [scanSelection,    setScanSelection]    = useState('')
  const [scanManualTopo,   setScanManualTopo]   = useState(null)
  const [scanManualSearch, setScanManualSearch] = useState('')
  const manualTextRef = useRef(null)

  const manualSearchResults = scanManualSearch.trim().length >= 2
    ? (repository?.getFromQueryString(scanManualSearch, false) || []).slice(0, 8)
    : []

  const addManualAttestation = () => {
    if (!scanManualTopo || !scanSelection.trim()) return
    const att = { year: scanYear, highlight: scanSelection, source: scanSource, quote: scanSelection, url: scanUrl }
    const entry = scanManualTopo
    const currentDrafts = getDrafts()
    const existing = currentDrafts.find(d => d.hash === entry.hash)
    if (existing) {
      saveDraft({ ...existing, attestations: [...(existing.attestations || []), att] })
    } else {
      saveDraft({
        draftId:      newDraftId(),
        hash:         entry.hash,
        name:         entry.title,
        vernacular:   entry.vernacular || '',
        type:         entry.type,
        coordinates:  entry.coordinates || [],
        tags:         entry.tags || [],
        attestations: [att],
        etymology_ids: entry.etymology_ids || [],
        notes:        entry.notes || '',
      })
    }
    refreshDrafts()
    setScanSelection('')
    setScanManualTopo(null)
    setScanManualSearch('')
  }

  return (
    <div className="bo-manual-page">
      <div className="bo-manual-col bo-manual-col--text">
        <div className="bo-scanner-header">
          <h3 className="bo-scanner-title">Enlazar citas manualmente</h3>
          <p className="bo-scanner-desc">
            Pega un texto histórico, selecciona un fragmento con el ratón y vincúlalo a un topónimo del índice.
          </p>
        </div>
        <div className="bo-form-section">
          <label className="bo-label">Fuente</label>
          <input
            list="bo-source-list"
            className="bo-input"
            value={scanSource}
            onChange={e => {
              const val = e.target.value
              setScanSource(val)
              const match = SOURCE_TEMPLATES.find(t => t.source === val)
              if (match) {
                if (!scanYear) setScanYear(match.year)
                if (!scanUrl && match.url) setScanUrl(match.url)
              }
            }}
            placeholder="Catastro de Ensenada"
          />
        </div>
        <div className="bo-form-row">
          <div className="bo-form-section">
            <label className="bo-label">Año</label>
            <input className="bo-input" value={scanYear}
              onChange={e => setScanYear(e.target.value)} placeholder="1749" />
          </div>
          <div className="bo-form-section" style={{ flex: 2 }}>
            <label className="bo-label">URL <span className="bo-optional">(opcional)</span></label>
            <input className="bo-input" value={scanUrl}
              onChange={e => setScanUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="bo-form-section bo-manual-text-section">
          <label className="bo-label">Texto del documento</label>
          <textarea
            ref={manualTextRef}
            className="bo-input bo-textarea bo-manual-textarea"
            value={scanText}
            onChange={e => setScanText(e.target.value)}
            onMouseUp={() => {
              const el = manualTextRef.current
              if (!el) return
              const sel = el.value.substring(el.selectionStart, el.selectionEnd).trim()
              if (sel) setScanSelection(sel)
            }}
            placeholder="Pega el texto histórico aquí y selecciona fragmentos para vincularlos…"
          />
        </div>
        <div className="bo-scanner-actions">
          <button className="bo-btn" onClick={onBack}>← Volver</button>
        </div>
      </div>

      <div className="bo-manual-col bo-manual-col--form">
        {!scanSelection ? (
          <p className="bo-empty bo-manual-hint">Selecciona texto en el panel izquierdo para crear una atestación.</p>
        ) : (
          <div className="bo-scan-manual-form">
            <label className="bo-label">Cita seleccionada</label>
            <blockquote className="bo-scan-quote">{scanSelection}</blockquote>

            <label className="bo-label">Topónimo</label>
            <input
              className="bo-input"
              placeholder="Buscar topónimo…"
              value={scanManualSearch}
              onChange={e => { setScanManualSearch(e.target.value); setScanManualTopo(null) }}
            />
            {manualSearchResults.length > 0 && !scanManualTopo && (
              <div className="bo-search-results">
                {manualSearchResults.map(t => (
                  <button key={t.hash} className="bo-search-result-item"
                    onClick={() => { setScanManualTopo(t); setScanManualSearch(t.title) }}>
                    <span className="bo-search-result-name">{t.title}</span>
                    <span className="bo-search-result-hash">{t.hash}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="bo-scanner-actions" style={{ marginTop: '0.75rem' }}>
              <button className="bo-btn bo-btn-primary"
                disabled={!scanManualTopo} onClick={addManualAttestation}>
                Añadir atestación
              </button>
              <button className="bo-btn bo-btn-sm" onClick={() => { setScanSelection(''); setScanManualTopo(null); setScanManualSearch('') }}>
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
