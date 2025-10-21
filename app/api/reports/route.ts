import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

// Type definitions for better type safety
interface HealthDataPoint {
  id: string
  condition: string
  borough: string
  rate: number
  cases?: number
  population?: number
  year?: number
  ageGroup?: string
  raceEthnicity?: string
}

interface EnvironmentalDataPoint {
  id: string
  indicator: string
  borough: string
  value: number
  unit: string
  year: number
  source: string
  description: string
  healthImpact: string
}

interface ReportRequest {
  healthData: HealthDataPoint[]
  environmentalData: EnvironmentalDataPoint[]
  filters: {
    healthConditions?: string[]
    geographic?: {
      boroughs?: string[]
      neighborhoods?: string[]
    }
    demographics?: {
      ageGroups?: string[]
      ethnicities?: string[]
      incomeRanges?: string[]
    }
    environmental?: {
      [key: string]: boolean
    }
  }
  analysisType?: "summary" | "detailed" | "community"
}

// In-memory reports storage (replace with database in production)
const reports: Array<{
  id: string
  userId: string
  title: string
  type: "dashboard" | "csv-analysis"
  data: any
  createdAt: string
  downloadUrl?: string
}> = []

// Input validation functions
function validateHealthData(data: any[]): HealthDataPoint[] {
  if (!Array.isArray(data)) {
    throw new Error("Health data must be an array")
  }

  return data.map((item, index) => {
    if (!item.id || !item.condition || !item.borough || typeof item.rate !== "number") {
      throw new Error(`Invalid health data at index ${index}: missing required fields`)
    }

    if (item.rate < 0 || item.rate > 100) {
      throw new Error(`Invalid health data at index ${index}: rate must be between 0 and 100`)
    }

    return {
      id: String(item.id),
      condition: String(item.condition),
      borough: String(item.borough),
      rate: Number(item.rate),
      cases: item.cases ? Number(item.cases) : undefined,
      population: item.population ? Number(item.population) : undefined,
      year: item.year ? Number(item.year) : undefined,
      ageGroup: item.ageGroup ? String(item.ageGroup) : undefined,
      raceEthnicity: item.raceEthnicity ? String(item.raceEthnicity) : undefined,
    }
  })
}

function validateEnvironmentalData(data: any[]): EnvironmentalDataPoint[] {
  if (!Array.isArray(data)) {
    throw new Error("Environmental data must be an array")
  }

  return data.map((item, index) => {
    if (!item.id || !item.indicator || !item.borough || typeof item.value !== "number") {
      throw new Error(`Invalid environmental data at index ${index}: missing required fields`)
    }

    return {
      id: String(item.id),
      indicator: String(item.indicator),
      borough: String(item.borough),
      value: Number(item.value),
      unit: String(item.unit || ""),
      year: Number(item.year || new Date().getFullYear()),
      source: String(item.source || "Unknown"),
      description: String(item.description || ""),
      healthImpact: String(item.healthImpact || "Unknown"),
    }
  })
}

function validateFilters(filters: any): ReportRequest["filters"] {
  if (!filters || typeof filters !== "object") {
    return {}
  }

  return {
    healthConditions: Array.isArray(filters.healthConditions) ? filters.healthConditions.map(String) : undefined,
    geographic:
      filters.geographic && typeof filters.geographic === "object"
        ? {
            boroughs: Array.isArray(filters.geographic.boroughs) ? filters.geographic.boroughs.map(String) : undefined,
            neighborhoods: Array.isArray(filters.geographic.neighborhoods)
              ? filters.geographic.neighborhoods.map(String)
              : undefined,
          }
        : undefined,
    demographics:
      filters.demographics && typeof filters.demographics === "object"
        ? {
            ageGroups: Array.isArray(filters.demographics.ageGroups)
              ? filters.demographics.ageGroups.map(String)
              : undefined,
            ethnicities: Array.isArray(filters.demographics.ethnicities)
              ? filters.demographics.ethnicities.map(String)
              : undefined,
            incomeRanges: Array.isArray(filters.demographics.incomeRanges)
              ? filters.demographics.incomeRanges.map(String)
              : undefined,
          }
        : undefined,
    environmental:
      filters.environmental && typeof filters.environmental === "object"
        ? Object.fromEntries(Object.entries(filters.environmental).filter(([_, value]) => typeof value === "boolean"))
        : undefined,
  }
}

