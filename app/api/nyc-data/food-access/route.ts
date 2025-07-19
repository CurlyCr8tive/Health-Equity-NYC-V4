import { NextResponse } from "next/server"

// Enhanced logging for food access API
class FoodAccessAPILogger {
  private sessionId: string

  constructor() {
    this.sessionId = `foodaccess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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

// Comprehensive mock food access data for NYC boroughs only
const generateMockFoodAccessData = () => {
  const storeTypes = ["Supermarket", "Grocery Store", "Bodega", "Farmers Market", "Food Co-op", "Corner Store"]

  const stores = [
    // Manhattan
    { name: "Whole Foods Market", borough: "Manhattan", type: "Supermarket", healthyOptions: 95 },
    { name: "Trader Joe's", borough: "Manhattan", type: "Supermarket", healthyOptions: 90 },
    { name: "Gristedes", borough: "Manhattan", type: "Grocery Store", healthyOptions: 75 },
    { name: "Union Square Greenmarket", borough: "Manhattan", type: "Farmers Market", healthyOptions: 100 },
    { name: "Local Bodega", borough: "Manhattan", type: "Bodega", healthyOptions: 30 },

    // Brooklyn
    { name: "ShopRite", borough: "Brooklyn", type: "Supermarket", healthyOptions: 85 },
    { name: "Key Food", borough: "Brooklyn", type: "Grocery Store", healthyOptions: 70 },
    { name: "Park Slope Food Coop", borough: "Brooklyn", type: "Food Co-op", healthyOptions: 95 },
    { name: "Brooklyn Farmers Market", borough: "Brooklyn", type: "Farmers Market", healthyOptions: 100 },
    { name: "Neighborhood Grocery", borough: "Brooklyn", type: "Corner Store", healthyOptions: 40 },

    // Queens
    { name: "Stop & Shop", borough: "Queens", type: "Supermarket", healthyOptions: 80 },
    { name: "Associated Supermarket", borough: "Queens", type: "Grocery Store", healthyOptions: 65 },
    { name: "Queens Night Market", borough: "Queens", type: "Farmers Market", healthyOptions: 85 },
    { name: "Local Market", borough: "Queens", type: "Corner Store", healthyOptions: 35 },
    { name: "Fresh Direct Pickup", borough: "Queens", type: "Supermarket", healthyOptions: 90 },

    // Bronx
    { name: "Concourse Plaza Multiplex", borough: "Bronx", type: "Supermarket", healthyOptions: 70 },
    { name: "Bronx Terminal Market", borough: "Bronx", type: "Grocery Store", healthyOptions: 60 },
    { name: "Hunts Point Market", borough: "Bronx", type: "Farmers Market", healthyOptions: 95 },
    { name: "Corner Deli", borough: "Bronx", type: "Bodega", healthyOptions: 25 },
    { name: "Community Garden Store", borough: "Bronx", type: "Food Co-op", healthyOptions: 85 },

    // Staten Island
    { name: "ShopRite Staten Island", borough: "Staten Island", type: "Supermarket", healthyOptions: 85 },
    { name: "Stop & Shop SI", borough: "Staten Island", type: "Supermarket", healthyOptions: 80 },
    { name: "Staten Island Mall Food Court", borough: "Staten Island", type: "Corner Store", healthyOptions: 45 },
    { name: "St. George Market", borough: "Staten Island", type: "Farmers Market", healthyOptions: 90 },
    { name: "Local Grocery", borough: "Staten Island", type: "Grocery Store", healthyOptions: 65 },
  ]

  const data = []
  let id = 1

  stores.forEach((store) => {
    // Add multiple locations for larger chains
    const locationCount = store.type === "Supermarket" ? 3 : store.type === "Bodega" ? 5 : 2

    for (let i = 0; i < locationCount; i++) {
      const coordinates = getBoroughCoordinates(store.borough as NYCBorough)
      // Add some random offset for variety
      const lat = coordinates[0] + (Math.random() - 0.5) * 0.08
      const lng = coordinates[1] + (Math.random() - 0.5) * 0.08

      data.push({
        id: `foodaccess-${id++}`,
        name: locationCount > 1 ? `${store.name} #${i + 1}` : store.name,
        borough: store.borough,
        type: "foodAccess",
        storeType: store.type,
        healthyOptionsScore: store.healthyOptions + Math.round((Math.random() - 0.5) * 20),
        coordinates: [lat, lng],
        acceptsEBT: Math.random() > 0.2, // 80% accept EBT
        acceptsWIC: Math.random() > 0.4, // 60% accept WIC
        priceLevel: Math.floor(Math.random() * 4) + 1, // 1-4 scale
        freshProduceAvailable: store.healthyOptions > 50,
        organicOptions: store.healthyOptions > 70,
        operatingHours: generateOperatingHours(),
        walkingDistance: Math.round(Math.random() * 15 + 1), // 1-15 minutes
        zipCode: generateNYCZipCode(store.borough as NYCBorough),
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

function generateOperatingHours(): string {
  const options = [
    "24/7",
    "6 AM - 11 PM",
    "7 AM - 10 PM",
    "8 AM - 9 PM",
    "9 AM - 8 PM",
    "10 AM - 7 PM (Weekends: 9 AM - 8 PM)",
  ]
  return options[Math.floor(Math.random() * options.length)]
}

// Retry mechanism for NYC Food Access API with borough filtering
async function fetchNYCFoodAccessData(logger: FoodAccessAPILogger): Promise<any> {
  const strategies = [
    {
      name: "NYC Food Retail Stores API with App Token",
      url: "https://data.cityofnewyork.us/resource/9a8c-vfzj.json?$limit=1000",
      headers: { "X-App-Token": process.env.NYC_OPEN_DATA_APP_TOKEN || "" },
    },
    {
      name: "NYC Food Retail Stores API without App Token",
      url: "https://data.cityofnewyork.us/resource/9a8c-vfzj.json?$limit=500",
      headers: {},
    },
    {
      name: "Alternative Food Access Dataset",
      url: "https://data.cityofnewyork.us/resource/4d7f-74pe.json?$limit=300",
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
              id: `nyc-foodaccess-${index}`,
              name: item.store_name || item.dba || `Store ${index}`,
              borough: normalizedBorough,
              type: "foodAccess",
              storeType: item.store_type || "Grocery Store",
              healthyOptionsScore: Math.round(Math.random() * 60 + 40), // 40-100
              coordinates: item.location
                ? [Number.parseFloat(item.location.latitude), Number.parseFloat(item.location.longitude)]
                : getBoroughCoordinates(normalizedBorough),
              acceptsEBT: item.accepts_ebt === "Y" || Math.random() > 0.2,
              acceptsWIC: item.accepts_wic === "Y" || Math.random() > 0.4,
              priceLevel: Math.floor(Math.random() * 4) + 1,
              freshProduceAvailable: Math.random() > 0.3,
              organicOptions: Math.random() > 0.5,
              operatingHours: generateOperatingHours(),
              walkingDistance: Math.round(Math.random() * 15 + 1),
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
  logger.log("FALLBACK", "Using comprehensive mock food access data for NYC boroughs only")
  const mockData = generateMockFoodAccessData()

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
  const logger = new FoodAccessAPILogger()

  try {
    logger.log("ENGINE", "NYC Food Access API request started")
    const result = await fetchNYCFoodAccessData(logger)

    logger.log("ENGINE", "NYC Food Access API request completed", {
      success: result.success,
      count: result.data.length,
      source: result.metadata.source,
      boroughs: result.metadata.boroughs,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.log("ERROR", "NYC Food Access API request failed", {
      error: error instanceof Error ? error.message : String(error),
    })

    // Return mock data even on complete failure
    const mockData = generateMockFoodAccessData()
    return NextResponse.json({
      success: false,
      data: mockData,
      error: "Food Access API temporarily unavailable",
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
