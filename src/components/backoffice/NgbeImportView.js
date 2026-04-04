import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { saveDraft, newDraftId } from '../../model/draftStore'
import { NGBE_URL, NGBE_GROUP_LABELS, NGBE_CAT_LABELS } from './constants'
import { fetchOsmGeometry, OSM_GEO } from './osmUtils'
import EtymologySelector from './EtymologySelector'

export default function NgbeImportView({
  repository, etymologyStore, drafts, refreshDrafts, onBack, onMapSync,
}) {
  const [ngbeQuery,      setNgbeQuery]      = useState('')
  const [ngbeResults,    setNgbeResults]    = useState([])
  const [ngbeLoading,    setNgbeLoading]    = useState(false)
  const [ngbeCategories, setNgbeCategories] = useState([])
  const [ngbeSelected,   setNgbeSelected]   = useState(new Set())
  const [ngbeStep,       setNgbeStep]       = useState(1)
  const [ngbeEtymId,     setNgbeEtymId]     = useState(null)
  const [ngbeCodeFilter, setNgbeCodeFilter] = useState(new Set())
  const [ngbeGroupsOpen, setNgbeGroupsOpen] = useState(new Set())
  const [ngbeImporting,  setNgbeImporting]  = useState(false)
  const [ngbeOsmCache,   setNgbeOsmCache]   = useState({})
  const ngbeGeomQueue = useRef(Promise.resolve())

  const existingNames = useMemo(() => new Set([
    ...(repository?.getAllEntries() || []).map(e => e.title?.toLowerCase()),
    ...drafts.map(d => d.name?.toLowerCase()),
  ]), [repository, drafts])

  const ngbeVisible = useMemo(
    () => ngbeCodeFilter.size === 0 ? ngbeResults : ngbeResults.filter(e => ngbeCodeFilter.has(e.cat)),
    [ngbeCodeFilter, ngbeResults]
  )

  const toggleNgbeItem = useCallback((id) => {
    setNgbeSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Sync map-relevant state to parent so BackofficeMap gets updated
  useEffect(() => {
    onMapSync?.({ step: ngbeStep, results: ngbeResults, visible: ngbeVisible, selected: ngbeSelected, osmCache: ngbeOsmCache, toggleItem: toggleNgbeItem })
  }, [ngbeStep, ngbeResults, ngbeVisible, ngbeSelected, ngbeOsmCache, toggleNgbeItem, onMapSync])

  // Fetch available categories on mount
  useEffect(() => {
    const stats = encodeURIComponent(JSON.stringify([{ statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'n' }]))
    const params = `f=json&where=1%3D1&outFields=CLASIFICACION_SECUNDARIA&returnGeometry=false&groupByFieldsForStatistics=CLASIFICACION_SECUNDARIA&outStatistics=${stats}&orderByFields=CLASIFICACION_SECUNDARIA`
    fetch(`${NGBE_URL}?${params}`)
      .then(r => r.json())
      .then(data => {
        const cats = (data.features || []).map(f => ({
          code:  f.attributes.CLASIFICACION_SECUNDARIA,
          label: NGBE_CAT_LABELS[f.attributes.CLASIFICACION_SECUNDARIA] || f.attributes.CLASIFICACION_SECUNDARIA,
          count: f.attributes.n,
        })).sort((a, b) => a.code.localeCompare(b.code))
        setNgbeCategories(cats)
      })
      .catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    const q = ngbeQuery.trim()
    if (q.length < 2) { setNgbeResults([]); return }
    const timer = setTimeout(() => {
      setNgbeLoading(true)
      const where = encodeURIComponent(`UPPER(IDENTIFICADOR_GEOGRAFICO) LIKE UPPER('${q.replace(/'/g, "''")}%')`)
      const params = `f=json&where=${where}&outFields=OBJECTID,IDENTIFICADOR_GEOGRAFICO,MUNICIPIO,CODIGO_NGBE,CLASIFICACION_SECUNDARIA&returnGeometry=true&outSR=4326&resultRecordCount=150&orderByFields=IDENTIFICADOR_GEOGRAFICO+ASC`
      fetch(`${NGBE_URL}?${params}`)
        .then(r => r.json())
        .then(data => {
          setNgbeResults((data.features || []).map(f => ({
            id:   f.attributes.OBJECTID,
            name: f.attributes.IDENTIFICADOR_GEOGRAFICO,
            lat:  f.geometry?.y ? parseFloat(f.geometry.y.toFixed(6)) : null,
            lng:  f.geometry?.x ? parseFloat(f.geometry.x.toFixed(6)) : null,
            mun:  f.attributes.MUNICIPIO ?? '',
            code: f.attributes.CODIGO_NGBE ?? '',
            cat:  f.attributes.CLASIFICACION_SECUNDARIA ?? '',
          })).filter(e => e.lat && e.lng))
        })
        .catch(() => setNgbeResults([]))
        .finally(() => setNgbeLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [ngbeQuery])

  // Clear OSM geometry cache when search results change
  useEffect(() => { setNgbeOsmCache({}) }, [ngbeResults])

  const toggleNgbeCode = (code) => {
    setNgbeCodeFilter(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const toggleAllNgbe = () => {
    if (ngbeSelected.size === ngbeVisible.length) setNgbeSelected(new Set())
    else setNgbeSelected(new Set(ngbeVisible.map(e => e.id)))
  }

  const enterGeomStep = () => {
    const withGeom = ngbeResults
      .filter(e => ngbeSelected.has(e.id) && OSM_GEO[e.cat] && OSM_GEO[e.cat].type !== 'point')

    if (withGeom.length === 0) {
      setNgbeStep(3)
      return
    }

    const initial = {}
    withGeom.forEach(e => { initial[e.id] = 'loading' })
    setNgbeOsmCache(initial)
    setNgbeStep(2)
    ngbeGeomQueue.current = Promise.resolve()

    withGeom.forEach(entry => {
      ngbeGeomQueue.current = ngbeGeomQueue.current
        .then(() => fetchOsmGeometry(entry.name, entry.cat))
        .then(geom => {
          console.log('[OSM geom]', entry.name, entry.cat, geom ? `${geom.coordinates.length} pts` : 'null')
          setNgbeOsmCache(p => ({ ...p, [entry.id]: geom }))
        })
        .catch(err => {
          console.warn('[OSM geom] error', entry.name, err)
          setNgbeOsmCache(p => ({ ...p, [entry.id]: null }))
        })
    })
  }

  const importNgbeSelected = async () => {
    const selected = ngbeResults.filter(e => ngbeSelected.has(e.id))
    setNgbeImporting(true)
    await new Promise(r => setTimeout(r, 0))
    try {
      const geoResults = await Promise.all(selected.map(e => fetchOsmGeometry(e.name, e.cat)))
      selected.forEach((entry, i) => {
        const osm = geoResults[i]
        saveDraft({
          draftId:       newDraftId(),
          hash:          null,
          name:          entry.name,
          vernacular:    '',
          type:          osm?.type ?? 'point',
          coordinates:   osm?.coordinates ?? [[entry.lat, entry.lng]],
          tags:          [],
          attestations:  [],
          etymology_ids: ngbeEtymId ? [ngbeEtymId] : [],
          notes:         osm ? 'Geometría importada desde OpenStreetMap.' : '',
        })
      })
      refreshDrafts()
      onBack()
    } finally {
      setNgbeImporting(false)
    }
  }

  return (
    <div className="bo-form">
      <div className="bo-scanner-header">
        <h3 className="bo-scanner-title">Importar del NGBE</h3>
        <p className="bo-scanner-desc">
          Busca topónimos en la base cartográfica por prefijo y selecciona los que quieres importar.
        </p>
      </div>

      <div className="bo-wizard-steps">
        <span className={`bo-wizard-step${ngbeStep === 1 ? ' active' : ''}`}>1 Seleccionar</span>
        <span className="bo-wizard-arrow">→</span>
        <span className={`bo-wizard-step${ngbeStep === 2 ? ' active' : ''}`}>2 Geometría</span>
        <span className="bo-wizard-arrow">→</span>
        <span className={`bo-wizard-step${ngbeStep === 3 ? ' active' : ''}`}>3 Etimología</span>
      </div>

      {/* ── Step 1: search + select ── */}
      {ngbeStep === 1 && (
        <>
          <div className="bo-form-section">
            <label className="bo-label">Buscar por prefijo</label>
            <input
              className="bo-input"
              placeholder="Llan, Val, San, Río…"
              value={ngbeQuery}
              onChange={e => setNgbeQuery(e.target.value)}
              autoFocus
            />
          </div>

          {ngbeCategories.length > 0 && (() => {
            const groups = {}
            ngbeCategories.forEach(cat => {
              const g = cat.code.split('.')[0]
              if (!groups[g]) groups[g] = []
              groups[g].push(cat)
            })
            const toggleGroup = (g) => setNgbeGroupsOpen(prev => {
              const next = new Set(prev)
              next.has(g) ? next.delete(g) : next.add(g)
              return next
            })
            return (
              <div style={{ marginBottom: '0.6rem' }}>
                {Object.entries(groups).map(([g, cats]) => {
                  const open = ngbeGroupsOpen.has(g)
                  const activeInGroup = cats.filter(c => ngbeCodeFilter.has(c.code)).length
                  return (
                    <div key={g} className="bo-ngbe-filter-group">
                      <button className="bo-ngbe-filter-group-toggle" onClick={() => toggleGroup(g)}>
                        <span className="bo-ngbe-filter-group-arrow">{open ? '▾' : '▸'}</span>
                        <span className="bo-ngbe-filter-group-label">{NGBE_GROUP_LABELS[g] || `Grupo ${g}`}</span>
                        {activeInGroup > 0 && (
                          <span className="bo-ngbe-filter-group-active">{activeInGroup} seleccionado{activeInGroup !== 1 ? 's' : ''}</span>
                        )}
                      </button>
                      {open && (
                        <div className="bo-ngbe-filters">
                          {cats.map(({ code, label, count }) => (
                            <button
                              key={code}
                              className={`bo-ngbe-filter-chip${ngbeCodeFilter.size === 0 || ngbeCodeFilter.has(code) ? ' active' : ''}`}
                              onClick={() => toggleNgbeCode(code)}
                            >
                              {label} <span className="bo-ngbe-filter-count">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {ngbeLoading && <p className="bo-empty">Buscando…</p>}

          {!ngbeLoading && ngbeVisible.length > 0 && (
            <div className="bo-ngbe-results">
              <div className="bo-ngbe-results-header">
                <span>{ngbeVisible.length} resultado{ngbeVisible.length !== 1 ? 's' : ''}{ngbeResults.length > ngbeVisible.length ? ` (${ngbeResults.length} total)` : ''}</span>
                <button className="bo-btn bo-btn-sm" onClick={toggleAllNgbe}>
                  {ngbeSelected.size === ngbeVisible.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
              {ngbeVisible.map(e => {
                const alreadyExists = existingNames.has(e.name.toLowerCase())
                return (
                  <label key={e.id} className={`bo-ngbe-item${ngbeSelected.has(e.id) ? ' selected' : ''}${alreadyExists ? ' exists' : ''}`}>
                    <input type="checkbox" checked={ngbeSelected.has(e.id)}
                      onChange={() => toggleNgbeItem(e.id)} />
                    <span className="bo-ngbe-name">{e.name}</span>
                    {alreadyExists && <span className="bo-ngbe-exists-badge">ya importado</span>}
                    <span className="bo-ngbe-mun">{NGBE_CAT_LABELS[e.cat] || e.cat}</span>
                  </label>
                )
              })}
            </div>
          )}

          {!ngbeLoading && ngbeQuery.trim().length >= 2 && ngbeVisible.length === 0 && (
            <p className="bo-empty">Sin resultados para "{ngbeQuery}".</p>
          )}

          <div className="bo-scanner-actions">
            <button className="bo-btn bo-btn-primary"
              disabled={ngbeSelected.size === 0}
              onClick={enterGeomStep}>
              {`Siguiente → (${ngbeSelected.size})`}
            </button>
            <button className="bo-btn" onClick={onBack}>Cancelar</button>
          </div>
        </>
      )}

      {/* ── Step 2: geometry loading ── */}
      {ngbeStep === 2 && (() => {
        const geomEntries = ngbeResults.filter(e => ngbeSelected.has(e.id) && e.id in ngbeOsmCache)
        const allDone = geomEntries.every(e => ngbeOsmCache[e.id] !== 'loading')
        return (
          <>
            <div className="bo-form-section">
              <label className="bo-label">
                {allDone ? 'Geometría cargada' : 'Cargando geometría…'}
              </label>
              <div className="bo-ngbe-geom-list">
                {geomEntries.map(e => {
                  const state = ngbeOsmCache[e.id]
                  return (
                    <div key={e.id} className={`bo-ngbe-geom-row${state === 'loading' ? ' loading' : state ? ' found' : ''}`}>
                      <span className="bo-ngbe-geom-status">
                        {state === 'loading' ? '⟳' : state ? '✓' : '–'}
                      </span>
                      <span className="bo-ngbe-name">{e.name}</span>
                      <span className="bo-ngbe-mun">{NGBE_CAT_LABELS[e.cat] || e.cat}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bo-scanner-actions">
              <button className="bo-btn bo-btn-primary"
                disabled={!allDone}
                onClick={() => setNgbeStep(3)}>
                {allDone ? 'Siguiente →' : 'Esperando…'}
              </button>
              <button className="bo-btn" onClick={() => { setNgbeOsmCache({}); setNgbeStep(1) }}>← Atrás</button>
            </div>
          </>
        )
      })()}

      {/* ── Step 3: assign etymology ── */}
      {ngbeStep === 3 && (
        <>
          <div className="bo-form-section">
            <label className="bo-label">Topónimos seleccionados ({ngbeSelected.size})</label>
            <div className="bo-ngbe-selected-list">
              {ngbeResults.filter(e => ngbeSelected.has(e.id)).map(e => (
                <span key={e.id} className="bo-ngbe-selected-chip">{e.name}</span>
              ))}
            </div>
          </div>

          <div className="bo-form-section">
            <label className="bo-label">Etimología <span className="bo-optional">(opcional)</span></label>
            <p className="bo-form-hint">Puedes vincular todos los topónimos importados a una etimología existente.</p>
            <EtymologySelector
              etymology_ids={ngbeEtymId ? [ngbeEtymId] : []}
              etymologyStore={etymologyStore}
              onChange={ids => setNgbeEtymId(ids[ids.length - 1] ?? null)}
            />
          </div>

          <div className="bo-scanner-actions">
            <button className="bo-btn bo-btn-primary"
              disabled={ngbeImporting} onClick={importNgbeSelected}>
              {ngbeImporting
                ? 'Obteniendo geometría OSM…'
                : `↓ Importar ${ngbeSelected.size} topónimo${ngbeSelected.size !== 1 ? 's' : ''}`}
            </button>
            <button className="bo-btn" disabled={ngbeImporting}
              onClick={() => setNgbeStep(Object.keys(ngbeOsmCache).length > 0 ? 2 : 1)}>
              ← Atrás
            </button>
          </div>
          {!ngbeImporting && (
            <p className="bo-form-hint" style={{ marginTop: '0.4rem' }}>
              Para ríos, playas y embalses se buscará la geometría real en OpenStreetMap automáticamente.
            </p>
          )}
        </>
      )}
    </div>
  )
}
