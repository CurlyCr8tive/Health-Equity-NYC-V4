"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Leaf, Map } from "lucide-react"
import { FilterPanel } from "@/components/filter-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  TrendingUp,
  Brain,
  Home,
  AlertTriangle,
  Phone,
  Stethoscope,
  Wind,
  TreePine,
  BarChart3,
  BookOpen,
} from "lucide-react"
import type { FilterState, HealthData, BoroughData } from "@/types"
import { useRouter } from "next/navigation"
import DataVisualizations from "@/components/data-visualizations"
import MapDisplay from "@/components/map-display"
import AISummary from "@/components/ai-summary"

// Add this interface near the top of the file
interface EnvironmentalFilters {
  airQuality: boolean
  greenSpace: boolean
  foodAccess: boolean
  transitAccess: boolean
  housingQuality: boolean
}

// Update the EMPTY_FILTERS to match the FilterPanel structure
const EMPTY_FILTERS = {
  healthConditions: [],
  demographics: {
    ageGroups: [],
    ethnicities: [],
    incomeRanges: [],
  },
  environmental: {
    airQuality: false,
    greenSpace: false,
    foodAccess: false,
    transitAccess: false,
    housingQuality: false,
  },
  geographic: {
    boroughs: [],
    neighborhoods: [],
  },
}

const DEFAULT_FILTERS = {
  healthConditions: [],
  demographics: {
    ageGroups: [],
    ethnicities: [],
    incomeRanges: [],
  },
  environmental: {
    airQuality: false,
    greenSpace: false,
    foodAccess: false,
    transitAccess: false,
    housingQuality: false,
  },
  geographic: {
    boroughs: [],
    neighborhoods: [],
  },
}

// Default NYC health and environmental data
const DEFAULT_NYC_DATA = {
  topHealthConditions: [
    {
      condition: "High Blood Pressure (Hypertension)",
      rate: 28.5,
      affectedPeople: "About 2.4 million New Yorkers",
      description: "The most common health condition in NYC, affecting nearly 1 in 3 adults",
      riskLevel: "High",
      whatItMeans: "High blood pressure can lead to heart disease and stroke if not managed properly",
      whatToDo: "Get regular checkups, eat less salt, exercise more, and take medication if prescribed",
      resources: ["Find a community health center", "Free blood pressure screenings", "Heart-healthy cooking classes"],
    },
    {
      condition: "Diabetes",
      rate: 12.8,
      affectedPeople: "About 1.1 million New Yorkers",
      description: "A serious condition where blood sugar levels are too high",
      riskLevel: "High",
      whatItMeans: "Diabetes can cause serious complications if not controlled, including blindness and kidney disease",
      whatToDo: "Monitor blood sugar, eat healthy foods, stay active, and work with your doctor",
      resources: ["Diabetes education programs", "Free glucose testing", "Nutrition counseling"],
    },
  ],
  topEnvironmentalFactors: [
    {
      factor: "Air Quality",
      level: "Moderate Concern",
      affectedAreas: "All 5 boroughs, especially near highways and industrial areas",
      description: "Air pollution from traffic, buildings, and industry affects everyone's breathing",
      riskLevel: "Medium",
      whatItMeans: "Poor air quality can worsen asthma, cause breathing problems, and increase heart disease risk",
      whatToDo: "Check daily air quality reports, limit outdoor exercise on bad air days, support clean air policies",
      resources: ["NYC Air Quality alerts", "Asthma management programs", "Indoor air quality tips"],
    },
    {
      factor: "Limited Access to Healthy Food",
      level: "Significant Problem",
      affectedAreas: "Food deserts in parts of Bronx, Brooklyn, Queens, and Manhattan",
      description: "Many neighborhoods lack affordable grocery stores with fresh, healthy food",
      riskLevel: "High",
      whatItMeans:
        "Without access to healthy food, people are more likely to develop diabetes, heart disease, and obesity",
      whatToDo: "Shop at farmers markets, join community gardens, advocate for more grocery stores in your area",
      resources: ["SNAP benefits assistance", "Community gardens", "Mobile farmers markets"],
    },
  ],
}

// Borough comparison data for the new table
const BOROUGH_COMPARISON_DATA = [
  {
    borough: "Bronx",
    population: "1.4M",
    highBloodPressure: 32.1,
    diabetes: 15.2,
    airQuality: "Poor",
    foodAccess: "Limited",
    overallRisk: "Critical",
  },
  {
    borough: "Brooklyn",
    population: "2.6M",
    highBloodPressure: 28.7,
    diabetes: 13.8,
    airQuality: "Moderate",
    foodAccess: "Fair",
    overallRisk: "High",
  },
  {
    borough: "Queens",
    population: "2.3M",
    highBloodPressure: 25.3,
    diabetes: 11.9,
    airQuality: "Moderate",
    foodAccess: "Good",
    overallRisk: "Moderate",
  },
  {
    borough: "Manhattan",
    population: "1.6M",
    highBloodPressure: 22.8,
    diabetes: 10.4,
    airQuality: "Fair",
    foodAccess: "Good",
    overallRisk: "Moderate",
  },
  {
    borough: "Staten Island",
    population: "0.5M",
    highBloodPressure: 26.4,
    diabetes: 12.1,
    airQuality: "Good",
    foodAccess: "Fair",
    overallRisk: "High",
  },
]

