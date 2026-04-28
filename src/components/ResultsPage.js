import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Navbar } from 'react-bootstrap'
import { List } from 'react-bootstrap-icons'

import SearchBar from './SearchBar'
import NavMenu from './NavMenu'
import SettingsPanel from './SettingsPanel'
import ResultsMap from './ResultsMap'
import TopoDetailPanel from './TopoDetailPanel'
import ErrorBoundary from './ErrorBoundary'

import { ROUTE_SEARCH, ROUTE_HOME, ROUTE_ABOUT, ROUTE_ETYMOLOGIES, ROUTE_TOPONYMS } from '../resources/routes'

const QUERY_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed']
const MAX_QUERIES = 4

function buildInitialQueries(repository, search, queryStrings) {
  if (!search || search === 'false') {
    return [{ queryString: '', queryResults: repository.getFromQueryString('') }]
  }
  if (!queryStrings?.length) return [{ queryString: '', queryResults: [] }]
  return queryStrings.map(qs => ({
    queryString: qs,
    queryResults: repository.getFromQueryString(qs),
  }))
}

export default function ResultsPage({ repository, config, loc, etymologyStore, search, queryStrings }) {
  const navigate = useNavigate()

  const [queries, setQueries] = useState(() => {
    const initial = buildInitialQueries(repository, search, queryStrings)
    return initial.map((q, i) => ({ id: i + 1, ...q, color: QUERY_COLORS[i % QUERY_COLORS.length] }))
  })
  const [nextId,           setNextId]           = useState(() => buildInitialQueries(repository, search, queryStrings).length + 1)
  const [hasSearched,      setHasSearched]      = useState(() => buildInitialQueries(repository, search, queryStrings).some(q => !!q.queryString))
  const [showSettings,     setShowSettings]     = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [panelHash,        setPanelHash]        = useState(
    () => new URLSearchParams(window.location.search).get('h') || null
  )
  // Bump to force re-read of mutated config object after settings are saved.
  const [, setConfigVersion] = useState(0)

  // ── Navigation helpers ────────────────────────────────────────────────────────
  const navigateFromQueries = useCallback((nonEmpty) => {
    if (nonEmpty.length === 0) {
      navigate(hasSearched ? ROUTE_SEARCH : ROUTE_HOME)
    } else {
      const params = new URLSearchParams()
      nonEmpty.forEach(q => params.append('q', q.queryString))
      navigate(`${ROUTE_SEARCH}?${params.toString()}`)
    }
  }, [hasSearched, navigate])

  // ── Query management ──────────────────────────────────────────────────────────
  const updateResults = (id, newQueryString) => {
    const updated = queries.map(q =>
      q.id === id
        ? { ...q, queryString: newQueryString, queryResults: repository.getFromQueryString(newQueryString, config.searchUseRegex) }
        : q
    )
    setQueries(updated)
    setHasSearched(true)
    navigateFromQueries(updated.filter(q => !!q.queryString))
  }

  const addQuery = () => {
    if (queries.length >= MAX_QUERIES) return
    setQueries(q => [...q, { id: nextId, queryString: '', queryResults: [], color: QUERY_COLORS[q.length % QUERY_COLORS.length] }])
    setNextId(n => n + 1)
    setHasSearched(true)
  }

  const removeQuery = (id) => {
    const updated = queries.filter(q => q.id !== id)
    setQueries(updated)
    navigateFromQueries(updated.filter(q => !!q.queryString))
  }

  // ── Panel ──────────────────────────────────────────────────────────────────────
  const openPanel = useCallback((hash) => {
    const url = new URL(window.location.href)
    url.searchParams.set('h', hash)
    window.history.pushState(null, '', url.toString())
    setPanelHash(hash)
    setHasSearched(true)
  }, [])

  const closePanel = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('h')
    window.history.pushState(null, '', url.toString())
    setPanelHash(null)
  }, [])

  // ── Derived display flags (re-read from config on every render) ────────────────
  const hasQuery      = queries.some(q => !!q.queryString)
  const displayTags   = config.resultsTags   === 'always' || (config.resultsTags   === 'search' && hasQuery)
  const displayTitle  = config.resultsTitle  === 'always' || (config.resultsTitle  === 'search' && hasQuery)
  const displayLines  = config.resultsTypes.includes('line')
  const displayPolys  = config.resultsTypes.includes('poly')
  const displayPoints = config.resultsTypes.includes('point')

  // ── Build per-entry color arrays for multi-query mode ─────────────────────────
  const colorsByHash = new Map()
  queries.forEach(q => {
    q.queryResults.forEach(r => {
      if (!colorsByHash.has(r.hash)) colorsByHash.set(r.hash, { result: r, colors: [] })
      colorsByHash.get(r.hash).colors.push(q.color)
    })
  })
  const allResults = Array.from(colorsByHash.values()).map(({ result, colors }) => ({
    ...result, colors, color: colors[0],
  }))

  const points      = displayPoints ? allResults.filter(r => r.type === 'point') : []
  const polys       = displayPolys  ? allResults.filter(r => r.type === 'poly')  : []
  const lines       = displayLines  ? allResults.filter(r => r.type === 'line')  : []
  const multiSearch = queries.length > 1
  const canAddMore  = hasSearched && queries.length < MAX_QUERIES

  return (
    <>
      <Container>
        <Navbar fixed="top" bg="dark" variant="dark">
          <div className="navbar-brand-center">
            <Navbar.Brand className="main-brand"><span className="brand-el">El </span>Toponomasticon</Navbar.Brand>
          </div>
          <button className="settings-toggle ms-auto" onClick={() => setShowSettings(s => !s)}>
            <List/>
          </button>
        </Navbar>

        {showSettings && (
          <NavMenu
            loc={loc}
            onClose={() => setShowSettings(false)}
            onNavigate={route => {
              if (route === 'etymologies') navigate(ROUTE_ETYMOLOGIES)
              else if (route === 'toponyms') navigate(ROUTE_TOPONYMS)
              else if (route === 'about') navigate(ROUTE_ABOUT)
            }}
            onOpenSettings={() => setShowSettingsPanel(true)}
          />
        )}

        {showSettingsPanel && (
          <SettingsPanel
            loc={loc}
            config={config}
            onSettingsUpdated={() => setConfigVersion(v => v + 1)}
            onClose={() => setShowSettingsPanel(false)}
            onNavigate={route => {
              setShowSettingsPanel(false)
              if (route === 'about') navigate(ROUTE_ABOUT)
            }}
          />
        )}

        <div className={`search-wrapper${hasSearched ? '' : ' search-centered'}${panelHash ? ' panel-open' : ''}`}>
          {multiSearch ? (
            <div className="search-row">
              <div className="search-chips-bar">
                {queries.map((q, i) => (
                  <React.Fragment key={q.id}>
                    {i > 0 && <span className="search-chip-sep">/</span>}
                    <div className={`search-chip${!q.queryString ? ' search-chip--new' : ''}`}>
                      <span className="search-chip-dot" style={{ background: q.color }} />
                      {q.queryString
                        ? <span className="search-chip-text">{q.queryString}</span>
                        : <input
                            autoFocus
                            className="search-chip-input"
                            placeholder={loc.get('search_placeholder')}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                updateResults(q.id, e.target.value.trim())
                              }
                            }}
                          />
                      }
                      <button className="search-chip-remove" onClick={() => removeQuery(q.id)}>×</button>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {canAddMore && queries.every(q => !!q.queryString) && (
                <button className="search-addon-btn" onClick={addQuery}>+</button>
              )}
            </div>
          ) : (
            <div className="search-row">
              <SearchBar
                onSearch={newQuery => updateResults(queries[0]?.id, newQuery)}
                value={queries[0]?.queryString ?? ''}
                color={hasSearched ? queries[0]?.color : undefined}
                tags={repository.getAllTags()}
                regex={config.searchUseRegex}
                config={config}
                loc={loc}
              />
              {canAddMore && (
                <button className="search-addon-btn" onClick={addQuery}>+</button>
              )}
            </div>
          )}
        </div>

        <ErrorBoundary fallback={(err, reset) => (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6c757d' }}>
            <p>El mapa no ha podido cargarse.</p>
            <button onClick={reset} style={{ padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Reintentar</button>
          </div>
        )}>
          <ResultsMap
            points={points} lines={lines} polys={polys}
            displayTags={displayTags} displayTitle={displayTitle}
            loc={loc} searching={hasQuery} markerSize={config.markerSize}
            onMarkerClick={openPanel}
            onZoomed={() => { if (!hasSearched) setHasSearched(true) }}
            flyToHash={panelHash}
          />
        </ErrorBoundary>
      </Container>

      {panelHash && (
        <TopoDetailPanel
          hash={panelHash}
          repository={repository}
          etymologyStore={etymologyStore}
          loc={loc}
          onClose={closePanel}
          onNavigateToEtym={id => navigate(`${ROUTE_ETYMOLOGIES}?focus=${id}`)}
        />
      )}
    </>
  )
}
