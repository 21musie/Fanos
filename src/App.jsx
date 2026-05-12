import { useEffect, useState } from 'react'
import {
  Activity,
  Building2,
  Calendar,
  Database,
  FileText,
  Menu,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import SummaryCard from './components/SummaryCard'
import DataSourceCoverageChart from './components/DataSourceCoverageChart'
import ModuleSyncStatus from './components/ModuleSyncStatus'
import HubMapCard from './components/HubMapCard'
import ModuleTransactionDonut from './components/ModuleTransactionDonut'
import TransactionVolumeChart from './components/TransactionVolumeChart'
import InteractiveSummaryCard from './components/InteractiveSummaryCard'
import { apiUrl } from './config'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './App.css'

const defaultModuleTransactionData = [
  { name: 'Issues', value: 2100000, color: '#7DBB7D' },
  { name: 'Receive', value: 1850000, color: '#6FA8DC' },
  { name: 'Purchase Orders', value: 1420000, color: '#F4A261' },
  { name: 'SOH snapshots', value: 450000, color: '#B39DDB' },
  { name: 'Avg. consumption', value: 380000, color: '#F6B26B' },
]

const defaultTransactionVolumeData = [
  { year: '2015', Issues: 80000, Receive: 75000 },
  { year: '2016', Issues: 95000, Receive: 88000 },
  { year: '2017', Issues: 110000, Receive: 105000 },
  { year: '2018', Issues: 145000, Receive: 138000 },
  { year: '2019', Issues: 180000, Receive: 165000 },
  { year: '2020', Issues: 95000, Receive: 82000 },
  { year: '2021', Issues: 195000, Receive: 185000 },
  { year: '2022', Issues: 225000, Receive: 210000 },
  { year: '2023', Issues: 250000, Receive: 235000 },
  { year: '2024', Issues: 275000, Receive: 258000 },
  { year: '2025', Issues: 285000, Receive: 268000 },
]

const defaultSyncStatusData = [
  { module: 'IssueDoc', status: 'Live', lastSync: 'Last synced 2 hrs ago', tone: 'live' },
  { module: 'PurchaseOrder', status: 'Live', lastSync: 'Last synced 8 hrs ago', tone: 'live' },
  { module: 'ReceiveDoc', status: 'Stale', lastSync: 'Last synced 31 hrs ago', tone: 'stale' },
  { module: 'OutboundDelivery2', status: 'Critical', lastSync: 'Last synced 9 days ago', tone: 'critical' },
]

const defaultCoverageData = [
  { module: 'Issues', offset: 0, vitas: 12, gap: 0, sap: 2 },
  { module: 'Receive', offset: 2, vitas: 10, gap: 0, sap: 2 },
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
  const [transactionsMonthlyRows, setTransactionsMonthlyRows] = useState([])
  const [issuesTopRows, setIssuesTopRows] = useState([])
  const [receivesTopRows, setReceivesTopRows] = useState([])
  const [lastPODate, setLastPODate] = useState(null)
  const [issuesPageLoading, setIssuesPageLoading] = useState(true)
  const [receivesPageLoading, setReceivesPageLoading] = useState(true)
  const [selectedIssuesYear, setSelectedIssuesYear] = useState('2026')
  const [selectedReceivesYear, setSelectedReceivesYear] = useState('2026')
  const [liveMetrics, setLiveMetrics] = useState({
    items: '',
    transactions: '',
    facilities: '',
  })
  const [itemSlides, setItemSlides] = useState([])

  const [facilitySlides, setFacilitySlides] = useState([])

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
          if (isMounted) {
            setItemSlides([])
            setLoadingMetrics((current) => ({ ...current, items: false }))
          }
          return
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
          if (isMounted) {
            setItemSlides([])
            setLoadingMetrics((current) => ({ ...current, items: false }))
          }
          return
        }

        const total = mapped.reduce((sum, row) => sum + row.value, 0)
        const slides = [{ type: 'Total item units', value: total }, ...mapped]

        if (isMounted) {
          setItemSlides(slides)

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
          if (isMounted) {
            setFacilitySlides([])
            setLoadingMetrics((current) => ({ ...current, facilities: false }))
          }
          return
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
          if (isMounted) {
            setFacilitySlides([])
            setLoadingMetrics((current) => ({ ...current, facilities: false }))
          }
          return
        }

        const total = mapped.reduce((sum, row) => sum + row.value, 0)
        const slides = [{ type: 'Total facilities served', value: total }, ...mapped]

        if (isMounted) {
          setFacilitySlides(slides)

          setLiveMetrics((current) => ({ ...current, facilities: Number(total).toLocaleString() }))
          setLoadingMetrics((current) => ({ ...current, facilities: false }))
        }
        return
      }
    }

    const moduleColors = ['#7DBB7D', '#6FA8DC', '#F4A261', '#B39DDB', '#F6B26B', '#80CBC4']

    const loadModuleTransactions = async () => {
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
          .map((item) => ({
            name: String(item?.customerType ?? item?.facilityType ?? item?.type ?? item?.name ?? '').trim(),
            value: Number(
              extractFirstNumber(
                item?.servedFacilities ?? item?.facilityCount ?? item?.count ?? item?.value ?? null,
              ),
            ),
          }))
          .filter((item) => item.name && Number.isFinite(item.value))
          .map((item, index) => ({
            name: item.name,
            value: item.value,
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
      // PurchaseOrder: 'Purchase Orders',
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
            yearly[year] = { year, Issues: 0, Receive: 0 }
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
          // PurchaseOrder: 'Purchase orders',
          // Requisition: 'Requisition',
          // Invoice: 'Invoice',
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
          if (row?.module === 'Requisition' || row?.module === 'PurchaseOrder' || row?.module === 'Invoice') continue

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

    const loadTransactionsMonthly = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/transactions/monthly'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) setTransactionsMonthlyRows(rows)
        return
      }
    }

    const loadIssuesTopTen = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/issues/recent-top10'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) setIssuesTopRows(rows)
        return
      }
    }

    const loadReceivesTopTen = async () => {
      while (isMounted) {
        const payload = await fetchJsonWithRetry(apiUrl('/metadata/receives/recent-top10'))
        if (!payload || !isMounted) return
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.value) ? payload.value : []
        if (!Array.isArray(rows) || rows.length === 0) {
          await wait(1500)
          continue
        }
        if (isMounted) setReceivesTopRows(rows)
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
      loadTransactionsMonthly(),
      loadIssuesTopTen(),
      loadReceivesTopTen(),
    ])

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (transactionsMonthlyRows.length > 0 && issuesTopRows.length > 0) {
      setIssuesPageLoading(false)
    }
  }, [transactionsMonthlyRows, issuesTopRows])

  useEffect(() => {
    if (transactionsMonthlyRows.length > 0 && receivesTopRows.length > 0) {
      setReceivesPageLoading(false)
    }
  }, [transactionsMonthlyRows, receivesTopRows])


  const renderMetricValue = (key) => {
    if (loadingMetrics[key]) return <span className="metric-loader" aria-label="Loading metric" />
    return liveMetrics[key]
  }

  const monthlyChartYears = Array.from({ length: 12 }, (_, index) => String(2015 + index))

  const buildMonthlyVolumeByModule = (moduleCode, year) => {
    const monthMap = new Map([
      [1, 'Jan'], [2, 'Feb'], [3, 'Mar'], [4, 'Apr'], [5, 'May'], [6, 'Jun'],
      [7, 'Jul'], [8, 'Aug'], [9, 'Sep'], [10, 'Oct'], [11, 'Nov'], [12, 'Dec'],
    ])
    const aggregate = new Map()
    for (const row of transactionsMonthlyRows) {
      const mod = String(row?.module || '')
      const y = String(row?.transactionYear || '')
      const month = Number(row?.transactionMonth)
      const count = Number(row?.transactionCount)
      if (mod !== moduleCode || y !== year || !Number.isFinite(month) || !Number.isFinite(count)) continue
      aggregate.set(month, (aggregate.get(month) || 0) + count)
    }
    return [...aggregate.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([m, volume]) => ({ month: monthMap.get(m) ?? String(m), volume }))
  }

  const issuesMonthlyChartData = buildMonthlyVolumeByModule('IssueDoc', selectedIssuesYear)
  const receivesMonthlyChartData = buildMonthlyVolumeByModule('ReceiveDoc', selectedReceivesYear)

  const filteredIssuesRows = issuesTopRows
  const filteredReceivesRows = receivesTopRows

  const formatReceiveExpiry = (raw) => {
    const digits = String(raw ?? '').replace(/\D/g, '')
    if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    return String(raw || '').trim() || '-'
  }

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

    if (activePage === 'issues') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Issues monthly volume</h2>
            <p className="panel-subtitle">Monthly issue volume for selected year</p>
            <div className="issues-filter-row">
              <label htmlFor="issues-year-select">Year</label>
              <select
                id="issues-year-select"
                value={selectedIssuesYear}
                onChange={(event) => setSelectedIssuesYear(event.target.value)}
              >
                {monthlyChartYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {issuesPageLoading ? (
              <div className="donut-loader-wrap">
                <span className="donut-loader" aria-label="Loading issues page" />
              </div>
            ) : (
              <>
                <div className="issues-chart-wrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={issuesMonthlyChartData} margin={{ top: 8, right: 10, left: 10, bottom: 24 }} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="0" stroke="#F0F0F0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#000000' }} axisLine={{ stroke: '#E0E0E0' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#757575' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(value) => formatYAxis(Number(value))}
                      />
                      <Bar dataKey="volume" fill="#F4A261" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="issues-table-card">
                  <div className="issues-table-header">
                    <h3>Recent top 10 issues</h3>
                    <span>All recent records</span>
                  </div>
                  <div className="issues-table-scroll">
                    <table className="issues-table">
                      <thead>
                        <tr>
                          <th>Delivery #</th>
                          <th>Date</th>
                          <th>Material</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Facility</th>
                          <th>Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIssuesRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="issues-empty-row">No issue records available</td>
                          </tr>
                        ) : (
                          filteredIssuesRows.map((row) => (
                            <tr key={`${row?.deliveryNumber}-${row?.materialNumber}-${row?.batchNumber}`}>
                              <td>{row?.deliveryNumber || '-'}</td>
                              <td>{String(row?.deliveryDate || '').slice(0, 10) || '-'}</td>
                              <td>{row?.materialNumber || '-'}</td>
                              <td>{row?.materialDescription || '-'}</td>
                              <td>{Number.isFinite(Number(row?.actualQuantityDelivered)) ? Number(row.actualQuantityDelivered).toLocaleString() : '-'}</td>
                              <td>{row?.customerName || '-'}</td>
                              <td>{row?.region || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </article>
        </section>
      )
    }

    if (activePage === 'receives') {
      return (
        <section className="page-section">
          <article className="panel">
            <h2>Receives monthly volume</h2>
            <p className="panel-subtitle">Monthly receive transaction volume for selected year (all sources)</p>
            <div className="issues-filter-row">
              <label htmlFor="receives-year-select">Year</label>
              <select
                id="receives-year-select"
                value={selectedReceivesYear}
                onChange={(event) => setSelectedReceivesYear(event.target.value)}
              >
                {monthlyChartYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {receivesPageLoading ? (
              <div className="donut-loader-wrap">
                <span className="donut-loader" aria-label="Loading receives page" />
              </div>
            ) : (
              <>
                <div className="issues-chart-wrap">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={receivesMonthlyChartData} margin={{ top: 8, right: 10, left: 10, bottom: 24 }} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="0" stroke="#F0F0F0" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#000000' }} axisLine={{ stroke: '#E0E0E0' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#757575' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          fontSize: '13px',
                        }}
                        formatter={(value) => formatYAxis(Number(value))}
                      />
                      <Bar dataKey="volume" fill="#6FA8DC" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="issues-table-card">
                  <div className="issues-table-header">
                    <h3>Recent top 10 receives</h3>
                    <span>All recent records</span>
                  </div>
                  <div className="issues-table-scroll">
                    <table className="issues-table">
                      <thead>
                        <tr>
                          <th>Document #</th>
                          <th>Date</th>
                          <th>Material</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Plant</th>
                          <th>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReceivesRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="issues-empty-row">No receive records available</td>
                          </tr>
                        ) : (
                          filteredReceivesRows.map((row, index) => (
                            <tr key={`${row?.documentNumber}-${row?.batchNumber}-${index}`}>
                              <td>{row?.documentNumber || '-'}</td>
                              <td>{String(row?.receiveDate || '').slice(0, 10) || '-'}</td>
                              <td>{row?.materialNumber || '-'}</td>
                              <td>{row?.material || '-'}</td>
                              <td>{Number.isFinite(Number(row?.quantity)) ? Number(row.quantity).toLocaleString() : '-'}</td>
                              <td>{row?.plant || '-'}</td>
                              <td>{formatReceiveExpiry(row?.expiryDate)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
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

    const lastIssueDate = issuesTopRows.length
      ? issuesTopRows.reduce((best, r) => (r.deliveryDate > best ? r.deliveryDate : best), '').slice(0, 10)
      : null

    const lastReceiveDate = receivesTopRows.length
      ? receivesTopRows.reduce((best, r) => (r.receiveDate > best ? r.receiveDate : best), '').slice(0, 10)
      : null

    const sohAsOfDate =
      syncStatusData.find((m) => m.module.toLowerCase().includes('usablestock'))?.lastSync ?? null

    return (
      <>
        <header className="page-header">
          <h1>FANOS Data Scope & Coverage</h1>
          <p>Understand the freshness, completeness, quality, and scope of the data powering this dashboard.</p>
        </header>

        <section className="summary-grid">
          <InteractiveSummaryCard
            title="Number of items"
            icon={<Building2 className="card-icon" />}
            slides={itemSlides}
            loading={loadingMetrics.items}
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
          <InteractiveSummaryCard
            title="Health facilities served"
            icon={<Database className="card-icon" />}
            slides={facilitySlides}
            loading={loadingMetrics.facilities}
          />
        </section>

        <section className="summary-grid compact-cards">
          <SummaryCard
            label="Last Issue Date"
            value={issuesTopRows.length ? lastIssueDate : <span className="metric-loader" aria-label="Loading" />}
            subtitle="Most recent issue transaction"
            icon={<TrendingDown className="card-icon" />}
          />
          <SummaryCard
            label="Last Receive Date"
            value={receivesTopRows.length ? lastReceiveDate : <span className="metric-loader" aria-label="Loading" />}
            subtitle="Most recent receive transaction"
            icon={<TrendingUp className="card-icon" />}
          />
          <SummaryCard
            label="Last PO Date"
            value={lastPODate ?? <span className="metric-loader" aria-label="Loading" />}
            subtitle="Most recent purchase order"
            icon={<FileText className="card-icon" />}
          />
          <SummaryCard
            label="SOH As of Date"
            value={sohAsOfDate ?? <span className="metric-loader" aria-label="Loading" />}
            subtitle="UsableStock last sync"
            icon={<PackageCheck className="card-icon" />}
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
              <h2>Health facilities served by type</h2>
              <p className="panel-subtitle">Distribution of served health facilities across facility types</p>

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
            <h2>Transaction volume over 11 years</h2>
            <p className="panel-subtitle">Yearly transactions by module type</p>

            <div className="transaction-chart">
              <TransactionVolumeChart data={transactionVolumeData} formatYAxis={formatYAxis} />
            </div>
            <CustomLegend />
          </article>

          <article className="panel">
            <h2>SAP Data Sync Status</h2>
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
