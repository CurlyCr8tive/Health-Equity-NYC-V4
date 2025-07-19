import { type NextRequest, NextResponse } from "next/server"
import { WebScraper } from "@/lib/web-scraper"

const scraper = new WebScraper()

/**
 * /api/scraping/epiquery
 *
 * Query params
 * - endpoint     community_health | environmental | demographics   (default: community_health)
 * - borough      Optional NYC borough
 * - neighborhood Optional neighborhood name
 * - year         4-digit year (default 2023)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const endpoint = searchParams.get("endpoint") ?? "community_health" // we accept only the public “data” API below
  const year = searchParams.get("year") ?? "2023"
  const borough = searchParams.get("borough") ?? ""
  const neighborhood = searchParams.get("neighborhood") ?? ""

  /* ------------------------------------------------------------------ */
  /* 1  Try the documented “/api/public/data” path                       */
  /* ------------------------------------------------------------------ */
  const publicPath = `/hdi/epiquery/api/public/data?format=json&year=${year}${
    borough ? `&borough=${borough}` : ""
  }${neighborhood ? `&neighborhood=${neighborhood}` : ""}`

  const liveData = await safeFetch(publicPath)

  if (liveData.length > 0) {
    return okResponse(liveData, "EpiQuery NYC Health (public API)", publicPath)
  }

  /* ------------------------------------------------------------------ */
  /* 2  Try the legacy path (still works for some datasets)              */
  /* ------------------------------------------------------------------ */
  const legacyPath = `/hdi/epiquery/api/data?format=json&year=${year}${
    borough ? `&borough=${borough}` : ""
  }${neighborhood ? `&neighborhood=${neighborhood}` : ""}`

  const legacyData = await safeFetch(legacyPath)

  if (legacyData.length > 0) {
    return okResponse(legacyData, "EpiQuery NYC Health (legacy API)", legacyPath)
  }

  /* ------------------------------------------------------------------ */
  /* 3  Everything failed → return deterministic mock data              */
  /* ------------------------------------------------------------------ */
  const mock = generateMockData(Number(year), borough || undefined)
  return okResponse(mock, "EpiQuery NYC Health (mock)", "local-mock")
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function safeFetch(path: string): Promise<any[]> {
  try {
    const data = await scraper.fetchEpiQueryData({
      endpoint: path,
      year: 2023,
    })
    return data
  } catch (err) {
    // Network error, CORS, DNS, etc. – just log and continue.
    console.warn("EpiQuery safeFetch() network failure for %s → %s", path, String(err))
    return []
  }
}

function okResponse(data: any[], source: string, sourcePath: string) {
  return NextResponse.json({
    success: true,
    source,
    endpoint: sourcePath,
    count: data.length,
    timestamp: new Date().toISOString(),
    data,
  })
}

/**
 * Very small deterministic mock so the dashboard never breaks.
 */
function generateMockData(year: number, borough = "NYC") {
  return [
    {
      id: `epi_mock_aqi_${borough}_${year}`,
      indicator: "Air Quality Index",
      borough,
      value: 78.4,
      unit: "AQI",
      year,
    },
    {
      id: `epi_mock_food_${borough}_${year}`,
      indicator: "Food Access Score",
      borough,
      value: 69.1,
      unit: "Score",
      year,
    },
    {
      id: `epi_mock_green_${borough}_${year}`,
      indicator: "Green Space Access",
      borough,
      value: 63.2,
      unit: "%",
      year,
    },
  ]
}
