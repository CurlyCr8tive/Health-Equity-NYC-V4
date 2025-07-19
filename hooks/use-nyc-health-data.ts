"use client"

import { useState, useEffect } from "react"
import type { HealthData, EnvironmentalData } from "@/types"

interface NYCHealthDataResponse {
  health: HealthData[]
  environmental: EnvironmentalData[]
  lastUpdated: string
}

export function useNYCHealthData() {
  const [data, setData] = useState<NYCHealthDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNYCHealthData()
  }, [])

  const fetchNYCHealthData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch combined NYC data
      const response = await fetch("/api/nyc-data/combined")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      setData(result)
    } catch (err) {
      console.error("Error fetching NYC health data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch health data")

      // Fallback to mock data
      setData({
        health: generateMockHealthData(),
        environmental: generateMockEnvironmentalData(),
        lastUpdated: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch: fetchNYCHealthData }
}

function generateMockHealthData(): HealthData[] {
  const conditions = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Asthma",
    "Depression",
    "Obesity",
    "Cancer",
    "Stroke",
    "COPD",
    "Anxiety",
    "Substance Use",
    "HIV/AIDS",
    "Kidney Disease",
    "Arthritis",
    "Osteoporosis",
  ]

  const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  const ageGroups = ["0-17", "18-34", "35-54", "55-74", "75+"]
  const raceEthnicities = ["White", "Black/African American", "Hispanic/Latino", "Asian", "Other"]

  const mockData: HealthData[] = []

  conditions.forEach((condition) => {
    boroughs.forEach((borough) => {
      ageGroups.forEach((ageGroup) => {
        raceEthnicities.forEach((raceEthnicity) => {
          // Generate realistic rates based on condition and demographics
          let baseRate = Math.random() * 20 + 5 // 5-25% base rate

          // Adjust rates based on known health disparities
          if (condition === "Diabetes" && raceEthnicity === "Hispanic/Latino") baseRate *= 1.5
          if (condition === "Hypertension" && raceEthnicity === "Black/African American") baseRate *= 1.4
          if (condition === "Asthma" && borough === "Bronx") baseRate *= 1.3
          if (ageGroup === "75+" && ["Heart Disease", "Stroke", "Diabetes"].includes(condition)) baseRate *= 1.6

          mockData.push({
            id: `${condition}-${borough}-${ageGroup}-${raceEthnicity}`.replace(/\s+/g, "-"),
            condition,
            borough,
            ageGroup,
            raceEthnicity,
            rate: Math.min(Math.round(baseRate * 10) / 10, 45), // Cap at 45%
            year: 2023,
            dataSource: "NYC DOHMH Community Health Survey",
          })
        })
      })
    })
  })

  return mockData
}

function generateMockEnvironmentalData(): EnvironmentalData[] {
  const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  const environmentalData: EnvironmentalData[] = []

  // Generate environmental data points
  boroughs.forEach((borough) => {
    // Air quality monitoring stations
    for (let i = 0; i < 3; i++) {
      environmentalData.push({
        id: `air-${borough}-${i}`,
        type: "airQuality",
        name: `${borough} Air Quality Monitor ${i + 1}`,
        borough,
        coordinates: getBoroughCoordinates(borough, i),
        severity: Math.random() * 100,
        status: "Active",
        lastUpdated: new Date().toISOString(),
      })
    }

    // SNAP access points
    for (let i = 0; i < 5; i++) {
      environmentalData.push({
        id: `snap-${borough}-${i}`,
        type: "snapAccess",
        name: `SNAP Retailer ${i + 1}`,
        borough,
        coordinates: getBoroughCoordinates(borough, i + 3),
        severity: Math.random() * 80 + 20, // Higher access = lower severity
        status: "Active",
        lastUpdated: new Date().toISOString(),
      })
    }

    // Green spaces
    for (let i = 0; i < 2; i++) {
      environmentalData.push({
        id: `green-${borough}-${i}`,
        type: "greenSpace",
        name: `${borough} Park ${i + 1}`,
        borough,
        coordinates: getBoroughCoordinates(borough, i + 8),
        severity: Math.random() * 60, // Lower severity = more green space
        status: "Active",
        lastUpdated: new Date().toISOString(),
      })
    }
  })

  return environmentalData
}

function getBoroughCoordinates(borough: string, offset: number): [number, number] {
  const baseCoordinates: Record<string, [number, number]> = {
    Manhattan: [40.7831, -73.9712],
    Brooklyn: [40.6782, -73.9442],
    Queens: [40.7282, -73.7949],
    Bronx: [40.8448, -73.8648],
    "Staten Island": [40.5795, -74.1502],
  }

  const base = baseCoordinates[borough] || [40.7128, -74.006]
  const offsetLat = (Math.random() - 0.5) * 0.05 + offset * 0.01
  const offsetLng = (Math.random() - 0.5) * 0.05 + offset * 0.01

  return [base[0] + offsetLat, base[1] + offsetLng]
}
