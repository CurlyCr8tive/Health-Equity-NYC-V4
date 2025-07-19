"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, MapPin, Activity, AlertTriangle } from "lucide-react"

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

interface CDCStatisticsCardsProps {
  stats: CDCHealthStats | null
  loading?: boolean
}

export default function CDCStatisticsCards({ stats, loading }: CDCStatisticsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-24 text-gray-500">
            <Activity className="h-8 w-8 mr-2" />
            No data available
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRiskLevel = (rate: number) => {
    if (rate >= 20) return { level: "High", color: "destructive", icon: AlertTriangle }
    if (rate >= 10) return { level: "Medium", color: "default", icon: TrendingUp }
    return { level: "Low", color: "secondary", icon: TrendingDown }
  }

  const averageRisk = getRiskLevel(stats.averageRate)
  const highestRisk = getRiskLevel(stats.highestRate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Records */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">Total Records</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{stats.totalRecords.toLocaleString()}</div>
          <p className="text-xs text-blue-700">
            From {stats.conditionsCount} condition{stats.conditionsCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Average Rate */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Average Rate</CardTitle>
          <averageRisk.icon className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{stats.averageRate.toFixed(1)}%</div>
          <div className="flex items-center gap-2">
            <Badge variant={averageRisk.color as any} className="text-xs">
              {averageRisk.level} Risk
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Highest Rate */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-800">Highest Rate</CardTitle>
          <highestRisk.icon className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{stats.highestRate.toFixed(1)}%</div>
          <div className="flex items-center gap-2">
            <Badge variant={highestRisk.color as any} className="text-xs">
              Peak Concern
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Coverage */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-800">Geographic Coverage</CardTitle>
          <MapPin className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{stats.boroughsCount}</div>
          <p className="text-xs text-purple-700">Borough{stats.boroughsCount !== 1 ? "s" : ""} covered</p>
        </CardContent>
      </Card>
    </div>
  )
}

export { CDCStatisticsCards }
