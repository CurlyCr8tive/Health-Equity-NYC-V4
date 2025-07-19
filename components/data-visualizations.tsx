"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Leaf, BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

interface DataVisualizationsProps {
  filters?: any
  data?: any
}

export default function DataVisualizations({ filters, data }: DataVisualizationsProps) {
  const [activeTab, setActiveTab] = useState("trends")

  // Process data based on filters
  const processedData = useMemo(() => {
    if (!data || !filters) {
      return {
        healthTrends: [],
        boroughComparison: [],
        environmentalFactors: [],
        demographics: [],
        hasData: false,
      }
    }

    // Health trends data from CDC data
    const healthTrendsData =
      data.cdcData?.length > 0
        ? data.cdcData.reduce((acc: any, item: any) => {
            const existing = acc.find((d: any) => d.condition === item.condition)
            if (existing) {
              existing.rate = Math.max(existing.rate, item.rate)
            } else {
              acc.push({
                condition: item.condition,
                rate: item.rate,
                borough: item.borough,
                cases: item.cases,
                population: item.population,
              })
            }
            return acc
          }, [])
        : []

    // Borough comparison from health data
    const boroughComparison =
      data.cdcData?.length > 0
        ? data.cdcData
            .reduce((acc: any, item: any) => {
              const existing = acc.find((d: any) => d.borough === item.borough)
              if (existing) {
                existing.totalRate += item.rate
                existing.conditionCount += 1
                existing.avgRate = existing.totalRate / existing.conditionCount
              } else {
                acc.push({
                  borough: item.borough,
                  rate: item.rate,
                  totalRate: item.rate,
                  conditionCount: 1,
                  avgRate: item.rate,
                  population: item.population,
                  riskLevel: item.rate > 25 ? "HIGH" : item.rate > 15 ? "MODERATE" : "LOW",
                })
              }
              return acc
            }, [])
            .sort((a: any, b: any) => b.avgRate - a.avgRate)
        : []

    // Environmental factors from epiQuery data
    const environmentalFactors =
      data.epiQueryData?.length > 0
        ? data.epiQueryData.map((item: any) => ({
            factor: item.indicator,
            value: item.value,
            borough: item.borough,
            healthImpact: item.healthImpact,
            description: item.description,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
          }))
        : []

    // Demographics data (mock for now, but structured to use real data)
    const demographics =
      filters.demographics?.ageGroups?.length > 0
        ? filters.demographics.ageGroups.map((ageGroup: string, index: number) => ({
            ageGroup,
            rate: 15 + index * 10 + Math.random() * 5, // Mock calculation
            population: `${(2.1 - index * 0.3).toFixed(1)}M`,
            riskLevel: index === 0 ? "LOW RISK" : index === 1 ? "MODERATE RISK" : "HIGH RISK",
          }))
        : [
            { ageGroup: "18-34", rate: 15.2, population: "2.1M", riskLevel: "LOW RISK" },
            { ageGroup: "35-54", rate: 28.7, population: "2.8M", riskLevel: "MODERATE RISK" },
            { ageGroup: "55+", rate: 42.1, population: "1.9M", riskLevel: "HIGH RISK" },
          ]

    return {
      healthTrends: healthTrendsData,
      boroughComparison,
      environmentalFactors,
      demographics,
      hasData: data.cdcData?.length > 0 || data.epiQueryData?.length > 0,
    }
  }, [data, filters])

  // Show message when no filters are applied
  if (!filters || (!filters.healthConditions?.length && !Object.values(filters.environmental || {}).some(Boolean))) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Visualizations
          </CardTitle>
          <CardDescription>Apply filters to see interactive charts and analysis</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Data to Visualize</h3>
            <p>
              Select health conditions or environmental factors from the filter panel to see detailed visualizations.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!processedData.hasData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Visualizations
          </CardTitle>
          <CardDescription>Loading data for your selected filters...</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Processing your filter selections...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Data Visualizations
        </CardTitle>
        <CardDescription>
          Interactive charts based on your selected filters: {filters.healthConditions?.length || 0} health conditions,{" "}
          {Object.values(filters.environmental || {}).filter(Boolean).length} environmental factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Health Data
            </TabsTrigger>
            <TabsTrigger value="borough" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Borough Comparison
            </TabsTrigger>
            <TabsTrigger value="environmental" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Environmental
            </TabsTrigger>
            <TabsTrigger value="demographics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demographics
            </TabsTrigger>
          </TabsList>

          {/* Health Data Tab */}
          <TabsContent value="trends" className="space-y-6">
            {processedData.healthTrends.length > 0 ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{processedData.healthTrends.length}</div>
                      <div className="text-sm font-medium text-blue-800">Health Conditions Tracked</div>
                      <div className="text-xs text-blue-600">Based on your filters</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">
                        {(
                          processedData.healthTrends.reduce((sum: number, item: any) => sum + item.rate, 0) /
                          processedData.healthTrends.length
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-sm font-medium text-red-800">Average Rate</div>
                      <div className="text-xs text-red-600">Across selected conditions</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.max(...processedData.healthTrends.map((item: any) => item.rate)).toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium text-orange-800">Highest Rate</div>
                      <div className="text-xs text-orange-600">Most concerning condition</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Health Conditions Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Health Conditions</CardTitle>
                    <CardDescription>Rates in your selected area(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={processedData.healthTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="condition" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No health condition data available for your current filters.</p>
              </div>
            )}
          </TabsContent>

          {/* Borough Comparison Tab */}
          <TabsContent value="borough" className="space-y-6">
            {processedData.boroughComparison.length > 0 ? (
              <>
                {/* Borough Rate Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {processedData.boroughComparison.slice(0, 5).map((borough: any, index: number) => (
                    <Card key={borough.borough} className="text-center">
                      <CardContent className="p-4">
                        <div
                          className={`text-2xl font-bold ${
                            borough.riskLevel === "HIGH"
                              ? "text-red-600"
                              : borough.riskLevel === "MODERATE"
                                ? "text-orange-600"
                                : "text-blue-600"
                          }`}
                        >
                          {borough.avgRate.toFixed(1)}%
                        </div>
                        <div className="text-sm font-medium">{borough.borough}</div>
                        <div
                          className={`text-xs px-2 py-1 rounded mt-1 ${
                            borough.riskLevel === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : borough.riskLevel === "MODERATE"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {borough.riskLevel} RISK
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Detailed Borough Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Borough Comparison</CardTitle>
                    <CardDescription>Average rates across selected health conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={processedData.boroughComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="borough" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgRate" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No borough comparison data available for your current filters.</p>
              </div>
            )}
          </TabsContent>

          {/* Environmental Tab */}
          <TabsContent value="environmental" className="space-y-6">
            {processedData.environmentalFactors.length > 0 ? (
              <>
                {/* Environmental Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {processedData.environmentalFactors.map((factor: any, index: number) => (
                    <Card key={index} className="text-center">
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold" style={{ color: factor.color }}>
                          {factor.value}
                        </div>
                        <div className="text-sm font-medium">{factor.factor}</div>
                        <div className="text-xs text-gray-600">{factor.borough}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Environmental Factors Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Environmental Factors</CardTitle>
                    <CardDescription>Selected environmental indicators by borough</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={processedData.environmentalFactors}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="factor" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No environmental data available. Select environmental factors from the filter panel.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processedData.demographics.map((group: any, index: number) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-4">
                    <div
                      className={`text-3xl font-bold ${
                        group.riskLevel === "HIGH RISK"
                          ? "text-red-600"
                          : group.riskLevel === "MODERATE RISK"
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {group.rate.toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium">{group.ageGroup}</div>
                    <div className="text-xs text-gray-600">Population: {group.population}</div>
                    <div
                      className={`text-xs px-2 py-1 rounded mt-2 ${
                        group.riskLevel === "HIGH RISK"
                          ? "bg-red-100 text-red-800"
                          : group.riskLevel === "MODERATE RISK"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {group.riskLevel}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Demographics Analysis</CardTitle>
                <CardDescription>Health condition rates by demographic groups</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.demographics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
