function ModuleSyncStatus({ modules = [] }) {
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
            <span className={`sync-pill-status ${item.syncStatusTone || 'stale'}`}>
              Sync Status: {item.syncStatus || 'UNKNOWN'}
            </span>
            <span className="sync-pill-time">{item.lastSync}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ModuleSyncStatus
