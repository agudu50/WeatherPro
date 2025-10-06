"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"   // ✅ Add this line
import {
  Bell,
  Calendar,
  ChevronDown,
  Home,
  LineChart,
  Package2,
  Settings,
  ShoppingCart,
  Users,
  Cloud,
  Menu,
  X,
  MapPin,
  TrendingUp,
  Satellite,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  AlertTriangle,
  History,
  Eye
} from "lucide-react"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Weather-focused navigation
const navigation = [
  { name: "Weather Dashboard", href: "/dashboard", icon: Cloud },
  { name: "Weather Map", href: "/dashboard/weather-map", icon: MapPin },
  { name: "Hourly Forecast", href: "/dashboard/hourly", icon: TrendingUp },
  { name: "7-Day Forecast", href: "/dashboard/weekly", icon: Calendar },
  { name: "Radar & Satellite", href: "/dashboard/radar", icon: Satellite },
  { name: "Wind Conditions", href: "/dashboard/wind", icon: Wind },
  { name: "Temperature", href: "/dashboard/temperature", icon: Thermometer },
  { name: "Precipitation", href: "/dashboard/precipitation", icon: Droplets },
  { name: "UV Index", href: "/dashboard/uv-index", icon: Sun },
  { name: "Air Quality", href: "/dashboard/air-quality", icon: Activity },
  { name: "Weather Alerts", href: "/dashboard/alerts", icon: AlertTriangle, badge: "2" },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]
export default function DashboardLayout({ children }) {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r bg-gradient-to-b from-blue-50 to-blue-100 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b border-blue-200 px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-blue-800">
              <Cloud className="h-6 w-6 text-blue-600" />
              <span className="">Weather Pro</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8 border-blue-300 text-blue-600 hover:bg-blue-200">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-blue-700 transition-all hover:text-blue-900 hover:bg-blue-200 ${
                      isActive ? "bg-blue-200 text-blue-900 font-medium" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="text-white">Weather Pro</CardTitle>
                <CardDescription className="text-blue-100">
                  Get detailed weather insights and professional forecasting tools.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <div className="text-xs text-blue-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Data Source:</span>
                    <span>OpenWeatherMap</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updates:</span>
                    <span>Every 10 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage:</span>
                    <span>Global</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold text-blue-800 mb-4"
                >
                  <Cloud className="h-6 w-6 text-blue-600" />
                  <span>Weather Pro</span>
                </Link>
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-blue-700 hover:text-blue-900 hover:bg-blue-200 ${
                        isActive ? "bg-blue-200 text-blue-900 font-medium" : ""
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search weather data..."
                  className="w-full appearance-none bg-white/50 backdrop-blur-sm border border-blue-200 rounded-md pl-8 pr-4 py-2 text-blue-900 placeholder:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm md:w-2/3 lg:w-1/3"
                />
                <div className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full bg-blue-100 hover:bg-blue-200">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@user" />
                  <AvatarFallback className="bg-blue-500 text-white">WU</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border-blue-200">
              <DropdownMenuLabel className="text-blue-900">Weather User</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-blue-700 hover:bg-blue-50">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-blue-700 hover:bg-blue-50">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-blue-700 hover:bg-blue-50">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}