"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, ExternalLink, Lightbulb, TrendingUp, Leaf, Users } from "lucide-react"
import { usePerplexityInsights } from "@/hooks/use-perplexity-insights"
import { Skeleton } from "@/components/ui/skeleton"

interface PerplexityInsightsProps {
  filters: any
  className?: string
}

function PerplexityInsights({ filters, className }: PerplexityInsightsProps) {
  const { data, loading, error, refetch } = usePerplexityInsights(filters)
  const [activeTab, setActiveTab] = useState("overview")

  const getLocationName = () => {
    return filters?.geographic?.boroughs?.[0] || filters?.geographic?.neighborhoods?.[0] || "New York City"
  }

  const getSelectedConditions = () => {
    return filters?.healthConditions?.slice(0, 3).join(", ") || "general health conditions"
  }

  if (loading) {
    return (
      <Card className={`h-[900px] ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Real-time Health Insights
            </CardTitle>
            <Badge variant="secondary" className="animate-pulse">
              Loading...
            </Badge>
          </div>
          <CardDescription>Fetching latest health data for {getLocationName()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`h-[900px] ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Lightbulb className="h-5 w-5" />
            Health Insights Unavailable
          </CardTitle>
          <CardDescription>Unable to fetch real-time insights at this moment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          <Button onClick={refetch} variant="outline" className="w-full bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={`h-[900px] ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Real-time Health Insights
          </CardTitle>
          <CardDescription>Select filters to get personalized health insights for your area</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Choose health conditions and location to see insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`h-[900px] flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Real-time Health Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            {data.isRealTime && (
              <Badge variant="default" className="bg-green-600">
                Live Data
              </Badge>
            )}
            <Button onClick={refetch} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Latest insights for {getSelectedConditions()} in {getLocationName()}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Health Data
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-1">
              <Leaf className="h-3 w-3" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="action" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Take Action
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="overview" className="h-full">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full overflow-y-auto">
                <h3 className="font-semibold text-blue-800 mb-3">Executive Summary</h3>
                <p className="text-sm text-blue-700 leading-relaxed">{data.insights.overview}</p>
              </div>
            </TabsContent>

            <TabsContent value="health" className="h-full">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 h-full overflow-y-auto">
                <h3 className="font-semibold text-red-800 mb-3">Current Health Statistics</h3>
                <p className="text-sm text-red-700 leading-relaxed">{data.insights.healthData}</p>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="h-full">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 h-full overflow-y-auto">
                <h3 className="font-semibold text-green-800 mb-3">Environmental Health Factors</h3>
                <p className="text-sm text-green-700 leading-relaxed">{data.insights.environment}</p>
              </div>
            </TabsContent>

            <TabsContent value="action" className="h-full">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 h-full overflow-y-auto">
                <h3 className="font-semibold text-orange-800 mb-3">Recommended Actions</h3>
                <p className="text-sm text-orange-700 leading-relaxed mb-4">{data.insights.takeAction}</p>

                {data.citations && data.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Sources:</h4>
                    <div className="space-y-1">
                      {data.citations.slice(0, 3).map((citation: any, index: number) => (
                        <a
                          key={index}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {citation.title || citation.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Named export
export { PerplexityInsights }

// Default export
export default PerplexityInsights
