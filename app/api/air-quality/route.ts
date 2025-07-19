import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const borough = searchParams.get("borough")
    const zipCode = searchParams.get("zipCode")

    // NYC Open Data Air Quality API endpoint
    const NYC_AIR_QUALITY_API = "https://data.cityofnewyork.us/resource/c3uy-2p5r.json"
    const APP_TOKEN = process.env.NYC_OPEN_DATA_API_KEY

    // Build SODA query parameters
    const params = new URLSearchParams()
    params.append("$limit", "1000")
    params.append("$order", "start_date DESC")

    // Add filters
    const whereConditions = []
    if (borough) {
      // NYC data uses different borough naming, so we need to map them
      const boroughMapping: Record<string, string> = {
        Manhattan: "New York",
        Brooklyn: "Kings",
        Queens: "Queens",
        Bronx: "Bronx",
        "Staten Island": "Richmond",
      }
      const nycBoroughName = boroughMapping[borough] || borough
      whereConditions.push(`geo_place_name='${nycBoroughName}'`)
    }

    if (zipCode) {
      whereConditions.push(`geo_entity_id='${zipCode}'`)
    }

    // Filter for recent data (last 2 years)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    whereConditions.push(`start_date >= '${twoYearsAgo.toISOString().split("T")[0]}'`)

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    if (APP_TOKEN) {
      params.append("$$app_token", APP_TOKEN)
    }

    const response = await fetch(`${NYC_AIR_QUALITY_API}?${params}`, {
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`NYC Air Quality API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform the NYC air quality data to our expected format
    const transformedData = data.map(transformNYCAirQualityData).filter(Boolean)

    // Return mock air quality data
    const mockAirQualityData = [
      {
        id: "aq_brooklyn_1",
        borough: borough || "Brooklyn",
        zipCode: zipCode || "11212",
        coordinates: [40.6782, -73.9442],
        aqi: 68,
        pollutant: "PM2.5",
        value: 15.2,
        status: "Moderate",
        unit: "μg/m³",
        timestamp: new Date().toISOString(),
      },
      {
        id: "aq_manhattan_1",
        borough: borough || "Manhattan",
        zipCode: zipCode || "10001",
        coordinates: [40.7589, -73.9851],
        aqi: 72,
        pollutant: "NO2",
        value: 28.5,
        status: "Moderate",
        unit: "ppb",
        timestamp: new Date().toISOString(),
      },
      {
        id: "aq_queens_1",
        borough: borough || "Queens",
        zipCode: zipCode || "11101",
        coordinates: [40.7282, -73.7949],
        aqi: 65,
        pollutant: "O3",
        value: 0.068,
        status: "Moderate",
        unit: "ppm",
        timestamp: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      success: true,
      data: transformedData.length > 0 ? transformedData : mockAirQualityData,
      source: transformedData.length > 0 ? "NYC Open Data - Air Quality" : "Mock Air Quality Data",
      count: transformedData.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Air Quality API Error:", error)

    return NextResponse.json({
      success: false,
      data: [],
      source: "Mock Data (API Error)",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

function transformNYCAirQualityData(item: any) {
  if (!item || !item.geo_place_name) return null

  // Map NYC borough names back to our standard names
  const boroughMapping: Record<string, string> = {
    "New York": "Manhattan",
    Kings: "Brooklyn",
    Queens: "Queens",
    Bronx: "Bronx",
    Richmond: "Staten Island",
  }

  const borough = boroughMapping[item.geo_place_name] || item.geo_place_name

  // Extract pollutant data
  const pollutantValue = Number.parseFloat(item.data_value || 0)
  const pollutantName = item.name || item.measure || "Unknown"

  // Calculate estimated AQI based on pollutant type and value
  let estimatedAQI = 50 // Default moderate

  if (pollutantName.toLowerCase().includes("pm2.5")) {
    estimatedAQI = calculatePM25AQI(pollutantValue)
  } else if (pollutantName.toLowerCase().includes("ozone") || pollutantName.toLowerCase().includes("o3")) {
    estimatedAQI = calculateOzoneAQI(pollutantValue)
  } else if (pollutantName.toLowerCase().includes("no2")) {
    estimatedAQI = calculateNO2AQI(pollutantValue)
  }

  return {
    id: item.unique_id || `${item.geo_entity_id}_${item.start_date}`,
    borough: borough,
    zipCode: item.geo_entity_id,
    aqi: Math.round(estimatedAQI),
    pollutant: pollutantName,
    value: pollutantValue,
    unit: item.measure_info || "μg/m³",
    date: item.start_date,
    coordinates: getDefaultBoroughCoordinates(borough),
    status: getAQIStatus(estimatedAQI),
    dataSource: "NYC DOHMH",
    geoType: item.geo_type_name,
  }
}

function calculatePM25AQI(pm25: number): number {
  // EPA AQI calculation for PM2.5 (24-hour average)
  if (pm25 <= 12.0) return (50 / 12.0) * pm25
  if (pm25 <= 35.4) return 50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1)
  if (pm25 <= 55.4) return 100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5)
  if (pm25 <= 150.4) return 150 + ((200 - 150) / (150.4 - 55.5)) * (pm25 - 55.5)
  if (pm25 <= 250.4) return 200 + ((300 - 200) / (250.4 - 150.5)) * (pm25 - 150.5)
  return 300 + ((500 - 300) / (500.4 - 250.5)) * (pm25 - 250.5)
}

function calculateOzoneAQI(ozone: number): number {
  // Simplified ozone AQI calculation (8-hour average in ppm)
  const ozonePPB = ozone * 1000 // Convert to ppb if needed
  if (ozonePPB <= 54) return (50 / 54) * ozonePPB
  if (ozonePPB <= 70) return 50 + ((100 - 50) / (70 - 55)) * (ozonePPB - 55)
  if (ozonePPB <= 85) return 100 + ((150 - 100) / (85 - 71)) * (ozonePPB - 71)
  if (ozonePPB <= 105) return 150 + ((200 - 150) / (105 - 86)) * (ozonePPB - 86)
  return 200 + ((300 - 200) / (200 - 106)) * (ozonePPB - 106)
}

function calculateNO2AQI(no2: number): number {
  // Simplified NO2 AQI calculation
  if (no2 <= 53) return (50 / 53) * no2
  if (no2 <= 100) return 50 + ((100 - 50) / (100 - 54)) * (no2 - 54)
  if (no2 <= 360) return 100 + ((150 - 100) / (360 - 101)) * (no2 - 101)
  return 150 + ((200 - 150) / (649 - 361)) * (no2 - 361)
}

function getAQIStatus(aqi: number): string {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

function getDefaultBoroughCoordinates(borough: string): [number, number] {
  const coordinates: Record<string, [number, number]> = {
    Manhattan: [40.7831, -73.9712],
    Brooklyn: [40.6782, -73.9442],
    Queens: [40.7282, -73.7949],
    Bronx: [40.8448, -73.8648],
    "Staten Island": [40.5795, -74.1502],
  }
  return coordinates[borough] || [40.7128, -74.006]
}
