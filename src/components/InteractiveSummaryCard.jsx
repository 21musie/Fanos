import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function InteractiveSummaryCard({ title, icon, slides = [], loading }) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    setIndex((current) => (slides.length === 0 ? 0 : Math.min(current, slides.length - 1)))
  }, [slides])

  const showLoader = Boolean(loading) && slides.length === 0

  const canNav = !showLoader && slides.length > 1

  const prev = (e) => {
    e.stopPropagation()
    setIndex((current) => (current - 1 + slides.length) % slides.length)
  }

  const next = (e) => {
    e.stopPropagation()
    setIndex((current) => (current + 1) % slides.length)
  }

  const activeSlide = slides[index]
  const total = slides[0]
  const breakdown = slides.slice(1)

  const formatNum = (n) => {
    const num = Number(n)
    if (!Number.isFinite(num)) return String(n)
    return num.toLocaleString()
  }

  const displayValue = showLoader
    ? <span className="metric-loader" aria-label="Loading metric" />
    : activeSlide
      ? formatNum(activeSlide.value)
      : '—'

  const displaySubtitle = showLoader ? '' : activeSlide?.type ?? ''

  return (
    <article
      className="summary-card isc-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="summary-header">
        <p>{title}</p>
        {icon}
      </div>

      <h3>{displayValue}</h3>
      <p className="summary-subtitle">{displaySubtitle}</p>

      {canNav && (
        <>
          <button
            type="button"
            className={`isc-nav isc-nav-left ${hovered ? 'visible' : ''}`}
            onClick={prev}
            aria-label="Previous"
          >
            <ChevronLeft size={18} strokeWidth={1.85} />
          </button>
          <button
            type="button"
            className={`isc-nav isc-nav-right ${hovered ? 'visible' : ''}`}
            onClick={next}
            aria-label="Next"
          >
            <ChevronRight size={18} strokeWidth={1.85} />
          </button>
        </>
      )}

      {hovered && !showLoader && slides.length > 0 && (
        <div className="isc-popover">
          {total && (
            <div className="isc-popover-total">
              <span className="isc-popover-label">Total</span>
              <span className="isc-popover-value">{formatNum(total.value)}</span>
            </div>
          )}
          {breakdown.length > 0 && (
            <>
              <div className="isc-popover-divider" />
              <ul className="isc-popover-list">
                {breakdown.map((row) => (
                  <li key={row.type} className="isc-popover-row">
                    <span className="isc-popover-row-label">{row.type}</span>
                    <span className="isc-popover-row-value">{formatNum(row.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </article>
  )
}

export default InteractiveSummaryCard
