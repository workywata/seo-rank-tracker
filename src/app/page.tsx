import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { GSCClient } from '@/lib/gsc-client'
import Dashboard from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

async function getKeywordsWithRanks() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  return prisma.keyword.findMany({
    include: {
      product: {
        include: {
          category: true,
        },
      },
      ranks: {
        where: {
          date: {
            gte: threeMonthsAgo,
          },
        },
        orderBy: {
          date: 'asc',
        },
      },
    },
    orderBy: [
      { priority: 'asc' },
      { query: 'asc' },
    ],
  })
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const isAuthenticated = await GSCClient.isAuthenticated()
  const categories = await getCategories()
  const keywords = await getKeywordsWithRanks()

  const success = params.success
  const error = params.error

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">SEO Rank Tracker</h1>
            <nav className="flex gap-4">
              <a
                href="/keywords"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Manage Keywords
              </a>
              {!isAuthenticated && (
                <a
                  href="/api/gsc/auth"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
                >
                  Connect GSC
                </a>
              )}
            </nav>
          </div>

          {success === 'authenticated' && (
            <div className="mt-4 p-4 bg-green-800 rounded-md">
              Successfully connected to Google Search Console!
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-800 rounded-md">
              Error: {decodeURIComponent(error as string)}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-4 p-4 bg-yellow-800 rounded-md">
              Please connect your Google Search Console account to start tracking rankings.
            </div>
          )}
        </header>

        <Suspense fallback={<div>Loading...</div>}>
          <Dashboard categories={categories} keywords={keywords} />
        </Suspense>
      </div>
    </main>
  )
}
