import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Navbar, Container } from 'react-bootstrap'
import { ArrowLeft } from 'react-bootstrap-icons'
import Markdown from 'react-markdown'

function tagCategoryClass(tagKey) {
  const prefix = tagKey.split(':')[0]
  return `tag-chip--cat-${prefix}`
}

function stripMarkdown(text) {
  return (text || '').replace(/\*+/g, '').replace(/#+/g, '').trim()
}

export default function EtymologiesPage({ etymologyStore, repository, loc, onBack }) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('all') // 'all' | 'etym'
  const [highlighted, setHighlighted] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (!focusId) return
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(`etym-card-${focusId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setHighlighted(focusId)
        setTimeout(() => setHighlighted(null), 1500)
      } else if (attempts < 5) {
        setTimeout(() => tryScroll(attempts + 1), 100)
      }
    }
    tryScroll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const etymologies = useMemo(() =>
    etymologyStore.getAll().sort((a, b) =>
      stripMarkdown(a.origin).localeCompare(stripMarkdown(b.origin), 'es', { sensitivity: 'base' })
    ), [etymologyStore])

  const etymsById = useMemo(() => {
    const map = {}
    etymologyStore.getAll().forEach(e => { map[e.id] = e })
    return map
  }, [etymologyStore])

  const scrollToEtym = useCallback((id) => {
    const el = document.getElementById(`etym-card-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlighted(id)
    setTimeout(() => setHighlighted(null), 1500)
  }, [])

  const toponymCounts = useMemo(() => {
    const counts = {}
    repository.getAllEntries().forEach(entry => {
      (entry.etymology_ids || []).forEach(id => {
        counts[id] = (counts[id] || 0) + 1
      })
    })
    return counts
  }, [repository])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return etymologies
    return etymologies.filter(e => {
      const inEtym = stripMarkdown(e.origin).toLowerCase().includes(q) ||
                     (e.meaning || '').toLowerCase().includes(q)
      if (scope === 'etym') return inEtym
      return inEtym || (e.notes || '').toLowerCase().includes(q)
    })
  }, [etymologies, query, scope])

  const sections = useMemo(() => {
    const groups = []
    let currentLetter = null
    filtered.forEach(etym => {
      const letter = stripMarkdown(etym.origin).charAt(0).toUpperCase()
      if (letter !== currentLetter) {
        currentLetter = letter
        groups.push({ letter, items: [] })
      }
      groups[groups.length - 1].items.push(etym)
    })
    return groups
  }, [filtered])

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
          <h1 className="etym-page-title">{loc.get('etymologies_title')}</h1>
          <div className="etym-count-line">
            {filtered.length} {filtered.length === 1 ? loc.get('etymologies_result_singular') : loc.get('etymologies_result_plural')}
          </div>
        </div>
        <div className="etym-list">
          {sections.map(({ letter, items }) => (
            <section key={letter} className="etym-section">
              <h2 className="etym-section-letter">{letter}</h2>
              <ol className="etym-section-list">
                {items.map(etym => {
                  const count = toponymCounts[etym.id] || 0
                  const tags = etym.tags ? etym.tags.split(',').map(t => t.trim()).filter(Boolean) : []
                  const refs = (etym.refs || []).map(id => etymsById[id]).filter(Boolean)
                  const isLatin = tags.includes('etymology:latin')
                  return (
                    <li key={etym.id} id={`etym-card-${etym.id}`}
                      className={`etym-card${highlighted === etym.id ? ' etym-card--highlighted' : ''}`}>
                      <div className="etym-card-header">
                        <span className={isLatin ? 'etym-origin-roman' : ''}>
                          <Markdown components={{ p: 'span', em: 'span', strong: 'span' }}>{etym.origin}</Markdown>
                        </span>
                        {count > 0 && (
                          <span className="etym-card-count" title={loc.get('etymologies_toponym_count_title')}>
                            {count} {count === 1 ? loc.get('etymologies_topo_singular') : loc.get('etymologies_topo_plural')}
                          </span>
                        )}
                      </div>
                      {etym.meaning && (
                        <div className="etym-card-meaning">
                          <Markdown components={{ p: 'span' }}>{etym.meaning}</Markdown>
                        </div>
                      )}
                      {etym.notes && (
                        <div className="etym-card-notes topo-detail-notes">
                          <Markdown>{etym.notes}</Markdown>
                        </div>
                      )}
                      {refs.length > 0 && (
                        <div className="etym-card-refs">
                          <span className="etym-card-refs-label">{loc.get('etymologies_refs_label')}</span>
                          {refs.map(ref => (
                            <button key={ref.id} className="etym-ref-chip" onClick={() => scrollToEtym(ref.id)}>
                              <Markdown components={{ p: 'span' }}>{ref.origin}</Markdown>
                            </button>
                          ))}
                        </div>
                      )}
                      {tags.length > 0 && (
                        <div className="etym-card-tags">
                          {tags.map(tag => (
                            <span key={tag} className={`tag-chip ${tagCategoryClass(tag)}`}>
                              {loc.get(`tag_${tag}`) || tag.split(':').pop().replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
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
          <h1 className="etym-page-title">{loc.get('etymologies_title')}</h1>
          <div className="etym-count-line">
            {filtered.length} {filtered.length === 1 ? loc.get('etymologies_result_singular') : loc.get('etymologies_result_plural')}
          </div>
        </div>
        <div className="etym-search-row">
          <input
            className="etym-search-input"
            type="search"
            placeholder={loc.get('etymologies_search_placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="etym-scope-toggle">
            <button
              className={`etym-scope-btn${scope === 'all' ? ' active' : ''}`}
              onClick={() => setScope('all')}
            >{loc.get('etymologies_scope_all')}</button>
            <button
              className={`etym-scope-btn${scope === 'etym' ? ' active' : ''}`}
              onClick={() => setScope('etym')}
            >{loc.get('etymologies_scope_etym')}</button>
          </div>
        </div>
      </div>
    </Container>
    </div>
  )
}
