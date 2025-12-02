"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Download,
  Share2,
  RefreshCw,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Target,
  Users,
} from "lucide-react"

interface AISummaryProps {
  data: any[]
  filters: any
  environmentalData: any[]
  comprehensiveData: any
  onAnalysisComplete: (data: any) => void
  onExportData: () => void
  onShareDialog: () => void
}

export default function AISummary({
  data,
  filters,
  environmentalData,
  comprehensiveData,
  onAnalysisComplete,
  onExportData,
  onShareDialog,
}: AISummaryProps) {
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("summary")

  // Generate AI analysis when data changes
  useEffect(() => {
    if (comprehensiveData && (comprehensiveData.cdcData?.length > 0 || comprehensiveData.epiQueryData?.length > 0)) {
      generateAnalysis()
    }
  }, [comprehensiveData])

  const generateAnalysis = async () => {
    if (!comprehensiveData) return

    setLoading(true)
    setError("")

    try {
      console.log("🤖 Generating AI analysis with data:", {
        healthDataPoints: comprehensiveData.cdcData?.length || 0,
        environmentalDataPoints: comprehensiveData.epiQueryData?.length || 0,
        filters,
      })

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Map healthData to 'data' as expected by the analyze endpoint
          data: comprehensiveData.cdcData || [],
          environmentalData: comprehensiveData.epiQueryData || [],
          filters: filters,
        }),
      })

      const text = await response.text()
      let result

      try {
        result = JSON.parse(text)
      } catch (e) {
        console.error("Failed to parse AI response:", text.substring(0, 100))
        throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      console.log("✅ AI analysis generated successfully")

      let formattedAnalysis = ""

      if (typeof result === "string") {
        formattedAnalysis = result
      } else {
        // Construct markdown from structured response
        if (result.summary) formattedAnalysis += `# Executive Summary\n${result.summary}\n\n`

        if (result.insights && Array.isArray(result.insights)) {
          formattedAnalysis += `## Key Insights\n${result.insights.map((i: string) => `- ${i}`).join("\n")}\n\n`
        }

        if (result.topConcerns && Array.isArray(result.topConcerns)) {
          formattedAnalysis += `## Top Health Concerns\n${result.topConcerns.map((c: any) => `- **${c.condition}**: ${c.severity.toUpperCase()} severity in ${c.affectedAreas?.join(", ")}`).join("\n")}\n\n`
        }

        if (result.correlations && Array.isArray(result.correlations)) {
          formattedAnalysis += `## Environmental Correlations\n${result.correlations.map((c: any) => `- ${c.significance}`).join("\n")}\n\n`
        }

        if (result.recommendations && Array.isArray(result.recommendations)) {
          formattedAnalysis += `## Recommended Actions\n${result.recommendations.map((r: string) => `- ${r}`).join("\n")}`
        }

        // Fallback if structure is different
        if (!formattedAnalysis && result.analysis) formattedAnalysis = result.analysis
      }

      setAnalysis(formattedAnalysis)

      // Update comprehensive data with AI insights
      if (onAnalysisComplete) {
        onAnalysisComplete({
          ...comprehensiveData,
          aiAnalysis: formattedAnalysis,
          aiStats: result.stats || {
            // Provide fallback stats if not present
            conditionsCount: comprehensiveData.cdcData?.length || 0,
            environmentalFactorsCount: comprehensiveData.epiQueryData?.length || 0,
            averageRate: 0, // Calculate if needed
          },
        })
      }
    } catch (error: any) {
      console.error("❌ Error generating AI analysis:", error)
      setError(error.message || "Failed to generate AI analysis")
    } finally {
      setLoading(false)
    }
  }

  const getKeyInsights = () => {
    if (!comprehensiveData?.stats) {
      return {
        healthConditionsAnalyzed: 0,
        environmentalFactorsConsidered: 0,
        averagePrevalenceRate: "0.0",
        geographicFocus: "New York City",
        riskLevel: "LOW",
      }
    }

    const stats = comprehensiveData.stats
    return {
      healthConditionsAnalyzed: stats.conditionsCount || 0,
      environmentalFactorsConsidered: stats.environmentalFactorsCount || 0,
      averagePrevalenceRate: stats.averageRate?.toFixed(1) || "0.0",
      geographicFocus: filters.geographic?.boroughs?.join(", ") || "New York City",
      riskLevel: stats.averageRate > 25 ? "HIGH" : stats.averageRate > 15 ? "MODERATE" : "LOW",
    }
  }

  const insights = getKeyInsights()

  const formatAnalysisText = (text: string) => {
    if (!text) return ""

    // Split by common markdown headers and format
    const sections = text.split(/(?=##?\s)/g)

    return sections
      .map((section, index) => {
        if (section.startsWith("# ")) {
          return `<h1 class="text-2xl font-bold mb-4 text-blue-800">${section.substring(2)}</h1>`
        } else if (section.startsWith("## ")) {
          return `<h2 class="text-xl font-semibold mb-3 text-blue-700">${section.substring(3)}</h2>`
        } else if (section.startsWith("### ")) {
          return `<h3 class="text-lg font-medium mb-2 text-blue-600">${section.substring(4)}</h3>`
        } else {
          // Format bullet points and paragraphs
          return section
            .split("\n")
            .map((line) => {
              line = line.trim()
              if (line.startsWith("- ")) {
                return `<li class="ml-4 mb-1">${line.substring(2)}</li>`
              } else if (line.startsWith("* ")) {
                return `<li class="ml-4 mb-1">${line.substring(2)}</li>`
              } else if (line.length > 0) {
                return `<p class="mb-3 text-gray-700">${line}</p>`
              }
              return ""
            })
            .join("")
        }
      })
      .join("")
  }

  const hasData =
    comprehensiveData &&
    ((comprehensiveData.cdcData && comprehensiveData.cdcData.length > 0) ||
      (comprehensiveData.epiQueryData && comprehensiveData.epiQueryData.length > 0))

  if (!hasData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Health Analysis
          </CardTitle>
          <CardDescription>
            Get AI-generated insights and recommendations based on your selected health and environmental data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No Data for Analysis</h3>
              <p className="text-gray-600 mt-1">
                Select health conditions or environmental factors to generate AI-powered insights and recommendations.
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
      {/* Key Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Findings Summary
          </CardTitle>
          <CardDescription>
            AI-powered analysis of health conditions and environmental factors in your selected area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Health Conditions</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{insights.healthConditionsAnalyzed}</div>
              <div className="text-sm text-blue-700">conditions analyzed</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Environmental Factors</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{insights.environmentalFactorsConsidered}</div>
              <div className="text-sm text-green-700">factors considered</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Average Rate</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{insights.averagePrevalenceRate}%</div>
              <div className="text-sm text-orange-700">prevalence rate</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Risk Level</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{insights.riskLevel}</div>
              <div className="text-sm text-purple-700">overall assessment</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-800">Geographic Focus</span>
            </div>
            <p className="text-gray-700">{insights.geographicFocus}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            AI Summary
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Key Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Action Plan
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Generated Analysis
                  </CardTitle>
                  <CardDescription>Community-focused health report generated by AI</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Generating AI analysis...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Analysis Error</span>
                  </div>
                  <p className="text-red-700 mb-3">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAnalysis}
                    className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : analysis ? (
                <div className="prose max-w-none">
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatAnalysisText(analysis) }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Click "Generate Analysis" to create AI-powered insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Health Insights
              </CardTitle>
              <CardDescription>Important patterns and trends identified in your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comprehensiveData?.cdcData?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Health Condition Patterns</h4>
                    <ul className="space-y-2">
                      {comprehensiveData.cdcData.slice(0, 3).map((item: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-blue-700">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>
                            {item.condition} affects {item.rate}% of residents in {item.borough}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comprehensiveData?.epiQueryData?.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Environmental Factors</h4>
                    <ul className="space-y-2">
                      {comprehensiveData.epiQueryData.slice(0, 3).map((item: any, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-green-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>
                            {item.indicator} in {item.borough}: {item.value} {item.unit} ({item.healthImpact})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Risk Assessment</h4>
                  <p className="text-orange-700">
                    Based on the selected data, the overall health risk level for your area is{" "}
                    <span className="font-semibold">{insights.riskLevel}</span>.
                    {insights.riskLevel === "HIGH" &&
                      " Immediate community action and health resources are recommended."}
                    {insights.riskLevel === "MODERATE" &&
                      " Preventive measures and community health programs would be beneficial."}
                    {insights.riskLevel === "LOW" &&
                      " Continue current health practices and stay informed about community health trends."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
              <CardDescription>
                Specific steps you can take to improve health outcomes in your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Immediate Actions</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Connect with Local Health Resources</p>
                        <p className="text-sm text-red-700">
                          Find community health centers and screening programs in your area
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800">Stay Informed</p>
                        <p className="text-sm text-orange-700">
                          Monitor health trends and environmental conditions in your neighborhood
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Long-term Strategies</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Community Advocacy</p>
                        <p className="text-sm text-blue-700">
                          Work with neighbors to advocate for better health services and environmental improvements
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Prevention Focus</p>
                        <p className="text-sm text-green-700">
                          Participate in preventive health programs and environmental protection initiatives
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Resources
              </CardTitle>
              <CardDescription>
                Local organizations and services that can help address health concerns in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Health Services</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Community Health Centers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Free Health Screenings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Mental Health Support</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Nutrition Programs</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Emergency Resources</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>NYC Health + Hospitals: 1-844-NYC-4NYC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Crisis Text Line: Text HOME to 741741</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>311 for City Services</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Environmental Resources</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>NYC Parks & Recreation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Community Gardens</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Air Quality Monitoring</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Environmental Justice Groups</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Advocacy Organizations</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Community Health Advocates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Neighborhood Associations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Health Equity Organizations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Share AI Report</h3>
              <p className="text-sm text-gray-600">Export or share this analysis with your community</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onShareDialog}>
                <Share2 className="h-4 w-4 mr-2" />
                Share AI Report
              </Button>
              <Button variant="outline" size="sm" onClick={onExportData}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
