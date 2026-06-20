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
  Info,
  Signal,
  Cpu,
  AlertCircle
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
          message: `Strong winds with gusts up to ${gustSpeed} km/h expected in this sector`,
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
    if (speed < 10) return dark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
    if (speed < 20) return dark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-700"
    if (speed < 40) return dark ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-orange-55 border-orange-250 text-orange-700"
    return dark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-250 text-rose-700"
  }

  if (loading && !windData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing anemometer data...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to weather stations...</p>
        </div>
      </div>
    )
  }

  const maxWeeklySpeed = windData ? Math.max(...windData.daily.map(d => d.maxSpeed), 35) : 35
  const activeSpeedVal = windData ? windData.current.speed : 15
  
  // Math duration for dynamic wind compass particles: duration in seconds
  // Higher speed = shorter duration (faster spin/flow)
  const flowDuration = activeSpeedVal > 0 
    ? `${Math.max(0.6, Math.min(6, 40 / activeSpeedVal))}s`
    : '0s'

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
              <Wind className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Wind Conditions
              </h1>
              {windData && (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-rose-500 animate-pulse" />
                  <span>{windData.current.location}, {windData.current.country}</span>
                  <span className="text-slate-350 dark:text-slate-700">|</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-450 border border-slate-200 dark:border-slate-800">
                    BEARING: {windData.current.direction}° ({getDirectionName(windData.current.direction)})
                  </span>
                  {locationStatus === 'success' && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20">
                      📍 Detected Station
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controller Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchCity} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex items-center w-full sm:w-60">
                <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search weather station..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/15">
                Scan Station
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
                title="Locate station"
              >
                <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
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
                title="Sync scanner"
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

            {/* Speed Unit Segment */}
            <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-xl p-1 gap-1">
              {(["kmh", "mph", "ms"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                    unit === u
                      ? isDarkMode
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-500 hover:text-slate-900"
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

        {/* Main Grid Layout */}
        {windData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Compass Console Column (4 columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Compass className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Wind Flow Compass</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  
                  {/* High Tech SVG Compass Face */}
                  <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                    
                    {/* Concentric rings */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Compass Ticks */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const deg = i * 15
                        const rad = (deg * Math.PI) / 180
                        const outerR = 92
                        const innerR = i % 6 === 0 ? 84 : 88
                        const x1 = 100 + outerR * Math.sin(rad)
                        const y1 = 100 - outerR * Math.cos(rad)
                        const x2 = 100 + innerR * Math.sin(rad)
                        const y2 = 100 - innerR * Math.cos(rad)
                        return (
                          <line 
                            key={i} 
                            x1={x1} y1={y1} x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth={i % 6 === 0 ? "1.5" : "0.75"} 
                          />
                        )
                      })}

                      {/* Direction labels */}
                      <text x="100" y="24" textAnchor="middle" dominantBaseline="central" className="text-[12px] font-black fill-indigo-400/80">N</text>
                      <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[12px] font-black fill-indigo-400/80">E</text>
                      <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[12px] font-black fill-indigo-400/80">S</text>
                      <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[12px] font-black fill-indigo-400/80">W</text>
                    </svg>

                    {/* Wind Vector Flow Line Animations */}
                    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                      <svg 
                        className="w-full h-full transition-transform duration-1000 ease-out" 
                        viewBox="0 0 200 200"
                        style={{ transform: `rotate(${windData.current.direction}deg)` }}
                      >
                        {/* Flow streaks drifting from top to bottom (along rotation vector) */}
                        <path 
                          d="M 50,-10 C 60,30 40,70 50,110 M 150,30 C 160,70 140,110 150,150 M 90,10 C 100,50 80,90 90,130" 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                          className="wind-flow-streaks"
                          style={{ animationDuration: flowDuration }}
                        />
                      </svg>
                    </div>

                    {/* Navigation Pointer Needle */}
                    <div 
                      className="absolute inset-0 pointer-events-none transition-transform duration-[1200ms] ease-out"
                      style={{ transform: `rotate(${windData.current.direction}deg)` }}
                    >
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* Arrow Pointer */}
                        <path d="M100,16 L105,38 L101.5,36 L100,15 L98.5,36 L95,38 Z" fill="#f43f5e" />
                        {/* Counter balance */}
                        <path d="M100,184 L104,166 L100,168 L96,166 Z" fill="#64748b" />
                        {/* Stem grid */}
                        <line x1="100" y1="38" x2="100" y2="166" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                      </svg>
                    </div>

                    {/* Core HUD readout circle */}
                    <div className="absolute w-[80px] h-[80px] bg-slate-950 rounded-full border border-slate-800 flex flex-col items-center justify-center shadow-md">
                      <span className="text-2xl font-black text-white tracking-tight leading-none">
                        {convertSpeed(windData.current.speed)}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
                        {getSpeedUnit()}
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-400 mt-1 leading-none">
                        {getDirectionName(windData.current.direction)}
                      </span>
                    </div>

                    {/* Telemetry labels */}
                    <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: SCAN</div>
                    <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">{windData.current.direction}° DEG</div>

                  </div>

                  {/* Compass metrics readout */}
                  <div className="w-full text-center space-y-1 mt-2">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                      Bearing Angle: {windData.current.direction}°
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                      Wind blowing directly from the {getDirectionName(windData.current.direction)}
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Metrics Dashboard Column (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Telemetry widgets grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Wind Turbine simulator */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Signal className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Turbine Simulator</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-between min-h-[220px]">
                    
                    {/* SVG Wind Turbine */}
                    <div className="relative w-full h-[100px] flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 200 130" className="w-full h-full text-slate-350 dark:text-slate-700">
                        {/* Tower base structure */}
                        <path d="M97,130 L103,130 L101,65 L99,65 Z" fill="currentColor" opacity="0.6" />
                        <line x1="94" y1="130" x2="106" y2="130" stroke="currentColor" strokeWidth="2" />
                        
                        {/* Core Hub */}
                        <circle cx="100" cy="65" r="4" fill="currentColor" />

                        {/* Rotor Blades Group with rotation animation */}
                        <g 
                          className="turbine-rotor"
                          style={{ 
                            animationDuration: activeSpeedVal > 1 
                              ? `${Math.max(0.4, 40 / activeSpeedVal)}s`
                              : '0s'
                          }}
                        >
                          {/* Blade 1 (facing top) */}
                          <path d="M100,65 Q102,40 100,10 Q98,40 100,65" fill="currentColor" opacity="0.9" />
                          {/* Blade 2 (facing bottom-right) */}
                          <g transform="rotate(120 100 65)">
                            <path d="M100,65 Q102,40 100,10 Q98,40 100,65" fill="currentColor" opacity="0.9" />
                          </g>
                          {/* Blade 3 (facing bottom-left) */}
                          <g transform="rotate(240 100 65)">
                            <path d="M100,65 Q102,40 100,10 Q98,40 100,65" fill="currentColor" opacity="0.9" />
                          </g>
                        </g>
                      </svg>
                    </div>

                    {/* Speeds summary */}
                    <div className="w-full text-center space-y-1 mt-3">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Rotor Activity Status
                      </div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {activeSpeedVal > 30 ? "⚠️ Heavy Spin / Warning" : activeSpeedVal > 12 ? "⚡ Steady Rotation" : activeSpeedVal > 2 ? "✓ Light Rotation" : "Static State"}
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Beaufort scale radial progress */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Beaufort Force Tracker</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-between min-h-[220px]">
                    
                    {/* SVG Radial Progress */}
                    <div className="relative w-[100px] h-[100px]">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                        <circle 
                          cx="50" cy="50" r="41" 
                          fill="none" stroke="#6366f1" 
                          strokeWidth="6.5" 
                          strokeLinecap="round" 
                          strokeDasharray={257.6}
                          strokeDashoffset={257.6 * (1 - Math.min(windData.current.beaufortScale, 12) / 12)}
                          transform="rotate(-90 50 50)"
                          className="transition-all duration-1000 ease-out"
                        />
                        <text x="50" y="48" textAnchor="middle" dominantBaseline="central" className="text-2xl font-black fill-slate-950 dark:fill-white">
                          F{windData.current.beaufortScale}
                        </text>
                        <text x="50" y="66" textAnchor="middle" dominantBaseline="central" className="text-[9px] font-black uppercase text-slate-450 tracking-wider">
                          scale
                        </text>
                      </svg>
                    </div>

                    {/* Force labels */}
                    <div className="w-full text-center space-y-1 mt-3">
                      <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {getBeaufortDescription(windData.current.beaufortScale)}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">
                        Beaufort Range Scale: F0 - F12
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Wind Gusts progress card */}
                {(() => {
                  const gustSpeed = windData.current.gust
                  const maxLimit = 120
                  const percentage = Math.min((gustSpeed / maxLimit) * 100, 100)
                  return (
                    <Card className={`border ${
                      isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                    } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Activity className="h-4.5 w-4.5 text-rose-500" />
                          <span>Wind Gust Monitor</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col justify-between min-h-[220px]">
                        
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-rose-500 tracking-tight">
                              {convertSpeed(gustSpeed)}
                            </span>
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">
                              {getSpeedUnit()}
                            </span>
                          </div>
                          
                          {/* Linear progress tracking */}
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 font-black tracking-widest mt-1">
                            <span>0 MIN</span>
                            <span>60 GALE</span>
                            <span>120 MAX</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-150 dark:border-slate-850">
                          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            gustSpeed > 60
                              ? 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                              : gustSpeed > 30
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-850'
                          }`}>
                            {gustSpeed > 60 ? "🚨 HIGH GUST HAZARD" : gustSpeed > 30 ? "⚡ MODERATE GUSTS" : "✓ CALM ATMOSPHERE"}
                          </span>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Barometric Pressure Gauge */}
                {(() => {
                  const pressure = windData.current.pressure
                  const minP = 960
                  const maxP = 1060
                  const percentage = Math.min(Math.max(((pressure - minP) / (maxP - minP)) * 100, 0), 100)
                  return (
                    <Card className={`border ${
                      isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                    } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Gauge className="h-4.5 w-4.5 text-purple-500" />
                          <span>Atmospheric Pressure</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col justify-between min-h-[220px]">
                        
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between">
                            <span className="text-3xl font-black text-purple-500 tracking-tight">
                              {pressure}
                            </span>
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">
                              hPa
                            </span>
                          </div>
                          
                          {/* Linear progress track with needle indicator */}
                          <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full mt-2">
                            <div 
                              className="absolute top-0 bottom-0 w-1.5 bg-purple-500 border border-white dark:border-slate-900 rounded-full transition-all duration-1000 transform -translate-x-1/2"
                              style={{ left: `${percentage}%` }}
                            />
                            {/* Normal standard pressure tick */}
                            <div 
                              className="absolute top-0 bottom-0 w-[1.5px] bg-slate-350 dark:bg-slate-700"
                              style={{ left: `${((1013.25 - minP) / (maxP - minP)) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-550 font-black tracking-widest mt-1">
                            <span>960 LOW</span>
                            <span>1013 STD</span>
                            <span>1060 HIGH</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-150 dark:border-slate-850 text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                          {pressure < 1009 ? "Cyclonic System (Storm / Rain)" : pressure > 1018 ? "Anticyclonic System (Sunny / Dry)" : "Barometric Standard State"}
                        </div>

                      </CardContent>
                    </Card>
                  )
                })()}

              </div>

            </div>
          </div>
        )}

        {/* 24-Hour Stream Scroll Ribbon */}
        {windData && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>24-Hour Wind Velocity Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-indigo-500/20 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {windData.hourly.map((hour, idx) => {
                  return (
                    <div 
                      key={`hourly-wind-${idx}`} 
                      className={`flex-shrink-0 w-24 p-3.5 rounded-xl border text-center transition-all duration-300 hover:scale-[1.03] ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-850 hover:border-slate-700' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">
                        {hour.time}
                      </div>
                      
                      <div className="relative w-8 h-8 mx-auto my-3 flex items-center justify-center">
                        <Navigation 
                          className="h-5.5 w-5.5 text-indigo-500 dark:text-indigo-400 transition-transform duration-700"
                          style={{ transform: `rotate(${hour.direction}deg)` }}
                        />
                        <span className="absolute text-[8px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-1 rounded transform translate-y-3">
                          {getDirectionName(hour.direction)}
                        </span>
                      </div>

                      <div className="mt-4 space-y-0.5">
                        <div className={`text-lg font-black tracking-tight ${getWindColor(hour.speed, isDarkMode)}`}>
                          {convertSpeed(hour.speed)}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
                          {getSpeedUnit()}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850/50 text-[10px] font-bold text-slate-450 dark:text-slate-500 leading-none">
                        Gust: <span className="font-extrabold text-rose-500/90 dark:text-rose-400">{convertSpeed(hour.gust)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Forecast & Beaufort References */}
        {windData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* 7-Day Forecast (8 Columns) */}
            <div className="lg:col-span-8">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wind className="h-5 w-5 text-indigo-500" />
                    <span>7-Day Wind Range Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3.5">
                    {windData.daily.map((day, idx) => {
                      const avgPercent = (day.avgSpeed / maxWeeklySpeed) * 100
                      const maxPercent = (day.maxSpeed / maxWeeklySpeed) * 100
                      return (
                        <div 
                          key={`daily-wind-${idx}`} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          } gap-4`}
                        >
                          {/* Day details */}
                          <div className="flex items-center gap-3 w-full sm:w-36 flex-shrink-0">
                            <span className="w-12 text-sm font-black text-slate-700 dark:text-slate-300">
                              {day.day}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Navigation 
                                className="h-4 w-4 text-indigo-500 dark:text-indigo-400"
                                style={{ transform: `rotate(${day.direction === "N" ? 0 : day.direction === "NE" ? 45 : day.direction === "E" ? 90 : day.direction === "SE" ? 135 : day.direction === "S" ? 180 : day.direction === "SW" ? 225 : day.direction === "W" ? 270 : 315}deg)` }}
                              />
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-slate-300/40 dark:border-slate-800">
                                {day.direction}
                              </Badge>
                            </div>
                          </div>

                          {/* Range slider tracks */}
                          <div className="flex-grow flex flex-col justify-center">
                            <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full">
                              <div 
                                className="absolute h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" 
                                style={{ left: `${avgPercent}%`, width: `${Math.max(4, maxPercent - avgPercent)}%` }}
                              />
                              <div 
                                className="absolute w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-300 border border-white dark:border-slate-950 -translate-y-1/4"
                                style={{ left: `${avgPercent}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5">
                              <span>Avg: {convertSpeed(day.avgSpeed)} {getSpeedUnit()}</span>
                              <span>Max: {convertSpeed(day.maxSpeed)} {getSpeedUnit()}</span>
                            </div>
                          </div>

                          {/* Peak gust values */}
                          <div className="w-full sm:w-40 text-right flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                            <span className="sm:hidden text-xs text-slate-400 font-semibold">Peak Gust:</span>
                            <Badge className={`${getWindBg(day.gustMax, isDarkMode)} border text-[10px] font-black py-0.5 px-2`}>
                              GUST: {convertSpeed(day.gustMax)} {getSpeedUnit()}
                            </Badge>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Beaufort Wind Reference (4 Columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-500" />
                    <span>Beaufort Reference</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    {[
                      { scale: "F0 - F3", name: "Calm to Gentle", speed: "0-19 km/h", desc: "Leaves rustle, flags wave.", color: "emerald", label: "Light" },
                      { scale: "F4 - F5", name: "Moderate to Fresh", speed: "20-38 km/h", desc: "Small branches move, trees sway.", color: "amber", label: "Active" },
                      { scale: "F6 - F8", name: "Strong to Gale", speed: "39-74 km/h", desc: "Umbrellas difficult, walking resistance.", color: "orange", label: "Gale Alert" },
                      { scale: "F9 - F12", name: "Storm to Hurricane", speed: "75-118+ km/h", desc: "Uprooted trees, structural damage.", color: "rose", label: "Danger" }
                    ].map((item, idx) => {
                      const isDark = isDarkMode
                      const colorClasses = item.color === 'emerald' ? (isDark ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50') :
                                           item.color === 'amber' ? (isDark ? 'border-amber-500/25 bg-amber-500/5' : 'border-amber-200 bg-amber-50/50') :
                                           item.color === 'orange' ? (isDark ? 'border-orange-500/25 bg-orange-500/5' : 'border-orange-200 bg-orange-50/50') :
                                           (isDark ? 'border-rose-500/25 bg-rose-500/5' : 'border-rose-200 bg-rose-50/50')
                                           
                      const badgeClasses = item.color === 'emerald' ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200') :
                                           item.color === 'amber' ? (isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200') :
                                           item.color === 'orange' ? (isDark ? 'bg-orange-500/15 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-700 border-orange-200') :
                                           (isDark ? 'bg-rose-500/15 text-rose-450 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200')
                      
                      return (
                        <div key={`beaufort-${idx}`} className={`p-4 rounded-xl border transition-all duration-300 ${colorClasses}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black tracking-tight">{item.scale}</span>
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider py-0.5 px-2 ${badgeClasses}`}>
                              {item.label}
                            </Badge>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-0.5">{item.name}</h4>
                          <div className="text-[10px] font-black text-slate-450 dark:text-slate-500 mb-2">{item.speed}</div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </div>

      {/* Embedded CSS animations for Wind Flow Streaks and Turbine Rotation */}
      <style jsx>{`
        .wind-flow-streaks {
          stroke-dasharray: 20, 80;
          animation: flowAnim 3s linear infinite;
        }
        @keyframes flowAnim {
          from { stroke-dashoffset: 150; }
          to { stroke-dashoffset: -150; }
        }
        
        .turbine-rotor {
          transform-origin: 100px 65px;
          animation: spinAnim linear infinite;
        }
        @keyframes spinAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}