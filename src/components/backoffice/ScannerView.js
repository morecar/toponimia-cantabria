import { useState } from 'react'
import { getDrafts, saveDraft, newDraftId } from '../../model/draftStore'
import { SOURCE_TEMPLATES } from './constants'
import { scanTextForToponyms } from './scanUtils'
import ScanResult from './ScanResult'

export default function ScannerView({
  scanSource, setScanSource, scanYear, setScanYear, scanUrl, setScanUrl,
  scanText, setScanText, mapBounds, repository, refreshDrafts, onBack,
}) {
  const [scanResults,  setScanResults]  = useState([])
  const [scanSelected, setScanSelected] = useState(new Set())

  const runScanner = () => {
    let entries = repository?.getAllEntries() || []
    if (mapBounds) {
      entries = entries.filter(e => {
        const coords = e.coordinates || []
        return coords.some(([lat, lng]) => mapBounds.contains([lat, lng]))
      })
    }
    const results = scanTextForToponyms(scanText, entries)
    setScanResults(results)
    setScanSelected(new Set(results.map((_, i) => i)))
  }

  const toggleScanResult = (i) => {
    setScanSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAllScanResults = () => {
    if (scanSelected.size === scanResults.length) setScanSelected(new Set())
    else setScanSelected(new Set(scanResults.map((_, i) => i)))
  }

  const createDraftsFromScan = () => {
    const att = { year: scanYear, highlight: '', source: scanSource, quote: '', url: scanUrl }
    const currentDrafts = getDrafts()

    scanResults.forEach((result, i) => {
      if (!scanSelected.has(i)) return
      const { entry, matchedForm, quote } = result
      const thisAtt = { ...att, highlight: matchedForm, quote }
      const existing = currentDrafts.find(d => d.hash === entry.hash)

      if (existing) {
        saveDraft({ ...existing, attestations: [...(existing.attestations || []), thisAtt] })
      } else {
        saveDraft({
          draftId:      newDraftId(),
          hash:         entry.hash,
          name:         entry.title,
          vernacular:   entry.vernacular || '',
          type:         entry.type,
          coordinates:  entry.coordinates || [],
          tags:         entry.tags || [],
          attestations: [thisAtt],
          etymology_ids: entry.etymology_ids || [],
          notes:        entry.notes || '',
        })
      }
      currentDrafts.length = 0
      currentDrafts.push(...getDrafts())
    })

    refreshDrafts()
    setScanResults([])
    setScanSelected(new Set())
    onBack()
  }

  return (
    <div className="bo-form">
      <div className="bo-scanner-header">
        <h3 className="bo-scanner-title">Escanear texto histórico</h3>
        <p className="bo-scanner-desc">
          Pega un fragmento de documento. El sistema detecta qué topónimos del índice aparecen en él
          y te permite crear borradores con la cita en contexto.
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
      <div className="bo-form-section">
        <label className="bo-label">Año</label>
        <input className="bo-input" value={scanYear}
          onChange={e => setScanYear(e.target.value)} placeholder="1749" />
      </div>
      <div className="bo-form-section">
        <label className="bo-label">URL <span className="bo-optional">(opcional)</span></label>
        <input className="bo-input" value={scanUrl}
          onChange={e => setScanUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div className="bo-form-section">
        <label className="bo-label">Texto del documento</label>
        <textarea className="bo-input bo-textarea" rows={8} value={scanText}
          onChange={e => { setScanText(e.target.value); setScanResults([]) }}
          placeholder="Pega aquí el texto histórico…" />
      </div>

      <div className="bo-scanner-actions">
        <button className="bo-btn bo-btn-primary" disabled={!scanText.trim()} onClick={runScanner}>
          ⌕ Escanear
        </button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>

      {scanResults.length > 0 && (
        <div className="bo-scan-results-wrap">
          <div className="bo-scan-results-header">
            <span>{scanResults.length} coincidencia{scanResults.length !== 1 ? 's' : ''}</span>
            <button className="bo-btn bo-btn-sm" onClick={toggleAllScanResults}>
              {scanSelected.size === scanResults.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>
          {scanResults.map((r, i) => (
            <ScanResult key={i} result={r}
              selected={scanSelected.has(i)} onToggle={() => toggleScanResult(i)} />
          ))}
          <div className="bo-scanner-actions" style={{ marginTop: '0.75rem' }}>
            <button className="bo-btn bo-btn-primary"
              disabled={scanSelected.size === 0} onClick={createDraftsFromScan}>
              Crear borradores ({scanSelected.size})
            </button>
          </div>
        </div>
      )}

      {scanResults.length === 0 && scanText.trim() && (
        <p className="bo-empty" style={{ marginTop: '0.5rem' }}>Pulsa "Escanear" para buscar coincidencias.</p>
      )}
    </div>
  )
}
