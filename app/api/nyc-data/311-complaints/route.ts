import { type NextRequest, NextResponse } from "next/server"

// Enhanced logging for 311 complaints API
class ComplaintsAPILogger {
  private sessionId: string

  constructor() {
    this.sessionId = `311-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  log(channel: string, message: string, extra?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${channel}] [${this.sessionId}] ${message}`, extra ? JSON.stringify(extra) : "")
  }
}

// Safe fetch wrapper with comprehensive error handling
async function fetchNYC311Data(logger: ComplaintsAPILogger): Promise<any> {
  const baseUrl = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"

  // Query parameters for health-related complaints
  const params = new URLSearchParams({
    $limit: "1000",
    $where:
      "complaint_type IN('Air Quality', 'Water Quality', 'Noise - Residential', 'Food Poisoning', 'Rodent', 'Unsanitary Condition')",
    $order: "created_date DESC",
    $$app_token: process.env.NYC_OPEN_DATA_APP_TOKEN || "",
  })

  const url = `${baseUrl}?${params.toString()}`

  try {
    logger.log("ENGINE", "Fetching NYC 311 complaints data", { url: baseUrl })

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        Accept: "application/json",
        "User-Agent": "NYC-Health-Equity-Dashboard/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const endTime = Date.now()

    if (!response.ok) {
      logger.log("WARN", "NYC 311 API fetch failed", {
        status: response.status,
        statusText: response.statusText,
        responseTime: endTime - startTime,
      })
      return {
        success: false,
        data: [],
        error: `NYC 311 API error: ${response.status}`,
        responseTime: endTime - startTime,
      }
    }

    const data = await response.json()
    logger.log("ENGINE", "NYC 311 fetch successful", {
      count: data.length,
      responseTime: endTime - startTime,
    })

    // Transform and validate data
    const transformedData = data.map((complaint: any, index: number) => ({
      id: complaint.unique_key || `complaint_${index}`,
      complaintType: complaint.complaint_type || "Unknown",
      descriptor: complaint.descriptor || "",
      borough: complaint.borough || "Unknown",
      neighborhood: complaint.incident_address || "",
      zipCode: complaint.incident_zip || "",
      createdDate: complaint.created_date || new Date().toISOString(),
      status: complaint.status || "Open",
      agency: complaint.agency || "Unknown",
      latitude: complaint.latitude ? Number.parseFloat(complaint.latitude) : null,
      longitude: complaint.longitude ? Number.parseFloat(complaint.longitude) : null,
      healthRelevance: getHealthRelevanceScore(complaint.complaint_type),
    }))

    return {
      success: true,
      data: transformedData,
      metadata: {
        total_records: transformedData.length,
        data_source: "NYC Open Data - 311 Service Requests",
        last_updated: new Date().toISOString(),
        response_time: endTime - startTime,
        query_parameters: Object.fromEntries(params),
      },
      responseTime: endTime - startTime,
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      logger.log("ERROR", "NYC 311 fetch timeout", { timeout: "30s" })
      return {
        success: false,
        data: [],
        error: "Request timeout - NYC 311 API took too long to respond",
        responseTime: 30000,
      }
    }

    logger.log("ERROR", "NYC 311 fetch error", {
      error: error.message,
      stack: error.stack,
    })

    return {
      success: false,
      data: [],
      error: `NYC 311 API error: ${error.message}`,
      responseTime: 0,
    }
  }
}

// Determine health relevance score for complaint types
function getHealthRelevanceScore(complaintType: string): number {
  const healthRelevanceMap: { [key: string]: number } = {
    "Air Quality": 9,
    "Water Quality": 8,
    "Food Poisoning": 10,
    "Unsanitary Condition": 7,
    Rodent: 6,
    "Noise - Residential": 4,
  }

  return healthRelevanceMap[complaintType] || 1
}

// Generate mock data as fallback
function generateMock311Data(): any {
  const mockComplaints = [
    {
      id: "mock_001",
      complaintType: "Air Quality",
      descriptor: "Smoke - Non-Residential",
      borough: "BRONX",
      neighborhood: "MOTT HAVEN",
      zipCode: "10451",
      createdDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      status: "Open",
      agency: "DEP",
      latitude: 40.8089,
      longitude: -73.9201,
      healthRelevance: 9,
    },
    {
      id: "mock_002",
      complaintType: "Water Quality",
      descriptor: "Taste/Odor",
      borough: "BROOKLYN",
      neighborhood: "BEDFORD STUYVESANT",
      zipCode: "11216",
      createdDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      status: "In Progress",
      agency: "DEP",
      latitude: 40.6892,
      longitude: -73.9442,
      healthRelevance: 8,
    },
    {
      id: "mock_003",
      complaintType: "Food Poisoning",
      descriptor: "Food Poisoning - Restaurant",
      borough: "MANHATTAN",
      neighborhood: "EAST HARLEM",
      zipCode: "10029",
      createdDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      status: "Closed",
      agency: "DOHMH",
      latitude: 40.7957,
      longitude: -73.9389,
      healthRelevance: 10,
    },
    {
      id: "mock_004",
      complaintType: "Unsanitary Condition",
      descriptor: "Dirty Conditions",
      borough: "QUEENS",
      neighborhood: "JACKSON HEIGHTS",
      zipCode: "11372",
      createdDate: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      status: "Open",
      agency: "DOHMH",
      latitude: 40.7505,
      longitude: -73.8803,
      healthRelevance: 7,
    },
    {
      id: "mock_005",
      complaintType: "Rodent",
      descriptor: "Rat Sighting",
      borough: "STATEN ISLAND",
      neighborhood: "ST. GEORGE",
      zipCode: "10301",
      createdDate: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
      status: "In Progress",
      agency: "DOHMH",
      latitude: 40.6437,
      longitude: -74.0776,
      healthRelevance: 6,
    },
  ]

  return {
    success: true,
    data: mockComplaints,
    metadata: {
      total_records: mockComplaints.length,
      data_source: "Mock Data - NYC 311 Service Requests",
      last_updated: new Date().toISOString(),
      response_time: 0,
      note: "This is mock data used when the NYC Open Data API is unavailable",
    },
    responseTime: 0,
  }
}

