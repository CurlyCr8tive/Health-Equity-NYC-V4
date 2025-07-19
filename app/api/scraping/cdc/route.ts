import { type NextRequest, NextResponse } from "next/server"
import { WebScraper, DATA_SOURCES, type CDCEndpoint } from "@/lib/web-scraper"

// CDC Data Scraping API
export async function GET(request: NextRequest) {
  const scraper = WebScraper.getInstance()
  const { searchParams } = new URL(request.url)

  const endpoint = (searchParams.get("endpoint") as CDCEndpoint) || "chronic_disease"
  const limit = Number.parseInt(searchParams.get("limit") || "1000")
  const state = searchParams.get("state") || "New York"
  const year = searchParams.get("year")

  try {
    console.log(`Scraping CDC data: ${endpoint}`)

    const baseUrl = DATA_SOURCES.CDC.baseUrl
    const endpointPath = DATA_SOURCES.CDC.endpoints[endpoint]

    // Build query parameters
    const params = new URLSearchParams({
      $limit: limit.toString(),
      $order: "year DESC",
    })

    // Add filters
    const whereConditions = []
    if (state) {
      whereConditions.push(`locationdesc='${state}'`)
    }
    if (year) {
      whereConditions.push(`year='${year}'`)
    }

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    const url = `${baseUrl}${endpointPath}?${params.toString()}`
    const rawData = await scraper.fetchWithRetry(url, {}, 3, 60) // Cache for 1 hour

    // Transform CDC data to our format
    const transformedData = transformCDCData(rawData, endpoint)

    return NextResponse.json({
      success: true,
      source: "CDC",
      endpoint,
      data: transformedData,
      metadata: {
        total_records: transformedData.length,
        last_updated: new Date().toISOString(),
        source_url: url,
        filters: { state, year, limit },
      },
    })
  } catch (error) {
    console.error("CDC scraping error:", error)

    return NextResponse.json(
      {
        success: false,
        source: "CDC",
        endpoint,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
        metadata: {
          total_records: 0,
          last_updated: new Date().toISOString(),
          error_details: error,
        },
      },
      { status: 500 },
    )
  }
}

function transformCDCData(rawData: any[], endpoint: CDCEndpoint): any[] {
  if (!Array.isArray(rawData)) return []

  const scraper = WebScraper.getInstance()

  switch (endpoint) {
    case "chronic_disease":
      return scraper.normalizeData(rawData, {
        id: "id",
        condition: "topic",
        location: "locationdesc",
        year: "year",
        dataValue: "datavalue",
        dataValueUnit: "datavalueunit",
        dataValueType: "datavaluetype",
        category: "category",
        measure: "measure",
        ageGroup: "stratification1",
        raceEthnicity: "stratification2",
        gender: "stratification3",
      })

    case "mortality":
      return scraper.normalizeData(rawData, {
        id: "id",
        cause: "leading_cause",
        location: "state",
        year: "year",
        deaths: "deaths",
        deathRate: "age_adjusted_death_rate",
        ageGroup: "age_group",
        raceEthnicity: "race_ethnicity",
      })

    case "environmental_health":
      return scraper.normalizeData(rawData, {
        id: "id",
        measure: "measure",
        location: "reportingjurisdiction",
        year: "year",
        value: "datavalue",
        unit: "unit",
        category: "category",
      })

    case "social_determinants":
      return scraper.normalizeData(rawData, {
        id: "id",
        indicator: "indicator",
        location: "location",
        year: "year",
        value: "value",
        category: "category",
        subpopulation: "subpopulation",
      })

    default:
      return rawData
  }
}
