"use client"

import { useTheme } from "@/client/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/client/components/ui/card"
import { Badge } from "@/client/components/ui/badge"
import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { Separator } from "@/client/components/ui/separator"
import { 
  AlertTriangle,
  Bell,
  BellOff,
  MapPin,
  Search,
  Target,
  Loader2,
  CloudRain,
  Wind,
  Snowflake,
  Zap,
  Thermometer,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Calendar,
  MapPinned,
  Radio,
  Shield,
  Sun,
  Moon,
  Compass,
  Cpu,
  Signal,
  RefreshCw
} from "lucide-react"

interface WeatherAlert {
  id: string
  event: string
  headline: string
  description: string
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown"
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown"
  start: number
  end: number
  senderName: string
  tags: string[]
}

interface AlertsData {
  alerts: WeatherAlert[]
  location: string
  country: string
  coord: { lat: number; lon: number }
  lastUpdated: string
}

export default function AlertsPage() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { isDarkMode, toggleDarkMode } = useTheme()

  const fetchAlerts = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data')
      const weatherData = await weatherResponse.json()

      const alertsResponse = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      let alerts: WeatherAlert[] = []
      
      if (alertsResponse.ok) {
        const alertsApiData = await alertsResponse.json()
        
        if (alertsApiData.alerts && alertsApiData.alerts.length > 0) {
          alerts = alertsApiData.alerts.map((alert: any, index: number) => ({
            id: `${alert.start}-${index}`,
            event: alert.event || "Weather Alert",
            headline: alert.event || "Weather Alert",
            description: alert.description || "No description available",
            severity: alert.tags?.[0] || "Unknown",
            urgency: "Expected",
            start: alert.start,
            end: alert.end,
            senderName: alert.sender_name || "Weather Service",
            tags: alert.tags || []
          }))
        }
      }

      setAlertsData({
        alerts: alerts,
        location: weatherData.name,
        country: weatherData.sys.country,
        coord: { lat, lon },
        lastUpdated: new Date().toISOString()
      })
      
      setCurrentLocation({ lat, lon })
      setLocationStatus('success')
    } catch (error) {
      console.error("Error fetching alerts:", error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      await fetchAlerts(data.coord.lat, data.coord.lon)
      setSearchCity("")
    } catch (error) {
      alert("City not found. Please try again.")
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('loading')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetchAlerts(latitude, longitude)
        },
        (error) => {
          console.error("Location error:", error)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
          fetchAlerts(40.7128, -74.0060)
        }
      )
    }
  }

  useEffect(() => {
    handleUseCurrentLocation()
  }, [])

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/25'
      case 'moderate':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/25'
      case 'minor':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/25'
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/25'
    }
  }

  const getSeverityBorder = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return 'border-l-rose-500'
      case 'moderate':
        return 'border-l-amber-500'
      case 'minor':
        return 'border-l-blue-500'
      default:
        return 'border-l-indigo-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return <AlertTriangle className="h-4 w-4" />
      case 'moderate':
        return <AlertCircle className="h-4 w-4" />
      case 'minor':
        return <Info className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertIcon = (event: string) => {
    const eventLower = event.toLowerCase()
    if (eventLower.includes('rain') || eventLower.includes('flood')) return <CloudRain className="h-6 w-6 text-blue-500 animate-bounce" />
    if (eventLower.includes('wind') || eventLower.includes('gale')) return <Wind className="h-6 w-6 text-cyan-500" />
    if (eventLower.includes('snow') || eventLower.includes('ice')) return <Snowflake className="h-6 w-6 text-sky-400" />
    if (eventLower.includes('thunder') || eventLower.includes('lightning')) return <Zap className="h-6 w-6 text-amber-500" />
    if (eventLower.includes('heat') || eventLower.includes('temperature')) return <Thermometer className="h-6 w-6 text-rose-500" />
    return <AlertTriangle className="h-6 w-6 text-rose-500" />
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = (endTimestamp: number): string => {
    const now = Date.now() / 1000
    const remaining = endTimestamp - now
    
    if (remaining < 0) return "Expired"
    
    const hours = Math.floor(remaining / 3600)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
    
    const minutes = Math.floor(remaining / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} left`
  }

  if (loading && !alertsData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Accessing safety broadcasting networks...</p>
          <p className="text-xs text-slate-400 mt-1">Checking severe warning databases...</p>
        </div>
      </div>
    )
  }

  if (!alertsData) return null

  const latCoord = alertsData.coord.lat
  const lonCoord = alertsData.coord.lon
  const activeCount = alertsData.alerts.length
  const highestSeverity = activeCount > 0 
    ? alertsData.alerts.map(a => a.severity).reduce((max, s) => {
        const ranks = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 }
        return ranks[s] > ranks[max] ? s : max
      }, "Unknown" as WeatherAlert["severity"])
    : "None"

  // Alarm Radar pulse expansion speed linked to count of active alerts
  const radarPulseSpeed = activeCount > 0 
    ? `${Math.max(1, Math.min(4, 5 / activeCount))}s`
    : '4s'

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Weather Broadcast Warnings
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                  <span className="truncate">{alertsData.location}, {alertsData.country}</span>
                </div>
                <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-450 border border-slate-200 dark:border-slate-800">
                  LAT: {latCoord.toFixed(4)}° LON: {alertsData.coord.lon.toFixed(4)}°
                </span>
                <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                {locationStatus === 'success' && (
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20 flex-shrink-0">
                    📍 Calibrated Location
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex items-center flex-1 sm:flex-initial sm:w-60">
                <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search weather sector..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/15 flex-shrink-0">
                Scan Sector
              </Button>
            </form>
            
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Locate station"
                >
                  <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                </Button>

                <Button
                  type="button"
                  onClick={() => fetchAlerts(latCoord, alertsData.coord.lon)}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Sync telemetry"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </Button>

                <Button
                  type="button"
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isDarkMode ? "Light Display" : "Dark Display"}
                >
                  {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: SVG Warning radar pulse beacon (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Compass className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Warning Radar Beacon</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                
                {/* SVG radar screen */}
                <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                  
                  {/* Radar concentric target circles */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="100" y1="8" x2="100" y2="192" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
                    <line x1="8" y1="100" x2="192" y2="100" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
                  </svg>

                  {/* Pulsing expand beacon waves */}
                  <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none flex items-center justify-center">
                    <div 
                      className={`absolute rounded-full border-2 transition-all opacity-0 ${
                        activeCount > 0 ? "border-rose-500/40 animate-radar-pulse" : "border-emerald-500/25 animate-radar-pulse"
                      }`}
                      style={{ animationDuration: radarPulseSpeed }}
                    />
                    <div 
                      className={`absolute rounded-full border-2 transition-all opacity-0 ${
                        activeCount > 0 ? "border-rose-500/40 animate-radar-pulse" : "border-emerald-500/25 animate-radar-pulse"
                      }`}
                      style={{ animationDuration: radarPulseSpeed, animationDelay: '1.2s' }}
                    />
                  </div>

                  {/* Center core readout */}
                  <div className="absolute w-[80px] h-[80px] bg-slate-950 rounded-full border border-slate-800 flex flex-col items-center justify-center shadow-md">
                    <span className={`text-3xl font-black tracking-tight leading-none ${activeCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {activeCount}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
                      WARNINGS
                    </span>
                    <span className="text-[9px] font-black text-indigo-400 mt-1 leading-none">
                      {activeCount > 0 ? "ACTIVE" : "NOMINAL"}
                    </span>
                  </div>

                  {/* HUD Labels */}
                  <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">BAND: WARN_RADIO</div>
                  <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: ALARM</div>

                </div>

                <div className="w-full text-center space-y-1 mt-2">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                    Broadcasting Station: {alertsData.alerts[0]?.senderName || "National Weather Authority"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                    Live telemetry link to regional safety watchcenters
                  </p>
                </div>

              </CardContent>
            </Card>

            {/* Notification controls card */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    notificationsEnabled 
                      ? "bg-indigo-600 text-white" 
                      : isDarkMode ? "bg-slate-800" : "bg-slate-100"
                  }`}>
                    {notificationsEnabled ? (
                      <Bell className="h-5 w-5 text-white" />
                    ) : (
                      <BellOff className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">Alert Notifications</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {notificationsEnabled ? "Broadcast audio active" : "Audio muted"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="rounded-lg text-[10px] font-black uppercase px-3"
                >
                  Toggle
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Statistics Grid & Active Alerts Stream (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Telemetry metadata statistics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stat 1: Location display */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-indigo-650">
                <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                  [ Target_Sector ]
                </div>
                <div className="text-base font-black text-slate-850 dark:text-slate-200 mt-2 truncate">
                  {alertsData.location}, {alertsData.country}
                </div>
              </div>

              {/* Stat 2: Highest severity */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-rose-500">
                <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                  [ Max_Severity_Level ]
                </div>
                <div className="text-base font-black text-rose-500 dark:text-rose-450 mt-2">
                  {highestSeverity}
                </div>
              </div>

              {/* Stat 3: Last updated date */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-cyan-500">
                <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                  [ Last_BroadCast_Sync ]
                </div>
                <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-2">
                  {new Date(alertsData.lastUpdated).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

            </div>

            {/* Active warnings feeds logs list */}
            {activeCount > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-200">
                  Active Emergency Alerts
                </h2>
                {alertsData.alerts.map((alert) => (
                  <Card key={alert.id} className={`border-l-4 ${getSeverityBorder(alert.severity)} ${
                    isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                  } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-250 dark:border-slate-850">
                            {getAlertIcon(alert.event)}
                          </div>
                          <div>
                            <CardTitle className="text-base font-black text-slate-800 dark:text-slate-100">{alert.headline}</CardTitle>
                            <CardDescription className="text-[10px] font-semibold text-slate-400 mt-0.5">
                              Broadcaster ID: {alert.senderName}
                            </CardDescription>
                          </div>
                        </div>

                        <Badge variant="outline" className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getSeverityColor(alert.severity)} flex items-center gap-1 w-fit`}>
                          {getSeverityIcon(alert.severity)}
                          <span>{alert.severity}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {alert.description}
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2 pt-3 border-t border-slate-100 dark:border-slate-850/50 text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-slate-450 uppercase text-[9px] font-black">Effective epoch</div>
                            <div className="font-extrabold text-slate-700 dark:text-slate-300">{formatDate(alert.start)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-slate-450 uppercase text-[9px] font-black">Expiration countdown</div>
                            <div className="font-extrabold text-slate-700 dark:text-slate-300">
                              {formatDate(alert.end)} <span className="text-rose-500 font-black">({getTimeRemaining(alert.end)})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {alert.tags && alert.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {alert.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-[9px] font-black font-mono">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* All Systems nominal check card */
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    {/* Ring animation */}
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" />
                    <CheckCircle className="h-10 w-10 text-emerald-500 relative z-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">All Systems Nominal</h3>
                  <p className="text-xs text-slate-450 font-semibold max-w-sm mt-1">
                    Broadcasting channels are active. There are currently no active weather alerts or emergency statements for this location.
                  </p>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Severity Scale indexes reference charts */}
        <Card className={`border ${
          isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
        } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-500" />
              <span>Standard Weather Alert Severity Scale</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl border flex flex-col justify-between h-24 hover:scale-[1.02] transition-all duration-300 bg-rose-500/10 border-rose-500/20 text-rose-500">
                <div className="text-base font-black">Extreme</div>
                <div>
                  <div className="font-extrabold text-[10px] uppercase">Severe threat to life</div>
                  <div className="text-[8px] font-bold text-slate-400">Immediate shelter required</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border flex flex-col justify-between h-24 hover:scale-[1.02] transition-all duration-300 bg-orange-500/10 border-orange-500/20 text-orange-500">
                <div className="text-base font-black">Severe</div>
                <div>
                  <div className="font-extrabold text-[10px] uppercase">Significant danger</div>
                  <div className="text-[8px] font-bold text-slate-400">Threat to property/activity</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border flex flex-col justify-between h-24 hover:scale-[1.02] transition-all duration-300 bg-amber-500/10 border-amber-500/20 text-amber-500">
                <div className="text-base font-black">Moderate</div>
                <div>
                  <div className="font-extrabold text-[10px] uppercase">Possible disruption</div>
                  <div className="text-[8px] font-bold text-slate-400">Minor caution recommended</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border flex flex-col justify-between h-24 hover:scale-[1.02] transition-all duration-300 bg-blue-500/10 border-blue-500/20 text-blue-500">
                <div className="text-base font-black">Minor</div>
                <div>
                  <div className="font-extrabold text-[10px] uppercase">Minimal impact</div>
                  <div className="text-[8px] font-bold text-slate-400">Standard weather advisory</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* Embedded CSS radar animations */}
      <style jsx>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.1); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
