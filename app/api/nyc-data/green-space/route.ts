import { NextResponse } from "next/server"

// Enhanced logging for green space API
class GreenSpaceAPILogger {
  private sessionId: string

  constructor() {
    this.sessionId = `greenspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  log(channel: string, message: string, extra?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${channel}] [${this.sessionId}] ${message}`, extra ? JSON.stringify(extra) : "")
  }
}

// Official NYC boroughs - strict validation
const VALID_NYC_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const
type NYCBorough = (typeof VALID_NYC_BOROUGHS)[number]

// Normalize borough names to official NYC borough names
function normalizeBorough(borough: string): NYCBorough | null {
  if (!borough) return null

  const normalized = borough.trim()
  const lowerCase = normalized.toLowerCase()

  // Direct matches
  if (VALID_NYC_BOROUGHS.includes(normalized as NYCBorough)) {
    return normalized as NYCBorough
  }

  // Common variations and aliases
  const boroughMappings: Record<string, NYCBorough> = {
    manhattan: "Manhattan",
    "new york": "Manhattan",
    "new york county": "Manhattan",
    "ny county": "Manhattan",
    brooklyn: "Brooklyn",
    kings: "Brooklyn",
    "kings county": "Brooklyn",
    queens: "Queens",
    "queens county": "Queens",
    bronx: "Bronx",
    "the bronx": "Bronx",
    "bronx county": "Bronx",
    "staten island": "Staten Island",
    richmond: "Staten Island",
    "richmond county": "Staten Island",
    si: "Staten Island",
  }

  return boroughMappings[lowerCase] || null
}

// Comprehensive mock green space data for NYC boroughs only
const generateMockGreenSpaceData = () => {
  const parkTypes = ["Neighborhood Park", "Community Park", "Playground", "Garden", "Recreation Center", "Waterfront"]

  const parks = [
    // Manhattan
    { name: "Central Park", borough: "Manhattan", acres: 843, type: "Community Park" },
    { name: "Washington Square Park", borough: "Manhattan", acres: 9.75, type: "Neighborhood Park" },
    { name: "Bryant Park", borough: "Manhattan", acres: 9.6, type: "Neighborhood Park" },
    { name: "Madison Square Park", borough: "Manhattan", acres: 6.2, type: "Neighborhood Park" },
    { name: "Riverside Park", borough: "Manhattan", acres: 330, type: "Waterfront" },

    // Brooklyn
    { name: "Prospect Park", borough: "Brooklyn", acres: 526, type: "Community Park" },
    { name: "Brooklyn Bridge Park", borough: "Brooklyn", acres: 85, type: "Waterfront" },
    { name: "McCarren Park", borough: "Brooklyn", acres: 35.8, type: "Community Park" },
    { name: "Fort Greene Park", borough: "Brooklyn", acres: 30.2, type: "Neighborhood Park" },
    { name: "Sunset Park", borough: "Brooklyn", acres: 24.5, type: "Neighborhood Park" },

    // Queens
    { name: "Flushing Meadows Corona Park", borough: "Queens", acres: 897, type: "Community Park" },
    { name: "Forest Park", borough: "Queens", acres: 538, type: "Community Park" },
    { name: "Astoria Park", borough: "Queens", acres: 59.5, type: "Community Park" },
    { name: "Cunningham Park", borough: "Queens", acres: 358, type: "Community Park" },
    { name: "Alley Pond Park", borough: "Queens", acres: 655, type: "Community Park" },

    // Bronx
    { name: "Bronx Park", borough: "Bronx", acres: 718, type: "Community Park" },
    { name: "Van Cortlandt Park", borough: "Bronx", acres: 1146, type: "Community Park" },
    { name: "Pelham Bay Park", borough: "Bronx", acres: 2772, type: "Community Park" },
    { name: "Crotona Park", borough: "Bronx", acres: 127.5, type: "Community Park" },
    { name: "St. Mary's Park", borough: "Bronx", acres: 34.4, type: "Neighborhood Park" },

    // Staten Island
    { name: "Great Kills Park", borough: "Staten Island", acres: 580, type: "Waterfront" },
    { name: "Clove Lakes Park", borough: "Staten Island", acres: 193, type: "Community Park" },
    { name: "Wolfe's Pond Park", borough: "Staten Island", acres: 302, type: "Waterfront" },
    { name: "Silver Lake Park", borough: "Staten Island", acres: 209, type: "Community Park" },
    { name: "Snug Harbor Cultural Center", borough: "Staten Island", acres: 83, type: "Garden" },
  ]

  const data = []
  let id = 1

  parks.forEach((park) => {
    // Add some variation with additional smaller parks
    for (let i = 0; i < (park.acres > 100 ? 3 : 1); i++) {
      const coordinates = getBoroughCoordinates(park.borough as NYCBorough)
      // Add some random offset for variety
      const lat = coordinates[0] + (Math.random() - 0.5) * 0.05
      const lng = coordinates[1] + (Math.random() - 0.5) * 0.05

      data.push({
        id: `greenspace-${id++}`,
        name: i === 0 ? park.name : `${park.name} Section ${i + 1}`,
        borough: park.borough,
        type: "greenSpace",
        parkType: park.type,
        acres: i === 0 ? park.acres : Math.round((park.acres / 3) * 10) / 10,
        coordinates: [lat, lng],
        amenities: generateAmenities(park.type),
        accessibility: Math.random() > 0.3,
        maintenanceScore: Math.round(Math.random() * 40 + 60), // 60-100
        crowdingLevel: Math.round(Math.random() * 100),
        safetyScore: Math.round(Math.random() * 30 + 70), // 70-100
        zipCode: generateNYCZipCode(park.borough as NYCBorough),
        dataSource: "mock",
        lastUpdated: new Date().toISOString(),
        severity: Math.round(Math.random() * 100), // For map visualization
        status: "Active",
      })
    }
  })

  return data
}

