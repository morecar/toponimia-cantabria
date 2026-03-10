import SettingsPopover from './SettingsPopover'

export default function SettingsPanel({ loc, config, onSettingsUpdated, onClose, onNavigate }) {
  return (
    <div className="settings-side-panel">
      <div className="settings-side-inner">
        <button className="topo-detail-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h2 className="settings-side-title">{loc.get('nav_settings')}</h2>
        <SettingsPopover config={config} loc={loc} onSettingsUpdated={onSettingsUpdated} />
      </div>
      <div className="settings-side-footer">
        <span className="settings-author">
          Creado por <a href="https://github.com/morecar" target="_blank" rel="noopener noreferrer" className="settings-author-link">morecar</a>
          {' | '}
          <a href="/toponimia-cantabria/about" className="settings-author-link">Sobre el proyecto</a>
        </span>
      </div>
    </div>
  )
}
