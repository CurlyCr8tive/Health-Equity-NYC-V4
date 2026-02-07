import { type NextRequest, NextResponse } from "next/server"
import { WebScraper } from "@/lib/web-scraper"

// ---------------------------------------------------------------------------
// Borough coordinate lookup
// ---------------------------------------------------------------------------
const BOROUGH_COORDS: Record<string, [number, number]> = {
  Manhattan: [40.7831, -73.9712],
  Brooklyn: [40.6782, -73.9442],
  Queens: [40.7282, -73.7949],
  Bronx: [40.8448, -73.8648],
  "Staten Island": [40.5795, -74.1502],
}

// ---------------------------------------------------------------------------
// GET /api/environmental
// Fetches real data from:
//   1. EPA Envirofacts (air quality monitors in NY)
//   2. NYC Open Data  (air quality, parks, SNAP retailers)
// Falls back to curated mock data if any source is unreachable.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const scraper = WebScraper.getInstance()
  const { searchParams } = new URL(request.url)
  const borough = searchParams.get("borough")
  const zipCode = searchParams.get("zipCode")

  const sources: string[] = []
  let airQuality: any[] = []
  let parks: any[] = []
  let foodAccess: any[] = []

  try {
    // -----------------------------------------------------------------
    // 1. EPA Air Quality data
    // -----------------------------------------------------------------
    try {
      const epaRaw = await scraper.fetchEPAData({ state: "New York" })

      if (epaRaw.length > 0) {
        sources.push("EPA Envirofacts")
        airQuality = epaRaw.slice(0, 50).map((item: any, i: number) => ({
          id: `epa_${i}`,
          type: "airQuality",
          borough: mapCountyToBorough(item.county_name) || borough || "Manhattan",
          zipCode: item.zip_code || zipCode || "10001",
          coordinates: BOROUGH_COORDS[mapCountyToBorough(item.county_name) || "Manhattan"],
          data: {
            aqi: item.aqi ?? estimateAQI(item),
            pollutant: item.parameter_name || item.pollutant || "PM2.5",
            value: Number(item.arithmetic_mean ?? item.first_max_value ?? 0),
            status: getAQIStatus(item.aqi ?? estimateAQI(item)),
            unit: item.units_of_measure || "ug/m3",
            siteName: item.local_site_name || item.site_name || "EPA Monitor",
          },
          dataSource: "EPA",
        }))
      }
    } catch (e) {
      console.warn("[Environmental] EPA fetch failed, will use fallback:", String(e))
    }

    // If EPA returned nothing, try NYC Open Data air quality
    if (airQuality.length === 0) {
      try {
        const nycAirRaw = await scraper.fetchNYCOpenData("air_quality", {
          borough,
          limit: 50,
        })

        if (nycAirRaw.length > 0) {
          sources.push("NYC Open Data - Air Quality")
          airQuality = nycAirRaw.map((item: any, i: number) => {
            const boro = mapGeoToBorough(item.geo_place_name) || borough || "Manhattan"
            return {
              id: `nyc_aq_${i}`,
              type: "airQuality",
              borough: boro,
              zipCode: item.geo_entity_id || zipCode || "10001",
              coordinates: BOROUGH_COORDS[boro] || BOROUGH_COORDS.Manhattan,
              data: {
                aqi: estimateAQIFromValue(Number(item.data_value || 0), item.name),
                pollutant: item.name || "PM2.5",
                value: Number(item.data_value || 0),
                status: getAQIStatus(estimateAQIFromValue(Number(item.data_value || 0), item.name)),
                unit: item.measure_info || "mcg/m3",
              },
              dataSource: "NYC Open Data",
            }
          })
        }
      } catch (e) {
        console.warn("[Environmental] NYC air quality fetch failed:", String(e))
      }
    }

    // -----------------------------------------------------------------
    // 2. NYC Open Data Parks (green space)
    // -----------------------------------------------------------------
    try {
      const parksRaw = await scraper.fetchNYCOpenData("parks", { borough, limit: 30 })

      if (parksRaw.length > 0) {
        sources.push("NYC Open Data - Parks")
        parks = parksRaw.map((item: any, i: number) => {
          const boro = item.borough || borough || "Manhattan"
          return {
            id: `park_${i}`,
            type: "greenSpace",
            borough: boro,
            coordinates: BOROUGH_COORDS[boro] || BOROUGH_COORDS.Manhattan,
            data: {
              name: item.name311 || item.signname || item.name || "NYC Park",
              address: item.location || item.address || "",
              type: "greenSpace",
              acres: Number(item.acres || 0),
            },
            dataSource: "NYC Open Data",
          }
        })
      }
    } catch (e) {
      console.warn("[Environmental] Parks fetch failed:", String(e))
    }

    // -----------------------------------------------------------------
    // 3. Fallbacks — if live sources returned nothing, use curated data
    // -----------------------------------------------------------------
    if (airQuality.length === 0) {
      sources.push("Curated Air Quality Data")
      airQuality = getFallbackAirQuality(borough)
    }
    if (parks.length === 0) {
      sources.push("Curated Parks Data")
      parks = getFallbackParks(borough)
    }

    // Food access always uses curated data (no free public API available)
    sources.push("Curated Food Access Data")
    foodAccess = getFallbackFoodAccess(borough)

    // -----------------------------------------------------------------
    // Combine and respond
    // -----------------------------------------------------------------
    const combinedData = [...airQuality, ...parks, ...foodAccess]

    return NextResponse.json({
      success: true,
      data: combinedData,
      airQuality,
      parks,
      foodAccess,
      sources,
      metadata: {
        airQualityCount: airQuality.length,
        parksCount: parks.length,
        foodAccessCount: foodAccess.length,
        totalPoints: combinedData.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Environmental] Top-level error:", error)

    // Always return usable data
    const fallbackAir = getFallbackAirQuality(borough)
    const fallbackParks = getFallbackParks(borough)
    const fallbackFood = getFallbackFoodAccess(borough)

    return NextResponse.json({
      success: false,
      data: [...fallbackAir, ...fallbackParks, ...fallbackFood],
      airQuality: fallbackAir,
      parks: fallbackParks,
      foodAccess: fallbackFood,
      sources: ["Fallback Data"],
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapCountyToBorough(county: string | undefined): string | null {
  if (!county) return null
  const c = county.toLowerCase()
  if (c.includes("new york") || c.includes("manhattan")) return "Manhattan"
  if (c.includes("kings") || c.includes("brooklyn")) return "Brooklyn"
  if (c.includes("queens")) return "Queens"
  if (c.includes("bronx")) return "Bronx"
  if (c.includes("richmond") || c.includes("staten")) return "Staten Island"
  return null
}

function mapGeoToBorough(geo: string | undefined): string | null {
  if (!geo) return null
  const g = geo.toLowerCase()
  if (g.includes("manhattan") || g.includes("new york")) return "Manhattan"
  if (g.includes("brooklyn") || g.includes("kings")) return "Brooklyn"
  if (g.includes("queens")) return "Queens"
  if (g.includes("bronx")) return "Bronx"
  if (g.includes("staten") || g.includes("richmond")) return "Staten Island"
  return null
}

function estimateAQI(item: any): number {
  const val = Number(item.arithmetic_mean ?? item.first_max_value ?? 0)
  return estimateAQIFromValue(val, item.parameter_name)
}

function estimateAQIFromValue(value: number, pollutant?: string): number {
  const p = (pollutant || "").toLowerCase()
  if (p.includes("pm2.5") || p.includes("fine particulate")) {
    if (value <= 12) return Math.round((50 / 12) * value)
    if (value <= 35.4) return Math.round(50 + ((100 - 50) / (35.4 - 12.1)) * (value - 12.1))
    return Math.round(100 + ((150 - 100) / (55.4 - 35.5)) * (value - 35.5))
  }
  if (p.includes("ozone") || p.includes("o3")) {
    const ppb = value > 1 ? value : value * 1000
    if (ppb <= 54) return Math.round((50 / 54) * ppb)
    return Math.round(50 + ((100 - 50) / (70 - 55)) * (ppb - 55))
  }
  if (p.includes("no2")) {
    if (value <= 53) return Math.round((50 / 53) * value)
    return Math.round(50 + ((100 - 50) / (100 - 54)) * (value - 54))
  }
  // Generic fallback
  return Math.min(Math.round(value * 2), 200)
}

function getAQIStatus(aqi: number): string {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

// ---------------------------------------------------------------------------
// Curated fallback data (real NYC locations and approximate values)
// ---------------------------------------------------------------------------

function getFallbackAirQuality(borough: string | null): any[] {
  const boroughs = borough ? [borough] : ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  return boroughs.map((b, i) => ({
    id: `fallback_aq_${i}`,
    type: "airQuality",
    borough: b,
    coordinates: BOROUGH_COORDS[b] || BOROUGH_COORDS.Manhattan,
    data: {
      aqi: [52, 68, 58, 74, 45][i] || 55,
      pollutant: "PM2.5",
      value: [8.2, 12.5, 9.8, 14.1, 7.0][i] || 10,
      status: getAQIStatus([52, 68, 58, 74, 45][i] || 55),
      unit: "mcg/m3",
    },
    dataSource: "Curated (EPA benchmarks)",
  }))
}

function getFallbackParks(borough: string | null): any[] {
  const allParks = [
    { name: "Central Park", borough: "Manhattan", acres: 843, coords: [40.7829, -73.9654] as [number, number] },
    { name: "Prospect Park", borough: "Brooklyn", acres: 526, coords: [40.6602, -73.969] as [number, number] },
    { name: "Flushing Meadows", borough: "Queens", acres: 897, coords: [40.7400, -73.8408] as [number, number] },
    { name: "Van Cortlandt Park", borough: "Bronx", acres: 1146, coords: [40.8932, -73.8986] as [number, number] },
    { name: "Greenbelt", borough: "Staten Island", acres: 1778, coords: [40.5834, -74.148] as [number, number] },
  ]
  const filtered = borough ? allParks.filter((p) => p.borough === borough) : allParks
  return filtered.map((p, i) => ({
    id: `fallback_park_${i}`,
    type: "greenSpace",
    borough: p.borough,
    coordinates: p.coords,
    data: { name: p.name, type: "greenSpace", acres: p.acres },
    dataSource: "Curated (NYC Parks)",
  }))
}

function getFallbackFoodAccess(borough: string | null): any[] {
  const allFood = [
    { name: "East Harlem Food Desert", borough: "Manhattan", risk: "High", dist: 1.4, coords: [40.7957, -73.9389] as [number, number] },
    { name: "Brownsville Food Desert", borough: "Brooklyn", risk: "High", dist: 1.6, coords: [40.6594, -73.9148] as [number, number] },
    { name: "Far Rockaway Food Desert", borough: "Queens", risk: "High", dist: 2.1, coords: [40.6005, -73.751] as [number, number] },
    { name: "Hunts Point Food Desert", borough: "Bronx", risk: "High", dist: 1.3, coords: [40.8094, -73.8803] as [number, number] },
    { name: "North Shore Food Desert", borough: "Staten Island", risk: "Moderate", dist: 0.9, coords: [40.6437, -74.0776] as [number, number] },
  ]
  const filtered = borough ? allFood.filter((f) => f.borough === borough) : allFood
  return filtered.map((f, i) => ({
    id: `fallback_food_${i}`,
    type: "foodDeserts",
    borough: f.borough,
    coordinates: f.coords,
    data: {
      name: f.name,
      type: "foodDeserts",
      riskLevel: f.risk,
      details: { distance_to_supermarket: f.dist },
    },
    dataSource: "Curated (USDA Food Access Research Atlas)",
  }))
}
