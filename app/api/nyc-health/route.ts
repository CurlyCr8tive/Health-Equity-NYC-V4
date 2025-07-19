import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const condition = searchParams.get("condition")
    const borough = searchParams.get("borough")
    const ageGroup = searchParams.get("ageGroup")
    const raceEthnicity = searchParams.get("raceEthnicity")

    // NYC Open Data SODA API endpoint for health data
    const NYC_HEALTH_API = "https://data.cityofnewyork.us/resource/jb7j-dtam.json"
    const APP_TOKEN = process.env.NYC_OPEN_DATA_API_KEY

    // Build SODA query
    const params = new URLSearchParams()
    params.append("$limit", "1000")

    // Add filters
    const whereConditions = []
    if (condition) whereConditions.push(`health_topic='${condition}'`)
    if (borough) whereConditions.push(`geo_entity_name='${borough}'`)
    if (ageGroup) whereConditions.push(`age_group='${ageGroup}'`)
    if (raceEthnicity) whereConditions.push(`race_ethnicity='${raceEthnicity}'`)

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    if (APP_TOKEN) {
      params.append("$$app_token", APP_TOKEN)
    }

    const response = await fetch(`${NYC_HEALTH_API}?${params}`, {
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 6 hours
      next: { revalidate: 21600 },
    })

    if (!response.ok) {
      throw new Error(`NYC Open Data API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform NYC Open Data to our format
    const transformedData = data.map(transformNYCHealthData)

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: "NYC Open Data",
      count: transformedData.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("NYC Health API Error:", error)

    // Import mock data as fallback
    const { mockHealthData } = await import("@/lib/mock-data")

    return NextResponse.json({
      success: false,
      data: mockHealthData,
      source: "Mock Data (API Error)",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

function transformNYCHealthData(item: any) {
  return {
    id: item.unique_id || Math.random().toString(36),
    borough: item.geo_entity_name || item.borough,
    condition: item.health_topic || item.indicator_name,
    rate: Number.parseFloat(item.data_value || item.rate || 0),
    ageGroup: item.age_group || "All Ages",
    raceEthnicity: item.race_ethnicity || "All Groups",
    year: Number.parseInt(item.time_period || item.year || new Date().getFullYear()),
    zipCode: item.geo_entity_id,
    dataSource: "NYC DOHMH",
    confidence: item.confidence_interval,
    sampleSize: item.sample_size,
  }
}
