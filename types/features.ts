// Feature-related type definitions for the Health Equity NYC platform

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
}

export interface HealthConditionData {
  id: string
  name: string
  category: "Cardiovascular" | "Metabolic" | "Respiratory" | "Mental Health" | "Other"
  prevalence: string
  description: string
  riskFactors: string[]
  demographics: string
  whatItMeans: string
  whatToDo: string
  resources: string[]
  nycData: string
  impact: "High" | "Medium" | "Low"
}

export interface EnvironmentalFactor {
  id: string
  title: string
  category: "Environmental" | "Built Environment" | "Social Environment"
  impact: "High" | "Medium" | "Low"
  description: string
  nycData: string
  healthConditions: string[]
  details: {
    whatItMeans: string
    whoIsAffected: string
    whereInNYC: string
    trends: string
  }
}

export interface CommunityInsights {
  healthStatus: string
  statusColor: string
  statusBg: string
  actionNeeded: string
  urgency: "High" | "Medium" | "Low" | "Info"
  peopleAffectedPer100: number
  peopleAffectedPer1000: number
  envRiskFactors: number
  totalRecords: number
  averageRate: string
  isDefault: boolean
}

export interface HealthResource {
  name: string
  phone: string
  website: string
  description: string
  category: string
  services: string[]
}

export interface BoroughComparisonData {
  borough: string
  population: string
  highBloodPressure: number
  diabetes: number
  airQuality: string
  foodAccess: string
  overallRisk: string
}

export interface AIReportData {
  summary: string
  keyFindings: string[]
  recommendations: string[]
  riskLevel: "High" | "Medium" | "Low"
  affectedPopulation: number
  environmentalFactors: string[]
  resources: HealthResource[]
}

export interface ExportOptions {
  format: "PDF" | "CSV"
  includeCharts: boolean
  includeResources: boolean
  includeRecommendations: boolean
  selectedArea: string
}

export interface UserProfile {
  id: string
  email: string
  role: "resident" | "health_worker" | "advocate" | "admin"
  preferences: {
    defaultBorough?: string
    favoriteConditions: string[]
    notificationSettings: {
      healthAlerts: boolean
      communityUpdates: boolean
      resourceUpdates: boolean
    }
  }
  reportHistory: {
    id: string
    title: string
    generatedAt: Date
    downloadCount: number
  }[]
}

export interface MapOverlay {
  id: string
  name: string
  type: "health" | "environmental" | "demographic"
  enabled: boolean
  opacity: number
  colorScale: string[]
}

export interface ChartConfiguration {
  type: "bar" | "line" | "pie" | "area" | "scatter"
  title: string
  xAxis: string
  yAxis: string
  colorScheme: string[]
  showLegend: boolean
  responsive: boolean
}
