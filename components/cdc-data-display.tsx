"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, RefreshCw, TrendingUp, TrendingDown, Activity } from "lucide-react"
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
  boroughBreakdown: Record<string, { count: number; avgRate: number }>
}

interface CDCDataDisplayProps {
  filters: FilterState
  onDataUpdate?: (data: CDCHealthData[], stats: CDCHealthStats) => void
}

export default function CDCDataDisplay({ filters, onDataUpdate }: CDCDataDisplayProps) {
  const [data, setData] = useState<CDCHealthData[]>([])
  const [stats, setStats] = useState<CDCHealthStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchCDCData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("limit", "1000")
      params.append("state", "New York")

      // Add health condition filter
      if (filters.healthConditions && filters.healthConditions.length > 0) {
        params.append("condition", filters.healthConditions[0])
      }

      // Add borough filter
      if (filters.borough && filters.borough !== "allBoroughs") {
        params.append("borough", filters.borough)
      }

      // Add year filter
      params.append("year", "2023")

      console.log("Fetching CDC data with params:", params.toString())

      const response = await fetch(`/api/cdc-health-data?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      console.log("CDC data response:", {
        success: result.success,
        recordCount: result.data?.length || 0,
        source: result.source,
      })

      const fetchedData = result.data || []
      const fetchedStats = result.stats

      setData(fetchedData)
      setStats(fetchedStats)
      setLastUpdated(new Date().toLocaleString())

      // Notify parent component
      if (onDataUpdate) {
        onDataUpdate(fetchedData, fetchedStats)
      }

      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error("CDC data fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch CDC data")
      setData([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCDCData()
  }, [filters.healthConditions, filters.borough, filters.raceEthnicities, filters.ageGroups])

  const downloadData = () => {
    if (data.length === 0) return

    const csvContent = [
      // CSV headers
      [
        "ID",
        "Condition",
        "Borough",
        "Neighborhood",
        "Rate",
        "Cases",
        "Population",
        "Age Group",
        "Race/Ethnicity",
        "Gender",
        "Year",
        "Data Source",
        "Measure",
        "Unit",
        "Confidence Interval",
      ].join(","),
      // CSV data rows
      ...data.map((item) =>
        [
          item.id,
          `"${item.condition}"`,
          `"${item.borough}"`,
          `"${item.neighborhood}"`,
          item.rate,
          item.cases,
          item.population,
          `"${item.ageGroup}"`,
          `"${item.raceEthnicity}"`,
          `"${item.gender}"`,
          item.year,
          `"${item.dataSource}"`,
          `"${item.measure}"`,
          `"${item.unit}"`,
          `"${item.confidence_interval || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `cdc-health-data-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            CDC Health Data
          </CardTitle>
          <CardDescription>Loading health data from CDC...</CardDescription>
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
            <Activity className="h-5 w-5" />
            CDC Health Data - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}. Using fallback data for demonstration.</AlertDescription>
          </Alert>
          <Button onClick={fetchCDCData} className="mt-4 bg-transparent" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
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
              <Activity className="h-5 w-5" />
              CDC Health Data
            </CardTitle>
            <CardDescription>
              Real-time health data from the Centers for Disease Control and Prevention
              {lastUpdated && ` • Last updated: ${lastUpdated}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchCDCData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={downloadData} variant="outline" size="sm" disabled={data.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalRecords}</div>
              <div className="text-sm text-blue-800">Total Records</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.averageRate.toFixed(1)}%</div>
              <div className="text-sm text-green-800">Average Rate</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.highestRate.toFixed(1)}%</div>
              <div className="text-sm text-red-800">Highest Rate</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.conditionsCount}</div>
              <div className="text-sm text-purple-800">Conditions Tracked</div>
            </div>
          </div>
        )}

        {/* Top Conditions */}
        {stats && stats.topConditions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Health Conditions</h3>
            <div className="space-y-2">
              {stats.topConditions.slice(0, 5).map((condition, index) => (
                <div key={condition.condition} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{condition.condition}</span>
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
        )}

        {/* Borough Breakdown */}
        {stats && Object.keys(stats.boroughBreakdown).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Borough Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.boroughBreakdown).map(([borough, data]) => (
                <div key={borough} className="p-3 border rounded-lg">
                  <div className="font-medium">{borough}</div>
                  <div className="text-sm text-gray-600">{data.count} records</div>
                  <div className="text-lg font-semibold text-blue-600">{data.avgRate.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Table Preview */}
        {data.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Data Preview (First 10 Records)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Condition</th>
                    <th className="border border-gray-300 p-2 text-left">Borough</th>
                    <th className="border border-gray-300 p-2 text-left">Rate (%)</th>
                    <th className="border border-gray-300 p-2 text-left">Cases</th>
                    <th className="border border-gray-300 p-2 text-left">Age Group</th>
                    <th className="border border-gray-300 p-2 text-left">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">{item.condition}</td>
                      <td className="border border-gray-300 p-2">{item.borough}</td>
                      <td className="border border-gray-300 p-2">{item.rate.toFixed(1)}%</td>
                      <td className="border border-gray-300 p-2">{item.cases.toLocaleString()}</td>
                      <td className="border border-gray-300 p-2">{item.ageGroup}</td>
                      <td className="border border-gray-300 p-2">{item.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 10 && (
              <p className="text-sm text-gray-600 mt-2">
                Showing 10 of {data.length} records. Use Export CSV to download all data.
              </p>
            )}
          </div>
        )}

        {data.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available for the selected filters.</p>
            <p className="text-sm">Try adjusting your filter criteria or refresh the data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { CDCDataDisplay }
