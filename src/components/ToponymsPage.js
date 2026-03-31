import React, { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar, Container } from 'react-bootstrap'
import { ArrowLeft } from 'react-bootstrap-icons'
import Markdown from 'react-markdown'
import TopoMiniMap from './TopoMiniMap'
import { ROUTE_HOME, ROUTE_ETYMOLOGIES } from '../resources/routes'

function tagCategoryClass(tagKey) {
  const prefix = tagKey.split(':')[0]
  return `tag-chip--cat-${prefix}`
}

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

function TopoIndexDetail({ hash, repository, etymologyStore, loc, onNavigateToEtym }) {
  const topo = repository.getFromId(hash)

  const attestations = useMemo(() => topo ? (topo.attestations || []).slice().reverse() : [], [topo])
  const etymologies = useMemo(() => {
    if (!topo) return []
    const ids = topo.etymology_ids ? String(topo.etymology_ids).split(',').map(s => s.trim()) : []
    return ids.map(id => etymologyStore.getById(id)).filter(Boolean)
  }, [topo, etymologyStore])
  const tags = useMemo(() => {
    if (!topo) return []
    const etymTags = etymologies.flatMap(e => e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    return [...new Set([...(topo.tags || []), ...etymTags])]
  }, [topo, etymologies])
  const tagGroups = useMemo(() => {
    const groups = {}
    tags.forEach(tag => {
      const cat = tag.split(':')[0]
      ;(groups[cat] = groups[cat] || []).push(tag)
    })
    return groups
  }, [tags])

  if (!topo) return null

  return (
    <div className="topo-index-detail">
      <p className="topo-index-detail-breadcrumb">{loc.get('toponyms_title')}</p>

      <div className="topo-index-detail-map">
        <TopoMiniMap topo={topo} />
      </div>

      <div className="topo-index-detail-card">
        <div className="topo-index-detail-hero">
          <h2 className="topo-index-detail-title">{topo.title}</h2>
        </div>
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

        <section className="topo-detail-section">
          <h3 className="topo-detail-section-title">{loc.get('panel_attestations')}</h3>
          {attestations.length > 0 ? (
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
          ) : (
            <p className="topo-detail-empty">{loc.get('panel_attestations_empty') || 'Sin atestaciones registradas.'}</p>
          )}
        </section>

        {etymologies.length === 0 && attestations.length === 0 && (
          <p className="topo-detail-empty">{loc.get('panel_no_data')}</p>
        )}

        {tags.length > 0 && (
          <section className="topo-detail-section">
            <h3 className="topo-detail-section-title">{loc.get('panel_tags')}</h3>
            {Object.entries(tagGroups).map(([cat, catTags]) => (
              <div key={cat} className="topo-detail-tag-group">
                <span className="topo-detail-tag-category">{loc.get(`tag_category_${cat}`) || cat}</span>
                <div className="topo-detail-tags">
                  {catTags.map(tag => (
                    <span key={tag} className={`tag-chip ${tagCategoryClass(tag)}`}>
                      {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

export default function ToponymsPage({ repository, etymologyStore, loc, onBack }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedHash = searchParams.get('h')

  const navigate = useNavigate()

  const entries = useMemo(() =>
    repository.getAllEntries().sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' })
    ), [repository])

  const query = searchParams.get('q') || ''

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => (e.title || '').toLowerCase().includes(q))
  }, [entries, query])

  const sections = useMemo(() => {
    const groups = []
    let currentLetter = null
    filtered.forEach(entry => {
      const letter = (entry.title || '').charAt(0).toUpperCase()
      if (letter !== currentLetter) {
        currentLetter = letter
        groups.push({ letter, items: [] })
      }
      groups[groups.length - 1].items.push(entry)
    })
    return groups
  }, [filtered])

  function handleBack() {
    if (selectedHash) {
      setSearchParams({})
    } else {
      onBack && onBack()
    }
  }

  function openOnMap(hash) {
    navigate(`${ROUTE_HOME}?h=${hash}`)
  }

  return (
    <div className="etym-route">
      <Container>
        <Navbar fixed="top" bg="dark" variant="dark">
          <div className="navbar-brand-center">
            <Navbar.Brand className="main-brand"><span className="brand-el">El </span>Toponomasticon</Navbar.Brand>
          </div>
          <button className="settings-toggle" onClick={handleBack} title="Volver">
            <ArrowLeft />
          </button>
        </Navbar>

        {selectedHash ? (
          <div className="etym-page etym-page--detail">
            <TopoIndexDetail
              hash={selectedHash}
              repository={repository}
              etymologyStore={etymologyStore}
              loc={loc}
              onNavigateToEtym={id => navigate(`${ROUTE_ETYMOLOGIES}?focus=${id}`)}
            />
            <div className="topo-index-detail-map-link">
              <button className="topo-index-open-map-btn" onClick={() => openOnMap(selectedHash)}>
                {loc.get('panel_open_map') || 'Ver en el mapa'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="etym-page">
              <div className="etym-search-header etym-search-header--mobile">
                <h1 className="etym-page-title">{loc.get('toponyms_title')}</h1>
                <div className="etym-count-line">
                  {filtered.length} {filtered.length === 1 ? loc.get('toponyms_result_singular') : loc.get('toponyms_result_plural')}
                </div>
              </div>
              <div className="etym-list">
                {sections.map(({ letter, items }) => (
                  <section key={letter} className="etym-section">
                    <h2 className="etym-section-letter">{letter}</h2>
                    <ol className="etym-section-list">
                      {items.map(entry => (
                        <li key={entry.hash}
                          className="etym-card topo-index-card"
                          onClick={() => setSearchParams({ h: entry.hash })}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && setSearchParams({ h: entry.hash })}
                        >
                          <div className="etym-card-header">
                            <span className="topo-index-name">{entry.title}</span>
                            <span className={`topo-index-type topo-index-type--${entry.type}`}>
                              {loc.get(`toponyms_type_${entry.type}`) || entry.type}
                            </span>
                          </div>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="topo-index-tags">
                              {entry.tags.map(tag => (
                                <span key={tag} className={`tag-chip tag-chip--sm ${tagCategoryClass(tag)}`}>
                                  {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
                {filtered.length === 0 && (
                  <p className="etym-empty">{loc.get('panel_no_data')}</p>
                )}
              </div>
            </div>

            <div className="etym-search-bar">
              <div className="etym-search-header">
                <h1 className="etym-page-title">{loc.get('toponyms_title')}</h1>
                <div className="etym-count-line">
                  {filtered.length} {filtered.length === 1 ? loc.get('toponyms_result_singular') : loc.get('toponyms_result_plural')}
                </div>
              </div>
              <div className="etym-search-row">
                <input
                  className="etym-search-input"
                  type="search"
                  placeholder={loc.get('toponyms_search_placeholder')}
                  value={query}
                  onChange={e => e.target.value ? setSearchParams({ q: e.target.value }) : setSearchParams({})}
                />
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  )
}
