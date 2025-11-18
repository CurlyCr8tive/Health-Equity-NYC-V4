'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Map, RotateCcw, Info, MapPin } from 'lucide-react'

interface MapDisplayProps {
  healthData: any[]
  boroughData: any[]
  filters: any
  onFiltersChange: (filters: any) => void
}

export default function MapDisplay({ healthData, boroughData, filters, onFiltersChange }: MapDisplayProps) {
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null)
  const [mapZoom, setMapZoom] = useState('all')

  const DEFAULT_HEALTH_DATA = [
    { borough: 'Manhattan', condition: 'Hypertension', rate: 22.8, cases: 38000, population: 1694251, lat: 40.7831, lng: -73.9712 },
    { borough: 'Brooklyn', condition: 'Hypertension', rate: 28.7, cases: 78000, population: 2736074, lat: 40.6501, lng: -73.9496 },
    { borough: 'Queens', condition: 'Hypertension', rate: 25.3, cases: 61000, population: 2405464, lat: 40.7282, lng: -73.7949 },
    { borough: 'Bronx', condition: 'Hypertension', rate: 32.1, cases: 47000, population: 1472654, lat: 40.8448, lng: -73.8648 },
    { borough: 'Staten Island', condition: 'Hypertension', rate: 26.4, cases: 13000, population: 495747, lat: 40.5835, lng: -74.1502 },
  ]

  const displayData = healthData && healthData.length > 0 ? healthData : DEFAULT_HEALTH_DATA

  const uniqueConditions = Array.from(new Set(displayData.map((d) => d.condition)))
  const uniqueBoroughs = Array.from(new Set(displayData.map((d) => d.borough)))

  const getRiskColor = (rate: number): string => {
    if (rate >= 30) return '#ef4444' // red-500
    if (rate >= 20) return '#f97316' // orange-400
    if (rate >= 10) return '#eab308' // yellow-400
    return '#22c55e' // green-400
  }

  const getRiskLevel = (rate: number): string => {
    if (rate >= 30) return 'High Risk'
    if (rate >= 20) return 'Moderate Risk'
    if (rate >= 10) return 'Low-Moderate Risk'
    return 'Low Risk'
  }

  const handleBoroughClick = (boroughName: string) => {
    setSelectedBorough(boroughName)
    setMapZoom(boroughName)
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
    setMapZoom('all')
    const newFilters = {
      ...filters,
      geographic: {
        ...filters.geographic,
        boroughs: [],
      },
    }
    onFiltersChange(newFilters)
  }

  const getBoroughBbox = (borough: string): string => {
    const bboxes: Record<string, string> = {
      Manhattan: '-73.97,40.70,-73.91,40.82',
      Brooklyn: '-74.05,40.57,-73.86,40.70',
      Queens: '-74.01,40.63,-73.70,40.80',
      Bronx: '-73.97,40.79,-73.83,40.91',
      'Staten Island': '-74.28,40.50,-74.05,40.65',
    }
    return bboxes[borough] || '-74.3,40.5,-73.7,40.95'
  }

  return (
    <div className='space-y-6'>
      {/* Map Container */}
      <Card className='h-[600px] relative overflow-hidden'>
        <CardHeader className='absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Map className='h-5 w-5' />
                Interactive NYC Health Map
              </CardTitle>
              <CardDescription>
                {mapZoom === 'all'
                  ? 'Click on a borough button below to zoom in and see detailed data.'
                  : `Showing ${selectedBorough} - Click 'Reset View' to see all boroughs.`}
              </CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={resetMapView}>
              <RotateCcw className='h-4 w-4 mr-2' />
              Reset View
            </Button>
          </div>
        </CardHeader>

        <CardContent className='h-full p-0 overflow-hidden rounded-b-lg pt-24 relative'>
          {/* Embedded OpenStreetMap */}
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapZoom !== 'all' ? getBoroughBbox(mapZoom) : '-74.3,40.5,-73.7,40.95'}&layer=mapnik`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0 0 8px 8px',
            }}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
          />

          <svg
            className='absolute inset-0 top-24 left-0 w-full h-[calc(100%-96px)]'
            style={{ pointerEvents: 'none', zIndex: 10 }}
          >
            {displayData.map((item, index) => {
              // Calculate SVG coordinates based on latitude/longitude
              // This is a simplified mapping - in production you'd use proper projection
              const svgX = ((item.lng + 74.3) / (73.7 + 74.3)) * 100
              const svgY = ((40.95 - item.lat) / (40.95 - 40.5)) * 100

              const circleRadius = 15 + (item.rate / 30) * 15 // Size based on rate
              const color = getRiskColor(item.rate)

              return (
                <g key={index}>
                  {/* Shadow circle */}
                  <circle cx={`${svgX}%`} cy={`${svgY}%`} r={circleRadius + 3} fill='rgba(0,0,0,0.2)' />

                  {/* Main data point circle */}
                  <circle cx={`${svgX}%`} cy={`${svgY}%`} r={circleRadius} fill={color} opacity={0.8} />

                  {/* Border circle */}
                  <circle cx={`${svgX}%`} cy={`${svgY}%`} r={circleRadius} fill='none' stroke='white' strokeWidth='2' />

                  {/* Label */}
                  <text
                    x={`${svgX}%`}
                    y={`${svgY}%`}
                    textAnchor='middle'
                    dominantBaseline='middle'
                    fontSize='12'
                    fontWeight='bold'
                    fill='white'
                    style={{ pointerEvents: 'none' }}
                  >
                    {item.rate.toFixed(0)}%
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend - Bottom Right */}
          <div className='absolute bottom-4 right-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-xs'>
            <div className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
              <Info className='h-4 w-4' />
              Health Data Legend
            </div>

            <div className='space-y-3'>
              {/* Risk Level Legend */}
              <div>
                <div className='text-xs font-medium text-gray-600 mb-2'>Risk Levels:</div>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-red-500 rounded-full'></div>
                    <span className='text-xs text-gray-700'>High Risk (30%+)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-orange-400 rounded-full'></div>
                    <span className='text-xs text-gray-700'>Moderate Risk (20-30%)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-yellow-400 rounded-full'></div>
                    <span className='text-xs text-gray-700'>Low-Moderate Risk (10-20%)</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='w-4 h-4 bg-green-400 rounded-full'></div>
                    <span className='text-xs text-gray-700'>Low Risk (&lt;10%)</span>
                  </div>
                </div>
              </div>

              {/* Conditions Being Tracked */}
              {uniqueConditions.length > 0 && (
                <div className='pt-3 border-t'>
                  <div className='text-xs font-medium text-gray-600 mb-2'>Conditions Tracked:</div>
                  <div className='space-y-1'>
                    {uniqueConditions.map((condition, idx) => (
                      <div key={idx} className='text-xs text-gray-700'>
                        • {condition}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters Info */}
              {filters.healthConditions && filters.healthConditions.length > 0 && (
                <div className='pt-3 border-t'>
                  <div className='text-xs font-medium text-gray-600 mb-2'>Active Filters:</div>
                  <div className='text-xs text-blue-600 font-medium'>{filters.healthConditions.join(', ')}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary Panel */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Total Data Points</p>
              <p className='text-3xl font-bold text-blue-600'>{displayData.length}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Health Conditions</p>
              <p className='text-3xl font-bold text-red-600'>{uniqueConditions.length}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Boroughs Covered</p>
              <p className='text-3xl font-bold text-green-600'>{uniqueBoroughs.length}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Average Rate</p>
              <p className='text-3xl font-bold text-purple-600'>
                {(displayData.reduce((sum, d) => sum + d.rate, 0) / displayData.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borough Data Cards - Interactive */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Health Data by Borough
          </CardTitle>
          <CardDescription>Click on a borough to zoom into the map and see detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-3'>
            {displayData.map((item, index) => (
              <Button
                key={index}
                variant={selectedBorough === item.borough ? 'default' : 'outline'}
                onClick={() => handleBoroughClick(item.borough)}
                className={`h-auto py-4 flex flex-col items-start text-left transition-all ${
                  selectedBorough === item.borough ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className='font-semibold text-base'>{item.borough}</div>
                <div className='text-xs font-medium mt-1' style={{ color: getRiskColor(item.rate) }}>
                  {getRiskLevel(item.rate)}
                </div>
                <div className='text-xs text-gray-600 mt-1'>{item.condition}</div>
                <div className='text-sm font-bold mt-2'>{item.rate.toFixed(1)}%</div>
                <div className='text-xs text-gray-500'>{item.cases.toLocaleString()} people</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Borough Information */}
      {selectedBorough && (
        <Card className='border-2 border-blue-300'>
          <CardHeader>
            <CardTitle className='text-blue-600'>{selectedBorough} - Detailed Health Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {displayData
                .filter((item) => item.borough === selectedBorough)
                .map((item, index) => (
                  <div
                    key={index}
                    className='p-4 border-l-4 rounded-lg bg-gray-50'
                    style={{ borderLeftColor: getRiskColor(item.rate) }}
                  >
                    <div className='font-semibold text-lg text-gray-900 mb-3'>{item.condition}</div>

                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Prevalence Rate:</span>
                        <span className='font-bold text-lg text-gray-900'>{item.rate.toFixed(1)}%</span>
                      </div>

                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Estimated Cases:</span>
                        <span className='font-semibold'>{item.cases.toLocaleString()}</span>
                      </div>

                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Borough Population:</span>
                        <span className='font-semibold'>{item.population.toLocaleString()}</span>
                      </div>

                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Risk Level:</span>
                        <span className='font-semibold' style={{ color: getRiskColor(item.rate) }}>
                          {getRiskLevel(item.rate)}
                        </span>
                      </div>

                      {/* Plain language interpretation */}
                      <div className='pt-3 border-t mt-3'>
                        <div className='text-xs font-medium text-gray-700 mb-1'>What This Means:</div>
                        <div className='text-xs text-gray-700'>
                          {item.rate >= 30
                            ? `About 3 out of every 10 people in ${selectedBorough} are affected by ${item.condition}.`
                            : item.rate >= 20
                              ? `About 2 out of every 10 people in ${selectedBorough} are affected by ${item.condition}.`
                              : `About 1 out of every 10 people in ${selectedBorough} is affected by ${item.condition}.`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Use Instructions */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-6'>
          <div className='flex items-start gap-4'>
            <Info className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
            <div>
              <h4 className='font-semibold text-gray-800 mb-2'>How to Use the Interactive Map</h4>
              <ul className='text-sm text-gray-700 space-y-1'>
                <li>
                  <strong>View Health Data:</strong> Colored circles on the map show health conditions by borough
                </li>
                <li>
                  <strong>Circle Size & Color:</strong> Larger circles = higher prevalence rates. Red = high risk,
                  orange = moderate, yellow = low-moderate, green = low
                </li>
                <li>
                  <strong>Click Borough Buttons:</strong> Select any borough to zoom in and see detailed data
                </li>
                <li>
                  <strong>See Active Filters:</strong> The legend shows which health conditions you're tracking
                </li>
                <li>
                  <strong>Zoom & Pan:</strong> Use your mouse to zoom and pan the map to explore different areas
                </li>
                <li>
                  <strong>Reset View:</strong> Click 'Reset View' to zoom back out and see all of NYC
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
