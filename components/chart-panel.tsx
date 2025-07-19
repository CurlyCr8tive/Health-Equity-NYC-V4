"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { BarChart3, LineChartIcon, PieChartIcon, Download, Share2 } from "lucide-react"
import type { HealthData, FilterState } from "@/types"
import { formatPercentage } from "@/lib/utils"
import ChartExplanation from "./chart-explanation"

interface ChartPanelProps {
  data?: HealthData[]
  filters: FilterState
  onShare?: (content: any) => void
  onDownload?: () => void
}

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

export default function ChartPanel({ data = [], filters, onShare, onDownload }: ChartPanelProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar")
  const [groupBy, setGroupBy] = useState<"borough" | "condition" | "demographic">("borough")

  // --- SAFELY NORMALISE environmentalFactors TO ARRAY ------------------------
  const envFactors: string[] = Array.isArray(filters.environmentalFactors)
    ? filters.environmentalFactors
    : // legacy object form `{ airQuality: true, waterQuality: false, … }`
      Object.entries(filters.environmentalFactors ?? {})
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k)

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = data.reduce(
      (acc, item) => {
        let key: string
        switch (groupBy) {
          case "borough":
            key = item.borough || "Unknown"
            break
          case "condition":
            key = item.condition || "Unknown"
            break
          case "demographic":
            key = item.demographic || "Unknown"
            break
          default:
            key = "Unknown"
        }

        if (!acc[key]) {
          acc[key] = { name: key, value: 0, count: 0 }
        }
        acc[key].value += item.rate || 0
        acc[key].count += 1
        return acc
      },
      {} as Record<string, { name: string; value: number; count: number }>,
    )

    // Calculate averages
    return Object.values(grouped).map((item) => ({
      name: item.name,
      value: item.count > 0 ? Number((item.value / item.count).toFixed(1)) : 0,
      count: item.count,
    }))
  }, [data, groupBy])

  // Get summary statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        total: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        conditions: 0,
        boroughs: 0,
      }
    }

    const rates = data.map((d) => d.rate || 0)
    const conditions = new Set(data.map((d) => d.condition)).size
    const boroughs = new Set(data.map((d) => d.borough)).size

    return {
      total: data.length,
      average: rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0,
      highest: rates.length > 0 ? Math.max(...rates) : 0,
      lowest: rates.length > 0 ? Math.min(...rates) : 0,
      conditions,
      boroughs,
    }
  }, [data])

  const handleShare = () => {
    if (onShare) {
      onShare({
        type: "chart",
        chartType,
        groupBy,
        data: chartData,
        filters,
      })
    }
  }

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available for the selected filters</p>
            <p className="text-sm">Try adjusting your filter selections</p>
          </div>
        </div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [formatPercentage(value), "Rate"]}
                labelFormatter={(label) => `${groupBy}: ${label}`}
              />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [formatPercentage(value), "Rate"]}
                labelFormatter={(label) => `${groupBy}: ${label}`}
              />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [formatPercentage(value), "Rate"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatPercentage(stats.average)}</div>
            <div className="text-xs text-gray-600">Average Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatPercentage(stats.highest)}</div>
            <div className="text-xs text-gray-600">Highest Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{formatPercentage(stats.lowest)}</div>
            <div className="text-xs text-gray-600">Lowest Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.conditions}</div>
            <div className="text-xs text-gray-600">Conditions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.boroughs}</div>
            <div className="text-xs text-gray-600">Boroughs</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls and Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Health Data Visualization</CardTitle>
              <CardDescription>Interactive charts showing health patterns across NYC</CardDescription>
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
          {/* Chart Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Chart Type:</span>
              <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
                <TabsList>
                  <TabsTrigger value="bar">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Bar
                  </TabsTrigger>
                  <TabsTrigger value="line">
                    <LineChartIcon className="h-4 w-4 mr-1" />
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="pie">
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    Pie
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Group By:</span>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borough">Borough</SelectItem>
                  <SelectItem value="condition">Health Condition</SelectItem>
                  <SelectItem value="demographic">Demographics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart Display */}
          <div className="border rounded-lg p-4">{renderChart()}</div>

          {/* Chart Explanation */}
          <ChartExplanation chartType={chartType} groupBy={groupBy} />

          {/* Active Filters Display */}
          {(filters.healthConditions.length > 0 || envFactors.length > 0 || filters.borough || filters.zipCode) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.healthConditions.map((condition) => (
                  <Badge key={condition} variant="secondary">
                    {condition}
                  </Badge>
                ))}
                {envFactors.map((factor) => (
                  <Badge key={factor} variant="outline">
                    {factor}
                  </Badge>
                ))}
                {filters.borough && <Badge variant="default">{filters.borough}</Badge>}
                {filters.zipCode && <Badge variant="default">ZIP {filters.zipCode}</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { ChartPanel }
