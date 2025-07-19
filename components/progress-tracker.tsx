"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users } from "lucide-react"

interface ProgressTrackerProps {
  history: Array<{
    timestamp: Date
    filters: any
    location: string
    focus: string
  }>
}

export default function ProgressTracker({ history }: ProgressTrackerProps) {
  const recentAnalyses = history.slice(0, 5)

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Clock className="w-4 h-4 mr-2 text-purple-600" />
          Progress Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-600 mb-2">Recent analyses for monitoring trends</div>

        {recentAnalyses.map((analysis, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="font-medium">{analysis.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-3 h-3 text-gray-400" />
                <span>{analysis.focus}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500">{analysis.timestamp.toLocaleDateString()}</div>
              <div className="text-gray-400">
                {analysis.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {history.length > 5 && (
          <Button variant="outline" size="sm" className="w-full">
            View All {history.length} Analyses
          </Button>
        )}

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 text-center">💡 Return weekly/monthly to track progress</div>
        </div>
      </CardContent>
    </Card>
  )
}
