"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { BarChart3, BookOpen, Brain, Leaf, LogOut, Map, User, Users, FileText, Upload, Download } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
    description: "Main analytics dashboard",
  },
  {
    title: "Interactive Map",
    url: "/dashboard#map",
    icon: Map,
    description: "Geographic health data visualization",
  },
  {
    title: "Top Conditions",
    url: "/dashboard#top-conditions",
    icon: Brain,
    description: "Analysis of prevalent health conditions",
  },
]

const educationItems = [
  {
    title: "Health Education",
    url: "/health-education",
    icon: BookOpen,
    description: "Health resources and information",
  },
  {
    title: "Environmental Education",
    url: "/environmental-education",
    icon: Leaf,
    description: "Environmental health resources",
  },
]

const toolsItems = [
  {
    title: "Upload Data",
    url: "/profile#upload",
    icon: Upload,
    description: "Upload CSV health data",
  },
  {
    title: "Download Reports",
    url: "/profile#reports",
    icon: Download,
    description: "Download analysis reports",
  },
]

export function AppSidebar() {
  const [user, setUser] = useState(null)
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
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleNavigation = (url: string) => {
    if (url.includes("#")) {
      const [path, hash] = url.split("#")
      if (pathname === path) {
        // If we're already on the page, just scroll to the section
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      } else {
        // Navigate to the page first, then scroll
        router.push(url)
      }
    } else {
      router.push(url)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">NYC Health Equity</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={pathname === item.url || (item.url.includes("#") && pathname === item.url.split("#")[0])}
                    tooltip={item.description}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Education Resources */}
        <SidebarGroup>
          <SidebarGroupLabel>Education</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {educationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.url)}
                    isActive={pathname === item.url}
                    tooltip={item.description}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tools & Data */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools & Data</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => handleNavigation(item.url)} tooltip={item.description}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Tools (if admin) */}
        {user?.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/admin/users")} tooltip="Manage user accounts">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/admin/reports")} tooltip="View system reports">
                      <FileText className="h-4 w-4" />
                      <span>System Reports</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{user ? getUserInitials(user.name) : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate">{user?.name || "Loading..."}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.role === "admin" ? "Administrator" : "Health Worker"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile#reports")}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Reports</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
