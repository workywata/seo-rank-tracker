import { NextRequest, NextResponse } from 'next/server'
import { GSCClient } from '@/lib/gsc-client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=No+authorization+code+received', request.url))
  }

  try {
    const client = new GSCClient()
    const tokens = await client.getTokens(code)

    // Delete existing tokens and save new ones to database
    await prisma.gscToken.deleteMany({})
    await prisma.gscToken.create({
      data: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || null,
        expiryDate: tokens.expiry_date || null,
        tokenType: tokens.token_type || null,
        scope: tokens.scope || null,
      }
    })

    return NextResponse.redirect(new URL('/?success=authenticated', request.url))
  } catch (err) {
    console.error('Error exchanging code for tokens:', err)
    return NextResponse.redirect(
      new URL('/?error=Failed+to+complete+authentication', request.url)
    )
  }
}
