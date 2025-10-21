"use client"

import { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, MapPin } from "lucide-react"

interface MapComponentProps {
  filters?: any
  data?: any
  loading?: boolean
}

export default function MapComponent({ filters, data, loading }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    // Simulate map initialization
    const initializeMap = async () => {
      try {
        setMapError(null)

        // Simulate loading time
        await new Promise((resolve) => setTimeout(resolve, 1000))

        console.log("Map initialized with data:", data)
        console.log("Map filters:", filters)

        setIsMapReady(true)
      } catch (error) {
        console.error("Map initialization error:", error)
        setMapError("Failed to initialize map. Please try refreshing the page.")
      }
    }

    initializeMap()
  }, [data, filters])

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h4 className="font-semibold text-gray-700">Loading Interactive Map...</h4>
          <p className="text-sm text-gray-500 mt-2">Preparing health and environmental data</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <Alert className="h-96 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <AlertDescription className="text-lg font-medium mb-2">Map Unavailable</AlertDescription>
          <AlertDescription>{mapError}</AlertDescription>
        </div>
      </Alert>
    )
  }

  if (!isMapReady) {
    return (
      <div className="h-96 bg-gray-50 rounded-lg border flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <h4 className="font-semibold text-gray-700">Initializing Map...</h4>
          <p className="text-sm text-gray-500 mt-2">Setting up interactive visualization</p>
        </div>
      </div>
    )
  }

  // Mock map display with data points
  const getDataSummary = () => {
    if (!data) return { health: 0, environmental: 0, total: 0 }

    const healthPoints = data.health?.length || 0
    const environmentalPoints = Object.values(data).reduce((sum: number, points: any) => {
      return sum + (Array.isArray(points) && points !== data.health ? points.length : 0)
    }, 0)

    return {
      health: healthPoints,
      environmental: environmentalPoints,
      total: healthPoints + environmentalPoints,
    }
  }

  const summary = getDataSummary()

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border relative overflow-hidden"
      >
        {/* NYC Borough Representation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-80 h-64">
            {/* Manhattan */}
            <div className="absolute top-8 left-32 w-8 h-20 bg-blue-200 rounded transform rotate-12 flex items-center justify-center text-xs font-medium">
              Manhattan
            </div>

            {/* Brooklyn */}
            <div className="absolute bottom-12 left-28 w-16 h-12 bg-green-200 rounded flex items-center justify-center text-xs font-medium">
              Brooklyn
            </div>

            {/* Queens */}
            <div className="absolute top-16 right-16 w-20 h-16 bg-yellow-200 rounded flex items-center justify-center text-xs font-medium">
              Queens
            </div>

            {/* Bronx */}
            <div className="absolute top-4 left-24 w-12 h-12 bg-purple-200 rounded flex items-center justify-center text-xs font-medium">
              Bronx
            </div>

            {/* Staten Island */}
            <div className="absolute bottom-4 left-8 w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-xs font-medium">
              SI
            </div>

            {/* Data Points Overlay */}
            {summary.total > 0 && (
              <>
                {/* Health Data Points */}
                {Array.from({ length: Math.min(summary.health, 10) }).map((_, i) => (
                  <div
                    key={`health-${i}`}
                    className="absolute w-3 h-3 bg-red-500 rounded-full animate-pulse"
                    style={{
                      top: `${20 + ((i * 8) % 60)}%`,
                      left: `${30 + ((i * 12) % 40)}%`,
                    }}
                    title="Health Data Point"
                  />
                ))}

                {/* Environmental Data Points */}
                {Array.from({ length: Math.min(summary.environmental, 8) }).map((_, i) => (
                  <div
                    key={`env-${i}`}
                    className="absolute w-3 h-3 bg-green-500 rounded-full animate-pulse"
                    style={{
                      top: `${25 + ((i * 10) % 50)}%`,
                      left: `${45 + ((i * 15) % 35)}%`,
                    }}
                    title="Environmental Data Point"
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 text-xs">
          <div className="font-semibold mb-1">Interactive Map</div>
          <div className="text-gray-600">NYC Health & Environment</div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Health Data ({summary.health})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Environmental ({summary.environmental})</span>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-1">Data Points</div>
          <div>Total: {summary.total}</div>
          <div className="text-gray-600">
            {filters?.healthConditions?.length || 0} conditions,{" "}
            {Object.values(filters?.environmental || {}).filter(Boolean).length} factors
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg">
          <button className="block w-8 h-8 text-center border-b hover:bg-gray-50">+</button>
          <button className="block w-8 h-8 text-center hover:bg-gray-50">-</button>
        </div>
      </div>

      {/* Map Instructions */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        <MapPin className="h-4 w-4 inline mr-1" />
        Interactive map showing {summary.total} data points across NYC boroughs
        {summary.total === 0 && " - Select filters to see data visualization"}
      </div>
    </div>
  )
}
