import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock reports database
const reports: Array<{
  id: string
  userId: string
  title: string
  type: "dashboard" | "csv-analysis"
  data: any
  createdAt: string
  downloadUrl?: string
}> = []

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const userReports = reports.filter((r) => r.userId === decoded.userId)

    return NextResponse.json({ reports: userReports })
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { title, type, data } = await request.json()

    const report = {
      id: `report_${Date.now()}`,
      userId: decoded.userId,
      title,
      type,
      data,
      createdAt: new Date().toISOString(),
      downloadUrl: `/api/reports/${Date.now()}/download`,
    }

    reports.push(report)

    return NextResponse.json({ success: true, report })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}
