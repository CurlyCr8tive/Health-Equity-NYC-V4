"use client"

import { useState, useEffect } from "react"
import type { HealthData, FilterState } from "@/types"

export function useHealthData(filters: FilterState) {
  const [data, setData] = useState<HealthData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHealthData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters.healthCondition && filters.healthCondition !== "allConditions") {
          params.append("condition", filters.healthCondition)
        }
        if (filters.borough && filters.borough !== "allBoroughs") {
          params.append("borough", filters.borough)
        }
        if (filters.ageGroup && filters.ageGroup !== "allAges") {
          params.append("ageGroup", filters.ageGroup)
        }
        if (filters.raceEthnicity && filters.raceEthnicity !== "allGroups") {
          params.append("raceEthnicity", filters.raceEthnicity)
        }

        const response = await fetch(`/api/nyc-health?${params}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to fetch health data")
          setData(result.data || []) // Use fallback data
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        // Load mock data as fallback
        const { mockHealthData } = await import("@/lib/mock-data")
        setData(mockHealthData)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthData()
  }, [filters])

  return { data, loading, error }
}
