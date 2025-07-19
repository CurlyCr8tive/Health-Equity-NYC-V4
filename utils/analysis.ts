import type { FilterState } from "@/types"

/**
 * Convert Markdown&#47;plain-text coming from the AI service into minimal,
 * styled HTML that fits inside our Card component.
 */
export function formatAnalysisText(text: string): string {
  return (
    text
      // Headings
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-6 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4 text-gray-700">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Lists
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
      // Paragraphs
      .replace(/\n\n+/g, '</p><p class="mb-4">')
      .replace(/^(?!<h[1-3]|<li|<p)/gm, '<p class="mb-4">')
      // Cleanup stray tags around headings
      .replace(/<p class="mb-4">(.*)(<h[1-3])/g, "$2")
      .replace(/(<\/h[1-3]>).*?<\/p>/g, "$1")
  )
}

/**
 * Mock health-condition data so that the dashboard always has something to
 * visualise while we wire up real APIs.
 */
export function generateMockHealthData(filters: FilterState) {
  const conditions =
    filters.healthConditions.length > 0 ? filters.healthConditions : ["Asthma", "Diabetes", "Hypertension"]

  const boroughs =
    filters.borough !== undefined ? [filters.borough] : ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]

  const mock: Array<Record<string, unknown>> = []

  for (const condition of conditions) {
    for (const borough of boroughs) {
      mock.push({
        condition,
        borough,
        rate: Number((Math.random() * 20 + 5).toFixed(2)), // 5–25 %
        demographic: "Adults 18-64",
        ageGroup: "18-64",
        raceEthnicity: "All",
      })
    }
  }
  return mock
}

/**
 * Mock environmental-factor data. Structure is deliberately simple so that
 * callers can reshape as needed.
 */
export function generateMockEnvironmentalData(filters: FilterState) {
  const factors =
    filters.environmentalFactors.length > 0 ? filters.environmentalFactors : ["Air Quality", "Green Space Access"]

  return factors.map((factor) => ({
    factor,
    value: Number((Math.random() * 100).toFixed(1)),
    borough: filters.borough ?? "NYC",
  }))
}

/**
 * Provide a “top conditions” summary for the small KPI cards.
 */
export function generateTopConditions(filters: FilterState) {
  const base = ["Asthma", "Diabetes", "Hypertension", "Mental Health"]

  return base.map((condition, idx) => ({
    condition,
    avgRate: Number((20 - idx * 3 + Math.random() * 5).toFixed(1)),
    count: Math.floor(Math.random() * 1_000) + 100,
  }))
}

/**
 * Offline / fallback analysis text so users are never left without insight.
 */
export function generateFallbackAnalysis(filters: FilterState): string {
  const location = filters.borough || filters.neighborhood || "NYC"
  const hasConditions = filters.healthConditions.length > 0
  const hasEnvironmental = filters.environmentalFactors.length > 0

  return `# Health Equity Analysis for ${location}

## Executive Summary
This analysis examines health conditions and environmental factors in ${location}. ${
    hasConditions
      ? `The primary focus is on **${filters.healthConditions.join("**, **")}**. `
      : "All major health conditions are included. "
  }${
    hasEnvironmental ? `Environmental factors studied include **${filters.environmentalFactors.join("**, **")}**.` : ""
  }

## Key Findings
- Health disparities vary considerably by neighbourhood and demographic group.
- Environmental exposures significantly influence community health outcomes.
- Targeted, place-based interventions yield the greatest equity gains.

## Recommendations
1. Expand community-based health-education programmes.
2. Improve access to preventive care in underserved areas.
3. Address environmental hazards through policy and enforcement.
4. Seek sustainable funding for long-term impact initiatives.

*This fallback report was generated locally to ensure continuity when external AI services are unavailable.*`
}
