"use client"

import { useTheme } from "@/client/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card"
import { Badge } from "@/client/components/ui/badge"
import { Button } from "@/client/components/ui/button"
import { Input } from "@/client/components/ui/input"
import { 
  Sun, 
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Sunrise,
  Sunset,
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  TrendingUp,
  Calendar,
  Compass,
  Cpu,
  Signal,
  Info,
  AlertCircle,
  Activity
} from "lucide-react"

interface UVData {
  current: {
    uvIndex: number
    risk: string
    location: string
    country: string
    time: string
    sunriseTime: string
    sunsetTime: string
    cloudCover: number
  }
  hourly: Array<{
    time: string
    uvIndex: number
    risk: string
    safeExposure: string
  }>
  daily: Array<{
    day: string
    maxUV: number
    avgUV: number
    risk: string
    peakTime: string
  }>
  protection: {
    recommended: string[]
    safeExposureTime: string
    burnTime: string
  }
  coord: { lat: number; lon: number }
}

export default function UVIndexPage() {
  const [uvData, setUvData] = useState<UVData | null>(null)
  const [loading, setLoading] = useState(true)
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const fetchUVData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather data
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Fetch UV Index data
      const uvResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!uvResponse.ok) throw new Error('Failed to fetch UV data')
      const uvCurrentData = await uvResponse.json()

      // Fetch forecast data for hourly/daily predictions
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Calculate UV risk level
      const getUVRisk = (uv: number): string => {
        if (uv <= 2) return "Low"
        if (uv <= 5) return "Moderate"
        if (uv <= 7) return "High"
        if (uv <= 10) return "Very High"
        return "Extreme"
      }

      // Calculate safe exposure time (minutes) based on UV index
      const getSafeExposure = (uv: number): string => {
        if (uv <= 2) return "60+ min"
        if (uv <= 5) return "30-40 min"
        if (uv <= 7) return "15-25 min"
        if (uv <= 10) return "10-15 min"
        return "< 10 min"
      }

      // Simulate hourly UV data
      const currentHour = new Date().getHours()
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = (currentHour + i) % 24
        let uvIndex: number
        if (hour >= 6 && hour <= 18) {
          const hoursFromNoon = Math.abs(hour - 13)
          uvIndex = Math.max(0, uvCurrentData.value * (1 - hoursFromNoon / 7))
        } else {
          uvIndex = 0
        }
        
        return {
          time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          uvIndex: Math.round(uvIndex * 10) / 10,
          risk: getUVRisk(uvIndex),
          safeExposure: getSafeExposure(uvIndex)
        }
      })

      // Process daily data
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
        const avgCloudCover = dayData.reduce((sum, d) => sum + d.clouds.all, 0) / dayData.length
        const estimatedMaxUV = uvCurrentData.value * (1 - avgCloudCover / 200)
        const estimatedAvgUV = estimatedMaxUV * 0.7
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          maxUV: Math.max(0, Math.round(estimatedMaxUV * 10) / 10),
          avgUV: Math.max(0, Math.round(estimatedAvgUV * 10) / 10),
          risk: getUVRisk(estimatedMaxUV),
          peakTime: "12:00 PM - 2:00 PM"
        }
      })

      // Generate protection recommendations
      const currentUV = uvCurrentData.value
      const recommendations: string[] = []
      
      if (currentUV <= 2) {
        recommendations.push("Minimal protection required under standard conditions.")
        recommendations.push("Sunglasses recommended on bright days to block direct glare.")
      } else if (currentUV <= 5) {
        recommendations.push("Wear sunscreen SPF 30+ to guard skin barriers.")
        recommendations.push("Wear a wide-brimmed hat and UV-blocking sunglasses.")
        recommendations.push("Seek shade during peak midday ultraviolet window (11 AM - 3 PM).")
      } else if (currentUV <= 7) {
        recommendations.push("Wear sunscreen SPF 30+ and reapply strictly every 2 hours.")
        recommendations.push("Wear light protective clothing and wide-brimmed hat.")
        recommendations.push("Limit direct sun exposure between 10 AM - 4 PM.")
        recommendations.push("Ensure sunglasses block 99% of UVA and UVB radiation.")
      } else {
        recommendations.push("Wear broad-spectrum sunscreen SPF 50+ and reapply frequently.")
        recommendations.push("Wear tightly woven clothing covering arms and legs completely.")
        recommendations.push("Minimize outdoor activity during high-intensity solar hours.")
        recommendations.push("Find solid overhead shade cover whenever practical.")
        recommendations.push("Ensure full wrap-around UV sunglasses are active.")
      }

      setUvData({
        current: {
          uvIndex: Math.round(uvCurrentData.value * 10) / 10,
          risk: getUVRisk(uvCurrentData.value),
          location: currentData.name,
          country: currentData.sys.country,
          time: new Date(uvCurrentData.date_iso || Date.now()).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          sunriseTime: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          sunsetTime: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          cloudCover: currentData.clouds.all
        },
        hourly: hourlyData,
        daily: dailyData,
        protection: {
          recommended: recommendations,
          safeExposureTime: getSafeExposure(currentUV),
          burnTime: currentUV > 7 ? "10-15 minutes" : currentUV > 5 ? "20-30 minutes" : "40-60 minutes"
        },
        coord: { lat: currentData.coord.lat, lon: currentData.coord.lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching UV data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchUVData(5.6037, -0.1870) // Default to Accra/region coordinate fallback
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchUVData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchUVData(5.6037, -0.1870)
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
      await fetchUVData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUVColor = (uv: number, dark: boolean): string => {
    if (uv <= 2) return dark ? "text-emerald-400" : "text-emerald-600"
    if (uv <= 5) return dark ? "text-amber-400" : "text-amber-600"
    if (uv <= 7) return dark ? "text-orange-400" : "text-orange-600"
    if (uv <= 10) return dark ? "text-rose-500" : "text-rose-600"
    return dark ? "text-purple-400" : "text-purple-650"
  }

  const getUVBg = (uv: number, dark: boolean): string => {
    if (uv <= 2) return dark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-800"
    if (uv <= 5) return dark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-800"
    if (uv <= 7) return dark ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-850"
    if (uv <= 10) return dark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-800"
    return dark ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-purple-50 border-purple-200 text-purple-800"
  }

  if (loading && !uvData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing solar radiation sensors...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to UV monitoring network...</p>
        </div>
      </div>
    )
  }

  const latCoord = uvData?.coord.lat ?? 5.6037
  const lonCoord = uvData?.coord.lon ?? -0.1870
  const currentUV = uvData ? uvData.current.uvIndex : 0

  // Calculate sun position on arc for Sunrise/Sunset widget
  const currentHour = new Date().getHours()
  const isSunUp = currentHour >= 6 && currentHour <= 18
  const sunRatio = isSunUp ? (currentHour - 6) / 12 : 0
  const sunAngle = Math.PI - sunRatio * Math.PI // Map 0-1 to 180 to 0 degrees in rads
  const sunX = 100 + 70 * Math.cos(sunAngle)
  const sunY = 90 - 70 * Math.sin(sunAngle)

  // Solar flare rotation duration linked to UV Index
  // Higher UV = faster rotation
  const solarAnimDuration = currentUV > 0
    ? `${Math.max(1.2, Math.min(10, 15 / currentUV))}s`
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
              <Sun className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                UV Index Monitor
              </h1>
              {uvData && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{uvData.current.location}, {uvData.current.country}</span>
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
                  placeholder="Search solar sector..."
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
                  onClick={() => currentLocation && fetchUVData(currentLocation.lat, currentLocation.lon)}
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

        {/* Warning Alert if UV index is High or above */}
        {uvData && uvData.current.uvIndex > 5 && (
          <div className={`p-4 rounded-2xl border ${
            isDarkMode 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } flex items-start gap-3 shadow-sm`}>
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium">
                <span className="font-bold uppercase tracking-wider text-xs mr-2">Solar Warning:</span>
                Elevated UV Index of {uvData.current.uvIndex} ({uvData.current.risk}) detected. Unprotected skin may burn in {uvData.protection.burnTime}. Avoid direct sun exposure and wear SPF 30+.
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        {uvData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Console Column: SVG Solar Radiation Gauge (4 columns) */}
            <div className="lg:col-span-4">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Compass className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Solar Telemetry Gauge</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  
                  {/* Futuristic SVG Dial Face */}
                  <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                    
                    {/* Concentric Coordinate rings */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                      
                      <defs>
                        <clipPath id="solar-clip-bounds">
                          <circle cx="100" cy="100" r="76" />
                        </clipPath>
                      </defs>

                      {/* Concentric rings */}
                      <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      
                      {/* Dial scale marks for UV index ranges (0 to 12) */}
                      {Array.from({ length: 24 }).map((_, i) => {
                        const deg = i * 15
                        const rad = (deg * Math.PI) / 180
                        const outerR = 92
                        const innerR = i % 4 === 0 ? 80 : 86
                        const x1 = 100 + outerR * Math.sin(rad)
                        const y1 = 100 - outerR * Math.cos(rad)
                        const x2 = 100 + innerR * Math.sin(rad)
                        const y2 = 100 - innerR * Math.cos(rad)
                        return (
                          <line 
                            key={i} 
                            x1={x1} y1={y1} x2={x2} y2={y2} 
                            stroke="currentColor" 
                            strokeWidth={i % 4 === 0 ? "1.5" : "0.75"} 
                          />
                        )
                      })}

                      {/* Scale labels */}
                      <text x="100" y="24" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">0</text>
                      <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/65">3</text>
                      <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">6</text>
                      <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">9</text>
                    </svg>

                    {/* Rotating Solar Flares Particle Effect */}
                    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        <g clipPath="url(#solar-clip-bounds)">
                          {currentUV > 0 && (
                            <g className="solar-flares-container" style={{ transformOrigin: '100px 100px', animationDuration: solarAnimDuration }}>
                              {Array.from({ length: 8 }).map((_, i) => {
                                const angle = i * 45
                                return (
                                  <line
                                    key={i}
                                    x1="100"
                                    y1="40"
                                    x2="100"
                                    y2="60"
                                    stroke="#f97316"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    transform={`rotate(${angle} 100 100)`}
                                    className="opacity-70 animate-pulse"
                                  />
                                )
                              })}
                            </g>
                          )}
                        </g>
                      </svg>
                    </div>

                    {/* Active Gauge Tracking Arc */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {(() => {
                          const maxRangeVal = 12
                          const clipUV = Math.min(currentUV, maxRangeVal)
                          const ratio = clipUV / maxRangeVal
                          const dashLength = 2 * Math.PI * 76
                          
                          // Determine stroke color relative to UV levels
                          let strokeColor = '#10b981' // Low: emerald
                          if (currentUV > 10) strokeColor = '#a855f7' // Extreme: purple
                          else if (currentUV > 7) strokeColor = '#f43f5e' // Very High: rose
                          else if (currentUV > 5) strokeColor = '#f97316' // High: orange
                          else if (currentUV > 2) strokeColor = '#fbbf24' // Moderate: amber

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

                    {/* Center Core HUD Readout */}
                    <div className="absolute w-[85px] h-[85px] bg-slate-950 rounded-full border border-slate-800 flex flex-col items-center justify-center shadow-md">
                      <span className="text-3xl font-black text-white tracking-tight leading-none">
                        {currentUV}
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
                        UV INDEX
                      </span>
                      <span className={`text-[10px] font-extrabold mt-1 leading-none ${getUVColor(currentUV, true)}`}>
                        {uvData.current.risk}
                      </span>
                    </div>

                    {/* HUD Metadata Tickers */}
                    <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: SCANNER</div>
                    <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">BAND: SOLAR_UV</div>

                  </div>

                  {/* Summary telemetry labels */}
                  <div className="w-full text-center space-y-1 mt-2">
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                      UV Radiation Level: {currentUV} Index
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                      Sensors monitoring atmospheric ozone filtration
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Metrics Dashboard Column (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Telemetry widgets grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Gauge 1: Sunrise & Sunset Track Arc */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Sunrise className="h-4.5 w-4.5 text-amber-500" />
                      <span>Solar Track Horizon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-between min-h-[190px]">
                    
                    {/* SVG Curve Path representing sunrise to sunset */}
                    <div className="relative w-full max-w-[160px] aspect-[2/1] mt-2">
                      <svg className="w-full h-full" viewBox="0 0 200 100">
                        {/* Horizon path */}
                        <path 
                          d="M 20 90 A 80 80 0 0 1 180 90" 
                          fill="none" 
                          stroke={isDarkMode ? "#334155" : "#cbd5e1"} 
                          strokeWidth="2.5" 
                          strokeDasharray="4 4" 
                        />
                        {/* Day trajectory track */}
                        {isSunUp && (
                          <path 
                            d={`M 20 90 A 80 80 0 0 1 ${sunX} ${sunY}`} 
                            fill="none" 
                            stroke="#f59e0b" 
                            strokeWidth="2.5" 
                            className="transition-all duration-1000"
                          />
                        )}
                        {/* Sun/Moon Dot Node */}
                        <circle 
                          cx={isSunUp ? sunX : 100} 
                          cy={isSunUp ? sunY : 90} 
                          r="6.5" 
                          fill={isSunUp ? "#fbbf24" : "#94a3b8"} 
                          className="transition-all duration-1000 shadow-sm"
                        />
                        {/* Horizon line */}
                        <line x1="10" y1="90" x2="190" y2="90" stroke={isDarkMode ? "#475569" : "#94a3b8"} strokeWidth="1.5" />
                      </svg>
                    </div>

                    <div className="w-full flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-2.5">
                      <span className="flex items-center gap-1"><Sunrise className="h-3 w-3 text-amber-500" /> {uvData.current.sunriseTime}</span>
                      <span className="flex items-center gap-1"><Sunset className="h-3 w-3 text-purple-500" /> {uvData.current.sunsetTime}</span>
                    </div>

                  </CardContent>
                </Card>

                {/* Gauge 2: Safe Exposure Scale */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Shield className="h-4.5 w-4.5 text-blue-500" />
                      <span>Safe Exposure Limit</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col justify-between min-h-[190px]">
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
                          {uvData.protection.safeExposureTime}
                        </span>
                        <span className="text-[10px] font-black text-slate-450 uppercase">
                          No Protection
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${
                              currentUV <= 2 ? 100 : currentUV <= 5 ? 65 : currentUV <= 7 ? 40 : currentUV <= 10 ? 20 : 10
                            }%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-150 dark:border-slate-850 text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                      Safe sun exposure period for skin before harm
                    </div>

                  </CardContent>
                </Card>

                {/* Gauge 3: Cloud Cover and Burn Time */}
                <Card className={`border ${
                  isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
                } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Sun className="h-4.5 w-4.5 text-orange-500" />
                      <span>Time To Skin Burn</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col justify-between min-h-[190px]">
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight">
                          {uvData.protection.burnTime}
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${
                              currentUV > 10 ? 100 : currentUV > 7 ? 80 : currentUV > 5 ? 50 : currentUV > 2 ? 30 : 15
                            }%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-150 dark:border-slate-850 text-xs font-semibold text-slate-500 dark:text-slate-450 leading-relaxed">
                      Estimated duration before onset of sunburn
                    </div>

                  </CardContent>
                </Card>

              </div>

            </div>
          </div>
        )}

        {/* 24-Hour UV Index Forecast Stream */}
        {uvData && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>24-Hour UV Index Forecast Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-indigo-500/20 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {uvData.hourly.slice(0, 16).map((hour, idx) => {
                  return (
                    <div 
                      key={`hourly-uv-${idx}`} 
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
                          className="w-full bg-orange-500 transition-all duration-1000 ease-out" 
                          style={{ height: `${Math.min((hour.uvIndex / 12) * 100, 100)}%` }}
                        />
                      </div>

                      <div className="mt-2">
                        <div className={`text-base font-black tracking-tight ${getUVColor(hour.uvIndex, isDarkMode)}`}>
                          {hour.uvIndex}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">
                          Index
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-850/50 text-[10px] font-black">
                        <span className={getUVColor(hour.uvIndex, isDarkMode)}>
                          {hour.risk}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Outlook & Scale reference */}
        {uvData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 7-Day Forecast */}
            <div className="lg:col-span-8">
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <span>7-Day UV Forecast Outlook</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3.5">
                    {uvData.daily.map((day, idx) => {
                      const maxWeeklyUV = Math.max(...uvData.daily.map(d => d.maxUV), 10)
                      const ratio = Math.min((day.maxUV / maxWeeklyUV) * 100, 100)
                      
                      return (
                        <div 
                          key={`daily-uv-${idx}`} 
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/80 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-350'
                          } gap-4`}
                        >
                          {/* Day & Info */}
                          <div className="flex items-center gap-3 w-full sm:w-36 flex-shrink-0">
                            <span className="w-12 text-sm font-black text-slate-705 dark:text-slate-300">
                              {day.day}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Sun className={`h-4 w-4 ${getUVColor(day.maxUV, isDarkMode)}`} />
                              <span className={`text-[10px] font-black ${getUVColor(day.maxUV, isDarkMode)}`}>
                                {day.risk}
                              </span>
                            </div>
                          </div>

                          {/* UV level range bar */}
                          <div className="flex-grow flex flex-col justify-center">
                            <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full">
                              <div 
                                className="absolute h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 font-mono">
                              <span>Solar Peak: {day.peakTime}</span>
                              <span>Avg UV: {day.avgUV}</span>
                            </div>
                          </div>

                          {/* UV Peak Badge */}
                          <div className="w-full sm:w-40 text-right flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                            <span className="sm:hidden text-xs text-slate-400 font-semibold">Peak Index:</span>
                            <Badge className={`${getUVBg(day.maxUV, isDarkMode)} border text-[10px] font-black px-2 py-0.5`}>
                              {day.maxUV} Peak
                            </Badge>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sun Protection Recommendations (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Recommendations Card */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    <span>Solar Protection Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-orange-500">
                    <h3 className="font-black mb-3 text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      [ Advisory_Guidance ]
                    </h3>
                    <div className="space-y-3.5">
                      {uvData.protection.recommended.map((rec, index) => (
                        <div key={`rec-${index}`} className="flex items-start gap-2.5">
                          <Shield className="h-4.5 w-4.5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                            {rec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

        {/* UV Index Scale Reference Panel */}
        <Card className={`border ${
          isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
        } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-500" />
              <span>Standard UV Index Classifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              
              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 bg-emerald-500/10 border-emerald-500/20 text-emerald-400`}>
                <div className="font-black text-lg">0 - 2</div>
                <div>
                  <div className="font-extrabold text-xs">Low</div>
                  <div className="text-[9px] font-bold text-slate-400">Minimal Protection</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 bg-amber-500/10 border-amber-500/20 text-amber-400`}>
                <div className="font-black text-lg">3 - 5</div>
                <div>
                  <div className="font-extrabold text-xs">Moderate</div>
                  <div className="text-[9px] font-bold text-slate-400">Sunscreen recommended</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 bg-orange-500/10 border-orange-500/20 text-orange-400`}>
                <div className="font-black text-lg">6 - 7</div>
                <div>
                  <div className="font-extrabold text-xs">High</div>
                  <div className="text-[9px] font-bold text-slate-400">Cover up & shade</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 bg-rose-500/10 border-rose-500/20 text-rose-400`}>
                <div className="font-black text-lg">8 - 10</div>
                <div>
                  <div className="font-extrabold text-xs">Very High</div>
                  <div className="text-[9px] font-bold text-slate-400">Avoid midday sun</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 bg-purple-500/10 border-purple-500/20 text-purple-400`}>
                <div className="font-black text-lg">11+</div>
                <div>
                  <div className="font-extrabold text-xs">Extreme</div>
                  <div className="text-[9px] font-bold text-slate-400">Full safety precautions</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* Embedded CSS animations for Solar telemetry dial */}
      <style jsx>{`
        .solar-flares-container {
          animation: spinSolarFlares linear infinite;
        }
        @keyframes spinSolarFlares {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}