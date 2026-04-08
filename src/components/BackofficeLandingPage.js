import { useNavigate } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'
import { getDrafts } from '../model/draftStore'
import { ROUTE_HOME, ROUTE_BACKOFFICE_EDITOR } from '../resources/routes'

const VIEW_URLS = {
  etymologies: 'etymologies',
  toponyms:    'toponyms',
  scanner:     'scanner',
  manual:      'link',
  ngbe:        'import',
}

function StatCard({ value, label }) {
  return (
    <div className="bol-stat">
      <span className="bol-stat-value">{value}</span>
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

export default function BackofficeLandingPage({ repository, etymologyStore }) {
  const navigate = useNavigate()
  const drafts   = getDrafts()

  const go = (startView) => VIEW_URLS[startView]
    ? navigate(`${ROUTE_BACKOFFICE_EDITOR}/${VIEW_URLS[startView]}`)
    : navigate(ROUTE_BACKOFFICE_EDITOR, { state: { startView } })

  // ── Stats ──────────────────────────────────────────────────────────────────
  const entries    = repository?.getAllEntries() || []
  const total      = entries.length
  const withEtym   = entries.filter(e => e.etymology_ids?.length).length
  const withAtt    = entries.filter(e => e.attestations?.length).length
  const withNotes  = entries.filter(e => e.notes).length
  const totalEtyms = etymologyStore?.byId?.size ?? 0

  return (
    <div className="bol-layout">
      <Navbar fixed="top" bg="dark" variant="dark" className="bo-navbar">
        <button className="bo-back-btn" onClick={() => navigate(ROUTE_HOME)}>←</button>
        <Navbar.Brand className="bo-brand">Editor</Navbar.Brand>
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
              icon="+"
              title="Nuevo topónimo"
              desc="Crea una entrada nueva marcando su posición en el mapa"
              onClick={() => go('new')}
            />
            <ActionCard
              icon="↓"
              title="Importar NGBE"
              desc="Importa topónimos del sistema cartográfico con sus coordenadas GPS"
              onClick={() => go('ngbe')}
            />
            <ActionCard
              icon="∴"
              title="Etimologías"
              desc="Crea o edita entradas etimológicas reutilizables"
              onClick={() => go('etymologies')}
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
            <StatCard value={total}      label="topónimos" />
            <StatCard value={withEtym}   label="con etimología" />
            <StatCard value={withAtt}    label="con atestaciones" />
            <StatCard value={withNotes}  label="con notas" />
            <StatCard value={totalEtyms} label="etimologías" />
          </div>
        </section>

        {/* ── Drafts ── */}
        <section className="bol-section">
          <h2 className="bol-section-title">
            Borradores pendientes
            {drafts.length > 0 && <span className="bol-draft-count">{drafts.length}</span>}
          </h2>
          {drafts.length === 0 ? (
            <p className="bol-empty">Sin borradores guardados.</p>
          ) : (
            <div className="bol-draft-list">
              {drafts.map(d => (
                <button key={d.draftId} className="bol-draft-item" onClick={() => go('list')}>
                  <span className="bol-draft-name">{d.name || <em>Sin nombre</em>}</span>
                  <span className="bol-draft-meta">
                    {d.hash ? 'edición' : 'nuevo'} · {d.attestations?.length ?? 0} atestaciones
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
