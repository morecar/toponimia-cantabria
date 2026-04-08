import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import { getDrafts, getDraftEtymologies } from '../model/draftStore'
import { getTextProjects } from './backoffice/textProjectStore'
import {
  trySilentAuth, syncFromDrive, requestAuth, isAuthenticated, disconnect,
} from '../model/driveSync'
import { ROUTE_HOME, ROUTE_BACKOFFICE_EDITOR } from '../resources/routes'

const VIEW_URLS = {
  etymologies: 'etymologies',
  toponyms:    'toponyms',
  scanner:     'scanner',
  manual:      'link',
  ngbe:        'import',
}

function StatCard({ value, label, added, removed }) {
  const hasDelta = (added > 0) || (removed > 0)
  return (
    <div className="bol-stat">
      <span className="bol-stat-value">
        {value}
        {hasDelta && (
          <span className="bol-stat-delta">
            {added   > 0 && <span className="bol-stat-added">+{added}</span>}
            {removed > 0 && <span className="bol-stat-removed">−{removed}</span>}
          </span>
        )}
      </span>
      <span className="bol-stat-label">{label}</span>
    </div>
  )
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button className="bol-action" onClick={onClick}>
      <span className="bol-action-icon">{icon}</span>
      <span className="bol-action-title">{title}</span>
      <span className="bol-action-desc">{desc}</span>
    </button>
  )
}

// sync status: 'idle' | 'syncing' | 'synced' | 'offline' | 'no-config'
function DriveIndicator({ status, onConnect, onDisconnect }) {
  const hasClientId = !!process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID
  if (!hasClientId) return null
  if (status === 'no-config') return null

  const dots = {
    idle:     { color: '#6c757d', title: 'Drive: no conectado' },
    syncing:  { color: '#f59e0b', title: 'Sincronizando…' },
    synced:   { color: '#16a34a', title: 'Drive sincronizado' },
    offline:  { color: '#dc2626', title: 'Sin conexión — trabajando offline' },
  }
  const dot = dots[status] || dots.idle

  return (
    <div className="bol-drive-indicator">
      <span className="bol-drive-dot" style={{ background: dot.color }} title={dot.title} />
      <span className="bol-drive-label">{dot.title}</span>
      {status === 'idle'   && <button className="bol-drive-btn" onClick={onConnect}>Conectar</button>}
      {status === 'synced' && <button className="bol-drive-btn bol-drive-btn--ghost" onClick={onDisconnect}>Desconectar</button>}
    </div>
  )
}

