"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  BookOpen,
  Leaf,
  BarChart3,
  Map,
  Filter,
  Brain,
  Heart,
  Building,
  TreePine,
  ShoppingCart,
} from "lucide-react"
import { HamburgerNav } from "@/components/hamburger-nav"
import FilterPanel from "@/components/filter-panel"
import MapComponent from "@/components/map-component"
import ChartPanel from "@/components/chart-panel"
import AISummary from "@/components/ai-summary"
import HealthEducation from "@/components/health-education"
import EnvironmentalEducation from "@/components/environmental-education"
import TopConditionsVisualization from "@/components/top-conditions-visualization"
import { useNYCHealthData } from "@/hooks/use-nyc-health-data"
import type { HealthData } from "@/types"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const [filters, setFilters] = useState({
    healthConditions: [],
    borough: "",
    zipCode: "",
    neighborhood: "",
    radius: "5 miles",
    ageGroups: [],
    raceEthnicities: [],
    includeNeighborhood: false,
    overlays: {
      foodDeserts: false,
      snapAccess: false,
      greenSpace: false,
      airQuality: true,
      waterQuality: false,
      foodZones: false,
      healthcareAccess: false,
      transitAccess: false,
    },
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const router = useRouter()

  const { data: nycData, error, isLoading } = useNYCHealthData()

  // Check authentication
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setAuthError(null)
      } else {
        setAuthError("Please sign in to access the community dashboard.")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setAuthError("Connection error. Please try again.")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on current filters
  const filteredData: HealthData[] = nycData?.health || []

  const handleApplyFilters = async () => {
    setIsAnalyzing(true)
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsAnalyzing(false)
  }

  const handleDownloadReport = () => {
    // Generate and download report
    const reportData = {
      filters,
      data: filteredData,
      timestamp: new Date().toISOString(),
      user: user?.email,
      reportType: "Community Health Analysis",
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `community-health-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate summary statistics for community display
  const summaryStats = {
    healthConditions: nycData?.health ? [...new Set(nycData.health.map((item) => item.condition))].length : 0,
    boroughs: 5, // NYC has 5 boroughs
    greenSpaces: nycData?.environmental ? nycData.environmental.filter((item) => item.type === "park").length : 0,
    foodAccess: nycData?.environmental
      ? nycData.environmental.filter((item) => item.type === "grocery" || item.type === "snap").length
      : 0,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading community dashboard...</p>
          {authError && <p className="text-red-500 mt-2">{authError}</p>}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const getUserRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Health Administrator"
      case "worker":
        return "Community Health Worker"
      default:
        return "Community Member"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white shadow-sm border-b" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <HamburgerNav />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NYC Health Equity Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome, {user.name}! • {getUserRoleDisplay(user.role)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleDownloadReport}
                className="bg-blue-600 hover:bg-blue-700"
                aria-label="Download community health report"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Community Stats Overview */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.healthConditions}</div>
              <div className="text-sm text-gray-600">Health Conditions Tracked</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.boroughs}</div>
              <div className="text-sm text-gray-600">NYC Boroughs</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <TreePine className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.greenSpaces}</div>
              <div className="text-sm text-gray-600">Parks & Green Spaces</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{summaryStats.foodAccess}</div>
              <div className="text-sm text-gray-600">Food Access Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" role="main">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100" role="tablist">
            <TabsTrigger
              value="dashboard"
              className="flex items-center space-x-2"
              role="tab"
              aria-selected={activeTab === "dashboard"}
              aria-controls="dashboard-panel"
            >
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              <span>Community Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="top-conditions"
              className="flex items-center space-x-2"
              role="tab"
              aria-selected={activeTab === "top-conditions"}
              aria-controls="top-conditions-panel"
            >
              <Brain className="w-4 h-4" aria-hidden="true" />
              <span>Common Issues</span>
            </TabsTrigger>
            <TabsTrigger
              value="health-education"
              className="flex items-center space-x-2"
              role="tab"
              aria-selected={activeTab === "health-education"}
              aria-controls="health-education-panel"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Health Resources</span>
            </TabsTrigger>
            <TabsTrigger
              value="environmental-education"
              className="flex items-center space-x-2"
              role="tab"
              aria-selected={activeTab === "environmental-education"}
              aria-controls="environmental-education-panel"
            >
              <Leaf className="w-4 h-4" aria-hidden="true" />
              <span>Environment & Health</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent
            value="dashboard"
            className="space-y-6 mt-6"
            role="tabpanel"
            id="dashboard-panel"
            aria-labelledby="dashboard-tab"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <aside className="lg:col-span-1" role="complementary" aria-label="Data filters and controls">
                <div className="sticky top-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Filter className="w-5 h-5 mr-2" aria-hidden="true" />
                        Explore Your Area
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Filter health data by your neighborhood, health concerns, and community demographics
                      </p>
                    </CardHeader>
                    <CardContent>
                      <FilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                        onApplyFilters={handleApplyFilters}
                        onDownloadData={handleDownloadReport}
                        isLoading={isAnalyzing}
                      />
                    </CardContent>
                  </Card>
                </div>
              </aside>

              {/* Main Dashboard Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Map Section */}
                <section aria-labelledby="map-section-title" id="map">
                  <Card>
                    <CardHeader>
                      <CardTitle id="map-section-title" className="flex items-center text-lg">
                        <Map className="w-5 h-5 mr-2" aria-hidden="true" />
                        Community Health Map
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Explore health conditions and environmental factors in NYC neighborhoods. Click on areas to
                        learn more.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <MapComponent
                        filters={filters}
                        data={filteredData}
                        environmentalData={nycData?.environmental || []}
                        isLoading={isLoading}
                      />
                    </CardContent>
                  </Card>
                </section>

                {/* AI Analysis Section */}
                <section aria-labelledby="ai-analysis-title">
                  <Card>
                    <CardHeader>
                      <CardTitle id="ai-analysis-title" className="flex items-center text-lg">
                        <Brain className="w-5 h-5 mr-2" aria-hidden="true" />
                        Community Health Insights
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        AI-powered analysis of health patterns and trends in your selected area
                      </p>
                    </CardHeader>
                    <CardContent>
                      <AISummary
                        data={filteredData}
                        filters={filters}
                        environmentalData={nycData?.environmental || []}
                        nycData={nycData}
                      />
                    </CardContent>
                  </Card>
                </section>

                {/* Charts Section */}
                <section aria-labelledby="charts-section-title">
                  <Card>
                    <CardHeader>
                      <CardTitle id="charts-section-title" className="flex items-center text-lg">
                        <BarChart3 className="w-5 h-5 mr-2" aria-hidden="true" />
                        Health Data Visualizations
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Charts showing health trends and patterns in your community
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ChartPanel data={filteredData} filters={filters} isLoading={isLoading} />
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </TabsContent>

          {/* Top Conditions Tab */}
          <TabsContent
            value="top-conditions"
            className="space-y-6 mt-6"
            role="tabpanel"
            id="top-conditions-panel"
            aria-labelledby="top-conditions-tab"
          >
            <section aria-labelledby="top-conditions-section-title" id="top-conditions">
              <Card>
                <CardHeader>
                  <CardTitle id="top-conditions-section-title" className="flex items-center text-lg">
                    <Brain className="w-5 h-5 mr-2" aria-hidden="true" />
                    Most Common Health Issues in NYC
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Learn about the most prevalent health conditions affecting NYC communities and how they vary by
                    neighborhood and demographics
                  </p>
                </CardHeader>
                <CardContent>
                  <TopConditionsVisualization data={filteredData} filters={filters} />
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Health Education Tab */}
          <TabsContent
            value="health-education"
            className="mt-6"
            role="tabpanel"
            id="health-education-panel"
            aria-labelledby="health-education-tab"
          >
            <HealthEducation />
          </TabsContent>

          {/* Environmental Education Tab */}
          <TabsContent
            value="environmental-education"
            className="mt-6"
            role="tabpanel"
            id="environmental-education-panel"
            aria-labelledby="environmental-education-tab"
          >
            <EnvironmentalEducation />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>NYC Health Equity Dashboard • Data from NYC Open Data and Department of Health</p>
            <p className="mt-2">Built for community members, health workers, and advocates</p>
            <p className="mt-2">
              Signed in as: {user.email} ({getUserRoleDisplay(user.role)})
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
