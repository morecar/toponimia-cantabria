import { useState } from 'react'
import {
  getDraftEtymologies, saveDraftEtymology, deleteDraftEtymology, newDraftEtymId,
} from '../../model/draftStore'
import { EMPTY_ETYM_FORM, stripFmt, stripFmtInline } from './constants'

function WiktLinksLocal({ origin }) {
  const word = origin?.replace(/^\*+(.+?)\*+$/, '$1')
  if (!word || word.includes(' ')) return null
  const w = encodeURIComponent(word.toLowerCase())
  return (
    <span className="bo-wikt-links">
      <a href={`https://en.wiktionary.org/wiki/${w}#Latin`} target="_blank" rel="noopener noreferrer">en</a>
      {' '}
      <a href={`https://es.wiktionary.org/wiki/${w}#Latin`} target="_blank" rel="noopener noreferrer">es</a>
    </span>
  )
}

export default function EtymologiesView({ etymologyStore, onBack }) {
  const [draftEtyms, setDraftEtyms]   = useState(() => getDraftEtymologies())
  const [subview, setSubview]         = useState('list')
  const [etymForm, setEtymForm]       = useState(EMPTY_ETYM_FORM)

  const refresh = () => setDraftEtyms(getDraftEtymologies())

  const handleNew = () => { setEtymForm(EMPTY_ETYM_FORM); setSubview('form') }

  const handleEdit = (etym) => {
    setEtymForm({ id: etym.id, origin: etym.origin || '', meaning: etym.meaning || '', notes: etym.notes || '', tags: etym.tags || '' })
    setSubview('form')
  }

  const handleSave = () => {
    if (!etymForm.origin.trim()) return
    const id = etymForm.id || newDraftEtymId()
    saveDraftEtymology({ ...etymForm, id })
    refresh()
    setSubview('list')
  }

  const handleDelete = (id) => { deleteDraftEtymology(id); refresh() }

  if (subview === 'form') return (
    <div className="bo-form">
      <div className="bo-form-section">
        <label className="bo-label">Origen <span className="bo-required">*</span></label>
        <input className="bo-input" placeholder="p.ej. CASTELLUM, aqua, valle…"
          value={etymForm.origin}
          onChange={e => setEtymForm(f => ({ ...f, origin: e.target.value }))} />
      </div>
      <div className="bo-form-section">
        <label className="bo-label">Significado <span className="bo-optional">(opcional)</span></label>
        <input className="bo-input" placeholder="traducción o glosa"
          value={etymForm.meaning}
          onChange={e => setEtymForm(f => ({ ...f, meaning: e.target.value }))} />
      </div>
      <div className="bo-form-section">
        <label className="bo-label">Notas <span className="bo-optional">(opcional)</span></label>
        <textarea className="bo-input bo-textarea" rows={4}
          placeholder="Evolución fonética, referencias bibliográficas, cognados…"
          value={etymForm.notes}
          onChange={e => setEtymForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="bo-form-section">
        <label className="bo-label">Etiquetas <span className="bo-optional">(opcional)</span></label>
        <input className="bo-input" placeholder="latín, prerromano, hidronímico…"
          value={etymForm.tags}
          onChange={e => setEtymForm(f => ({ ...f, tags: e.target.value }))} />
      </div>
      <div className="bo-form-actions">
        <button className="bo-btn bo-btn-primary" disabled={!etymForm.origin.trim()} onClick={handleSave}>
          Guardar
        </button>
        {etymForm.id && (
          <button className="bo-btn bo-btn-danger"
            onClick={() => { handleDelete(etymForm.id); setSubview('list') }}>
            Eliminar
          </button>
        )}
        <button className="bo-btn" onClick={() => setSubview('list')}>Cancelar</button>
      </div>
    </div>
  )

  return (
    <>
      <div className="bo-panel-header">
        <button className="bo-btn bo-btn-primary" onClick={handleNew}>+ Nueva</button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>

      {draftEtyms.length > 0 && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">Borradores</h4>
          {draftEtyms.map(e => (
            <div key={e.id} className="bo-etym-list-item">
              <div className="bo-etym-list-body">
                <strong>{stripFmt(e.origin)}</strong>
                <WiktLinksLocal origin={e.origin} />
                {e.meaning && <span className="bo-etym-meaning"> — {stripFmtInline(e.meaning)}</span>}
                {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
              </div>
              <div className="bo-etym-list-actions">
                <button className="bo-btn bo-btn-sm" onClick={() => handleEdit(e)}>Editar</button>
                <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => handleDelete(e.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(etymologyStore?.byId?.size ?? 0) > 0 && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">En el índice</h4>
          {Array.from(etymologyStore.byId.values()).map(e => (
            <div key={e.id} className="bo-etym-list-item bo-etym-list-item--committed">
              <div className="bo-etym-list-body">
                <strong>{stripFmt(e.origin)}</strong>
                <WiktLinksLocal origin={e.origin} />
                {e.meaning && <span className="bo-etym-meaning"> — {stripFmtInline(e.meaning)}</span>}
                {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
              </div>
              <span className="bo-etym-committed-badge">{e.id}</span>
            </div>
          ))}
        </div>
      )}

      {draftEtyms.length === 0 && (etymologyStore?.byId?.size ?? 0) === 0 && (
        <p className="bo-empty">Sin etimologías todavía.</p>
      )}
    </>
  )
}
