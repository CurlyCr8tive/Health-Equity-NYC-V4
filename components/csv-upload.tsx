"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, CheckCircle, AlertTriangle, Brain, BarChart3, Download, X, Loader2 } from "lucide-react"
import type { CSVAnalysisResult } from "@/types"

interface CSVUploadProps {
  onClose: () => void
  onUploadComplete: (analysis: CSVAnalysisResult) => void
}

function CSVUpload({ onClose, onUploadComplete }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<CSVAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Please select a valid CSV file")
      }
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError("Please select a valid CSV file")
      }
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      // Upload file
      const uploadResponse = await fetch("/api/upload/csv", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file")
      }

      setProgress(100)
      setUploading(false)
      setAnalyzing(true)

      // Analyze the uploaded CSV
      const analysisResponse = await fetch("/api/ai/analyze-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
        }),
      })

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze CSV data")
      }

      const analysisResult = await analysisResponse.json()
      setAnalysis(analysisResult)
      setAnalyzing(false)
    } catch (err: any) {
      setError(err.message || "An error occurred during upload")
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const handleComplete = () => {
    if (analysis) {
      onUploadComplete(analysis)
    }
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV for AI Analysis
          </DialogTitle>
          <DialogDescription>
            Upload your health or environmental data CSV file for comprehensive AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!file && !analysis && (
            <>
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                <p className="text-gray-600 mb-4">Drag and drop your CSV file here, or click to browse</p>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <input id="csv-file-input" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
              </div>

              {/* File Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• File must be in CSV format (.csv)</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Include column headers in the first row</li>
                  <li>• Recommended columns: location, condition, rate, demographic, date</li>
                  <li>• Data will be processed securely and privately</li>
                </ul>
              </div>
            </>
          )}

          {file && !analysis && (
            <>
              {/* File Info */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{file.name}</h3>
                      <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={uploading || analyzing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {(uploading || analyzing) && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{uploading ? "Uploading..." : "Analyzing with AI..."}</span>
                      <span className="text-sm text-gray-600">{uploading ? `${progress}%` : "Processing"}</span>
                    </div>
                    <Progress value={uploading ? progress : undefined} className="h-2" />
                    {analyzing && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">
                          AI is analyzing your data for patterns and insights...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!uploading && !analyzing && (
                  <div className="mt-4">
                    <Button onClick={handleUpload} className="w-full">
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {analysis && (
            <>
              {/* Analysis Results */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Analysis Complete</h3>
                </div>

                {/* Summary */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">AI Analysis Summary</h4>
                  <p className="text-gray-700 text-sm">{analysis.summary}</p>
                </div>

                {/* Data Quality */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Data Quality Assessment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Completeness</span>
                        <span className="text-sm font-medium">{analysis.dataQuality.completeness}%</span>
                      </div>
                      <Progress value={analysis.dataQuality.completeness} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Accuracy</span>
                        <span className="text-sm font-medium">{analysis.dataQuality.accuracy}%</span>
                      </div>
                      <Progress value={analysis.dataQuality.accuracy} className="h-2" />
                    </div>
                  </div>
                  {analysis.dataQuality.issues.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-2">Data Issues Found:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analysis.dataQuality.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Key Insights */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">AI Recommendations</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visualizations */}
                {analysis.visualizations.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Generated Visualizations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.visualizations.map((viz, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{viz.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {viz.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">Visualization ready for dashboard integration</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {analysis ? "Close" : "Cancel"}
            </Button>
            {analysis && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    /* Download analysis */
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button onClick={handleComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use Analysis
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CSVUpload
export { CSVUpload }
