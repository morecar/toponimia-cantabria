import React from 'react'

function HighlightedQuote({ quote, highlight }) {
  if (!highlight) return <>{quote}</>
  const idx = quote.indexOf(highlight)
  if (idx === -1) return <>{quote}</>
  return (
    <>
      {quote.slice(0, idx)}
      <mark className="topo-attestation-mark">{highlight}</mark>
      {quote.slice(idx + highlight.length)}
    </>
  )
}

export default function TopoDetailPanel({ hash, repository, attestationsStore, etymologyStore, loc, onClose }) {
  const topo = repository.getFromId(hash)
  if (!topo) return null

  const attestations = attestationsStore.getByHash(hash)
  const etymology = topo.etymology_id ? etymologyStore.getById(topo.etymology_id) : null

  return (
    <div className="topo-detail-panel">
      <div className="topo-detail-inner">
        <button className="topo-detail-close" onClick={onClose} aria-label="Cerrar">×</button>

        <h2 className="topo-detail-title">{topo.title}</h2>

        {etymology && (
          <section className="topo-detail-section">
            <h3 className="topo-detail-section-title">{loc.get('panel_etymology')}</h3>
            {etymology.origin && (
              <p><strong>{loc.get('panel_origin')}:</strong> {etymology.origin}</p>
            )}
            {etymology.meaning && (
              <p><strong>{loc.get('panel_meaning')}:</strong> {etymology.meaning}</p>
            )}
            {etymology.notes && (
              <p className="topo-detail-notes">{etymology.notes}</p>
            )}
          </section>
        )}

        {attestations.length > 0 && (
          <section className="topo-detail-section">
            <h3 className="topo-detail-section-title">{loc.get('panel_attestations')}</h3>
            <ol className="topo-attestations-list">
              {attestations.map((a, i) => (
                <li key={i} className="topo-attestation-item">
                  <div className="topo-attestation-header">
                    <span className="topo-attestation-year">{a.year}</span>
                    <span className="topo-attestation-source">{a.source}</span>
                  </div>
                  {a.quote && (
                    <blockquote className="topo-attestation-quote">
                      <HighlightedQuote quote={a.quote} highlight={a.highlight} />
                    </blockquote>
                  )}
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="topo-attestation-link">
                      {loc.get('panel_source_link')}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {!etymology && attestations.length === 0 && (
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{loc.get('panel_no_data')}</p>
        )}
      </div>
    </div>
  )
}
