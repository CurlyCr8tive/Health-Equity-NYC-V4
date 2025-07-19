"use client"

import { useState, useEffect } from "react"
import type { FilterState } from "@/types"

interface CDCHealthData {
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
  confidence_interval?: string
}

interface CDCHealthStats {
  totalRecords: number
  averageRate: number
  highestRate: number
  lowestRate: number
  conditionsCount: number
  boroughsCount: number
  topConditions: Array<{
    condition: string
    avgRate: number
    count: number
  }>
  boroughBreakdown: Record<
    string,
    {
      count: number
      avgRate: number
    }
  >
}

interface CDCDataResponse {
  success: boolean
  source: string
  data: CDCHealthData[]
  stats: CDCHealthStats
  metadata: {
    total_records: number
    last_updated: string
    source_url?: string
    is_mock?: boolean
    error_details?: any
  }
  error?: string
}

export function useCDCHealthData(filters: FilterState) {
  const [data, setData] = useState<CDCHealthData[]>([])
  const [stats, setStats] = useState<CDCHealthStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCDCData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query parameters from filters
        const params = new URLSearchParams()

        params.append("limit", "1000")
        params.append("state", "New York")

        // Add health condition filter
        if (filters.healthConditions && filters.healthConditions.length > 0) {
          // Use the first selected condition
          params.append("condition", filters.healthConditions[0])
        }

        // Add borough filter
        if (filters.borough && filters.borough !== "allBoroughs") {
          params.append("borough", filters.borough)
        }

        // Add year filter (default to recent years)
        params.append("year", "2023")

        console.log("Fetching CDC data with params:", params.toString())

        const response = await fetch(`/api/cdc-health-data?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: CDCDataResponse = await response.json()

        console.log("CDC data response:", {
          success: result.success,
          recordCount: result.data?.length || 0,
          source: result.source,
        })

        setData(result.data || [])
        setStats(result.stats)

        if (!result.success && result.error) {
          setError(result.error)
        }
      } catch (err) {
        console.error("CDC data fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch CDC data")

        // Set empty data on error
        setData([])
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCDCData()
  }, [filters.healthConditions, filters.borough, filters.raceEthnicities, filters.ageGroups])

  return {
    data,
    stats,
    loading,
    error,
    isEmpty: data.length === 0,
  }
}
