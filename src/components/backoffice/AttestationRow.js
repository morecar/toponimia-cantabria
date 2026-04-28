export default function AttestationRow({ att, onChange, onRemove }) {
  const field = (key, value) => onChange({ ...att, [key]: value })

  const updateOcc = (i, key, value) => {
    const next = [...att.occurrences]
    next[i] = { ...next[i], [key]: value }
    onChange({ ...att, occurrences: next })
  }

  const addOcc = () => onChange({
    ...att,
    occurrences: [...att.occurrences, { highlight: '', quote: '' }],
  })

  const removeOcc = (i) => {
    const next = att.occurrences.filter((_, j) => j !== i)
    if (next.length === 0) onRemove()
    else onChange({ ...att, occurrences: next })
  }

  return (
    <div className="bo-attestation-row">
      <div className="bo-attestation-row-top">
        <input className="bo-input bo-input-sm" placeholder="Año" type="number"
          value={att.year} onChange={e => field('year', e.target.value)} />
        <button className="bo-btn-icon" onClick={onRemove} title="Eliminar atestación">×</button>
      </div>

      <input list="bo-source-list" className="bo-input" placeholder="Fuente"
        value={att.source} onChange={e => field('source', e.target.value)} />
      <input className="bo-input" placeholder="URL"
        value={att.url} onChange={e => field('url', e.target.value)} />

      <div className="bo-att-occurrences">
        {att.occurrences.map((occ, i) => (
          <div key={i} className="bo-att-occ-row">
            <div className="bo-att-occ-row-top">
              <input className="bo-input bo-input-sm" placeholder="Forma atestiguada"
                value={occ.highlight}
                onChange={e => updateOcc(i, 'highlight', e.target.value)} />
              <button className="bo-btn-icon" onClick={() => removeOcc(i)} title="Eliminar aparición">×</button>
            </div>
            <textarea className="bo-input bo-textarea" placeholder="Cita en contexto" rows={2}
              value={occ.quote}
              onChange={e => updateOcc(i, 'quote', e.target.value)} />
          </div>
        ))}
        <button className="bo-btn bo-btn-sm" style={{ marginTop: '0.25rem' }} onClick={addOcc}>
          + Añadir aparición
        </button>
      </div>
    </div>
  )
}
