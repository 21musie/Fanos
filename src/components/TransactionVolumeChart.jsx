import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

function TransactionVolumeChart({ data, formatYAxis }) {
  const [activeSeries, setActiveSeries] = useState('')
  const colorFor = (key, base) => (activeSeries === key ? toVibrant(base) : base)

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 40 }} barCategoryGap="15%" barSize={55}>
        <CartesianGrid strokeDasharray="0" stroke="#F0F0F0" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 13, fill: '#000000' }} axisLine={{ stroke: '#E0E0E0' }} tickLine={false} />
        <YAxis tick={{ fontSize: 13, fill: '#757575' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value) => formatYAxis(Number(value))}
        />
        <Bar
          dataKey="Issues"
          stackId="a"
          fill={colorFor('Issues', '#84EB84')}
          stroke="#ffffff"
          strokeWidth={0.6}
          onMouseEnter={() => setActiveSeries('Issues')}
          onMouseLeave={() => setActiveSeries('')}
          isAnimationActive={false}
        />
        <Bar
          dataKey="Receive"
          stackId="a"
          fill={colorFor('Receive', '#6FA8DC')}
          minPointSize={10}
          stroke="#ffffff"
          strokeWidth={0.6}
          onMouseEnter={() => setActiveSeries('Receive')}
          onMouseLeave={() => setActiveSeries('')}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TransactionVolumeChart
