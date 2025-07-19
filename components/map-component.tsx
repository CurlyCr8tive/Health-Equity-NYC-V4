"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, AlertCircle, Layers, RotateCcw } from "lucide-react"
import type { FilterState } from "@/types"

const EMPTY_FILTERS: FilterState = {
  healthConditions: [],
  borough: "allBoroughs",
  zipCode: "",
  neighborhood: "",
  radius: "1",
  ageGroups: [],
  raceEthnicities: [],
  includeNeighborhood: false,
  environmentalFactors: [],
  overlays: {
    foodDeserts: false,
    snapAccess: false,
    greenSpace: false,
    airQuality: false,
    waterQuality: false,
    foodZones: false,
    healthcareAccess: false,
    transitAccess: false,
  },
}

interface MapComponentProps {
  filters?: FilterState
  data: any
  loading?: boolean
}

export default function MapComponent({ filters = EMPTY_FILTERS, data, loading }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        if (typeof window === "undefined") return

        // Check if Leaflet is already loaded
        if (window.L) {
          setLeafletLoaded(true)
          return
        }

        // Load Leaflet CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        cssLink.crossOrigin = ""
        document.head.appendChild(cssLink)

        // Load Leaflet JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        script.onload = () => {
          setLeafletLoaded(true)
        }

        script.onerror = () => {
          setMapError("Failed to load map library")
          setMapLoading(false)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Leaflet:", error)
        setMapError("Failed to initialize map")
        setMapLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

    const initializeMap = async () => {
      try {
        setMapLoading(true)
        setMapError(null)

        // Wait for container to be ready
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!mapRef.current) {
          throw new Error("Map container not found")
        }

        // Initialize map centered on NYC
        const map = window.L.map(mapRef.current, {
          center: [40.7128, -74.006], // NYC coordinates
          zoom: 11,
          zoomControl: false, // We'll add custom controls
        })

        // Add tile layer
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map)

        // Add custom zoom controls
        window.L.control
          .zoom({
            position: "topright",
          })
          .addTo(map)

        mapInstanceRef.current = map
        setMapLoading(false)

        // Add borough boundaries
        addBoroughBoundaries(map)

        console.log("Map initialized successfully")
      } catch (error) {
        console.error("Map initialization error:", error)
        setMapError(error instanceof Error ? error.message : "Failed to initialize map")
        setMapLoading(false)
      }
    }

    initializeMap()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded])

  // Update map data when filters or data change
  useEffect(() => {
    if (!mapInstanceRef.current || !data) return

    updateMapData(mapInstanceRef.current, data, filters)
  }, [data, filters])

  const addBoroughBoundaries = (map: any) => {
    // NYC Borough boundaries (simplified coordinates)
    const boroughBounds = {
      Manhattan: [
        [40.7831, -73.9712],
        [40.7489, -73.9441],
        [40.7589, -73.9441],
        [40.8176, -73.9482],
      ],
      Brooklyn: [
        [40.6782, -73.9442],
        [40.5795, -73.9442],
        [40.5795, -73.8333],
        [40.7282, -73.8333],
      ],
      Queens: [
        [40.7282, -73.7949],
        [40.6892, -73.7949],
        [40.6892, -73.7004],
        [40.7982, -73.7004],
      ],
      Bronx: [
        [40.8448, -73.8648],
        [40.7856, -73.8648],
        [40.7856, -73.7654],
        [40.9176, -73.7654],
      ],
      "Staten Island": [
        [40.5795, -74.1502],
        [40.4774, -74.1502],
        [40.4774, -74.0492],
        [40.6176, -74.0492],
      ],
    }

    Object.entries(boroughBounds).forEach(([borough, bounds]) => {
      const polygon = window.L.polygon(bounds, {
        color: getBoroughColor(borough),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.1,
      }).addTo(map)

      polygon.bindPopup(`<strong>${borough}</strong><br/>Click to filter by this borough`)

      polygon.on("click", () => {
        // This would trigger a filter update in the parent component
        console.log(`Borough clicked: ${borough}`)
      })
    })
  }

  const updateMapData = (map: any, mapData: any, currentFilters: FilterState) => {
    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Add health data markers
    if (mapData.health && Array.isArray(mapData.health)) {
      mapData.health.forEach((item: any) => {
        if (item.coordinates) {
          const [lat, lng] = item.coordinates
          const marker = window.L.marker([lat, lng], {
            icon: createCustomIcon("health", item.rate || 0),
          }).addTo(map)

          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${item.condition || "Health Data"}</h3>
              <p><strong>Borough:</strong> ${item.borough}</p>
              <p><strong>Rate:</strong> ${item.rate}%</p>
              <p><strong>Cases:</strong> ${item.cases?.toLocaleString()}</p>
              <p><strong>Year:</strong> ${item.year}</p>
            </div>
          `)
        }
      })
    }

    // Add environmental overlays based on filters
    if (currentFilters?.overlays?.airQuality && mapData.airQuality) {
      addEnvironmentalMarkers(map, mapData.airQuality, "airQuality")
    }

    if (currentFilters?.overlays?.foodDeserts && mapData.foodAccess) {
      addEnvironmentalMarkers(map, mapData.foodAccess, "foodAccess")
    }

    if (currentFilters?.overlays?.greenSpace && mapData.greenSpace) {
      addEnvironmentalMarkers(map, mapData.greenSpace, "greenSpace")
    }

    if (currentFilters?.overlays?.snapAccess && mapData.snapAccess) {
      addEnvironmentalMarkers(map, mapData.snapAccess, "snapAccess")
    }

    if (currentFilters?.overlays?.healthcareAccess && mapData.healthcareAccess) {
      addEnvironmentalMarkers(map, mapData.healthcareAccess, "healthcareAccess")
    }

    if (currentFilters?.overlays?.transitAccess && mapData.transitAccess) {
      addEnvironmentalMarkers(map, mapData.transitAccess, "transitAccess")
    }
  }

  const addEnvironmentalMarkers = (map: any, data: any[], type: string) => {
    if (!Array.isArray(data)) return

    data.forEach((item: any) => {
      if (item.coordinates) {
        const [lat, lng] = item.coordinates
        const marker = window.L.marker([lat, lng], {
          icon: createCustomIcon(type, item.value || item.score || 0),
        }).addTo(map)

        marker.bindPopup(createPopupContent(item, type))
      }
    })
  }

  const createCustomIcon = (type: string, value: number) => {
    const colors = {
      health: getHealthColor(value),
      airQuality: getAirQualityColor(value),
      foodAccess: "#10b981",
      greenSpace: "#22c55e",
      snapAccess: "#f59e0b",
      healthcareAccess: "#3b82f6",
      transitAccess: "#8b5cf6",
    }

    const color = colors[type as keyof typeof colors] || "#6b7280"

    return window.L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      className: "custom-marker",
    })
  }

  const createPopupContent = (item: any, type: string) => {
    const typeLabels = {
      health: "Health Data",
      airQuality: "Air Quality",
      foodAccess: "Food Access",
      greenSpace: "Green Space",
      snapAccess: "SNAP Access",
      healthcareAccess: "Healthcare Access",
      transitAccess: "Transit Access",
    }

    return `
      <div class="p-2 min-w-48">
        <h3 class="font-semibold text-sm mb-2">${typeLabels[type as keyof typeof typeLabels]}</h3>
        <p class="text-xs"><strong>Name:</strong> ${item.name || item.sampleSite || "N/A"}</p>
        <p class="text-xs"><strong>Borough:</strong> ${item.borough}</p>
        ${item.rate ? `<p class="text-xs"><strong>Rate:</strong> ${item.rate}%</p>` : ""}
        ${item.aqi ? `<p class="text-xs"><strong>AQI:</strong> ${item.aqi}</p>` : ""}
        ${item.score ? `<p class="text-xs"><strong>Score:</strong> ${item.score}</p>` : ""}
        ${item.address ? `<p class="text-xs"><strong>Address:</strong> ${item.address}</p>` : ""}
      </div>
    `
  }

  const getBoroughColor = (borough: string) => {
    const colors = {
      Manhattan: "#ef4444",
      Brooklyn: "#f97316",
      Queens: "#eab308",
      Bronx: "#22c55e",
      "Staten Island": "#3b82f6",
    }
    return colors[borough as keyof typeof colors] || "#6b7280"
  }

  const getHealthColor = (rate: number) => {
    if (rate >= 20) return "#ef4444" // red
    if (rate >= 10) return "#f97316" // orange
    return "#22c55e" // green
  }

  const getAirQualityColor = (aqi: number) => {
    if (aqi <= 50) return "#22c55e" // green
    if (aqi <= 100) return "#eab308" // yellow
    if (aqi <= 150) return "#f97316" // orange
    return "#ef4444" // red
  }

  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([40.7128, -74.006], 11)
    }
  }

  if (mapError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Map
          </CardTitle>
          <CardDescription>Geographic visualization of health and environmental data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Map unavailable: {mapError}. Please try refreshing the page.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactive Map
            </CardTitle>
            <CardDescription>Geographic visualization of health and environmental data</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetMapView}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset View
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {(mapLoading || loading) && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading map...</span>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-md z-10 max-w-48">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Legend
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>High Risk (≥20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium Risk (10-19%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Low Risk (&lt;10%)</span>
              </div>
            </div>
          </div>

          {/* Active Overlays */}
          {Object.entries(filters.overlays ?? {}).some(([_, active]) => active) && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md z-10">
              <h4 className="font-semibold text-sm mb-2">Active Overlays</h4>
              <div className="space-y-1">
                {Object.entries(filters.overlays ?? {})
                  .filter(([_, active]) => active)
                  .map(([overlay]) => (
                    <Badge key={overlay} variant="secondary" className="text-xs">
                      {overlay.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {/* Map Container */}
          <div ref={mapRef} className="w-full h-96 rounded-lg border" />
        </div>
      </CardContent>
    </Card>
  )
}
