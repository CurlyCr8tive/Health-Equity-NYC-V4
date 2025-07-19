import { type NextRequest, NextResponse } from "next/server"

// CDC Health Data API Route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Extract query parameters
  const limit = searchParams.get("limit") || "1000"
  const state = searchParams.get("state") || "New York"
  const condition = searchParams.get("condition")
  const year = searchParams.get("year")
  const borough = searchParams.get("borough")

  try {
    console.log("Fetching CDC health data...")

    // Build CDC API URL with parameters
    const cdcUrl = new URL("https://data.cdc.gov/resource/55yu-xksw.json")

    // Add query parameters
    cdcUrl.searchParams.append("$limit", limit)
    cdcUrl.searchParams.append("$order", "year DESC")

    // Build where conditions
    const whereConditions = []

    // Filter by state (New York)
    if (state) {
      whereConditions.push(`locationdesc='${state}'`)
    }

    // Filter by specific health condition if provided
    if (condition && condition !== "allConditions") {
      whereConditions.push(`topic='${condition}'`)
    }

    // Filter by year if provided
    if (year) {
      whereConditions.push(`year='${year}'`)
    }

    // Add where clause if we have conditions
    if (whereConditions.length > 0) {
      cdcUrl.searchParams.append("$where", whereConditions.join(" AND "))
    }

    console.log("CDC API URL:", cdcUrl.toString())

    // Fetch data from CDC
    const response = await fetch(cdcUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Health-Equity-NYC-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`CDC API error: ${response.status} ${response.statusText}`)
    }

    const rawData = await response.json()
    console.log(`Fetched ${rawData.length} records from CDC`)

    // Transform CDC data to our format
    const transformedData = transformCDCHealthData(rawData, borough)

    // Calculate summary statistics
    const stats = calculateHealthStats(transformedData)

    return NextResponse.json({
      success: true,
      source: "CDC",
      data: transformedData,
      stats,
      metadata: {
        total_records: transformedData.length,
        raw_records: rawData.length,
        last_updated: new Date().toISOString(),
        source_url: cdcUrl.toString(),
        filters: { state, condition, year, borough, limit },
      },
    })
  } catch (error) {
    console.error("CDC API fetch error:", error)

    // Return mock data as fallback
    const mockData = getMockCDCData(condition, borough)
    const stats = calculateHealthStats(mockData)

    return NextResponse.json({
      success: false,
      source: "CDC_MOCK",
      error: error instanceof Error ? error.message : "Unknown error",
      data: mockData,
      stats,
      metadata: {
        total_records: mockData.length,
        last_updated: new Date().toISOString(),
        is_mock: true,
        error_details: error,
      },
    })
  }
}

// Transform CDC data to our dashboard format
function transformCDCHealthData(rawData: any[], filterBorough?: string): any[] {
  if (!Array.isArray(rawData)) return []

  return rawData
    .map((item: any) => {
      try {
        // Extract key fields from CDC data
        const condition = item.topic || item.question || "Unknown Condition"
        const dataValue = Number.parseFloat(item.datavalue || item.data_value || "0")
        const year = Number.parseInt(item.year || new Date().getFullYear().toString())

        // Map CDC location to NYC boroughs
        const borough = mapLocationToBorough(item.locationdesc, item.geolocation)

        // Skip if we're filtering by borough and this doesn't match
        if (filterBorough && filterBorough !== "allBoroughs" && borough !== filterBorough) {
          return null
        }

        return {
          id: `cdc_${item.year}_${item.topic}_${borough}`.replace(/\s+/g, "_"),
          condition: condition,
          borough: borough,
          neighborhood: item.geolocation?.city || borough,
          rate: dataValue,
          cases: Number.parseInt(item.sample_size || "0"),
          population: Number.parseInt(item.population || "100000"),
          ageGroup: item.stratification1 || "All Ages",
          raceEthnicity: item.stratification2 || "All Groups",
          gender: item.stratification3 || "All Genders",
          year: year,
          dataSource: "CDC",
          measure: item.measure || "Prevalence",
          unit: item.datavalueunit || "%",
          confidence_interval:
            item.confidence_limit_low && item.confidence_limit_high
              ? `${item.confidence_limit_low}-${item.confidence_limit_high}`
              : null,
        }
      } catch (error) {
        console.error("Error transforming CDC record:", error, item)
        return null
      }
    })
    .filter(Boolean) // Remove null entries
    .slice(0, 500) // Limit results for performance
}

