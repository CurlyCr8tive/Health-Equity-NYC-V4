"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Menu,
  Home,
  Map,
  Heart,
  BookOpen,
  Leaf,
  Upload,
  Download,
  User,
  LogOut,
  Users,
  FileText,
  HelpCircle,
  Wind,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Navigation items for community users
const mainNavItems = [
  {
    title: "Community Dashboard",
    url: "/",
    icon: Home,
    description: "View health data for your neighborhood",
  },
  {
    title: "Interactive Map",
    url: "/#map",
    icon: Map,
    description: "Explore health conditions and environmental factors in NYC",
  },
  {
    title: "Common Health Issues",
    url: "/#conditions",
    icon: Heart,
    description: "Learn about prevalent health conditions",
  },
  {
    title: "Common Environment Concerns",
    url: "/#environmental",
    icon: Wind,
    description: "Explore environmental health factors affecting communities",
  },
]

const resourceItems = [
  {
    title: "Health Resources",
    url: "/health-education",
    icon: BookOpen,
    description: "Health tips and educational materials",
  },
  {
    title: "Environmental Health",
    url: "/environmental-education",
    icon: Leaf,
    description: "How environment affects your health",
  },
  {
    title: "Get Help",
    url: "/help",
    icon: HelpCircle,
    description: "Find local health services and support",
  },
]

const toolsItems = [
  {
    title: "Share Your Data",
    url: "/profile#upload",
    icon: Upload,
    description: "Upload community health data",
  },
  {
    title: "Download Reports",
    url: "/profile#reports",
    icon: Download,
    description: "Get health reports for your area",
  },
]

export function HamburgerNav() {
  const [user, setUser] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      setIsOpen(false)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleNavigation = (url: string) => {
    if (url.includes("#")) {
      const [path, hash] = url.split("#")
      if (pathname === path || (path === "/" && pathname === "/")) {
        // If we're already on the page, just scroll to the section
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
      } else {
        // Navigate to the page first, then scroll
        router.push(url)
      }
    } else {
      router.push(url)
    }
    setIsOpen(false)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getUserRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Health Administrator"
      case "worker":
        return "Community Health Worker"
      default:
        return "Community Member"
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Health Equity NYC</h2>
              <p className="text-sm text-muted-foreground">Community Dashboard</p>
            </div>
          </div>
        </div>

        {/* User Info - Fixed */}
        <div className="flex-shrink-0">
          {user ? (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm font-medium">{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{getUserRoleDisplay(user.role)}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {user.role === "admin" ? "Admin" : user.role === "worker" ? "Worker" : "Member"}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-b">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Welcome to Health Equity NYC</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    router.push("/login")
                    setIsOpen(false)
                  }}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Main Navigation</h3>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive =
                    pathname === item.url || (item.url.includes("#") && pathname === item.url.split("#")[0])
                  return (
                    <button
                      key={item.title}
                      onClick={() => handleNavigation(item.url)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            <Separator />

            {/* Health Resources */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Health Resources</h3>
              <nav className="space-y-1">
                {resourceItems.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <button
                      key={item.title}
                      onClick={() => handleNavigation(item.url)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        isActive ? "bg-green-100 text-green-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            <Separator />

            {/* Community Tools */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Community Tools</h3>
              <nav className="space-y-1">
                {toolsItems.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavigation(item.url)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Admin Tools (if admin) */}
            {user?.role === "admin" && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3 px-2">Administration</h3>
                  <nav className="space-y-1">
                    <button
                      onClick={() => handleNavigation("/admin/users")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                    >
                      <Users className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Manage Users</p>
                        <p className="text-xs text-muted-foreground">User accounts and permissions</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleNavigation("/admin/reports")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">System Reports</p>
                        <p className="text-xs text-muted-foreground">Platform analytics and usage</p>
                      </div>
                    </button>
                  </nav>
                </div>
              </>
            )}

            {/* Add some bottom padding for better scrolling */}
            <div className="h-4" />
          </div>
        </ScrollArea>

        {/* Fixed Footer Actions */}
        <div className="border-t p-4 space-y-2 flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => handleNavigation("/profile")}
                className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">Profile & Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="text-center text-xs text-muted-foreground">Sign in to access all features</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
