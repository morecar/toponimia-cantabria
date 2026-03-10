export default function NavMenu({ loc, onClose, onNavigate, onOpenSettings }) {
  return (
    <>
      <div className="nav-menu-backdrop" onClick={onClose} />
      <div className="nav-menu">
        <nav className="nav-menu-items">
          <button className="nav-menu-item" onClick={() => { onNavigate('etymologies'); onClose() }}>
            {loc.get('nav_etymologies')}
            <span className="nav-menu-chevron">›</span>
          </button>
          <button className="nav-menu-item" onClick={() => { onNavigate('toponyms'); onClose() }}>
            {loc.get('nav_toponyms')}
            <span className="nav-menu-chevron">›</span>
          </button>
          <button className="nav-menu-item" onClick={() => { onOpenSettings(); onClose() }}>
            {loc.get('nav_settings')}
            <span className="nav-menu-chevron">›</span>
          </button>
        </nav>
      </div>
    </>
  )
}
