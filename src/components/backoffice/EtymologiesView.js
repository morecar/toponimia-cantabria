import { useState } from 'react'
import {
  useDraftStore, saveDraftEtymology, deleteDraftEtymology, newDraftEtymId,
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

export default function EtymologiesView({ etymologyStore, startSubview, onBack }) {
  const draftEtyms = useDraftStore(s => s.draftEtymologies)
  const [subview, setSubview]         = useState(startSubview === 'new' ? 'form' : 'list')
  const [etymForm, setEtymForm]       = useState(startSubview === 'new' ? EMPTY_ETYM_FORM() : EMPTY_ETYM_FORM)

  const handleNew = () => { setEtymForm(EMPTY_ETYM_FORM); setSubview('form') }

  const handleEdit = (etym) => {
    setEtymForm({ id: etym.id, origin: etym.origin || '', meaning: etym.meaning || '', notes: etym.notes || '', tags: etym.tags || '' })
    setSubview('form')
  }

  const handleSave = () => {
    if (!etymForm.origin.trim()) return
    const id = etymForm.id || newDraftEtymId()
    saveDraftEtymology({ ...etymForm, id })
    setSubview('list')
  }

  const handleDelete = (id) => { deleteDraftEtymology(id) }

  const handleMarkDeleted = (etym) => { saveDraftEtymology({ ...etym, deleted: true }) }

  if (subview === 'form') {
    const isCommittedEdit = etymForm.id && etymologyStore?.byId?.has(etymForm.id)
    const hasDraftOverride = etymForm.id && draftEtyms.some(e => e.id === etymForm.id)
    return (
      <div className="bo-form">
        {isCommittedEdit && (
          <div className="bo-edit-notice">
            Editando etimología del índice · <code>{etymForm.id}</code>
            {!hasDraftOverride && ' · los cambios se guardarán como borrador'}
          </div>
        )}
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
          {/* Show delete only for pure drafts or committed overrides (not for first-time committed edits) */}
          {hasDraftOverride && (
            <button className="bo-btn bo-btn-danger"
              onClick={() => { handleDelete(etymForm.id); setSubview('list') }}
              title={isCommittedEdit ? 'Descartar edición (restaura el original del índice)' : 'Eliminar'}>
              {isCommittedEdit ? 'Descartar edición' : 'Eliminar'}
            </button>
          )}
          {!isCommittedEdit && !hasDraftOverride && etymForm.id && (
            <button className="bo-btn bo-btn-danger"
              onClick={() => { handleDelete(etymForm.id); setSubview('list') }}>
              Eliminar
            </button>
          )}
          <button className="bo-btn" onClick={() => setSubview('list')}>Cancelar</button>
        </div>
      </div>
    )
  }

  // Separate drafts by kind
  const draftIds     = new Set(draftEtyms.map(e => e.id))
  const activeDrafts = draftEtyms.filter(e => !e.deleted)
  const deletedDrafts = draftEtyms.filter(e => e.deleted)

  // Committed etymologies that don't yet have a draft of any kind
  const uncommittedEtyms = (etymologyStore?.byId?.size ?? 0) > 0
    ? Array.from(etymologyStore.byId.values()).filter(e => !draftIds.has(e.id))
    : []

  return (
    <>
      <div className="bo-panel-header">
        <button className="bo-btn bo-btn-primary" onClick={handleNew}>+ Nueva</button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>

      {(activeDrafts.length > 0 || deletedDrafts.length > 0) && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">Borradores</h4>
          {activeDrafts.map(e => {
            const isOverride = etymologyStore?.byId?.has(e.id)
            return (
              <div key={e.id} className="bo-etym-list-item">
                <div className="bo-etym-list-body">
                  <strong>{stripFmt(e.origin)}</strong>
                  <WiktLinksLocal origin={e.origin} />
                  {isOverride && <span className="bo-etym-override-badge" title="Edición de una etimología del índice">editado</span>}
                  {e.meaning && <span className="bo-etym-meaning"> — {stripFmtInline(e.meaning)}</span>}
                  {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
                </div>
                <div className="bo-etym-list-actions">
                  <button className="bo-btn bo-btn-sm" onClick={() => handleEdit(e)}>Editar</button>
                  <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => handleDelete(e.id)} title={isOverride ? 'Descartar edición (restaura original)' : 'Eliminar'}>✕</button>
                </div>
              </div>
            )
          })}
          {deletedDrafts.map(e => (
            <div key={e.id} className="bo-etym-list-item bo-etym-list-item--deleted">
              <div className="bo-etym-list-body">
                <strong>{stripFmt(e.origin)}</strong>
                <span className="bo-deleted-badge">borrado</span>
                {e.meaning && <span className="bo-etym-meaning"> — {stripFmtInline(e.meaning)}</span>}
              </div>
              <div className="bo-etym-list-actions">
                <button className="bo-btn bo-btn-sm" onClick={() => handleDelete(e.id)}>Deshacer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uncommittedEtyms.length > 0 && (
        <div className="bo-etym-section">
          <h4 className="bo-etym-section-title">En el índice</h4>
          {uncommittedEtyms.map(e => (
            <div key={e.id} className="bo-etym-list-item bo-etym-list-item--committed">
              <div className="bo-etym-list-body">
                <strong>{stripFmt(e.origin)}</strong>
                <WiktLinksLocal origin={e.origin} />
                {e.meaning && <span className="bo-etym-meaning"> — {stripFmtInline(e.meaning)}</span>}
                {e.notes && <p className="bo-etym-notes">{e.notes}</p>}
              </div>
              <div className="bo-etym-list-actions">
                <button className="bo-btn bo-btn-sm" onClick={() => handleEdit(e)}>Editar</button>
                <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => handleMarkDeleted(e)}>Borrar</button>
                <span className="bo-etym-committed-badge">{e.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {draftEtyms.length === 0 && uncommittedEtyms.length === 0 && (etymologyStore?.byId?.size ?? 0) === 0 && (
        <p className="bo-empty">Sin etimologías todavía.</p>
      )}
    </>
  )
}