export default function BackofficeLandingPage({ repository, etymologyStore }) {
  const navigate = useNavigate()
  const [syncStatus,  setSyncStatus]  = useState('idle')
  const [refreshKey,  setRefreshKey]  = useState(0)  // bump to force re-read from localStorage

  const drafts       = getDrafts()       // re-read on every render (fast, sync)
  const textProjects = getTextProjects()

  const go = (startView) => VIEW_URLS[startView]
    ? navigate(`${ROUTE_BACKOFFICE_EDITOR}/${VIEW_URLS[startView]}`)
    : navigate(ROUTE_BACKOFFICE_EDITOR, { state: { startView } })

  const doSync = useCallback(async () => {
    setSyncStatus('syncing')
    const loaded = await syncFromDrive()
    setSyncStatus('synced')
    if (loaded) setRefreshKey(k => k + 1)
  }, [])

  // On mount: try silent auth then sync from Drive
  useEffect(() => {
    if (!process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID) { setSyncStatus('no-config'); return }
    if (!navigator.onLine) { setSyncStatus('offline'); return }
    if (isAuthenticated()) { doSync(); return }
    trySilentAuth().then(ok => {
      if (ok) doSync()
      else setSyncStatus(navigator.onLine ? 'idle' : 'offline')
    })
  }, [doSync])

  // Track online/offline
  useEffect(() => {
    const goOffline = () => setSyncStatus(s => s === 'synced' ? 'offline' : s)
    const goOnline  = () => {
      if (isAuthenticated()) doSync()
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [doSync])

  const handleConnect = async () => {
    setSyncStatus('syncing')
    const ok = await requestAuth()
    if (ok) doSync()
    else setSyncStatus('idle')
  }

  const handleDisconnect = () => {
    disconnect()
    setSyncStatus('idle')
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const entries    = repository?.getAllEntries() || []
  const total      = entries.length
  const withEtym   = entries.filter(e => e.etymology_ids?.length).length
  const withAtt    = entries.filter(e => e.attestations?.length).length
  const withNotes  = entries.filter(e => e.notes).length
  const totalEtyms = etymologyStore?.byId?.size ?? 0

  // Draft deltas
  const draftEtyms       = getDraftEtymologies()
  const newTopos         = drafts.filter(d => !d.hash && !d.deleted).length
  const deletedTopos     = drafts.filter(d =>  d.deleted).length
  const newEtyms         = draftEtyms.filter(e => !e.deleted && !(etymologyStore?.byId?.has(e.id))).length
  const deletedEtyms     = draftEtyms.filter(e =>  e.deleted).length
  const totalChanges     = drafts.length + draftEtyms.length

  return (
    <div className="bol-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_HOME)}>←</button>
        <Navbar.Brand className="bo-brand">Editor</Navbar.Brand>
        <DriveIndicator status={syncStatus} onConnect={handleConnect} onDisconnect={handleDisconnect} />
      </Navbar>

      <div className="bol-body">

        {/* ── Actions ── */}
        <section className="bol-section">
          <div className="bol-actions">
            <ActionCard
              icon="☰"
              title="Topónimos"
              desc="Lista, edita o borra topónimos del índice y gestiona borradores"
              onClick={() => go('toponyms')}
            />
            <ActionCard
              icon="∴"
              title="Etimologías"
              desc="Crea o edita entradas etimológicas reutilizables"
              onClick={() => go('etymologies')}
            />
          </div>
          <div className="bol-actions bol-actions--3">
            <ActionCard
              icon="↓"
              title="Importar NGBE"
              desc="Importa topónimos del sistema cartográfico con sus coordenadas GPS"
              onClick={() => go('ngbe')}
            />
            <ActionCard
              icon="⌕"
              title="Escanear texto"
              desc="Pega un documento histórico y asigna citas a los topónimos detectados"
              onClick={() => go('scanner')}
            />
            <ActionCard
              icon="✎"
              title="Enlazar citas"
              desc="Selecciona fragmentos de un texto histórico y vincúlalos a topónimos"
              onClick={() => go('manual')}
            />
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bol-section">
          <h2 className="bol-section-title">Índice</h2>
          <div className="bol-stats">
            <StatCard value={total}      label="topónimos"  added={newTopos}   removed={deletedTopos} />
            <StatCard value={totalEtyms} label="etimologías" added={newEtyms}  removed={deletedEtyms} />
            <div className="bol-stats-divider" />
            <StatCard value={withEtym}   label="con etimología" />
            <StatCard value={withAtt}    label="con atestaciones" />
            <StatCard value={withNotes}  label="con notas" />
          </div>
        </section>

        {/* ── Text projects ── */}
        {textProjects.length > 0 && (
          <section className="bol-section">
            <h2 className="bol-section-title">Textos históricos</h2>
            <div className="bol-draft-list">
              {textProjects.map(p => (
                <button key={p.id} className="bol-draft-item"
                  onClick={() => navigate(`${ROUTE_BACKOFFICE_EDITOR}/scanner`, { state: { startProjectId: p.id } })}>
                  <span className="bol-draft-name">{p.title}</span>
                  <span className="bol-draft-meta">
                    {p.year && `${p.year} · `}{p.text ? `${p.text.length.toLocaleString()} car.` : 'sin texto'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Pending changes ── */}
        <section className="bol-section" key={refreshKey}>
          <h2 className="bol-section-title">
            Cambios pendientes
            {totalChanges > 0 && <span className="bol-draft-count">{totalChanges}</span>}
          </h2>
          {totalChanges === 0 ? (
            <p className="bol-empty">Sin cambios pendientes.</p>
          ) : (
            <div className="bol-draft-list">
              {drafts.map(d => {
                const mod = d.deleted ? 'deleted' : !d.hash ? 'new' : null
                return (
                  <button key={d.draftId}
                    className={`bol-draft-item${mod ? ` bol-draft-item--${mod}` : ''}`}
                    onClick={() => navigate(`${ROUTE_BACKOFFICE_EDITOR}/toponyms`)}>
                    <span className="bol-draft-name">{d.name || <em>Sin nombre</em>}</span>
                    <span className="bol-draft-meta">
                      topónimo · {d.deleted ? 'borrado' : d.hash ? 'edición' : 'nuevo'}
                      {!d.deleted && ` · ${d.attestations?.length ?? 0} atestaciones`}
                    </span>
                  </button>
                )
              })}
              {draftEtyms.map(e => {
                const isNew = !etymologyStore?.byId?.has(e.id)
                const mod = e.deleted ? 'deleted' : isNew ? 'new' : null
                return (
                  <button key={e.id}
                    className={`bol-draft-item${mod ? ` bol-draft-item--${mod}` : ''}`}
                    onClick={() => navigate(`${ROUTE_BACKOFFICE_EDITOR}/etymologies`)}>
                    <span className="bol-draft-name">{e.origin || e.id}</span>
                    <span className="bol-draft-meta">
                      etimología · {e.deleted ? 'borrada' : isNew ? 'nueva' : 'edición'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
