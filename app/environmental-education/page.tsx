"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wind,
  Droplets,
  TreePine,
  Home,
  Car,
  Utensils,
  AlertTriangle,
  CheckCircle,
  Info,
  Phone,
  ExternalLink,
  MapPin,
  Users,
  Leaf,
  Share2,
} from "lucide-react"
import { ShareDialog } from "@/components/share-dialog"

const environmentalFactors = [
  {
    id: "air-quality",
    title: "Air Quality",
    category: "Environmental",
    impact: "High",
    icon: Wind,
    description: "Air pollution from traffic, buildings, and industry affects everyone's breathing",
    nycData: "NYC AQI averages 68 (moderate), with higher levels in industrial areas like South Bronx",
    healthConditions: ["Asthma", "COPD", "+2 more"],
    details: {
      whatItMeans: "Poor air quality can worsen asthma, cause breathing problems, and increase heart disease risk",
      whoIsAffected: "Everyone, but especially children, elderly, and people with existing lung conditions",
      whereInNYC: "Worst near highways, industrial areas, and dense traffic zones",
      trends: "Improving overall but still concerning in some neighborhoods",
    },
  },
  {
    id: "water-quality",
    title: "Water Quality",
    category: "Environmental",
    impact: "Medium",
    icon: Droplets,
    description: "Quality of drinking water and exposure to contaminants",
    nycData: "NYC water quality meets federal standards, but 10% of buildings have lead service lines",
    healthConditions: ["Gastrointestinal illness", "Lead poisoning", "+1 more"],
    details: {
      whatItMeans: "Contaminated water can cause immediate illness and long-term health problems",
      whoIsAffected: "Residents in older buildings, especially children under 6",
      whereInNYC: "Older buildings in all boroughs, particularly pre-1960s construction",
      trends: "Infrastructure improvements ongoing but lead pipes remain a concern",
    },
  },
  {
    id: "green-space",
    title: "Green Space Access",
    category: "Built Environment",
    impact: "Medium",
    icon: TreePine,
    description: "Access to parks, trees, and natural areas for physical and mental health",
    nycData: "Manhattan has 27% green space coverage, while Bronx has only 20%",
    healthConditions: ["Depression", "Obesity", "+2 more"],
    details: {
      whatItMeans: "Lack of green space limits exercise opportunities and increases stress",
      whoIsAffected: "All residents, especially those in dense urban areas",
      whereInNYC: "Lower coverage in Bronx and parts of Brooklyn and Queens",
      trends: "City investing in new parks but uneven distribution remains",
    },
  },
  {
    id: "food-environment",
    title: "Food Environment",
    category: "Social Environment",
    impact: "High",
    icon: Utensils,
    description: "Access to healthy, affordable food affects diet quality and chronic disease risk",
    nycData: "3 million NYC residents live in areas with limited healthy food access",
    healthConditions: ["Diabetes", "Obesity", "+2 more"],
    details: {
      whatItMeans: "Without access to healthy food, people are more likely to develop chronic diseases",
      whoIsAffected: "Low-income communities, elderly, and families without transportation",
      whereInNYC: "Food deserts in parts of Bronx, Brooklyn, Queens, and Manhattan",
      trends: "Some improvement with new grocery stores but gaps remain",
    },
  },
  {
    id: "transportation",
    title: "Transportation & Walkability",
    category: "Built Environment",
    impact: "Medium",
    icon: Car,
    description:
      "Transportation options and walkable neighborhoods affect physical activity levels and air quality exposure",
    nycData: "Only 60% of NYC residents live within 1/4 mile of a subway station",
    healthConditions: ["Obesity", "Diabetes", "+2 more"],
    details: {
      whatItMeans: "Poor transportation limits access to jobs, healthcare, and healthy food",
      whoIsAffected: "Residents in outer boroughs and areas with limited transit",
      whereInNYC: "Parts of Queens, Brooklyn, Bronx, and Staten Island",
      trends: "MTA improvements planned but service gaps persist",
    },
  },
  {
    id: "housing-quality",
    title: "Housing Quality",
    category: "Built Environment",
    impact: "High",
    icon: Home,
    description: "Poor housing conditions including mold, pests, and overcrowding affect multiple health outcomes",
    nycData: "25% of NYC rental units have at least one maintenance deficiency",
    healthConditions: ["Asthma", "Lead poisoning", "+2 more"],
    details: {
      whatItMeans: "Poor housing can cause respiratory problems, injuries, and mental health issues",
      whoIsAffected: "Low-income renters, families with children, elderly residents",
      whereInNYC: "Older housing stock throughout all boroughs",
      trends: "Housing code enforcement increased but affordability crisis continues",
    },
  },
]

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "High":
      return "bg-red-100 text-red-800 border-red-200"
    case "Medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "Low":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Environmental":
      return "bg-blue-100 text-blue-800"
    case "Built Environment":
      return "bg-purple-100 text-purple-800"
    case "Social Environment":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const environmentalResources = [
  {
    name: "NYC Environmental Justice",
    phone: "311",
    website: "nyc.gov/environmental-justice",
    description: "City agency addressing environmental health disparities and community concerns",
    category: "Government",
    icon: MapPin,
  },
  {
    name: "Air Quality Alerts",
    phone: "N/A",
    website: "airnow.gov",
    description: "Real-time air quality information and health recommendations",
    category: "Information",
    icon: Wind,
  },
  {
    name: "Community Gardens",
    phone: "311",
    website: "greenthumb.nycgovparks.org",
    description: "NYC's community garden program promoting green space and healthy food access",
    category: "Community",
    icon: TreePine,
  },
  {
    name: "Environmental Justice Alliance",
    phone: "(646) 602-5300",
    website: "ej-alliance.org",
    description: "Coalition working on environmental justice issues in NYC communities",
    category: "Advocacy",
    icon: Users,
  },
  {
    name: "Community Voices Heard",
    phone: "(718) 220-2367",
    website: "cvhaction.org",
    description: "Grassroots organization advocating for low-income communities and environmental justice",
    category: "Advocacy",
    icon: Users,
  },
]

