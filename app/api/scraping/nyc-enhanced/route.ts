import { type NextRequest, NextResponse } from "next/server"
import { WebScraper, DATA_SOURCES, type NYCEndpoint } from "@/lib/web-scraper"

// Enhanced NYC Open Data Scraping API
export async function GET(request: NextRequest) {
  const scraper = WebScraper.getInstance()
  const { searchParams } = new URL(request.url)

  const endpoint = (searchParams.get("endpoint") as NYCEndpoint) || "health_outcomes"
  const borough = searchParams.get("borough")
  const limit = Number.parseInt(searchParams.get("limit") || "2000")
  const year = searchParams.get("year")

  try {
    console.log(`Scraping NYC Open Data: ${endpoint}`)

    const baseUrl = DATA_SOURCES.NYC_OPEN_DATA.baseUrl
    const endpointPath = DATA_SOURCES.NYC_OPEN_DATA.endpoints[endpoint]

    // Build comprehensive query parameters
    const params = new URLSearchParams({
      $limit: limit.toString(),
      $order: getOrderByField(endpoint),
    })

    // Add filters based on endpoint
    const whereConditions = buildWhereConditions(endpoint, { borough, year })
    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    // Add NYC Open Data App Token if available
    if (process.env.NYC_OPEN_DATA_APP_TOKEN) {
      params.append("$$app_token", process.env.NYC_OPEN_DATA_APP_TOKEN)
    }

    const url = `${baseUrl}${endpointPath}?${params.toString()}`

    const rawData = await scraper.fetchWithRetry(
      url,
      {
        headers: {
          "X-App-Token": process.env.NYC_OPEN_DATA_APP_TOKEN || "",
        },
      },
      3,
      30,
    ) // Cache for 30 minutes

    // Transform NYC data to our format
    const transformedData = transformNYCData(rawData, endpoint)

    return NextResponse.json({
      success: true,
      source: "NYC Open Data",
      endpoint,
      data: transformedData,
      metadata: {
        total_records: transformedData.length,
        last_updated: new Date().toISOString(),
        source_url: url,
        filters: { borough, year, limit },
        data_freshness: calculateDataFreshness(transformedData),
      },
    })
  } catch (error) {
    console.error("NYC Open Data scraping error:", error)

    return NextResponse.json(
      {
        success: false,
        source: "NYC Open Data",
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

function getOrderByField(endpoint: NYCEndpoint): string {
  const orderFields: Record<NYCEndpoint, string> = {
    health_outcomes: "year DESC",
    air_quality: "start_date DESC",
    water_quality: "sample_date DESC",
    food_establishments: "inspection_date DESC",
    parks: "park_name ASC",
    snap_retailers: "business_name ASC",
    healthcare_facilities: "facility_name ASC",
    subway_stations: "name ASC",
  }

  return orderFields[endpoint] || "id DESC"
}

function buildWhereConditions(endpoint: NYCEndpoint, filters: any): string[] {
  const conditions: string[] = []

  // Common date filters
  if (filters.year) {
    const yearConditions: Record<NYCEndpoint, string> = {
      health_outcomes: `year='${filters.year}'`,
      air_quality: `start_date >= '${filters.year}-01-01T00:00:00.000'`,
      water_quality: `sample_date >= '${filters.year}-01-01T00:00:00.000'`,
      food_establishments: `inspection_date >= '${filters.year}-01-01T00:00:00.000'`,
      parks: "", // Parks don't have year filters
      snap_retailers: "",
      healthcare_facilities: "",
      subway_stations: "",
    }

    const yearCondition = yearConditions[endpoint]
    if (yearCondition) {
      conditions.push(yearCondition)
    }
  }

  // Borough filters
  if (filters.borough && filters.borough !== "allBoroughs") {
    const boroughConditions: Record<NYCEndpoint, string> = {
      health_outcomes: `geography='${filters.borough}'`,
      air_quality: `geo_place_name='${getBoroughCode(filters.borough)}'`,
      water_quality: `borough='${filters.borough.toUpperCase()}'`,
      food_establishments: `boro='${getBoroughCode(filters.borough)}'`,
      parks: `borough='${filters.borough}'`,
      snap_retailers: `borough='${filters.borough.toUpperCase()}'`,
      healthcare_facilities: `borough='${filters.borough.toUpperCase()}'`,
      subway_stations: `borough='${getSubwayBoroughCode(filters.borough)}'`,
    }

    const boroughCondition = boroughConditions[endpoint]
    if (boroughCondition) {
      conditions.push(boroughCondition)
    }
  }

  // Recent data filters
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const recentDate = threeMonthsAgo.toISOString().split("T")[0]

  if (endpoint === "air_quality") {
    conditions.push(`start_date >= '${recentDate}T00:00:00.000'`)
  } else if (endpoint === "water_quality") {
    conditions.push(`sample_date >= '${recentDate}T00:00:00.000'`)
  }

  return conditions
}

function getBoroughCode(borough: string): string {
  const codes: Record<string, string> = {
    Manhattan: "New York",
    Brooklyn: "Kings",
    Queens: "Queens",
    Bronx: "Bronx",
    "Staten Island": "Richmond",
  }
  return codes[borough] || borough
}

function getSubwayBoroughCode(borough: string): string {
  const codes: Record<string, string> = {
    Manhattan: "M",
    Brooklyn: "Bk",
    Queens: "Q",
    Bronx: "Bx",
    "Staten Island": "SI",
  }
  return codes[borough] || borough
}

function transformNYCData(rawData: any[], endpoint: NYCEndpoint): any[] {
  if (!Array.isArray(rawData)) return []

  const scraper = WebScraper.getInstance()

  switch (endpoint) {
    case "health_outcomes":
      return scraper.normalizeData(rawData, {
        id: "unique_id",
        condition: "leading_cause",
        geography: "geography",
        year: "year",
        deaths: "deaths",
        deathRate: "death_rate",
        ageAdjustedRate: "age_adjusted_death_rate",
        raceEthnicity: "race_ethnicity",
        sex: "sex",
      })

    case "air_quality":
      return scraper.normalizeData(rawData, {
        id: "unique_id",
        geography: "geo_place_name",
        measure: "name",
        value: "data_value",
        unit: "measure_info",
        startDate: "start_date",
        endDate: "end_date",
      })

    case "water_quality":
      return scraper.normalizeData(rawData, {
        id: "unique_key",
        sampleSite: "sample_site",
        borough: "borough",
        sampleDate: "sample_date",
        residualChlorine: "residual_free_chlorine_mg_l",
        turbidity: "turbidity_ntu",
        fluoride: "fluoride_mg_l",
        ph: "ph",
        coliform: "coliform_quanti_tray_mpn_100ml",
        ecoli: "e_coli_quanti_tray_mpn_100ml",
      })

    case "food_establishments":
      return scraper.normalizeData(rawData, {
        id: "camis",
        name: "dba",
        address: "building",
        street: "street",
        borough: "boro",
        zipCode: "zipcode",
        phone: "phone",
        cuisine: "cuisine_description",
        inspectionDate: "inspection_date",
        grade: "grade",
        score: "score",
        latitude: "latitude",
        longitude: "longitude",
      })

    case "parks":
      return scraper.normalizeData(rawData, {
        id: "gispropnum",
        name: "park_name",
        borough: "borough",
        acres: "acres",
        category: "typecategory",
        address: "address",
        communityBoard: "cb",
      })

    case "snap_retailers":
      return scraper.normalizeData(rawData, {
        id: "license_number",
        name: "business_name",
        address: "business_address",
        borough: "borough",
        zipCode: "postcode",
        licenseType: "license_type",
        industry: "industry",
      })

    case "healthcare_facilities":
      return scraper.normalizeData(rawData, {
        id: "facility_id",
        name: "facility_name",
        facilityType: "facility_type",
        address: "address",
        borough: "borough",
        zipCode: "zip_code",
        phone: "phone",
        website: "website",
      })

    case "subway_stations":
      return scraper.normalizeData(rawData, {
        id: "objectid",
        name: "name",
        borough: "borough",
        line: "line",
        ada: "ada",
        latitude: "gtfs_latitude",
        longitude: "gtfs_longitude",
      })

    default:
      return rawData
  }
}

function calculateDataFreshness(data: any[]): any {
  if (!data.length) return null

  const dates = data
    .map((item) => {
      const dateFields = ["year", "startDate", "sampleDate", "inspectionDate"]
      for (const field of dateFields) {
        if (item[field]) {
          return new Date(item[field])
        }
      }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())

  if (!dates.length) return null

  const mostRecent = dates[0]
  const oldest = dates[dates.length - 1]
  const now = new Date()
  const daysSinceUpdate = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))

  return {
    mostRecentDate: mostRecent.toISOString(),
    oldestDate: oldest.toISOString(),
    daysSinceUpdate,
    freshness: daysSinceUpdate < 7 ? "fresh" : daysSinceUpdate < 30 ? "recent" : "stale",
  }
}