export async function GET(request: NextRequest) {
  const logger = new ComplaintsAPILogger()

  try {
    logger.log("ENGINE", "NYC 311 complaints API request started")
    const startTime = Date.now()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const borough = searchParams.get("borough")
    const complaintType = searchParams.get("complaint_type")
    const limit = searchParams.get("limit") || "1000"

    logger.log("ENGINE", "Request parameters", {
      borough,
      complaintType,
      limit,
    })

    // Fetch data from NYC Open Data API
    let result = await fetchNYC311Data(logger)

    // If API fails, use mock data
    if (!result.success) {
      logger.log("WARN", "NYC 311 API failed, using mock data", {
        error: result.error,
      })
      result = generateMock311Data()
    }

    // Apply filters if provided
    if (borough && result.data) {
      result.data = result.data.filter((complaint: any) => complaint.borough?.toUpperCase() === borough.toUpperCase())
      logger.log("ENGINE", "Applied borough filter", {
        borough,
        filteredCount: result.data.length,
      })
    }

    if (complaintType && result.data) {
      result.data = result.data.filter((complaint: any) =>
        complaint.complaintType?.toLowerCase().includes(complaintType.toLowerCase()),
      )
      logger.log("ENGINE", "Applied complaint type filter", {
        complaintType,
        filteredCount: result.data.length,
      })
    }

    // Apply limit
    if (result.data && result.data.length > Number.parseInt(limit)) {
      result.data = result.data.slice(0, Number.parseInt(limit))
      logger.log("ENGINE", "Applied limit", {
        limit: Number.parseInt(limit),
        finalCount: result.data.length,
      })
    }

    const endTime = Date.now()
    const totalResponseTime = endTime - startTime

    // Add summary statistics
    const summary = {
      totalComplaints: result.data?.length || 0,
      byBorough: {},
      byComplaintType: {},
      byStatus: {},
      healthRelevanceDistribution: {
        high: 0, // 8-10
        medium: 0, // 5-7
        low: 0, // 1-4
      },
    }

    if (result.data) {
      // Calculate statistics
      result.data.forEach((complaint: any) => {
        // By borough
        const borough = complaint.borough || "Unknown"
        summary.byBorough[borough] = (summary.byBorough[borough] || 0) + 1

        // By complaint type
        const type = complaint.complaintType || "Unknown"
        summary.byComplaintType[type] = (summary.byComplaintType[type] || 0) + 1

        // By status
        const status = complaint.status || "Unknown"
        summary.byStatus[status] = (summary.byStatus[status] || 0) + 1

        // By health relevance
        const relevance = complaint.healthRelevance || 1
        if (relevance >= 8) {
          summary.healthRelevanceDistribution.high++
        } else if (relevance >= 5) {
          summary.healthRelevanceDistribution.medium++
        } else {
          summary.healthRelevanceDistribution.low++
        }
      })
    }

    const response = {
      success: true,
      data: result.data || [],
      summary,
      metadata: {
        ...result.metadata,
        total_response_time: totalResponseTime,
        filters_applied: {
          borough: borough || null,
          complaint_type: complaintType || null,
          limit: Number.parseInt(limit),
        },
        session_id: logger["sessionId"],
      },
    }

    logger.log("ENGINE", "NYC 311 complaints API request completed", {
      totalResponseTime,
      dataPoints: result.data?.length || 0,
      filtersApplied: Object.keys(response.metadata.filters_applied).filter(
        (key) => response.metadata.filters_applied[key] !== null,
      ).length,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    logger.log("ERROR", "NYC 311 complaints API request failed", {
      error: error.message,
      stack: error.stack,
    })

    // Return mock data on any error
    const mockResult = generateMock311Data()

    return NextResponse.json(
      {
        success: false,
        data: mockResult.data,
        summary: {
          totalComplaints: mockResult.data.length,
          byBorough: {},
          byComplaintType: {},
          byStatus: {},
          healthRelevanceDistribution: { high: 1, medium: 2, low: 2 },
        },
        error: "NYC 311 API temporarily unavailable, showing sample data",
        metadata: {
          ...mockResult.metadata,
          total_response_time: 0,
          session_id: logger["sessionId"],
          error_details: process.env.NODE_ENV === "development" ? error.message : "Service unavailable",
        },
      },
      { status: 200 }, // Return 200 with mock data instead of error
    )
  }
}
