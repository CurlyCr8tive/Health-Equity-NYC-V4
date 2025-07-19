import { type NextRequest, NextResponse } from "next/server"
import { WebScraper } from "@/lib/web-scraper"

// Data Scraping Orchestrator - Coordinates all data sources
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const sources = searchParams.get("sources")?.split(",") || ["cdc", "epiquery", "nyc"]
  const borough = searchParams.get("borough")
  const year = searchParams.get("year")
  const priority = searchParams.get("priority") || "balanced" // fast, balanced, comprehensive

  const startTime = Date.now()
  const sessionId = `orchestrator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  console.log(`[${sessionId}] Starting data orchestration for sources: ${sources.join(", ")}`)

  try {
    const baseUrl = getBaseUrl(request)
    const results: any = {
      success: true,
      sessionId,
      sources: {},
      summary: {
        totalSources: sources.length,
        successfulSources: 0,
        failedSources: 0,
        totalRecords: 0,
        executionTime: 0,
      },
      data: {
        health: [],
        environmental: [],
        social: [],
        geographic: [],
      },
    }

    // Configure scraping strategy based on priority
    const strategy = getScrapingStrategy(priority)

    // Execute scraping based on strategy
    if (strategy.parallel) {
      await executeParallelScraping(baseUrl, sources, { borough, year }, results, sessionId)
    } else {
      await executeSequentialScraping(baseUrl, sources, { borough, year }, results, sessionId)
    }

    // Calculate final metrics
    results.summary.executionTime = Date.now() - startTime
    results.summary.successfulSources = Object.values(results.sources).filter((s: any) => s.success).length
    results.summary.failedSources = results.summary.totalSources - results.summary.successfulSources
    results.summary.totalRecords = Object.values(results.data).reduce(
      (sum: number, arr: any) => sum + (arr?.length || 0),
      0,
    )

    console.log(`[${sessionId}] Orchestration completed:`, {
      executionTime: results.summary.executionTime,
      successRate: (results.summary.successfulSources / results.summary.totalSources) * 100,
      totalRecords: results.summary.totalRecords,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error(`[${sessionId}] Orchestration failed:`, error)

    return NextResponse.json(
      {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : "Unknown error",
        summary: {
          totalSources: sources.length,
          successfulSources: 0,
          failedSources: sources.length,
          totalRecords: 0,
          executionTime: Date.now() - startTime,
        },
        sources: {},
        data: { health: [], environmental: [], social: [], geographic: [] },
      },
      { status: 500 },
    )
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto") || "http"
  return `${protocol}://${host}`
}

function getScrapingStrategy(priority: string) {
  const strategies = {
    fast: {
      parallel: true,
      timeout: 10000,
      maxRetries: 1,
      cacheMinutes: 60,
    },
    balanced: {
      parallel: true,
      timeout: 30000,
      maxRetries: 2,
      cacheMinutes: 30,
    },
    comprehensive: {
      parallel: false,
      timeout: 60000,
      maxRetries: 3,
      cacheMinutes: 15,
    },
  }

  return strategies[priority as keyof typeof strategies] || strategies.balanced
}

async function executeParallelScraping(
  baseUrl: string,
  sources: string[],
  filters: any,
  results: any,
  sessionId: string,
) {
  const promises = sources.map((source) => scrapeSingleSource(baseUrl, source, filters, sessionId))
  const sourceResults = await Promise.allSettled(promises)

  sourceResults.forEach((result, index) => {
    const source = sources[index]

    if (result.status === "fulfilled") {
      results.sources[source] = result.value
      categorizeData(result.value.data, results.data, source)
    } else {
      results.sources[source] = {
        success: false,
        error: result.reason?.message || "Unknown error",
        data: [],
      }
    }
  })
}

async function executeSequentialScraping(
  baseUrl: string,
  sources: string[],
  filters: any,
  results: any,
  sessionId: string,
) {
  for (const source of sources) {
    try {
      const sourceResult = await scrapeSingleSource(baseUrl, source, filters, sessionId)
      results.sources[source] = sourceResult
      categorizeData(sourceResult.data, results.data, source)
    } catch (error) {
      results.sources[source] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      }
    }
  }
}

async function scrapeSingleSource(baseUrl: string, source: string, filters: any, sessionId: string): Promise<any> {
  const scraper = WebScraper.getInstance()

  const sourceConfigs = {
    cdc: {
      url: `${baseUrl}/api/scraping/cdc`,
      params: { endpoint: "chronic_disease", ...filters },
    },
    epiquery: {
      url: `${baseUrl}/api/scraping/epiquery`,
      params: { endpoint: "community_health", ...filters },
    },
    nyc: {
      url: `${baseUrl}/api/scraping/nyc-enhanced`,
      params: { endpoint: "health_outcomes", ...filters },
    },
  }

  const config = sourceConfigs[source as keyof typeof sourceConfigs]
  if (!config) {
    throw new Error(`Unknown source: ${source}`)
  }

  const params = new URLSearchParams(config.params)
  const url = `${config.url}?${params.toString()}`

  console.log(`[${sessionId}] Scraping ${source}: ${url}`)

  const response = await scraper.fetchWithRetry(url, {}, 2, 15)

  if (!response.success) {
    throw new Error(response.error || `Failed to scrape ${source}`)
  }

  return response
}

function categorizeData(data: any[], results: any, source: string) {
  if (!Array.isArray(data)) return

  data.forEach((item) => {
    // Categorize data based on content
    if (item.condition || item.indicator || item.cause) {
      results.health.push({ ...item, source })
    } else if (item.measure || item.value || item.aqi) {
      results.environmental.push({ ...item, source })
    } else if (item.geography || item.borough || item.coordinates) {
      results.geographic.push({ ...item, source })
    } else {
      results.social.push({ ...item, source })
    }
  })
}

// Health check endpoint for monitoring scraping services
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "health-check") {
    const scraper = WebScraper.getInstance()
    const baseUrl = getBaseUrl(request)

    const healthChecks = await Promise.allSettled([
      scraper.fetchWithRetry(`${baseUrl}/api/scraping/cdc?endpoint=chronic_disease&limit=1`, {}, 1, 1),
      scraper.fetchWithRetry(`${baseUrl}/api/scraping/epiquery?endpoint=community_health&limit=1`, {}, 1, 1),
      scraper.fetchWithRetry(`${baseUrl}/api/scraping/nyc-enhanced?endpoint=health_outcomes&limit=1`, {}, 1, 1),
    ])

    const status = {
      cdc: healthChecks[0].status === "fulfilled",
      epiquery: healthChecks[1].status === "fulfilled",
      nyc: healthChecks[2].status === "fulfilled",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      status,
      overall: Object.values(status).filter(Boolean).length >= 2, // At least 2 sources working
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
