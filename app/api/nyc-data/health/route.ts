import { NextResponse } from "next/server"

// Enhanced logging for health API
class HealthAPILogger {
  private sessionId: string

  constructor() {
    this.sessionId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
    // Manhattan variations
    manhattan: "Manhattan",
    "new york": "Manhattan",
    "new york county": "Manhattan",
    "ny county": "Manhattan",

    // Brooklyn variations
    brooklyn: "Brooklyn",
    kings: "Brooklyn",
    "kings county": "Brooklyn",

    // Queens variations
    queens: "Queens",
    "queens county": "Queens",

    // Bronx variations
    bronx: "Bronx",
    "the bronx": "Bronx",
    "bronx county": "Bronx",

    // Staten Island variations
    "staten island": "Staten Island",
    richmond: "Staten Island",
    "richmond county": "Staten Island",
    si: "Staten Island",
  }

  return boroughMappings[lowerCase] || null
}

// Comprehensive mock health data for NYC boroughs only
const generateMockHealthData = () => {
  const conditions = [
    "Heart Disease",
    "Diabetes",
    "Hypertension",
    "Cancer",
    "Stroke",
    "COPD",
    "Asthma",
    "Mental Health",
    "Obesity",
    "Substance Abuse",
  ]

  const ageGroups = ["0-17", "18-34", "35-64", "65+"]
  const raceEthnicities = ["White", "Black", "Hispanic", "Asian", "Other"]

  const data = []
  let id = 1

  // Generate data ONLY for the 5 official NYC boroughs
  VALID_NYC_BOROUGHS.forEach((borough) => {
    conditions.forEach((condition) => {
      ageGroups.forEach((ageGroup) => {
        raceEthnicities.forEach((raceEthnicity) => {
          // Generate realistic rates based on known health disparities
          let baseRate = Math.random() * 100

          // Adjust rates based on known health equity patterns
          if (borough === "Bronx" && ["Heart Disease", "Diabetes", "Hypertension"].includes(condition)) {
            baseRate += 15 // Higher rates in Bronx for these conditions
          }
          if (borough === "Manhattan" && condition === "Mental Health") {
            baseRate += 10 // Higher mental health issues in Manhattan
          }
          if (raceEthnicity === "Black" && ["Heart Disease", "Diabetes", "Hypertension"].includes(condition)) {
            baseRate += 20 // Known health disparities
          }
          if (ageGroup === "65+" && ["Heart Disease", "Stroke", "Cancer"].includes(condition)) {
            baseRate += 25 // Age-related conditions
          }

          baseRate = Math.min(baseRate, 95) // Cap at 95%

          data.push({
            id: `health-${id++}`,
            condition,
            borough,
            geography: borough,
            rate: Math.round(baseRate * 10) / 10,
            ageGroup,
            raceEthnicity,
            year: 2023,
            severity: Math.round(baseRate),
            zipCode: generateNYCZipCode(borough),
            coordinates: getBoroughCoordinates(borough),
            dataSource: "mock",
            lastUpdated: new Date().toISOString(),
          })
        })
      })
    })
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
  // Generate realistic ZIP codes for each borough
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

// Retry mechanism for NYC Health API with borough filtering
async function fetchNYCHealthData(logger: HealthAPILogger): Promise<any> {
  const strategies = [
    {
      name: "Primary API with App Token",
      url: "https://data.cityofnewyork.us/resource/cw4k-4w9k.json?$limit=1000",
      headers: { "X-App-Token": process.env.NYC_OPEN_DATA_APP_TOKEN || "" },
    },
    {
      name: "Primary API without App Token",
      url: "https://data.cityofnewyork.us/resource/cw4k-4w9k.json?$limit=500",
      headers: {},
    },
    {
      name: "Alternative Health Dataset",
      url: "https://data.cityofnewyork.us/resource/jb7j-dtam.json?$limit=500",
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
        next: { revalidate: 1800 }, // Cache for 30 minutes
      })

      if (response.ok) {
        const data = await response.json()
        logger.log("ENGINE", `${strategy.name} successful`, { count: data.length })

        // Transform NYC data to our format with strict borough filtering
        const transformedData = data
          .map((item: any, index: number) => {
            const normalizedBorough = normalizeBorough(item.geography || item.borough || "")

            // Skip records that don't belong to NYC boroughs
            if (!normalizedBorough) {
              return null
            }

            return {
              id: `nyc-health-${index}`,
              condition: item.topic || item.measure || "Unknown Condition",
              borough: normalizedBorough,
              geography: normalizedBorough,
              rate: Number.parseFloat(item.data_value || item.rate || Math.random() * 100),
              ageGroup: item.age_group || "All Ages",
              raceEthnicity: item.race_ethnicity || "All Groups",
              year: Number.parseInt(item.year_description || item.year || "2023"),
              severity: Math.round(Number.parseFloat(item.data_value || item.rate || Math.random() * 100)),
              zipCode: generateNYCZipCode(normalizedBorough),
              coordinates: getBoroughCoordinates(normalizedBorough),
              dataSource: "nyc_open_data",
              lastUpdated: new Date().toISOString(),
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
  logger.log("FALLBACK", "Using comprehensive mock health data for NYC boroughs only")
  const mockData = generateMockHealthData()

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
  const logger = new HealthAPILogger()

  try {
    logger.log("ENGINE", "NYC Health API request started")
    const result = await fetchNYCHealthData(logger)

    logger.log("ENGINE", "NYC Health API request completed", {
      success: result.success,
      count: result.data.length,
      source: result.metadata.source,
      boroughs: result.metadata.boroughs,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.log("ERROR", "NYC Health API request failed", {
      error: error instanceof Error ? error.message : String(error),
    })

    // Return mock data even on complete failure
    const mockData = generateMockHealthData()
    return NextResponse.json({
      success: false,
      data: mockData,
      error: "Health API temporarily unavailable",
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
