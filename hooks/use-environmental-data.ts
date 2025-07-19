"use client"

import { useState, useEffect } from "react"
import type { FilterState } from "@/types"

export function useEnvironmentalData(filters: FilterState) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (filters.borough && filters.borough !== "allBoroughs") {
          params.append("borough", filters.borough)
        }

        // Fetch data for active overlays
        const activeOverlays = Object.entries(filters.overlays)
          .filter(([_, active]) => active)
          .map(([key, _]) => key)

        if (activeOverlays.length > 0) {
          const promises = activeOverlays.map((overlay) => {
            const overlayParams = new URLSearchParams(params)
            overlayParams.append("overlay", overlay)
            return fetch(`/api/environmental?${overlayParams}`)
          })

          const responses = await Promise.all(promises)
          const results = await Promise.all(responses.map((r) => r.json()))

          const combinedData = results.flatMap((result) => result.data || [])
          setData(combinedData)
        } else {
          setData([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        // Load mock data as fallback
        const { mockEnvironmentalData } = await import("@/lib/mock-data")
        setData(mockEnvironmentalData)
      } finally {
        setLoading(false)
      }
    }

    fetchEnvironmentalData()
  }, [filters])

  return { data, loading, error }
}
