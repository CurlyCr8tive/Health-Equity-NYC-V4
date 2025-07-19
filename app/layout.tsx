import type React from "react"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import "./globals.css"

export const metadata: Metadata = {
  title: "Health Equity NYC",
  description: "Community health data and resources for NYC residents, advocates, and health workers",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
