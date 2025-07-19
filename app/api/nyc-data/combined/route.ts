import { type NextRequest, NextResponse } from "next/server"

// Enhanced logging for combined API
class CombinedAPILogger {
  private sessionId: string

  constructor() {
    this.sessionId = `combined-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  log(channel: string, message: string, extra?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${channel}] [${this.sessionId}] ${message}`, extra ? JSON.stringify(extra) : "")
  }
}

// Safe fetch wrapper that never throws
async function fetchSafe(url: string, logger: CombinedAPILogger, source: string): Promise<any> {
  try {
    logger.log("ENGINE", `Fetching ${source} data`, { url })

    const startTime = Date.now()
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
      headers: {
        Accept: "application/json",
        "User-Agent": "NYC-Health-Equity-Dashboard/1.0",
      },
    })
    const endTime = Date.now()

    if (!response.ok) {
      logger.log("WARN", `${source} fetch failed`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
      })
      return {
        success: false,
        data: [],
        error: `${source} API error: ${response.status}`,
        responseTime: endTime - startTime,
      }
    }

    const data = await response.json()
    logger.log("ENGINE", `${source} fetch successful`, {
      count: data.data?.length || 0,
      responseTime: endTime - startTime,
    })

    return { ...data, responseTime: endTime - startTime }
  } catch (error) {
    logger.log("ERROR", `${source} fetch error`, {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      data: [],
      error: `${source} API error: ${error instanceof Error ? error.message : String(error)}`,
      responseTime: 0,
    }
  }
}

export async function GET(request: NextRequest) {
  const logger = new CombinedAPILogger()

  try {
    logger.log("ENGINE", "Combined API request started")
    const startTime = Date.now()

    // Get base URL for internal API calls
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    // Fetch all data sources in parallel
    const [healthData, greenSpaceData, foodAccessData, snapAccessData] = await Promise.all([
      fetchSafe(`${baseUrl}/api/nyc-data/health`, logger, "Health"),
      fetchSafe(`${baseUrl}/api/nyc-data/green-space`, logger, "Green Space"),
      fetchSafe(`${baseUrl}/api/nyc-data/food-access`, logger, "Food Access"),
      fetchSafe(`${baseUrl}/api/nyc-data/snap-access`, logger, "SNAP Access"),
    ])

    const endTime = Date.now()
    const totalResponseTime = endTime - startTime

    // Calculate success metrics
    const sources = [
      { name: "health", data: healthData },
      { name: "greenSpace", data: greenSpaceData },
      { name: "foodAccess", data: foodAccessData },
      { name: "snapAccess", data: snapAccessData },
    ]

    const successfulSources = sources.filter((source) => source.data.success !== false)
    const failedSources = sources.filter((source) => source.data.success === false)

    const successRate = (successfulSources.length / sources.length) * 100
    const avgResponseTime = sources.reduce((sum, source) => sum + (source.data.responseTime || 0), 0) / sources.length

    // Combine all successful data
    const combinedResponse = {
      success: true,
      data: {
        health: healthData.success !== false ? healthData.data : [],
        greenSpace: greenSpaceData.success !== false ? greenSpaceData.data : [],
        foodAccess: foodAccessData.success !== false ? foodAccessData.data : [],
        snapAccess: snapAccessData.success !== false ? snapAccessData.data : [],
      },
      metadata: {
        sources: {
          health: {
            success: healthData.success !== false,
            count: healthData.data?.length || 0,
            error: healthData.error || null,
            responseTime: healthData.responseTime || 0,
            dataSource: healthData.metadata?.data_source || "unknown",
          },
          greenSpace: {
            success: greenSpaceData.success !== false,
            count: greenSpaceData.data?.length || 0,
            error: greenSpaceData.error || null,
            responseTime: greenSpaceData.responseTime || 0,
            dataSource: greenSpaceData.metadata?.data_source || "unknown",
          },
          foodAccess: {
            success: foodAccessData.success !== false,
            count: foodAccessData.data?.length || 0,
            error: foodAccessData.error || null,
            responseTime: foodAccessData.responseTime || 0,
            dataSource: foodAccessData.metadata?.data_source || "unknown",
          },
          snapAccess: {
            success: snapAccessData.success !== false,
            count: snapAccessData.data?.length || 0,
            error: snapAccessData.error || null,
            responseTime: snapAccessData.responseTime || 0,
            dataSource: snapAccessData.metadata?.data_source || "unknown",
          },
        },
        performance: {
          totalResponseTime,
          avgResponseTime,
          successRate,
          successfulSources: successfulSources.length,
          failedSources: failedSources.length,
        },
        dataFreshness: {
          health: healthData.metadata?.last_updated || null,
          greenSpace: greenSpaceData.metadata?.last_updated || null,
          foodAccess: foodAccessData.metadata?.last_updated || null,
          snapAccess: snapAccessData.metadata?.last_updated || null,
        },
        last_updated: new Date().toISOString(),
        session_id: logger["sessionId"],
      },
    }

    logger.log("ENGINE", "Combined API request completed", {
      totalResponseTime,
      successRate,
      successfulSources: successfulSources.map((s) => s.name),
      failedSources: failedSources.map((s) => s.name),
    })

    return NextResponse.json(combinedResponse)
  } catch (error) {
    logger.log("ERROR", "Combined API request failed", {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        data: {
          health: [],
          greenSpace: [],
          foodAccess: [],
          snapAccess: [],
        },
        error: "Combined API temporarily unavailable",
        metadata: {
          sources: {
            health: { success: false, count: 0, error: "Service unavailable", responseTime: 0, dataSource: "error" },
            greenSpace: {
              success: false,
              count: 0,
              error: "Service unavailable",
              responseTime: 0,
              dataSource: "error",
            },
            foodAccess: {
              success: false,
              count: 0,
              error: "Service unavailable",
              responseTime: 0,
              dataSource: "error",
            },
            snapAccess: {
              success: false,
              count: 0,
              error: "Service unavailable",
              responseTime: 0,
              dataSource: "error",
            },
          },
          performance: {
            totalResponseTime: 0,
            avgResponseTime: 0,
            successRate: 0,
            successfulSources: 0,
            failedSources: 4,
          },
          dataFreshness: {
            health: null,
            greenSpace: null,
            foodAccess: null,
            snapAccess: null,
          },
          last_updated: new Date().toISOString(),
          session_id: logger["sessionId"],
        },
      },
      { status: 500 },
    )
  }
}
