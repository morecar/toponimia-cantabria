export default function AttestationRow({ att, onChange, onRemove }) {
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
      <input list="bo-source-list" className="bo-input" placeholder="Fuente"
        value={att.source} onChange={e => field('source', e.target.value)} />
      <textarea className="bo-input bo-textarea" placeholder="Cita"
        value={att.quote} onChange={e => field('quote', e.target.value)} rows={2} />
      <input className="bo-input" placeholder="URL"
        value={att.url} onChange={e => field('url', e.target.value)} />
    </div>
  )
}
