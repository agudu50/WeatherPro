"use client"

import { useTheme } from "@/client/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import { Badge } from "@/client/components/ui/badge"
import { Input } from "@/client/components/ui/input"
import { 
  Satellite, 
  Radar, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Sun, 
  Moon,
  MapPin,
  Search,
  Target,
  Loader2,
  Wind,
  Thermometer,
  Cloud,
  CloudRain,
  AlertCircle,
  RefreshCw,
  Compass,
  Radio,
  Signal,
  Activity,
  Cpu
} from "lucide-react"

interface RadarView {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  layer: string
}

interface WeatherData {
  location: string
  country: string
  coord: { lat: number; lon: number }
  temp: number
  humidity: number
  windSpeed: number
  clouds: number
  rain?: number
  condition: string
  description: string
}

const radarTargets = [
  { angle: 30, radius: 40, intensity: 0.4 },
  { angle: 75, radius: 65, intensity: 0.8 },
  { angle: 120, radius: 25, intensity: 0.5 },
  { angle: 165, radius: 75, intensity: 0.9 },
  { angle: 210, radius: 55, intensity: 0.3 },
  { angle: 255, radius: 85, intensity: 0.7 },
  { angle: 300, radius: 45, intensity: 0.6 },
  { angle: 345, radius: 70, intensity: 0.5 },
  { angle: 10, radius: 30, intensity: 0.2 },
  { angle: 95, radius: 80, intensity: 0.75 },
  { angle: 140, radius: 60, intensity: 0.45 },
  { angle: 190, radius: 90, intensity: 0.85 },
  { angle: 230, radius: 35, intensity: 0.65 },
  { angle: 280, radius: 70, intensity: 0.55 },
  { angle: 320, radius: 50, intensity: 0.7 },
  { angle: 50, radius: 75, intensity: 0.35 }
]

