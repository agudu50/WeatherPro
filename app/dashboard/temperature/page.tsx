"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Thermometer, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Droplets,
  Eye,
  Gauge,
  Signal,
  Cpu,
  AlertCircle,
  Activity,
  Info
} from "lucide-react"

interface TemperatureData {
  current: {
    temperature: number
    feelsLike: number
    high: number
    low: number
    location: string
    country: string
    humidity: number
    visibility: number
    pressure: number
  }
  hourly: Array<{
    time: string
    temperature: number
    feelsLike: number
  }>
  daily: Array<{
    day: string
    high: number
    low: number
    trend: "up" | "down" | "stable"
  }>
  extremes: {
    recordHigh: { temp: number; date: string }
    recordLow: { temp: number; date: string }
    avgHigh: number
    avgLow: number
  }
  coord: { lat: number; lon: number }
}

export default function TemperaturePage() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius")
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchTemperatureData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather
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
        temperature: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like)
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

      const dailyData = Object.keys(dailyMap).slice(0, 7).map((dateKey, index) => {
        const dayData = dailyMap[dateKey]
        const temps = dayData.map(d => d.main.temp)
        const high = Math.round(Math.max(...temps))
        const low = Math.round(Math.min(...temps))
        
        // Calculate trend
        let trend: "up" | "down" | "stable" = "stable"
        if (index > 0) {
          const prevDayKey = Object.keys(dailyMap)[index - 1]
          const prevDayData = dailyMap[prevDayKey]
          const prevTemps = prevDayData.map(d => d.main.temp)
          const prevAvg = prevTemps.reduce((a, b) => a + b) / prevTemps.length
          const currentAvg = temps.reduce((a, b) => a + b) / temps.length
          
          if (currentAvg > prevAvg + 2) trend = "up"
          else if (currentAvg < prevAvg - 2) trend = "down"
        }
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          high,
          low,
          trend
        }
      })

      // Calculate averages for extremes
      const allTemps = forecastData.list.map((item: any) => item.main.temp)
      const avgHigh = Math.round(Math.max(...allTemps))
      const avgLow = Math.round(Math.min(...allTemps))

      setTemperatureData({
        current: {
          temperature: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          high: Math.round(currentData.main.temp_max),
          low: Math.round(currentData.main.temp_min),
          location: currentData.name,
          country: currentData.sys.country,
          humidity: currentData.main.humidity,
          visibility: Math.round(currentData.visibility / 1000), // Convert to km
          pressure: currentData.main.pressure
        },
        hourly: hourlyData,
        daily: dailyData,
        extremes: {
          recordHigh: { 
            temp: avgHigh + 8, 
            date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          recordLow: { 
            temp: avgLow - 12, 
            date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          avgHigh,
          avgLow
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching temperature data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchTemperatureData(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchTemperatureData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchTemperatureData(51.5074, -0.1278) // Fallback to London
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
      await fetchTemperatureData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const convertTemp = (temp: number): number => {
    if (unit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  const getTemperatureColor = (temp: number, dark: boolean): string => {
    if (temp <= 0) return dark ? "text-blue-400" : "text-blue-600"
    if (temp <= 10) return dark ? "text-sky-400" : "text-sky-600"
    if (temp <= 22) return dark ? "text-emerald-400" : "text-emerald-600"
    if (temp <= 30) return dark ? "text-amber-400" : "text-amber-605"
    return dark ? "text-rose-400" : "text-rose-600"
  }

  const getTemperatureBg = (temp: number, dark: boolean): string => {
    if (temp <= 0) return dark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"
    if (temp <= 10) return dark ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-700"
    if (temp <= 22) return dark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
    if (temp <= 30) return dark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-250 text-amber-700"
    return dark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-250 text-rose-700"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable", dark: boolean) => {
    switch(trend) {
      case "up": return <TrendingUp className={`h-4 w-4 ${dark ? 'text-rose-400' : 'text-rose-600'}`} />
      case "down": return <TrendingDown className={`h-4 w-4 ${dark ? 'text-sky-400' : 'text-sky-600'}`} />
      default: return <Minus className={`h-4 w-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`} />
    }
  }

  if (loading && !temperatureData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing thermal telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to temperature sensors...</p>
        </div>
      </div>
    )
  }

  const latCoord = temperatureData?.coord.lat ?? 51.5074
  const lonCoord = temperatureData?.coord.lon ?? -0.1278
  const currentTemp = temperatureData ? temperatureData.current.temperature : 15
  
  // Calculate limits for range slider
  const maxWeeklyTemp = temperatureData ? Math.max(...temperatureData.daily.map(d => d.high), 35) : 35
  const minWeeklyTemp = temperatureData ? Math.min(...temperatureData.daily.map(d => d.low), -5) : -5
  const tempSpanRange = maxWeeklyTemp - minWeeklyTemp

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <Thermometer className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Temperature Analysis
              </h1>
              {temperatureData && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{temperatureData.current.location}, {temperatureData.current.country}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-450 border border-slate-200 dark:border-slate-800">
                    LAT: {latCoord.toFixed(4)}° LON: {lonCoord.toFixed(4)}°
                  </span>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  {locationStatus === 'success' && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20 flex-shrink-0">
                      📍 System Calibrated Location
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controller Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchCity} className="flex gap-2 w-full sm:w-auto">
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
                  onClick={() => currentLocation && fetchTemperatureData(currentLocation.lat, currentLocation.lon)}
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

              {/* Units Segment */}
              <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-xl p-1 gap-1 flex-shrink-0">
                <button
                  onClick={() => setUnit("celsius")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                    unit === "celsius"
                      ? isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={() => setUnit("fahrenheit")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                    unit === "fahrenheit"
                      ? isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  °F
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        {temperatureData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Console Column: Temperature Gauge (4 columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Thermometer className="h-4.5 w-4.5 text-indigo-500" />
                    <span>SVG Thermal Gauge</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  
                  {/* High Tech SVG Thermosphere Dial */}
                  <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                    
                    {/* Concentric Coordinate rings */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Scale Marks (-20 to 50 deg limit) */}
                      {Array.from({ length: 15 }).map((_, i) => {
                        const angle = i * 24 - 168
                        const rad = (angle * Math.PI) / 180
                        const outerR = 92
                        const innerR = i % 2 === 0 ? 82 : 86
                        const x1 = 100 + outerR * Math.cos(rad)
                        const y1 = 100 + outerR * Math.sin(rad)
                        const x2 = 100 + innerR * Math.cos(rad)
                        const y2 = 100 + innerR * Math.sin(rad)
                        return (
                          <line 
                            key={i} 
                            x1={x1} y1={y1} x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth={i % 2 === 0 ? "1.5" : "0.75"} 
                          />
                        )
                      })}

                      {/* Scale numbers */}
                      <text x="32" y="150" textAnchor="middle" className="fill-indigo-400/40 font-mono text-[8px] font-bold">-20°</text>
                      <text x="25" y="90" textAnchor="middle" className="fill-indigo-400/40 font-mono text-[8px] font-bold">0°</text>
                      <text x="56" y="32" textAnchor="middle" className="fill-indigo-400/40 font-mono text-[8px] font-bold">20°</text>
                      <text x="144" y="32" textAnchor="middle" className="fill-indigo-400/40 font-mono text-[8px] font-bold">40°</text>
                      <text x="175" y="90" textAnchor="middle" className="fill-indigo-400/40 font-mono text-[8px] font-bold">50°</text>
                    </svg>

                    {/* Colored Active Temperature Progress Ring */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* Ring tracking current temperature */}
                        {/* Map temperature range -20 to 50 (70 degree span) to arc angle (from -168 to 168 degrees) */}
                        {(() => {
                          const minT = -20
                          const maxT = 50
                          const tVal = Math.min(Math.max(currentTemp, minT), maxT)
                          const ratio = (tVal - minT) / (maxT - minT)
                          const arcDash = 245 * 0.72 // span length
                          
                          // Determine stroke color
                          let strokeColor = '#3b82f6' // cold
                          if (currentTemp > 25) strokeColor = '#ef4444' // hot
                          else if (currentTemp > 18) strokeColor = '#f59e0b' // warm
                          else if (currentTemp > 10) strokeColor = '#10b981' // mild

                          return (
                            <circle 
                              cx="100" cy="100" r="76"
                              fill="none" 
                              stroke={strokeColor}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={477.5}
                              strokeDashoffset={477.5 - (arcDash * ratio)}
                              transform="rotate(130 100 100)"
                              className="transition-all duration-[1200ms] ease-out opacity-80"
                            />
                          )
                        })()}
                      </svg>
                    </div>

                    {/* Central HUD Digital Readout */}
                    <div className="absolute w-[80px] h-[80px] bg-slate-950 rounded-full border border-slate-800 flex flex-col items-center justify-center shadow-md">
                      <span className={`text-3xl font-black tracking-tight leading-none ${getTemperatureColor(currentTemp, true)}`}>
                        {convertTemp(currentTemp)}°
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-1">
                        {unit === "celsius" ? "celsius" : "fahrenheit"}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-400 mt-1 leading-none">
                        FEELS {convertTemp(temperatureData.current.feelsLike)}°
                      </span>
                    </div>

                    {/* corner hardware indicators */}
                    <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: SCANNER</div>
                    <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">THERMO_CORE v4.0</div>

                  </div>

                  {/* Secondary descriptor */}
                  <div className="w-full text-center space-y-1 mt-2">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                      Sector: {temperatureData.current.location}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                      Barometric Temp range calibrated to weather coordinates
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Metrics Dashboard Column (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Analytics widgets grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                
                {/* Metric 1: Today's High */}
                <div className={`p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      [ High_Track ]
                    </span>
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="text-lg font-black text-rose-500 tracking-tight">
                    {convertTemp(temperatureData.current.high)}°
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">
                    Maximum Peak Today
                  </span>
                </div>

                {/* Metric 2: Today's Low */}
                <div className={`p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      [ Low_Track ]
                    </span>
                    <TrendingDown className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="text-lg font-black text-sky-500 tracking-tight">
                    {convertTemp(temperatureData.current.low)}°
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">
                    Minimum Floor Today
                  </span>
                </div>

                {/* Metric 3: Humidity */}
                <div className={`p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      [ Moisture ]
                    </span>
                    <Droplets className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-lg font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
                    {temperatureData.current.humidity}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">
                    Relative Humidity
                  </span>
                </div>

                {/* Metric 4: Visibility */}
                <div className={`p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      [ Visibility ]
                    </span>
                    <Eye className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-lg font-black text-purple-500 tracking-tight">
                    {temperatureData.current.visibility} <span className="text-xs">km</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500">
                    Horizontal Visibility
                  </span>
                </div>

              </div>

              {/* 24-Hour Temperature Chart */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Activity className="h-4.5 w-4.5 text-indigo-500" />
                    <span>24-Hour Temperature Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-6">
                  
                  {/* Micro Bar graph */}
                  <div className={`h-36 rounded-xl flex items-end justify-around p-3.5 border ${
                    isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {temperatureData.hourly.slice(0, 12).map((hour, idx) => {
                      // Normalize temperature range between -15°C and 45°C (60 deg range) for visual height representation
                      const minVal = -15
                      const maxVal = 45
                      const val = Math.min(Math.max(hour.temperature, minVal), maxVal)
                      const height = ((val - minVal) / (maxVal - minVal)) * 100
                      
                      return (
                        <div key={`temp-chart-${idx}`} className="flex flex-col items-center flex-1 max-w-[28px]">
                          <span className={`text-[10px] font-black font-mono mb-1 ${getTemperatureColor(hour.temperature, isDarkMode)}`}>
                            {convertTemp(hour.temperature)}°
                          </span>
                          <div 
                            className={`w-3.5 rounded-t transition-all duration-500 border ${getTemperatureBg(hour.temperature, isDarkMode)}`}
                            style={{ height: `${Math.max(height, 8)}px` }}
                          />
                          <span className="text-[9px] font-black text-slate-450 dark:text-slate-550 uppercase mt-1.5 font-mono">
                            {hour.time.replace(" AM", "").replace(" PM", "")}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Horizontal Scroll Ribbon */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-500/20 dark:scrollbar-thumb-slate-850">
                    {temperatureData.hourly.map((hour, idx) => (
                      <div 
                        key={`temp-hourly-${idx}`} 
                        className={`flex-shrink-0 w-[84px] p-2.5 rounded-xl border text-center transition-all duration-300 hover:scale-[1.03] ${
                          isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-mono text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase">
                          {hour.time}
                        </div>
                        <div className={`text-base font-black mt-1 ${getTemperatureColor(hour.temperature, isDarkMode)}`}>
                          {convertTemp(hour.temperature)}°
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                          Feels {convertTemp(hour.feelsLike)}°
                        </div>
                      </div>
                    ))}
                  </div>

                </CardContent>
              </Card>
              
            </div>

          </div>
        )}

        {/* 7-Day Forecast & Records section */}
        {temperatureData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            
            {/* 7-Day Forecast (7 Columns) */}
            <div className="lg:col-span-8">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-indigo-500" />
                    <span>7-Day Temperature Range Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3">
                    {temperatureData.daily.map((day, idx) => {
                      const lowPercent = ((day.low - minWeeklyTemp) / tempSpanRange) * 100
                      const rangePercent = ((day.high - day.low) / tempSpanRange) * 100
                      
                      return (
                        <div 
                          key={`temp-daily-${idx}`} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-350'
                          } gap-4`}
                        >
                          {/* Day details */}
                          <div className="flex items-center gap-3 w-full sm:w-36 flex-shrink-0">
                            <span className="w-12 text-sm font-black text-slate-705 dark:text-slate-300">
                              {day.day}
                            </span>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(day.trend, isDarkMode)}
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-slate-300/40 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
                                {day.trend}
                              </Badge>
                            </div>
                          </div>

                          {/* Range slider tracks */}
                          <div className="flex-grow flex flex-col justify-center">
                            <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full">
                              <div 
                                className="absolute h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" 
                                style={{ left: `${lowPercent}%`, width: `${Math.max(4, rangePercent)}%` }}
                              />
                              <div 
                                className="absolute w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-300 border border-white dark:border-slate-950 -translate-y-1/4"
                                style={{ left: `${lowPercent + rangePercent / 2}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5">
                              <span>Low: {convertTemp(day.low)}°</span>
                              <span>High: {convertTemp(day.high)}°</span>
                            </div>
                          </div>

                          {/* Range gap badge */}
                          <div className="w-full sm:w-36 text-right flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                            <span className="sm:hidden text-xs text-slate-400 font-semibold">Variance:</span>
                            <Badge className={`${getTemperatureBg(day.high, isDarkMode)} border text-[10px] font-black py-0.5 px-2`}>
                              RANGE: {convertTemp(day.high - day.low)}°
                            </Badge>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Averages & Extremes Panel (4 Columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Info className="h-5 w-5 text-indigo-500" />
                    <span>Records & Averages</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    
                    {/* Record High */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                            [ Record_High ]
                          </div>
                          <div className="text-lg font-black text-rose-500 mt-2">
                            {convertTemp(temperatureData.extremes.recordHigh.temp)}°
                          </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse mt-1" />
                      </div>
                      <div className="font-mono text-[9px] text-slate-450 dark:text-slate-500 font-bold">
                        DATE: {temperatureData.extremes.recordHigh.date.toUpperCase()}
                      </div>
                    </div>

                    {/* Record Low */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                            [ Record_Low ]
                          </div>
                          <div className="text-lg font-black text-sky-500 mt-2">
                            {convertTemp(temperatureData.extremes.recordLow.temp)}°
                          </div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse mt-1" />
                      </div>
                      <div className="font-mono text-[9px] text-slate-450 dark:text-slate-500 font-bold">
                        DATE: {temperatureData.extremes.recordLow.date.toUpperCase()}
                      </div>
                    </div>

                    {/* Average High */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300">
                      <div>
                        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                          [ Avg_High_Expected ]
                        </div>
                        <div className="text-lg font-black text-amber-500 mt-2">
                          {convertTemp(temperatureData.extremes.avgHigh)}°
                        </div>
                      </div>
                    </div>

                    {/* Average Low */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300">
                      <div>
                        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                          [ Avg_Low_Expected ]
                        </div>
                        <div className="text-lg font-black text-emerald-500 mt-2">
                          {convertTemp(temperatureData.extremes.avgLow)}°
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}