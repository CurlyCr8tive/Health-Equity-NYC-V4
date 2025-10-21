export interface FilterState {
  healthConditions: string[]
  demographics: {
    ageGroups: string[]
    ethnicities: string[]
    incomeRanges: string[]
  }
  environmental: {
    airQuality: boolean
    greenSpace: boolean
    foodAccess: boolean
    transitAccess: boolean
    housingQuality: boolean
  }
  geographic: {
    boroughs: string[]
    neighborhoods: string[]
  }
  // Legacy properties for backward compatibility
  borough?: string
  zipCode?: string
  neighborhood?: string
  radius?: string
  ageGroups?: string[]
  raceEthnicities?: string[]
  includeNeighborhood?: boolean
  environmentalFactors?: string[]
  overlays?: {
    foodDeserts: boolean
    snapAccess: boolean
    greenSpace: boolean
    airQuality: boolean
    waterQuality: boolean
    foodZones: boolean
    healthcareAccess: boolean
    transitAccess: boolean
  }
}

export interface HealthData {
  id: string
  condition: string
  borough: string
  neighborhood: string
  rate: number
  cases: number
  population: number
  ageGroup: string
  raceEthnicity: string
  year: number
}

export interface BoroughData {
  name: string
  coordinates: [number, number]
  rate: number
  population: number
}

export interface EnvironmentalData {
  factor: string
  borough: string
  neighborhood: string
  value: number
  unit: string
  year: number
  source: string
}

export interface ShareableContent {
  type: "analysis" | "map" | "chart" | "report"
  title: string
  description: string
  data: any
  filters: FilterState
  shareUrl: string
  imageUrl?: string
}

export interface AIAnalysis {
  summary: string
  insights: string[]
  recommendations: string[]
  correlations: Array<{
    factor1: string
    factor2: string
    correlation: number
    significance: string
  }>
  topConcerns: Array<{
    condition: string
    severity: "high" | "medium" | "low"
    affectedAreas: string[]
    trend: "increasing" | "decreasing" | "stable"
  }>
}

export interface CSVAnalysisResult {
  summary: string
  insights: string[]
  recommendations: string[]
  dataQuality: {
    completeness: number
    accuracy: number
    issues: string[]
  }
  visualizations: Array<{
    type: "chart" | "map" | "table"
    title: string
    data: any
  }>
}
