"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  Gauge, 
  AlertTriangle, 
  TrendingUp,
  Sun,
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  RefreshCw,
  Wind,
  Eye,
  Droplets,
  Heart,
  HeartPulse,
  Brain,
  Compass,
  Cpu,
  Signal,
  Info
} from "lucide-react"

interface AirQualityData {
  aqi: number
  location: string
  country: string
  components: {
    pm25: number
    pm10: number
    o3: number
    no2: number
    so2: number
    co: number
    nh3: number
  }
  forecast: Array<{
    day: string
    date: string
    aqi: number
    mainPollutant: string
  }>
  coord: { lat: number; lon: number }
}

export default function AirQualityPage() {
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  // Convert OpenWeatherMap AQI (1-5) to US EPA AQI (0-500)
  const convertToEPAAQI = (aqiLevel: number, components: any): number => {
    if (components.pm2_5) {
      const pm25 = components.pm2_5
      if (pm25 <= 12) return Math.round(pm25 * 4.17)
      if (pm25 <= 35.4) return Math.round(50 + (pm25 - 12) * 2.13)
      if (pm25 <= 55.4) return Math.round(100 + (pm25 - 35.4) * 2.5)
      if (pm25 <= 150.4) return Math.round(150 + (pm25 - 55.4) * 0.53)
      if (pm25 <= 250.4) return Math.round(200 + (pm25 - 150.4))
      return Math.round(300 + (pm25 - 250.4) * 0.4)
    }
    
    const aqiMap: { [key: number]: number } = {
      1: 25,
      2: 75,
      3: 125,
      4: 175,
      5: 250
    }
    return aqiMap[aqiLevel] || 50
  }

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { 
      label: "Good", 
      color: "text-emerald-550 dark:text-emerald-400", 
      bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      description: "Air quality is satisfactory, and air pollution poses little or no risk"
    }
    if (aqi <= 100) return { 
      label: "Moderate", 
      color: "text-amber-550 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      description: "Air quality is acceptable. However, there may be a risk for some people"
    }
    if (aqi <= 150) return { 
      label: "Sensitive Alert", 
      color: "text-orange-550 dark:text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20 text-orange-400",
      description: "Members of sensitive groups may experience health effects"
    }
    if (aqi <= 200) return { 
      label: "Unhealthy", 
      color: "text-rose-550 dark:text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      description: "Some members of the general public may experience health effects"
    }
    if (aqi <= 300) return { 
      label: "Very Unhealthy", 
      color: "text-purple-550 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      description: "Health alert: The risk of health effects is increased for everyone"
    }
    return { 
      label: "Hazardous", 
      color: "text-red-550 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20 text-red-450",
      description: "Health warning of emergency conditions: everyone is more likely to be affected"
    }
  }

  const getMainPollutant = (components: any): string => {
    const pollutants = {
      pm2_5: components.pm2_5 || 0,
      pm10: components.pm10 || 0,
      o3: components.o3 || 0,
      no2: components.no2 || 0,
      so2: components.so2 || 0,
      co: (components.co || 0) / 1000
    }
    
    const max = Math.max(...Object.values(pollutants))
    const pollutantKey = Object.keys(pollutants).find(key => pollutants[key as keyof typeof pollutants] === max)
    
    const pollutantNames: { [key: string]: string } = {
      pm2_5: "PM2.5",
      pm10: "PM10",
      o3: "Ozone",
      no2: "NO₂",
      so2: "SO₂",
      co: "CO"
    }
    return pollutantNames[pollutantKey || "pm2_5"] || "PM2.5"
  }

  const fetchAirQuality = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const locationResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!locationResponse.ok) throw new Error('Failed to fetch location')
      const locationData = await locationResponse.json()

      const airQualityResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!airQualityResponse.ok) throw new Error('Failed to fetch air quality')
      const airData = await airQualityResponse.json()

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      const currentAQ = airData.list[0]
      const currentAQI = convertToEPAAQI(currentAQ.main.aqi, currentAQ.components)

      const dailyForecast: { [key: string]: any[] } = {}
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!dailyForecast[dateKey]) {
          dailyForecast[dateKey] = []
        }
        dailyForecast[dateKey].push(item)
      })

      const forecast = Object.keys(dailyForecast).slice(0, 5).map((dateKey) => {
        const dayData = dailyForecast[dateKey]
        const avgComponents = {
          pm2_5: dayData.reduce((sum, d) => sum + (d.components.pm2_5 || 0), 0) / dayData.length,
          pm10: dayData.reduce((sum, d) => sum + (d.components.pm10 || 0), 0) / dayData.length,
          o3: dayData.reduce((sum, d) => sum + (d.components.o3 || 0), 0) / dayData.length,
          no2: dayData.reduce((sum, d) => sum + (d.components.no2 || 0), 0) / dayData.length,
          so2: dayData.reduce((sum, d) => sum + (d.components.so2 || 0), 0) / dayData.length,
          co: dayData.reduce((sum, d) => sum + (d.components.co || 0), 0) / dayData.length
        }
        
        const avgAQILevel = Math.round(dayData.reduce((sum, d) => sum + d.main.aqi, 0) / dayData.length)
        const avgAQI = convertToEPAAQI(avgAQILevel, avgComponents)
        
        return {
          day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
          date: new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          aqi: avgAQI,
          mainPollutant: getMainPollutant(avgComponents)
        }
      })

      setAirQualityData({
        aqi: currentAQI,
        location: locationData.name,
        country: locationData.sys.country,
        components: {
          pm25: Math.round(currentAQ.components.pm2_5 * 10) / 10 || 0,
          pm10: Math.round(currentAQ.components.pm10 * 10) / 10 || 0,
          o3: Math.round(currentAQ.components.o3 * 10) / 10 || 0,
          no2: Math.round(currentAQ.components.no2 * 10) / 10 || 0,
          so2: Math.round(currentAQ.components.so2 * 10) / 10 || 0,
          co: Math.round(currentAQ.components.co / 100) / 10 || 0,
          nh3: Math.round(currentAQ.components.nh3 * 10) / 10 || 0
        },
        forecast,
        coord: { lat, lon }
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching air quality data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchAirQuality(51.5074, -0.1278)
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchAirQuality(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchAirQuality(51.5074, -0.1278)
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
      await fetchAirQuality(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  const getHealthRecommendations = (aqi: number) => {
    if (aqi <= 50) {
      return {
        general: [
          "Enjoy your usual outdoor activities in clean ambient conditions.",
          "Air quality is ideal for extensive outdoor cardio and recreation.",
          "No health implications predicted. No mask or protection required."
        ],
        sensitive: [
          "Perfect day for outdoor exercise and structural activities.",
          "No specific precautions are necessary for respiratory profiles.",
          "Enjoy excellent airflow conditions throughout the sector."
        ]
      }
    } else if (aqi <= 100) {
      return {
        general: [
          "Air quality is acceptable for the vast majority of activities.",
          "Enjoy outdoor recreation but consider minor pauses on prolonged exertion.",
          "No major health hazards noted for general populations."
        ],
        sensitive: [
          "Unusually sensitive individuals should reduce intense prolonged exertion.",
          "Monitor breathing logs for minor coughs or irritation signals.",
          "Keep rescue inhalers close during rigorous workout sets."
        ]
      }
    } else if (aqi <= 150) {
      return {
        general: [
          "Consider reducing heavy or prolonged outdoor exertion sets.",
          "Take regular hydration breaks to mitigate throat irritation.",
          "Monitor current air quality sensors before planning workouts."
        ],
        sensitive: [
          "Limit heavy or prolonged outdoor work and sports sets.",
          "Asthma profiles should follow prescription action guidelines.",
          "Elderly and children should move key tasks indoors where possible."
        ]
      }
    } else if (aqi <= 200) {
      return {
        general: [
          "Minimize prolonged outdoor exertion and intense cardio.",
          "Stay inside during early morning or sunset peak hours.",
          "Switch to lighter indoor workout circuits if possible."
        ],
        sensitive: [
          "Avoid heavy outdoor work and restrict open exposure duration.",
          "Keep windows closed and utilize indoor HEPA filtration units.",
          "Keep close contact with medical services if symptom issues emerge."
        ]
      }
    } else {
      return {
        general: [
          "Avoid all outdoor exertion. Keep physical activity minimal.",
          "Close all windows to seal indoor rooms from outside particulate cells.",
          "Wear a calibrated N95 filter mask if sector traversal is mandatory."
        ],
        sensitive: [
          "Remain strictly indoors and run high-efficiency air cleaners.",
          "Avoid any forms of physical exertion to shield lung tissues.",
          "Seek direct medical attention immediately if breathing indicators drop."
        ]
      }
    }
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  if (loading && !airQualityData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing gas sensor telemetry...</p>
          <p className="text-xs text-slate-400 mt-1">Measuring air pollutant densities...</p>
        </div>
      </div>
    )
  }

  if (!airQualityData) return null

  const latCoord = airQualityData.coord.lat
  const lonCoord = airQualityData.coord.lon
  const currentAQI = airQualityData ? airQualityData.aqi : 0
  const aqiStatus = getAQIStatus(currentAQI)
  const healthRecs = getHealthRecommendations(currentAQI)

  // Floating molecular animation duration linked to AQI
  // Higher AQI = faster, more chaotic particle movement
  const molecularSpeed = currentAQI > 0
    ? `${Math.max(1, Math.min(8, 200 / currentAQI))}s`
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
              <Activity className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Air Quality Index
              </h1>
              {airQualityData && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{airQualityData.location}, {airQualityData.country}</span>
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
                  onClick={() => currentLocation && fetchAirQuality(currentLocation.lat, currentLocation.lon)}
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

        {/* Warning Alert if AQI is Unhealthy or worse */}
        {currentLocation && currentAQI > 100 && (
          <div className={`p-4 rounded-2xl border ${
            isDarkMode 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } flex items-start gap-3 shadow-sm`}>
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="text-sm font-medium">
                <span className="font-bold uppercase tracking-wider text-xs mr-2">Air Hazard Alert:</span>
                Air Quality Index is currently {currentAQI} ({aqiStatus.label}). Elevated fine particulate matter detected. Seek indoor shelters and close windows.
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Console Column: Gas Sensor Dial (4 columns) */}
          <div className="lg:col-span-4">
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Compass className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Particulate Sensor Dial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                
                {/* High Tech SVG Dial Face */}
                <div className="relative w-full max-w-[240px] aspect-square mx-auto mb-6 bg-[#0a0f1d] rounded-full border border-slate-350 dark:border-slate-800 shadow-inner flex items-center justify-center">
                  
                  {/* Concentric Coordinate rings */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/10 dark:text-indigo-400/15" viewBox="0 0 200 200">
                    <defs>
                      <clipPath id="aqi-clip-bounds">
                        <circle cx="100" cy="100" r="76" />
                      </clipPath>
                    </defs>

                    {/* Concentric rings */}
                    <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    
                    {/* Dial scale marks (0 to 300+) */}
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
                    <text x="176" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">100</text>
                    <text x="100" y="176" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">200</text>
                    <text x="24" y="100" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black fill-indigo-400/60">300</text>
                  </svg>

                  {/* Floating Molecule Particles Animation (Clipped to dial face) */}
                  <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      <g clipPath="url(#aqi-clip-bounds)">
                        {currentAQI > 0 && (
                          <>
                            {/* Drifting particulate dots */}
                            <circle cx="55" cy="80" r="3.5" fill="#10b981" className="molecule-drift-node" style={{ animationDuration: molecularSpeed }} />
                            <circle cx="90" cy="130" r="4.5" fill="#f59e0b" className="molecule-drift-node" style={{ animationDuration: molecularSpeed, animationDelay: '0.4s' }} />
                            <circle cx="120" cy="70" r="2.5" fill="#ef4444" className="molecule-drift-node" style={{ animationDuration: molecularSpeed, animationDelay: '1.2s' }} />
                            <circle cx="140" cy="115" r="4.5" fill="#a855f7" className="molecule-drift-node" style={{ animationDuration: molecularSpeed, animationDelay: '0.8s' }} />
                            <circle cx="75" cy="55" r="3.5" fill="#06b6d4" className="molecule-drift-node" style={{ animationDuration: molecularSpeed, animationDelay: '1.8s' }} />
                          </>
                        )}
                      </g>
                    </svg>
                  </div>

                  {/* Active AQI Gauge Tracker Arc */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {(() => {
                        const maxRangeVal = 300
                        const clipAQI = Math.min(currentAQI, maxRangeVal)
                        const ratio = clipAQI / maxRangeVal
                        const dashLength = 2 * Math.PI * 76
                        
                        let strokeColor = '#10b981'
                        if (currentAQI > 200) strokeColor = '#a855f7'
                        else if (currentAQI > 150) strokeColor = '#ef4444'
                        else if (currentAQI > 100) strokeColor = '#f97316'
                        else if (currentAQI > 50) strokeColor = '#f59e0b'

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
                    <span className="text-3xl font-black text-white tracking-tight leading-none">
                      {currentAQI}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
                      US EPA AQI
                    </span>
                    <span className={`text-[9px] font-extrabold mt-1 leading-none text-center px-1 truncate max-w-full ${aqiStatus.color}`}>
                      {aqiStatus.label}
                    </span>
                  </div>

                  {/* HUD labels */}
                  <div className="absolute top-3 left-6 font-mono text-[8px] font-black text-indigo-400/40">SYS: SCANNER</div>
                  <div className="absolute bottom-3 right-6 font-mono text-[8px] font-black text-indigo-400/40">POLL: PM2.5</div>

                </div>

                {/* Summary labels */}
                <div className="w-full text-center space-y-1 mt-2">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                    Main Source: {getMainPollutant(airQualityData.components)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                    Scanners tracking fine particulate concentrations
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Metrics Dashboard Column (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Pollutant Gauges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              
              {/* Gauge 1: PM2.5 */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 text-red-500" />
                    <span>Fine PM2.5</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center justify-between min-h-[145px]">
                  
                  {/* SVG progress circle */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                      <circle 
                        cx="50" cy="50" r="41" 
                        fill="none" stroke="#ef4444" 
                        strokeWidth="6.5" 
                        strokeLinecap="round" 
                        strokeDasharray={257.6}
                        strokeDashoffset={257.6 * (1 - Math.min(airQualityData.components.pm25 / 100, 1))}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out"
                      />
                      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-sm font-black fill-slate-950 dark:fill-white">
                        {airQualityData.components.pm25}
                      </text>
                    </svg>
                  </div>
                  <div className="text-[9px] text-slate-400 font-black tracking-widest mt-2 uppercase">μg / m³</div>

                </CardContent>
              </Card>

              {/* Gauge 2: PM10 */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 text-orange-500" />
                    <span>Inhalable PM10</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center justify-between min-h-[145px]">
                  
                  {/* SVG progress circle */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                      <circle 
                        cx="50" cy="50" r="41" 
                        fill="none" stroke="#f97316" 
                        strokeWidth="6.5" 
                        strokeLinecap="round" 
                        strokeDasharray={257.6}
                        strokeDashoffset={257.6 * (1 - Math.min(airQualityData.components.pm10 / 150, 1))}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out"
                      />
                      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-sm font-black fill-slate-950 dark:fill-white">
                        {airQualityData.components.pm10}
                      </text>
                    </svg>
                  </div>
                  <div className="text-[9px] text-slate-400 font-black tracking-widest mt-2 uppercase">μg / m³</div>

                </CardContent>
              </Card>

              {/* Gauge 3: O3 */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                    <span>Ozone O₃</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center justify-between min-h-[145px]">
                  
                  {/* SVG progress circle */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                      <circle 
                        cx="50" cy="50" r="41" 
                        fill="none" stroke="#3b82f6" 
                        strokeWidth="6.5" 
                        strokeLinecap="round" 
                        strokeDasharray={257.6}
                        strokeDashoffset={257.6 * (1 - Math.min(airQualityData.components.o3 / 180, 1))}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out"
                      />
                      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-sm font-black fill-slate-950 dark:fill-white">
                        {airQualityData.components.o3}
                      </text>
                    </svg>
                  </div>
                  <div className="text-[9px] text-slate-400 font-black tracking-widest mt-2 uppercase">μg / m³</div>

                </CardContent>
              </Card>

              {/* Gauge 4: NO2 */}
              <Card className={`border ${
                isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
              } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-purple-500" />
                    <span>Nitrogen NO₂</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center justify-between min-h-[145px]">
                  
                  {/* SVG progress circle */}
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-950" strokeWidth="6.5" />
                      <circle 
                        cx="50" cy="50" r="41" 
                        fill="none" stroke="#a855f7" 
                        strokeWidth="6.5" 
                        strokeLinecap="round" 
                        strokeDasharray={257.6}
                        strokeDashoffset={257.6 * (1 - Math.min(airQualityData.components.no2 / 200, 1))}
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out"
                      />
                      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" className="text-sm font-black fill-slate-950 dark:fill-white">
                        {airQualityData.components.no2}
                      </text>
                    </svg>
                  </div>
                  <div className="text-[9px] text-slate-400 font-black tracking-widest mt-2 uppercase">μg / m³</div>

                </CardContent>
              </Card>

            </div>

            {/* Additional trace gases console */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Gauge className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Trace Gas Telemetry</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* SO2 */}
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-emerald-500">
                    <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                      [ Sulfur_Dioxide_SO2 ]
                    </div>
                    <div className="text-lg font-black text-slate-850 dark:text-slate-200 mt-2">
                      {airQualityData.components.so2} <span className="text-[10px] text-slate-450">μg/m³</span>
                    </div>
                  </div>

                  {/* CO */}
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-amber-500">
                    <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                      [ Carbon_Monoxide_CO ]
                    </div>
                    <div className="text-lg font-black text-slate-850 dark:text-slate-200 mt-2">
                      {airQualityData.components.co} <span className="text-[10px] text-slate-450">mg/m³</span>
                    </div>
                  </div>

                  {/* NH3 */}
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-24 hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-cyan-500">
                    <div className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-black">
                      [ Ammonia_NH3 ]
                    </div>
                    <div className="text-lg font-black text-slate-850 dark:text-slate-200 mt-2">
                      {airQualityData.components.nh3} <span className="text-[10px] text-slate-450">μg/m³</span>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* 5-Day AQI Forecast Stream Scroll Ribbon */}
        {airQualityData && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                <span>5-Day Air Quality Forecast Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-indigo-500/20 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {airQualityData.forecast.map((day, idx) => {
                  const dayStatus = getAQIStatus(day.aqi)
                  return (
                    <div 
                      key={`forecast-aqi-${idx}`}
                      className={`flex-shrink-0 w-44 p-4 rounded-xl border text-center transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between items-center ${
                        isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{day.day}</div>
                      <div className="text-[10px] font-bold text-slate-400 mb-2">{day.date}</div>
                      
                      {/* Metric level indicator track */}
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden my-2">
                        <div 
                          className="h-full bg-indigo-650 rounded-full" 
                          style={{ width: `${Math.min((day.aqi / 300) * 100, 100)}%` }}
                        />
                      </div>

                      <div className={`text-2xl font-black ${
                        day.aqi <= 50 ? isDarkMode ? 'text-emerald-400' : 'text-emerald-600' :
                        day.aqi <= 100 ? isDarkMode ? 'text-amber-400' : 'text-amber-600' :
                        day.aqi <= 150 ? isDarkMode ? 'text-orange-400' : 'text-orange-600' :
                        day.aqi <= 200 ? isDarkMode ? 'text-rose-450' : 'text-rose-600' :
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>{day.aqi}</div>

                      <Badge className={`text-[10px] mt-2 border ${dayStatus.bg}`}>
                        {dayStatus.label}
                      </Badge>
                      <div className="text-[10px] font-semibold text-slate-405 dark:text-slate-500 mt-2 font-mono">
                        Main: {day.mainPollutant}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health advisories grid */}
        {airQualityData && (
          <Card className={`border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>Sector Health Advisories</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* General Population */}
                <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-emerald-500">
                  <h3 className="font-black mb-3 text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <Heart className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                    <span>[ General_Population ]</span>
                  </h3>
                  <div className="space-y-3">
                    {healthRecs.general.map((rec, index) => (
                      <div key={`gen-${index}`} className="flex items-start gap-2.5">
                        <Activity className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sensitive Groups */}
                <div className="p-5 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 border-l-4 border-l-orange-550">
                  <h3 className="font-black mb-3 text-xs text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <HeartPulse className="h-4.5 w-4.5 text-orange-500" />
                    <span>[ Sensitive_Profiles ]</span>
                  </h3>
                  <div className="space-y-3">
                    {healthRecs.sensitive.map((rec, index) => (
                      <div key={`sens-${index}`} className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {/* AQI Scale Reference */}
        <Card className={`border ${
          isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
        } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              <span>US EPA Air Quality Scale Index</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { range: "0-50", label: "Good", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", desc: "Excellent air quality" },
                { range: "51-100", label: "Moderate", color: "bg-amber-500/10 border-amber-500/20 text-amber-400", desc: "Acceptable quality" },
                { range: "101-150", label: "Sensitive", color: "bg-orange-500/10 border-orange-500/20 text-orange-400", desc: "Slight health risk" },
                { range: "151-200", label: "Unhealthy", color: "bg-rose-500/10 border-rose-500/20 text-rose-400", desc: "General exposure risk" },
                { range: "201-300", label: "Very Unhealthy", color: "bg-purple-500/10 border-purple-500/20 text-purple-400", desc: "Increased health warnings" },
                { range: "301+", label: "Hazardous", color: "bg-red-500/10 border-red-500/20 text-red-400", desc: "Emergency alert" }
              ].map((level, index) => (
                <div key={`scale-ref-${index}`} className={`p-4 rounded-xl border flex flex-col justify-between h-28 hover:scale-[1.02] transition-all duration-300 ${level.color}`}>
                  <div className="text-xl font-black">{level.range}</div>
                  <div>
                    <div className="font-extrabold text-xs">{level.label}</div>
                    <div className="text-[9px] font-bold text-slate-400">{level.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Embedded CSS animations for Particulate molecular drift */}
      <style jsx>{`
        .molecule-drift-node {
          animation: driftAround linear infinite;
        }
        @keyframes driftAround {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.7; }
          45% { transform: translate(25px, -20px); }
          55% { transform: translate(30px, -15px); }
          90% { opacity: 0.7; }
          100% { transform: translate(50px, -45px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}