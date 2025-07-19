"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Heart, AlertCircle, Play, Pause } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleVideo = () => {
    const video = document.getElementById("hero-video") as HTMLVideoElement
    if (video) {
      if (isVideoPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Video Section at Top */}
      <div className="relative w-full h-80 md:h-96 lg:h-[500px] overflow-hidden">
        <video
          id="hero-video"
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/placeholder.svg?height=500&width=1200"
        >
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I_need_a_202507141957_2t247-vLnVhEEOUaLmavHMbkjZvGAIC8EpqE.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-green-600" />
        </video>

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Video Controls */}
        <Button
          onClick={toggleVideo}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white border-white/20"
          aria-label={isVideoPlaying ? "Pause video" : "Play video"}
        >
          {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* Header Content Over Video */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">NYC Health Equity</h1>
                <p className="text-lg text-white/90 drop-shadow">Community Dashboard</p>
              </div>
            </div>
            <p className="text-white/90 drop-shadow text-lg max-w-2xl mx-auto px-4">
              Access health data and resources for your community
            </p>
          </div>
        </div>
      </div>

      {/* Login Form Section with Light Blue Background */}
      <div className="bg-blue-50 min-h-[calc(100vh-500px)] flex items-center justify-center p-8 pt-12">
        <div className="w-full max-w-md space-y-6">
          {/* Login Form */}
          <Card className="shadow-2xl border-0 bg-white">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign in to access community health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Quick Demo Access */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-3">Quick Demo Access:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail("admin@healthequity.nyc")
                      setPassword("admin123")
                    }}
                    className="text-xs"
                  >
                    Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail("worker@healthequity.nyc")
                      setPassword("worker123")
                    }}
                    className="text-xs"
                  >
                    Worker
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmail("resident@healthequity.nyc")
                      setPassword("resident123")
                    }}
                    className="text-xs"
                  >
                    Resident
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 space-y-1">
            <p>NYC Health Equity Dashboard</p>
            <p>Empowering communities with health data and resources</p>
          </div>
        </div>
      </div>
    </div>
  )
}
