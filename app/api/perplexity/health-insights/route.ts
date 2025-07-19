import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 })
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a health data analyst providing insights about NYC health conditions and environmental factors. Focus on factual, actionable information.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("❌ Perplexity API Error:", response.status, errorData)
      return NextResponse.json({ success: false, error: `API Error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      content: data.choices?.[0]?.message?.content || "No insights available",
      citations: data.citations || [],
      isRealTime: true,
    })
  } catch (error) {
    console.error("❌ Perplexity API Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch insights" }, { status: 500 })
  }
}
