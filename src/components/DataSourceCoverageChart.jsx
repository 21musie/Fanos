import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const timelineData = [
  { module: 'Stock on hand', vitasA: 3.0, gap: 0.4, vitasB: 8.6, sap: 2.0 },
  { module: 'Issues', vitasA: 2.5, gap: 0.0, vitasB: 9.5, sap: 2.0 },
  { module: 'Purchase orders', vitasA: 4.1, gap: 0.5, vitasB: 7.4, sap: 2.0 },
  { module: 'Receive', vitasA: 3.4, gap: 0.3, vitasB: 8.3, sap: 2.0 },
  { module: 'Avg. consumption', vitasA: 5.2, gap: 0.3, vitasB: 6.5, sap: 2.0 },
]

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '')
  const num = Number.parseInt(clean, 16)
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff }
}

const rgbToHex = (r, g, b) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

const rgbToHsl = (r, g, b) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

const hslToRgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (h < 60) [r1, g1, b1] = [c, x, 0]
  else if (h < 120) [r1, g1, b1] = [x, c, 0]
  else if (h < 180) [r1, g1, b1] = [0, c, x]
  else if (h < 240) [r1, g1, b1] = [0, x, c]
  else if (h < 300) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

const toVibrant = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const vivid = hslToRgb(h, Math.min(1, s + 0.22), Math.min(0.72, l + 0.08))
  return rgbToHex(vivid.r, vivid.g, vivid.b)
}

function DataSourceCoverageChart() {
  const [activeSeries, setActiveSeries] = useState('')
  const [isCutoverHovered, setIsCutoverHovered] = useState(false)
  const getSeriesColor = (key, baseColor) => (activeSeries === key ? toVibrant(baseColor) : baseColor)

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={timelineData}
          layout="vertical"
          margin={{ top: 24, right: 18, left: 38, bottom: 4 }}
          barCategoryGap={14}
          onMouseLeave={() => setIsCutoverHovered(false)}
        >
          <CartesianGrid strokeDasharray="0" stroke="#F0F0F0" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 14]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
            tickFormatter={(tick) => (2012 + tick).toString()}
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="module"
            tick={{ fontSize: 13, fill: '#4b4b4b' }}
            axisLine={false}
            tickLine={false}
            width={108}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            formatter={(value, key) => [`${Number(value).toFixed(1)} years`, key]}
          />

          <ReferenceLine
            x={12}
            className={`coverage-cutover-line ${isCutoverHovered ? 'active' : ''}`}
            stroke={isCutoverHovered ? '#1565C0' : '#8AA3BF'}
            strokeWidth={isCutoverHovered ? 2.5 : 1.5}
            strokeDasharray={isCutoverHovered ? '4 4' : '3 5'}
            isFront
            ifOverflow="visible"
            onMouseEnter={() => setIsCutoverHovered(true)}
            label={{
              value: 'May 2024',
              position: 'insideTop',
              fill: isCutoverHovered ? '#1565C0' : '#6f7f90',
              fontSize: isCutoverHovered ? 12 : 11,
              fontWeight: 600,
            }}
          />

          <Bar
            dataKey="vitasA"
            stackId="coverage"
            fill={getSeriesColor('vitasA', '#F4A261')}
            radius={[2, 0, 0, 2]}
            onMouseEnter={() => setActiveSeries('vitasA')}
            onMouseLeave={() => setActiveSeries('')}
            isAnimationActive={false}
          >
            <LabelList dataKey="vitasA" position="inside" formatter={(v) => (Number(v) >= 1.5 ? 'VITAS' : '')} fill="#fff" fontSize={10} />
          </Bar>
          <Bar dataKey="gap" stackId="coverage" fill="#EAEAEA" isAnimationActive={false} />
          <Bar
            dataKey="vitasB"
            stackId="coverage"
            fill={getSeriesColor('vitasB', '#F4A261')}
            onMouseEnter={() => setActiveSeries('vitasB')}
            onMouseLeave={() => setActiveSeries('')}
            isAnimationActive={false}
          >
            <LabelList dataKey="vitasB" position="inside" formatter={(v) => (Number(v) >= 1.5 ? 'VITAS' : '')} fill="#fff" fontSize={10} />
          </Bar>
          <Bar
            dataKey="sap"
            stackId="coverage"
            fill={getSeriesColor('sap', '#6FA8DC')}
            radius={[0, 2, 2, 0]}
            onMouseEnter={() => setActiveSeries('sap')}
            onMouseLeave={() => setActiveSeries('')}
            isAnimationActive={false}
          >
            <LabelList dataKey="sap" position="inside" formatter={() => 'SAP ERP'} fill="#fff" fontSize={10} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-legend chart-legend-bottom">
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#F4A261' }} />
          <span className="chart-legend-label">VITAS (pre-2024)</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ backgroundColor: '#6FA8DC' }} />
          <span className="chart-legend-label">SAP ERP (2024+)</span>
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot chart-legend-gap" />
          <span className="chart-legend-label">Gap (no data)</span>
        </div>
      </div>
    </div>
  )
}

export default DataSourceCoverageChart
