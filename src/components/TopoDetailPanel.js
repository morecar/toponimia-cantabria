import Markdown from 'react-markdown'

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

function tagCategoryClass(tagKey) {
  const prefix = tagKey.split(':')[0]
  return `tag-chip--cat-${prefix}`
}

export default function TopoDetailPanel({ hash, repository, etymologyStore, loc, onClose, onNavigateToEtym }) {
  const topo = repository.getFromId(hash)
  if (!topo) return null

  const attestations = (topo.attestations || []).slice().reverse()
  const etymologyIds = topo.etymology_ids ? String(topo.etymology_ids).split(',').map(s => s.trim()) : []
  const etymologies = etymologyIds.map(id => etymologyStore.getById(id)).filter(Boolean)
  const etymTags = etymologies.flatMap(e => e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
  const tags = [...new Set([...(topo.tags || []), ...etymTags])]

  return (
    <div className="topo-detail-panel">
      <div className="topo-detail-inner">
        <button className="topo-detail-close" onClick={onClose} aria-label="Cerrar">×</button>

        <h2 className="topo-detail-title">{topo.title}</h2>

        {topo.notes && (
          <div className="topo-detail-notes topo-detail-topo-notes">
            <Markdown>{topo.notes}</Markdown>
          </div>
        )}

        {etymologies.length > 0 && (
          <section className="topo-detail-section">
            <h3 className="topo-detail-section-title">{loc.get('panel_etymology')}</h3>
            {etymologies.map((etymology, i) => (
              <div key={i} className={etymologies.length > 1 ? 'topo-etymology-item' : undefined}>
                {etymology.origin && (
                  <p>
                    <strong>{loc.get('panel_origin')}:</strong>{' '}
                    <Markdown components={{ p: 'span' }}>{etymology.origin}</Markdown>
                    {onNavigateToEtym && (
                      <button className="etym-goto-btn" onClick={() => onNavigateToEtym(etymology.id)} title={loc.get('nav_etymologies')}>↗</button>
                    )}
                  </p>
                )}
                {etymology.meaning && (
                  <p><strong>{loc.get('panel_meaning')}:</strong> <Markdown components={{ p: 'span' }}>{etymology.meaning}</Markdown></p>
                )}
                {etymology.notes && (
                  <div className="topo-detail-notes"><Markdown>{etymology.notes}</Markdown></div>
                )}
              </div>
            ))}
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
                    {a.highlight && <span className="topo-attestation-form">{a.highlight}</span>}
                  </div>
                  {a.source && <div className="topo-attestation-source">{a.source}</div>}
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

        {etymologies.length === 0 && attestations.length === 0 && (
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>{loc.get('panel_no_data')}</p>
        )}

        {tags.length > 0 && (() => {
          const groups = {}
          tags.forEach(tag => {
            const cat = tag.split(':')[0]
            ;(groups[cat] = groups[cat] || []).push(tag)
          })
          return (
            <section className="topo-detail-section">
              <h3 className="topo-detail-section-title">{loc.get('panel_tags')}</h3>
              {Object.entries(groups).map(([cat, catTags]) => (
                <div key={cat} className="topo-detail-tag-group">
                  <span className="topo-detail-tag-category">{loc.get(`tag_category_${cat}`) || cat}</span>
                  <div className="topo-detail-tags">
                    {catTags.map(tag => (
                      <a
                        key={tag}
                        href={`${process.env.PUBLIC_URL}/busqueda?q=${encodeURIComponent(tag)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`tag-chip ${tagCategoryClass(tag)} topo-tag-link`}
                      >
                        {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ')}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )
        })()}
      </div>
    </div>
  )
}
