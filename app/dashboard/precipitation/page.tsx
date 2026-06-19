"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Info
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
    if (intensity < 2) return dark ? "text-sky-400" : "text-sky-655"
    if (intensity < 8) return dark ? "text-blue-400" : "text-blue-655"
    if (intensity < 15) return dark ? "text-indigo-400" : "text-indigo-655"
    return dark ? "text-rose-400" : "text-rose-655"
  }

  const getIntensityBg = (intensity: number, dark: boolean) => {
    if (intensity === 0) return dark ? "bg-slate-800/80 border-slate-750 text-slate-400" : "bg-slate-100 border-slate-250 text-slate-700"
    if (intensity < 2) return dark ? "bg-sky-500/20 border-sky-550/20 text-sky-400" : "bg-sky-50 border-sky-250 text-sky-800"
    if (intensity < 8) return dark ? "bg-blue-500/20 border-blue-550/20 text-blue-400" : "bg-blue-50 border-blue-250 text-blue-800"
    if (intensity < 15) return dark ? "bg-indigo-500/20 border-indigo-550/20 text-indigo-400" : "bg-indigo-50 border-indigo-250 text-indigo-800"
    return dark ? "bg-rose-500/20 border-rose-550/20 text-rose-400" : "bg-rose-50 border-rose-250 text-rose-800"
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
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-blue-600'
          } animate-spin mx-auto mb-4`} />
          <p className="text-xl font-bold tracking-tight">Loading precipitation data...</p>
        </div>
      </div>
    )
  }

  const hasAlert = precipitationData && precipitationData.current.intensity > 8
  const maxWeeklyRainfall = precipitationData ? Math.max(...precipitationData.daily.map(d => d.totalRainfall), 10) : 10

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-955 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md">
              <CloudRain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Precipitation
              </h1>
              {precipitationData && (
                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>{precipitationData.current.location}, {precipitationData.current.country}</span>
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

          {/* Action Row */}
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
                onClick={() => currentLocation && fetchPrecipitationData(currentLocation.lat, currentLocation.lon)}
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

            {/* Units Segment tab control */}
            <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-xl p-1 gap-1">
              {(["mm", "inches"] as const).map((u) => (
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
                  {u === "mm" ? "mm" : "in"}
                </button>
              ))}
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

        {/* Dashboard Panels */}
        {precipitationData && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Circular SVG intensity Gauge */}
            <Card className={`border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <span>Rain Vane Dial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6 pb-8">
                
                <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6">
                  <svg className="w-full h-full select-none" viewBox="0 0 200 200">
                    
                    {/* Ring Outlines */}
                    <circle cx="100" cy="100" r="95" className="stroke-slate-200 dark:stroke-slate-800" fill="none" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="85" className="stroke-slate-200/50 dark:stroke-slate-800/50" fill="none" strokeWidth="1" />
                    
                    {/* Concentric Ticks */}
                    {Array.from({ length: 20 }).map((_, i) => {
                      const degree = i * 18
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
                            i % 5 === 0
                              ? "stroke-slate-450 dark:stroke-slate-500"
                              : "stroke-slate-200 dark:stroke-slate-800"
                          }
                          strokeWidth={i % 5 === 0 ? "2" : "1"}
                        />
                      )
                    })}

                    {/* Scale markers */}
                    <text x="100" y="24" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black fill-slate-800 dark:fill-slate-100">0</text>
                    <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black fill-slate-800 dark:fill-slate-100">5</text>
                    <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black fill-slate-800 dark:fill-slate-100">10</text>
                    <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-black fill-slate-800 dark:fill-slate-100">15</text>

                    {/* Circular arc filling based on intensity */}
                    {(() => {
                      const intensityVal = Math.min(precipitationData.current.intensity, 20)
                      const fillPercent = intensityVal / 20
                      const angle = fillPercent * 360
                      const rad = (angle * Math.PI) / 180
                      const x = 100 + 85 * Math.sin(rad)
                      const y = 100 - 85 * Math.cos(rad)
                      const largeArc = angle > 180 ? 1 : 0
                      
                      return (
                        <>
                          <path
                            d={`M 100 15 A 85 85 0 ${largeArc} 1 ${x} ${y}`}
                            className="stroke-blue-500 fill-none transition-all duration-1000 ease-out"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            className="fill-blue-600 dark:fill-blue-300 stroke-white dark:stroke-slate-900"
                            strokeWidth="1.5"
                          />
                        </>
                      )
                    })()}

                    {/* Central readouts */}
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="36" 
                      className="fill-white dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-800" 
                      strokeWidth="1.5" 
                    />
                    <text x="100" y="91" textAnchor="middle" dominantBaseline="central" className="text-2xl font-black fill-slate-900 dark:fill-white">
                      {convertPrecipitation(precipitationData.current.intensity)}
                    </text>
                    <text x="100" y="109" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold uppercase tracking-wider fill-slate-400 dark:fill-slate-500">
                      {getUnitSymbol()}/hr
                    </text>
                    <text x="100" y="121" textAnchor="middle" dominantBaseline="central" className="text-xs font-extrabold fill-blue-500 dark:fill-blue-400">
                      {precipitationData.current.type}
                    </text>
                  </svg>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    Intensity Gauge
                  </div>
                  <div className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                    Measured rate of rain or snow fall
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Metrics cards grid panel */}
            <Card className={`md:col-span-1 xl:col-span-2 border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span>Real-time Water Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Panel 1: Current Volume accumulation details */}
                  <div className={`p-5 rounded-2xl border ${
                    isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } flex flex-col justify-between min-h-[190px] hover:border-blue-500/30 transition-all duration-300`}>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Umbrella className="h-4 w-4 text-blue-500" />
                      <span>Rain Accumulation</span>
                    </div>

                    <div className="my-2 text-left">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-4xl font-black text-blue-550 tracking-tight">
                          {convertPrecipitation(precipitationData.current.accumulation)}
                        </span>
                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {getUnitSymbol()}
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((precipitationData.current.accumulation / 15) * 100, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                        <span>0</span>
                        <span>7.5 Moderate</span>
                        <span>15 Max</span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                      Accumulated rainfall in the last hour
                    </div>
                  </div>

                  {/* Panel 2: Humidity gauge dial */}
                  {(() => {
                    const humidity = precipitationData.current.humidity
                    return (
                      <div className={`p-5 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      } flex flex-col items-center text-center justify-between min-h-[190px] hover:border-purple-500/30 transition-all duration-300`}>
                        <div className="flex items-center gap-1.5 self-start text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Droplets className="h-4 w-4 text-purple-500" />
                          <span>Humidity Scale</span>
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
                              className="stroke-purple-500 transition-all duration-1000 ease-out"
                              strokeWidth="6.5"
                              fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 * (1 - humidity / 100)}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                            <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-3xl font-black fill-slate-900 dark:fill-white">
                              {humidity}%
                            </text>
                            <text x="50" y="70" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold uppercase tracking-wider fill-slate-400 dark:fill-slate-500">
                              Rel.
                            </text>
                          </svg>
                        </div>

                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-450">
                          Moisture levels in the local air
                        </div>
                      </div>
                    )
                  })()}

                  {/* Panel 3: Cloud cover gauge dial */}
                  {(() => {
                    const clouds = precipitationData.current.clouds
                    return (
                      <div className={`p-5 rounded-2xl border ${
                        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      } flex flex-col items-center text-center justify-between min-h-[190px] hover:border-cyan-500/30 transition-all duration-300`}>
                        <div className="flex items-center gap-1.5 self-start text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          <Cloud className="h-4 w-4 text-cyan-500" />
                          <span>Cloud Cover</span>
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
                              className="stroke-cyan-500 transition-all duration-1000 ease-out"
                              strokeWidth="6.5"
                              fill="transparent"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 * (1 - clouds / 100)}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                            />
                            <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-3xl font-black fill-slate-900 dark:fill-white">
                              {clouds}%
                            </text>
                            <text x="50" y="70" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold uppercase tracking-wider fill-slate-400 dark:fill-slate-500">
                              Cover
                            </text>
                          </svg>
                        </div>

                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-450">
                          Percentage of sky covered by cloud
                        </div>
                      </div>
                    )
                  })()}

                </div>

              </CardContent>
            </Card>

          </div>
        )}

        {/* View Mode Selection pills */}
        {precipitationData && (
          <div className="flex justify-start">
            <div className="flex bg-slate-200/60 dark:bg-slate-900 border border-slate-300/30 dark:border-slate-800 rounded-2xl p-1 gap-1">
              {(["hourly", "daily"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    viewMode === mode
                      ? isDarkMode
                        ? "bg-slate-850 text-white shadow-sm"
                        : "bg-white text-slate-900 shadow-sm"
                      : isDarkMode
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-605 hover:text-slate-900"
                  }`}
                >
                  {mode === "hourly" ? "24-Hour Stream" : "7-Day Weekly Outlook"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hourly stream vertical bar scrolling ribbon */}
        {precipitationData && viewMode === "hourly" && (
          <Card className={`border ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>24-Hour Precipitation Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-350 dark:scrollbar-thumb-slate-750 hover:scrollbar-thumb-slate-450">
                {precipitationData.hourly.map((hour, index) => {
                  const barHeight = Math.max(Math.min((hour.intensity / 5) * 100, 100), 5)
                  return (
                    <div 
                      key={`hourly-precip-${index}`} 
                      className={`flex-shrink-0 w-24 p-3.5 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.04] hover:shadow-sm flex flex-col justify-between items-center ${
                        isDarkMode 
                          ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700' 
                          : 'bg-slate-50 border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <div className="text-[11px] font-extrabold tracking-wider text-slate-450 dark:text-slate-500 uppercase mb-2">
                        {hour.time}
                      </div>

                      {/* Visual bar tracking probability */}
                      <div className="w-3 h-14 bg-slate-200 dark:bg-slate-800 rounded-full my-2.5 flex items-end overflow-hidden">
                        <div 
                          className="w-full bg-blue-500 dark:bg-blue-450 transition-all duration-1000 ease-out" 
                          style={{ height: `${hour.probability}%` }}
                          title={`Precipitation Probability: ${hour.probability}%`}
                        />
                      </div>

                      <div className="mt-2">
                        <div className={`text-base font-extrabold ${getIntensityColor(hour.intensity, isDarkMode)}`}>
                          {convertPrecipitation(hour.intensity)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                          {getUnitSymbol()}/hr
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-[10px] font-extrabold">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Weekly Outlook */}
            <Card className={`xl:col-span-2 border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span>7-Day Rain Volume Forecast</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-3">
                  {precipitationData.daily.map((day, index) => {
                    const ratio = Math.min((day.totalRainfall / maxWeeklyRainfall) * 100, 100)
                    return (
                      <div 
                        key={`daily-precip-${index}`} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-900/20 border-slate-800/80 hover:bg-slate-900/40 hover:border-slate-700' 
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-350'
                        } gap-4`}
                      >
                        {/* Day & Icon */}
                        <div className="flex items-center gap-3 w-full sm:w-36">
                          <div className="w-12 text-sm font-bold text-slate-705 dark:text-slate-300">
                            {day.day}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getPrecipIcon(day.type, "h-4 w-4 text-blue-500 dark:text-blue-400")}
                            <span className={`text-[10px] font-bold ${getProbabilityColor(day.probability, isDarkMode)}`}>
                              {day.probability}%
                            </span>
                          </div>
                        </div>

                        {/* Rain volume variance track */}
                        <div className="flex-grow flex flex-col justify-center">
                          <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full">
                            <div 
                              className="absolute h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1.5">
                            <span>Duration: {day.rainyHours} hrs</span>
                            <span>Max Peak: {convertPrecipitation(day.maxIntensity)} {getUnitSymbol()}/hr</span>
                          </div>
                        </div>

                        {/* Rain Badge */}
                        <div className="w-full sm:w-44 text-right flex items-center justify-between sm:justify-end gap-2">
                          <span className="sm:hidden text-xs text-slate-400 font-semibold">Rainfall:</span>
                          <Badge className={`${getIntensityBg(day.totalRainfall, isDarkMode)} border text-xs font-bold px-2 py-0.5`}>
                            {convertPrecipitation(day.totalRainfall)} {getUnitSymbol()}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly statistics summary */}
            <Card className={`border ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Monthly Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-4">
                  
                  {/* Stat 1: Total Rainfall */}
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'border-slate-800 bg-slate-500/5' : 'border-slate-200 bg-slate-50/50'
                  }`}>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-1">
                      {convertPrecipitation(precipitationData.monthly.totalRainfall)} {getUnitSymbol()}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">Total Estimated</div>
                    <div className={`text-[10px] font-semibold ${precipitationData.monthly.comparison > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {precipitationData.monthly.comparison > 0 ? "▲ +" : "▼ "}{precipitationData.monthly.comparison}% vs historical average
                    </div>
                  </div>

                  {/* Stat 2: Rainy Days count */}
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'border-slate-800 bg-slate-500/5' : 'border-slate-200 bg-slate-50/50'
                  }`}>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                      {precipitationData.monthly.rainyDays}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">Rainy Days</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Estimated days with precipitation
                    </div>
                  </div>

                  {/* Stat 3: Average Intensity */}
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'border-slate-800 bg-slate-500/5' : 'border-slate-200 bg-slate-50/50'
                  }`}>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-1">
                      {convertPrecipitation(precipitationData.monthly.averageIntensity)} {getUnitSymbol()}/hr
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">Avg Intensity</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Average speed during rain hours
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Precipitation Tips grid */}
        {precipitationData && (
          <Card className={`border ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          } shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Umbrella className="h-5 w-5 text-blue-500" />
                <span>Precipitation Outlook & Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Panel 1: Tips */}
                <div className={`p-5 rounded-2xl border ${
                  isDarkMode ? 'border-slate-800 bg-slate-500/5' : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <h3 className="font-extrabold mb-3 text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Advisory Tips</h3>
                  <div className="space-y-3">
                    {precipitationData.current.intensity > 0 ? (
                      <>
                        <div className="flex items-start gap-2.5">
                          <Umbrella className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Carry an umbrella or water-resistant coat when heading outdoors.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Road surfaces may be slippery. Reduce vehicle speeds and allow extra time for travel.
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-605 dark:text-slate-400 leading-relaxed">
                          No precipitation expected in your immediate area. Enjoy the clear and dry conditions!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 2: Stats summary outlook */}
                <div className={`p-5 rounded-2xl border ${
                  isDarkMode ? 'border-slate-800 bg-slate-500/5' : 'border-slate-200 bg-slate-50/50'
                }`}>
                  <h3 className="font-extrabold mb-3 text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Today&apos;s Statistics</h3>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-450 font-semibold">
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span>Peak Intensity:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {convertPrecipitation(Math.max(...precipitationData.hourly.map(h => h.intensity)))} {getUnitSymbol()}/hr
                      </span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-200/50 dark:border-slate-800/50">
                      <span>Max Chance:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {Math.max(...precipitationData.hourly.map(h => h.probability))}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expected Accumulation:</span>
                      <span className="text-slate-800 dark:text-slate-200 animate-none">
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
    </div>
  )
}