// CDC Data Processing Utilities

export interface CDCRawData {
  year: string
  locationabbr: string
  locationdesc: string
  datasource: string
  topic: string
  question: string
  response: string
  datavalueunit: string
  datavalue: string
  data_value_alt: string
  data_value_footnote_symbol: string
  data_value_footnote: string
  confidence_limit_low: string
  confidence_limit_high: string
  sample_size: string
  stratification1: string
  stratification2: string
  stratification3: string
  geolocation: {
    latitude: string
    longitude: string
    human_address: string
  }
}

export interface ProcessedHealthData {
  id: string
  condition: string
  borough: string
  neighborhood: string
  rate: number
  cases: number
  population: number
  ageGroup: string
  raceEthnicity: string
  gender: string
  year: number
  dataSource: string
  measure: string
  unit: string
  confidenceInterval?: string
  geolocation?: {
    lat: number
    lng: number
    address: string
  }
}

export class CDCDataProcessor {
  static async fetchCDCData(params: {
    limit?: number
    state?: string
    condition?: string
    year?: string
    borough?: string
  }): Promise<CDCRawData[]> {
    const { limit = 1000, state = "New York", condition, year, borough } = params

    // Build CDC API URL
    const cdcUrl = new URL("https://data.cdc.gov/resource/55yu-xksw.json")
    cdcUrl.searchParams.append("$limit", limit.toString())
    cdcUrl.searchParams.append("$order", "year DESC")

    // Build where conditions
    const whereConditions = []

    if (state) {
      whereConditions.push(`locationdesc='${state}'`)
    }

    if (condition && condition !== "allConditions") {
      whereConditions.push(`topic='${condition}'`)
    }

    if (year) {
      whereConditions.push(`year='${year}'`)
    }

    if (whereConditions.length > 0) {
      cdcUrl.searchParams.append("$where", whereConditions.join(" AND "))
    }

    console.log("Fetching CDC data from:", cdcUrl.toString())

    const response = await fetch(cdcUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Health-Equity-NYC-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`CDC API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  static transformCDCData(rawData: CDCRawData[], filterBorough?: string): ProcessedHealthData[] {
    if (!Array.isArray(rawData)) return []

    return rawData
      .map((item) => {
        try {
          const condition = item.topic || item.question || "Unknown Condition"
          const dataValue = Number.parseFloat(item.datavalue || item.data_value_alt || "0")
          const year = Number.parseInt(item.year || new Date().getFullYear().toString())

          // Map CDC location to NYC boroughs
          const borough = this.mapLocationToBorough(item.locationdesc, item.geolocation)

          // Skip if filtering by borough and this doesn't match
          if (filterBorough && filterBorough !== "allBoroughs" && borough !== filterBorough) {
            return null
          }

          // Process geolocation
          let geolocation = undefined
          if (item.geolocation) {
            geolocation = {
              lat: Number.parseFloat(item.geolocation.latitude || "0"),
              lng: Number.parseFloat(item.geolocation.longitude || "0"),
              address: item.geolocation.human_address || "",
            }
          }

          return {
            id: `cdc_${item.year}_${item.topic}_${borough}`.replace(/\s+/g, "_"),
            condition,
            borough,
            neighborhood: item.geolocation?.human_address?.split(",")[0] || borough,
            rate: dataValue,
            cases: Number.parseInt(item.sample_size || "0"),
            population: this.estimatePopulation(borough),
            ageGroup: item.stratification1 || "All Ages",
            raceEthnicity: item.stratification2 || "All Groups",
            gender: item.stratification3 || "All Genders",
            year,
            dataSource: item.datasource || "CDC",
            measure: item.question || "Prevalence",
            unit: item.datavalueunit || "%",
            confidenceInterval:
              item.confidence_limit_low && item.confidence_limit_high
                ? `${item.confidence_limit_low}-${item.confidence_limit_high}`
                : undefined,
            geolocation,
          }
        } catch (error) {
          console.error("Error transforming CDC record:", error, item)
          return null
        }
      })
      .filter(Boolean) as ProcessedHealthData[]
  }

  static mapLocationToBorough(locationDesc: string, geolocation?: any): string {
    if (!locationDesc) return "Unknown"

    const location = locationDesc.toLowerCase()

    // Direct borough matches
    if (location.includes("manhattan") || location.includes("new york county")) return "Manhattan"
    if (location.includes("brooklyn") || location.includes("kings county")) return "Brooklyn"
    if (location.includes("queens") || location.includes("queens county")) return "Queens"
    if (location.includes("bronx") || location.includes("bronx county")) return "Bronx"
    if (location.includes("staten island") || location.includes("richmond county")) return "Staten Island"

    // If it's New York state/city level data, use geolocation or distribute
    if (location.includes("new york")) {
      if (geolocation?.latitude && geolocation?.longitude) {
        return this.getBoroughFromCoordinates(
          Number.parseFloat(geolocation.latitude),
          Number.parseFloat(geolocation.longitude),
        )
      }
      // Fallback to random distribution for demo
      const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
      return boroughs[Math.floor(Math.random() * boroughs.length)]
    }

    return "NYC"
  }

  static getBoroughFromCoordinates(lat: number, lng: number): string {
    // Approximate borough boundaries (simplified)
    if (lat >= 40.7 && lat <= 40.8 && lng >= -74.02 && lng <= -73.93) return "Manhattan"
    if (lat >= 40.57 && lat <= 40.74 && lng >= -74.05 && lng <= -73.83) return "Brooklyn"
    if (lat >= 40.49 && lat <= 40.8 && lng >= -73.96 && lng <= -73.7) return "Queens"
    if (lat >= 40.79 && lat <= 40.92 && lng >= -73.93 && lng <= -73.76) return "Bronx"
    if (lat >= 40.47 && lat <= 40.65 && lng >= -74.26 && lng <= -74.05) return "Staten Island"

    return "NYC"
  }

  static estimatePopulation(borough: string): number {
    // Approximate populations (2020 Census)
    const populations = {
      Manhattan: 1694251,
      Brooklyn: 2736074,
      Queens: 2405464,
      Bronx: 1472654,
      "Staten Island": 495747,
      NYC: 8336817,
      Unknown: 100000,
    }

    return populations[borough as keyof typeof populations] || 100000
  }

  static calculateHealthStats(data: ProcessedHealthData[]) {
    if (!data.length) {
      return {
        totalRecords: 0,
        averageRate: 0,
        highestRate: 0,
        lowestRate: 0,
        conditionsCount: 0,
        boroughsCount: 0,
        topConditions: [],
        boroughBreakdown: {},
        yearRange: { min: 0, max: 0 },
      }
    }

    const rates = data.map((item) => item.rate).filter((rate) => !isNaN(rate))
    const conditions = [...new Set(data.map((item) => item.condition))]
    const boroughs = [...new Set(data.map((item) => item.borough))]
    const years = data.map((item) => item.year).filter((year) => !isNaN(year))

    // Calculate top conditions by average rate
    const conditionStats = conditions
      .map((condition) => {
        const conditionData = data.filter((item) => item.condition === condition)
        const avgRate = conditionData.reduce((sum, item) => sum + item.rate, 0) / conditionData.length
        return { condition, avgRate, count: conditionData.length }
      })
      .sort((a, b) => b.avgRate - a.avgRate)

    // Calculate borough breakdown
    const boroughBreakdown = boroughs.reduce(
      (acc, borough) => {
        const boroughData = data.filter((item) => item.borough === borough)
        const avgRate = boroughData.reduce((sum, item) => sum + item.rate, 0) / boroughData.length
        acc[borough] = {
          count: boroughData.length,
          avgRate: Number.parseFloat(avgRate.toFixed(1)),
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      totalRecords: data.length,
      averageRate: Number.parseFloat((rates.reduce((sum, rate) => sum + rate, 0) / rates.length).toFixed(1)),
      highestRate: Number.parseFloat(Math.max(...rates).toFixed(1)),
      lowestRate: Number.parseFloat(Math.min(...rates).toFixed(1)),
      conditionsCount: conditions.length,
      boroughsCount: boroughs.length,
      topConditions: conditionStats.slice(0, 5),
      boroughBreakdown,
      yearRange: {
        min: Math.min(...years),
        max: Math.max(...years),
      },
    }
  }
}
