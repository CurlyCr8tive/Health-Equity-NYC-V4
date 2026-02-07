/// lib/web-scraper.ts

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export type CDCEndpoint = "chronic_disease" | "mortality" | "environmental_health" | "social_determinants"
export type EPAEndpoint = "aqi_current" | "aqi_historical" | "facility_emissions"

interface DataSourceConfig {
  name: string
  url: string
  baseUrl: string
  description: string
  reliability: "High" | "Medium" | "Low"
  endpoints: Record<string, string>
}

// ---------------------------------------------------------------------------
// DATA_SOURCES — canonical registry of every external API the app uses
// ---------------------------------------------------------------------------

export const DATA_SOURCES: Record<string, DataSourceConfig> = {
  CDC: {
    name: "Centers for Disease Control and Prevention",
    url: "https://www.cdc.gov",
    baseUrl: "https://data.cdc.gov/resource",
    description: "National health condition prevalence, mortality, and social determinants data",
    reliability: "High",
    endpoints: {
      chronic_disease: "/55yu-xksw.json",   // Chronic Disease Indicators
      mortality: "/bi63-dtpu.json",          // NCHS Leading Causes of Death
      environmental_health: "/cwsq-ngmh.json", // Environmental Health Tracking
      social_determinants: "/5svk-8bnq.json",  // Social Vulnerability Index
    },
  },
  EpiQuery: {
    name: "NYC DOHMH EpiQuery",
    url: "https://a816-health.nyc.gov",
    baseUrl: "https://a816-health.nyc.gov",
    description: "NYC-specific community health indicators from the Dept. of Health",
    reliability: "High",
    endpoints: {
      community_health: "/hdi/epiquery/visualizations",
      birth_data: "/hdi/epiquery/visualizations",
    },
  },
  NYCOpenData: {
    name: "NYC Open Data Portal",
    url: "https://opendata.cityofnewyork.us",
    baseUrl: "https://data.cityofnewyork.us/resource",
    description: "Environmental, demographic, and 311 complaint data for NYC",
    reliability: "Medium",
    endpoints: {
      complaints_311: "/erm2-nwe9.json",
      air_quality: "/c3uy-2p5r.json",
      restaurants: "/43nn-pn8j.json",
      parks: "/enfk-uwib.json",
    },
  },
  EPA: {
    name: "Environmental Protection Agency",
    url: "https://www.epa.gov",
    baseUrl: "https://data.epa.gov/efservice",
    description: "Air quality index (AQI) readings, facility emissions, and TRI data for the US",
    reliability: "High",
    endpoints: {
      tri_facilities: "/tri.tri_facility/state/equals/NY/1:100/JSON",
      air_facilities: "/frs.frs_facility/state_code/equals/NY/1:100/JSON",
      aqi_api: "https://aqs.epa.gov/data/api/dailyData/byState", // requires API key
    },
  },
}

// ---------------------------------------------------------------------------
// WebScraper – singleton utility for fetching, retrying, and normalizing data
// ---------------------------------------------------------------------------

export class WebScraper {
  // Singleton ----------------------------------------------------------
  private static instance: WebScraper
  static getInstance(): WebScraper {
    if (!WebScraper.instance) {
      WebScraper.instance = new WebScraper()
    }
    return WebScraper.instance
  }

  private rateLimits: Record<string, { lastCalled: number; delay: number }> = {}

  constructor() {}

