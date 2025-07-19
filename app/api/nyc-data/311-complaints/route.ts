import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const borough = searchParams.get("borough")
    const complaintType = searchParams.get("type")

    // NYC 311 Service Requests API
    const NYC_311_API = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
    const APP_TOKEN = process.env.NYC_OPEN_DATA_API_KEY

    const params = new URLSearchParams()
    params.append("$limit", "1000")
    params.append("$order", "created_date DESC")

    const whereConditions = []
    if (borough) {
      whereConditions.push(`borough='${borough.toUpperCase()}'`)
    }

    // Filter for health/environmental complaints
    const healthEnvironmentalTypes = [
      "Air Quality",
      "Water Quality",
      "Food Poisoning",
      "Rodent",
      "Unsanitary Condition",
      "Indoor Air Quality",
      "Lead",
    ]

    if (complaintType) {
      whereConditions.push(`complaint_type='${complaintType}'`)
    } else {
      const typeFilter = healthEnvironmentalTypes.map((type) => `complaint_type='${type}'`).join(" OR ")
      whereConditions.push(`(${typeFilter})`)
    }

    // Recent complaints only (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    whereConditions.push(`created_date >= '${sixMonthsAgo.toISOString()}'`)

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    if (APP_TOKEN) params.append("$$app_token", APP_TOKEN)

    const response = await fetch(`${NYC_311_API}?${params}`, {
      next: { revalidate: 3600 }, // 1 hour
    })

    if (!response.ok) {
      throw new Error(`NYC 311 API error: ${response.status}`)
    }

    const data = await response.json()
    const transformedData = data.map(transform311Data).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: "NYC 311 Service Requests",
      count: transformedData.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("NYC 311 API Error:", error)
    return NextResponse.json({
      success: false,
      data: [],
      source: "Mock Data (API Error)",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

function transform311Data(item: any) {
  if (!item.complaint_type || !item.latitude || !item.longitude) return null

  return {
    id: item.unique_key,
    complaintType: item.complaint_type,
    descriptor: item.descriptor,
    address: `${item.incident_address || ""}, ${item.borough || ""}`.trim(),
    borough: item.borough,
    zipCode: item.incident_zip,
    coordinates: [Number.parseFloat(item.latitude), Number.parseFloat(item.longitude)],
    type: "complaint",
    status: item.status,
    createdDate: item.created_date,
    closedDate: item.closed_date,
    agency: item.agency,
  }
}
