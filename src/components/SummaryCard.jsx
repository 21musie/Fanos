function SummaryCard({ label, value, subtitle, icon }) {
  return (
    <article className="summary-card">
      <div className="summary-header">
        <p>{label}</p>
        {icon}
      </div>
      <h3>{value}</h3>
      <p className="summary-subtitle">{subtitle}</p>
    </article>
  )
}

export default SummaryCard
