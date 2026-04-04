export default function DraftItem({ draft, onEdit, onDelete }) {
  const typeLabel = { point: 'Puntual', line: 'Lineal', poly: 'Zonal' }[draft.type] || draft.type
  return (
    <div className="bo-draft-item">
      <div className="bo-draft-item-info">
        <span className="bo-draft-name">{draft.name || <em>Sin nombre</em>}</span>
        <span className="bo-draft-meta">
          {draft.draftId} · {typeLabel}
          {draft.hash && <span className="bo-draft-edit-badge">edición</span>}
        </span>
      </div>
      <div className="bo-draft-item-actions">
        <button className="bo-btn bo-btn-sm" onClick={() => onEdit(draft)}>Editar</button>
        <button className="bo-btn bo-btn-sm bo-btn-danger" onClick={() => onDelete(draft.draftId)}>✕</button>
      </div>
    </div>
  )
}