  // -------------------------------------------------------------------
  // fetchWithRetry – resilient HTTP fetching with exponential back-off
  // -------------------------------------------------------------------
  async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3,
    cacheTTL?: number,
  ): Promise<any[]> {
    options.cache = options.cache ?? "no-store"
    if (cacheTTL) {
      (options as any).next = { revalidate: cacheTTL }
    }

    let attempt = 0
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30_000)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "HealthEquityDashboard/1.0 (+https://healthequity.nyc)",
            ...(options.headers || {}),
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status >= 500 || response.status === 429) {
            attempt++
            const retryDelay = this.getRetryDelay(response, attempt)
            console.log(
              `[WebScraper] Attempt ${attempt} failed (${response.status}). Retrying in ${retryDelay}ms...`,
            )
            await new Promise((r) => setTimeout(r, retryDelay))
            continue
          }
          throw new Error(`Request failed: ${response.status} ${response.statusText}`)
        }

        // Guard against non-JSON responses (some gov endpoints return HTML on error)
        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          const preview = await response.text()
          console.warn(
            `[WebScraper] Expected JSON from ${url}, received ${contentType}. Preview: ${preview.slice(0, 200)}`,
          )
          return []
        }

        const data = await response.json()
        return Array.isArray(data) ? data : [data]
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.warn(`[WebScraper] Timeout fetching ${url}`)
        }
        attempt++
        if (attempt <= maxRetries) {
          const backoff = Math.min(1000 * Math.pow(2, attempt), 10_000)
          console.log(`[WebScraper] Attempt ${attempt} error: ${error.message}. Retrying in ${backoff}ms...`)
          await new Promise((r) => setTimeout(r, backoff))
        } else {
          console.error(`[WebScraper] Max retries (${maxRetries}) exceeded for ${url}`)
          return []
        }
      }
    }
    return []
  }

  private getRetryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get("Retry-After")
    if (retryAfter) {
      const delay = Number.parseInt(retryAfter)
      return isNaN(delay) ? 1000 * attempt : delay * 1000
    }
    return Math.min(1000 * Math.pow(2, attempt), 10_000)
  }

  // -------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------
  async checkRateLimit(apiName: string, delay: number): Promise<void> {
    if (!this.rateLimits[apiName]) {
      this.rateLimits[apiName] = { lastCalled: 0, delay }
      return
    }

    const now = Date.now()
    const elapsed = now - this.rateLimits[apiName].lastCalled

    if (elapsed < this.rateLimits[apiName].delay) {
      const waitTime = this.rateLimits[apiName].delay - elapsed
      console.log(`[WebScraper] Rate limit for ${apiName}. Waiting ${waitTime}ms...`)
      await new Promise((r) => setTimeout(r, waitTime))
    }

    this.rateLimits[apiName].lastCalled = Date.now()
  }

  // -------------------------------------------------------------------
  // normalizeData – map raw API fields to a consistent internal schema
  // -------------------------------------------------------------------
  normalizeData(rawData: any[], fieldMap: Record<string, string>): any[] {
    if (!Array.isArray(rawData)) return []

    return rawData
      .map((item) => {
        try {
          const normalized: Record<string, any> = {}
          for (const [targetField, sourceField] of Object.entries(fieldMap)) {
            const value = item[sourceField]
            // Coerce numeric-looking strings
            if (typeof value === "string" && !isNaN(Number(value)) && value.trim() !== "") {
              normalized[targetField] = Number(value)
            } else {
              normalized[targetField] = value ?? null
            }
          }
          return normalized
        } catch {
          return null
        }
      })
      .filter(Boolean)
  }

  // -------------------------------------------------------------------
  // CDC Data Fetching
  // -------------------------------------------------------------------
  async fetchCDCData(endpoint: CDCEndpoint, params?: {
    state?: string
    year?: string
    limit?: number
  }): Promise<any[]> {
    await this.checkRateLimit("CDC", 1_000)

    const baseUrl = DATA_SOURCES.CDC.baseUrl
    const path = DATA_SOURCES.CDC.endpoints[endpoint]
    if (!path) {
      console.error(`[WebScraper] Unknown CDC endpoint: ${endpoint}`)
      return []
    }

    const queryParams = new URLSearchParams({
      $limit: String(params?.limit ?? 1000),
      $order: "year DESC",
    })

    const whereConditions: string[] = []
    if (params?.state) whereConditions.push(`locationdesc='${params.state}'`)
    if (params?.year) whereConditions.push(`year='${params.year}'`)
    if (whereConditions.length > 0) {
      queryParams.append("$where", whereConditions.join(" AND "))
    }

    const url = `${baseUrl}${path}?${queryParams.toString()}`
    console.log(`[WebScraper] Fetching CDC (${endpoint}): ${url}`)

    return this.fetchWithRetry(url, {}, 3, 3600)
  }

  // -------------------------------------------------------------------
  // EPA Data Fetching
  // -------------------------------------------------------------------
  async fetchEPAData(params?: {
    state?: string
    year?: string
    pollutant?: string
  }): Promise<any[]> {
    await this.checkRateLimit("EPA", 2_000)

    // The EPA AQS API requires an API key. If one is not set we use the
    // publicly accessible EPA ECHO / Envirofacts REST endpoints instead.
    const epaApiKey = process.env.EPA_API_KEY

    if (epaApiKey) {
      // Use the official EPA AQS API
      const stateCode = params?.state === "New York" ? "36" : "36"
      const year = params?.year ?? new Date().getFullYear().toString()
      const url =
        `https://aqs.epa.gov/data/api/dailyData/byState?email=healthequity@nyc.gov` +
        `&key=${epaApiKey}&param=88101&bdate=${year}0101&edate=${year}1231&state=${stateCode}`

      console.log(`[WebScraper] Fetching EPA AQS API for state ${stateCode}`)
      return this.fetchWithRetry(url, {}, 3, 3600)
    }

    // Fallback: use EPA Envirofacts REST API (no key required)
    // Uses the new data.epa.gov/efservice format for air facility data in NY state
    const url =
      "https://data.epa.gov/efservice/tri.tri_facility/state/equals/NY/1:100/JSON"

    console.log(`[WebScraper] Fetching EPA Envirofacts (no key): ${url}`)
    return this.fetchWithRetry(url, {}, 3, 3600)
  }

  // -------------------------------------------------------------------
  // EpiQuery Data Fetching (NYC DOHMH community-health indicators)
  // -------------------------------------------------------------------
  async fetchEpiQueryData(params: {
    endpoint: string
    year: number
    borough?: string
  }): Promise<any[]> {
    await this.checkRateLimit("EpiQuery", 3_000)

    const baseUrl = "https://a816-health.nyc.gov"
    const url = `${baseUrl}${params.endpoint}`

    try {
      const response = await this.fetchWithRetry(url, {
        headers: {
          "User-Agent": "HealthEquityDashboard/1.0 (+https://healthequity.nyc)",
          Accept: "application/json",
        },
        cache: "no-store",
      })

      // fetchWithRetry now returns parsed data directly
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.warn(`[WebScraper] EpiQuery fetch failed: ${String(error)}`)
      return []
    }
  }

  // -------------------------------------------------------------------
  // NYC Open Data Fetching
  // -------------------------------------------------------------------
  async fetchNYCOpenData(endpoint: string, params?: {
    borough?: string
    limit?: number
    where?: string
  }): Promise<any[]> {
    await this.checkRateLimit("NYCOpenData", 1_000)

    const baseUrl = DATA_SOURCES.NYCOpenData.baseUrl
    const path = DATA_SOURCES.NYCOpenData.endpoints[endpoint]
    if (!path) {
      console.error(`[WebScraper] Unknown NYC Open Data endpoint: ${endpoint}`)
      return []
    }

    const queryParams = new URLSearchParams({
      $limit: String(params?.limit ?? 1000),
      $order: "created_date DESC",
    })

    if (params?.where) {
      queryParams.append("$where", params.where)
    }

    const appToken = process.env.NYC_OPEN_DATA_APP_TOKEN
    if (appToken) {
      queryParams.append("$$app_token", appToken)
    }

    const url = `${baseUrl}${path}?${queryParams.toString()}`
    console.log(`[WebScraper] Fetching NYC Open Data (${endpoint}): ${url}`)

    return this.fetchWithRetry(url, {}, 3, 3600)
  }
}
