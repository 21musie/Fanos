import { BarChart3, Building, Database, FileText, LayoutGrid, Settings } from 'lucide-react'

const navItems = [
  { key: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
  { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { key: 'data-sources', label: 'Data metadata & status', icon: <Database size={16} /> },
  { key: 'facilities', label: 'Facilities', icon: <Building size={16} /> },
  { key: 'reports', label: 'Reports', icon: <FileText size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
]

function Sidebar({ activePage, onNavigate, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">F</div>
        <div>
          <p className="brand-title">fanos</p>
          <p className="brand-subtitle">Data dashboard</p>
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
