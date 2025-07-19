"use client"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import type { HealthData, BoroughData } from "@/types"

// Dynamically import Leaflet with no SSR
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <h4 className="font-semibold text-gray-700">Loading Map...</h4>
        <Skeleton className="w-32 h-4 mt-2 mx-auto" />
      </div>
    </div>
  ),
})

interface MapDisplayProps {
  data?: HealthData[]
  boroughData?: BoroughData[]
  overlays?: Record<string, boolean>
}

export default function MapDisplay({ data = [], boroughData = [], overlays = {} }: MapDisplayProps) {
  // Provide default borough data if none provided
  const defaultBoroughData: BoroughData[] = [
    { name: "Manhattan", coordinates: [40.7831, -73.9712], rate: 12.5, population: 1694251 },
    { name: "Brooklyn", coordinates: [40.6782, -73.9442], rate: 15.2, population: 2736074 },
    { name: "Queens", coordinates: [40.7282, -73.7949], rate: 11.8, population: 2405464 },
    { name: "Bronx", coordinates: [40.8448, -73.8648], rate: 18.7, population: 1472654 },
    { name: "Staten Island", coordinates: [40.5795, -74.1502], rate: 9.3, population: 495747 },
  ]

  const safeData = Array.isArray(data) ? data : []
  const safeBoroughData = Array.isArray(boroughData) && boroughData.length > 0 ? boroughData : defaultBoroughData
  const safeOverlays = overlays || {}

  // Calculate summary stats for the map
  const stats = {
    totalDataPoints: safeData.length,
    avgRate:
      safeData.length > 0
        ? (safeData.reduce((sum, item) => sum + (item.rate || 0), 0) / safeData.length).toFixed(1)
        : "0",
    boroughsWithData: new Set(safeData.map((item) => item.borough)).size,
    activeOverlays: Object.values(safeOverlays).filter(Boolean).length,
  }

  // Error boundary for map rendering
  try {
    return (
      <div className="relative">
        {/* Map Container */}
        <MapComponent data={safeData} boroughData={safeBoroughData} overlays={safeOverlays} />

        {/* Map Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[400]">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>High Rate ({">"} 15%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
              <span>Medium Rate (5-15%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>Low Rate ({"<"} 5%)</span>
            </div>
          </div>
        </div>

        {/* Active Overlays Indicator */}
        {stats.activeOverlays > 0 && (
          <div className="absolute bottom-4 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium z-[400]">
            {stats.activeOverlays} overlay{stats.activeOverlays !== 1 ? "s" : ""} active
          </div>
        )}

        {/* Data Summary */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs z-[400]">
          <div className="font-semibold mb-1">Data Summary</div>
          <div>Points: {stats.totalDataPoints}</div>
          <div>Avg Rate: {stats.avgRate}%</div>
          <div>Boroughs: {stats.boroughsWithData}</div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Map rendering error:", error)
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Map temporarily unavailable. Please try refreshing the page.</AlertDescription>
      </Alert>
    )
  }
}