// Health condition rates by condition and borough
const HEALTH_CONDITION_RATES = {
  Diabetes: {
    Manhattan: 10.4,
    Brooklyn: 13.8,
    Queens: 11.9,
    Bronx: 15.2,
    "Staten Island": 12.1,
    allBoroughs: 12.8,
  },
  Hypertension: {
    Manhattan: 22.8,
    Brooklyn: 28.7,
    Queens: 25.3,
    Bronx: 32.1,
    "Staten Island": 26.4,
    allBoroughs: 28.5,
  },
  Asthma: {
    Manhattan: 8.2,
    Brooklyn: 9.8,
    Queens: 8.9,
    Bronx: 12.4,
    "Staten Island": 9.1,
    allBoroughs: 9.7,
  },
  "Heart Disease": {
    Manhattan: 5.1,
    Brooklyn: 6.8,
    Queens: 5.9,
    Bronx: 8.2,
    "Staten Island": 6.3,
    allBoroughs: 6.5,
  },
  "Mental Health": {
    Manhattan: 14.2,
    Brooklyn: 16.8,
    Queens: 13.9,
    Bronx: 18.7,
    "Staten Island": 15.1,
    allBoroughs: 15.7,
  },
  Obesity: {
    Manhattan: 18.3,
    Brooklyn: 24.1,
    Queens: 21.7,
    Bronx: 28.9,
    "Staten Island": 22.4,
    allBoroughs: 23.1,
  },
  Cancer: {
    Manhattan: 4.2,
    Brooklyn: 5.1,
    Queens: 4.7,
    Bronx: 5.8,
    "Staten Island": 4.9,
    allBoroughs: 4.9,
  },
  Stroke: {
    Manhattan: 2.1,
    Brooklyn: 2.8,
    Queens: 2.4,
    Bronx: 3.2,
    "Staten Island": 2.6,
    allBoroughs: 2.6,
  },
  COPD: {
    Manhattan: 3.4,
    Brooklyn: 4.2,
    Queens: 3.8,
    Bronx: 5.1,
    "Staten Island": 4.0,
    allBoroughs: 4.1,
  },
  "Kidney Disease": {
    Manhattan: 2.8,
    Brooklyn: 3.6,
    Queens: 3.1,
    Bronx: 4.3,
    "Staten Island": 3.2,
    allBoroughs: 3.4,
  },
}

