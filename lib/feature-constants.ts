// Constants and configuration for Health Equity NYC features

export const HEALTH_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Mental Health",
  "Obesity",
  "Cancer",
  "Stroke",
  "COPD",
  "Kidney Disease",
] as const

export const NYC_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"] as const

export const AGE_GROUPS = ["0-17", "18-34", "35-54", "55-74", "75+"] as const

export const ETHNICITIES = ["White", "Black/African American", "Hispanic/Latino", "Asian", "Other"] as const

export const INCOME_RANGES = [
  "Less than $25,000",
  "$25,000 - $50,000",
  "$50,000 - $75,000",
  "$75,000 - $100,000",
  "More than $100,000",
] as const

export const ENVIRONMENTAL_FACTORS = [
  "Air Quality",
  "Green Space Access",
  "Food Access",
  "Transit Access",
  "Housing Quality",
] as const

export const FEATURE_CATEGORIES = {
  CORE_DASHBOARD: [
    "Advanced Multi-Dimensional Filtering",
    "Dynamic Data Visualization Engine",
    "Real-Time Community Health Assessment",
  ],
  MAPPING: ["Borough-Level Health Mapping", "Environmental Overlays", "Neighborhood Drill-Down"],
  AI_FEATURES: ["Automated Report Generation", "Perplexity AI Integration", "Smart Data Interpretation"],
  EDUCATION: ["Health Condition Library", "Environmental Health Education", "Community Action Guides"],
  DATA_EXPORT: ["Multi-Format Data Export", "Social Sharing Integration", "Personal Data Analysis"],
  USER_MANAGEMENT: ["Secure Login System", "User Profile Management", "Role-Based Access"],
  MOBILE_ACCESSIBILITY: ["Responsive Design System", "Accessibility Compliance", "Multi-Language Support"],
  ANALYTICS: ["Comparative Analysis Tools", "Correlation Analysis", "Trend Monitoring"],
  ALERTS: ["Community Health Alerts", "Personalized Recommendations"],
  INTEGRATION: ["Data Source Integration", "Environmental Data Sources", "AI Service Integration"],
} as const

export const RISK_LEVELS = {
  HIGH: {
    threshold: 25,
    color: "red",
    status: "Needs Immediate Attention",
    urgency: "High",
  },
  MEDIUM: {
    threshold: 15,
    color: "orange",
    status: "Concerning",
    urgency: "Medium",
  },
  LOW_MEDIUM: {
    threshold: 8,
    color: "yellow",
    status: "Typical for NYC",
    urgency: "Low-Medium",
  },
  LOW: {
    threshold: 0,
    color: "green",
    status: "Good",
    urgency: "Low",
  },
} as const

export const CHART_TYPES = ["bar", "line", "pie", "area", "scatter"] as const

export const EXPORT_FORMATS = ["PDF", "CSV"] as const

export const USER_ROLES = ["resident", "health_worker", "advocate", "admin"] as const

export const DATA_SOURCES = {
  CDC: "Centers for Disease Control and Prevention",
  NYC_DOH: "NYC Department of Health",
  NYC_OPEN_DATA: "NYC Open Data Platform",
  EPI_QUERY: "NYC EpiQuery Health Surveys",
  EPA: "Environmental Protection Agency",
  NYC_PARKS: "NYC Parks Department",
  MTA: "Metropolitan Transportation Authority",
  NYC_HOUSING: "NYC Housing Authority",
} as const

export const NOTIFICATION_TYPES = [
  "health_alerts",
  "community_updates",
  "resource_updates",
  "environmental_alerts",
] as const