// Map CDC location data to NYC boroughs
function mapLocationToBorough(locationDesc: string, geolocation?: any): string {
  if (!locationDesc) return "Unknown"

  const location = locationDesc.toLowerCase()

  // Direct borough matches
  if (location.includes("manhattan") || location.includes("new york county")) return "Manhattan"
  if (location.includes("brooklyn") || location.includes("kings county")) return "Brooklyn"
  if (location.includes("queens") || location.includes("queens county")) return "Queens"
  if (location.includes("bronx") || location.includes("bronx county")) return "Bronx"
  if (location.includes("staten island") || location.includes("richmond county")) return "Staten Island"

  // If it's New York state/city level data, distribute across boroughs
  if (location.includes("new york")) {
    // Use geolocation or distribute randomly for demo
    const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
    return boroughs[Math.floor(Math.random() * boroughs.length)]
  }

  return "NYC" // Default for city-wide data
}

// Calculate summary statistics
function calculateHealthStats(data: any[]) {
  if (!data.length) {
    return {
      totalRecords: 0,
      averageRate: 0,
      highestRate: 0,
      lowestRate: 0,
      conditionsCount: 0,
      boroughsCount: 0,
      topConditions: [],
      boroughBreakdown: {},
    }
  }

  const rates = data.map((item) => item.rate).filter((rate) => !isNaN(rate))
  const conditions = [...new Set(data.map((item) => item.condition))]
  const boroughs = [...new Set(data.map((item) => item.borough))]

  // Calculate top conditions by average rate
  const conditionStats = conditions
    .map((condition) => {
      const conditionData = data.filter((item) => item.condition === condition)
      const avgRate = conditionData.reduce((sum, item) => sum + item.rate, 0) / conditionData.length
      return { condition, avgRate, count: conditionData.length }
    })
    .sort((a, b) => b.avgRate - a.avgRate)

  // Calculate borough breakdown
  const boroughBreakdown = boroughs.reduce(
    (acc, borough) => {
      const boroughData = data.filter((item) => item.borough === borough)
      const avgRate = boroughData.reduce((sum, item) => sum + item.rate, 0) / boroughData.length
      acc[borough] = {
        count: boroughData.length,
        avgRate: Number.parseFloat(avgRate.toFixed(1)),
      }
      return acc
    },
    {} as Record<string, any>,
  )

  return {
    totalRecords: data.length,
    averageRate: Number.parseFloat((rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1)),
    highestRate: Number.parseFloat(Math.max(...rates).toFixed(1)),
    lowestRate: Number.parseFloat(Math.min(...rates).toFixed(1)),
    conditionsCount: conditions.length,
    boroughsCount: boroughs.length,
    topConditions: conditionStats.slice(0, 5),
    boroughBreakdown,
  }
}

// Mock data fallback
function getMockCDCData(condition?: string, borough?: string): any[] {
  const conditions = ["Diabetes", "Hypertension", "Asthma", "Obesity", "Heart Disease"]
  const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  const mockData = []

  const targetConditions = condition && condition !== "allConditions" ? [condition] : conditions
  const targetBoroughs = borough && borough !== "allBoroughs" ? [borough] : boroughs

  for (const cond of targetConditions) {
    for (const boro of targetBoroughs) {
      mockData.push({
        id: `mock_${cond}_${boro}`,
        condition: cond,
        borough: boro,
        neighborhood: boro,
        rate: 5 + Math.random() * 20, // Random rate between 5-25%
        cases: Math.floor(Math.random() * 1000) + 100,
        population: 100000,
        ageGroup: "All Ages",
        raceEthnicity: "All Groups",
        gender: "All Genders",
        year: 2023,
        dataSource: "CDC_MOCK",
        measure: "Prevalence",
        unit: "%",
      })
    }
  }

  return mockData
}
