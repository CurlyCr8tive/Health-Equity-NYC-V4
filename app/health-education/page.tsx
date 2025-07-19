"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Heart,
  Activity,
  Brain,
  Users,
  AlertTriangle,
  TrendingUp,
  Info,
  Phone,
  ExternalLink,
  Search,
  MapPin,
  Share2,
  Stethoscope,
  Building2,
  Globe,
  CheckCircle,
  ArrowRight,
  Zap,
  TreesIcon as Lungs,
} from "lucide-react"
import { ShareDialog } from "@/components/share-dialog"
import Link from "next/link"

// Health conditions data with NYC-specific information
const healthConditions = [
  {
    id: "hypertension",
    name: "High Blood Pressure",
    category: "Cardiovascular",
    icon: Heart,
    prevalence: "28.5% in NYC",
    description: "When blood pushes against artery walls with too much force",
    riskFactors: ["High sodium diet", "Stress", "Lack of exercise", "Genetics"],
    demographics: "Highest in Black/African American communities (32.1%), especially ages 55-74",
    whatItMeans:
      "High blood pressure can lead to heart attack, stroke, and kidney disease if not treated. It's called the 'silent killer' because it often has no symptoms.",
    whatToDo: "Eat less salt, exercise more, manage stress, take blood pressure medication if prescribed",
    resources: ["Free blood pressure screenings", "Heart-healthy cooking classes", "Medication assistance"],
    color: "red",
    impact: "High",
    nycData: "NYC has higher rates than national average, with significant disparities by neighborhood",
  },
  {
    id: "diabetes",
    name: "Diabetes Type 2",
    category: "Metabolic",
    icon: Activity,
    prevalence: "12.8% in NYC",
    description: "A condition where blood sugar levels are consistently too high",
    riskFactors: ["Poor diet", "Lack of exercise", "Obesity", "Family history"],
    demographics: "Higher rates in Hispanic/Latino (16.8%) and Black communities, especially ages 35-54",
    whatItMeans:
      "Diabetes can cause serious complications like blindness, kidney disease, and heart problems if not controlled",
    whatToDo: "Monitor blood sugar daily, eat healthy foods, exercise regularly, take medications as prescribed",
    resources: ["Diabetes education programs", "Free glucose testing", "Nutrition counseling"],
    color: "orange",
    impact: "High",
    nycData: "Rates vary significantly by borough, with highest rates in Bronx and parts of Brooklyn",
  },
  {
    id: "asthma",
    name: "Asthma",
    category: "Respiratory",
    icon: Lungs,
    prevalence: "14.2% in NYC",
    description: "A condition where airways narrow and swell, making breathing difficult",
    riskFactors: ["Air pollution", "Allergens", "Stress", "Environmental triggers"],
    demographics: "Higher rates in Bronx (18.5%) and Brooklyn (14.2%), especially among children 0-17",
    whatItMeans: "Asthma can make it hard to breathe and can be life-threatening if not managed properly",
    whatToDo: "Use prescribed inhalers, avoid triggers, keep rescue medication nearby, get regular checkups",
    resources: ["Free asthma education classes", "Air quality alerts", "Inhaler assistance programs"],
    color: "blue",
    impact: "Medium",
    nycData: "Environmental factors like air quality significantly impact asthma rates across NYC",
  },
  {
    id: "depression",
    name: "Depression & Mental Health",
    category: "Mental Health",
    icon: Brain,
    prevalence: "16.8% in NYC",
    description: "A mental health condition causing persistent sadness and loss of interest",
    riskFactors: ["Social isolation", "Trauma", "Chronic stress", "Economic hardship"],
    demographics: "Higher rates in young adults 18-34 (18.2%), with disparities across racial/ethnic groups",
    whatItMeans: "Depression affects how you think, feel, and handle daily activities, but it is treatable",
    whatToDo: "Talk to a counselor or doctor, stay connected with friends and family, practice self-care",
    resources: ["Free mental health counseling", "Support groups", "Crisis hotlines"],
    color: "purple",
    impact: "High",
    nycData: "Mental health services vary by neighborhood, with some areas having limited access",
  },
  {
    id: "obesity",
    name: "Obesity",
    category: "Metabolic",
    icon: Users,
    prevalence: "26.7% in NYC",
    description: "Having excess body weight that may harm health",
    riskFactors: ["Poor diet", "Sedentary lifestyle", "Genetics", "Food environment"],
    demographics: "Higher rates in Hispanic/Latino (35.2%) and Black communities, especially ages 35-54",
    whatItMeans: "Obesity increases risk for diabetes, heart disease, and other serious health problems",
    whatToDo: "Eat more fruits and vegetables, be physically active, work with a healthcare provider",
    resources: ["Weight management programs", "Nutrition classes", "Free fitness programs"],
    color: "green",
    impact: "High",
    nycData: "Obesity rates correlate with food access and built environment factors across NYC",
  },
]

