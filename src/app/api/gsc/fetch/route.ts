import { NextRequest, NextResponse } from 'next/server'
import { subMonths, subDays, format } from 'date-fns'
import { GSCClient } from '@/lib/gsc-client'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if authenticated
    const isAuthenticated = await GSCClient.isAuthenticated()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Not authenticated. Please authenticate via /api/gsc/auth' },
        { status: 401 }
      )
    }

    // Get client from database tokens
    const client = await GSCClient.fromDatabase()

    // Get request body for optional parameters
    let siteUrl: string | undefined
    let months = 3

    try {
      const body = await request.json()
      siteUrl = body.siteUrl
      months = body.months || 3
    } catch {
      // No body or invalid JSON, use defaults
    }

    // If no siteUrl provided, get the first site
    if (!siteUrl) {
      const sites = await client.getSiteList()
      if (sites.length === 0) {
        return NextResponse.json(
          { error: 'No sites found in Search Console' },
          { status: 404 }
        )
      }
      siteUrl = sites[0]
    }

    // Calculate date range (3 months ago to 2 days ago - GSC data delay)
    const endDate = subDays(new Date(), 2)
    const startDate = subMonths(endDate, months)

    // Get all registered keywords from database
    const keywords = await prisma.keyword.findMany({
      select: {
        id: true,
        query: true,
      },
    })

    if (keywords.length === 0) {
      return NextResponse.json(
        { message: 'No keywords registered. Add keywords first.' },
        { status: 200 }
      )
    }

    // Create a map for quick keyword lookup
    const keywordMap = new Map(keywords.map((k) => [k.query.toLowerCase(), k.id]))

    // Fetch search analytics data
    const analyticsData = await client.fetchSearchAnalytics(
      siteUrl,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
      ['query', 'date']
    )

    // Process and store matching data
    let matchedCount = 0
    let upsertedCount = 0

    for (const row of analyticsData) {
      const query = row.keys[0]?.toLowerCase()
      const dateStr = row.keys[1]

      const keywordId = keywordMap.get(query)
      if (!keywordId) {
        continue
      }

      matchedCount++

      // Upsert rank data
      await prisma.rank.upsert({
        where: {
          keywordId_date: {
            keywordId,
            date: new Date(dateStr),
          },
        },
        update: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
        },
        create: {
          keywordId,
          date: new Date(dateStr),
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
        },
      })

      upsertedCount++
    }

    return NextResponse.json({
      success: true,
      siteUrl,
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      totalRows: analyticsData.length,
      matchedKeywords: matchedCount,
      upsertedRecords: upsertedCount,
    })
  } catch (error) {
    console.error('Error fetching GSC data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch yesterday's data (for cron job)
export async function GET() {
  try {
    const isAuthenticated = await GSCClient.isAuthenticated()
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const client = await GSCClient.fromDatabase()
    const sites = await client.getSiteList()
    if (sites.length === 0) {
      return NextResponse.json(
        { error: 'No sites found' },
        { status: 404 }
      )
    }

    const siteUrl = sites[0]

    // Fetch only yesterday's data (GSC has 2-day delay, so fetch 3 days ago to be safe)
    const targetDate = subDays(new Date(), 3)
    const dateStr = format(targetDate, 'yyyy-MM-dd')

    const keywords = await prisma.keyword.findMany({
      select: { id: true, query: true },
    })

    if (keywords.length === 0) {
      return NextResponse.json({ message: 'No keywords registered' })
    }

    const keywordMap = new Map(keywords.map((k) => [k.query.toLowerCase(), k.id]))

    const analyticsData = await client.fetchSearchAnalytics(
      siteUrl,
      dateStr,
      dateStr,
      ['query', 'date']
    )

    let upsertedCount = 0
    for (const row of analyticsData) {
      const query = row.keys[0]?.toLowerCase()
      const rowDate = row.keys[1]
      const keywordId = keywordMap.get(query)

      if (!keywordId) continue

      await prisma.rank.upsert({
        where: {
          keywordId_date: {
            keywordId,
            date: new Date(rowDate),
          },
        },
        update: {
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
        },
        create: {
          keywordId,
          date: new Date(rowDate),
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
        },
      })
      upsertedCount++
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      upsertedRecords: upsertedCount,
    })
  } catch (error) {
    console.error('Error in daily fetch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch' },
      { status: 500 }
    )
  }
}
