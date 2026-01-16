'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface RankData {
  date: string
  position: number
}

interface RankChartProps {
  data: RankData[]
  height?: number
}

export default function RankChart({ data, height = 200 }: RankChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MM/dd'),
    position: Math.round(item.position * 10) / 10,
  }))

  // Calculate Y-axis domain (reversed for rankings - lower is better)
  const positions = data.map((d) => d.position)
  const minPos = Math.max(1, Math.floor(Math.min(...positions)))
  const maxPos = Math.ceil(Math.max(...positions)) + 5

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          tickLine={{ stroke: '#4B5563' }}
        />
        <YAxis
          reversed
          domain={[minPos, maxPos]}
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          tickLine={{ stroke: '#4B5563' }}
          label={{
            value: 'Rank',
            angle: -90,
            position: 'insideLeft',
            fill: '#9CA3AF',
            fontSize: 12,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#F3F4F6' }}
          itemStyle={{ color: '#10B981' }}
          formatter={(value) => [`Position: ${value}`, '']}
        />
        <Line
          type="monotone"
          dataKey="position"
          stroke="#10B981"
          strokeWidth={2}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
          activeDot={{ r: 5, fill: '#34D399' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