const nycHealthResources = [
  {
    name: "NYC Health + Hospitals",
    phone: "1-844-NYC-4NYC",
    website: "nychealthandhospitals.org",
    description: "NYC's public health system providing care regardless of ability to pay",
    category: "Healthcare System",
    icon: Building2,
    services: ["Primary care", "Emergency services", "Specialty care", "Mental health"],
  },
  {
    name: "NYC Department of Health",
    phone: "311",
    website: "nyc.gov/health",
    description: "City agency promoting health and preventing disease across NYC",
    category: "Government Services",
    icon: Building2,
    services: ["Health education", "Disease prevention", "Health inspections", "Emergency preparedness"],
  },
  {
    name: "Community Health Centers",
    phone: "311",
    website: "findahealthcenter.hrsa.gov",
    description: "Federally qualified health centers providing comprehensive primary care",
    category: "Primary Care",
    icon: Stethoscope,
    services: ["Primary care", "Dental care", "Mental health", "Pharmacy services"],
  },
  {
    name: "NYC Well",
    phone: "1-888-NYC-WELL",
    website: "nycwell.cityofnewyork.us",
    description: "Free, confidential mental health support for all New Yorkers",
    category: "Mental Health",
    icon: Brain,
    services: ["Crisis counseling", "Peer support", "Resource connections", "24/7 helpline"],
  },
  {
    name: "WIC Program NYC",
    phone: "311",
    website: "nyc.gov/wic",
    description: "Nutrition program for women, infants, and children",
    category: "Nutrition Support",
    icon: Heart,
    services: ["Nutrition education", "Food benefits", "Breastfeeding support", "Health screenings"],
  },
  {
    name: "NYC Parks Recreation Centers",
    phone: "311",
    website: "nycgovparks.org",
    description: "Free and low-cost fitness and wellness programs across NYC",
    category: "Fitness & Wellness",
    icon: Activity,
    services: ["Fitness classes", "Swimming pools", "Sports leagues", "Senior programs"],
  },
]

