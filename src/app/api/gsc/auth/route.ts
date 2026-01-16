import { NextResponse } from 'next/server'
import { GSCClient } from '@/lib/gsc-client'

export async function GET() {
  try {
    const client = new GSCClient()
    const authUrl = client.getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication URL. Check GSC credentials.' },
      { status: 500 }
    )
  }
}
