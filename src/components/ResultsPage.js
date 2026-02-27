import React, { Component } from 'react';

import {Container, Navbar} from 'react-bootstrap';

import {List} from 'react-bootstrap-icons';

import SearchBar from './SearchBar'
import SettingsPopover from './SettingsPopover'
import ResultsMap from './ResultsMap';

import { ROUTE_SEARCH, ROUTE_HOME } from '../resources/routes'

const QUERY_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed']
const MAX_QUERIES = 4

function buildResults(props) {
  if (!props.search || props.search === 'false') {
    return [{ queryString: '', queryResults: props.repository.getFromQueryString('') }]
  }

  if (props.wordId) {
    const singleResult = props.repository.getFromId(props.wordId)
    return [{ queryString: singleResult?.title ?? '', queryResults: singleResult ? [singleResult] : [] }]
  }

  const queryStrings = props.queryStrings || []
  if (queryStrings.length === 0) return [{ queryString: '', queryResults: [] }]
  return queryStrings.map(qs => ({
    queryString: qs,
    queryResults: props.repository.getFromQueryString(qs)
  }))
}

export default class ResultsPage extends Component {
  constructor(props) {
    super(props);
    const initialQueries = buildResults(props)
    const anyQuery = initialQueries.some(q => !!q.queryString)
    this.state = {
      queries: initialQueries.map((q, i) => ({ id: i + 1, ...q, color: QUERY_COLORS[i % QUERY_COLORS.length] })),
      nextId: initialQueries.length + 1,
      showSettings: false,
      hasSearched: anyQuery,
      displayTags: (props.config.resultsTags === 'always') || (props.config.resultsTags === 'search' && anyQuery),
      displayLines: (props.config.resultsTypes.includes('line')),
      displayPolys: (props.config.resultsTypes.includes('poly')),
      displayPoints: (props.config.resultsTypes.includes('point')),
      useRegex: props.config.searchUseRegex
    }
  }