const getColorClasses = (color: string) => {
  const colorMap = {
    red: "border-red-500 bg-red-50 text-red-700",
    orange: "border-orange-500 bg-orange-50 text-orange-700",
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    purple: "border-purple-500 bg-purple-50 text-purple-700",
    green: "border-green-500 bg-green-50 text-green-700",
  }
  return colorMap[color as keyof typeof colorMap] || colorMap.blue
}

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
    case "Cardiovascular":
      return "bg-red-100 text-red-800"
    case "Metabolic":
      return "bg-orange-100 text-orange-800"
    case "Respiratory":
      return "bg-blue-100 text-blue-800"
    case "Mental Health":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function HealthEducation() {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [showShareDialog, setShowShareDialog] = useState(false)

  const selectedConditionData = healthConditions.find((condition) => condition.id === selectedCondition)

  const filteredConditions = healthConditions.filter((condition) =>
    condition.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredResources = nycHealthResources.filter((resource) =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-10 w-10" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Health Resources & Services</h1>
              <p className="text-lg text-red-100">Community Health Education & Support</p>
            </div>
          </div>
          <p className="text-red-50 max-w-3xl">
            Learn about common health conditions in NYC, understand what they mean for you and your family, and find
            resources to get help. Knowledge is power when it comes to your health.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Health Conditions Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Information</TabsTrigger>
            <TabsTrigger value="resources">NYC Health Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search health conditions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Health Conditions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConditions.map((condition) => {
                const IconComponent = condition.icon
                return (
                  <Card
                    key={condition.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500 bg-white"
                    onClick={() => setSelectedCondition(condition.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="bg-blue-100 rounded-full p-2">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getCategoryColor(condition.category)}>{condition.category}</Badge>
                          <Badge className={`${getImpactColor(condition.impact)} border`}>
                            {condition.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{condition.name}</CardTitle>
                      <CardDescription>{condition.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-blue-600">NYC Prevalence</div>
                          <div className="text-2xl font-bold text-blue-800">{condition.prevalence}</div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">Key Risk Factors:</div>
                          <div className="flex flex-wrap gap-1">
                            {condition.riskFactors.slice(0, 3).map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                            {condition.riskFactors.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{condition.riskFactors.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">{condition.demographics}</div>

                        <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Learn More
                        </Button>
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

          <TabsContent value="detailed" className="space-y-6">
            {selectedConditionData ? (
              <Card className={`border-l-4 ${getColorClasses(selectedConditionData.color)}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <selectedConditionData.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{selectedConditionData.name}</CardTitle>
                      <CardDescription className="text-lg">{selectedConditionData.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getCategoryColor(selectedConditionData.category)}>
                      {selectedConditionData.category}
                    </Badge>
                    <Badge className={`${getImpactColor(selectedConditionData.impact)} border`}>
                      {selectedConditionData.impact} Impact
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prevalence and Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        NYC Prevalence & Demographics
                      </h3>
                      <div className="text-3xl font-bold text-orange-600 mb-2">{selectedConditionData.prevalence}</div>
                      <p className="text-sm text-orange-700 mb-3">{selectedConditionData.demographics}</p>
                      <div className="text-xs text-orange-600 bg-orange-100 rounded p-2">
                        <strong>NYC Context:</strong> {selectedConditionData.nycData}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Risk Factors
                      </h3>
                      <div className="space-y-2">
                        {selectedConditionData.riskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-blue-700">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* What It Means */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      What This Means for You
                    </h3>
                    <p className="text-gray-700 mb-4">{selectedConditionData.whatItMeans}</p>

                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      What You Can Do
                    </h4>
                    <p className="text-gray-700">{selectedConditionData.whatToDo}</p>
                  </div>

                  {/* Resources */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Resources Available in NYC
                    </h3>
                    <div className="space-y-2">
                      {selectedConditionData.resources.map((resource, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-700">{resource}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>💡 Get Help:</strong> Visit our{" "}
                        <button onClick={() => setActiveTab("resources")} className="underline hover:text-green-600">
                          NYC Health Resources tab
                        </button>{" "}
                        to find specific services and contact information.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Health Condition</h3>
                  <p className="text-gray-500 mb-6">
                    Click on any health condition from the overview tab to see detailed information
                  </p>
                  <Button onClick={() => setSelectedCondition("hypertension")} variant="outline">
                    <Zap className="h-4 w-4 mr-2" />
                    View High Blood Pressure Details
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

          <TabsContent value="resources" className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search health resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* NYC Health Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource, index) => {
                const IconComponent = resource.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 rounded-full p-2">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {resource.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{resource.name}</CardTitle>
                      <CardDescription className="text-sm">{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Services */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Services:</div>
                        <div className="flex flex-wrap gap-1">
                          {resource.services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-blue-900">Phone</div>
                            <div className="text-sm text-blue-700">{resource.phone}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-900">Website</div>
                            <a
                              href={`https://${resource.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-700 hover:text-green-800 hover:underline break-all"
                            >
                              {resource.website}
                            </a>
                          </div>
                          <ExternalLink className="w-4 h-4 text-green-600 flex-shrink-0" />
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => window.open(`https://${resource.website}`, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Website
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Emergency & Crisis Resources */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency & Crisis Resources
                </CardTitle>
                <CardDescription className="text-red-700">
                  If you're experiencing a health emergency or mental health crisis, get help immediately
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                    <div className="font-semibold text-red-800 mb-2">Medical Emergency</div>
                    <div className="text-2xl font-bold text-red-600 mb-1">911</div>
                    <div className="text-sm text-red-700">Call for life-threatening emergencies</div>
                  </div>
                  <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="font-semibold text-purple-800 mb-2">Mental Health Crisis</div>
                    <div className="text-lg font-bold text-purple-600 mb-1">1-888-NYC-WELL</div>
                    <div className="text-sm text-purple-700">24/7 mental health support</div>
                  </div>
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="font-semibold text-blue-800 mb-2">Poison Control</div>
                    <div className="text-lg font-bold text-blue-600 mb-1">1-800-222-1222</div>
                    <div className="text-sm text-blue-700">24/7 poison emergency help</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Help Section */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h3>
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                  If you can't find what you're looking for or need help navigating NYC's health system, these resources
                  can provide additional support and guidance.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 311 for City Services
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Nearest Health Center
                  </Button>
                  <Link href="/environmental-education">
                    <Button
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50 bg-transparent"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Environmental Health Info
                    </Button>
                  </Link>
                </div>
              </div>
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
        </Tabs>
      </div>

      {/* Share Dialog */}
      <ShareDialog open={showShareDialog} onClose={() => setShowShareDialog(false)} />
    </div>
  )
}
