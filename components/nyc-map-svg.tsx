"use client"

import { useState } from "react"
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface NYCMapSVGProps {
  healthData: any[]
  activeLayer: string
  selectedBorough?: string
  onBoroughClick?: (borough: string) => void
}

export default function NYCMapSVG({
  healthData,
  activeLayer,
  selectedBorough,
  onBoroughClick,
}: NYCMapSVGProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  // NYC Borough coordinates and paths
  const boroughs = [
    {
      name: "Manhattan",
      center: [40.7831, -73.9712],
      color: "#ef4444",
      path: "M 400 150 L 420 120 L 430 200 L 410 250 Z",
    },
    {
      name: "Bronx",
      center: [40.8448, -73.8648],
      color: "#f97316",
      path: "M 420 100 L 460 90 L 470 180 L 430 200 Z",
    },
    {
      name: "Brooklyn",
      center: [40.6782, -73.9442],
      color: "#eab308",
      path: "M 400 250 L 470 260 L 480 380 L 410 370 Z",
    },
    {
      name: "Queens",
      center: [40.7282, -73.7949],
      color: "#22c55e",
      path: "M 470 180 L 550 160 L 580 340 L 480 380 Z",
    },
    {
      name: "Staten Island",
      center: [40.5835, -74.1502],
      color: "#06b6d4",
      path: "M 320 380 L 400 370 L 410 450 L 330 460 Z",
    },
  ]

  // Calculate data point positions based on borough centers
  const getDataPoints = () => {
    if (!healthData || healthData.length === 0) return []

    return healthData.map((item, idx) => {
      const borough = boroughs.find((b) => b.name === item.borough)
      if (!borough) return null

      // Convert lat/lng to SVG coordinates (simplified projection)
      const [centerLat, centerLng] = borough.center
      const x = 400 + (centerLng + 73.9) * 50
      const y = 250 - (centerLat - 40.5) * 80

      const isSelected = selectedBorough === item.borough

      return {
        id: `${item.borough}-${idx}`,
        x,
        y,
        borough: item.borough,
        rate: item.rate,
        condition: item.condition,
        selected: isSelected,
        riskLevel: item.rate > 25 ? "high" : item.rate > 15 ? "medium" : "low",
      }
    })
  }

  const dataPoints = getDataPoints().filter(Boolean)

  const getRiskColor = (rate: number) => {
    if (rate > 25) return "#dc2626"
    if (rate > 15) return "#ea580c"
    return "#22c55e"
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Map Controls */}
      <div className="flex gap-2 p-4 border-b border-gray-200 bg-gray-50">
        <Button
          size="sm"
          variant={isZoomed ? "default" : "outline"}
          onClick={() => setIsZoomed(!isZoomed)}
          className="flex items-center gap-2"
        >
          {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          {isZoomed ? "Zoom Out" : "Zoom In"}
        </Button>
      </div>

      {/* SVG Map Container */}
      <div className="flex-1 bg-gradient-to-b from-blue-100 to-blue-50 overflow-auto flex items-center justify-center p-4">
        <svg
          viewBox="0 0 800 600"
          className={`transition-transform duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
          }}
        >
          {/* Water background */}
          <rect width="800" height="600" fill="#e0f2fe" />

          {/* NYC Borough Outlines and Labels */}
          {boroughs.map((borough) => {
            const isSelectedBorough = selectedBorough === borough.name
            return (
              <g key={borough.name} onClick={() => onBoroughClick?.(borough.name)}>
                {/* Borough area */}
                <path
                  d={borough.path}
                  fill={isSelectedBorough ? borough.color : "rgba(255,255,255,0.7)"}
                  stroke={borough.color}
                  strokeWidth="2"
                  opacity={isSelectedBorough ? 1 : 0.6}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelectedBorough) {
                      (e.target as SVGPathElement).style.opacity = "0.8"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelectedBorough) {
                      (e.target as SVGPathElement).style.opacity = "0.6"
                    }
                  }}
                />

                {/* Borough label */}
                <text
                  x={borough.center[1] + 73.5 * 50 + 50}
                  y={250 - (borough.center[0] - 40.5) * 80}
                  fontSize="14"
                  fontWeight="bold"
                  fill={isSelectedBorough ? "white" : "rgba(0,0,0,0.7)"}
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {borough.name}
                </text>
              </g>
            )
          })}

          {/* Data Point Markers */}
          {dataPoints.map((point) => {
            if (!point) return null

            const riskColor = getRiskColor(point.rate)
            const size = point.selected ? 40 : 30

            return (
              <g
                key={point.id}
                style={{
                  cursor: "pointer",
                  filter: point.selected ? "drop-shadow(0 0 8px rgba(0,0,0,0.4))" : "none",
                }}
              >
                {/* Data marker circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={size / 2}
                  fill={riskColor}
                  opacity={0.8}
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    const circle = e.currentTarget as SVGCircleElement
                    circle.setAttribute("r", String((size / 2) * 1.3))
                  }}
                  onMouseLeave={(e) => {
                    const circle = e.currentTarget as SVGCircleElement
                    circle.setAttribute("r", String(size / 2))
                  }}
                />

                {/* Rate label inside circle */}
                <text
                  x={point.x}
                  y={point.y}
                  fontSize="12"
                  fontWeight="bold"
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="central"
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {point.rate.toFixed(0)}%
                </text>

                {/* Condition tooltip on hover */}
                <title>
                  {point.borough}: {point.condition} ({point.rate}%)
                </title>
              </g>
            )
          })}

          {/* Legend */}
          <g>
            <rect x="10" y="10" width="180" height="120" fill="white" stroke="#ccc" rx="4" />
            <text x="20" y="30" fontSize="12" fontWeight="bold" fill="#333">
              Risk Levels
            </text>
            <circle cx="30" cy="50" r="6" fill="#dc2626" />
            <text x="45" y="55" fontSize="11" fill="#333">
              High Risk ({">"}25%)
            </text>
            <circle cx="30" cy="75" r="6" fill="#ea580c" />
            <text x="45" y="80" fontSize="11" fill="#333">
              Medium (15-25%)
            </text>
            <circle cx="30" cy="100" r="6" fill="#22c55e" />
            <text x="45" y="105" fontSize="11" fill="#333">
              Low ({"<"}15%)
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Borough Info */}
      {selectedBorough && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedBorough}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {dataPoints.filter((d) => d?.borough === selectedBorough).length} data point
                {dataPoints.filter((d) => d?.borough === selectedBorough).length !== 1 ? "s" : ""} showing for this
                borough
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onBoroughClick?.("")}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
