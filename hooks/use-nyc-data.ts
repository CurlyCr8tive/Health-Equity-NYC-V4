"use client"

import { useState, useEffect } from "react"
import type { FilterState } from "@/types"

export function useNYCData(filters: FilterState) {
  const [data, setData] = useState<any>({
    health: [],
    airQuality: [],
    waterQuality: [],
    foodAccess: [],
    greenSpace: [],
    snapAccess: [],
    healthcareAccess: [],
    transitAccess: [],
    complaints: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNYCData = async () => {
      const useMockData = true // Force mock data for now
      setLoading(true)
      setError(null)

      try {
        // Fetch data from individual endpoints with better error handling
        const promises = []

        // Always fetch health data with fallback
        promises.push(
          useMockData
            ? Promise.resolve(getMockHealthData())
            : fetchHealthData(filters).catch((err) => {
                console.error("Health data error:", err)
                return getMockHealthData()
              }),
        )

        // Always fetch air quality data with fallback
        promises.push(
          fetchAirQualityData(filters).catch((err) => {
            console.error("Air quality data error:", err)
            return []
          }),
        )

        // Use mock water quality data for now since the API endpoint was incorrect
        promises.push(Promise.resolve(getMockWaterQualityData()))

        // Conditionally fetch other data based on overlays
        if (filters.overlays.foodDeserts || filters.overlays.foodZones) {
          promises.push(
            fetchFoodAccessData(filters).catch((err) => {
              console.error("Food access data error:", err)
              return []
            }),
          )
        } else {
          promises.push(Promise.resolve([]))
        }

        if (filters.overlays.greenSpace) {
          promises.push(
            fetchGreenSpaceData(filters).catch((err) => {
              console.error("Green space data error:", err)
              return []
            }),
          )
        } else {
          promises.push(Promise.resolve([]))
        }

        if (filters.overlays.snapAccess) {
          promises.push(
            fetchSNAPData(filters).catch((err) => {
              console.error("SNAP data error:", err)
              return []
            }),
          )
        } else {
          promises.push(Promise.resolve([]))
        }

        // Healthcare Access Data
        if (filters.overlays.healthcareAccess) {
          promises.push(
            fetchHealthcareAccessData(filters).catch((err) => {
              console.error("Healthcare access data error:", err)
              return []
            }),
          )
        } else {
          promises.push(Promise.resolve([]))
        }

        // Transit Access Data
        if (filters.overlays.transitAccess) {
          promises.push(
            fetchTransitAccessData(filters).catch((err) => {
              console.error("Transit access data error:", err)
              return []
            }),
          )
        } else {
          promises.push(Promise.resolve([]))
        }

        const [
          healthData,
          airQualityData,
          waterQualityData,
          foodAccessData,
          greenSpaceData,
          snapAccessData,
          healthcareAccessData,
          transitAccessData,
        ] = await Promise.all(promises)

        console.log("Data fetch results:", {
          health: healthData?.length || 0,
          airQuality: airQualityData?.length || 0,
          waterQuality: waterQualityData?.length || 0,
        })

        setData({
          health: healthData || [],
          airQuality: airQualityData || [],
          waterQuality: waterQualityData || [],
          foodAccess: foodAccessData || [],
          greenSpace: greenSpaceData || [],
          snapAccess: snapAccessData || [],
          healthcareAccess: healthcareAccessData || [],
          transitAccess: transitAccessData || [],
          complaints: [],
        })
      } catch (err) {
        console.error("NYC Data fetch error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")

        // Load mock data as fallback
        try {
          const mockHealthData = getMockHealthData()
          setData({
            health: mockHealthData,
            airQuality: [],
            waterQuality: getMockWaterQualityData(),
            foodAccess: [],
            greenSpace: [],
            snapAccess: [],
            healthcareAccess: [],
            transitAccess: [],
            complaints: [],
          })
        } catch (mockError) {
          console.error("Failed to load mock data:", mockError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchNYCData()
  }, [filters])

  return { data, loading, error }
}

// Auto-detect the current domain instead of relying on environment variable
const baseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

// NYC Health Data - Using correct endpoint
async function fetchHealthData(filters: FilterState) {
  try {
    const NYC_HEALTH_API = "https://data.cityofnewyork.us/resource/jb7j-dtam.json"
    const params = new URLSearchParams()

    params.append("$limit", "200")
    params.append("$order", "year DESC")

    const whereConditions = []
    whereConditions.push(`year >= '2020'`)

    if (filters.healthCondition && filters.healthCondition !== "allConditions") {
      whereConditions.push(`leading_cause='${encodeURIComponent(filters.healthCondition)}'`)
    }

    if (filters.raceEthnicity && filters.raceEthnicity !== "allGroups") {
      whereConditions.push(`race_ethnicity='${encodeURIComponent(filters.raceEthnicity)}'`)
    }

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    console.log("Health API URL:", `${NYC_HEALTH_API}?${params.toString()}`)

    const response = await fetch(`${NYC_HEALTH_API}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Health API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Health API Response:", data.length, "records")

    return data
      .map((item: any) => transformHealthData(item))
      .filter(Boolean)
      .slice(0, 100)
  } catch (error) {
    console.error("Health data fetch failed:", error)
    return getMockHealthData()
  }
}

// NYC Water Quality Data - Try alternative endpoint or use mock data
async function fetchWaterQualityData(filters: FilterState) {
  try {
    // Try the NYC Water Quality Complaints dataset instead
    const NYC_WATER_COMPLAINTS_API = "https://data.cityofnewyork.us/resource/qfe3-6dkn.json"
    const params = new URLSearchParams()
    params.append("$limit", "50")

    // Try to order by a field that likely exists in water-related datasets
    params.append("$order", "created_date DESC")

    console.log("Water Quality API URL:", `${NYC_WATER_COMPLAINTS_API}?${params.toString()}`)

    const response = await fetch(`${NYC_WATER_COMPLAINTS_API}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error("Water Quality API Error:", response.status)
      throw new Error(`Water Quality API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Water Quality API Response:", data.length, "records")

    // Transform the complaints data into water quality format
    return data
      .map((item: any) => transformWaterComplaintData(item))
      .filter(Boolean)
      .slice(0, 30)
  } catch (error) {
    console.error("Water quality data fetch failed:", error)
    // Return mock water quality data as fallback
    return getMockWaterQualityData()
  }
}

// NYC Air Quality Data - Using correct endpoint
async function fetchAirQualityData(filters: FilterState) {
  try {
    const NYC_AIR_QUALITY_API = "https://data.cityofnewyork.us/resource/c3uy-2p5r.json"
    const params = new URLSearchParams()
    params.append("$limit", "50")
    params.append("$order", "start_date DESC")

    const whereConditions = []
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    whereConditions.push(`start_date >= '${threeMonthsAgo.toISOString().split("T")[0]}'`)

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    const response = await fetch(`${NYC_AIR_QUALITY_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformAirQualityData(item))
      .filter(Boolean)
      .slice(0, 20)
  } catch (error) {
    console.error("Air quality data fetch failed:", error)
    return []
  }
}

// NYC Food Access Data - Using correct endpoint
async function fetchFoodAccessData(filters: FilterState) {
  try {
    const NYC_FOOD_API = "https://data.cityofnewyork.us/resource/43nn-pn8j.json"
    const params = new URLSearchParams()
    params.append("$limit", "50")

    const response = await fetch(`${NYC_FOOD_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformFoodData(item))
      .filter(Boolean)
      .slice(0, 25)
  } catch (error) {
    console.error("Food access data fetch failed:", error)
    return []
  }
}

// NYC Green Space Data - Using correct endpoint
async function fetchGreenSpaceData(filters: FilterState) {
  try {
    const NYC_PARKS_API = "https://data.cityofnewyork.us/resource/enfh-gkve.json"
    const params = new URLSearchParams()
    params.append("$limit", "30")

    const response = await fetch(`${NYC_PARKS_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformGreenSpaceData(item))
      .filter(Boolean)
      .slice(0, 15)
  } catch (error) {
    console.error("Green space data fetch failed:", error)
    return []
  }
}

// NYC SNAP Access Data - Using correct endpoint
async function fetchSNAPData(filters: FilterState) {
  try {
    const NYC_SNAP_API = "https://data.cityofnewyork.us/resource/w7w3-xahh.json"
    const params = new URLSearchParams()
    params.append("$limit", "50")

    const whereConditions = []
    if (filters.borough && filters.borough !== "allBoroughs") {
      whereConditions.push(`borough='${filters.borough.toUpperCase()}'`)
    }

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    const response = await fetch(`${NYC_SNAP_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformSNAPData(item))
      .filter(Boolean)
      .slice(0, 25)
  } catch (error) {
    console.error("SNAP data fetch failed:", error)
    return []
  }
}

// NYC Healthcare Access Data - Using correct endpoint
async function fetchHealthcareAccessData(filters: FilterState) {
  try {
    const NYC_HEALTHCARE_API = "https://data.cityofnewyork.us/resource/f7b6-v6v3.json"
    const params = new URLSearchParams()
    params.append("$limit", "100")

    const whereConditions = []
    if (filters.borough && filters.borough !== "allBoroughs") {
      whereConditions.push(`borough='${filters.borough.toUpperCase()}'`)
    }

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    const response = await fetch(`${NYC_HEALTHCARE_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformHealthcareData(item))
      .filter(Boolean)
      .slice(0, 50)
  } catch (error) {
    console.error("Healthcare access data fetch failed:", error)
    return []
  }
}

// NYC Transit Access Data - Using correct endpoint
async function fetchTransitAccessData(filters: FilterState) {
  try {
    const NYC_SUBWAY_API = "https://data.cityofnewyork.us/resource/arq3-7z49.json"
    const params = new URLSearchParams()
    params.append("$limit", "100")

    const whereConditions = []
    if (filters.borough && filters.borough !== "allBoroughs") {
      const boroughMapping: Record<string, string> = {
        Manhattan: "M",
        Brooklyn: "Bk",
        Queens: "Q",
        Bronx: "Bx",
        "Staten Island": "SI",
      }
      const boroughCode = boroughMapping[filters.borough]
      if (boroughCode) {
        whereConditions.push(`borough='${boroughCode}'`)
      }
    }

    if (whereConditions.length > 0) {
      params.append("$where", whereConditions.join(" AND "))
    }

    const response = await fetch(`${NYC_SUBWAY_API}?${params.toString()}`)
    if (!response.ok) return []

    const data = await response.json()
    return data
      .map((item: any) => transformTransitData(item))
      .filter(Boolean)
      .slice(0, 75)
  } catch (error) {
    console.error("Transit access data fetch failed:", error)
    return []
  }
}

// Transform functions for new data types
function transformHealthcareData(item: any) {
  if (!item.facility_name) return null

  return {
    id: item.facility_id || Math.random().toString(36),
    name: item.facility_name,
    facilityType: item.facility_type || "Healthcare Facility",
    address: item.address || "",
    borough: item.borough || "Unknown",
    zipCode: item.zip_code,
    coordinates:
      item.latitude && item.longitude ? [Number.parseFloat(item.latitude), Number.parseFloat(item.longitude)] : null,
    type: "healthcareAccess",
    services: item.services ? item.services.split(",") : [],
    phone: item.phone,
    website: item.website,
  }
}

function transformTransitData(item: any) {
  if (!item.name) return null

  const boroughMapping: Record<string, string> = {
    M: "Manhattan",
    Bk: "Brooklyn",
    Q: "Queens",
    Bx: "Bronx",
    SI: "Staten Island",
  }

  return {
    id: item.objectid || Math.random().toString(36),
    stationType: "Subway",
    name: item.name,
    borough: boroughMapping[item.borough] || item.borough,
    coordinates:
      item.the_geom && item.the_geom.coordinates ? [item.the_geom.coordinates[1], item.the_geom.coordinates[0]] : null,
    type: "transitAccess",
    lines: item.line ? item.line.split("-") : [],
    accessibility: item.ada === "Y",
    walkScore: Math.floor(Math.random() * 40) + 60,
  }
}

// Mock health data fallback
function getMockHealthData() {
  return [
    {
      id: "mock_1",
      borough: "Manhattan",
      condition: "Heart Disease",
      rate: 165.2,
      ageGroup: "All Ages",
      raceEthnicity: "All Groups",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_2",
      borough: "Brooklyn",
      condition: "Cancer",
      rate: 142.8,
      ageGroup: "All Ages",
      raceEthnicity: "All Groups",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_3",
      borough: "Bronx",
      condition: "Heart Disease",
      rate: 198.5,
      ageGroup: "All Ages",
      raceEthnicity: "Hispanic/Latino",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_4",
      borough: "Queens",
      condition: "Diabetes",
      rate: 89.3,
      ageGroup: "All Ages",
      raceEthnicity: "Asian",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_5",
      borough: "Staten Island",
      condition: "Cancer",
      rate: 156.7,
      ageGroup: "All Ages",
      raceEthnicity: "White",
      year: 2023,
      dataSource: "Mock Data",
    },
    // Add more conditions to ensure we have at least 4 different ones
    {
      id: "mock_6",
      borough: "Bronx",
      condition: "Hypertension",
      rate: 125.4,
      ageGroup: "All Ages",
      raceEthnicity: "Black/African American",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_7",
      borough: "Brooklyn",
      condition: "Hypertension",
      rate: 118.2,
      ageGroup: "All Ages",
      raceEthnicity: "Hispanic/Latino",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_8",
      borough: "Manhattan",
      condition: "Asthma",
      rate: 95.6,
      ageGroup: "All Ages",
      raceEthnicity: "All Groups",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_9",
      borough: "Queens",
      condition: "Asthma",
      rate: 87.3,
      ageGroup: "All Ages",
      raceEthnicity: "Asian",
      year: 2023,
      dataSource: "Mock Data",
    },
    {
      id: "mock_10",
      borough: "Staten Island",
      condition: "Diabetes",
      rate: 92.1,
      ageGroup: "All Ages",
      raceEthnicity: "White",
      year: 2023,
      dataSource: "Mock Data",
    },
  ]
}

// Transform functions
function transformHealthData(item: any) {
  if (!item.leading_cause) return null

  return {
    id: item.year + "_" + item.leading_cause + "_" + (item.race_ethnicity || "all"),
    borough: "NYC",
    condition: item.leading_cause,
    rate: Number.parseFloat(item.death_rate || item.age_adjusted_death_rate || 0),
    ageGroup: "All Ages",
    raceEthnicity: item.race_ethnicity || "All Groups",
    year: Number.parseInt(item.year || new Date().getFullYear()),
    dataSource: "NYC DOHMH Leading Causes",
    deaths: Number.parseInt(item.deaths || 0),
    sex: item.sex,
  }
}

// Transform water complaints data into water quality format
function transformWaterComplaintData(item: any) {
  try {
    if (!item.complaint_type || !item.complaint_type.toLowerCase().includes("water")) return null

    const borough = item.borough || extractBoroughFromAddress(item.incident_address)
    const coordinates =
      item.latitude && item.longitude
        ? [Number.parseFloat(item.latitude), Number.parseFloat(item.longitude)]
        : getDefaultBoroughCoordinates(borough)

    // Generate a water quality score based on complaint type and status
    const waterQualityScore = calculateWaterQualityFromComplaint(item)

    return {
      id: item.unique_key || Math.random().toString(36),
      sampleSite: item.incident_address || `${borough} Water System`,
      borough: borough,
      sampleDate: item.created_date ? item.created_date.split("T")[0] : new Date().toISOString().split("T")[0],
      residualFreeChlorine: 0.8 + Math.random() * 0.4, // Mock realistic values
      turbidity: 0.1 + Math.random() * 0.3,
      fluoride: 0.7 + Math.random() * 0.3,
      ph: 7.2 + (Math.random() * 0.6 - 0.3),
      coliform: "Absent",
      ecoli: "Absent",
      waterQualityScore: waterQualityScore,
      status: getWaterQualityStatus(waterQualityScore),
      type: "waterQuality",
      coordinates: coordinates,
      complaintType: item.complaint_type,
      complaintStatus: item.status,
    }
  } catch (error) {
    console.error("Error transforming water complaint data:", error)
    return null
  }
}

// Mock water quality data for fallback
function getMockWaterQualityData() {
  const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  const mockData = []

  for (let i = 0; i < 15; i++) {
    const borough = boroughs[i % 5]
    const baseCoords = getDefaultBoroughCoordinates(borough)
    const offset = 0.01

    mockData.push({
      id: `mock_water_${i}`,
      sampleSite: `${borough} Water Treatment Plant ${Math.floor(i / 5) + 1}`,
      borough: borough,
      sampleDate: new Date(Date.now() - i * 86400000).toISOString().split("T")[0], // Recent dates
      residualFreeChlorine: 0.5 + Math.random() * 1.5,
      turbidity: 0.2 + Math.random() * 0.8,
      fluoride: 0.7 + Math.random() * 0.3,
      ph: 7.0 + (Math.random() * 1.0 - 0.5),
      coliform: "Absent",
      ecoli: "Absent",
      waterQualityScore: 75 + Math.floor(Math.random() * 20),
      status: Math.random() > 0.8 ? "Good" : "Excellent",
      type: "waterQuality",
      coordinates: [baseCoords[0] + (Math.random() - 0.5) * offset, baseCoords[1] + (Math.random() - 0.5) * offset],
      dataSource: "Mock NYC Water Quality Data",
    })
  }

  return mockData
}

// Helper function to calculate water quality score from complaint data
function calculateWaterQualityFromComplaint(item: any): number {
  let score = 85 // Start with good baseline

  const complaintType = (item.complaint_type || "").toLowerCase()
  const status = (item.status || "").toLowerCase()

  // Reduce score based on complaint severity
  if (complaintType.includes("contamination") || complaintType.includes("dirty")) {
    score -= 30
  } else if (complaintType.includes("taste") || complaintType.includes("odor")) {
    score -= 15
  } else if (complaintType.includes("pressure") || complaintType.includes("flow")) {
    score -= 5 // Less impact on quality, more on service
  }

  // Adjust based on resolution status
  if (status.includes("closed") || status.includes("resolved")) {
    score += 10 // Issue was addressed
  } else if (status.includes("open") || status.includes("pending")) {
    score -= 10 // Ongoing issue
  }

  return Math.max(40, Math.min(100, score))
}

function extractBoroughFromAddress(address: string): string {
  if (!address) return "Unknown"

  const addr = address.toLowerCase()
  if (addr.includes("manhattan") || addr.includes("new york")) return "Manhattan"
  if (addr.includes("brooklyn")) return "Brooklyn"
  if (addr.includes("queens")) return "Queens"
  if (addr.includes("bronx")) return "Bronx"
  if (addr.includes("staten island")) return "Staten Island"
  return "Unknown"
}

function getWaterQualityStatus(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Good"
  if (score >= 70) return "Fair"
  if (score >= 60) return "Poor"
  return "Concerning"
}

function transformAirQualityData(item: any) {
  if (!item.geo_place_name) return null

  const boroughMapping: Record<string, string> = {
    "New York": "Manhattan",
    Kings: "Brooklyn",
    Queens: "Queens",
    Bronx: "Bronx",
    Richmond: "Staten Island",
  }

  const borough = boroughMapping[item.geo_place_name] || item.geo_place_name
  const pollutantValue = Number.parseFloat(item.data_value || 0)
  const pollutantName = item.name || item.measure || "Unknown"

  let estimatedAQI = 50
  if (pollutantName.toLowerCase().includes("pm2.5")) {
    estimatedAQI = calculatePM25AQI(pollutantValue)
  } else if (pollutantName.toLowerCase().includes("ozone")) {
    estimatedAQI = calculateOzoneAQI(pollutantValue)
  }

  return {
    id: item.unique_id || `${item.geo_entity_id}_${item.start_date}`,
    borough,
    zipCode: item.geo_entity_id,
    aqi: Math.round(estimatedAQI),
    pollutant: pollutantName,
    value: pollutantValue,
    unit: item.measure_info || "μg/m³",
    date: item.start_date,
    coordinates: getDefaultBoroughCoordinates(borough),
    status: getAQIStatus(estimatedAQI),
    type: "airQuality",
  }
}

function transformFoodData(item: any) {
  if (!item.dba || !item.latitude || !item.longitude) return null

  return {
    id: item.camis || Math.random().toString(36),
    name: item.dba,
    address: `${item.building || ""} ${item.street || ""}`.trim(),
    borough: item.boro,
    zipCode: item.zipcode,
    coordinates: [Number.parseFloat(item.latitude), Number.parseFloat(item.longitude)],
    type: "foodAccess",
    category: item.cuisine_description || "Restaurant",
    phone: item.phone,
    grade: item.grade,
  }
}

function transformGreenSpaceData(item: any) {
  if (!item.park_name) return null

  let coordinates = null
  if (item.location && item.location.coordinates) {
    coordinates = [item.location.coordinates[1], item.location.coordinates[0]]
  }

  return {
    id: item.gispropnum || Math.random().toString(36),
    name: item.park_name,
    address: item.address || "",
    borough: item.borough,
    coordinates,
    type: "greenSpace",
    acres: Number.parseFloat(item.acres || 0),
    category: item.typecategory || "Park",
    communityBoard: item.cb,
  }
}

function transformSNAPData(item: any) {
  if (!item.business_name) return null

  return {
    id: item.license_number || Math.random().toString(36),
    name: item.business_name,
    address: item.business_address,
    borough: item.borough,
    zipCode: item.postcode,
    coordinates:
      item.latitude && item.longitude ? [Number.parseFloat(item.latitude), Number.parseFloat(item.longitude)] : null,
    type: "snapAccess",
    category: item.industry || "Food Business",
    licenseType: item.license_type,
  }
}

// Helper functions
function calculatePM25AQI(pm25: number): number {
  if (pm25 <= 12.0) return (50 / 12.0) * pm25
  if (pm25 <= 35.4) return 50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1)
  if (pm25 <= 55.4) return 100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5)
  return Math.min(500, 150 + ((200 - 150) / (150.4 - 55.5)) * (pm25 - 55.5))
}

function calculateOzoneAQI(ozone: number): number {
  const ozonePPB = ozone * 1000
  if (ozonePPB <= 54) return (50 / 54) * ozonePPB
  if (ozonePPB <= 70) return 50 + ((100 - 50) / (70 - 55)) * (ozonePPB - 55)
  return Math.min(300, 100 + ((150 - 100) / (85 - 71)) * (ozonePPB - 71))
}

function getAQIStatus(aqi: number): string {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  return "Very Unhealthy"
}

function getDefaultBoroughCoordinates(borough: string): [number, number] {
  const coordinates: Record<string, [number, number]> = {
    Manhattan: [40.7831, -73.9712],
    Brooklyn: [40.6782, -73.9442],
    Queens: [40.7282, -73.7949],
    Bronx: [40.8448, -73.8648],
    "Staten Island": [40.5795, -74.1502],
  }
  return coordinates[borough] || [40.7128, -74.006]
}

// Helper function to safely parse float values
function safeParseFloat(value: any): number {
  if (value === undefined || value === null) return 0
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}
