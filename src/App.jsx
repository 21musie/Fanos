import { useEffect, useState } from 'react'
import {
  Activity,
  Building2,
  Calendar,
  Database,
  Menu,
  X,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import SummaryCard from './components/SummaryCard'
import DataSourceCoverageChart from './components/DataSourceCoverageChart'
import ModuleSyncStatus from './components/ModuleSyncStatus'
import HubMapCard from './components/HubMapCard'
import ModuleTransactionDonut from './components/ModuleTransactionDonut'
import TransactionVolumeChart from './components/TransactionVolumeChart'
import { apiUrl } from './config'
import './App.css'

const defaultModuleTransactionData = [
  { name: 'Issues', value: 2100000, color: '#7DBB7D' },
  { name: 'Receive', value: 1850000, color: '#6FA8DC' },
  { name: 'Purchase Orders', value: 1420000, color: '#F4A261' },
  { name: 'SOH snapshots', value: 450000, color: '#B39DDB' },
  { name: 'Avg. consumption', value: 380000, color: '#F6B26B' },
]

const defaultTransactionVolumeData = [
  { year: '2015', Issues: 80000, Receive: 75000, 'Purchase Orders': 45000, 'SOH snapshots': 12000 },
  { year: '2016', Issues: 95000, Receive: 88000, 'Purchase Orders': 52000, 'SOH snapshots': 15000 },
  { year: '2017', Issues: 110000, Receive: 105000, 'Purchase Orders': 62000, 'SOH snapshots': 18000 },
  { year: '2018', Issues: 145000, Receive: 138000, 'Purchase Orders': 78000, 'SOH snapshots': 22000 },
  { year: '2019', Issues: 180000, Receive: 165000, 'Purchase Orders': 95000, 'SOH snapshots': 28000 },
  { year: '2020', Issues: 95000, Receive: 82000, 'Purchase Orders': 48000, 'SOH snapshots': 15000 },
  { year: '2021', Issues: 195000, Receive: 185000, 'Purchase Orders': 105000, 'SOH snapshots': 32000 },
  { year: '2022', Issues: 225000, Receive: 210000, 'Purchase Orders': 125000, 'SOH snapshots': 38000 },
  { year: '2023', Issues: 250000, Receive: 235000, 'Purchase Orders': 142000, 'SOH snapshots': 42000 },
  { year: '2024', Issues: 275000, Receive: 258000, 'Purchase Orders': 158000, 'SOH snapshots': 48000 },
  { year: '2025', Issues: 285000, Receive: 268000, 'Purchase Orders': 165000, 'SOH snapshots': 52000 },
]

const formatYAxis = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${Math.round(value / 1000)}K`
  return value.toString()
}

const CustomLegend = () => {
  const legendItems = [
    { label: 'Issues', color: '#F4A261' },
    { label: 'Receive', color: '#6FA8DC' },
    { label: 'Purchase Orders', color: '#7DBB7D' },
    { label: 'SOH snapshots', color: '#B39DDB' },
  ]

  return (
    <div className="chart-legend">
      {legendItems.map((item) => (
        <div key={item.label} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
          <span className="chart-legend-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [moduleTransactionData, setModuleTransactionData] = useState(defaultModuleTransactionData)
  const [transactionVolumeData, setTransactionVolumeData] = useState(defaultTransactionVolumeData)
  const [isDonutLoading, setIsDonutLoading] = useState(true)
  const [liveMetrics, setLiveMetrics] = useState({
    items: '19',
    transactions: '4.2B',
    facilities: '4,000+',
  })
  const [loadingMetrics, setLoadingMetrics] = useState({
    items: true,
    transactions: true,
    facilities: true,
  })

  const extractFirstNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = extractFirstNumber(item)
        if (found !== null) return found
      }
      return null
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        const found = extractFirstNumber(value[key])
        if (found !== null) return found
      }
      return null
    }
    return null
  }

  const formatCompact = (num) => {
    if (!Number.isFinite(num)) return null
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${Math.round(num / 1_000)}K`
    return `${num}`
  }

  useEffect(() => {
    let isMounted = true

    const loadLiveMetrics = async () => {
      const endpoints = [
        { key: 'items', url: apiUrl('/metadata/served-item-units') },
        { key: 'transactions', url: apiUrl('/metadata/transactions') },
        { key: 'facilities', url: apiUrl('/metadata/served-facilities') },
      ]

      await Promise.allSettled(
        endpoints.map(async (entry) => {
          try {
            const response = await fetch(entry.url)
            if (!response.ok) throw new Error(`Request failed: ${entry.url}`)
            const json = await response.json()
            const numericValue = extractFirstNumber(json)
            if (numericValue === null) throw new Error(`No numeric value in ${entry.url}`)
            if (!isMounted) return

            setLiveMetrics((current) => {
              const next = { ...current }
              if (entry.key === 'facilities') next.facilities = `${Number(numericValue).toLocaleString()}+`
              else next[entry.key] = formatCompact(Number(numericValue)) ?? current[entry.key]
              return next
            })
          } finally {
            if (isMounted) setLoadingMetrics((current) => ({ ...current, [entry.key]: false }))
          }
        }),
      )
    }

    const moduleColors = ['#7DBB7D', '#6FA8DC', '#F4A261', '#B39DDB', '#F6B26B', '#80CBC4']
    const moduleLabelMap = {
      Requisition: 'Requisition',
      IssueDoc: 'Issue',
      ReceiveDoc: 'Receive',
      Invoice: 'Invoice',
      PurchaseOrder: 'Purchase Order',
    }

    const loadModuleTransactions = async () => {
      try {
        const response = await fetch(apiUrl('/metadata/transactions/by-module'))
        if (!response.ok) throw new Error('Failed to load module transactions')
        const payload = await response.json()
        if (!Array.isArray(payload) || payload.length === 0) return

        const mapped = payload
          .filter((item) => typeof item?.numberOfTransactions === 'number' && Number.isFinite(item.numberOfTransactions))
          .map((item, index) => ({
            name: moduleLabelMap[item.module] ?? item.module ?? `Module ${index + 1}`,
            value: item.numberOfTransactions,
            color: moduleColors[index % moduleColors.length],
          }))

        if (isMounted && mapped.length > 0) setModuleTransactionData(mapped)
      } catch {
        // Keep default chart values on API failure.
      } finally {
        if (isMounted) setIsDonutLoading(false)
      }
    }

    const byYearSeriesMap = {
      IssueDoc: 'Issues',
      ReceiveDoc: 'Receive',
      PurchaseOrder: 'Purchase Orders',
      Requisition: 'Purchase Orders',
      SOHSnapshot: 'SOH snapshots',
      StockOnHand: 'SOH snapshots',
    }

    const loadTransactionsByYear = async () => {
      try {
        const response = await fetch(apiUrl('/metadata/transactions/by-year'))
        if (!response.ok) throw new Error('Failed to load yearly transactions')
        const payload = await response.json()
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) return

        const yearly = {}
        for (const row of rows) {
          const yearNum = Number(row?.transactionYear)
          const count = Number(row?.transactionCount)
          const module = row?.module
          const series = byYearSeriesMap[module]
          if (!series || !Number.isFinite(yearNum) || !Number.isFinite(count)) continue
          if (yearNum < 2015 || yearNum > 2025) continue

          const year = String(yearNum)
          if (!yearly[year]) {
            yearly[year] = { year, Issues: 0, Receive: 0, 'Purchase Orders': 0, 'SOH snapshots': 0 }
          }
          yearly[year][series] += count
        }

        const mapped = Object.values(yearly).sort((a, b) => Number(a.year) - Number(b.year))
        if (isMounted && mapped.length > 0) setTransactionVolumeData(mapped)
      } catch {
        // Keep default static series when endpoint fails.
      }
    }

    loadLiveMetrics().catch(() => {
      // Keep fallback values already shown in cards.
    })
    loadModuleTransactions()
    loadTransactionsByYear()

    return () => {
      isMounted = false
    }
  }, [])

  const renderMetricValue = (key) => {
    if (loadingMetrics[key]) return <span className="metric-loader" aria-label="Loading metric" />
    return liveMetrics[key]
  }

  const handleNavigate = (page) => {
    setActivePage(page)
    setIsSidebarOpen(false)
  }

  const renderPageContent = () => {
    if (activePage === 'data-sources') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Connected data sources</h2>
            <p className="panel-subtitle">Current integrations and ingestion status across modules</p>
            <div className="simple-list">
              <div className="simple-list-item">
                <strong>VITAS</strong>
                <span>Historical source · 2015-2023 · Sync complete</span>
              </div>
              <div className="simple-list-item">
                <strong>SAP ERP</strong>
                <span>Primary source · 2024-current · Last sync: 2 hours ago</span>
              </div>
              <div className="simple-list-item">
                <strong>Data Quality Rules</strong>
                <span>42 active validation checks · 98.4% pass rate</span>
              </div>
            </div>
          </article>
        </section>
      )
    }

    if (activePage === 'analytics') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Analytics highlights</h2>
            <p className="panel-subtitle">Quick insights generated from the latest warehouse snapshot</p>
            <div className="simple-list">
              <div className="simple-list-item">
                <strong>Top growth hub</strong>
                <span>Addis cluster showed +14% year-over-year transaction increase</span>
              </div>
              <div className="simple-list-item">
                <strong>Most active module</strong>
                <span>Issues module contributes 38% of annual transaction volume</span>
              </div>
              <div className="simple-list-item">
                <strong>Coverage trend</strong>
                <span>Facility reporting completeness improved from 91% to 96%</span>
              </div>
            </div>
          </article>
        </section>
      )
    }

    if (activePage === 'settings') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Workspace settings</h2>
            <p className="panel-subtitle">Configure dashboard behavior and notification preferences</p>
            <div className="simple-list">
              <div className="simple-list-item">
                <strong>Default date range</strong>
                <span>2015-2025 (editable)</span>
              </div>
              <div className="simple-list-item">
                <strong>Refresh interval</strong>
                <span>Every 6 hours</span>
              </div>
              <div className="simple-list-item">
                <strong>Alerts</strong>
                <span>Email notifications enabled for data gaps and failed sync jobs</span>
              </div>
            </div>
          </article>
        </section>
      )
    }

    if (activePage === 'facilities') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Facilities</h2>
            <p className="panel-subtitle">Facility-level service coverage, stock flow, and reporting performance.</p>
            <div className="simple-list">
              <div className="simple-list-item">
                <strong>Active facilities</strong>
                <span>4,062 facilities currently reporting this month.</span>
              </div>
              <div className="simple-list-item">
                <strong>Top reporting regions</strong>
                <span>Addis Ababa, Oromia, and Amhara lead in on-time submissions.</span>
              </div>
            </div>
          </article>
        </section>
      )
    }

    if (activePage === 'reports') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Reports</h2>
            <p className="panel-subtitle">Download and review generated reports for operations and planning.</p>
            <div className="simple-list">
              <div className="simple-list-item">
                <strong>Monthly hub performance</strong>
                <span>Last generated: today at 10:25 PM.</span>
              </div>
              <div className="simple-list-item">
                <strong>Data quality audit</strong>
                <span>Includes completeness, freshness, and sync gap checks.</span>
              </div>
            </div>
          </article>
        </section>
      )
    }

    return (
      <>
        <header className="page-header">
          <h1>Current Data Status</h1>
          <p>Understand the freshness, completeness, quality, and scope of the data powering this dashboard.</p>
        </header>

        <section className="summary-grid">
          <SummaryCard
            label="Number of items"
            value={renderMetricValue('items')}
            subtitle="Grouped into 7 clusters"
            icon={<Building2 className="card-icon" />}
          />
          <SummaryCard
            label="Data coverage"
            value="10+ years"
            subtitle="2015 - 2025"
            icon={<Calendar className="card-icon" />}
          />
          <SummaryCard
            label="Total transactions"
            value={renderMetricValue('transactions')}
            subtitle="All modules combined"
            icon={<Activity className="card-icon" />}
          />
          <SummaryCard
            label="Health facilities served"
            value={renderMetricValue('facilities')}
            subtitle="Across all regions"
            icon={<Database className="card-icon" />}
          />
        </section>

        <section className="charts-stack">
          <article className="panel">
            <h2>Data source coverage by module · 2015-2025</h2>
            <p className="panel-subtitle">All data before 2024 from VITAS - All data from 2024 onward from SAP ERP</p>
            <DataSourceCoverageChart />
          </article>

          <section className="dual-panel-grid">
            <HubMapCard />

            <article className="panel">
              <h2>Total transactions by module</h2>
              <p className="panel-subtitle">Breakdown of 4.2B transactions across all modules</p>

              <div className="chart-legend chart-legend-wrap">
                {moduleTransactionData.map((item) => (
                  <div key={item.name} className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="chart-legend-label">{item.name}</span>
                  </div>
                ))}
              </div>

              {isDonutLoading ? (
                <div className="donut-loader-wrap">
                  <span className="donut-loader" aria-label="Loading donut chart" />
                </div>
              ) : (
                <ModuleTransactionDonut data={moduleTransactionData} formatValue={formatYAxis} />
              )}
            </article>
          </section>

          <article className="panel">
            <h2>Transaction volume over 10 years</h2>
            <p className="panel-subtitle">Yearly transactions by module type</p>
            <CustomLegend />

            <div className="transaction-chart">
              <TransactionVolumeChart data={transactionVolumeData} formatYAxis={formatYAxis} />
            </div>

            <div className="data-gap-wrapper">
              <span className="data-gap-badge">Data gap</span>
            </div>
          </article>

          <article className="panel">
            <h2>Module sync status</h2>
            <p className="panel-subtitle">Current feed health by data module · as of last dashboard refresh</p>
            <ModuleSyncStatus />
          </article>
        </section>
      </>
    )
  }

  return (
    <div className="layout">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} isOpen={isSidebarOpen} />
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      <main className="main-content">
        <div className="container">
          <div className="mobile-topbar">
            <button type="button" className="menu-button" onClick={() => setIsSidebarOpen((prev) => !prev)} aria-label="Toggle navigation">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <p>fanos</p>
          </div>
          {renderPageContent()}
        </div>
      </main>
    </div>
  )
}

export default App