function getBoroughCoordinates(borough: NYCBorough): [number, number] {
  const coordinates: Record<NYCBorough, [number, number]> = {
    Manhattan: [40.7831, -73.9712],
    Brooklyn: [40.6782, -73.9442],
    Queens: [40.7282, -73.7949],
    Bronx: [40.8448, -73.8648],
    "Staten Island": [40.5795, -74.1502],
  }
  return coordinates[borough]
}

function generateNYCZipCode(borough: NYCBorough): string {
  const zipRanges: Record<NYCBorough, [number, number]> = {
    Manhattan: [10001, 10282],
    Brooklyn: [11201, 11256],
    Queens: [11101, 11697],
    Bronx: [10451, 10475],
    "Staten Island": [10301, 10314],
  }

  const [min, max] = zipRanges[borough]
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString()
}

function generateAmenities(parkType: string): string[] {
  const baseAmenities = ["Benches", "Walking Paths"]
  const amenityOptions = {
    "Community Park": ["Playground", "Sports Fields", "Restrooms", "Picnic Areas", "Dog Run"],
    "Neighborhood Park": ["Playground", "Basketball Court", "Restrooms"],
    Playground: ["Playground Equipment", "Safety Surfacing", "Seating"],
    Garden: ["Gardens", "Educational Programs", "Greenhouse"],
    "Recreation Center": ["Indoor Facilities", "Sports Courts", "Pool", "Fitness Equipment"],
    Waterfront: ["Waterfront Access", "Fishing Areas", "Boat Launch", "Scenic Views"],
  }

  const specificAmenities = amenityOptions[parkType as keyof typeof amenityOptions] || []
  return [...baseAmenities, ...specificAmenities.slice(0, Math.floor(Math.random() * specificAmenities.length) + 1)]
}

