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
  { year: '2015', Issues: 80000, Receive: 75000, 'Purchase Orders': 45000 },
  { year: '2016', Issues: 95000, Receive: 88000, 'Purchase Orders': 52000 },
  { year: '2017', Issues: 110000, Receive: 105000, 'Purchase Orders': 62000 },
  { year: '2018', Issues: 145000, Receive: 138000, 'Purchase Orders': 78000 },
  { year: '2019', Issues: 180000, Receive: 165000, 'Purchase Orders': 95000 },
  { year: '2020', Issues: 95000, Receive: 82000, 'Purchase Orders': 48000 },
  { year: '2021', Issues: 195000, Receive: 185000, 'Purchase Orders': 105000 },
  { year: '2022', Issues: 225000, Receive: 210000, 'Purchase Orders': 125000 },
  { year: '2023', Issues: 250000, Receive: 235000, 'Purchase Orders': 142000 },
  { year: '2024', Issues: 275000, Receive: 258000, 'Purchase Orders': 158000 },
  { year: '2025', Issues: 285000, Receive: 268000, 'Purchase Orders': 165000 },
]

const defaultSyncStatusData = [
  { module: 'IssueDoc', status: 'Live', lastSync: 'Last synced 2 hrs ago', tone: 'live' },
  { module: 'PurchaseOrder', status: 'Live', lastSync: 'Last synced 8 hrs ago', tone: 'live' },
  { module: 'ReceiveDoc', status: 'Stale', lastSync: 'Last synced 31 hrs ago', tone: 'stale' },
  { module: 'OutboundDelivery2', status: 'Critical', lastSync: 'Last synced 9 days ago', tone: 'critical' },
]

