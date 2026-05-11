import { LayoutGrid } from 'lucide-react'

const navItems = [
  { key: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
  { key: 'issues', label: 'Issues', icon: <LayoutGrid size={16} /> },
  { key: 'receives', label: 'Receives', icon: <LayoutGrid size={16} /> },
]

function Sidebar({ activePage, onNavigate, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">F</div>
        <div>
          <p className="brand-title">FANOS</p>
          <p className="brand-subtitle">Metadata dashboard</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className={`sidebar-item ${activePage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <p>Ethiopian Pharmaceutical</p>
        <p>Supply Service</p>
      </footer>
    </aside>
  )
}

export default Sidebar
