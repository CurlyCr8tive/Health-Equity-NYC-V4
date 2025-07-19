import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const borough = searchParams.get("borough")
    const zipCode = searchParams.get("zipCode")
    const overlay = searchParams.get("overlay") // foodDeserts, greenSpace, etc.

    // Return mock environmental data to avoid fetch errors
    const mockEnvironmentalData = {
      airQuality: [
        {
          id: "aq_1",
          type: "airQuality",
          borough: borough || "Brooklyn",
          zipCode: zipCode || "11212",
          coordinates: [40.6782, -73.9442],
          data: {
            aqi: 68,
            pollutant: "PM2.5",
            value: 15.2,
            status: "Moderate",
            unit: "μg/m³",
          },
        },
        {
          id: "aq_2",
          type: "airQuality",
          borough: borough || "Manhattan",
          zipCode: zipCode || "10001",
          coordinates: [40.7589, -73.9851],
          data: {
            aqi: 72,
            pollutant: "NO2",
            value: 28.5,
            status: "Moderate",
            unit: "ppb",
          },
        },
      ],
      parks: [
        {
          id: "park_1",
          type: "greenSpace",
          borough: borough || "Brooklyn",
          coordinates: [40.6892, -73.9442],
          data: {
            name: "Prospect Park",
            address: "95 Prospect Park W, Brooklyn, NY 11215",
            type: "greenSpace",
            acres: 526,
          },
        },
        {
          id: "park_2",
          type: "greenSpace",
          borough: borough || "Manhattan",
          coordinates: [40.7829, -73.9654],
          data: {
            name: "Central Park",
            address: "New York, NY 10024",
            type: "greenSpace",
            acres: 843,
          },
        },
      ],
      foodAccess: [
        {
          id: "food_1",
          type: "foodDeserts",
          borough: borough || "Brooklyn",
          coordinates: [40.6782, -73.9442],
          data: {
            name: "Food Desert Area",
            type: "foodDeserts",
            riskLevel: "High",
            details: { distance_to_supermarket: 1.2 },
          },
        },
        {
          id: "snap_1",
          type: "snapAccess",
          borough: borough || "Queens",
          coordinates: [40.7282, -73.7949],
          data: {
            name: "SNAP Retailer",
            address: "123 Main St, Queens, NY",
            type: "snapAccess",
            details: { accepts_snap: true },
          },
        },
      ],
    }

    // Combine all environmental data
    const combinedData = [
      ...mockEnvironmentalData.airQuality,
      ...mockEnvironmentalData.parks,
      ...mockEnvironmentalData.foodAccess,
    ]

    return NextResponse.json({
      success: true,
      data: combinedData,
      parks: mockEnvironmentalData.parks,
      foodAccess: mockEnvironmentalData.foodAccess,
      sources: ["Mock Data - Environmental"],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Environmental API Error:", error)

    return NextResponse.json({
      success: false,
      data: [],
      parks: [],
      foodAccess: [],
      source: "Mock Data (API Error)",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
