"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Wind, 
  Navigation, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Gauge,
  Compass,
  ArrowRight,
  Info
} from "lucide-react"

interface WindData {
  current: {
    speed: number
    direction: number
    gust: number
    location: string
    country: string
    beaufortScale: number
    pressure: number
  }
  hourly: Array<{
    time: string
    speed: number
    direction: number
    gust: number
  }>
  daily: Array<{
    day: string
    avgSpeed: number
    maxSpeed: number
    direction: string
    gustMax: number
  }>
  alerts: Array<{
    type: string
    message: string
    severity: string
  }>
  coord: { lat: number; lon: number }
}

export default function WindPage() {
  const [windData, setWindData] = useState<WindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<"kmh" | "mph" | "ms">("kmh")
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const calculateBeaufortScale = (speedKmh: number): number => {
    if (speedKmh < 1) return 0
    if (speedKmh < 6) return 1
    if (speedKmh < 12) return 2
    if (speedKmh < 20) return 3
    if (speedKmh < 29) return 4
    if (speedKmh < 39) return 5
    if (speedKmh < 50) return 6
    if (speedKmh < 62) return 7
    if (speedKmh < 75) return 8
    if (speedKmh < 89) return 9
    if (speedKmh < 103) return 10
    if (speedKmh < 118) return 11
    return 12
  }

  const fetchWindData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather for wind data
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Fetch forecast data
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Process hourly data
      const hourlyData = forecastData.list.slice(0, 24).map((item: any) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
        speed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
        direction: item.wind.deg,
        gust: Math.round((item.wind.gust || item.wind.speed * 1.5) * 3.6)
      }))

      // Process daily data (group by day)
      const dailyMap: { [key: string]: any[] } = {}
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = []
        }
        dailyMap[dateKey].push(item)
      })

      const dailyData = Object.keys(dailyMap).slice(0, 7).map((dateKey) => {
        const dayData = dailyMap[dateKey]
        const speeds = dayData.map(d => d.wind.speed * 3.6)
        const gusts = dayData.map(d => (d.wind.gust || d.wind.speed * 1.5) * 3.6)
        const directions = dayData.map(d => d.wind.deg)
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          avgSpeed: Math.round(speeds.reduce((a, b) => a + b) / speeds.length),
          maxSpeed: Math.round(Math.max(...speeds)),
          direction: getDirectionName(Math.round(directions.reduce((a, b) => a + b) / directions.length)),
          gustMax: Math.round(Math.max(...gusts))
        }
      })

      const windSpeed = Math.round(currentData.wind.speed * 3.6)
      const gustSpeed = Math.round((currentData.wind.gust || currentData.wind.speed * 1.5) * 3.6)

      // Check for wind alerts
      const alerts = []
      if (windSpeed > 40 || gustSpeed > 60) {
        alerts.push({
          type: "Wind Advisory",
          message: `Strong winds with gusts up to ${gustSpeed} km/h expected`,
          severity: windSpeed > 60 ? "high" : "moderate"
        })
      }

      setWindData({
        current: {
          speed: windSpeed,
          direction: currentData.wind.deg,
          gust: gustSpeed,
          location: currentData.name,
          country: currentData.sys.country,
          beaufortScale: calculateBeaufortScale(windSpeed),
          pressure: currentData.main.pressure
        },
        hourly: hourlyData,
        daily: dailyData,
        alerts,
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching wind data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWindData(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWindData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWindData(51.5074, -0.1278) // Fallback to London
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      setCurrentLocation({ lat: data.coord.lat, lon: data.coord.lon })
      await fetchWindData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const convertSpeed = (speed: number) => {
    if (unit === "mph") return Math.round(speed * 0.621371)
    if (unit === "ms") return Math.round(speed * 0.277778)
    return speed
  }

  const getSpeedUnit = () => {
    if (unit === "mph") return "mph"
    if (unit === "ms") return "m/s"
    return "km/h"
  }

  const getDirectionName = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return directions[Math.round(degrees / 22.5) % 16]
  }

  const getBeaufortDescription = (scale: number) => {
    const descriptions = [
      "Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze",
      "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Strong gale",
      "Storm", "Violent storm", "Hurricane"
    ]
    return descriptions[Math.min(scale, 12)]
  }

  const getWindColor = (speed: number, dark: boolean) => {
    if (speed < 10) return dark ? "text-emerald-400" : "text-emerald-600"
    if (speed < 20) return dark ? "text-amber-400" : "text-amber-600"
    if (speed < 40) return dark ? "text-orange-400" : "text-orange-600"
    return dark ? "text-rose-400" : "text-rose-600"
  }

  const getWindBg = (speed: number, dark: boolean) => {
    if (speed < 10) return dark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-100 border-emerald-250 text-emerald-700"
    if (speed < 20) return dark ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-amber-100 border-amber-250 text-amber-700"
    if (speed < 40) return dark ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-orange-100 border-orange-250 text-orange-700"
    return dark ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-rose-100 border-rose-250 text-rose-700"
  }

  if (loading && !windData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-blue-600'
          } animate-spin mx-auto mb-4`} />
          <p className="text-xl font-bold tracking-tight">Loading wind data...</p>
        </div>
      </div>
    )
  }

  // Calculate dynamic weekly scale maximum for the bar displays
  const maxWeeklySpeed = windData ? Math.max(...windData.daily.map(d => d.maxSpeed), 35) : 35

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
              <Wind className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Wind Conditions
              </h1>
              {windData && (
                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>{windData.current.location}, {windData.current.country}</span>
                  {locationStatus === 'success' && (
                    <Badge variant="outline" className={`text-xs font-bold px-2 py-0.5 border ${
                      isDarkMode 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      📍 Detected Location
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controller Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchCity} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex items-center w-full sm:w-64">
                <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 font-semibold text-xs tracking-wide">
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <Button
                type="button"
                onClick={getUserLocation}
                variant="outline"
                size="icon"
                className={`rounded-xl border h-10 w-10 ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Use My Location"
              >
                <Target className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                onClick={() => currentLocation && fetchWindData(currentLocation.lat, currentLocation.lon)}
                variant="outline"
                size="icon"
                className={`rounded-xl border h-10 w-10 ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
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
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
              </Button>
            </div>

            {/* Unit Segment */}
            <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-xl p-1 gap-1">
              {(["kmh", "mph", "ms"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    unit === u
                      ? isDarkMode
                        ? "bg-slate-850 text-white shadow-sm"
                        : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {u === "kmh" ? "km/h" : u === "mph" ? "mph" : "m/s"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Warning Alerts */}
        {windData && windData.alerts.length > 0 && (
          <div className={`p-4 rounded-2xl border ${
            isDarkMode 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } flex items-start gap-3 shadow-sm`}>
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              {windData.alerts.map((alert, index) => (
                <div key={`alert-${index}`} className="text-sm font-medium">
                  <span className="font-bold uppercase tracking-wider text-xs mr-2">{alert.type}:</span>
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard Panel */}
        {windData && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* COMPASS COMPONENT */}
            <Card className={`border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-blue-500" />
                  <span>Compass Dial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 pb-8">
                
                {/* Advanced Avionics Rotating Vane */}
                <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6">
                  <svg className="w-full h-full select-none" viewBox="0 0 200 200">
                    
                    {/* Ring Outlines */}
                    <circle cx="100" cy="100" r="95" className="stroke-slate-200 dark:stroke-slate-800" fill="none" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="85" className="stroke-slate-200/50 dark:stroke-slate-800/50" fill="none" strokeWidth="1" />
                    <circle cx="100" cy="100" r="77" className="stroke-slate-100 dark:stroke-slate-900/60" fill="none" strokeWidth="1" />
                    
                    {/* Concentric Ticks every 15 degrees */}
                    {Array.from({ length: 24 }).map((_, i) => {
                      const degree = i * 15
                      const rad = (degree * Math.PI) / 180
                      const rOuter = 85
                      const rInner = i % 2 === 0 ? 77 : 81
                      const x1 = 100 + rOuter * Math.sin(rad)
                      const y1 = 100 - rOuter * Math.cos(rad)
                      const x2 = 100 + rInner * Math.sin(rad)
                      const y2 = 100 - rInner * Math.cos(rad)
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          className={
                            i % 6 === 0
                              ? "stroke-slate-400 dark:stroke-slate-500"
                              : "stroke-slate-200 dark:stroke-slate-800"
                          }
                          strokeWidth={i % 6 === 0 ? "2" : "1"}
                        />
                      )
                    })}

                    {/* Cardinal Labels */}
                    <text x="100" y="24" textAnchor="middle" dominantBaseline="central" className="text-[14px] font-black fill-slate-800 dark:fill-slate-100">N</text>
                    <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[14px] font-black fill-slate-800 dark:fill-slate-100">E</text>
                    <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[14px] font-black fill-slate-800 dark:fill-slate-100">S</text>
                    <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[14px] font-black fill-slate-800 dark:fill-slate-100">W</text>

                    {/* Ordinal Labels */}
                    <text x="151" y="49" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-extrabold fill-slate-400 dark:fill-slate-600">NE</text>
                    <text x="151" y="151" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-extrabold fill-slate-400 dark:fill-slate-600">SE</text>
                    <text x="49" y="151" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-extrabold fill-slate-400 dark:fill-slate-600">SW</text>
                    <text x="49" y="49" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-extrabold fill-slate-400 dark:fill-slate-600">NW</text>

                    {/* Active Rotation Indicator Arrow */}
                    <g 
                      style={{ 
                        transform: `rotate(${windData.current.direction}deg)`, 
                        transformOrigin: '100px 100px', 
                        transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                      }}
                    >
                      {/* Arrow Pointer Vane */}
                      <path 
                        d="M100,28 L106,50 L102,48 L100,26 L98,48 L94,50 Z" 
                        className="fill-blue-500 dark:fill-blue-400" 
                      />
                      {/* Grey Counter-weight Tail */}
                      <path 
                        d="M100,172 L105,152 L100,154 L95,152 Z" 
                        className="fill-slate-400 dark:fill-slate-600" 
                      />
                      {/* Vane Stem */}
                      <line 
                        x1="100" 
                        y1="50" 
                        x2="100" 
                        y2="152" 
                        className="stroke-slate-300 dark:stroke-slate-700" 
                        strokeWidth="1.5" 
                        strokeDasharray="3,3" 
                      />
                    </g>

                    {/* Central Status Overlay */}
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="36" 
                      className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-800" 
                      strokeWidth="1.5" 
                    />
                    <text x="100" y="92" textAnchor="middle" dominantBaseline="central" className="text-2xl font-black fill-slate-900 dark:fill-white">
                      {convertSpeed(windData.current.speed)}
                    </text>
                    <text x="100" y="109" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold uppercase tracking-wider fill-slate-400 dark:fill-slate-500">
                      {getSpeedUnit()}
                    </text>
                    <text x="100" y="121" textAnchor="middle" dominantBaseline="central" className="text-xs font-extrabold fill-blue-500 dark:fill-blue-400">
                      {getDirectionName(windData.current.direction)}
                    </text>
                  </svg>
                </div>
                
                {/* Secondary metadata summary */}
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Direction {windData.current.direction}°
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                    Angle measured clockwise from North
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ANALYTICS CONTAINER */}
            <Card className={`md:col-span-1 xl:col-span-2 border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Real-time Wind Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                
                {/* Visual statistics grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Gauge 1: Beaufort Force Circular Indicator */}
                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } flex flex-col items-center text-center justify-between min-h-[190px] hover:border-blue-500/30 transition-all duration-300`}>
                    <div className="flex items-center gap-1.5 self-start text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Compass className="h-4 w-4 text-blue-500" />
                      <span>Beaufort Scale</span>
                    </div>
                    
                    <div className="relative w-24 h-24 my-2">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-slate-200 dark:stroke-slate-850"
                          strokeWidth="6.5"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="stroke-blue-500 transition-all duration-1000 ease-out"
                          strokeWidth="6.5"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 * (1 - Math.min(windData.current.beaufortScale, 12) / 12)}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                        <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-3xl font-black fill-slate-900 dark:fill-white">
                          {windData.current.beaufortScale}
                        </text>
                        <text x="50" y="70" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold uppercase tracking-wider fill-slate-400 dark:fill-slate-500">
                          Force
                        </text>
                      </svg>
                    </div>
                    
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {getBeaufortDescription(windData.current.beaufortScale)}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Range F0 to F12
                      </div>
                    </div>
                  </div>

                  {/* Gauge 2: Wind Gust Progress Widget */}
                  {(() => {
                    const gustVal = windData.current.gust
                    const maxGustLimit = 120
                    const gustPercentage = Math.min((gustVal / maxGustLimit) * 100, 100)
                    return (
                      <div className={`p-5 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      } flex flex-col justify-between min-h-[190px] hover:border-rose-500/30 transition-all duration-300`}>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Activity className="h-4 w-4 text-rose-500" />
                          <span>Wind Gusts</span>
                        </div>
                        
                        <div className="my-2 text-left">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-4xl font-black text-rose-500 tracking-tight">
                              {convertSpeed(gustVal)}
                            </span>
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">
                              {getSpeedUnit()}
                            </span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${gustPercentage}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            <span>0</span>
                            <span>60 Gale</span>
                            <span>120 Max</span>
                          </div>
                        </div>
                        
                        <div>
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${
                            gustVal > 60 
                              ? isDarkMode ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                              : gustVal > 30
                                ? isDarkMode ? 'bg-amber-500/10 text-amber-405 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                                : isDarkMode ? 'bg-slate-800 text-slate-350 border-slate-700/50' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {gustVal > 60 ? "⚠️ High Vane Gust" : gustVal > 30 ? "⚡ Moderate Gusts" : "✓ Light Vane Activity"}
                          </span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Gauge 3: Barometric Pressure Needle Widget */}
                  {(() => {
                    const pressure = windData.current.pressure
                    const minP = 960
                    const maxP = 1060
                    const pressurePercentage = Math.min(Math.max(((pressure - minP) / (maxP - minP)) * 100, 0), 100)
                    return (
                      <div className={`p-5 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      } flex flex-col justify-between min-h-[190px] hover:border-purple-500/30 transition-all duration-300`}>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Gauge className="h-4 w-4 text-purple-500" />
                          <span>Atm. Pressure</span>
                        </div>
                        
                        <div className="my-2 text-left">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-4xl font-black text-purple-505 tracking-tight">
                              {pressure}
                            </span>
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                              hPa
                            </span>
                          </div>
                          
                          <div className="relative w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mb-1.5">
                            {/* Marker Needle */}
                            <div 
                              className="absolute top-0 bottom-0 w-1.5 bg-purple-500 border border-white dark:border-slate-950 rounded-full transition-all duration-1000 ease-out transform -translate-x-1/2"
                              style={{ left: `${pressurePercentage}%` }}
                            />
                            {/* Standard pressure marker */}
                            <div 
                              className="absolute top-0 bottom-0 w-[1.5px] bg-slate-400 dark:bg-slate-600"
                              style={{ left: `${((1013.25 - minP) / (maxP - minP)) * 100}%` }}
                              title="Standard pressure: 1013.25 hPa"
                            />
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            <span>960 Low</span>
                            <span>1013 Standard</span>
                            <span>1060 High</span>
                          </div>
                        </div>
                        
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                          {pressure < 1009 ? "Cyclonic System (Stormy)" : pressure > 1018 ? "Anticyclonic System (Dry)" : "Barometric Normal State"}
                        </div>
                      </div>
                    )
                  })()}

                </div>

              </CardContent>
            </Card>

          </div>
        )}

        {/* 24-Hour Stream Scroll Container */}
        {windData && (
          <Card className={`border ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>24-Hour Hourly Wind Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-350 dark:scrollbar-thumb-slate-750 hover:scrollbar-thumb-slate-450">
                {windData.hourly.map((hour, index) => {
                  return (
                    <div 
                      key={`hourly-wind-${index}`} 
                      className={`flex-shrink-0 w-24 p-3.5 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.04] hover:shadow-sm ${
                        isDarkMode 
                          ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="text-[11px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase mb-2">
                        {hour.time}
                      </div>
                      
                      <div className="relative w-8 h-8 mx-auto my-2.5 flex items-center justify-center">
                        <Navigation 
                          className="h-5 w-5 text-blue-550 dark:text-blue-400"
                          style={{ transform: `rotate(${hour.direction}deg)` }}
                        />
                        <span className="absolute text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 px-0.5 animate-none" style={{ transform: 'translate(0px, 12px)' }}>
                          {getDirectionName(hour.direction)}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className={`text-lg font-extrabold ${getWindColor(hour.speed, isDarkMode)}`}>
                          {convertSpeed(hour.speed)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                          {getSpeedUnit()}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-xs text-slate-450 dark:text-slate-500">
                        <span className="font-semibold text-rose-500/90 dark:text-rose-450">Gust: {convertSpeed(hour.gust)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Forecast Grid & Beaufort reference */}
        {windData && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* 7-Day Wind Forecast */}
            <Card className={`md:col-span-1 xl:col-span-2 border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <span>7-Day Wind Range Forecast</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-3">
                  {windData.daily.map((day, index) => {
                    const avgPercent = (day.avgSpeed / maxWeeklySpeed) * 100
                    const maxPercent = (day.maxSpeed / maxWeeklySpeed) * 100
                    return (
                      <div 
                        key={`daily-wind-${index}`} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-900/20 border-slate-800/80 hover:bg-slate-900/40 hover:border-slate-700' 
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-350'
                        } gap-4`}
                      >
                        {/* Day & Direction Badge */}
                        <div className="flex items-center gap-3 w-full sm:w-36">
                          <div className="w-12 text-sm font-bold text-slate-705 dark:text-slate-300">
                            {day.day}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Navigation 
                              className="h-3.5 w-3.5 text-blue-550 dark:text-blue-400"
                              style={{ transform: `rotate(${day.direction === "N" ? 0 : day.direction === "NE" ? 45 : day.direction === "E" ? 90 : day.direction === "SE" ? 135 : day.direction === "S" ? 180 : day.direction === "SW" ? 225 : day.direction === "W" ? 270 : 315}deg)` }}
                            />
                            <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 border-slate-300/30">
                              {day.direction}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Interactive Range Slider bar */}
                        <div className="flex-grow flex flex-col justify-center">
                          <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full">
                            {/* Track bar representing wind range */}
                            <div 
                              className="absolute h-full bg-blue-500 dark:bg-blue-400 rounded-full" 
                              style={{ left: `${avgPercent}%`, width: `${maxPercent - avgPercent}%` }}
                            />
                            {/* Current Point Dot */}
                            <div 
                              className="absolute w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-300 border border-white dark:border-slate-950 -translate-y-1/4"
                              style={{ left: `${avgPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-bold mt-1.5">
                            <span>Avg: {convertSpeed(day.avgSpeed)} {getSpeedUnit()}</span>
                            <span>Max: {convertSpeed(day.maxSpeed)} {getSpeedUnit()}</span>
                          </div>
                        </div>
                        
                        {/* Peak Gust Badge */}
                        <div className="w-full sm:w-44 text-right flex items-center justify-between sm:justify-end gap-2">
                          <span className="sm:hidden text-xs text-slate-400 font-semibold">Peak Gust:</span>
                          <Badge className={`${getWindBg(day.gustMax, isDarkMode)} border text-xs font-bold px-2 py-0.5`}>
                            Gust: {convertSpeed(day.gustMax)} {getSpeedUnit()}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Beaufort Wind Reference Panel */}
            <Card className={`border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Info className="h-5 w-5 text-blue-500" />
                  <span>Beaufort Reference</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-4">
                  {[
                    { scale: "F0 - F3", name: "Calm to Gentle", speed: "0-19 km/h", desc: "Leaves rustle, flags wave.", color: "emerald", label: "Light" },
                    { scale: "F4 - F5", name: "Moderate to Fresh", speed: "20-38 km/h", desc: "Small branches move, trees sway.", color: "amber", label: "Active" },
                    { scale: "F6 - F8", name: "Strong to Gale", speed: "39-74 km/h", desc: "Umbrellas difficult, walking resistance.", color: "orange", label: "Gale Alert" },
                    { scale: "F9 - F12", name: "Storm to Hurricane", speed: "75-118+ km/h", desc: "Uprooted trees, structural damage.", color: "rose", label: "Danger" }
                  ].map((item, index) => {
                    const isDark = isDarkMode
                    const colorClasses = item.color === 'emerald' ? (isDark ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50') :
                                         item.color === 'amber' ? (isDark ? 'border-amber-500/25 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50') :
                                         item.color === 'orange' ? (isDark ? 'border-orange-500/25 bg-orange-500/5' : 'border-orange-200 bg-orange-50/50') :
                                         (isDark ? 'border-rose-500/25 bg-rose-500/5' : 'border-rose-200 bg-rose-50/50')
                                         
                    const badgeClasses = item.color === 'emerald' ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-550/20' : 'bg-emerald-100 text-emerald-800 border-emerald-250') :
                                         item.color === 'amber' ? (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-550/20' : 'bg-amber-100 text-amber-800 border-amber-250') :
                                         item.color === 'orange' ? (isDark ? 'bg-orange-500/20 text-orange-400 border-orange-550/20' : 'bg-orange-100 text-orange-800 border-orange-250') :
                                         (isDark ? 'bg-rose-500/20 text-rose-400 border-rose-550/20' : 'bg-rose-100 text-rose-805 border-rose-250')
                    
                    return (
                      <div key={`beaufort-${index}`} className={`p-4.5 rounded-2xl border transition-all duration-300 ${colorClasses}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-black tracking-tight">{item.scale}</span>
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${badgeClasses}`}>
                            {item.label}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">{item.name}</h4>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{item.speed}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

      </div>
    </div>
  )
}