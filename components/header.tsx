"use client"

import { HamburgerNav } from "./hamburger-nav"
import { Heart } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-4">
          {/* Hamburger Menu */}
          <HamburgerNav />

          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
              <Heart className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Health Equity NYC</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Community Health Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right side - could add additional items here */}
        <div className="ml-auto flex items-center gap-2">{/* Future: notifications, user avatar, etc. */}</div>
      </div>
    </header>
  )
}
