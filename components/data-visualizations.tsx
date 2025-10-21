"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, BarChart3, PieChartIcon, Activity, AlertCircle, CheckCircle, Info } from "lucide-react"

interface DataVisualizationsProps {
  filters: any
  data: any
}

export default function DataVisualizations({ filters, data }: DataVisualizationsProps) {
  const [activeChart, setActiveChart] = useState("bar")
  const [loading, setLoading] = useState(false)

  // Process data for visualizations
  const processHealthData = () => {
    if (!data?.cdcData || data.cdcData.length === 0) {
      return []
    }

    // Group by borough and condition
    const groupedData = data.cdcData.reduce((acc: any, item: any) => {
      const key = `${item.borough}_${item.condition}`
      if (!acc[key]) {
        acc[key] = {
          borough: item.borough,
          condition: item.condition,
          rate: item.rate,
          cases: item.cases || 0,
          population: item.population || 0,
        }
      }
      return acc
    }, {})

    return Object.values(groupedData)
  }

  const processEnvironmentalData = () => {
    if (!data?.epiQueryData || data.epiQueryData.length === 0) {
      return []
    }

    return data.epiQueryData.map((item: any) => ({
      borough: item.borough,
      indicator: item.indicator,
      value: item.value,
      unit: item.unit,
      healthImpact: item.healthImpact,
    }))
  }

  const healthChartData = processHealthData()
  const environmentalChartData = processEnvironmentalData()

  // Create borough comparison data
  const createBoroughComparisonData = () => {
    const boroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

    return boroughs.map((borough) => {
      const boroughHealthData = healthChartData.filter((item: any) => item.borough === borough)
      const boroughEnvData = environmentalChartData.filter((item: any) => item.borough === borough)

      const avgHealthRate =
        boroughHealthData.length > 0
          ? boroughHealthData.reduce((sum: number, item: any) => sum + item.rate, 0) / boroughHealthData.length
          : 0

      const avgEnvScore =
        boroughEnvData.length > 0
          ? boroughEnvData.reduce((sum: number, item: any) => sum + item.value, 0) / boroughEnvData.length
          : 0

      return {
        borough,
        healthRate: Number(avgHealthRate.toFixed(1)),
        envScore: Number(avgEnvScore.toFixed(1)),
        dataPoints: boroughHealthData.length + boroughEnvData.length,
      }
    })
  }

  const boroughComparisonData = createBoroughComparisonData()

  // Create condition breakdown data
  const createConditionBreakdownData = () => {
    const conditionMap = new Map()

    healthChartData.forEach((item: any) => {
      if (conditionMap.has(item.condition)) {
        const existing = conditionMap.get(item.condition)
        conditionMap.set(item.condition, {
          condition: item.condition,
          totalRate: existing.totalRate + item.rate,
          count: existing.count + 1,
          totalCases: existing.totalCases + (item.cases || 0),
        })
      } else {
        conditionMap.set(item.condition, {
          condition: item.condition,
          totalRate: item.rate,
          count: 1,
          totalCases: item.cases || 0,
        })
      }
    })

    return Array.from(conditionMap.values()).map((item: any) => ({
      condition: item.condition,
      avgRate: Number((item.totalRate / item.count).toFixed(1)),
      totalCases: item.totalCases,
      boroughs: item.count,
    }))
  }

  const conditionBreakdownData = createConditionBreakdownData()

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  const hasData = healthChartData.length > 0 || environmentalChartData.length > 0

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Visualizations
          </CardTitle>
          <CardDescription>Interactive charts and graphs showing health and environmental data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Data to Visualize</h3>
              <p className="text-gray-600 mt-1">
                Select health conditions or environmental factors from the filters to see data visualizations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Select Health Conditions</Badge>
              <Badge variant="outline">Choose Environmental Factors</Badge>
              <Badge variant="outline">Pick Geographic Areas</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Data Points</p>
                <p className="text-2xl font-bold">{data?.stats?.totalRecords || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Conditions</p>
                <p className="text-2xl font-bold">{data?.stats?.conditionsCount || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Environmental Factors</p>
                <p className="text-2xl font-bold">{data?.stats?.environmentalFactorsCount || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-2xl font-bold">{data?.stats?.averageRate?.toFixed(1) || "0.0"}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization Tabs */}
      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bar" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Borough Comparison
          </TabsTrigger>
          <TabsTrigger value="pie" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Condition Breakdown
          </TabsTrigger>
          <TabsTrigger value="line" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Environmental Trends
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Detailed Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Rates by Borough</CardTitle>
              <CardDescription>Average health condition rates across NYC boroughs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={boroughComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="borough" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${value}${name === "healthRate" ? "%" : ""}`,
                      name === "healthRate" ? "Health Rate" : "Environmental Score",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="healthRate" fill="#8884d8" name="Health Rate (%)" />
                  <Bar dataKey="envScore" fill="#82ca9d" name="Environmental Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Conditions Distribution</CardTitle>
              <CardDescription>Breakdown of health conditions by average prevalence rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={conditionBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ condition, avgRate }) => `${condition}: ${avgRate}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="avgRate"
                  >
                    {conditionBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, "Average Rate"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Indicators by Borough</CardTitle>
              <CardDescription>Environmental factor scores across different boroughs</CardDescription>
            </CardHeader>
            <CardContent>
              {environmentalChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={environmentalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="borough" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any, name: string, props: any) => [
                        `${value} ${props.payload.unit}`,
                        props.payload.indicator,
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600">No environmental data available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Select environmental factors from the filters to see trends
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Data Table */}
            {healthChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Health Conditions Detail</CardTitle>
                  <CardDescription>Detailed breakdown of health condition rates by borough</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Condition</th>
                          <th className="text-left p-2">Borough</th>
                          <th className="text-left p-2">Rate (%)</th>
                          <th className="text-left p-2">Est. Cases</th>
                        </tr>
                      </thead>
                      <tbody>
                        {healthChartData.slice(0, 10).map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.condition}</td>
                            <td className="p-2">{item.borough}</td>
                            <td className="p-2">{item.rate}%</td>
                            <td className="p-2">{item.cases?.toLocaleString() || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Environmental Data Table */}
            {environmentalChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Factors Detail</CardTitle>
                  <CardDescription>Environmental indicators and their health impact assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Indicator</th>
                          <th className="text-left p-2">Borough</th>
                          <th className="text-left p-2">Value</th>
                          <th className="text-left p-2">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {environmentalChartData.slice(0, 10).map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{item.indicator}</td>
                            <td className="p-2">{item.borough}</td>
                            <td className="p-2">
                              {item.value} {item.unit}
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  item.healthImpact === "High Risk"
                                    ? "destructive"
                                    : item.healthImpact === "Moderate Risk"
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {item.healthImpact}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Export Visualizations</h3>
              <p className="text-sm text-gray-600">Download charts and data for further analysis</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export Charts
              </Button>
              <Button variant="outline" size="sm">
                Download Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
