import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const formatValue = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return value.toString()
}

const formatTooltipValue = (value) => Number(value).toLocaleString()

function HubMapCard({ data = [] }) {
  const chartData = data.map((d) => ({
    hub: (d.hub || '').replace(/ Hub$/, ''),
    transactionsCount: d.transactionsCount ?? 0,
  }))

  const isLoading = chartData.length === 0

  return (
    <article className="panel">
      <h2>{isLoading ? 'Hubs nationwide' : `${chartData.length} hubs nationwide`}</h2>
      <p className="panel-subtitle">Transaction volume by hub</p>

      {isLoading ? (
        <div className="donut-loader-wrap">
          <span className="donut-loader" aria-label="Loading hub chart" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(340, chartData.length * 24 + 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 48, left: 8, bottom: 4 }}
            barCategoryGap={4}
            barSize={16}
          >
            <CartesianGrid strokeDasharray="0" stroke="#F0F0F0" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatValue}
              tick={{ fontSize: 11, fill: '#757575' }}
              axisLine={{ stroke: '#E0E0E0' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="hub"
              tick={{ fontSize: 11, fill: '#4b4b4b' }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              formatter={(value) => [formatTooltipValue(value), 'Transactions']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <Bar
              dataKey="transactionsCount"
              fill="#6FA8DC"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  )
}

export default HubMapCard
