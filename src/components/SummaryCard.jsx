function SummaryCard({ label, value, subtitle, icon, slideKey = 'static' }) {
  return (
    <article className="summary-card">
      <div key={slideKey} className="summary-card-slide">
        <div className="summary-header">
          <p>{label}</p>
          {icon}
        </div>
        <h3>{value}</h3>
        <p className="summary-subtitle">{subtitle}</p>
      </div>
    </article>
  )
}

export default SummaryCard