export default function EnvironmentalEducationPage() {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  const selectedFactorData = environmentalFactors.find((factor) => factor.id === selectedFactor)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="h-10 w-10" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Environmental Factors Education</h1>
              <p className="text-lg text-green-100">
                Understanding how your environment affects your health in New York City
              </p>
            </div>
          </div>
          <p className="text-green-50 max-w-3xl">
            Learn about the environmental factors that impact health in NYC neighborhoods, from air quality to housing
            conditions. Get the knowledge you need to protect yourself and advocate for healthier communities.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="overview">Environmental Factors Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Information</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {environmentalFactors.map((factor) => {
                const IconComponent = factor.icon
                return (
                  <Card
                    key={factor.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-300"
                    onClick={() => setSelectedFactor(factor.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                        <div className="flex gap-2">
                          <Badge className={getCategoryColor(factor.category)}>{factor.category}</Badge>
                          <Badge className={`${getImpactColor(factor.impact)} border`}>{factor.impact} Impact</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{factor.title}</CardTitle>
                      <CardDescription>{factor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-semibold text-blue-800 text-sm mb-1">NYC Data</h4>
                          <p className="text-sm text-blue-700">{factor.nycData}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-800 text-sm mb-2">Affects Health Conditions:</h4>
                          <div className="flex flex-wrap gap-1">
                            {factor.healthConditions.map((condition, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Share Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => setShowShareDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share with Neighbors
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedFactorData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <selectedFactorData.icon className="h-8 w-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-2xl">{selectedFactorData.title}</CardTitle>
                      <CardDescription className="text-lg">{selectedFactorData.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getCategoryColor(selectedFactorData.category)}>
                      {selectedFactorData.category}
                    </Badge>
                    <Badge className={`${getImpactColor(selectedFactorData.impact)} border`}>
                      {selectedFactorData.impact} Impact
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          What This Means
                        </h3>
                        <p className="text-blue-700">{selectedFactorData.details.whatItMeans}</p>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Who Is Most Affected
                        </h3>
                        <p className="text-orange-700">{selectedFactorData.details.whoIsAffected}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Where in NYC
                        </h3>
                        <p className="text-green-700">{selectedFactorData.details.whereInNYC}</p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Current Trends
                        </h3>
                        <p className="text-purple-700">{selectedFactorData.details.trends}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      NYC-Specific Data
                    </h3>
                    <p className="text-yellow-700">{selectedFactorData.nycData}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select an Environmental Factor</h3>
                  <p className="text-gray-500 mb-6">
                    Click on any environmental factor from the overview tab to see detailed information
                  </p>
                  <Button onClick={() => setSelectedFactor("air-quality")} variant="outline">
                    View Air Quality Details
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Share Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={() => setShowShareDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share with Neighbors
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Environmental Resources Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Environmental Health Resources & Organizations
              </CardTitle>
              <CardDescription>
                Connect with organizations and services that can help address environmental health concerns in your
                community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {environmentalResources.map((resource, index) => {
                  const IconComponent = resource.icon
                  return (
                    <Card key={index} className="border-2 hover:border-green-300 hover:shadow-md transition-all">
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-100 rounded-full p-2">
                            <IconComponent className="h-5 w-5 text-green-600" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {resource.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription className="text-sm">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Phone:</span>
                            <span>{resource.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Website:</span>
                            <a
                              href={`https://${resource.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 hover:underline"
                            >
                              {resource.website}
                            </a>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
                          onClick={() => window.open(`https://${resource.website}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Website
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Additional Help Section */}
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Need More Help?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="border-green-600 text-green-600 bg-transparent">
                    <Phone className="h-4 w-4 mr-2" />
                    Call 311 for City Services
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Find Community Groups
                  </Button>
                  <Button variant="outline" className="border-green-600 text-green-600 bg-transparent">
                    <MapPin className="h-4 w-4 mr-2" />
                    Locate Nearest Resources
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <ShareDialog open={showShareDialog} onClose={() => setShowShareDialog(false)} />
    </div>
  )
}
