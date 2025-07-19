"use client"

import { useState, useEffect } from "react"

export interface PerplexityQuery {
  healthConditions?: string[]
  borough?: string
  neighborhood?: string
  environmentalFactors?: string[]
}

interface PerplexityResponse {
  success: boolean
  content?: string
  citations?: Array<{ url: string; title?: string }>
  isRealTime?: boolean
  error?: string
}

interface InsightsData {
  overview: string
  healthData: string
  environment: string
  takeAction: string
}

export function usePerplexityInsights(query: PerplexityQuery) {
  const [data, setData] = useState<{
    success: boolean
    insights: InsightsData
    citations: Array<{ url: string; title?: string }>
    isRealTime: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    if (!query.healthConditions?.length && !query.environmentalFactors?.length) {
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const location = query.neighborhood || query.borough || "New York City"
      const conditions = query.healthConditions?.join(", ") || "general health conditions"
      const envFactors = query.environmentalFactors?.join(", ") || ""

      const queryText = `Provide health insights for ${conditions} in ${location}, NYC. ${
        envFactors ? `Also include environmental factors: ${envFactors}.` : ""
      } Include current statistics, trends, and actionable recommendations.`

      const response = await fetch("/api/perplexity/health-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryText }),
      })

      const result: PerplexityResponse = await response.json()

      if (result.success && result.content) {
        // Parse the content into structured insights
        const content = result.content
        setData({
          success: true,
          insights: {
            overview: content.substring(0, 300) + "...",
            healthData: content.substring(300, 600) + "...",
            environment: content.substring(600, 900) + "...",
            takeAction:
              content.substring(900) ||
              "Consult with healthcare providers and community resources for personalized guidance.",
          },
          citations: result.citations || [],
          isRealTime: result.isRealTime || false,
        })
      } else {
        setError(result.error || "Failed to fetch insights")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Insights fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchInsights()
  }

  useEffect(() => {
    fetchInsights()
  }, [query.healthConditions, query.borough, query.neighborhood, query.environmentalFactors])

  return { data, loading, error, refetch }
}