// Retry mechanism for NYC Green Space API with borough filtering
async function fetchNYCGreenSpaceData(logger: GreenSpaceAPILogger): Promise<any> {
  const strategies = [
    {
      name: "NYC Parks Properties API with App Token",
      url: "https://data.cityofnewyork.us/resource/enfh-gkve.json?$limit=1000",
      headers: { "X-App-Token": process.env.NYC_OPEN_DATA_APP_TOKEN || "" },
    },
    {
      name: "NYC Parks Properties API without App Token",
      url: "https://data.cityofnewyork.us/resource/enfh-gkve.json?$limit=500",
      headers: {},
    },
    {
      name: "Alternative Parks Dataset",
      url: "https://data.cityofnewyork.us/resource/ghu2-eden.json?$limit=300",
      headers: {},
    },
  ]

  for (const strategy of strategies) {
    try {
      logger.log("ENGINE", `Attempting ${strategy.name}`, { url: strategy.url })

      const response = await fetch(strategy.url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "NYC-Health-Equity-Dashboard/1.0",
          ...strategy.headers,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (response.ok) {
        const data = await response.json()
        logger.log("ENGINE", `${strategy.name} successful`, { count: data.length })

        // Transform NYC data to our format with strict borough filtering
        const transformedData = data
          .map((item: any, index: number) => {
            const normalizedBorough = normalizeBorough(item.borough || "")

            // Skip records that don't belong to NYC boroughs
            if (!normalizedBorough) {
              return null
            }

            return {
              id: `nyc-greenspace-${index}`,
              name: item.signname || item.park_name || `Park ${index}`,
              borough: normalizedBorough,
              type: "greenSpace",
              parkType: item.typecategory || "Park",
              acres: Number.parseFloat(item.acres || Math.random() * 50),
              coordinates: item.location
                ? [Number.parseFloat(item.location.latitude), Number.parseFloat(item.location.longitude)]
                : getBoroughCoordinates(normalizedBorough),
              amenities: (item.amenities || "").split(",").filter(Boolean),
              accessibility: Math.random() > 0.3,
              maintenanceScore: Math.round(Math.random() * 40 + 60),
              crowdingLevel: Math.round(Math.random() * 100),
              safetyScore: Math.round(Math.random() * 30 + 70),
              zipCode: generateNYCZipCode(normalizedBorough),
              dataSource: "nyc_open_data",
              lastUpdated: new Date().toISOString(),
              severity: Math.round(Math.random() * 100),
              status: "Active",
            }
          })
          .filter(Boolean) // Remove null entries

        logger.log("ENGINE", "Data filtered to NYC boroughs only", {
          originalCount: data.length,
          filteredCount: transformedData.length,
          boroughs: [...new Set(transformedData.map((d: any) => d.borough))],
        })

        return {
          success: true,
          data: transformedData,
          metadata: {
            source: strategy.name,
            count: transformedData.length,
            data_source: "nyc_open_data",
            boroughs: VALID_NYC_BOROUGHS,
            last_updated: new Date().toISOString(),
          },
        }
      } else {
        logger.log("WARN", `${strategy.name} failed`, { status: response.status })
      }
    } catch (error) {
      logger.log("ERROR", `${strategy.name} error`, {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // All strategies failed, return mock data
  logger.log("FALLBACK", "Using comprehensive mock green space data for NYC boroughs only")
  const mockData = generateMockGreenSpaceData()

  return {
    success: true,
    data: mockData,
    metadata: {
      source: "Mock Data Generator",
      count: mockData.length,
      data_source: "mock",
      boroughs: VALID_NYC_BOROUGHS,
      last_updated: new Date().toISOString(),
      note: "Using comprehensive mock data due to API unavailability",
    },
  }
}

export async function GET() {
  const logger = new GreenSpaceAPILogger()

  try {
    logger.log("ENGINE", "NYC Green Space API request started")
    const result = await fetchNYCGreenSpaceData(logger)

    logger.log("ENGINE", "NYC Green Space API request completed", {
      success: result.success,
      count: result.data.length,
      source: result.metadata.source,
      boroughs: result.metadata.boroughs,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.log("ERROR", "NYC Green Space API request failed", {
      error: error instanceof Error ? error.message : String(error),
    })

    // Return mock data even on complete failure
    const mockData = generateMockGreenSpaceData()
    return NextResponse.json({
      success: false,
      data: mockData,
      error: "Green Space API temporarily unavailable",
      metadata: {
        source: "Emergency Mock Data",
        count: mockData.length,
        data_source: "mock",
        boroughs: VALID_NYC_BOROUGHS,
        last_updated: new Date().toISOString(),
      },
    })
  }
}
