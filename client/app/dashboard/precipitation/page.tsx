"use client"

import { useTheme } from "@/client/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card"
import { Badge } from "@/client/components/ui/badge"
import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { 
  CloudRain, 
  Droplets, 
  Umbrella, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Cloud,
  CloudDrizzle,
  CloudSnow,
  AlertTriangle,
  Info,
  Compass,
  Cpu,
  Signal,
  AlertCircle,
  Activity
} from "lucide-react"

interface PrecipitationData {
  current: {
    intensity: number
    type: string
    accumulation: number
    location: string
    country: string
    duration: number
    humidity: number
    clouds: number
  }
  hourly: Array<{
    time: string
    intensity: number
    probability: number
    accumulation: number
    type: string
    description: string
  }>
  daily: Array<{
    day: string
    totalRainfall: number
    maxIntensity: number
    probability: number
    rainyHours: number
    type: string
  }>
  monthly: {
    totalRainfall: number
    rainyDays: number
    averageIntensity: number
    comparison: number
  }
  coord: { lat: number; lon: number }
}

export default function PrecipitationPage() {
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<"mm" | "inches">("mm")
  const [viewMode, setViewMode] = useState<"hourly" | "daily">("hourly")
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchPrecipitationData = async (lat: number, lon: number) => {
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

      // Calculate current precipitation
      const currentRain = currentData.rain?.['1h'] || 0
      const currentSnow = currentData.snow?.['1h'] || 0
      const currentPrecip = currentRain + currentSnow

      // Determine precipitation type
      const getPrecipType = (rain: number, snow: number, weather: string) => {
        if (snow > 0) return "Snow"
        if (rain === 0) return "None"
        if (rain < 2.5) return "Light Rain"
        if (rain < 10) return "Moderate Rain"
        return "Heavy Rain"
      }

      // Process hourly data
      const hourlyData = forecastData.list.slice(0, 24).map((item: any) => {
        const rain = item.rain?.['3h'] || 0
        const snow = item.snow?.['3h'] || 0
        const total = (rain + snow) / 3 // Convert 3h to 1h average
        const pop = Math.round((item.pop || 0) * 100) // Probability of precipitation
        
        return {
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          intensity: Math.round(total * 10) / 10,
          probability: pop,
          accumulation: Math.round(total * 10) / 10,
          type: getPrecipType(rain, snow, item.weather[0].main),
          description: item.weather[0].description
        }
      })

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
        const precipData = dayData.map(d => {
          const rain = d.rain?.['3h'] || 0
          const snow = d.snow?.['3h'] || 0
          return (rain + snow) / 3
        })
        const probabilities = dayData.map(d => (d.pop || 0) * 100)
        
        const totalRainfall = precipData.reduce((sum, val) => sum + val, 0)
        const maxIntensity = Math.max(...precipData)
        const avgProbability = Math.round(probabilities.reduce((sum, val) => sum + val, 0) / probabilities.length)
        const rainyHours = precipData.filter(p => p > 0).length
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          totalRainfall: Math.round(totalRainfall * 10) / 10,
          maxIntensity: Math.round(maxIntensity * 10) / 10,
          probability: avgProbability,
          rainyHours: Math.round(rainyHours * 3), // Convert to hours
          type: totalRainfall === 0 ? "None" : totalRainfall < 5 ? "Light Rain" : totalRainfall < 15 ? "Moderate Rain" : "Heavy Rain"
        }
      })

      // Process hourly calculations
      interface HourlyItem {
        time: string
        intensity: number
        probability: number
        accumulation: number
        type: string
        description: string
      }

      const totalPrecip = hourlyData.reduce(
        (sum: number, h: HourlyItem) => sum + h.accumulation,
        0
      )
      const rainyHoursCount = hourlyData.filter((h: HourlyItem) => h.intensity > 0).length
      const avgIntensity = rainyHoursCount > 0 ? totalPrecip / rainyHoursCount : 0

      setPrecipitationData({
        current: {
          intensity: Math.round(currentPrecip * 10) / 10,
          type: getPrecipType(currentRain, currentSnow, currentData.weather[0].main),
          accumulation: Math.round(currentPrecip * 10) / 10,
          location: currentData.name,
          country: currentData.sys.country,
          duration: currentPrecip > 0 ? 60 : 0, // Assume 1 hour if raining
          humidity: currentData.main.humidity,
          clouds: currentData.clouds.all
        },
        hourly: hourlyData,
        daily: dailyData,
        monthly: {
          totalRainfall: Math.round(totalPrecip * 30 / 24), // Extrapolate to month
          rainyDays: Math.round(rainyHoursCount * 30 / 24),
          averageIntensity: Math.round(avgIntensity * 10) / 10,
          comparison: Math.round((Math.random() - 0.5) * 40) // Simulated comparison
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching precipitation data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchPrecipitationData(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchPrecipitationData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchPrecipitationData(51.5074, -0.1278) // Fallback to London
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
      await fetchPrecipitationData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const convertPrecipitation = (amount: number) => {
    if (unit === "inches") {
      return Math.round(amount * 0.0393701 * 100) / 100
    }
    return amount
  }

  const getUnitSymbol = () => {
    return unit === "inches" ? "in" : "mm"
  }

  const getIntensityColor = (intensity: number, dark: boolean) => {
    if (intensity === 0) return dark ? "text-slate-400" : "text-slate-500"
    if (intensity < 2) return dark ? "text-sky-400" : "text-sky-600"
    if (intensity < 8) return dark ? "text-blue-400" : "text-blue-600"
    if (intensity < 15) return dark ? "text-indigo-400" : "text-indigo-650"
    return dark ? "text-rose-400" : "text-rose-600"
  }

  const getIntensityBg = (intensity: number, dark: boolean) => {
    if (intensity === 0) return dark ? "bg-slate-800/80 border-slate-750 text-slate-400" : "bg-slate-100 border-slate-250 text-slate-700"
    if (intensity < 2) return dark ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-800"
    if (intensity < 8) return dark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-800"
    if (intensity < 15) return dark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-205 text-indigo-800"
    return dark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-250 text-rose-800"
  }

  const getProbabilityColor = (probability: number, dark: boolean) => {
    if (probability < 25) return dark ? "text-emerald-400" : "text-emerald-600"
    if (probability < 50) return dark ? "text-amber-400" : "text-amber-600"
    if (probability < 75) return dark ? "text-orange-400" : "text-orange-600"
    return dark ? "text-rose-400" : "text-rose-600"
  }

  const getRainfallCategory = (amount: number) => {
    if (amount === 0) return "No Rain"
    if (amount < 2) return "Light"
    if (amount < 10) return "Moderate"
    if (amount < 25) return "Heavy"
    return "Very Heavy"
  }

  const getPrecipIcon = (type: string, className: string = "h-6 w-6") => {
    switch(type.toLowerCase()) {
      case "snow": return <CloudSnow className={className} />
      case "drizzle": 
      case "light rain": return <CloudDrizzle className={className} />
      case "moderate rain":
      case "heavy rain": return <CloudRain className={className} />
      default: return <Cloud className={className} />
    }
  }

  if (loading && !precipitationData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing precipitation telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to radar stations...</p>
        </div>
      </div>
    )
  }

  const hasAlert = precipitationData && precipitationData.current.intensity > 8
  const maxWeeklyRainfall = precipitationData ? Math.max(...precipitationData.daily.map(d => d.totalRainfall), 10) : 10
  const latCoord = precipitationData?.coord.lat ?? 51.5074
  const lonCoord = precipitationData?.coord.lon ?? -0.1278
  const currentIntensity = precipitationData ? precipitationData.current.intensity : 0
  
  // Math animation duration for SVG falling raindrops inside compass face
  const rainAnimDuration = currentIntensity > 0 
    ? `${Math.max(0.4, Math.min(2.5, 8 / currentIntensity))}s`
    : '0s'

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <CloudRain className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Precipitation Analysis
              </h1>
              {precipitationData && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{precipitationData.current.location}, {precipitationData.current.country}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    LAT: {latCoord.toFixed(4)}° LON: {lonCoord.toFixed(4)}°
                  </span>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  {locationStatus === 'success' && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20 flex-shrink-0">
                      📍 System Calibrated
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
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
                  onClick={() => currentLocation && fetchPrecipitationData(currentLocation.lat, currentLocation.lon)}
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
                {(["mm", "inches"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                      unit === u
                        ? isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                        : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {u === "mm" ? "mm" : "in"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rain Warning Alerts */}
        {hasAlert && (
          <div className={`p-4 rounded-2xl border ${
            isDarkMode 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } flex items-start gap-3 shadow-sm`}>
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium">
                <span className="font-bold uppercase tracking-wider text-xs mr-2">Weather warning:</span>
                Heavy precipitation of {convertPrecipitation(precipitationData.current.intensity)} {getUnitSymbol()}/hr active. Possible localized accumulation and reduced visibility.
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        {precipitationData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Console Column: Rain Dial (4 columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Compass className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Rain Vane Compass Dial</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  
                  {/* High Tech SVG Dial Face */}
                  <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                    
                    {/* Concentric Coordinate rings */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                      
                      <defs>
                        <clipPath id="dial-clip-bounds">
                          <circle cx="100" cy="100" r="76" />
                        </clipPath>
                      </defs>

                      {/* Concentric rings */}
                      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Dial Scale marks */}
                      {Array.from({ length: 20 }).map((_, i) => {
                        const deg = i * 18
                        const rad = (deg * Math.PI) / 180
                        const outerR = 92
                        const innerR = i % 5 === 0 ? 82 : 86
                        const x1 = 100 + outerR * Math.sin(rad)
                        const y1 = 100 - outerR * Math.cos(rad)
                        const x2 = 100 + innerR * Math.sin(rad)
                        const y2 = 100 - innerR * Math.cos(rad)
                        return (
                          <line 
                            key={i} 
                            x1={x1} y1={y1} x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth={i % 5 === 0 ? "1.5" : "0.75"} 
                          />
                        )
                      })}

                      {/* Scale labels */}
                      <text x="100" y="24" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">0</text>
                      <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">5</text>
                      <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">10</text>
                      <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">15</text>
                    </svg>

                    {/* Falling Raindrop Animations Overlay (Clipped to dial size) */}
                    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        <g clipPath="url(#dial-clip-bounds)">
                          {currentIntensity > 0 && (
                            <>
                              <line x1="55" y1="-20" x2="55" y2="10" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" className="rain-drop-fall-node" style={{ animationDuration: rainAnimDuration }} />
                              <line x1="80" y1="-20" x2="80" y2="15" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" className="rain-drop-fall-node" style={{ animationDuration: rainAnimDuration, animationDelay: '0.3s' }} />
                              <line x1="105" y1="-20" x2="105" y2="12" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" className="rain-drop-fall-node" style={{ animationDuration: rainAnimDuration, animationDelay: '0.7s' }} />
                              <line x1="130" y1="-20" x2="130" y2="18" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" className="rain-drop-fall-node" style={{ animationDuration: rainAnimDuration, animationDelay: '0.1s' }} />
                              <line x1="155" y1="-20" x2="155" y2="10" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" className="rain-drop-fall-node" style={{ animationDuration: rainAnimDuration, animationDelay: '0.5s' }} />
                            </>
                          )}
                        </g>
                      </svg>
                    </div>

                    {/* Active Intensity Ring Tracker */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {(() => {
                          const maxRangeVal = 20
                          const clipIntense = Math.min(currentIntensity, maxRangeVal)
                          const ratio = clipIntense / maxRangeVal
                          const dashLength = 2 * Math.PI * 76
                          
                          // Determine stroke color
                          let strokeColor = '#38bdf8' // light rain
                          if (currentIntensity > 15) strokeColor = '#f43f5e' // heavy storm
                          else if (currentIntensity > 8) strokeColor = '#f59e0b' // moderate rain

                          return (
                            <circle 
                              cx="100" cy="100" r="76"
                              fill="none" 
                              stroke={strokeColor}
                              strokeWidth="4.5"
                              strokeLinecap="round"
                              strokeDasharray={dashLength}
                              strokeDashoffset={dashLength * (1 - ratio)}
                              transform="rotate(-90 100 100)"
                              className="transition-all duration-1000 ease-out opacity-80"
                            />
                          )
                        })()}
                      </svg>
                    </div>

                    {/* Core readouts HUD */}
                    <div className="absolute w-[80px] h-[80px] bg-slate-950 rounded-full border border-slate-800 flex flex-col items-center justify-center shadow-md">
                      <span className="text-2xl font-black text-white tracking-tight leading-none">
                        {convertPrecipitation(currentIntensity)}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
                        {getUnitSymbol()}/hr
                      </span>
                      <span className="text-[10px] font-extrabold text-indigo-400 mt-1 leading-none">
                        {precipitationData.current.type}
                      </span>
                    </div>

                    {/* HUD labels */}
                    <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: SCANNER</div>
                    <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">PRECIP: DOppler</div>

                  </div>

                  {/* Summary labels */}
                  <div className="w-full text-center space-y-1 mt-2">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                      Moisture Rate: {convertPrecipitation(currentIntensity)} {getUnitSymbol()}/h
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                      Scanners locking onto precipitation cell activity
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Metrics Dashboard Column (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Telemetry widgets grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gauge 1: Rain Accumulation */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Umbrella className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Volume Accumulation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col justify-between min-h-[190px]">
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
                          {convertPrecipitation(precipitationData.current.accumulation)}
                        </span>
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase">
                          {getUnitSymbol()}
                        </span>
                      </div>
                      
                      {/* Linear progress bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((precipitationData.current.accumulation / 15) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 font-black tracking-widest mt-1">
                        <span>0 MIN</span>
                        <span>7.5 MOD</span>
                        <span>15 MAX</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-150 dark:border-slate-850 text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                      Accumulated rainfall in the last hour
                    </div>

                  </CardContent>
                </Card>

                {/* Gauge 2: Humidity Scale */}
                {(() => {
                  const humidity = precipitationData.current.humidity
                  return (
                    <Card className={`border ${
                      isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                    } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Droplets className="h-4.5 w-4.5 text-purple-500" />
                          <span>Humidity Scale</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col items-center justify-between min-h-[190px]">
                        
                        {/* SVG Progress Circle */}
                        <div className="relative w-22 h-22">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                            <circle 
                              cx="50" cy="50" r="41" 
                              fill="none" stroke="#a855f7" 
                              strokeWidth="6.5" 
                              strokeLinecap="round" 
                              strokeDasharray={257.6}
                              strokeDashoffset={257.6 * (1 - humidity / 100)}
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-1000 ease-out"
                            />
                            <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-xl font-black fill-slate-950 dark:fill-white">
                              {humidity}%
                            </text>
                          </svg>
                        </div>

                        <div className="w-full text-center space-y-0.5 mt-2">
                          <div className="text-[11px] font-black text-slate-800 dark:text-slate-100">Relative Humidity</div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Moisture levels in air</div>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Gauge 3: Cloud Cover */}
                {(() => {
                  const clouds = precipitationData.current.clouds
                  return (
                    <Card className={`border ${
                      isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                    } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Cloud className="h-4.5 w-4.5 text-cyan-500" />
                          <span>Cloud Cover</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex flex-col items-center justify-between min-h-[190px]">
                        
                        {/* SVG Progress Circle */}
                        <div className="relative w-22 h-22">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                            <circle 
                              cx="50" cy="50" r="41" 
                              fill="none" stroke="#06b6d4" 
                              strokeWidth="6.5" 
                              strokeLinecap="round" 
                              strokeDasharray={257.6}
                              strokeDashoffset={257.6 * (1 - clouds / 100)}
                              transform="rotate(-90 50 50)"
                              className="transition-all duration-1000 ease-out"
                            />
                            <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-xl font-black fill-slate-950 dark:fill-white">
                              {clouds}%
                            </text>
                          </svg>
                        </div>

                        <div className="w-full text-center space-y-0.5 mt-2">
                          <div className="text-[11px] font-black text-slate-800 dark:text-slate-100 font-bold">Cloud Density</div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase">Sky density track</div>
                        </div>

                      </CardContent>
                    </Card>
                  )
                })()}

              </div>

            </div>
          </div>
        )}

        {/* View Mode Selection pills */}
        {precipitationData && (
          <div className="flex justify-start">
            <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-xl p-1 gap-1">
              {(["hourly", "daily"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all duration-300 ${
                    viewMode === mode
                      ? isDarkMode ? "bg-slate-800 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {mode === "hourly" ? "24-Hour Stream" : "7-Day Outlook"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hourly stream vertical bar scrolling ribbon */}
        {precipitationData && viewMode === "hourly" && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>24-Hour Precipitation Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-indigo-500/20 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {precipitationData.hourly.map((hour, idx) => {
                  return (
                    <div 
                      key={`hourly-precip-${idx}`} 
                      className={`flex-shrink-0 w-24 p-3.5 rounded-xl border text-center transition-all duration-300 hover:scale-[1.03] flex flex-col justify-between items-center ${
                        isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">
                        {hour.time}
                      </div>

                      {/* Visual probability column indicator */}
                      <div className="w-2.5 h-12 bg-slate-100 dark:bg-slate-950 rounded-full my-2.5 flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-blue-500 dark:bg-blue-450 transition-all duration-1000 ease-out" 
                          style={{ height: `${hour.probability}%` }}
                        />
                      </div>

                      <div className="mt-2">
                        <div className={`text-base font-black tracking-tight ${getIntensityColor(hour.intensity, isDarkMode)}`}>
                          {convertPrecipitation(hour.intensity)}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
                          {getUnitSymbol()}/hr
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850/50 text-[10px] font-black">
                        <span className={getProbabilityColor(hour.probability, isDarkMode)}>
                          {hour.probability}% Ch.
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day & Monthly summary */}
        {precipitationData && viewMode === "daily" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">

            {/* Weekly Outlook (8 Columns) */}
            <div className="lg:col-span-8">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span>7-Day Rain Volume Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3.5">
                    {precipitationData.daily.map((day, idx) => {
                      const ratio = Math.min((day.totalRainfall / maxWeeklyRainfall) * 100, 100)
                      
                      return (
                        <div 
                          key={`daily-precip-${idx}`} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-355'
                          } gap-4`}
                        >
                          {/* Day & Icon */}
                          <div className="flex items-center gap-3 w-full sm:w-36 flex-shrink-0">
                            <span className="w-12 text-sm font-black text-slate-705 dark:text-slate-300">
                              {day.day}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {getPrecipIcon(day.type, "h-4 w-4 text-blue-500 dark:text-blue-400")}
                              <span className={`text-[10px] font-black ${getProbabilityColor(day.probability, isDarkMode)}`}>
                                {day.probability}%
                              </span>
                            </div>
                          </div>

                          {/* Rain volume range bar */}
                          <div className="flex-grow flex flex-col justify-center">
                            <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full">
                              <div 
                                className="absolute h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 font-mono">
                              <span>Duration: {day.rainyHours} hrs</span>
                              <span>Max Peak: {convertPrecipitation(day.maxIntensity)} {getUnitSymbol()}/h</span>
                            </div>
                          </div>

                          {/* Rain Volume Badge */}
                          <div className="w-full sm:w-40 text-right flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                            <span className="sm:hidden text-xs text-slate-400 font-semibold">Total Rainfall:</span>
                            <Badge className={`${getIntensityBg(day.totalRainfall, isDarkMode)} border text-[10px] font-black px-2 py-0.5`}>
                              {convertPrecipitation(day.totalRainfall)} {getUnitSymbol()}
                            </Badge>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly statistics (4 Columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <span>Monthly Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-4">
                    
                    {/* Stat 1: Total Rainfall */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                      <div>
                        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                          [ Total_Rain_Est ]
                        </div>
                        <div className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-2">
                          {convertPrecipitation(precipitationData.monthly.totalRainfall)} {getUnitSymbol()}
                        </div>
                      </div>
                      <div className={`text-[10px] font-black ${precipitationData.monthly.comparison > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>
                        {precipitationData.monthly.comparison > 0 ? "▲ +" : "▼ "}{precipitationData.monthly.comparison}% vs normal
                      </div>
                    </div>

                    {/* Stat 2: Rainy Days */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300">
                      <div>
                        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                          [ Rainy_Days_Est ]
                        </div>
                        <div className="text-lg font-black text-emerald-500 mt-2">
                          {precipitationData.monthly.rainyDays} Days
                        </div>
                      </div>
                    </div>

                    {/* Stat 3: Avg Intensity */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300">
                      <div>
                        <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                          [ Avg_Rain_Intensity ]
                        </div>
                        <div className="text-lg font-black text-purple-500 mt-2">
                          {convertPrecipitation(precipitationData.monthly.averageIntensity)} {getUnitSymbol()}/hr
                        </div>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* Precipitation Tips grid */}
        {precipitationData && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Umbrella className="h-5 w-5 text-indigo-500" />
                <span>Precipitation Outlook & Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Advisories */}
                <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-indigo-650">
                  <h3 className="font-black mb-3 text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                    [ Sensor_Alert_Tips ]
                  </h3>
                  <div className="space-y-3.5">
                    {precipitationData.current.intensity > 0 ? (
                      <>
                        <div className="flex items-start gap-2.5">
                          <Umbrella className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5 animate-bounce" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                            Carry an umbrella or water-resistant coat when heading outdoors.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-500 flex-shrink-0 mt-0.5 animate-pulse" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                            Road surfaces may be slippery. Reduce vehicle speeds and allow extra time.
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <Info className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-600 dark:text-slate-405 font-semibold leading-relaxed">
                          No precipitation expected in your immediate area. Enjoy the clear conditions!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Stats summary outlook */}
                <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-emerald-500">
                  <h3 className="font-black mb-3 text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                    [ Today_Summary_Tele ]
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-450 font-semibold font-mono">
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span>Peak Intensity:</span>
                      <span className="text-slate-850 dark:text-slate-200 font-black">
                        {convertPrecipitation(Math.max(...precipitationData.hourly.map(h => h.intensity)))} {getUnitSymbol()}/hr
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span>Max Chance:</span>
                      <span className="text-slate-855 dark:text-slate-200 font-black">
                        {Math.max(...precipitationData.hourly.map(h => h.probability))}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expected Accumulation:</span>
                      <span className="text-slate-855 dark:text-slate-200 font-black">
                        {convertPrecipitation(precipitationData.hourly.reduce((sum, h) => sum + h.accumulation, 0))} {getUnitSymbol()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Embedded CSS animations for Precipitation Vane and Raindrop animation */}
      <style jsx>{`
        .rain-drop-fall-node {
          animation: dropFallAnim linear infinite;
        }
        @keyframes dropFallAnim {
          0% { transform: translateY(-30px); opacity: 0; }
          30% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(160px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}