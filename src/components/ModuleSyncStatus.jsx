const modules = [
  { module: 'Stock on hand', status: 'Live', lastSync: 'Last synced 2 hrs ago', tone: 'live' },
  { module: 'Purchase orders', status: 'Live', lastSync: 'Last synced 8 hrs ago', tone: 'live' },
  { module: 'Issue data', status: 'Stale', lastSync: 'Last synced 31 hrs ago', tone: 'stale' },
  { module: 'Receive data', status: 'Critical', lastSync: 'Last synced 9 days ago', tone: 'critical' },
]

function ModuleSyncStatus() {
  return (
    <div className="sync-status">
      <div className="sync-summary">
        <div className="sync-summary-item">
          <span className="sync-summary-dot live" />
          <span>Synced within 24 hrs</span>
        </div>
        <div className="sync-summary-item">
          <span className="sync-summary-dot stale" />
          <span>Slightly overdue (24 hrs+)</span>
        </div>
        <div className="sync-summary-item">
          <span className="sync-summary-dot critical" />
          <span>Critical - no sync in 7+ days</span>
        </div>
      </div>

      {modules.map((item) => (
        <div className="sync-line" key={item.module}>
          <p className="sync-module">{item.module}</p>
          <div className={`sync-pill ${item.tone}`}>
            <span className={`sync-pill-dot ${item.tone}`} />
            <span className="sync-pill-label">{item.status}</span>
            <span className="sync-pill-time">{item.lastSync}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ModuleSyncStatus
