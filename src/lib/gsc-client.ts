import { google, searchconsole_v1 } from 'googleapis'
import { prisma } from './prisma'

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

export interface GSCCredentials {
  access_token: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date?: number
}

export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export class GSCClient {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>
  private searchConsole: searchconsole_v1.Searchconsole

  constructor(tokens?: GSCCredentials) {
    const clientId = process.env.GSC_CLIENT_ID
    const clientSecret = process.env.GSC_CLIENT_SECRET
    const redirectUri = process.env.GSC_REDIRECT_URI || 'http://localhost:3000/api/gsc/auth/callback'

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    if (tokens) {
      this.oauth2Client.setCredentials(tokens)
    }

    this.searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client })
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    })
  }

  async getTokens(code: string): Promise<GSCCredentials> {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens as GSCCredentials
  }

  static async fromDatabase(): Promise<GSCClient> {
    const tokenRecord = await prisma.gscToken.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!tokenRecord) {
      throw new Error('No GSC tokens found. Please authenticate first.')
    }

    const tokens: GSCCredentials = {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken || undefined,
      expiry_date: tokenRecord.expiryDate ? Number(tokenRecord.expiryDate) : undefined,
      token_type: tokenRecord.tokenType || undefined,
      scope: tokenRecord.scope || undefined,
    }

    return new GSCClient(tokens)
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const tokenRecord = await prisma.gscToken.findFirst()
      return !!tokenRecord
    } catch {
      return false
    }
  }

  async getSiteList(): Promise<string[]> {
    const response = await this.searchConsole.sites.list()
    return response.data.siteEntry?.map((site) => site.siteUrl || '') || []
  }

  async fetchSearchAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query', 'date']
  ): Promise<SearchAnalyticsRow[]> {
    const allRows: SearchAnalyticsRow[] = []
    let startRow = 0
    const rowLimit = 25000

    while (true) {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow,
        },
      })

      const rows = response.data.rows as SearchAnalyticsRow[] | undefined
      if (!rows || rows.length === 0) {
        break
      }

      allRows.push(...rows)

      if (rows.length < rowLimit) {
        break
      }

      startRow += rowLimit
    }

    return allRows
  }
}

export default GSCClient