const defaultCoverageData = [
  { module: 'Issues', offset: 0, vitas: 12, gap: 0, sap: 2 },
  { module: 'Purchase orders', offset: 1, vitas: 11, gap: 0, sap: 2 },
  { module: 'Receive', offset: 2, vitas: 10, gap: 0, sap: 2 },
  { module: 'Requisition', offset: 3, vitas: 9, gap: 0, sap: 2 },
  { module: 'Invoice', offset: 0, vitas: 12, gap: 0, sap: 0 },
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
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [moduleTransactionData, setModuleTransactionData] = useState([])
  const [transactionVolumeData, setTransactionVolumeData] = useState(defaultTransactionVolumeData)
  const [syncStatusData, setSyncStatusData] = useState([])
  const [coverageData, setCoverageData] = useState(defaultCoverageData)
  const [isDonutLoading, setIsDonutLoading] = useState(true)
  const [isSyncStatusLoading, setIsSyncStatusLoading] = useState(true)
  const [liveMetrics, setLiveMetrics] = useState({
    items: '',
    transactions: '',
    facilities: '',
  })
  const [itemSlides, setItemSlides] = useState([])
  const [itemSlideIndex, setItemSlideIndex] = useState(0)
  const [facilitySlides, setFacilitySlides] = useState([])
  const [facilitySlideIndex, setFacilitySlideIndex] = useState(0)
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
    const timer = window.setTimeout(() => {
      setIsAppLoading(false)
    }, 5000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const wait = (ms) => new Promise((resolve) => {
      window.setTimeout(resolve, ms)
    })
    const fetchJsonWithRetry = async (url, retryDelayMs = 3000) => {
      while (isMounted) {
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Request failed: ${url}`)
          return await response.json()
        } catch {
          if (!isMounted) break
          await wait(retryDelayMs)
        }
      }
      return null
    }

    const loadLiveMetrics = async () => {
      const endpoints = [
        { key: 'transactions', url: apiUrl('/metadata/transactions') },
      ]

      await Promise.allSettled(
        endpoints.map(async (entry) => {
          while (isMounted) {
            const json = await fetchJsonWithRetry(entry.url)
            if (!json || !isMounted) return
            const numericValue = extractFirstNumber(json)
            if (numericValue === null) {
              await wait(1500)
              continue
            }

            setLiveMetrics((current) => {
              const next = { ...current }
              next[entry.key] = formatCompact(Number(numericValue)) ?? current[entry.key]
              return next
            })
            if (isMounted) setLoadingMetrics((current) => ({ ...current, [entry.key]: false }))
            return
          }
        }),
      )
    }

    const loadItemSlides = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/served-item-units/by-commodity-type'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : payload && typeof payload === 'object'
              ? [payload]
              : []

        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }

        const mapped = rows
          .map((row) => {
            const type = String(row?.commodityType ?? row?.type ?? row?.name ?? '').trim()
            const count = extractFirstNumber(
              row?.servedItemUnits ?? row?.itemUnits ?? row?.itemCount ?? row?.value ?? row?.count ?? null,
            )
            return { type, value: Number(count) }
          })
          .filter((row) => row.type && Number.isFinite(row.value))

        if (mapped.length === 0) {
          await wait(1500)
          continue
        }

        const total = mapped.reduce((sum, row) => sum + row.value, 0)
        const slides = [{ type: 'Total item units', value: total }, ...mapped]

        if (isMounted) {
          setItemSlides(slides)
          setItemSlideIndex(0)
          setLiveMetrics((current) => ({ ...current, items: Number(total).toLocaleString() }))
          setLoadingMetrics((current) => ({ ...current, items: false }))
        }
        return
      }
    }

    const loadFacilitySlides = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/served-facilities/by-type'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : payload && typeof payload === 'object'
              ? [payload]
              : []

        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }

        const mapped = rows
          .map((row) => {
            const type = String(row?.customerType ?? row?.facilityType ?? row?.type ?? row?.name ?? '').trim()
            const count = extractFirstNumber(
              row?.servedFacilities ?? row?.facilityCount ?? row?.count ?? row?.value ?? null,
            )
            return { type, value: Number(count) }
          })
          .filter((row) => row.type && Number.isFinite(row.value))

        if (mapped.length === 0) {
          await wait(1500)
          continue
        }

        const total = mapped.reduce((sum, row) => sum + row.value, 0)
        const slides = [{ type: 'Total health facilities served', value: total }, ...mapped]

        if (isMounted) {
          setFacilitySlides(slides)
          setFacilitySlideIndex(0)
          setLiveMetrics((current) => ({ ...current, facilities: Number(total).toLocaleString() }))
          setLoadingMetrics((current) => ({ ...current, facilities: false }))
        }
        return
      }
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
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/transactions/by-module'))
        if (!payload || !isMounted) return
        if (!Array.isArray(payload) || payload.length === 0) {
          await wait(1500)
          continue
        }

        const mapped = payload
          .filter((item) => typeof item?.numberOfTransactions === 'number' && Number.isFinite(item.numberOfTransactions))
          .map((item, index) => ({
            name: moduleLabelMap[item.module] ?? item.module ?? `Module ${index + 1}`,
            value: item.numberOfTransactions,
            color: moduleColors[index % moduleColors.length],
          }))

        if (mapped.length === 0) {
          await wait(1500)
          continue
        }

        if (isMounted) {
          setModuleTransactionData(mapped)
          setIsDonutLoading(false)
        }
        return
      }
    }

    const byYearSeriesMap = {
      IssueDoc: 'Issues',
      ReceiveDoc: 'Receive',
      PurchaseOrder: 'Purchase Orders',
    }

    const loadTransactionsByYear = async () => {
      const currentCalendarYear = new Date().getFullYear()
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/transactions/by-module-by-year'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : payload && typeof payload === 'object'
              ? [payload]
              : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }

        const yearly = {}
        for (const row of rows) {
          const yearNum = Number(row?.transactionYear)
          const count = Number(row?.transactionCount)
          const moduleName = String(row?.module || '').trim()
          const series = byYearSeriesMap[moduleName]
          if (!series || !Number.isFinite(yearNum) || !Number.isFinite(count)) continue
          if (yearNum < 2012 || yearNum > currentCalendarYear) continue

          const year = String(yearNum)
          if (!yearly[year]) {
            yearly[year] = { year, Issues: 0, Receive: 0, 'Purchase Orders': 0 }
          }
          yearly[year][series] += count
        }

        const mapped = Object.values(yearly).sort((a, b) => Number(a.year) - Number(b.year))
        if (mapped.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) setTransactionVolumeData(mapped)
        return
      }
    }

    const loadCoverageByYear = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/transactions/by-year'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }

        const labelMap = {
          IssueDoc: 'Issues',
          ReceiveDoc: 'Receive',
          PurchaseOrder: 'Purchase orders',
          Requisition: 'Requisition',
          Invoice: 'Invoice',
          StockOnHand: 'Stock on hand',
          SOHSnapshot: 'Stock on hand',
        }

        const rangeStart = 2012
        const sapStart = 2024
        const rangeEnd = 2026

        const aggregate = new Map()
        for (const row of rows) {
          const year = Number(row?.transactionYear)
          const count = Number(row?.transactionCount)
          if (!Number.isFinite(year) || !Number.isFinite(count) || year < rangeStart || year > rangeEnd || count <= 0) continue

          const moduleLabel = labelMap[row?.module] ?? String(row?.module || 'Unknown')
          if (!aggregate.has(moduleLabel)) {
            aggregate.set(moduleLabel, {
              module: moduleLabel,
              total: 0,
              vitasYears: new Set(),
              sapYears: new Set(),
            })
          }

          const item = aggregate.get(moduleLabel)
          item.total += count
          if (String(row?.source || '').toLowerCase().includes('sap')) item.sapYears.add(year)
          else item.vitasYears.add(year)
        }

        const mapped = [...aggregate.values()]
          .map((item) => {
            const vitasYears = [...item.vitasYears]
            const sapYears = [...item.sapYears]

            const preCutoverYears = vitasYears.filter((y) => y <= sapStart)
            const hasVitas = preCutoverYears.length > 0
            const hasSAP = sapYears.length > 0

            const vitasStart = hasVitas ? Math.min(...preCutoverYears) : rangeStart
            const vitasEndExclusive = hasVitas ? Math.min(sapStart, Math.max(...preCutoverYears) + 1) : rangeStart

            const offset = Math.max(0, vitasStart - rangeStart)
            const vitas = Math.max(0, vitasEndExclusive - vitasStart)
            const gap = Math.max(0, sapStart - vitasEndExclusive)
            const sap = hasSAP ? Math.max(0, rangeEnd - sapStart) : 0

            return {
              module: item.module,
              offset,
              vitas,
              gap,
              sap,
              total: item.total,
            }
          })
          .sort((a, b) => b.total - a.total)
          .slice(0, 6)
          .map(({ total, ...row }) => row)

        if (mapped.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) setCoverageData(mapped)
        return
      }
    }

    const toSyncTone = (hoursSince) => {
      const hours = Number(hoursSince)
      if (Number.isFinite(hours) && hours >= 24 * 7) return 'critical'
      if (Number.isFinite(hours) && hours > 24) return 'stale'
      return 'live'
    }

    const toSyncStatusTone = (syncStatus) => {
      const status = String(syncStatus || '').toUpperCase()
      if (status === 'FAILED') return 'critical'
      if (status === 'IMPORTED') return 'live'
      return 'stale'
    }

    const toSyncLabel = (tone) => {
      if (tone === 'critical') return 'Critical'
      if (tone === 'stale') return 'Stale'
      return 'Live'
    }

    const formatLastSync = (hoursSince) => {
      const hours = Number(hoursSince)
      if (!Number.isFinite(hours)) return 'Last synced unknown'
      if (hours < 24) return `Last synced ${Math.max(1, Math.round(hours))} hrs ago`
      const days = Math.round(hours / 24)
      return `Last synced ${days} day${days === 1 ? '' : 's'} ago`
    }

    const loadSyncStatus = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/sync-status'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }

        const mapped = rows
          .map((row) => {
            const tone = toSyncTone(row?.hoursSince)
            const hoursSince = Number(row?.hoursSince)
            const syncStatusRaw = String(row?.syncStatus || 'UNKNOWN').toUpperCase()
            return {
              module: String(row?.module || 'Unknown').trim(),
              status: toSyncLabel(tone),
              lastSync: formatLastSync(row?.hoursSince),
              tone,
              syncStatus: syncStatusRaw,
              syncStatusTone: toSyncStatusTone(syncStatusRaw),
              hoursSince: Number.isFinite(hoursSince) ? hoursSince : Number.MAX_SAFE_INTEGER,
            }
          })
          .sort((a, b) => a.hoursSince - b.hoursSince)
          .map(({ hoursSince, ...item }) => item)

        if (mapped.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) {
          setSyncStatusData(mapped)
          setIsSyncStatusLoading(false)
        }
        return
      }
    }

    // Fire all dashboard API requests immediately while splash screen is visible.
    void Promise.all([
      loadLiveMetrics(),
      loadItemSlides(),
      loadFacilitySlides(),
      loadModuleTransactions(),
      loadTransactionsByYear(),
      loadCoverageByYear(),
      loadSyncStatus(),
    ])

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (itemSlides.length <= 1) return undefined
    const interval = window.setInterval(() => {
      setItemSlideIndex((current) => (current + 1) % itemSlides.length)
    }, 3200)
    return () => {
      window.clearInterval(interval)
    }
  }, [itemSlides])

  useEffect(() => {
    if (facilitySlides.length <= 1) return undefined
    const interval = window.setInterval(() => {
      setFacilitySlideIndex((current) => (current + 1) % facilitySlides.length)
    }, 3200)
    return () => {
      window.clearInterval(interval)
    }
  }, [facilitySlides])

  const renderMetricValue = (key) => {
    if (loadingMetrics[key]) return <span className="metric-loader" aria-label="Loading metric" />
    return liveMetrics[key]
  }

  const activeItemSlide = itemSlides[itemSlideIndex]
  const itemCardValue = loadingMetrics.items
    ? <span className="metric-loader" aria-label="Loading item metrics" />
    : activeItemSlide
      ? Number(activeItemSlide.value).toLocaleString()
      : liveMetrics.items
  const itemCardType = loadingMetrics.items ? '' : activeItemSlide?.type ?? ''
  const itemCardLabel = loadingMetrics.items ? 'Number of items' : activeItemSlide?.type ?? 'Number of items'
  const activeFacilitySlide = facilitySlides[facilitySlideIndex]
  const facilityCardValue = loadingMetrics.facilities
    ? <span className="metric-loader" aria-label="Loading facility metrics" />
    : activeFacilitySlide
      ? Number(activeFacilitySlide.value).toLocaleString()
      : liveMetrics.facilities
  const facilityCardType = loadingMetrics.facilities ? '' : activeFacilitySlide?.type ?? 'Across all regions'

  const handleNavigate = (page) => {
    setActivePage(page)
    setIsSidebarOpen(false)
  }

  if (isAppLoading) {
    return (
      <div className="app-loader-screen" role="status" aria-live="polite" aria-label="Loading dashboard">
        <div className="app-loader-content">
          <div className="app-loader-orbit">
            <span className="app-loader-core" />
            <span className="app-loader-ring app-loader-ring-one" />
            <span className="app-loader-ring app-loader-ring-two" />
          </div>
          <h1>Fanos Dashboard</h1>
          <p>Preparing your data experience...</p>
        </div>
      </div>
    )
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
            label={itemCardLabel}
            value={itemCardValue}
            subtitle={itemCardType}
            slideKey={`items-${itemSlideIndex}-${itemCardLabel}-${itemCardType}`}
            icon={<Building2 className="card-icon" />}
          />
          <SummaryCard
            label="Data coverage"
            value="11 years"
            subtitle="2015 - 2026"
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
            value={facilityCardValue}
            subtitle={facilityCardType}
            slideKey={`facilities-${facilitySlideIndex}-${facilityCardType}`}
            icon={<Database className="card-icon" />}
          />
        </section>

        <section className="charts-stack">
          <article className="panel">
            <h2>Data source coverage by module · 2012-2026</h2>
            <p className="panel-subtitle">All data before 2024 from VITAS - All data from 2024 onward from SAP ERP</p>
            <DataSourceCoverageChart data={coverageData} />
          </article>

          <section className="dual-panel-grid">
            <HubMapCard />

            <article className="panel">
              <h2>Total transactions by module</h2>
              <p className="panel-subtitle">Breakdown of {loadingMetrics.transactions ? 'live transactions' : liveMetrics.transactions} transactions across all modules</p>

              {isDonutLoading ? (
                <div className="donut-loader-wrap">
                  <span className="donut-loader" aria-label="Loading donut chart" />
                </div>
              ) : (
                <ModuleTransactionDonut data={moduleTransactionData} formatValue={formatYAxis} />
              )}

              <div className="chart-legend chart-legend-wrap chart-legend-bottom">
                {moduleTransactionData.map((item) => (
                  <div key={item.name} className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="chart-legend-label">{item.name}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <article className="panel">
            <h2>Transaction volume over 12 years</h2>
            <p className="panel-subtitle">Yearly transactions by module type</p>

            <div className="transaction-chart">
              <TransactionVolumeChart data={transactionVolumeData} formatYAxis={formatYAxis} />
            </div>
            <CustomLegend />
          </article>

          <article className="panel">
            <h2>Module sync status</h2>
            <p className="panel-subtitle">Current feed health by data module · as of last dashboard refresh</p>
            {isSyncStatusLoading ? (
              <div className="donut-loader-wrap">
                <span className="donut-loader" aria-label="Loading sync status" />
              </div>
            ) : (
              <ModuleSyncStatus modules={syncStatusData} />
            )}
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
            <p>Fanos</p>
          </div>
          {renderPageContent()}
        </div>
      </main>
    </div>
  )
}

export default App
