/// lib/web-scraper.ts

export const DATA_SOURCES = {
  CDC: {
    name: "Centers for Disease Control and Prevention",
    url: "https://www.cdc.gov",
    description: "National health condition data",
    reliability: "High",
  },
  EpiQuery: {
    name: "NYC DOHMH EpiQuery",
    url: "https://a816-health.nyc.gov",
    description: "NYC-specific community health indicators",
    reliability: "High",
  },
  NYCOpenData: {
    name: "NYC Open Data Portal",
    url: "https://opendata.cityofnewyork.us",
    description: "Environmental and demographic data for NYC",
    reliability: "Medium",
  },
  EnvironmentalProtectionAgency: {
    name: "Environmental Protection Agency",
    url: "https://www.epa.gov",
    description: "Air quality and environmental data",
    reliability: "High",
  },
}

export class WebScraper {
  private rateLimits: { [key: string]: { lastCalled: number; delay: number } } = {}

  constructor() {}

  // Generic fetch with retry logic
  async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    // guarantee we never accidentally re-use stale responses
    options.cache = options.cache ?? "no-store"
    let attempt = 0
    while (attempt <= maxRetries) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          // Retry on server errors (5xx) and some client errors (429 - Too Many Requests)
          if (response.status >= 500 || response.status === 429) {
            attempt++
            const retryDelay = this.getRetryDelay(response)
            console.log(`Attempt ${attempt} failed with status ${response.status}. Retrying in ${retryDelay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
          } else {
            // Don't retry on other client errors
            throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
          }
        } else {
          return response
        }
      } catch (error: any) {
        attempt++
        if (attempt <= maxRetries) {
          console.log(`Attempt ${attempt} failed with error: ${error}. Retrying...`)
          await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second before retrying
        } else {
          throw error // Re-throw the error if max retries reached
        }
      }
    }
    throw new Error(`Max retries (${maxRetries}) exceeded.`)
  }

  private getRetryDelay(response: Response): number {
    const retryAfter = response.headers.get("Retry-After")
    if (retryAfter) {
      const delay = Number.parseInt(retryAfter)
      return isNaN(delay) ? 1000 : delay * 1000 // Convert seconds to milliseconds
    }
    return 1000 // Default delay of 1 second
  }

  // Rate limiting function
  async checkRateLimit(apiName: string, delay: number): Promise<void> {
    if (!this.rateLimits[apiName]) {
      this.rateLimits[apiName] = { lastCalled: 0, delay }
      return
    }

    const now = Date.now()
    const timeSinceLastCall = now - this.rateLimits[apiName].lastCalled

    if (timeSinceLastCall < this.rateLimits[apiName].delay) {
      const waitTime = this.rateLimits[apiName].delay - timeSinceLastCall
      console.log(`Rate limit for ${apiName} hit. Waiting for ${waitTime}ms before next call.`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.rateLimits[apiName].lastCalled = Date.now()
  }

  // -------------------------------------------------------------
  // EpiQuery Data Fetching (NYC DOHMH community-health indicators)
  // -------------------------------------------------------------
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
        // Many gov endpoints block generic fetches - add UA + accept
        headers: {
          "User-Agent": "HealthEquityDashboard/1.0 (+https://healthequity.nyc)",
          Accept: "application/json",
        },
        // Disable any intermediate caching/proxy that could return HTML
        cache: "no-store",
      })

      /* EpiQuery sometimes replies with HTML (5xx error template)
        even when the HTTP status is 200. Detect this by checking
        the Content-Type header and fall back if it is not JSON. */
      const contentType = response.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        const preview = await response.text()
        console.warn("⚠️ EpiQuery – expected JSON, received %s\nPreview: %s", contentType, preview.slice(0, 250))
        return [] // <-- graceful fallback
      }

      const data = (await response.json()) as unknown
      return Array.isArray(data) ? data : []
    } catch (error) {
      /* Network error, CORS refusal, or final retry exhausted.
         Log the issue and return an empty list so callers can decide
         what to do (the API route will generate mock data). */
      console.warn("❌  EpiQuery fetch failed (%s). Returning [].", String(error))
      return []
    }
  }
}
