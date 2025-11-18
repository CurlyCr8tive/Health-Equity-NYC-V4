"use client"

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapLeafletProps {
  healthData: any[]
  activeLayer: string
  selectedBorough: string | null
  onBoroughClick: (borough: string) => void
}

const BOROUGH_BOUNDS = {
  Manhattan: [[40.7614, -74.0055], [40.7031, -73.9352]],
  Brooklyn: [[40.6890, -74.0211], [40.5504, -73.8676]],
  Queens: [[40.8280, -73.7282], [40.5795, -73.7004]],
  Bronx: [[40.9289, -73.7434], [40.7847, -73.8247]],
  'Staten Island': [[40.6461, -74.2592], [40.5093, -74.0466]],
}

const markerIcons = {
  health: {
    high: L.icon({
      iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23DC2626"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
    moderate: L.icon({
      iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23F59E0B"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
    low: L.icon({
      iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310B981"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  },
  environmental: {
    default: L.icon({
      iconUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2334D399"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3C/svg%3E',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    }),
  },
}

export default function MapLeaflet({ healthData, activeLayer, selectedBorough, onBoroughClick }: MapLeafletProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markersGroup = useRef<L.FeatureGroup | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map centered on NYC
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([40.7128, -74.0060], 11)

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)

      // Create markers group
      markersGroup.current = L.featureGroup().addTo(map.current)
    }

    // Clear existing markers
    if (markersGroup.current) {
      markersGroup.current.clearLayers()
    }

    // Add markers based on active layer
    if (activeLayer === 'health' && healthData.length > 0) {
      healthData.forEach((data) => {
        if (data.lat && data.lng) {
          const riskLevel = data.rate > 25 ? 'high' : data.rate > 15 ? 'moderate' : 'low'
          const icon = markerIcons.health[riskLevel as keyof typeof markerIcons.health]

          const marker = L.marker([data.lat, data.lng], { icon }).addTo(markersGroup.current!)
          marker.bindPopup(`
            <div class="font-semibold">${data.borough}</div>
            <div class="text-sm">${data.condition}</div>
            <div class="text-sm font-bold text-red-600">${data.rate}% affected</div>
            <div class="text-xs text-gray-600">${data.cases?.toLocaleString()} cases</div>
          `)
        }
      })
    }

    // Add borough boundaries if health data exists
    if (activeLayer === 'health') {
      Object.entries(BOROUGH_BOUNDS).forEach(([borough, bounds]) => {
        const isSelected = selectedBorough === borough
        const rectangle = L.rectangle(bounds as L.LatLngBoundsExpression, {
          color: isSelected ? '#1F2937' : '#3B82F6',
          weight: isSelected ? 3 : 1,
          opacity: isSelected ? 0.8 : 0.3,
          fillOpacity: isSelected ? 0.1 : 0.05,
          fillColor: '#3B82F6',
        }).addTo(markersGroup.current!)

        rectangle.on('click', () => onBoroughClick(borough))
      })
    }
  }, [healthData, activeLayer, selectedBorough, onBoroughClick])

  return <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
}
