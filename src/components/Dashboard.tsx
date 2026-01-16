'use client'

import { useState, useMemo } from 'react'
import CategoryFilter from './CategoryFilter'
import RankChart from './RankChart'

interface Category {
  id: number
  name: string
}

interface Rank {
  id: number
  date: Date
  position: number
  impressions: number
  clicks: number
  ctr: number
}

interface Product {
  id: number
  name: string
  category: Category
}

interface Keyword {
  id: number
  query: string
  priority: number
  targetUrl: string | null
  product: Product
  ranks: Rank[]
}

interface DashboardProps {
  categories: Category[]
  keywords: Keyword[]
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'High', color: 'bg-red-500' },
  2: { label: 'Medium', color: 'bg-yellow-500' },
  3: { label: 'Low', color: 'bg-green-500' },
}

export default function Dashboard({ categories, keywords }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null)

  const filteredKeywords = useMemo(() => {
    return keywords.filter((keyword) => {
      if (selectedCategory && keyword.product.category.id !== selectedCategory) {
        return false
      }
      if (selectedPriority && keyword.priority !== selectedPriority) {
        return false
      }
      return true
    })
  }, [keywords, selectedCategory, selectedPriority])

  const getLatestRank = (ranks: Rank[]) => {
    if (ranks.length === 0) return null
    return ranks[ranks.length - 1]
  }

  const getRankChange = (ranks: Rank[]) => {
    if (ranks.length < 2) return null
    const latest = ranks[ranks.length - 1].position
    const previous = ranks[ranks.length - 2].position
    return previous - latest // Positive means improved (lower rank is better)
  }

  return (
    <div>
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        selectedPriority={selectedPriority}
        onCategoryChange={setSelectedCategory}
        onPriorityChange={setSelectedPriority}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredKeywords.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <p className="text-xl">No keywords found</p>
            <p className="mt-2">Add keywords via Prisma Studio or adjust your filters</p>
          </div>
        ) : (
          filteredKeywords.map((keyword) => {
            const latestRank = getLatestRank(keyword.ranks)
            const rankChange = getRankChange(keyword.ranks)
            const priority = PRIORITY_LABELS[keyword.priority] || PRIORITY_LABELS[2]

            return (
              <div
                key={keyword.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate" title={keyword.query}>
                      {keyword.query}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {keyword.product.category.name} / {keyword.product.name}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${priority.color}`}
                  >
                    {priority.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-400">Current Rank</span>
                    <p className="text-2xl font-bold">
                      {latestRank ? Math.round(latestRank.position * 10) / 10 : '-'}
                    </p>
                  </div>
                  {rankChange !== null && (
                    <div>
                      <span className="text-sm text-gray-400">Change</span>
                      <p
                        className={`text-lg font-semibold ${
                          rankChange > 0
                            ? 'text-green-400'
                            : rankChange < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {rankChange > 0 ? '↑' : rankChange < 0 ? '↓' : '→'}{' '}
                        {Math.abs(Math.round(rankChange * 10) / 10)}
                      </p>
                    </div>
                  )}
                  {latestRank && (
                    <>
                      <div>
                        <span className="text-sm text-gray-400">Clicks</span>
                        <p className="text-lg font-semibold">{latestRank.clicks}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Impressions</span>
                        <p className="text-lg font-semibold">{latestRank.impressions}</p>
                      </div>
                    </>
                  )}
                </div>

                {keyword.ranks.length > 0 ? (
                  <RankChart
                    data={keyword.ranks.map((r) => ({
                      date: r.date.toISOString(),
                      position: r.position,
                    }))}
                    height={150}
                  />
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-gray-500">
                    No rank data yet
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
