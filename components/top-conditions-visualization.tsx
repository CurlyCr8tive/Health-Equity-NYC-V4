"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, AlertTriangle, Heart, Share2, Download } from "lucide-react"
import type { HealthData, FilterState } from "@/types"
import { formatPercentage } from "@/lib/utils"

interface TopConditionsVisualizationProps {
  data?: HealthData[]
  filters: FilterState
  onShare?: (content: any) => void
  onDownload?: () => void
}

const SEVERITY_COLORS = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
}

const CHART_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"]

export default function TopConditionsVisualization({
  data = [],
  filters,
  onShare,
  onDownload,
}: TopConditionsVisualizationProps) {
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview")

  // Process data to get top conditions
  const topConditions = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by condition and calculate statistics
    const conditionStats = data.reduce(
      (acc, item) => {
        const condition = item.condition || "Unknown"
        if (!acc[condition]) {
          acc[condition] = {
            condition,
            totalCases: 0,
            totalRate: 0,
            boroughs: new Set<string>(),
            demographics: new Set<string>(),
            records: [],
          }
        }

        acc[condition].totalCases += 1
        acc[condition].totalRate += item.rate || 0
        acc[condition].boroughs.add(item.borough || "Unknown")
        acc[condition].demographics.add(item.demographic || "Unknown")
        acc[condition].records.push(item)

        return acc
      },
      {} as Record<string, any>,
    )

    // Convert to array and calculate averages
    const conditions = Object.values(conditionStats).map((stat: any) => ({
      condition: stat.condition,
      averageRate: stat.totalCases > 0 ? stat.totalRate / stat.totalCases : 0,
      totalCases: stat.totalCases,
      boroughCount: stat.boroughs.size,
      demographicCount: stat.demographics.size,
      severity:
        stat.totalRate / stat.totalCases > 15 ? "high" : stat.totalRate / stat.totalCases > 8 ? "medium" : "low",
      trend: Math.random() > 0.5 ? "increasing" : "stable", // Mock trend data
      records: stat.records,
    }))

    // Sort by average rate (highest first) and take top 10
    return conditions.sort((a, b) => b.averageRate - a.averageRate).slice(0, 10)
  }, [data])

  // Get borough breakdown for selected conditions
  const boroughBreakdown = useMemo(() => {
    if (!data || data.length === 0) return []

    const boroughStats = data.reduce(
      (acc, item) => {
        const borough = item.borough || "Unknown"
        if (!acc[borough]) {
          acc[borough] = {
            borough,
            totalRate: 0,
            count: 0,
            conditions: new Set<string>(),
          }
        }

        acc[borough].totalRate += item.rate || 0
        acc[borough].count += 1
        acc[borough].conditions.add(item.condition || "Unknown")

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(boroughStats).map((stat: any) => ({
      name: stat.borough,
      value: stat.count > 0 ? stat.totalRate / stat.count : 0,
      conditions: stat.conditions.size,
      cases: stat.count,
    }))
  }, [data])

  const handleShare = () => {
    if (onShare) {
      onShare({
        type: "top-conditions",
        data: topConditions,
        viewMode,
        filters,
      })
    }
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Top Health Conditions
          </CardTitle>
          <CardDescription>Most prevalent health conditions across NYC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No health condition data available</p>
            <p className="text-sm text-gray-500">Select filters to view health conditions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{topConditions.length}</div>
                <div className="text-xs text-gray-600">Conditions Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {topConditions.length > 0 ? formatPercentage(topConditions[0].averageRate) : "0%"}
                </div>
                <div className="text-xs text-gray-600">Highest Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{topConditions.filter((c) => c.severity === "high").length}</div>
                <div className="text-xs text-gray-600">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Top Health Conditions in NYC
              </CardTitle>
              <CardDescription>Most prevalent health conditions based on current filters</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-4">
                {topConditions.map((condition, index) => (
                  <div key={condition.condition} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-semibold text-gray-800">#{index + 1}</div>
                        <div>
                          <h3 className="font-medium">{condition.condition}</h3>
                          <p className="text-sm text-gray-600">
                            {condition.totalCases} cases across {condition.boroughCount} borough(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={condition.severity === "high" ? "destructive" : "secondary"}
                          className={condition.severity === "medium" ? "bg-yellow-100 text-yellow-800" : ""}
                        >
                          {condition.severity} priority
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPercentage(condition.averageRate)}
                          </div>
                          <div className="text-xs text-gray-500">avg rate</div>
                        </div>
                      </div>
                    </div>

                    <Progress
                      value={(condition.averageRate / (topConditions[0]?.averageRate || 1)) * 100}
                      className="h-2"
                    />

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                      <span>{condition.demographicCount} demographic groups affected</span>
                      <span
                        className={`font-medium ${
                          condition.trend === "increasing" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {condition.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detailed">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div>
                  <h3 className="font-medium mb-4">Condition Rates Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topConditions.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="condition" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [formatPercentage(value), "Rate"]} />
                      <Bar dataKey="averageRate" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart - Borough Distribution */}
                <div>
                  <h3 className="font-medium mb-4">Distribution by Borough</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={boroughBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
                      >
                        {boroughBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatPercentage(value), "Avg Rate"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topConditions.slice(0, 6).map((condition, index) => (
                  <Card key={condition.condition}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{condition.condition}</h4>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate:</span>
                          <span className="font-medium">{formatPercentage(condition.averageRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cases:</span>
                          <span>{condition.totalCases}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Boroughs:</span>
                          <span>{condition.boroughCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