export default function RadarPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [activeView, setActiveView] = useState("clouds")
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [mapOpacity, setMapOpacity] = useState(0.85)
  const [currentTime, setCurrentTime] = useState(new Date())

  const radarViews: RadarView[] = [
    { 
      id: "clouds", 
      name: "Cloud Cover", 
      icon: Cloud, 
      description: "Real-time cloud mapping",
      layer: "clouds_new"
    },
    { 
      id: "precipitation", 
      name: "Precipitation", 
      icon: CloudRain, 
      description: "Live Doppler rainfall track",
      layer: "precipitation_new"
    },
    { 
      id: "temperature", 
      name: "Temperature Map", 
      icon: Thermometer, 
      description: "Thermal radar distribution",
      layer: "temp_new"
    },
    { 
      id: "wind", 
      name: "Wind Vectors", 
      icon: Wind, 
      description: "Wind paths and velocity",
      layer: "wind_new"
    }
  ]

  const getCurrentView = (): RadarView => {
    return radarViews.find(v => v.id === activeView) || radarViews[0]
  }

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!response.ok) throw new Error('Failed to fetch weather')
      
      const data = await response.json()
      
      setWeatherData({
        location: data.name,
        country: data.sys.country,
        coord: { lat: data.coord.lat, lon: data.coord.lon },
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        clouds: data.clouds.all,
        rain: data.rain?.['1h'] || 0,
        condition: data.weather[0].main,
        description: data.weather[0].description
      })
      
      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWeatherData(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWeatherData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWeatherData(51.5074, -0.1278) // Fallback to London
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
      await fetchWeatherData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    getUserLocation()

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 10)
      }, 700)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying])

  const currentView = getCurrentView()

  const getRainIntensityColor = (rain: number) => {
    if (rain === 0) return isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
    if (rain < 2.5) return isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    if (rain < 7.6) return isDarkMode ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border-yellow-250 text-yellow-750'
    if (rain < 50) return isDarkMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-250 text-orange-700'
    return isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-250 text-rose-700'
  }

  const getRainIntensityLabel = (rain: number) => {
    if (rain === 0) return 'No Rain'
    if (rain < 2.5) return 'Light Rain'
    if (rain < 7.6) return 'Moderate Rain'
    if (rain < 50) return 'Heavy Rain'
    return 'Violent Rain'
  }

  if (loading && !weatherData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing meteorological feed...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to radar scans...</p>
        </div>
      </div>
    )
  }

  const latCoord = weatherData?.coord.lat ?? 51.5074
  const lonCoord = weatherData?.coord.lon ?? -0.1278

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <Satellite className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate flex items-center gap-2">
                Radar & Satellite
              </h1>
              {weatherData && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                    <span className="truncate">{weatherData.location}, {weatherData.country}</span>
                  </div>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    LAT: {latCoord.toFixed(4)}° LON: {lonCoord.toFixed(4)}°
                  </span>
                  <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                  {locationStatus === 'success' && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20 flex-shrink-0">
                      📍 System Detected Location
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
                  title="Locate Current Position"
                >
                  <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                </Button>

                <Button
                  type="button"
                  onClick={() => currentLocation && fetchWeatherData(currentLocation.lat, currentLocation.lon)}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Reconnect Scanners"
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

        {/* Main Grid View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls Console (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* View Selection Card */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border overflow-hidden`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  Meteorological Feeds
                </CardTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500">Select simulated scanner overlay layer</p>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {radarViews.map((view) => {
                  const IconComponent = view.icon
                  const isSelected = activeView === view.id
                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border transition-all duration-300 ${
                        isSelected 
                          ? 'bg-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/15'
                          : isDarkMode
                            ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white hover:border-indigo-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-650 hover:border-indigo-150'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                        }`}>
                          <IconComponent className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold tracking-tight">{view.name}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {view.description}
                          </p>
                        </div>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${
                        isSelected ? 'bg-white animate-pulse' : 'bg-slate-300 dark:bg-slate-800'
                      }`} />
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Animation & Feed Scrubber */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  Scanner Playback
                </CardTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500">Review time-lapsed radar sweeps</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Scrub Play Controls */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isPlaying 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/15'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/15'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 fill-white" /> Pause Stream
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" /> Play Loop
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentFrame(0)
                      setIsPlaying(false)
                    }}
                    variant="outline"
                    className={`h-11 w-11 rounded-xl border flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title="Reset scanner timeline"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Timeline frames scrubber */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Scanner Frame Interval</span>
                    <span className="font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px]">
                      FRAME {currentFrame + 1} / 10
                    </span>
                  </div>

                  {/* Horizontal index pills */}
                  <div className="flex justify-between items-center gap-1">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentFrame(idx)
                          setIsPlaying(false)
                        }}
                        className={`flex-1 h-5.5 rounded-md transition-all text-[10px] font-bold flex items-center justify-center border ${
                          idx === currentFrame
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-black'
                            : idx < currentFrame
                              ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60'
                              : isDarkMode
                                ? 'bg-slate-950 border-slate-850 text-slate-600 hover:bg-slate-850'
                                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-150'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Controls */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Layer Scanning Opacity</span>
                    <span className="font-mono text-slate-600 dark:text-slate-350">{Math.round(mapOpacity * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={mapOpacity * 100}
                      onChange={(e) => setMapOpacity(Number(e.target.value) / 100)}
                      className="flex-1 accent-indigo-650 bg-slate-100 dark:bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Scans stats overlay */}
                <div className="pt-3 border-t border-slate-150 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-450 font-medium">
                  <div className="flex justify-between">
                    <span>📡 Uplink Signal:</span>
                    <span className="font-mono text-emerald-500 dark:text-emerald-400 font-bold">100% LOCK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⏳ Update Timer:</span>
                    <span>Auto-refresh (5m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⏱️ Scan Capture:</span>
                    <span>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Color-coded Legend */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Compass className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  Legend Values
                </CardTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500">Calibrations for active view overlay</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs font-semibold">
                  
                  {activeView === 'precipitation' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
                          <span>Light Rainfall</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">0 - 2.5 mm/h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-yellow-500"></div>
                          <span>Moderate Rainfall</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">2.5 - 7.6 mm/h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-orange-500"></div>
                          <span>Heavy Storm</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">7.6 - 50 mm/h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
                          <span>Violent Precipitation</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">&gt;50 mm/h</span>
                      </div>
                    </>
                  )}

                  {activeView === 'clouds' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-slate-350 dark:bg-slate-700"></div>
                          <span>Clear Sky Sector</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">0% - 25%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-slate-450 dark:bg-slate-500"></div>
                          <span>Scattered Cover</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">25% - 75%</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-slate-600 dark:bg-slate-300"></div>
                          <span>Overcast Sky</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">75% - 100%</span>
                      </div>
                    </>
                  )}

                  {activeView === 'temperature' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-sky-500"></div>
                          <span>Cold Climate</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">&lt;10°C</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
                          <span>Mild / Moderate</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">10°C - 25°C</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
                          <span>Warm Climate</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">25°C - 35°C</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
                          <span>Extreme Heat</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">&gt;35°C</span>
                      </div>
                    </>
                  )}

                  {activeView === 'wind' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-sky-400"></div>
                          <span>Light Breeze</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">0 - 5 km/h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-emerald-400"></div>
                          <span>Moderate Gales</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">5 - 30 km/h</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded bg-rose-450"></div>
                          <span>Strong Winds / Storm</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">&gt;30 km/h</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meteorological Radar Console (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border overflow-hidden`}>
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <currentView.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">
                        {currentView.name} Feed Overlay
                      </CardTitle>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Live Doppler sweep simulator</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold py-1 px-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      SCANNING ACTIVE
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                
                {/* High Tech Radar Screen Container */}
                <div className="relative w-full aspect-square md:h-[540px] md:w-[540px] mx-auto bg-[#0a0f1d] border border-slate-300 dark:border-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  
                  {/* Digital Line Grid Overlay */}
                  <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
                    <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                      {Array.from({ length: 144 }).map((_, i) => (
                        <div key={i} className="border border-indigo-400" />
                      ))}
                    </div>
                  </div>

                  {/* SVG Radar Instrument Grid */}
                  <svg 
                    viewBox="0 0 500 500" 
                    className="absolute inset-0 w-full h-full pointer-events-none text-indigo-500/15 dark:text-indigo-400/20"
                  >
                    {/* Concentric Scanner Circles */}
                    <circle cx="250" cy="250" r="50" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" />
                    <circle cx="250" cy="250" r="100" fill="none" stroke="currentColor" stroke-width="1" />
                    <circle cx="250" cy="250" r="160" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" />
                    <circle cx="250" cy="250" r="220" fill="none" stroke="currentColor" stroke-width="1.5" />
                    
                    {/* Crosshairs coordinates axes */}
                    <line x1="250" y1="15" x2="250" y2="485" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" />
                    <line x1="15" y1="250" x2="485" y2="250" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" />
                    
                    {/* Angle Tick Indicators */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = i * 30
                      const x1 = 250 + 220 * Math.cos((angle * Math.PI) / 180)
                      const y1 = 250 + 220 * Math.sin((angle * Math.PI) / 180)
                      const x2 = 250 + 230 * Math.cos((angle * Math.PI) / 180)
                      const y2 = 250 + 230 * Math.sin((angle * Math.PI) / 180)
                      return (
                        <line 
                          key={i} 
                          x1={x1} y1={y1} x2={x2} y2={y2} 
                          stroke="currentColor" 
                          stroke-width="1.5" 
                        />
                      )
                    })}

                    {/* Compass bearing markers */}
                    <text x="250" y="32" text-anchor="middle" className="fill-indigo-400 font-mono text-[11px] font-black tracking-widest opacity-80">N</text>
                    <text x="250" y="480" text-anchor="middle" className="fill-indigo-400 font-mono text-[11px] font-black tracking-widest opacity-80">S</text>
                    <text x="475" y="254" text-anchor="end" className="fill-indigo-400 font-mono text-[11px] font-black tracking-widest opacity-80">E</text>
                    <text x="25" y="254" text-anchor="start" className="fill-indigo-400 font-mono text-[11px] font-black tracking-widest opacity-80">W</text>

                    <text x="400" y="105" text-anchor="middle" className="fill-indigo-400/40 font-mono text-[9px] font-semibold">NE</text>
                    <text x="100" y="105" text-anchor="middle" className="fill-indigo-400/40 font-mono text-[9px] font-semibold">NW</text>
                    <text x="400" y="405" text-anchor="middle" className="fill-indigo-400/40 font-mono text-[9px] font-semibold">SE</text>
                    <text x="100" y="405" text-anchor="middle" className="fill-indigo-400/40 font-mono text-[9px] font-semibold">SW</text>
                  </svg>

                  {/* Weather Simulation Overlay Layer (opacity driven) */}
                  <div 
                    className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
                    style={{ opacity: mapOpacity }}
                  >
                    
                    {/* Clouds Overlay */}
                    {activeView === 'clouds' && weatherData && (
                      <div className="absolute inset-0 w-full h-full">
                        {radarTargets.map((target, idx) => {
                          const windSpeed = weatherData.windSpeed || 15
                          const driftAngle = target.angle + (currentFrame * (windSpeed / 3))
                          const cx = 250 + (target.radius * 2.2) * Math.cos((driftAngle * Math.PI) / 180)
                          const cy = 250 + (target.radius * 2.2) * Math.sin((driftAngle * Math.PI) / 180)
                          const baseSize = target.intensity * 40 + (weatherData.clouds / 4)
                          
                          return (
                            <div
                              key={`cloud-${idx}`}
                              className="absolute rounded-full bg-slate-400/20 dark:bg-slate-350/20 blur-xl transition-all duration-700 ease-out"
                              style={{
                                width: `${baseSize * 2}px`,
                                height: `${baseSize * 1.5}px`,
                                left: `${cx - baseSize}px`,
                                top: `${cy - baseSize * 0.75}px`,
                              }}
                            />
                          )
                        })}
                      </div>
                    )}

                    {/* Precipitation Radar Echo Cells */}
                    {activeView === 'precipitation' && weatherData && (
                      <div className="absolute inset-0 w-full h-full">
                        {radarTargets.map((target, idx) => {
                          const isRaining = (weatherData.rain ?? 0) > 0
                          const windSpeed = weatherData.windSpeed || 15
                          const driftAngle = target.angle + (currentFrame * (windSpeed / 3))
                          const cx = 250 + (target.radius * 2.2) * Math.cos((driftAngle * Math.PI) / 180)
                          const cy = 250 + (target.radius * 2.2) * Math.sin((driftAngle * Math.PI) / 180)
                          
                          // Detemine simulated cell intensity color
                          let cellBg = 'bg-emerald-500'
                          let ringBg = 'border-emerald-500/40'
                          
                          if (target.intensity > 0.85) {
                            cellBg = 'bg-rose-500'
                            ringBg = 'border-rose-500/40'
                          } else if (target.intensity > 0.6) {
                            cellBg = 'bg-orange-500'
                            ringBg = 'border-orange-500/40'
                          } else if (target.intensity > 0.35) {
                            cellBg = 'bg-yellow-500'
                            ringBg = 'border-yellow-500/40'
                          }

                          // If it is not actually raining, we show tiny faint gales to simulate quiet noise
                          const cellScale = isRaining ? target.intensity : target.intensity * 0.3
                          const coreSize = 5 + cellScale * 10
                          const rippleSize = coreSize * 2.4

                          return (
                            <div 
                              key={`rain-${idx}`}
                              className="absolute transition-all duration-700 ease-out"
                              style={{
                                left: `${cx - rippleSize / 2}px`,
                                top: `${cy - rippleSize / 2}px`,
                                width: `${rippleSize}px`,
                                height: `${rippleSize}px`,
                              }}
                            >
                              <div 
                                className={`absolute inset-0 rounded-full border ${ringBg} animate-ping`}
                                style={{ animationDuration: `${2 + target.intensity * 2}s` }}
                              />
                              <div 
                                className={`absolute rounded-full ${cellBg} opacity-80`}
                                style={{
                                  left: `${(rippleSize - coreSize) / 2}px`,
                                  top: `${(rippleSize - coreSize) / 2}px`,
                                  width: `${coreSize}px`,
                                  height: `${coreSize}px`
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Temperature Mapping Overlay */}
                    {activeView === 'temperature' && weatherData && (
                      <div className="absolute inset-0 w-full h-full">
                        {radarTargets.map((target, idx) => {
                          const windSpeed = weatherData.windSpeed || 15
                          const driftAngle = target.angle + (currentFrame * (windSpeed / 3))
                          const cx = 250 + (target.radius * 2.2) * Math.cos((driftAngle * Math.PI) / 180)
                          const cy = 250 + (target.radius * 2.2) * Math.sin((driftAngle * Math.PI) / 180)
                          
                          // Dynamic temperature readout at this sector
                          const sectorTemp = weatherData.temp + Math.round((target.intensity - 0.5) * 8)
                          
                          let textColor = 'text-sky-400'
                          let dotBg = 'bg-sky-400'
                          if (sectorTemp > 30) {
                            textColor = 'text-rose-500'
                            dotBg = 'bg-rose-500'
                          } else if (sectorTemp > 22) {
                            textColor = 'text-amber-500'
                            dotBg = 'bg-amber-500'
                          } else if (sectorTemp > 10) {
                            textColor = 'text-emerald-400'
                            dotBg = 'bg-emerald-400'
                          }

                          return (
                            <div 
                              key={`temp-${idx}`}
                              className="absolute transition-all duration-700 ease-out flex items-center gap-1"
                              style={{ left: `${cx - 18}px`, top: `${cy - 8}px` }}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${dotBg} animate-pulse`} />
                              <span className={`font-mono text-[9px] font-black ${textColor}`}>
                                {sectorTemp}°
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Wind Vector Vectors */}
                    {activeView === 'wind' && weatherData && (
                      <div className="absolute inset-0 w-full h-full">
                        {radarTargets.map((target, idx) => {
                          const windSpeed = weatherData.windSpeed || 15
                          const driftAngle = target.angle + (currentFrame * (windSpeed / 3))
                          const cx = 250 + (target.radius * 2.2) * Math.cos((driftAngle * Math.PI) / 180)
                          const cy = 255 + (target.radius * 2.2) * Math.sin((driftAngle * Math.PI) / 180)
                          
                          let strokeColor = '#38bdf8' // light wind
                          if (windSpeed > 30) {
                            strokeColor = '#f43f5e' // strong gale
                          } else if (windSpeed > 12) {
                            strokeColor = '#34d399' // moderate wind
                          }

                          const rotation = driftAngle + (idx * 20)

                          return (
                            <div
                              key={`wind-${idx}`}
                              className="absolute transition-all duration-700 ease-out"
                              style={{
                                left: `${cx - 15}px`,
                                top: `${cy - 15}px`,
                                width: '30px',
                                height: '30px',
                                transform: `rotate(${rotation}deg)`
                              }}
                            >
                              {/* Wind barb visual representation */}
                              <svg viewBox="0 0 24 24" className="w-full h-full opacity-60">
                                <line x1="12" y1="20" x2="12" y2="4" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="4" x2="18" y2="9" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="9" x2="16" y2="13" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </div>
                          )
                        })}
                      </div>
                    )}

                  </div>

                  {/* Center position locator with pulsing waves */}
                  {currentLocation && (
                    <div className="absolute top-[250px] left-[250px] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-[44px] h-[44px] bg-rose-500/20 border border-rose-500 rounded-full animate-ping" />
                        <div className="absolute w-[80px] h-[80px] bg-rose-500/10 border border-rose-500/30 rounded-full animate-pulse" />
                        <div className="relative bg-rose-600 rounded-full p-2.5 shadow-lg border-2 border-white dark:border-slate-950">
                          <MapPin className="h-4.5 w-4.5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rotating Sweeper Line & Conic Radar wedge */}
                  <div className="absolute inset-0 pointer-events-none z-15">
                    <svg viewBox="0 0 500 500" className="w-full h-full">
                      {/* Wedge path rotating */}
                      <path 
                        d="M 250 250 L 250 15 A 235 235 0 0 1 315 23 Z" 
                        fill="#6366f1" 
                        fillOpacity="0.07" 
                        className="radar-wedge-node" 
                      />
                      {/* Sweeper needle */}
                      <line 
                        x1="250" y1="250" 
                        x2="250" y2="15" 
                        stroke="#6366f1" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        className="radar-sweep-node" 
                      />
                    </svg>
                  </div>

                  {/* Telemetry HUD overlays */}
                  {/* Top-Left Telemetry Console */}
                  <div className="absolute top-4 left-4 font-mono text-[9px] font-black text-indigo-400/80 leading-relaxed pointer-events-none tracking-wider">
                    <div>SYS: ACTIVE</div>
                    <div>FREQ: 24.85 GHZ</div>
                    <div>SWEEP RATE: 3.2s</div>
                  </div>

                  {/* Top-Right Sector Status */}
                  <div className="absolute top-4 right-4 text-right font-mono text-[9px] font-black text-indigo-400/80 leading-relaxed pointer-events-none tracking-wider">
                    <div>SECTOR: {weatherData?.location.toUpperCase() ?? "SYS_LOC"}</div>
                    <div>ZOOM: RANGE 150KM</div>
                    <div>MODE: {currentView.id.toUpperCase()}_SCAN</div>
                  </div>

                  {/* Bottom-Left Antenna Link */}
                  <div className="absolute bottom-4 left-4 font-mono text-[9px] font-black text-indigo-400/80 leading-relaxed pointer-events-none tracking-wider">
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Signal className="h-3 w-3" />
                      <span>SAT_LINK: ONLINE</span>
                    </div>
                    <div>SIG_LOCK: 98.4%</div>
                  </div>

                  {/* Bottom-Right Software details */}
                  <div className="absolute bottom-4 right-4 text-right font-mono text-[9px] font-black text-indigo-400/80 leading-relaxed pointer-events-none tracking-wider">
                    <div className="flex items-center gap-1 justify-end text-indigo-400">
                      <Cpu className="h-3 w-3" />
                      <span>CLIMA_CORE v4.0</span>
                    </div>
                    <div>TIME: {currentTime.toLocaleTimeString()}</div>
                  </div>

                </div>

                {/* Bottom Timeline Segments */}
                <div className="mt-6 border-t border-slate-150 dark:border-slate-800 pt-4">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    <span>Lapsed Scanner Captures (10-min increments)</span>
                    <span>Frame Step Timeline</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs font-semibold">
                    {Array.from({ length: 5 }, (_, i) => {
                      const time = new Date(Date.now() - (4 - i) * 10 * 60 * 1000)
                      const frameIndex = i * 2
                      const isHighlighted = frameIndex === currentFrame || (frameIndex + 1) === currentFrame
                      
                      return (
                        <div 
                          key={`timestamp-${i}`}
                          onClick={() => {
                            setCurrentFrame(frameIndex)
                            setIsPlaying(false)
                          }}
                          className={`text-center py-2.5 px-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                            isHighlighted
                              ? 'bg-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/10 font-bold'
                              : isDarkMode
                                ? 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="text-[10px] opacity-75 font-mono mb-0.5">
                            STEP 0{i + 1}
                          </div>
                          <div className="font-bold tracking-tight">
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>

        {/* Dynamic Weather Details Cards */}
        {weatherData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Precipitation status card */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:border-indigo-500/20`}>
              <div className={`h-1.5 w-full ${
                weatherData.rain && weatherData.rain > 0 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`} />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Precipitation Range
                    </h3>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {weatherData.rain || 0} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">mm/h</span>
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    weatherData.rain && weatherData.rain > 0
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500'
                  }`}>
                    <CloudRain className="h-5.5 w-5.5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Scan Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      weatherData.rain && weatherData.rain > 0
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-450'
                    }`}>
                      {getRainIntensityLabel(weatherData.rain || 0)}
                    </span>
                  </div>
                  
                  {/* Dynamic micro progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-550 ease-out"
                      style={{ width: `${Math.min(((weatherData.rain || 0) / 25) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cloud coverage status card */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:border-indigo-500/20`}>
              <div className="h-1.5 w-full bg-slate-450 dark:bg-slate-600" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Cloud Density
                    </h3>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {weatherData.clouds} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">%</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                    <Cloud className="h-5.5 w-5.5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Sky Condition:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-650 dark:bg-slate-950 dark:text-slate-350">
                      {weatherData.clouds < 25 ? 'Clear skies' : weatherData.clouds < 75 ? 'Partly cloudy' : 'Overcast'}
                    </span>
                  </div>
                  
                  {/* Cloud coverage progress */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-450 dark:bg-slate-550 rounded-full transition-all duration-550 ease-out"
                      style={{ width: `${weatherData.clouds}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wind velocity status card */}
            <Card className={`${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:border-indigo-500/20`}>
              <div className="h-1.5 w-full bg-emerald-500" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Wind Velocity
                    </h3>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {weatherData.windSpeed} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">km/h</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-650 dark:text-emerald-450">
                    <Wind className="h-5.5 w-5.5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 dark:border-slate-850 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Air Movement:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {weatherData.windSpeed < 5 ? 'Calm' : weatherData.windSpeed < 30 ? 'Moderate breeze' : 'Strong winds'}
                    </span>
                  </div>
                  
                  {/* Wind speed progress */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-550 ease-out"
                      style={{ width: `${Math.min((weatherData.windSpeed / 60) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Telemetry & Specifications Card */}
        <Card className={`${
          isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
        } rounded-2xl shadow-sm border`}>
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
            <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <AlertCircle className="h-4.5 w-4.5 text-indigo-500" />
              Sensor Specifications & Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                <div>
                  <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                    [ scan_source ]
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">
                    OpenWeatherMap GIS
                  </div>
                </div>
                <div className="font-mono text-[10px] text-indigo-650 dark:text-indigo-400 font-bold">
                  FEED_UPLINK: SECURE
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                <div>
                  <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                    [ radius_aperture ]
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2">
                    150km Scanning Sector
                  </div>
                </div>
                <div className="font-mono text-[10px] text-indigo-650 dark:text-indigo-400 font-bold">
                  RANGE_LIMIT: LOCK
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                <div>
                  <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                    [ doppler_mode ]
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-100 mt-2 truncate">
                    {currentView.name}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-indigo-650 dark:text-indigo-400 font-bold">
                  OVERLAY: {currentView.layer.toUpperCase()}
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 flex flex-col justify-between h-28 hover:border-indigo-500/20 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black">
                      [ calibration_status ]
                    </div>
                    <div className="text-sm font-black text-emerald-500 mt-2">
                      OPERATIONAL
                    </div>
                  </div>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping mt-1" />
                </div>
                <div className="font-mono text-[10px] text-emerald-650 dark:text-emerald-450 font-bold">
                  STABILITY: 100% ONLINE
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* Global CSS animations for radar rotation sweep */}
      <style jsx>{`
        .radar-sweep-node {
          transform-origin: 250px 250px;
          animation: sweepAnimation 4s linear infinite;
          stroke: #6366f1;
          filter: drop-shadow(0 0 5px rgba(99, 102, 241, 0.7));
        }
        .radar-wedge-node {
          transform-origin: 250px 250px;
          animation: sweepAnimation 4s linear infinite;
        }
        @keyframes sweepAnimation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}