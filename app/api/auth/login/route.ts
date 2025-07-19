import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Demo credentials for testing
    const DEMO_CREDENTIALS = {
      email: "demo@healthequity.nyc",
      password: "demo123",
    }

    // Validate demo credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      // Create a simple session token (in production, use proper JWT)
      const sessionToken = "demo-session-" + Date.now()

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        user: {
          id: "demo-user",
          email: email,
          name: "Demo User",
          role: "health_worker",
        },
      })

      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    }

    return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