export default function HealthEquityDashboard() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [boroughData, setBoroughData] = useState<BoroughData[]>([])
  const [comprehensiveData, setComprehensiveData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const [activeFilters, setActiveFilters] = useState(0)

  // Calculate active filters count
  useEffect(() => {
    const count =
      filters.healthConditions.length +
      filters.demographics.ageGroups.length +
      filters.demographics.ethnicities.length +
      filters.demographics.incomeRanges.length +
      filters.geographic.boroughs.length +
      filters.geographic.neighborhoods.length +
      Object.values(filters.environmental).filter(Boolean).length

    setActiveFilters(count)
  }, [filters])

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const handleExportReport = () => {
    // Export functionality
    console.log("Exporting community report...")
  }

  const handleShareWithNeighbors = () => {
    // Share functionality
    console.log("Sharing with neighbors...")
  }

  // Generate mock health data based on filters
  const generateHealthDataFromFilters = (currentFilters: FilterState): HealthData[] => {
    const generatedData: HealthData[] = []

    // If no health conditions selected, return empty array
    if (!currentFilters.healthConditions || currentFilters.healthConditions.length === 0) {
      return generatedData
    }

    const selectedBorough = currentFilters.borough !== "allBoroughs" ? currentFilters.borough : null
    const boroughsToProcess = selectedBorough
      ? [selectedBorough]
      : ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

    currentFilters.healthConditions.forEach((condition, conditionIndex) => {
      boroughsToProcess.forEach((borough, boroughIndex) => {
        const conditionRates = HEALTH_CONDITION_RATES[condition as keyof typeof HEALTH_CONDITION_RATES]
        if (conditionRates) {
          const rate = conditionRates[borough as keyof typeof conditionRates] || conditionRates.allBoroughs

          // Calculate estimated cases based on borough population
          const boroughPopulations = {
            Manhattan: 1694251,
            Brooklyn: 2736074,
            Queens: 2405464,
            Bronx: 1472654,
            "Staten Island": 495747,
          }

          const population = boroughPopulations[borough as keyof typeof boroughPopulations]
          const cases = Math.round((rate / 100) * population)

          generatedData.push({
            id: `${condition}_${borough}_${conditionIndex}_${boroughIndex}`,
            condition: condition,
            borough: borough,
            neighborhood: borough, // Use borough as neighborhood for now
            rate: rate,
            cases: cases,
            population: population,
            ageGroup: currentFilters.ageGroups?.[0] || "All Ages",
            raceEthnicity: currentFilters.raceEthnicities?.[0] || "All Races",
            year: 2024,
          })
        }
      })
    })

    return generatedData
  }

  // Generate comprehensive data including environmental factors
  const generateComprehensiveDataFromFilters = async (currentFilters: any) => {
    const healthData = generateHealthDataFromFilters(currentFilters)
    const environmentalData = await generateEnvironmentalDataFromFilters(currentFilters)

    return {
      cdcData: healthData.map((item, index) => ({
        id: item.id,
        source: "CDC",
        condition: item.condition,
        borough: item.borough,
        rate: item.rate,
        cases: item.cases,
        population: item.population,
        year: item.year,
        ageGroup: item.ageGroup,
        raceEthnicity: item.raceEthnicity,
      })),
      epiQueryData: environmentalData,
      nycOpenData: [],
      stats: {
        totalRecords: healthData.length + environmentalData.length,
        averageRate:
          healthData.length > 0 ? healthData.reduce((sum, item) => sum + item.rate, 0) / healthData.length : 0,
        highestRate: healthData.length > 0 ? Math.max(...healthData.map((item) => item.rate)) : 0,
        lowestRate: healthData.length > 0 ? Math.min(...healthData.map((item) => item.rate)) : 0,
        conditionsCount: currentFilters.healthConditions?.length || 0,
        environmentalFactorsCount: Object.values(currentFilters.environmental || {}).filter(Boolean).length,
        boroughsCount:
          currentFilters.geographic?.boroughs?.length || (currentFilters.borough !== "allBoroughs" ? 1 : 5),
        topConditions: [],
        sourceBreakdown: {
          cdc: healthData.length,
          epiQuery: environmentalData.length,
          nycOpenData: 0,
        },
      },
    }
  }

  // Add this new function to generate environmental data
  const generateEnvironmentalDataFromFilters = async (currentFilters: any) => {
    const environmentalData: any[] = []

    if (!currentFilters.environmental) return environmentalData

    const selectedBoroughs =
      currentFilters.geographic?.boroughs?.length > 0
        ? currentFilters.geographic.boroughs
        : ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

    // Air Quality Data
    if (currentFilters.environmental.airQuality) {
      const airQualityScores = {
        Manhattan: 65,
        Brooklyn: 58,
        Queens: 62,
        Bronx: 45,
        "Staten Island": 72,
      }
      selectedBoroughs.forEach((borough: string) => {
        environmentalData.push({
          id: `air_quality_${borough}`,
          indicator: "Air Quality Index",
          borough: borough,
          value: airQualityScores[borough as keyof typeof airQualityScores] || 60,
          unit: "AQI Score",
          year: 2024,
          source: "NYC Environmental Data",
          description: "Lower scores indicate poorer air quality",
          healthImpact:
            airQualityScores[borough as keyof typeof airQualityScores] < 50
              ? "High Risk"
              : airQualityScores[borough as keyof typeof airQualityScores] < 65
                ? "Moderate Risk"
                : "Low Risk",
        })
      })
    }

    // Green Space Access
    if (currentFilters.environmental.greenSpace) {
      const greenSpaceAccess = {
        Manhattan: 78,
        Brooklyn: 65,
        Queens: 82,
        Bronx: 55,
        "Staten Island": 88,
      }
      selectedBoroughs.forEach((borough: string) => {
        environmentalData.push({
          id: `green_space_${borough}`,
          indicator: "Green Space Access",
          borough: borough,
          value: greenSpaceAccess[borough as keyof typeof greenSpaceAccess] || 70,
          unit: "% Population within 10min walk",
          year: 2024,
          source: "NYC Parks Department",
          description: "Percentage of residents within 10-minute walk of green space",
          healthImpact:
            greenSpaceAccess[borough as keyof typeof greenSpaceAccess] > 80
              ? "Positive"
              : greenSpaceAccess[borough as keyof typeof greenSpaceAccess] > 65
                ? "Moderate"
                : "Limited Access",
        })
      })
    }

    // Food Access
    if (currentFilters.environmental.foodAccess) {
      const foodAccessScores = {
        Manhattan: 85,
        Brooklyn: 72,
        Queens: 78,
        Bronx: 58,
        "Staten Island": 68,
      }
      selectedBoroughs.forEach((borough: string) => {
        environmentalData.push({
          id: `food_access_${borough}`,
          indicator: "Healthy Food Access",
          borough: borough,
          value: foodAccessScores[borough as keyof typeof foodAccessScores] || 70,
          unit: "Access Score (0-100)",
          year: 2024,
          source: "NYC Food Policy",
          description: "Access to affordable, healthy food options",
          healthImpact:
            foodAccessScores[borough as keyof typeof foodAccessScores] > 80
              ? "Good Access"
              : foodAccessScores[borough as keyof typeof foodAccessScores] > 65
                ? "Moderate Access"
                : "Limited Access",
        })
      })
    }

    // Transit Access
    if (currentFilters.environmental.transitAccess) {
      const transitScores = {
        Manhattan: 95,
        Brooklyn: 82,
        Queens: 75,
        Bronx: 78,
        "Staten Island": 45,
      }
      selectedBoroughs.forEach((borough: string) => {
        environmentalData.push({
          id: `transit_access_${borough}`,
          indicator: "Public Transit Access",
          borough: borough,
          value: transitScores[borough as keyof typeof transitScores] || 70,
          unit: "Transit Score (0-100)",
          year: 2024,
          source: "MTA Data",
          description: "Access to public transportation options",
          healthImpact:
            transitScores[borough as keyof typeof transitScores] > 85
              ? "Excellent"
              : transitScores[borough as keyof typeof transitScores] > 70
                ? "Good"
                : "Limited",
        })
      })
    }

    // Housing Quality
    if (currentFilters.environmental.housingQuality) {
      const housingScores = {
        Manhattan: 72,
        Brooklyn: 68,
        Queens: 75,
        Bronx: 58,
        "Staten Island": 78,
      }
      selectedBoroughs.forEach((borough: string) => {
        environmentalData.push({
          id: `housing_quality_${borough}`,
          indicator: "Housing Quality Index",
          borough: borough,
          value: housingScores[borough as keyof typeof housingScores] || 70,
          unit: "Quality Score (0-100)",
          year: 2024,
          source: "NYC Housing Authority",
          description: "Overall housing conditions and safety",
          healthImpact:
            housingScores[borough as keyof typeof housingScores] > 75
              ? "Good Conditions"
              : housingScores[borough as keyof typeof housingScores] > 65
                ? "Fair Conditions"
                : "Poor Conditions",
        })
      })
    }

    return environmentalData
  }

  // Generate borough data for map based on filters
  const generateBoroughDataFromFilters = (currentFilters: FilterState): BoroughData[] => {
    const boroughCoordinates = {
      Manhattan: [40.7831, -73.9712] as [number, number],
      Brooklyn: [40.6782, -73.9442] as [number, number],
      Queens: [40.7282, -73.7949] as [number, number],
      Bronx: [40.8448, -73.8648] as [number, number],
      "Staten Island": [40.5795, -74.1502] as [number, number],
    }

    const boroughPopulations = {
      Manhattan: 1694251,
      Brooklyn: 2736074,
      Queens: 2405464,
      Bronx: 1472654,
      "Staten Island": 495747,
    }

    return Object.entries(boroughCoordinates).map(([borough, coordinates]) => {
      let averageRate = 0
      let conditionCount = 0

      // Calculate average rate for selected conditions
      if (currentFilters.healthConditions && currentFilters.healthConditions.length > 0) {
        currentFilters.healthConditions.forEach((condition) => {
          const conditionRates = HEALTH_CONDITION_RATES[condition as keyof typeof HEALTH_CONDITION_RATES]
          if (conditionRates) {
            const rate = conditionRates[borough as keyof typeof conditionRates] || conditionRates.allBoroughs
            averageRate += rate
            conditionCount++
          }
        })
        averageRate = conditionCount > 0 ? averageRate / conditionCount : 0
      } else {
        // Use default hypertension rate if no conditions selected
        averageRate = HEALTH_CONDITION_RATES.Hypertension[borough as keyof typeof HEALTH_CONDITION_RATES.Hypertension]
      }

      return {
        name: borough,
        coordinates: coordinates,
        rate: averageRate,
        population: boroughPopulations[borough as keyof typeof boroughPopulations],
      }
    })
  }

  // Update data when filters change
  useEffect(() => {
    const updateData = async () => {
      setLoading(true)

      try {
        const newHealthData = generateHealthDataFromFilters(filters)
        const newBoroughData = generateBoroughDataFromFilters(filters)
        const newComprehensiveData = await generateComprehensiveDataFromFilters(filters)

        setHealthData(newHealthData)
        setBoroughData(newBoroughData)
        setComprehensiveData(newComprehensiveData)

        console.log("Data updated:", {
          healthData: newHealthData.length,
          boroughData: newBoroughData.length,
          comprehensiveData: newComprehensiveData,
        })
      } catch (error) {
        console.error("Error updating data:", error)
      } finally {
        setLoading(false)
      }
    }

    updateData()
  }, [filters])

  const handleComprehensiveDataUpdate = (data: any) => {
    setComprehensiveData(data)
  }

  // Handle filter application
  const handleApplyFilters = () => {
    setLoading(true)

    // Simulate loading time
    setTimeout(() => {
      // Data is already updated via useEffect, just stop loading
      setLoading(false)
    }, 500)
  }

  // Check if any meaningful filters are applied
  const hasActiveFilters = () => {
    return (
      filters.healthConditions?.length > 0 ||
      filters.geographic?.boroughs?.length > 0 ||
      filters.geographic?.neighborhoods?.length > 0 ||
      filters.demographics?.ageGroups?.length > 0 ||
      filters.demographics?.ethnicities?.length > 0 ||
      filters.demographics?.incomeRanges?.length > 0 ||
      (filters.environmental && Object.values(filters.environmental).some(Boolean))
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.healthConditions?.length > 0) count += filters.healthConditions.length
    if (filters.borough && filters.borough !== "allBoroughs") count += 1
    if (filters.ageGroups?.length > 0) count += filters.ageGroups.length
    if (filters.raceEthnicities?.length > 0) count += filters.raceEthnicities.length
    if (Array.isArray(filters.environmentalFactors)) {
      count += filters.environmentalFactors.length
    }
    // Count environmental overlays
    if (filters.overlays) {
      count += Object.values(filters.overlays).filter(Boolean).length
    }
    return count
  }

  // Calculate community-focused metrics in plain language - FIXED TO RESPOND TO FILTERS
  const getCommunityInsights = () => {
    // If no filters applied, use default NYC data
    if (!hasActiveFilters()) {
      return {
        healthStatus: "NYC Overview",
        statusColor: "text-blue-600",
        statusBg: "bg-blue-50",
        actionNeeded: "Explore your specific neighborhood for personalized insights",
        urgency: "Info",
        peopleAffectedPer100: 29, // Based on hypertension rate
        peopleAffectedPer1000: 290,
        envRiskFactors: 2,
        totalRecords: 0,
        averageRate: "28.5",
        isDefault: true,
      }
    }

    // Calculate actual rates based on selected filters
    let calculatedRate = 0
    let conditionCount = 0

    // Calculate health condition rates
    if (filters.healthConditions && filters.healthConditions.length > 0) {
      const selectedBorough = filters.borough !== "allBoroughs" ? filters.borough : "allBoroughs"

      filters.healthConditions.forEach((condition) => {
        const conditionRates = HEALTH_CONDITION_RATES[condition as keyof typeof HEALTH_CONDITION_RATES]
        if (conditionRates) {
          const rate = conditionRates[selectedBorough as keyof typeof conditionRates] || conditionRates.allBoroughs
          calculatedRate += rate
          conditionCount++
        }
      })
    }

    // Add environmental factor impact
    let envImpact = 0
    const envFactorCount = filters.environmental ? Object.values(filters.environmental).filter(Boolean).length : 0

    if (envFactorCount > 0) {
      // Environmental factors add 2-5% to health risk depending on borough
      const selectedBorough = filters.geographic?.boroughs?.[0] || "allBoroughs"
      const boroughMultiplier =
        selectedBorough === "Bronx"
          ? 1.5
          : selectedBorough === "Brooklyn"
            ? 1.3
            : selectedBorough === "Queens"
              ? 1.1
              : selectedBorough === "Staten Island"
                ? 1.2
                : 1.0
      envImpact = envFactorCount * 2.5 * boroughMultiplier
    }

    // If only environmental factors selected, use base health rate
    if (conditionCount === 0 && envFactorCount > 0) {
      const selectedBorough = filters.borough !== "allBoroughs" ? filters.borough : "allBoroughs"
      const baseRate =
        selectedBorough === "Bronx"
          ? 32.1
          : selectedBorough === "Brooklyn"
            ? 28.7
            : selectedBorough === "Queens"
              ? 25.3
              : selectedBorough === "Manhattan"
                ? 22.8
                : selectedBorough === "Staten Island"
                  ? 26.4
                  : 28.5
      calculatedRate = baseRate * 0.3 // Use 30% of base rate for environmental-only
    }

    const finalRate = calculatedRate + envImpact
    const peopleAffectedPer100 = Math.round(finalRate)
    const peopleAffectedPer1000 = Math.round(finalRate * 10)

    // Determine what this means in simple terms
    let healthStatus = "Good"
    let statusColor = "text-green-600"
    let statusBg = "bg-green-50"
    let actionNeeded = "Keep up the good work"
    let urgency = "Low"

    if (finalRate > 25) {
      healthStatus = "Needs Immediate Attention"
      statusColor = "text-red-600"
      statusBg = "bg-red-50"
      actionNeeded = "Community action needed now"
      urgency = "High"
    } else if (finalRate > 15) {
      healthStatus = "Concerning"
      statusColor = "text-orange-600"
      statusBg = "bg-orange-50"
      actionNeeded = "More health resources needed"
      urgency = "Medium"
    } else if (finalRate > 8) {
      healthStatus = "Typical for NYC"
      statusColor = "text-yellow-600"
      statusBg = "bg-yellow-50"
      actionNeeded = "Prevention programs helpful"
      urgency = "Low-Medium"
    }

    return {
      healthStatus,
      statusColor,
      statusBg,
      actionNeeded,
      urgency,
      peopleAffectedPer100,
      peopleAffectedPer1000,
      envRiskFactors: envFactorCount,
      totalRecords: conditionCount + envFactorCount,
      averageRate: finalRate.toFixed(1),
      isDefault: false,
    }
  }

  const insights = getCommunityInsights()

  const getSelectedArea = () => {
    if (filters.neighborhood) return filters.neighborhood
    if (filters.borough && filters.borough !== "allBoroughs") return filters.borough
    if (filters.zipCode) return `ZIP ${filters.zipCode}`
    return "New York City"
  }

  const exportData = () => {
    if (!comprehensiveData) return

    const selectedArea = getSelectedArea()
    const csvContent = [
      [
        "Area",
        "Source",
        "Health_Condition_Environmental_Factor",
        "Rate_or_Level",
        "Affected_Population",
        "Risk_Level",
        "What_This_Means_For_Your_Community",
        "Recommended_Actions",
      ].join(","),
      // CDC Data
      ...(comprehensiveData.cdcData || []).map((item: any) => {
        const riskLevel = item.rate > 20 ? "HIGH CONCERN" : item.rate > 10 ? "MODERATE CONCERN" : "LOW CONCERN"
        const meaning =
          item.rate > 15
            ? "This condition affects many people in your area"
            : "This condition is present but manageable"
        const action =
          item.rate > 15
            ? "Seek community health resources and advocate for better services"
            : "Stay informed and practice prevention"

        return [
          selectedArea,
          "CDC Health Data",
          `"${item.condition}"`,
          `${item.rate}%`,
          item.cases?.toLocaleString() || "Unknown",
          riskLevel,
          `"${meaning}"`,
          `"${action}"`,
        ].join(",")
      }),
      // Environmental Data
      ...(comprehensiveData.epiQueryData || []).map((item: any) => {
        const envLevel = item.value > 75 ? "POOR" : item.value > 50 ? "FAIR" : "GOOD"
        const meaning =
          item.value > 75 ? "Environmental conditions may impact health" : "Environmental conditions are acceptable"
        const action =
          item.value > 75
            ? "Advocate for environmental improvements and protect yourself"
            : "Continue monitoring environmental conditions"

        return [
          selectedArea,
          "Environmental Data",
          `"${item.indicator}"`,
          item.value,
          "Community-wide",
          envLevel,
          `"${meaning}"`,
          `"${action}"`,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${selectedArea.replace(/\s+/g, "_")}-community-health-report-${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleHealthResourcesClick = () => {
    router.push("/health-education")
  }

  const handleEnvironmentalEducationClick = () => {
    router.push("/environmental-education")
  }

  // Filter the borough comparison data based on selected borough
  const getFilteredBoroughData = () => {
    if (filters.borough && filters.borough !== "allBoroughs") {
      return BOROUGH_COMPARISON_DATA.filter((borough) => borough.borough === filters.borough)
    }
    return BOROUGH_COMPARISON_DATA
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-600">
      {/* Hero Section - Community Focused */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <video className="absolute inset-0 w-full h-full object-cover opacity-30" autoPlay loop muted playsInline>
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hero_image_of_202507142204_xfk8l-6xKbcxs7pDFb1YSmlBeLixV4G3cqOv.mp4" type="video/mp4" />
        </video>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-12 w-12" />
              <div>
                <h1 className="text-4xl md:text-6xl font-bold">Health Equity NYC</h1>
                <p className="text-xl md:text-2xl text-blue-100">Know Your Neighborhood's Health</p>
              </div>
            </div>
            <p className="text-lg md:text-xl mb-8 text-blue-50 max-w-3xl">
              Discover what health conditions and environmental factors affect your community. Get the information you
              need to advocate for better health resources and make informed decisions about your family's wellbeing.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => setActiveTab("map")}>
                <Map className="h-5 w-5 mr-2" />
                Interactive Map
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
                onClick={handleHealthResourcesClick}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Health Resources & Services
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
                onClick={handleEnvironmentalEducationClick}
              >
                <Leaf className="h-5 w-5 mr-2" />
                Environmental Health Education
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 min-h-[900px]">
          {/* Community Health Alert */}
          {insights.healthStatus === "Needs Immediate Attention" && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold">Community Health Alert</h3>
              </div>
              <p className="text-red-700 mt-2">
                Your area shows elevated health risks. Consider connecting with local health resources and community
                advocates for support and information.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Phone className="h-4 w-4 mr-2" />
                  Find Help Now
                </Button>
                <Button size="sm" variant="outline" className="border-red-600 text-red-600 bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Connect with Advocates
                </Button>
              </div>
            </div>
          )}

          {/* Updated grid layout: wider filter panel, narrower main content */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[800px]">
            {/* Filter Panel - Now takes 2 columns for better readability */}
            <div className="lg:col-span-2 h-full">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onApplyFilters={handleApplyFilters}
                isLoading={loading}
              />
            </div>

            {/* Main Content - Now takes 5 columns */}
            <div className="lg:col-span-5 space-y-6 h-full flex flex-col">
              {/* NYC Health Overview Section - Moved from hero */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {insights.isDefault ? "NYC Health Overview" : `Your Community Health Status: ${getSelectedArea()}`}
                </h3>

                <div className={`${insights.statusBg} border-2 border-white/30 rounded-lg p-6 mb-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`text-2xl font-bold ${insights.statusColor}`}>{insights.healthStatus}</h4>
                      <p className="text-gray-800">
                        {insights.isDefault
                          ? "Top health challenges affecting all New Yorkers"
                          : "Overall health situation in your area"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{insights.peopleAffectedPer100}</div>
                      <div className="text-sm text-blue-100">out of 100 New Yorkers</div>
                      <div className="text-xs text-blue-200">
                        {insights.isDefault ? "have high blood pressure" : "are affected"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">What This Means</div>
                      <p className="text-sm text-gray-800">
                        High blood pressure and diabetes are NYC's biggest health challenges. Nearly 1 in 3 adults has
                        high blood pressure, and 1 in 8 has diabetes. Use the filters on the left to see what's
                        happening in your specific neighborhood.
                      </p>
                    </div>

                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">Action Needed</div>
                      <p className="text-sm text-gray-800">
                        Learn about your neighborhood's health risks and find local resources to stay healthy.
                      </p>
                      <div
                        className={`text-xs mt-1 ${
                          insights.urgency === "High"
                            ? "text-red-200"
                            : insights.urgency === "Medium"
                              ? "text-orange-200"
                              : insights.urgency === "Info"
                                ? "text-blue-200"
                                : "text-green-200"
                        }`}
                      >
                        Priority: {insights.urgency}
                      </div>
                    </div>

                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white">Environmental Risks</div>
                      <div className="text-2xl font-bold text-orange-100">{insights.envRiskFactors}</div>
                      <p className="text-xs text-gray-800">
                        Air quality and access to healthy food are the top environmental concerns affecting health
                        across all NYC neighborhoods.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Tabs - REDESIGNED FOR REGULAR PEOPLE */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Health Spotlight
                  </TabsTrigger>
                  <TabsTrigger value="data" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Data Visualizations
                  </TabsTrigger>
                  <TabsTrigger value="map" className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Interactive Map
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Compare Areas
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Report
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 space-y-6">
                  {/* Show default NYC insights when no filters applied */}
                  {!hasActiveFilters() ? (
                    <div className="space-y-6">
                      {/* NYC Overview Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Top Health Challenges in New York City
                          </CardTitle>
                          <CardDescription>
                            The biggest health issues affecting New Yorkers across all five boroughs. Use the filters on
                            the left to see what's happening in your specific neighborhood.
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      {/* Top Health Conditions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {DEFAULT_NYC_DATA.topHealthConditions.map((condition, index) => (
                          <Card key={index} className="border-l-4 border-l-red-500">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-red-600">
                                <Heart className="h-5 w-5" />#{index + 1}: {condition.condition}
                              </CardTitle>
                              <CardDescription>{condition.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-red-800">Impact on NYC</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      condition.riskLevel === "High"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {condition.riskLevel} Risk
                                  </span>
                                </div>
                                <div className="text-2xl font-bold text-red-600 mb-1">{condition.rate}%</div>
                                <div className="text-sm text-red-700">{condition.affectedPeople}</div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">What This Means</h4>
                                  <p className="text-sm text-gray-600">{condition.whatItMeans}</p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">What You Can Do</h4>
                                  <p className="text-sm text-gray-600">{condition.whatToDo}</p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Resources Available</h4>
                                  <div className="space-y-1">
                                    {condition.resources.map((resource, idx) => (
                                      <div
                                        key={idx}
                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                      >
                                        • {resource}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Top Environmental Factors */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Wind className="h-5 w-5 text-green-600" />
                            Top Environmental Challenges in New York City
                          </CardTitle>
                          <CardDescription>
                            Environmental factors that affect health across all NYC neighborhoods
                          </CardDescription>
                        </CardHeader>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {DEFAULT_NYC_DATA.topEnvironmentalFactors.map((factor, index) => (
                          <Card key={index} className="border-l-4 border-l-green-500">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-green-600">
                                {index === 0 ? <Wind className="h-5 w-5" /> : <TreePine className="h-5 w-5" />}#
                                {index + 1}: {factor.factor}
                              </CardTitle>
                              <CardDescription>{factor.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-green-800">Status Citywide</span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      factor.riskLevel === "High"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {factor.riskLevel} Risk
                                  </span>
                                </div>
                                <div className="text-lg font-bold text-green-600 mb-1">{factor.level}</div>
                                <div className="text-sm text-green-700">{factor.affectedAreas}</div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">What This Means</h4>
                                  <p className="text-sm text-gray-600">{factor.whatItMeans}</p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-1">What You Can Do</h4>
                                  <p className="text-sm text-gray-600">{factor.whatToDo}</p>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-2">Resources Available</h4>
                                  <div className="space-y-1">
                                    {factor.resources.map((resource, idx) => (
                                      <div
                                        key={idx}
                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                      >
                                        • {resource}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Call to Action */}
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h3 className="text-xl font-semibold text-blue-800 mb-2">
                              Want to See What's Happening in Your Neighborhood?
                            </h3>
                            <p className="text-blue-700 mb-4">
                              Use the filters on the left to explore health conditions and environmental factors
                              specific to your area.
                            </p>
                            <div className="flex justify-center gap-3">
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <MapPin className="h-4 w-4 mr-2" />
                                Select My Borough
                              </Button>
                              <Button variant="outline" className="border-blue-600 text-blue-600 bg-transparent">
                                <Stethoscope className="h-4 w-4 mr-2" />
                                Choose Health Conditions
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    /* Community-Friendly Overview for filtered data - NOW PROPERLY RESPONSIVE TO FILTERS */
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Home className="h-5 w-5" />
                          Your Community Health Picture
                        </CardTitle>
                        <CardDescription>
                          Understanding what's happening with health in {getSelectedArea()} - in plain English
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Health Status Summary - NOW SHOWS REAL DATA */}
                        <div className={`${insights.statusBg} border rounded-lg p-6`}>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className={`text-xl font-bold ${insights.statusColor}`}>
                                Health Status: {insights.healthStatus}
                              </h3>
                              <p className="text-gray-700 mt-1">
                                Out of every 100 people in your area, about {insights.peopleAffectedPer100} people have
                                health conditions that need attention.
                              </p>
                            </div>
                            <div className="text-center">
                              <div className={`text-4xl font-bold ${insights.statusColor}`}>
                                {insights.peopleAffectedPer100}
                              </div>
                              <div className="text-sm text-gray-600">per 100 neighbors</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">What This Means for You</h4>
                              <p className="text-sm text-gray-700">
                                {insights.healthStatus === "Needs Immediate Attention"
                                  ? "Many people in your neighborhood are dealing with serious health issues. This suggests your community needs more health resources and support."
                                  : insights.healthStatus === "Concerning"
                                    ? "Your area has more health challenges than ideal. There's room for improvement through better access to care and prevention programs."
                                    : insights.healthStatus === "Typical for NYC"
                                      ? "Your area faces the usual health challenges of urban living. Prevention and early care can help keep things from getting worse."
                                      : "Your area is doing well health-wise compared to other NYC neighborhoods. Keep up whatever is working!"}
                              </p>
                            </div>

                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">What You Can Do</h4>
                              <p className="text-sm text-gray-700">{insights.actionNeeded}</p>
                              <div className="mt-2 flex gap-2">
                                {insights.urgency === "High" && (
                                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                                    <Phone className="h-4 w-4 mr-1" />
                                    Get Help
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  <Users className="h-4 w-4 mr-1" />
                                  Find Resources
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Environmental Factors - NOW SHOWS ACTUAL SELECTED FACTORS */}
                        {insights.envRiskFactors > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h3 className="font-semibold text-orange-800 mb-2">
                              Environmental Factors Affecting Your Health
                            </h3>
                            <p className="text-sm text-orange-700 mb-3">
                              You're monitoring {insights.envRiskFactors} environmental factor
                              {insights.envRiskFactors > 1 ? "s" : ""} that could impact your community's health.
                            </p>

                            {/* Show selected environmental factors */}
                            <div className="space-y-2">
                              {Array.isArray(filters.environmentalFactors) &&
                                filters.environmentalFactors.map((factor, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="font-medium">{factor}</span>
                                  </div>
                                ))}
                              {filters.overlays &&
                                Object.entries(filters.overlays)
                                  .filter(([_, value]) => value)
                                  .map(([key, _], index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span className="font-medium">
                                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                      </span>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        )}

                        {/* Show selected health conditions */}
                        {filters.healthConditions && filters.healthConditions.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-semibold text-red-800 mb-2">Health Conditions Being Monitored</h3>
                            <p className="text-sm text-red-700 mb-3">
                              You're tracking {filters.healthConditions.length} health condition
                              {filters.healthConditions.length > 1 ? "s" : ""} in your area.
                            </p>

                            <div className="space-y-2">
                              {filters.healthConditions.map((condition, index) => {
                                const selectedBorough =
                                  filters.borough !== "allBoroughs" ? filters.borough : "allBoroughs"
                                const conditionRates =
                                  HEALTH_CONDITION_RATES[condition as keyof typeof HEALTH_CONDITION_RATES]
                                const rate = conditionRates
                                  ? conditionRates[selectedBorough as keyof typeof conditionRates] ||
                                    conditionRates.allBoroughs
                                  : 0

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-white/50 rounded p-2"
                                  >
                                    <span className="font-medium">{condition}</span>
                                    <span className="text-sm text-red-600 font-semibold">{rate.toFixed(1)}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action Items */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-800 mb-3">Next Steps for Your Community</h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div>
                                <span className="font-medium">Learn More:</span>
                                <span className="text-sm text-blue-700 ml-1">
                                  Use the other tabs to see detailed data, maps, and comparisons
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div>
                                <span className="font-medium">Take Action:</span>
                                <span className="text-sm text-blue-700 ml-1">
                                  Connect with local health centers and community organizations
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div>
                                <span className="font-medium">Share:</span>
                                <span className="text-sm text-blue-700 ml-1">
                                  Help neighbors understand what's happening in your area
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="data" className="flex-1">
                  <DataVisualizations filters={filters} data={comprehensiveData} />
                </TabsContent>

                <TabsContent value="map" className="flex-1">
                  <MapDisplay
                    healthData={healthData}
                    boroughData={boroughData}
                    filters={filters}
                    onFiltersChange={setFilters}
                  />
                </TabsContent>

                <TabsContent value="charts" className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Borough Comparison
                      </CardTitle>
                      <CardDescription>
                        Compare health conditions and environmental factors across NYC boroughs
                        {hasActiveFilters() &&
                          ` - Filtered by: ${filters.healthConditions?.join(", ") || "environmental factors"}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="ml-2">Loading comparison data...</span>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 p-2 text-left">Borough</th>
                                <th className="border border-gray-300 p-2 text-left">Population</th>
                                <th className="border border-gray-300 p-2 text-left">High Blood Pressure (%)</th>
                                <th className="border border-gray-300 p-2 text-left">Diabetes (%)</th>
                                <th className="border border-gray-300 p-2 text-left">Air Quality</th>
                                <th className="border border-gray-300 p-2 text-left">Food Access</th>
                                <th className="border border-gray-300 p-2 text-left">Overall Risk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getFilteredBoroughData().map((borough, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                                  <td className="border border-gray-300 p-2">{borough.borough}</td>
                                  <td className="border border-gray-300 p-2">{borough.population}</td>
                                  <td className="border border-gray-300 p-2">{borough.highBloodPressure}</td>
                                  <td className="border border-gray-300 p-2">{borough.diabetes}</td>
                                  <td className="border border-gray-300 p-2">{borough.airQuality}</td>
                                  <td className="border border-gray-300 p-2">{borough.foodAccess}</td>
                                  <td className="border border-gray-300 p-2">{borough.overallRisk}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai" className="flex-1">
                  <AISummary
                    data={healthData}
                    filters={filters}
                    environmentalData={comprehensiveData?.epiQueryData || []}
                    comprehensiveData={comprehensiveData}
                    onAnalysisComplete={handleComprehensiveDataUpdate}
                    onExportData={exportData}
                    onShareDialog={() => setShowShareDialog(true)}
                  />
                </TabsContent>
              </Tabs>

              {/* Export Data Button */}
              <div className="mt-6">
                <Button onClick={exportData} className="bg-green-600 hover:bg-green-700 text-white">
                  Export Community Health Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
