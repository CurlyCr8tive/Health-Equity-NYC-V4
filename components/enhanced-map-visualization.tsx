"use client"

import { useEffect, useRef } from "react"
import type { HealthData, BoroughData } from "@/types"
import L from "leaflet"

// Leaflet pane-position safety helper (identical to map-component)
const ensurePanePos = (mapInst: any) => {
  const pane = mapInst.getPane("mapPane") ?? (mapInst as any)._mapPane
  if (pane && (pane as any)._leaflet_pos == null) {
    ;(pane as any)._leaflet_pos = (window as any).L.point(0, 0)
    mapInst.invalidateSize()
  }
}

// Official NYC boroughs with precise coordinates
const NYC_BOROUGHS: BoroughData[] = [
  { name: "Manhattan", population: 1694251, coordinates: [40.7831, -73.9712] },
  { name: "Brooklyn", population: 2736074, coordinates: [40.6782, -73.9442] },
  { name: "Queens", population: 2405464, coordinates: [40.7282, -73.7949] },
  { name: "Bronx", population: 1472654, coordinates: [40.8448, -73.8648] },
  { name: "Staten Island", population: 495747, coordinates: [40.5795, -74.1502] },
]

interface EnhancedMapVisualizationProps {
  data?: HealthData[]
  boroughData?: BoroughData[]
  overlays?: Record<string, boolean>
  environmentalData?: any[]
  selectedHealthConditions?: string[]
  selectedEnvironmentalFactors?: string[]
  filtersApplied?: boolean
  filters?: any
  isLoading?: boolean
}

