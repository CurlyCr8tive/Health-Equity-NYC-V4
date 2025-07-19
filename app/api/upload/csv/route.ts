import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { parse } from "csv-parse/sync"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Read and parse CSV
    const fileContent = await file.text()

    let parsedData
    try {
      parsedData = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid CSV format" }, { status: 400 })
    }

    if (parsedData.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    // Analyze CSV structure
    const columns = Object.keys(parsedData[0])
    const rowCount = parsedData.length

    // Detect potential health-related columns
    const healthColumns = columns.filter((col) => /health|condition|disease|rate|prevalence|incidence/i.test(col))

    const geographicColumns = columns.filter((col) =>
      /borough|zip|neighborhood|location|address|lat|lng|longitude|latitude/i.test(col),
    )

    const demographicColumns = columns.filter((col) => /age|race|ethnicity|gender|income|education/i.test(col))

    // Generate AI analysis
    const analysis = await generateAIAnalysis(parsedData, columns)

    // Save upload record (in real app, save to database)
    const uploadRecord = {
      id: `upload_${Date.now()}`,
      userId: decoded.userId,
      filename: file.name,
      size: file.size,
      rowCount,
      columns,
      healthColumns,
      geographicColumns,
      demographicColumns,
      analysis,
      uploadedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      upload: uploadRecord,
    })
  } catch (error) {
    console.error("CSV upload error:", error)
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 })
  }
}

async function generateAIAnalysis(data: any[], columns: string[]) {
  // Simulate AI analysis
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const analysis = {
    summary: `Analyzed ${data.length} records with ${columns.length} columns`,
    dataQuality: {
      completeness: Math.round((1 - Math.random() * 0.2) * 100), // 80-100%
      consistency: Math.round((1 - Math.random() * 0.15) * 100), // 85-100%
      accuracy: Math.round((1 - Math.random() * 0.1) * 100), // 90-100%
    },
    insights: [
      "Data contains geographic information suitable for mapping",
      "Multiple health conditions identified in the dataset",
      "Demographic breakdowns available for disparity analysis",
      "Time series data detected for trend analysis",
    ],
    recommendations: [
      "Consider geocoding addresses for precise mapping",
      "Standardize health condition names for consistency",
      "Validate demographic categories against census data",
      "Check for potential data privacy concerns",
    ],
    potentialIssues: [
      data.length < 100 ? "Small sample size may limit statistical significance" : null,
      columns.length < 5 ? "Limited variables may restrict analysis depth" : null,
    ].filter(Boolean),
  }

  return analysis
}
