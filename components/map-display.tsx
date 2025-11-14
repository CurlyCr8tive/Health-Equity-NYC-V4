"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Map, MapPin, Layers, ZoomIn, ZoomOut, RotateCcw, Info, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

interface MapDisplayProps {
  healthData: any[]
  boroughData: any[]
  filters: any
  onFiltersChange: (filters: any) => void
}

export default function MapDisplay({ healthData, boroughData, filters, onFiltersChange }: MapDisplayProps) {
  const [activeLayer, setActiveLayer] = useState("health")
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  const DEFAULT_HEALTH_DATA = [
    { borough: "Manhattan", condition: "Hypertension", rate: 22.8, cases: 38000, population: 1694251 },
    { borough: "Brooklyn", condition: "Hypertension", rate: 28.7, cases: 78000, population: 2736074 },
    { borough: "Queens", condition: "Hypertension", rate: 25.3, cases: 61000, population: 2405464 },
    { borough: "Bronx", condition: "Hypertension", rate: 32.1, cases: 47000, population: 1472654 },
    { borough: "Staten Island", condition: "Hypertension", rate: 26.4, cases: 13000, population: 495747 },
  ]

  // Simulate map initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const displayData = healthData && healthData.length > 0 ? healthData : DEFAULT_HEALTH_DATA

  // Calculate data points for display
  const getDataPointCounts = () => {
    const healthPoints = displayData.length
    const environmentalPoints = filters.environmental
      ? Object.values(filters.environmental).filter(Boolean).length * 5 // 5 boroughs
      : 0
    const activeLayerCount = activeLayer === "health" ? healthPoints : environmentalPoints

    return {
      healthPoints,
      environmentalPoints,
      activeLayerCount,
      totalPoints: healthPoints + environmentalPoints,
    }
  }

  const dataPoints = getDataPointCounts()

  // Generate borough visualization data with real health data
  const getBoroughVisualizationData = () => {
    const boroughs = [
      { name: "Manhattan", x: 45, y: 30, color: "#3B82F6" },
      { name: "Brooklyn", x: 55, y: 60, color: "#10B981" },
      { name: "Queens", x: 70, y: 40, color: "#F59E0B" },
      { name: "Bronx", x: 50, y: 15, color: "#EF4444" },
      { name: "Staten Island", x: 25, y: 75, color: "#8B5CF6" },
    ]

    return boroughs.map((borough) => {
      const boroughHealthData = displayData.filter((item) => item.borough === borough.name)
      const avgRate =
        boroughHealthData.length > 0
          ? boroughHealthData.reduce((sum, item) => sum + item.rate, 0) / boroughHealthData.length
          : 0

      // Calculate environmental factors for this borough
      const envFactors = filters.environmental ? Object.values(filters.environmental).filter(Boolean).length : 0

      return {
        ...borough,
        dataPoints: boroughHealthData.length,
        envFactors: envFactors,
        avgRate: avgRate.toFixed(1),
        riskLevel: avgRate > 25 ? "High" : avgRate > 15 ? "Moderate" : "Low",
        totalFactors: boroughHealthData.length + envFactors,
      }
    })
  }

  const boroughVisData = getBoroughVisualizationData()

  const handleBoroughClick = (boroughName: string) => {
    setSelectedBorough(boroughName)
    // Update filters to focus on selected borough
    const newFilters = {
      ...filters,
      geographic: {
        ...filters.geographic,
        boroughs: [boroughName],
      },
    }
    onFiltersChange(newFilters)
  }

  const resetMapView = () => {
    setSelectedBorough(null)
    const newFilters = {
      ...filters,
      geographic: {
        ...filters.geographic,
        boroughs: [],
      },
    }
    onFiltersChange(newFilters)
  }

  const hasData = dataPoints.totalPoints > 0

  // Get color intensity based on data
  const getBoroughColor = (borough: any) => {
    if (activeLayer === "health") {
      if (borough.dataPoints === 0) return "#E5E7EB"
      const intensity = Math.min(borough.avgRate / 30, 1) // Normalize to 0-1
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})` // Red with varying opacity
    } else {
      if (borough.envFactors === 0) return "#E5E7EB"
      const intensity = Math.min(borough.envFactors / 5, 1)
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.5})` // Green with varying opacity
    }
  }

  const getDisplayValue = (borough: any) => {
    if (activeLayer === "health") {
      return borough.dataPoints > 0 ? borough.avgRate + "%" : "No Data"
    } else {
      return borough.envFactors > 0 ? borough.envFactors.toString() : "0"
    }
  }

  return (
    <div className="space-y-6">
      {/* Map Controls and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Data Points</p>
                <p className="text-2xl font-bold text-red-600">{dataPoints.healthPoints}</p>
              </div>
              <Activity className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Environmental Points</p>
                <p className="text-2xl font-bold text-green-600">{dataPoints.environmentalPoints}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Layer</p>
                <p className="text-2xl font-bold text-purple-600 capitalize">{activeLayer}</p>
              </div>
              <Layers className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected Area</p>
                <p className="text-lg font-bold text-blue-600">{selectedBorough || "All NYC"}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layer Toggle */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={activeLayer === "health" ? "default" : "outline"}
          onClick={() => setActiveLayer("health")}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Health Data ({dataPoints.healthPoints})
        </Button>
        <Button
          variant={activeLayer === "environmental" ? "default" : "outline"}
          onClick={() => setActiveLayer("environmental")}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Environmental ({dataPoints.environmentalPoints})
        </Button>
      </div>

      {/* Main Map Interface */}
      <Card className="h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Interactive NYC Health Map
              </CardTitle>
              <CardDescription>
                {activeLayer === "health"
                  ? "Health conditions across NYC boroughs"
                  : "Environmental factors across NYC boroughs"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetMapView}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset View
              </Button>
              <Button variant="outline" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-full p-0">
          <div className="relative h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
            {/* Map Loading State */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading interactive map...</p>
                </div>
              </div>
            )}

            {/* Interactive NYC Borough Map */}
            <div className="relative w-full h-full p-8">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Borough shapes with real data */}
                {boroughVisData.map((borough, index) => {
                  const isSelected = selectedBorough === borough.name
                  const hasDataPoints = activeLayer === "health" ? borough.dataPoints > 0 : borough.envFactors > 0
                  const radius = hasDataPoints
                    ? Math.max(8, (activeLayer === "health" ? borough.dataPoints : borough.envFactors) * 3)
                    : 6

                  return (
                    <g key={borough.name}>
                      {/* Borough area */}
                      <circle
                        cx={borough.x}
                        cy={borough.y}
                        r={radius}
                        fill={getBoroughColor(borough)}
                        stroke={isSelected ? "#1F2937" : hasDataPoints ? borough.color : "#9CA3AF"}
                        strokeWidth={isSelected ? 3 : hasDataPoints ? 2 : 1}
                        className="cursor-pointer hover:stroke-width-3 transition-all duration-200"
                        onClick={() => handleBoroughClick(borough.name)}
                      />

                      {/* Borough label */}
                      <text
                        x={borough.x}
                        y={borough.y + radius + 8}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 pointer-events-none"
                      >
                        {borough.name}
                      </text>

                      {/* Data value indicator */}
                      {hasDataPoints && (
                        <text
                          x={borough.x}
                          y={borough.y + 2}
                          textAnchor="middle"
                          className="text-xs font-bold fill-white pointer-events-none"
                        >
                          {getDisplayValue(borough)}
                        </text>
                      )}

                      {/* Risk level indicator */}
                      {activeLayer === "health" && borough.dataPoints > 0 && (
                        <text
                          x={borough.x}
                          y={borough.y - radius - 2}
                          textAnchor="middle"
                          className={`text-xs font-bold pointer-events-none ${
                            borough.riskLevel === "High"
                              ? "fill-red-600"
                              : borough.riskLevel === "Moderate"
                                ? "fill-orange-600"
                                : "fill-green-600"
                          }`}
                        >
                          {borough.riskLevel}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Legend</h4>
                <div className="space-y-2 text-sm">
                  {activeLayer === "health" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full opacity-80"></div>
                        <span>Health Data ({dataPoints.healthPoints})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="text-xs">High Risk (25%+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span className="text-xs">Moderate Risk (15-25%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-xs">Low Risk (&lt;15%)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full opacity-60"></div>
                        <span>Environmental ({dataPoints.environmentalPoints})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-700 rounded-full"></div>
                        <span className="text-xs">Multiple factors</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs">Single factor</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <span>No Data</span>
                  </div>
                </div>
              </div>

              {/* Data Info Panel */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
                <h4 className="font-semibold text-gray-800 mb-2">Data Points</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Total:</span> {dataPoints.totalPoints}
                  </p>
                  <p>
                    <span className="font-medium">Health:</span> {dataPoints.healthPoints} conditions
                  </p>
                  <p>
                    <span className="font-medium">Environmental:</span> {dataPoints.environmentalPoints} factors
                  </p>
                  <p>
                    <span className="font-medium">Active Layer:</span> {activeLayer}
                  </p>
                  {selectedBorough && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="font-medium text-blue-800">Selected: {selectedBorough}</p>
                      {(() => {
                        const borough = boroughVisData.find((b) => b.name === selectedBorough)
                        return borough ? (
                          <div className="text-xs text-gray-600">
                            <p>Health: {borough.dataPoints} conditions</p>
                            <p>Environmental: {borough.envFactors} factors</p>
                            {borough.dataPoints > 0 && <p>Avg Rate: {borough.avgRate}%</p>}
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borough Details */}
      {selectedBorough && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedBorough} Details
            </CardTitle>
            <CardDescription>Health and environmental data for {selectedBorough}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const boroughData = boroughVisData.find((b) => b.name === selectedBorough)
                const boroughHealthData = displayData.filter((item) => item.borough === selectedBorough)

                return (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Health Data</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{boroughData?.dataPoints || 0}</div>
                      <div className="text-sm text-blue-700">conditions tracked</div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Average Rate</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">{boroughData?.avgRate || "0.0"}%</div>
                      <div className="text-sm text-orange-700">prevalence rate</div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Risk Level</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{boroughData?.riskLevel || "Low"}</div>
                      <div className="text-sm text-purple-700">assessment</div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Detailed Health Conditions */}
            {displayData.filter((item) => item.borough === selectedBorough).length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Health Conditions in {selectedBorough}</h4>
                <div className="space-y-2">
                  {displayData
                    .filter((item) => item.borough === selectedBorough)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{item.condition}</span>
                          <p className="text-sm text-gray-600">{item.cases?.toLocaleString()} estimated cases</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-red-600">{item.rate}%</span>
                          <p className="text-xs text-gray-500">prevalence</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Environmental Factors */}
            {filters.environmental && Object.values(filters.environmental).some(Boolean) && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Environmental Factors in {selectedBorough}</h4>
                <div className="space-y-2">
                  {Object.entries(filters.environmental)
                    .filter(([_, value]) => value)
                    .map(([key, _], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <span className="font-medium">
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <p className="text-sm text-gray-600">Environmental factor being monitored</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-green-600">Active</span>
                          <p className="text-xs text-gray-500">monitoring</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800 mb-1">How to Use the Interactive Map</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click on any borough circle to see detailed health data for that area</li>
                <li>• Circle size and color intensity indicate the amount and severity of data</li>
                <li>• Toggle between Health and Environmental layers using the buttons above</li>
                <li>• Use the Reset View button to return to the full NYC view</li>
                <li>
                  • Select different health conditions or environmental factors using the left panel to update the map
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
