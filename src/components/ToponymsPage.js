import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar, Container } from 'react-bootstrap'
import { ArrowLeft } from 'react-bootstrap-icons'
import { ROUTE_HOME } from '../resources/routes'

export default function ToponymsPage({ repository, loc, onBack }) {
  const [query, setQuery] = useState('')

  const navigate = useNavigate()

  const entries = useMemo(() =>
    repository.getAllEntries().sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    ), [repository])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => (e.name || '').toLowerCase().includes(q))
  }, [entries, query])

  const sections = useMemo(() => {
    const groups = []
    let currentLetter = null
    filtered.forEach(entry => {
      const letter = (entry.name || '').charAt(0).toUpperCase()
      if (letter !== currentLetter) {
        currentLetter = letter
        groups.push({ letter, items: [] })
      }
      groups[groups.length - 1].items.push(entry)
    })
    return groups
  }, [filtered])

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
          {onBack && (
            <button className="settings-toggle" onClick={onBack} title="Volver">
              <ArrowLeft />
            </button>
          )}
        </Navbar>

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
                      onClick={() => openOnMap(entry.hash)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && openOnMap(entry.hash)}
                    >
                      <div className="etym-card-header">
                        <span className="topo-index-name">{entry.name}</span>
                        <span className={`topo-index-type topo-index-type--${entry.type}`}>
                          {loc.get(`toponyms_type_${entry.type}`) || entry.type}
                        </span>
                      </div>
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
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </Container>
    </div>
  )
}
