"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Download, Upload, FileText, Calendar, BarChart3, ArrowLeft, Shield, Activity } from "lucide-react"
import CSVUpload from "@/components/csv-upload"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  organization: string
  joinedAt: string
  lastLogin: string
}

interface Report {
  id: string
  title: string
  type: "dashboard" | "csv-analysis"
  createdAt: string
  downloadUrl?: string
  size?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchReports()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser({
          ...data.user,
          organization: data.user.role === "admin" ? "NYC Department of Health" : "Brooklyn Community Health Center",
          joinedAt: "2024-01-15T00:00:00Z",
          lastLogin: new Date().toISOString(),
        })
      } else {
        router.push("/login")
      }
    } catch (error) {
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    }
  }

  const handleDownloadReport = (report: Report) => {
    // Simulate report download
    const reportData = {
      id: report.id,
      title: report.title,
      type: report.type,
      generatedAt: report.createdAt,
      user: user?.email,
      data: "Sample report data...",
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.title.replace(/\s+/g, "-")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCSVUploadComplete = (uploadResult: any) => {
    // Add new report to the list
    const newReport: Report = {
      id: uploadResult.upload.id,
      title: `CSV Analysis: ${uploadResult.upload.filename}`,
      type: "csv-analysis",
      createdAt: uploadResult.upload.uploadedAt,
      size: `${Math.round(uploadResult.upload.size / 1024)} KB`,
    }

    setReports((prev) => [newReport, ...prev])
    setActiveTab("reports")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
                <p className="text-sm text-gray-600">Manage your account and reports</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>View and manage your personal profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg font-medium">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="text-lg">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "Administrator" : "Health Worker"}
                        </Badge>
                        {user.role === "admin" && <Shield className="w-4 h-4 text-blue-600" />}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Organization</label>
                      <p className="text-lg">{user.organization}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-lg">{new Date(user.joinedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Login</label>
                      <p className="text-lg">{new Date(user.lastLogin).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{reports.length}</p>
                        <p className="text-sm text-gray-600">Generated Reports</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{reports.filter((r) => r.type === "csv-analysis").length}</p>
                        <p className="text-sm text-gray-600">CSV Uploads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">Active</p>
                        <p className="text-sm text-gray-600">Account Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Your Reports</span>
                </CardTitle>
                <CardDescription>Download and manage your generated analysis reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Generate your first report by analyzing data or uploading a CSV file
                    </p>
                    <Button onClick={() => setActiveTab("upload")}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CSV Data
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {report.type === "csv-analysis" ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Upload className="w-5 h-5 text-blue-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>Uploaded CSV Analysis</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>Dashboard Report</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{report.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                              </span>
                              {report.size && <span>{report.size}</span>}
                              <Badge variant="outline">
                                {report.type === "csv-analysis" ? "CSV Analysis" : "Dashboard Report"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload CSV Data</span>
                </CardTitle>
                <CardDescription>Upload your own health data for AI-powered analysis and visualization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-700">
                    Upload a CSV file containing health data to generate insightful reports. Ensure that the file is
                    properly formatted for accurate analysis.
                  </p>
                </div>
                <CSVUpload onUploadComplete={handleCSVUploadComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
