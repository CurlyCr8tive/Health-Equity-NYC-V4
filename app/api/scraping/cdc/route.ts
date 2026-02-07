import { type NextRequest, NextResponse } from "next/server"
import { WebScraper, type CDCEndpoint } from "@/lib/web-scraper"

// CDC Data Scraping API
export async function GET(request: NextRequest) {
  const scraper = WebScraper.getInstance()
  const { searchParams } = new URL(request.url)

  const endpoint = (searchParams.get("endpoint") as CDCEndpoint) || "chronic_disease"
  const limit = Number.parseInt(searchParams.get("limit") || "1000")
  const state = searchParams.get("state") || "New York"
  const year = searchParams.get("year") || undefined

  try {
    console.log(`[CDC Scraper] Fetching CDC data: ${endpoint}`)

    const rawData = await scraper.fetchCDCData(endpoint, { state, year, limit })

    // Transform CDC data to our format
    const transformedData = transformCDCData(rawData, endpoint, scraper)

    return NextResponse.json({
      success: true,
      source: "CDC",
      endpoint,
      data: transformedData,
      metadata: {
        total_records: transformedData.length,
        raw_records: rawData.length,
        last_updated: new Date().toISOString(),
        filters: { state, year, limit },
      },
    })
  } catch (error) {
    console.error("[CDC Scraper] Error:", error)

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
        },
      },
      { status: 500 },
    )
  }
}

function transformCDCData(rawData: any[], endpoint: CDCEndpoint, scraper: WebScraper): any[] {
  if (!Array.isArray(rawData)) return []

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
