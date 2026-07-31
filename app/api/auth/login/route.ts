import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Demo credentials for testing - matches the Quick Demo Access buttons on the login page
const DEMO_ACCOUNTS = [
  { id: "demo-user", email: "demo@healthequity.nyc", password: "demo123", name: "Demo User", role: "resident" },
  { id: "admin-user", email: "admin@healthequity.nyc", password: "admin123", name: "Admin User", role: "admin" },
  {
    id: "worker-user",
    email: "worker@healthequity.nyc",
    password: "worker123",
    name: "Community Health Worker",
    role: "worker",
  },
  {
    id: "resident-user",
    email: "resident@healthequity.nyc",
    password: "resident123",
    name: "Community Resident",
    role: "resident",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const account = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password)

    if (account) {
      const token = jwt.sign(
        { userId: account.id, email: account.email, role: account.role, name: account.name },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      const response = NextResponse.json({
        success: true,
        user: {
          id: account.id,
          email: account.email,
          name: account.name,
          role: account.role,
        },
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })

      return response
    }

    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