  updateResults(id, newQueryString) {
    this.setState(s => {
      const queries = s.queries.map(q =>
        q.id === id
          ? { ...q, queryString: newQueryString, queryResults: this.props.repository.getFromQueryString(newQueryString, this.props.config.searchUseRegex) }
          : q
      )
      const nonEmpty = queries.filter(q => !!q.queryString)
      if (nonEmpty.length === 0) {
        this.props.history(ROUTE_HOME)
      } else {
        const params = new URLSearchParams()
        nonEmpty.forEach(q => params.append('q', q.queryString))
        this.props.history(`${ROUTE_SEARCH}?${params.toString()}`)
      }
      return {
        queries,
        displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && nonEmpty.length > 0),
        hasSearched: true,
      }
    })
  }

  addQuery() {
    this.setState(s => {
      if (s.queries.length >= MAX_QUERIES) return null
      return {
        queries: [...s.queries, { id: s.nextId, queryString: '', queryResults: [], color: QUERY_COLORS[s.queries.length % QUERY_COLORS.length] }],
        nextId: s.nextId + 1,
        hasSearched: true,
      }
    })
  }

  removeQuery(id) {
    this.setState(s => {
      const queries = s.queries.filter(q => q.id !== id)
      const nonEmpty = queries.filter(q => !!q.queryString)
      if (nonEmpty.length === 0) {
        this.props.history(ROUTE_HOME)
      } else {
        const params = new URLSearchParams()
        nonEmpty.forEach(q => params.append('q', q.queryString))
        this.props.history(`${ROUTE_SEARCH}?${params.toString()}`)
      }
      return {
        queries,
        displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && nonEmpty.length > 0),
      }
    })
  }

  handleMapZoomed() {
    if (!this.state.hasSearched) this.setState({ hasSearched: true })
  }

  handleSettingsUpdated() {
    this.setState({
      displayTags: (this.props.config.resultsTags === 'always') || (this.props.config.resultsTags === 'search' && this.state.queries.some(q => !!q.queryString)),
      displayLines: (this.props.config.resultsTypes.includes('line')),
      displayPolys: (this.props.config.resultsTypes.includes('poly')),
      displayPoints: (this.props.config.resultsTypes.includes('point')),
      useRegex: this.props.config.searchUseRegex
    })
  }

  render() {
    const colorsByHash = new Map()
    this.state.queries.forEach(q => {
      q.queryResults.forEach(r => {
        if (!colorsByHash.has(r.hash)) colorsByHash.set(r.hash, { result: r, colors: [] })
        colorsByHash.get(r.hash).colors.push(q.color)
      })
    })
    const allResults = Array.from(colorsByHash.values()).map(({ result, colors }) => ({
      ...result, colors, color: colors[0],
    }))

    const points = this.state.displayPoints ? allResults.filter(r => r.type === 'point') : []
    const polys  = this.state.displayPolys  ? allResults.filter(r => r.type === 'poly')  : []
    const lines  = this.state.displayLines  ? allResults.filter(r => r.type === 'line')  : []
    const searching = this.state.queries.some(q => !!q.queryString)
    const multiSearch = this.state.queries.length > 1
    const canAddMore = this.state.hasSearched && this.state.queries.length < MAX_QUERIES

    return (
      <Container>
        <Navbar fixed="top" bg="dark" variant="dark">
          <div className="navbar-brand-center">
            <Navbar.Brand>
              <img src={process.env.PUBLIC_URL + '/unicorn.png'} alt={this.props.loc.get("brand_alt")}/>
            </Navbar.Brand>
            <Navbar.Brand className={'main-brand'}>{this.props.loc.get("brand_name")}</Navbar.Brand>
          </div>
          <button
            className="settings-toggle ms-auto"
            onClick={() => this.setState(s => ({showSettings: !s.showSettings}))}
          >
            <List/>
          </button>
        </Navbar>
        {this.state.showSettings && (
          <div className="settings-panel">
            <SettingsPopover
              onSettingsUpdated={this.handleSettingsUpdated.bind(this)}
              config={this.props.config}
              loc={this.props.loc}
            />
          </div>
        )}

        <div className={`search-wrapper${this.state.hasSearched ? '' : ' search-centered'}`}>
          {multiSearch ? (
            <div className="search-row">
              <div className="search-chips-bar">
                {this.state.queries.map((q, i) => (
                  <React.Fragment key={q.id}>
                    {i > 0 && <span className="search-chip-sep">/</span>}
                    <div className={`search-chip${!q.queryString ? ' search-chip--new' : ''}`}>
                      <span className="search-chip-dot" style={{ background: q.color }} />
                      {q.queryString
                        ? <span className="search-chip-text">{q.queryString}</span>
                        : <input
                            autoFocus
                            className="search-chip-input"
                            placeholder={this.props.loc.get("search_placeholder")}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                this.updateResults(q.id, e.target.value.trim())
                              }
                            }}
                          />
                      }
                      <button className="search-chip-remove" onClick={() => this.removeQuery(q.id)}>×</button>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {canAddMore && this.state.queries.every(q => !!q.queryString) && (
                <button className="search-addon-btn" onClick={this.addQuery.bind(this)}>+</button>
              )}
            </div>
          ) : (
            <div className="search-row">
              <SearchBar
                onSearch={newQuery => this.updateResults(this.state.queries[0].id, newQuery)}
                value={this.state.queries[0].queryString}
                color={this.state.hasSearched ? this.state.queries[0].color : undefined}
                tags={this.props.repository.getAllTags()}
                regex={this.state.useRegex}
                config={this.props.config}
                loc={this.props.loc}
              />
              {canAddMore && (
                <button className="search-addon-btn" onClick={this.addQuery.bind(this)}>+</button>
              )}
            </div>
          )}
        </div>

        <ResultsMap points={points} lines={lines} polys={polys} displayTags={this.state.displayTags} loc={this.props.loc} searching={searching} markerSize={this.props.config.markerSize} onZoomed={this.handleMapZoomed.bind(this)}/>
      </Container>
    );
  }
}
