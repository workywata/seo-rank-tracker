import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'High', color: 'bg-red-500' },
  2: { label: 'Medium', color: 'bg-yellow-500' },
  3: { label: 'Low', color: 'bg-green-500' },
}

async function getKeywords() {
  return prisma.keyword.findMany({
    include: {
      product: {
        include: {
          category: true,
        },
      },
      ranks: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: [
      { product: { category: { name: 'asc' } } },
      { product: { name: 'asc' } },
      { query: 'asc' },
    ],
  })
}

async function getStats() {
  const totalKeywords = await prisma.keyword.count()
  const totalRanks = await prisma.rank.count()
  const categories = await prisma.category.count()
  const products = await prisma.product.count()

  return { totalKeywords, totalRanks, categories, products }
}

export default async function KeywordsPage() {
  const keywords = await getKeywords()
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Keyword Management</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Keywords</p>
            <p className="text-2xl font-bold">{stats.totalKeywords}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Rank Records</p>
            <p className="text-2xl font-bold">{stats.totalRanks}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Categories</p>
            <p className="text-2xl font-bold">{stats.categories}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Products</p>
            <p className="text-2xl font-bold">{stats.products}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <FetchDataButton />
            <a
              href="http://localhost:5555"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md transition-colors"
            >
              Open Prisma Studio
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Use Prisma Studio to add/edit categories, products, and keywords. Run{' '}
            <code className="bg-gray-700 px-2 py-1 rounded">npx prisma studio</code> in
            the terminal.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Keyword
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Latest Rank
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Target URL
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No keywords found. Add keywords via Prisma Studio.
                  </td>
                </tr>
              ) : (
                keywords.map((keyword) => {
                  const priority = PRIORITY_LABELS[keyword.priority] || PRIORITY_LABELS[2]
                  const latestRank = keyword.ranks[0]

                  return (
                    <tr key={keyword.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 font-medium">{keyword.query}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {keyword.product.category.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {keyword.product.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${priority.color}`}
                        >
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {latestRank
                          ? Math.round(latestRank.position * 10) / 10
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 truncate max-w-xs">
                        {keyword.targetUrl || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

function FetchDataButton() {
  return (
    <form
      action={async () => {
        'use server'
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/gsc/fetch`, { method: 'POST' })
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
      >
        Fetch GSC Data (3 months)
      </button>
    </form>
  )
}
