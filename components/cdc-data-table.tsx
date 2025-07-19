import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Wind } from "lucide-react"

type HealthData = {}

interface CDCDataTableProps {
  data: HealthData[]
  environmentalData?: any[]
  loading?: boolean
}

export function CDCDataTable({ data, environmentalData = [], loading = false }: CDCDataTableProps) {
  return (
    <div className="space-y-6">
      {data.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Health Conditions Data
          </h3>
          {/* Existing chart code */}
        </div>
      )}

      {environmentalData.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wind className="h-5 w-5 text-green-600" />
            Environmental Factors Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {environmentalData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{item.indicator}</CardTitle>
                  <CardDescription className="text-xs">{item.borough}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-1">{item.value}</div>
                  <div className="text-sm text-gray-600 mb-2">{item.unit}</div>
                  <Badge
                    variant={
                      item.healthImpact.includes("High Risk") || item.healthImpact.includes("Poor")
                        ? "destructive"
                        : item.healthImpact.includes("Limited") || item.healthImpact.includes("Fair")
                          ? "secondary"
                          : "default"
                    }
                  >
                    {item.healthImpact}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-2">{item.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 && environmentalData.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No data available. Please select filters to view health and environmental data.
          </p>
        </div>
      )}
    </div>
  )
}