function generateAnalysisPrompt(
  healthData: HealthDataPoint[],
  environmentalData: EnvironmentalDataPoint[],
  filters: ReportRequest["filters"],
  analysisType: string,
): string {
  const selectedArea = filters.geographic?.boroughs?.join(", ") || "New York City"
  const selectedConditions = filters.healthConditions?.join(", ") || "various health conditions"

  let prompt = `You are a public health expert analyzing health equity data for ${selectedArea}. `

  if (analysisType === "community") {
    prompt += `Write a community-focused health report that regular people can understand. Use plain language and focus on what the data means for residents' daily lives.

**Health Data Analysis:**
`
  } else {
    prompt += `Generate a ${analysisType} health analysis report.

**Health Data Analysis:**
`
  }

  // Add health data context
  if (healthData.length > 0) {
    prompt += `\nHealth conditions analyzed: ${selectedConditions}
Data points: ${healthData.length}
Average prevalence rate: ${(healthData.reduce((sum, item) => sum + item.rate, 0) / healthData.length).toFixed(1)}%
Highest rate: ${Math.max(...healthData.map((item) => item.rate)).toFixed(1)}%
Lowest rate: ${Math.min(...healthData.map((item) => item.rate)).toFixed(1)}%

Key findings from health data:
${healthData
  .slice(0, 5)
  .map(
    (item) =>
      `- ${item.condition} in ${item.borough}: ${item.rate}% prevalence${item.cases ? ` (${item.cases.toLocaleString()} estimated cases)` : ""}`,
  )
  .join("\n")}
`
  }

  // Add environmental data context
  if (environmentalData.length > 0) {
    prompt += `\n**Environmental Factors:**
Environmental indicators: ${environmentalData.length}
${environmentalData
  .slice(0, 5)
  .map((item) => `- ${item.indicator} in ${item.borough}: ${item.value} ${item.unit} (${item.healthImpact})`)
  .join("\n")}
`
  }

  if (analysisType === "community") {
    prompt += `\n**Please provide:**
1. **Key Findings Summary** - What are the 3 most important things residents should know?
2. **Risk Assessment** - Is this LOW, MODERATE, or HIGH risk for the community?
3. **Health Analysis** - What do these numbers mean for families living in this area?
4. **Key Insights** - What patterns or trends should residents be aware of?
5. **Recommendations** - What can residents do to protect their health and advocate for their community?

Write in a caring, informative tone that empowers residents with knowledge they can act on.`
  } else {
    prompt += `\n**Please provide a comprehensive analysis including:**
1. Key findings and trends
2. Risk assessment
3. Health implications
4. Recommendations for intervention
5. Areas needing further investigation`
  }

  return prompt
}

function generateSummaryStats(
  healthData: HealthDataPoint[],
  environmentalData: EnvironmentalDataPoint[],
  filters: ReportRequest["filters"],
) {
  const stats = {
    totalRecords: healthData.length + environmentalData.length,
    healthConditionsAnalyzed: filters.healthConditions?.length || 0,
    environmentalFactorsConsidered: environmentalData.length,
    geographicFocus: filters.geographic?.boroughs?.join(", ") || "New York City",
    averagePrevalenceRate:
      healthData.length > 0
        ? (healthData.reduce((sum, item) => sum + item.rate, 0) / healthData.length).toFixed(1)
        : "0.0",
    riskLevel: "LOW" as string,
  }

  // Determine risk level based on average prevalence rate
  const avgRate = Number.parseFloat(stats.averagePrevalenceRate)
  if (avgRate > 25) {
    stats.riskLevel = "HIGH"
  } else if (avgRate > 15) {
    stats.riskLevel = "MODERATE"
  } else {
    stats.riskLevel = "LOW"
  }

  return stats
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.warn("No auth-token cookie present")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET env variable")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    const userReports = reports.filter((report) => report.userId === decoded.userId)

    return NextResponse.json({ success: true, reports: userReports })
  } catch (error: any) {
    console.error("GET error:", error.message || error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.warn("No auth-token cookie present")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET env variable")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OpenAI API key not configured")
      return NextResponse.json({ error: "AI analysis service not configured" }, { status: 503 })
    }

    // Parse and validate request body
    let requestBody: any
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("❌ Invalid JSON in request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate required fields
    if (!requestBody.healthData && !requestBody.environmentalData) {
      return NextResponse.json(
        { error: "At least one of healthData or environmentalData is required" },
        { status: 400 },
      )
    }

    // Validate and transform data
    const healthData = requestBody.healthData ? validateHealthData(requestBody.healthData) : []

    const environmentalData = requestBody.environmentalData
      ? validateEnvironmentalData(requestBody.environmentalData)
      : []

    const filters = validateFilters(requestBody.filters)
    const analysisType = requestBody.analysisType || "community"

    console.log(
      `🔍 Generating ${analysisType} report with ${healthData.length} health data points and ${environmentalData.length} environmental data points`,
    )

    // Generate analysis prompt based on data
    const prompt = generateAnalysisPrompt(healthData, environmentalData, filters, analysisType)

    console.log("🤖 Sending request to OpenAI...")

    // Generate AI analysis with timeout and error handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        maxTokens: 2000,
        temperature: 0.7,
        abortSignal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI service")
      }

      console.log("✅ AI analysis generated successfully")

      // Generate summary statistics
      const stats = generateSummaryStats(healthData, environmentalData, filters)

      return NextResponse.json({
        success: true,
        analysis: text,
        stats,
        metadata: {
          healthDataPoints: healthData.length,
          environmentalDataPoints: environmentalData.length,
          analysisType,
          generatedAt: new Date().toISOString(),
          filters: filters,
        },
      })
    } catch (aiError: any) {
      clearTimeout(timeoutId)

      if (aiError.name === "AbortError") {
        console.error("❌ AI analysis request timeout")
        return NextResponse.json({ error: "AI analysis request timeout" }, { status: 504 })
      }

      console.error("❌ AI analysis error:", aiError)
      throw new Error(`AI analysis failed: ${aiError.message}`)
    }
  } catch (error: any) {
    console.error("❌ Reports API error:", error)

    return NextResponse.json(
      {
        error: "Failed to generate health report",
        details: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
