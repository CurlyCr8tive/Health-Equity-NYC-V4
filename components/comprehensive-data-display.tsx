"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Database,
  Building2,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import type { FilterState } from "@/types"

interface ComprehensiveDataDisplayProps {
  filters: FilterState
  onDataUpdate?: (data: any) => void
}

interface DataSourceStatus {
  cdc: boolean
  epiQuery: boolean
  nycOpenData: boolean
}

interface ComprehensiveData {
  cdcData: any[]
  epiQueryData: any[]
  nycOpenData: any[]
  stats: {
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
      source: string
    }>
    sourceBreakdown: {
      cdc: number
      epiQuery: number
      nycOpenData: number
    }
  }
}

export default function ComprehensiveDataDisplay({ filters, onDataUpdate }: ComprehensiveDataDisplayProps) {
  const [data, setData] = useState<ComprehensiveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus>({
    cdc: false,
    epiQuery: false,
    nycOpenData: false,
  })

  const fetchComprehensiveData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔄 Fetching comprehensive data from all sources...")

      // Fetch from all three sources in parallel
      const [cdcResult, epiQueryResult, nycResult] = await Promise.allSettled([
        fetchCDCData(filters),
        fetchEpiQueryData(filters),
        fetchNYCOpenData(filters),
      ])

      const cdcData = cdcResult.status === "fulfilled" ? cdcResult.value : []
      const epiQueryData = epiQueryResult.status === "fulfilled" ? epiQueryResult.value : []
      const nycOpenData = nycResult.status === "fulfilled" ? nycResult.value : []

      // Update data source status
      setDataSourceStatus({
        cdc: cdcResult.status === "fulfilled" && cdcData.length > 0,
        epiQuery: epiQueryResult.status === "fulfilled" && epiQueryData.length > 0,
        nycOpenData: nycResult.status === "fulfilled" && nycOpenData.length > 0,
      })

      // Generate comprehensive statistics
      const stats = generateComprehensiveStats(cdcData, epiQueryData, nycOpenData)

      const comprehensiveData: ComprehensiveData = {
        cdcData,
        epiQueryData,
        nycOpenData,
        stats,
      }

      setData(comprehensiveData)
      setLastUpdated(new Date().toLocaleString())

      if (onDataUpdate) {
        onDataUpdate(comprehensiveData)
      }

      console.log("✅ Comprehensive data fetch completed:", {
        cdcRecords: cdcData.length,
        epiQueryRecords: epiQueryData.length,
        nycRecords: nycOpenData.length,
        totalRecords: stats.totalRecords,
      })
    } catch (err) {
      console.error("❌ Comprehensive data fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch comprehensive data")
    } finally {
      setLoading(false)
    }
  }

  const fetchCDCData = async (filters: FilterState) => {
    // Mock CDC data - replace with actual API call
    return [
      {
        id: "cdc_1",
        source: "CDC",
        condition: "Diabetes",
        borough: "Manhattan",
        rate: 12.5,
        cases: 15000,
        population: 120000,
        year: 2024,
        ageGroup: "Adults 18+",
        raceEthnicity: "All Races",
      },
      {
        id: "cdc_2",
        source: "CDC",
        condition: "Hypertension",
        borough: "Brooklyn",
        rate: 28.3,
        cases: 45000,
        population: 159000,
        year: 2024,
        ageGroup: "Adults 18+",
        raceEthnicity: "All Races",
      },
      {
        id: "cdc_3",
        source: "CDC",
        condition: "Asthma",
        borough: "Bronx",
        rate: 18.7,
        cases: 22000,
        population: 118000,
        year: 2024,
        ageGroup: "All Ages",
        raceEthnicity: "All Races",
      },
    ]
  }

  const fetchEpiQueryData = async (filters: FilterState) => {
    // Mock EpiQuery data - replace with actual API call
    return [
      {
        id: "epi_1",
        source: "EpiQuery",
        indicator: "Air Quality Index",
        value: 85,
        borough: "Manhattan",
        neighborhood: "Midtown",
        category: "Environmental Health",
        year: 2024,
      },
      {
        id: "epi_2",
        source: "EpiQuery",
        indicator: "Food Access Score",
        value: 72,
        borough: "Brooklyn",
        neighborhood: "Bedford-Stuyvesant",
        category: "Social Determinants",
        year: 2024,
      },
      {
        id: "epi_3",
        source: "EpiQuery",
        indicator: "Green Space Access",
        value: 65,
        borough: "Queens",
        neighborhood: "Astoria",
        category: "Environmental Health",
        year: 2024,
      },
    ]
  }

  const fetchNYCOpenData = async (filters: FilterState) => {
    // Mock NYC Open Data - replace with actual API call
    return [
      {
        id: "nyc_1",
        source: "NYC Open Data",
        facility_type: "Hospital",
        name: "NYC Health + Hospitals/Bellevue",
        borough: "Manhattan",
        count: 1,
        category: "Healthcare Access",
        services: ["Emergency", "Primary Care", "Specialty Care"],
      },
      {
        id: "nyc_2",
        source: "NYC Open Data",
        facility_type: "Community Health Center",
        name: "Brooklyn Plaza Medical Center",
        borough: "Brooklyn",
        count: 1,
        category: "Healthcare Access",
        services: ["Primary Care", "Dental", "Mental Health"],
      },
      {
        id: "nyc_3",
        source: "NYC Open Data",
        facility_type: "Food Assistance Site",
        name: "Queens Food Pantry Network",
        borough: "Queens",
        count: 12,
        category: "Food Security",
        services: ["Food Pantry", "SNAP Enrollment", "Nutrition Education"],
      },
    ]
  }

  const generateComprehensiveStats = (cdcData: any[], epiQueryData: any[], nycOpenData: any[]) => {
    const allHealthData = cdcData.filter((item) => item.rate !== undefined)
    const totalRecords = cdcData.length + epiQueryData.length + nycOpenData.length

    const rates = allHealthData.map((item) => item.rate)
    const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0
    const highestRate = rates.length > 0 ? Math.max(...rates) : 0
    const lowestRate = rates.length > 0 ? Math.min(...rates) : 0

    const conditions = new Set(allHealthData.map((item) => item.condition))
    const boroughs = new Set(
      [
        ...cdcData.map((item) => item.borough),
        ...epiQueryData.map((item) => item.borough),
        ...nycOpenData.map((item) => item.borough),
      ].filter(Boolean),
    )

    // Generate top conditions from all sources
    const conditionMap = new Map()
    allHealthData.forEach((item) => {
      if (conditionMap.has(item.condition)) {
        const existing = conditionMap.get(item.condition)
        existing.count += 1
        existing.totalRate += item.rate
      } else {
        conditionMap.set(item.condition, {
          condition: item.condition,
          count: 1,
          totalRate: item.rate,
          source: item.source,
        })
      }
    })

    const topConditions = Array.from(conditionMap.values())
      .map((item) => ({
        ...item,
        avgRate: item.totalRate / item.count,
      }))
      .sort((a, b) => b.avgRate - a.avgRate)
      .slice(0, 5)

    return {
      totalRecords,
      averageRate,
      highestRate,
      lowestRate,
      conditionsCount: conditions.size,
      boroughsCount: boroughs.size,
      topConditions,
      sourceBreakdown: {
        cdc: cdcData.length,
        epiQuery: epiQueryData.length,
        nycOpenData: nycOpenData.length,
      },
    }
  }

  const downloadData = () => {
    if (!data) return

    const csvContent = [
      // Headers
      ["Source", "Type", "Indicator/Condition", "Borough", "Value/Rate", "Category", "Year"].join(","),
      // CDC Data
      ...data.cdcData.map((item) =>
        [item.source, "Health Condition", item.condition, item.borough, item.rate, "Health Outcome", item.year].join(
          ",",
        ),
      ),
      // EpiQuery Data
      ...data.epiQueryData.map((item) =>
        [
          item.source,
          "Environmental Indicator",
          item.indicator,
          item.borough,
          item.value,
          item.category,
          item.year,
        ].join(","),
      ),
      // NYC Open Data
      ...data.nycOpenData.map((item) =>
        [item.source, "Infrastructure", item.facility_type, item.borough, item.count, item.category, "2024"].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `comprehensive-health-data-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchComprehensiveData()
  }, [filters.healthConditions, filters.borough, filters.environmentalFactors])

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Comprehensive Health Data Integration
          </CardTitle>
          <CardDescription>Loading data from CDC, EpiQuery, and NYC Open Data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Data Integration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchComprehensiveData} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Comprehensive Health Data Integration
          </CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchComprehensiveData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Data
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Comprehensive Health Data Integration
            </CardTitle>
            <CardDescription>
              Multi-source analysis from CDC, EpiQuery, and NYC Open Data
              {lastUpdated && ` • Last updated: ${lastUpdated}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchComprehensiveData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={downloadData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Data Source Status */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant={dataSourceStatus.cdc ? "default" : "secondary"} className="flex items-center gap-1">
            {dataSourceStatus.cdc ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            CDC ({data.stats.sourceBreakdown.cdc})
          </Badge>
          <Badge variant={dataSourceStatus.epiQuery ? "default" : "secondary"} className="flex items-center gap-1">
            {dataSourceStatus.epiQuery ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            EpiQuery ({data.stats.sourceBreakdown.epiQuery})
          </Badge>
          <Badge variant={dataSourceStatus.nycOpenData ? "default" : "secondary"} className="flex items-center gap-1">
            {dataSourceStatus.nycOpenData ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            NYC Open Data ({data.stats.sourceBreakdown.nycOpenData})
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comprehensive Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.stats.totalRecords}</div>
            <div className="text-sm text-blue-800">Total Records</div>
            <div className="text-xs text-blue-600">All Sources</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.stats.averageRate.toFixed(1)}%</div>
            <div className="text-sm text-green-800">Average Rate</div>
            <div className="text-xs text-green-600">Health Conditions</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{data.stats.conditionsCount}</div>
            <div className="text-sm text-purple-800">Conditions Tracked</div>
            <div className="text-xs text-purple-600">CDC Data</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{data.stats.boroughsCount}</div>
            <div className="text-sm text-orange-800">Boroughs Covered</div>
            <div className="text-xs text-orange-600">All Sources</div>
          </div>
        </div>

        {/* Multi-Source Data Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cdc" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              CDC Data
            </TabsTrigger>
            <TabsTrigger value="epiquery" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              EpiQuery
            </TabsTrigger>
            <TabsTrigger value="nycdata" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              NYC Open Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Top Health Priorities (Multi-Source)</h3>
              <div className="space-y-2">
                {data.stats.topConditions.map((condition, index) => (
                  <div
                    key={condition.condition}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{condition.condition}</span>
                      <Badge variant="outline" className="text-xs">
                        {condition.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{condition.count} records</span>
                      <div className="flex items-center gap-1">
                        {condition.avgRate > 15 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-semibold">{condition.avgRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cdc" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">CDC Health Surveillance Data</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Condition</th>
                      <th className="border border-gray-300 p-2 text-left">Borough</th>
                      <th className="border border-gray-300 p-2 text-left">Rate (%)</th>
                      <th className="border border-gray-300 p-2 text-left">Cases</th>
                      <th className="border border-gray-300 p-2 text-left">Population</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cdcData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{item.condition}</td>
                        <td className="border border-gray-300 p-2">{item.borough}</td>
                        <td className="border border-gray-300 p-2">{item.rate.toFixed(1)}%</td>
                        <td className="border border-gray-300 p-2">{item.cases.toLocaleString()}</td>
                        <td className="border border-gray-300 p-2">{item.population.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="epiquery" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">EpiQuery Community Health Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.epiQueryData.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.indicator}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{item.value}</div>
                    <div className="text-sm text-gray-600">
                      {item.borough} • {item.neighborhood}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nycdata" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">NYC Open Data Infrastructure</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.nycOpenData.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.facility_type}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="text-lg font-semibold mb-1">{item.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {item.borough} • {item.count} {item.count === 1 ? "facility" : "facilities"}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.services?.map((service: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
