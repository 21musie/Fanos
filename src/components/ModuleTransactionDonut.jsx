import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts'

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '')
  const num = Number.parseInt(clean, 16)
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  }
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

const toVibrantHoverColor = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)

  const boostedSaturation = Math.min(1, s + 0.2)
  const boostedLightness = Math.min(0.72, l + 0.08)
  const vibrant = hslToRgb(h, boostedSaturation, boostedLightness)

  return rgbToHex(vibrant.r, vibrant.g, vibrant.b)
}

function ModuleTransactionDonut({ data, formatValue }) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const activeShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={toVibrantHoverColor(fill)}
        cornerRadius={10}
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={130}
          innerRadius={72}
          paddingAngle={2}
          cornerRadius={8}
          dataKey="value"
          activeIndex={activeIndex}
          activeShape={activeShape}
          isAnimationActive={false}
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          {data.map((entry, index) => {
            const isActive = activeIndex === index
            const isDimmed = activeIndex !== -1 && !isActive
            return (
              <Cell
                key={entry.name}
                fill={isActive ? toVibrantHoverColor(entry.color) : entry.color}
                fillOpacity={isDimmed ? 0.5 : 1}
                stroke={isActive ? toVibrantHoverColor(entry.color) : 'transparent'}
                strokeWidth={isActive ? 2 : 0}
              />
            )
          })}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value) => formatValue(Number(value))}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default ModuleTransactionDonut
