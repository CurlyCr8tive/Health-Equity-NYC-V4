import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const APP_TOKEN = process.env.NYC_OPEN_DATA_APP_TOKEN
    const DATASET_ID = "c3uy-2p5r" // Air Quality dataset
    const baseUrl = `https://data.cityofnewyork.us/resource/${DATASET_ID}.json`

    // Build query parameters
    const params = new URLSearchParams({
      $limit: "500",
      $order: "start_date DESC",
      $where: "geo_place_name IS NOT NULL AND data_value IS NOT NULL",
    })

    // First attempt: with app token
    let url = `${baseUrl}?${params.toString()}`
    if (APP_TOKEN) {
      url += `&$$app_token=${APP_TOKEN}`
    }

    console.log("Fetching air quality data from:", url.replace(APP_TOKEN || "", "[TOKEN]"))

    let response: Response

    try {
      // Try with token first
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "NYC-Health-Dashboard/1.0",
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      })

      // If 403 and we used a token, retry without token
      if (response.status === 403 && APP_TOKEN) {
        console.warn("Air Quality API: 403 with token, retrying without token...")
        const urlWithoutToken = `${baseUrl}?${params.toString()}`

        response = await fetch(urlWithoutToken, {
          headers: {
            Accept: "application/json",
            "User-Agent": "NYC-Health-Dashboard/1.0",
          },
          signal: AbortSignal.timeout(8000),
        })
      }

      if (!response.ok) {
        throw new Error(`NYC Air Quality API error: ${response.status}`)
      }
    } catch (fetchError) {
      console.error("NYC Air Quality API Error:", fetchError)
      // Return empty data instead of throwing
      return NextResponse.json({
        success: false,
        data: [],
        error: "Failed to fetch air quality data",
        timestamp: new Date().toISOString(),
      })
    }

    const rawData = await response.json()

    // Transform the data to our expected format
    const transformedData = Array.isArray(rawData)
      ? rawData
          .map((item: any) => ({
            type: "airQuality",
            name: item.geo_place_name || "Air Quality Monitor",
            borough: item.geo_place_name || "Unknown",
            neighborhood: item.geo_place_name || "Unknown",
            coordinates: [
              40.7128 + (Math.random() - 0.5) * 0.2, // Mock coordinates around NYC
              -74.006 + (Math.random() - 0.5) * 0.2,
            ],
            aqi: Math.round(Number.parseFloat(item.data_value) || 50),
            pollutant: item.name || "PM2.5",
            value: Number.parseFloat(item.data_value) || 0,
            unit: item.unit || "µg/m³",
            status: Number.parseFloat(item.data_value) > 35 ? "Unhealthy" : "Good",
            sampleDate: item.start_date || new Date().toISOString().split("T")[0],
            severity: Math.min(100, (Number.parseFloat(item.data_value) || 0) * 2), // Convert to 0-100 scale
          }))
          .filter((item: any) => item.aqi > 0)
      : []

    console.log(`Air Quality API: Successfully fetched ${transformedData.length} records`)

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("NYC Air Quality API Error:", error)

    return NextResponse.json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
    })
  }
}