export default function EnhancedMapVisualization({
  data = [],
  boroughData = NYC_BOROUGHS,
  overlays = {},
  environmentalData = [],
  selectedHealthConditions = [],
  selectedEnvironmentalFactors = [],
  filtersApplied = false,
  filters,
  isLoading = false,
}: EnhancedMapVisualizationProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)

  // Filter data to only include NYC boroughs
  const filteredData = data.filter((item) => {
    const validBoroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
    return validBoroughs.includes(item.borough)
  })

  // Ensure borough data only includes NYC boroughs
  const validBoroughData = boroughData.filter((borough) => {
    const validBoroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
    return validBoroughs.includes(borough.name)
  })

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    async function initMap() {
      // -------------------------------------------------------------------
      // SAFETY – ensure the DOM node has no lingering _leaflet_id reference.
      // When Leaflet sees this property it thinks the node already hosts a
      // map and will throw “Map container not found” if we try to reuse it.
      // -------------------------------------------------------------------
      if ((mapRef.current as any)?._leaflet_id) {
        delete (mapRef.current as any)._leaflet_id
        // Remove any leftover markup so we start from a clean slate.
        mapRef.current!.innerHTML = ""
      }

      // If we already have a map instance for this component, do not create
      // another one – just bail out. Subsequent effects can update layers.
      if (mapInstanceRef.current) {
        return
      }

      try {
        // Load Leaflet CSS exactly once per page
        if (!document.querySelector("link[data-leaflet]")) {
          const link = document.createElement("link")
          link.setAttribute("data-leaflet", "true")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)
        }

        // Create the map centered on NYC
        const map = L.map(mapRef.current!).setView([40.7128, -74.006], 10)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        if (!filtersApplied) {
          // Show top 4 conditions across NYC boroughs only
          const topConditions = getTopConditions(filteredData, 4)

          validBoroughData.forEach((borough) => {
            topConditions.forEach((condition, index) => {
              const conditionData = filteredData.filter(
                (d) => d.borough === borough.name && d.condition === condition.condition,
              )
              if (!conditionData.length) return

              const avgRate = conditionData.reduce((sum, d) => sum + d.rate, 0) / conditionData.length

              // Color coding based on severity
              let colour = "#22c55e"
              let opacity = 0.2
              if (avgRate >= 80) {
                colour = "#ef4444"
                opacity = 0.8
              } else if (avgRate >= 60) {
                colour = "#f97316"
                opacity = 0.6
              } else if (avgRate >= 40) {
                colour = "#eab308"
                opacity = 0.4
              }

              L.circle(borough.coordinates as any, {
                color: colour,
                fillColor: colour,
                fillOpacity: opacity,
                radius: 800 + avgRate * 20,
              })
                .addTo(map)
                .bindPopup(
                  `
                <b>${borough.name}</b><br />
                <strong>${condition.condition}</strong><br />
                Rate: ${avgRate.toFixed(1)}%<br />
                Severity: ${avgRate >= 80 ? "Severe" : avgRate >= 60 ? "High" : avgRate >= 40 ? "Medium" : "Low"}<br />
                <small>Top ${index + 1} condition citywide</small>
              `,
                )
            })
          })
        } else {
          // Filter-specific overlays for NYC boroughs only

          // HEALTH CONDITIONS (Squares)
          selectedHealthConditions.forEach((condition, idx) => {
            const colour = idx === 0 ? "#ef4444" : "#22c55e"
            const dataset = filteredData.filter((d) => d.condition === condition)

            validBoroughData.forEach((borough) => {
              const slice = dataset.filter((d) => d.borough === borough.name)
              if (!slice.length) return

              const avgRate = slice.reduce((s, d) => s + d.rate, 0) / slice.length
              const opacity = Math.min(avgRate / 100, 0.8)

              const squareIcon = L.divIcon({
                className: "custom-square-marker",
                html: `<div style="
                      width: 20px;
                      height: 20px;
                      background:${colour};
                      opacity:${opacity};
                      border: 2px solid ${colour};
                      transform: rotate(45deg);
                    "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })

              L.marker(borough.coordinates as any, { icon: squareIcon })
                .addTo(map)
                .bindPopup(
                  `<b>${borough.name}</b><br />
                   <strong>${condition}</strong><br />
                   Rate: ${avgRate.toFixed(1)}%`,
                )
            })
          })

          // ENVIRONMENTAL FACTORS (Circles) - filtered to NYC boroughs
          selectedEnvironmentalFactors.forEach((factor, idx) => {
            const colour = idx === 0 ? "#eab308" : "#3b82f6"
            const points = environmentalData.filter((p) => {
              // Ensure environmental data is also filtered to NYC boroughs
              const validBoroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
              return (p.type === factor || p.name?.includes(factor)) && validBoroughs.includes(p.borough)
            })

            points.forEach((pt: any) => {
              if (!Array.isArray(pt.coordinates)) return
              const severity = pt.severity ?? Math.random() * 100

              L.circle(pt.coordinates as any, {
                color: colour,
                fillColor: colour,
                fillOpacity: Math.min(severity / 100, 0.8),
                radius: 500,
              })
                .addTo(map)
                .bindPopup(
                  `<b>${pt.name || factor}</b><br />Borough: ${pt.borough}<br />Severity: ${severity.toFixed(0)}`,
                )
            })
          })
        }

        mapInstanceRef.current = map

        // first run once the tiles are ready
        map.whenReady(() => ensurePanePos(map))

        // then keep it safe for all user interactions
        map.on("zoomstart", () => ensurePanePos(map))
        map.on("movestart", () => ensurePanePos(map))

        // -------------------------------------------------------------------------
        // Prevent “_leaflet_pos undefined” zoom errors exactly as in map-component
        // -------------------------------------------------------------------------
        map.whenReady(() => {
          const pane = map.getPane("mapPane") ?? (map as any)._mapPane
          if (pane && (pane as any)._leaflet_pos == null) {
            ;(pane as any)._leaflet_pos = L.point(0, 0)
          }
          map.invalidateSize()
        })
      } catch (err) {
        console.error("Error initializing enhanced map:", err)
      }
    }

    initMap()
  }, [])

  // ---------------------------
  // Update layers/markers when data changes
  // ---------------------------
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear previous dynamic layers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer.options?.interactive) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Re-add circles / markers using the existing helper logic
    if (!filtersApplied) {
      const topConditions = getTopConditions(filteredData, 4)

      validBoroughData.forEach((borough) => {
        topConditions.forEach((condition, index) => {
          const conditionData = filteredData.filter(
            (d) => d.borough === borough.name && d.condition === condition.condition,
          )
          if (!conditionData.length) return

          const avgRate = conditionData.reduce((sum, d) => sum + d.rate, 0) / conditionData.length

          // Color coding based on severity
          let colour = "#22c55e"
          let opacity = 0.2
          if (avgRate >= 80) {
            colour = "#ef4444"
            opacity = 0.8
          } else if (avgRate >= 60) {
            colour = "#f97316"
            opacity = 0.6
          } else if (avgRate >= 40) {
            colour = "#eab308"
            opacity = 0.4
          }

          L.circle(borough.coordinates as any, {
            color: colour,
            fillColor: colour,
            fillOpacity: opacity,
            radius: 800 + avgRate * 20,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `
            <b>${borough.name}</b><br />
            <strong>${condition.condition}</strong><br />
            Rate: ${avgRate.toFixed(1)}%<br />
            Severity: ${avgRate >= 80 ? "Severe" : avgRate >= 60 ? "High" : avgRate >= 40 ? "Medium" : "Low"}<br />
            <small>Top ${index + 1} condition citywide</small>
          `,
            )
        })
      })
    } else {
      // Filter-specific overlays for NYC boroughs only

      // HEALTH CONDITIONS (Squares)
      selectedHealthConditions.forEach((condition, idx) => {
        const colour = idx === 0 ? "#ef4444" : "#22c55e"
        const dataset = filteredData.filter((d) => d.condition === condition)

        validBoroughData.forEach((borough) => {
          const slice = dataset.filter((d) => d.borough === borough.name)
          if (!slice.length) return

          const avgRate = slice.reduce((s, d) => s + d.rate, 0) / slice.length
          const opacity = Math.min(avgRate / 100, 0.8)

          const squareIcon = L.divIcon({
            className: "custom-square-marker",
            html: `<div style="
                  width: 20px;
                  height: 20px;
                  background:${colour};
                  opacity:${opacity};
                  border: 2px solid ${colour};
                  transform: rotate(45deg);
                "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          L.marker(borough.coordinates as any, { icon: squareIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `<b>${borough.name}</b><br />
               <strong>${condition}</strong><br />
               Rate: ${avgRate.toFixed(1)}%`,
            )
        })
      })

      // ENVIRONMENTAL FACTORS (Circles) - filtered to NYC boroughs
      selectedEnvironmentalFactors.forEach((factor, idx) => {
        const colour = idx === 0 ? "#eab308" : "#3b82f6"
        const points = environmentalData.filter((p) => {
          // Ensure environmental data is also filtered to NYC boroughs
          const validBoroughs = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
          return (p.type === factor || p.name?.includes(factor)) && validBoroughs.includes(p.borough)
        })

        points.forEach((pt: any) => {
          if (!Array.isArray(pt.coordinates)) return
          const severity = pt.severity ?? Math.random() * 100

          L.circle(pt.coordinates as any, {
            color: colour,
            fillColor: colour,
            fillOpacity: Math.min(severity / 100, 0.8),
            radius: 500,
          })
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>${pt.name || factor}</b><br />Borough: ${pt.borough}<br />Severity: ${severity.toFixed(0)}`)
        })
      })
    }
  }, [filteredData, validBoroughData, selectedHealthConditions, selectedEnvironmentalFactors, filtersApplied])

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        aria-label="Enhanced NYC Health Equity Map - 5 Boroughs Only"
      />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-md text-xs max-w-xs">
        <h4 className="font-bold mb-2">NYC Health Equity Map</h4>
        <div className="text-xs text-gray-600 mb-2">
          Displaying data for: Manhattan, Brooklyn, Queens, Bronx, Staten Island
        </div>

        {!filtersApplied ? (
          <div>
            <div className="font-semibold mb-1">Top 4 Health Conditions</div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-red-500 opacity-80 mr-2 rounded"></div>
              <span>🔴 Severe (80%+)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-orange-500 opacity-60 mr-2 rounded"></div>
              <span>🟠 High (60-79%)</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-yellow-500 opacity-40 mr-2 rounded"></div>
              <span>🟡 Medium (40-59%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 opacity-20 mr-2 rounded"></div>
              <span>🟢 Low (0-39%)</span>
            </div>
          </div>
        ) : (
          <div>
            {selectedHealthConditions.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold mb-1">Health Conditions</div>
                {selectedHealthConditions.map((condition, index) => (
                  <div key={condition} className="flex items-center mb-1">
                    <div
                      className={`w-3 h-3 mr-2 transform rotate-45 ${index === 0 ? "bg-red-500" : "bg-green-500"}`}
                    ></div>
                    <span>
                      {index === 0 ? "🔴" : "🟩"} {condition}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selectedEnvironmentalFactors.length > 0 && (
              <div>
                <div className="font-semibold mb-1">Environmental Factors</div>
                {selectedEnvironmentalFactors.map((factor, index) => (
                  <div key={factor} className="flex items-center mb-1">
                    <div className={`w-3 h-3 mr-2 rounded-full ${index === 0 ? "bg-yellow-500" : "bg-blue-500"}`}></div>
                    <span>
                      {index === 0 ? "🟡" : "🔵"} {factor}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2 border-t pt-2">Data Count: {filteredData.length} records</div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Loading NYC health data...</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get top conditions from NYC data only
function getTopConditions(records: HealthData[] = [], limit = 4) {
  const stats: Record<string, { total: number; count: number }> = {}

  records.forEach((r) => {
    if (!r.condition) return
    if (!stats[r.condition]) stats[r.condition] = { total: 0, count: 0 }
    stats[r.condition].total += r.rate ?? 0
    stats[r.condition].count += 1
  })

  return Object.entries(stats)
    .map(([condition, { total, count }]) => ({
      condition,
      avgRate: count ? total / count : 0,
    }))
    .sort((a, b) => b.avgRate - a.avgRate)
    .slice(0, limit)
}
