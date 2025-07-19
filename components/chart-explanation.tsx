"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, TrendingUp, BarChart3, PieChart, HelpCircle } from "lucide-react"

interface ChartExplanationProps {
  chartType: "pie" | "bar" | "line"
  data?: any[]
  selectedMetrics?: string[]
}

function ChartExplanation({ chartType, data = [], selectedMetrics = [] }: ChartExplanationProps) {
  const getMetricExplanation = (metric: string) => {
    const explanations: Record<string, { description: string; interpretation: string; unit: string }> = {
      "Air Quality Index": {
        description: "Measures air pollution levels on a scale of 0-500",
        interpretation: "85.0% means 85% of monitored days had unhealthy air quality (NOT an 85% increase)",
        unit: "Percentage of unhealthy air days",
      },
      "Food Access Score": {
        description: "Measures residents' access to healthy, affordable food options",
        interpretation: "72.0% means 72% of residents have adequate access to healthy food within reasonable distance",
        unit: "Percentage of residents with good food access",
      },
      "Green Space Access": {
        description: "Measures access to parks, gardens, and recreational green areas",
        interpretation: "65.0% means 65% of residents live within walking distance of green spaces",
        unit: "Percentage of residents with green space access",
      },
      Hypertension: {
        description: "High blood pressure prevalence among adults",
        interpretation: "28.3% means 28.3 out of every 100 adults have hypertension (prevalence rate)",
        unit: "Percentage of adults affected",
      },
      Diabetes: {
        description: "Type 2 diabetes prevalence among adults",
        interpretation: "12.5% means 12.5 out of every 100 adults have diabetes (prevalence rate)",
        unit: "Percentage of adults affected",
      },
      Asthma: {
        description: "Asthma prevalence across all age groups",
        interpretation: "18.7% means 18.7 out of every 100 people have asthma (prevalence rate)",
        unit: "Percentage of population affected",
      },
      "Mental Health": {
        description: "Mental health condition prevalence and service access",
        interpretation: "Shows percentage of population with mental health needs or service gaps",
        unit: "Percentage of population affected",
      },
      Obesity: {
        description: "Adult obesity rates (BMI ≥30)",
        interpretation: "Shows percentage of adults classified as obese",
        unit: "Percentage of adults affected",
      },
    }

    return (
      explanations[metric] || {
        description: "Health or environmental indicator",
        interpretation: "Percentage represents prevalence or access rate in the population",
        unit: "Percentage",
      }
    )
  }

  const getChartTypeExplanation = () => {
    switch (chartType) {
      case "pie":
        return {
          title: "Pie Chart - Proportional View",
          description: "Shows how different health conditions or factors compare as parts of the whole",
          howToRead:
            "Each slice represents the relative proportion of each metric. Larger slices indicate higher values or greater impact.",
          bestFor: "Comparing multiple health conditions within a single borough or demographic group",
        }
      case "bar":
        return {
          title: "Bar Chart - Comparative Values",
          description: "Compares exact values across different categories, boroughs, or time periods",
          howToRead: "Taller bars indicate higher values. Easy to compare specific numbers between categories.",
          bestFor: "Comparing health outcomes between boroughs or demographic groups",
        }
      case "line":
        return {
          title: "Line Chart - Trends Over Time",
          description: "Shows how health indicators change over time or across different variables",
          howToRead:
            "Rising lines show increases, falling lines show decreases. Steeper slopes indicate faster changes.",
          bestFor: "Tracking health trends, seasonal patterns, or intervention effectiveness",
        }
    }
  }

  const chartInfo = getChartTypeExplanation()

  return (
    <div className="space-y-4">
      {/* Chart Type Explanation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {chartType === "pie" && <PieChart className="h-5 w-5" />}
            {chartType === "bar" && <BarChart3 className="h-5 w-5" />}
            {chartType === "line" && <TrendingUp className="h-5 w-5" />}
            {chartInfo.title}
          </CardTitle>
          <CardDescription>{chartInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-1">How to Read This Chart:</h4>
            <p className="text-sm text-gray-600">{chartInfo.howToRead}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Best Used For:</h4>
            <p className="text-sm text-gray-600">{chartInfo.bestFor}</p>
          </div>
        </CardContent>
      </Card>

      {/* Metric Explanations */}
      {selectedMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              What These Numbers Mean
            </CardTitle>
            <CardDescription>Understanding your health data metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMetrics.map((metric) => {
              const explanation = getMetricExplanation(metric)
              return (
                <div key={metric} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{metric}</h4>
                    <Badge variant="outline" className="text-xs">
                      {explanation.unit}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{explanation.description}</p>
                  <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Key Point:</strong> {explanation.interpretation}
                    </AlertDescription>
                  </Alert>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* General Health Data Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Understanding Health Equity Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Prevalence Rates</h4>
              <p className="text-gray-600">
                Show what percentage of the population has a condition. For example, "15% diabetes rate" means 15 out of
                100 people have diabetes.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Access Scores</h4>
              <p className="text-gray-600">
                Measure how well communities can access resources. Higher scores generally indicate better access to
                healthcare, food, or services.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Environmental Indices</h4>
              <p className="text-gray-600">
                Measure environmental quality. Air Quality Index (AQI) values above 100 are considered unhealthy for
                sensitive groups.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Comparative Context</h4>
              <p className="text-gray-600">
                Data is compared across NYC's 5 boroughs to identify health disparities and guide targeted
                interventions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChartExplanation
