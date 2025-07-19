"use client"

import { useEffect, useRef } from "react"
import type { HealthData, FilterState } from "@/types"

interface DynamicChartsProps {
  data: HealthData[]
  filters: FilterState
}

export default function DynamicCharts({ data, filters }: DynamicChartsProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !chartRef.current || data.length === 0) return

    const renderChart = async () => {
      try {
        // Dynamically import Chart.js
        const { Chart, registerables } = await import("chart.js")
        Chart.register(...registerables)

        // Clean up previous chart instance if it exists
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy()
        }

        // Prepare data for charts
        const boroughData = data.reduce(
          (acc, item) => {
            if (!acc[item.borough]) {
              acc[item.borough] = { total: 0, count: 0 }
            }
            acc[item.borough].total += item.rate
            acc[item.borough].count += 1
            return acc
          },
          {} as Record<string, { total: number; count: number }>,
        )

        const chartData = Object.entries(boroughData).map(([borough, stats]) => ({
          borough,
          avgRate: stats.total / stats.count,
        }))

        // Create canvas element
        const canvas = document.createElement("canvas")
        chartRef.current.innerHTML = ""
        chartRef.current.appendChild(canvas)

        // Create chart
        chartInstanceRef.current = new Chart(canvas, {
          type: "bar",
          data: {
            labels: chartData.map((item) => item.borough),
            datasets: [
              {
                label: filters.healthCondition || "All Conditions",
                data: chartData.map((item) => item.avgRate),
                backgroundColor: [
                  "rgba(255, 99, 132, 0.6)",
                  "rgba(54, 162, 235, 0.6)",
                  "rgba(255, 206, 86, 0.6)",
                  "rgba(75, 192, 192, 0.6)",
                  "rgba(153, 102, 255, 0.6)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                  "rgba(153, 102, 255, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `Health Rates by Borough${filters.healthCondition ? ` - ${filters.healthCondition}` : ""}`,
              },
              legend: {
                position: "top",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Rate (%)",
                },
              },
            },
          },
        })
      } catch (error) {
        console.error("Error rendering chart:", error)
      }
    }

    renderChart()

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [data, filters])

  return <div ref={chartRef} className="w-full h-full"></div>
}
