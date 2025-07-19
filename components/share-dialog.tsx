"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Link,
  Download,
  Copy,
  Check,
  MessageSquare,
  Users,
  FileText,
  X,
} from "lucide-react"
import type { ShareableContent } from "@/types"

const FALLBACK_CONTENT: ShareableContent = {
  type: "analysis",
  title: "Health Equity NYC Analysis",
  description: "Community health insights and recommendations",
  data: null,
  filters: {},
  shareUrl: typeof window !== "undefined" ? window.location.href : "",
}

interface ShareDialogProps {
  content?: ShareableContent
  onClose: () => void
  open?: boolean
}

function ShareDialog({ content, onClose, open = true }: ShareDialogProps) {
  const safeContent = content ?? FALLBACK_CONTENT
  const [customMessage, setCustomMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [shareMethod, setShareMethod] = useState<"social" | "link" | "download">("social")

  const shareUrl =
    safeContent.shareUrl || (typeof window !== "undefined" ? window.location.href : FALLBACK_CONTENT.shareUrl)
  const shareTitle = safeContent.title || FALLBACK_CONTENT.title
  const shareDescription = safeContent.description || FALLBACK_CONTENT.description

  const handleClose = () => {
    setCustomMessage("")
    setCopied(false)
    setShareMethod("social")
    onClose()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleSocialShare = (platform: string) => {
    const message = customMessage || shareDescription
    const fullMessage = `${shareTitle}: ${message}`

    let url = ""

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}&url=${encodeURIComponent(shareUrl)}&hashtags=HealthEquity,NYC,CommunityHealth`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(fullMessage)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(message)}`
        break
      case "email":
        url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${fullMessage}\n\nView the full analysis: ${shareUrl}`)}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
    }
  }

  const handleDownloadReport = () => {
    const reportData = {
      title: shareTitle,
      description: shareDescription,
      content: safeContent.data,
      filters: safeContent.filters,
      shareUrl,
      generatedAt: new Date().toISOString(),
      customMessage,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `health-equity-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getContentTypeIcon = () => {
    switch (safeContent.type) {
      case "analysis":
        return <FileText className="h-5 w-5 text-purple-600" />
      case "map":
        return <Users className="h-5 w-5 text-green-600" />
      case "chart":
        return <Share2 className="h-5 w-5 text-blue-600" />
      default:
        return <Share2 className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Health Equity Analysis
            </DialogTitle>
            <button
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription>
            Share your health equity insights with community members, organizations, and stakeholders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              {getContentTypeIcon()}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{shareTitle}</h3>
                <p className="text-sm text-gray-600 mt-1">{shareDescription}</p>

                {safeContent.filters && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Analysis includes:</p>
                    <div className="flex flex-wrap gap-1">
                      {safeContent.filters.healthConditions?.map((condition) => (
                        <Badge key={condition} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                      {safeContent.filters.environmentalFactors?.map((factor) => (
                        <Badge key={factor} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                      {typeof safeContent.filters.borough === "string" && safeContent.filters.borough && (
                        <Badge variant="default" className="text-xs">
                          {safeContent.filters.borough}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setShareMethod("social")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                shareMethod === "social" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2 inline" />
              Social Media
            </button>
            <button
              onClick={() => setShareMethod("link")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                shareMethod === "link" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Link className="h-4 w-4 mr-2 inline" />
              Copy Link
            </button>
            <button
              onClick={() => setShareMethod("download")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                shareMethod === "download" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Download
            </button>
          </div>

          {shareMethod === "social" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message about this health equity analysis..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <Twitter className="h-4 w-4 mr-2 text-blue-500" />
                  Share on Twitter
                </button>
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                  Share on Facebook
                </button>
                <button
                  onClick={() => handleSocialShare("linkedin")}
                  className="flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                  Share on LinkedIn
                </button>
                <button
                  onClick={() => handleSocialShare("email")}
                  className="flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <Mail className="h-4 w-4 mr-2 text-gray-600" />
                  Share via Email
                </button>
              </div>
            </div>
          )}

          {shareMethod === "link" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Share Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Sharing Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Share with community organizations and health advocates</li>
                  <li>• Include in grant applications and funding proposals</li>
                  <li>• Present at community board meetings and health forums</li>
                  <li>• Use for policy advocacy and public health initiatives</li>
                </ul>
              </div>
            </div>
          )}

          {shareMethod === "download" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Download Options</label>
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadReport}
                    className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Complete Report (JSON)
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-start px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print Analysis
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Download Uses</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Include in grant applications and funding requests</li>
                  <li>• Share with healthcare providers and community partners</li>
                  <li>• Archive for longitudinal health tracking</li>
                  <li>• Use as evidence for policy advocacy efforts</li>
                </ul>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Close
            </button>
            {shareMethod === "social" && (
              <button
                onClick={() => handleSocialShare("twitter")}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <Share2 className="h-4 w-4 mr-2 inline" />
                Share Now
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ShareDialog }
export default ShareDialog
