import { useState } from 'react'
import { useTextProjectStore } from './textProjectStore'
import AnnotationView from './AnnotationView'

const EMPTY_PROJ_FORM = () => ({ title: '', year: '', url: '', text: '' })

export default function ScannerView({ repository, startProjectId, onBack }) {
  const projects    = useTextProjectStore(s => s.projects)
  const { saveTextProject, deleteTextProject, newTextProjectId } = useTextProjectStore()

  const initialProj = startProjectId ? projects.find(p => p.id === startProjectId) ?? null : null

  const [subview,    setSubview]    = useState(initialProj ? 'annotate' : 'projects')
  const [projForm,   setProjForm]   = useState(EMPTY_PROJ_FORM)
  const [activeProj, setActiveProj] = useState(initialProj)

  const openProject = (proj) => {
    setActiveProj(proj)
    setSubview('annotate')
  }

  const openEdit = (proj) => {
    setProjForm(proj
      ? { id: proj.id, title: proj.title, year: proj.year, url: proj.url || '', text: proj.text }
      : EMPTY_PROJ_FORM()
    )
    setSubview('edit')
  }

  const saveProject = () => {
    if (!projForm.title.trim()) return
    const id = projForm.id || newTextProjectId()
    const saved = { ...projForm, id, createdAt: projForm.createdAt || new Date().toISOString() }
    saveTextProject(saved)
    if (activeProj?.id === id) setActiveProj(saved)
    setSubview(activeProj ? 'annotate' : 'projects')
  }

  const deleteProject = (id) => {
    deleteTextProject(id)
    if (activeProj?.id === id) { setActiveProj(null); setSubview('projects') }
  }

  // ── Subview: project list ─────────────────────────────────────────────────
  if (subview === 'projects') return (
    <div className="bo-form">
      <div className="bo-scanner-header">
        <h3 className="bo-scanner-title">Textos históricos</h3>
        <p className="bo-scanner-desc">
          Guarda documentos históricos como proyectos para anotar atestiguaciones topónimo a topónimo.
        </p>
      </div>
      <div className="bo-panel-header">
        <button className="bo-btn bo-btn-primary" onClick={() => openEdit(null)}>+ Nuevo texto</button>
        <button className="bo-btn" onClick={onBack}>← Volver</button>
      </div>
      {projects.length === 0 && (
        <p className="bo-empty">Sin textos guardados todavía.</p>
      )}
      <div className="bo-proj-list">
        {projects.map(p => (
          <div key={p.id} className="bo-proj-item">
            <div className="bo-proj-meta">
              <span className="bo-proj-title">{p.title}</span>
              {p.year && <span className="bo-proj-year">{p.year}</span>}
              {p.text && <span className="bo-proj-chars">{p.text.length.toLocaleString()} car.</span>}
            </div>
            <div className="bo-proj-actions">
              <button className="bo-btn bo-btn-primary bo-btn-sm" onClick={() => openProject(p)}>Abrir</button>
              <button className="bo-btn bo-btn-sm" onClick={() => openEdit(p)}>Editar</button>
              <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => deleteProject(p.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Subview: project editor ───────────────────────────────────────────────
  if (subview === 'edit') return (
    <div className="bo-form">
      <h3 className="bo-scanner-title">{projForm.id ? 'Editar texto' : 'Nuevo texto histórico'}</h3>
      <div className="bo-form-section">
        <label className="bo-label">Título / Fuente <span className="bo-required">*</span></label>
        <input className="bo-input" placeholder="p.ej. Catastro de Ensenada, Libro de la Montería…"
          value={projForm.title}
          onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="bo-form-row">
        <div className="bo-form-section">
          <label className="bo-label">Año</label>
          <input className="bo-input" placeholder="1749"
            value={projForm.year}
            onChange={e => setProjForm(f => ({ ...f, year: e.target.value }))} />
        </div>
        <div className="bo-form-section" style={{ flex: 2 }}>
          <label className="bo-label">URL <span className="bo-optional">(opcional)</span></label>
          <input className="bo-input" placeholder="https://…"
            value={projForm.url}
            onChange={e => setProjForm(f => ({ ...f, url: e.target.value }))} />
        </div>
      </div>
      <div className="bo-form-section bo-manual-text-section">
        <label className="bo-label">Texto del documento</label>
        <textarea className="bo-input bo-textarea bo-manual-textarea"
          placeholder="Pega aquí el texto histórico completo…"
          value={projForm.text}
          onChange={e => setProjForm(f => ({ ...f, text: e.target.value }))} />
      </div>
      <div className="bo-form-actions">
        <button className="bo-btn bo-btn-primary" disabled={!projForm.title.trim()} onClick={saveProject}>
          Guardar
        </button>
        <button className="bo-btn" onClick={() => setSubview(activeProj ? 'annotate' : 'projects')}>
          Cancelar
        </button>
      </div>
    </div>
  )

  // ── Subview: annotate ─────────────────────────────────────────────────────
  return (
    <AnnotationView
      activeProj={activeProj}
      repository={repository}
      onBack={() => setSubview('projects')}
      onEditProject={openEdit}
    />
  )
}
