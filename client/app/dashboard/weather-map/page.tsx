"use client"

import { useTheme } from "@/client/lib/ThemeContext"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card"
import { Button } from "@/client/components/ui/button"
import { Badge } from "@/client/components/ui/badge"
import { Slider } from "@/client/components/ui/slider"
import {
  MapPin,
  Satellite,
  Layers,
  Zap,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Activity,
  TrendingUp,
  Clock,
  Loader2,
  Info,
  Search,
  Target,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react"
import { Input } from "@/client/components/ui/input"

interface WeatherData {
  coord: { lat: number; lon: number }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: { speed: number; deg: number }
  visibility: number
  name: string
  sys: { country: string }
}

export default function WeatherMapPage() {
  const [activeLayer, setActiveLayer] = useState("temperature")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(5)
  const [opacity, setOpacity] = useState([70])
  const [isAnimating, setIsAnimating] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [searchCity, setSearchCity] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])
  const [nearbyLocations, setNearbyLocations] = useState<Array<{name: string, lat: number, lon: number, temp: number}>>([])
  const { isDarkMode, toggleDarkMode } = useTheme() // Default to light mode
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [showLayersMobile, setShowLayersMobile] = useState(false)
  const [showDetailsMobile, setShowDetailsMobile] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  const mapLayers = [
    { 
      id: "temperature", 
      name: "Temperature", 
      icon: Thermometer, 
      color: "bg-rose-500",
      description: "Real-time temperature data"
    },
    { 
      id: "precipitation", 
      name: "Precipitation", 
      icon: CloudRain, 
      color: "bg-blue-500",
      description: "Live rainfall data"
    },
    { 
      id: "clouds", 
      name: "Cloud Cover", 
      icon: Satellite, 
      color: "bg-slate-500",
      description: "Cloud coverage percentage"
    },
    { 
      id: "pressure", 
      name: "Pressure", 
      icon: Gauge, 
      color: "bg-violet-500",
      description: "Atmospheric pressure"
    },
    { 
      id: "wind", 
      name: "Wind Speed", 
      icon: Wind, 
      color: "bg-teal-500",
      description: "Wind speed and direction"
    }
  ]

  // Initialize and fetch data
  useEffect(() => {
    // Load dark mode preference (defaults to false/light mode)
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === "true"
      
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Generate particles
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    // Get user location - THIS WILL USE YOUR LIVE LOCATION
    getUserLocation()

    // Update time
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh weather every 5 minutes
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      if (currentLocation?.lat && currentLocation?.lon) {
        fetchWeatherData(currentLocation.lat, currentLocation.lon)
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(refreshTimer)
  }, [currentLocation])

  

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using default location')
      setLocationStatus('error')
      fetchWeatherData(51.5074, -0.1278) // Fallback to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log('✅ Got your live location:', latitude, longitude)
        setCurrentLocation({ lat: latitude, lon: longitude })
        setLocationStatus('success')
        fetchWeatherData(latitude, longitude)
        fetchNearbyLocations(latitude, longitude)
      },
      (error) => {
        console.error('❌ Location access denied or error:', error.message)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        // Fallback to London if location access is denied
        setCurrentLocation({ lat: 51.5074, lon: -0.1278 })
        fetchWeatherData(51.5074, -0.1278)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    )
  }

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      if (!response.ok) throw new Error('Failed to fetch weather')
      const data = await response.json()
      setWeatherData(data)
      console.log('📍 Weather data for:', data.name, data.sys.country)
    } catch (error) {
      console.error('Weather fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNearbyLocations = async (lat: number, lon: number) => {
    const offsets = [
      { name: "North", latOffset: 0.5, lonOffset: 0 },
      { name: "South", latOffset: -0.5, lonOffset: 0 },
      { name: "East", latOffset: 0, lonOffset: 0.5 },
      { name: "West", latOffset: 0, lonOffset: -0.5 },
    ]

    const locations = await Promise.all(
      offsets.map(async (offset) => {
        try {
          const response = await fetch(
            `/api/weather?lat=${lat + offset.latOffset}&lon=${lon + offset.lonOffset}`
          )
          const data = await response.json()
          return {
            name: data.name,
            lat: data.coord.lat,
            lon: data.coord.lon,
            temp: Math.round(data.main.temp)
          }
        } catch {
          return null
        }
      })
    )

    setNearbyLocations(locations.filter(Boolean) as any)
  }

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(searchCity)}`)
      if (!response.ok) throw new Error('City not found')
      const data = await response.json()
      setWeatherData(data)
      setCurrentLocation({ lat: data.coord.lat, lon: data.coord.lon })
      fetchNearbyLocations(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const currentLayerInfo = mapLayers.find(l => l.id === activeLayer)

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-slate-950 text-white' 
        : 'bg-slate-50 text-slate-900'
    } relative overflow-x-hidden min-w-0 transition-colors duration-500`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1.5 h-1.5 ${
              isDarkMode ? 'bg-blue-300/15' : 'bg-blue-500/10'
            } rounded-full animate-float`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${5 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 sm:p-5 md:p-7 max-w-7xl w-full mx-auto pb-12 box-border">
        {/* Header Section */}
        <div className={`mb-6 p-4 sm:p-6 rounded-3xl border transition-all duration-500 ${
          isDarkMode 
            ? 'bg-slate-900/40 border-white/10 shadow-2xl' 
            : 'bg-white/40 border-white/30 shadow-xl'
        } backdrop-blur-xl`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white animate-pulse">
                <Satellite className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                  <span className="text-indigo-600 dark:text-indigo-400">Live Radar</span> & Satellite Map
                </h1>
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                  Doppler radar simulation and environmental satellite scans
                </p>
              </div>
            </div>

            {/* Actions Deck */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <form onSubmit={handleSearchCity} className="flex gap-2 flex-1 sm:flex-none w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search coordinates or city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className={`pl-9 py-2 w-full rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-indigo-500' 
                        : 'bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 shadow-md shadow-indigo-500/10">
                  Search
                </Button>
                <Button
                  type="button"
                  onClick={getUserLocation}
                  className="bg-violet-650 hover:bg-violet-750 text-white bg-violet-600 hover:bg-violet-700 rounded-2xl px-4 shadow-md shadow-violet-500/10"
                  title="Locate via GPS"
                >
                  <Target className="h-4 w-4" />
                </Button>
              </form>

              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="icon"
                  className={`w-10 h-10 rounded-2xl ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-850' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container View */}
        <div 
          ref={mapRef}
          className={`relative h-[650px] lg:h-[750px] w-full rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-lg transition-all duration-500 ${
            isDarkMode ? 'bg-slate-950 border-white/10' : 'bg-slate-100 border-white/30'
          }`}
        >
          {/* Base Simulated Map Canvas */}
          <div 
            className="absolute inset-0 transition-all duration-500"
            style={{
              opacity: opacity[0] / 100,
              transform: `scale(${1 + zoom * 0.05})`
            }}
          >
            {/* Topographic Landmasses Grid Simulation */}
            <div className={`absolute inset-0 bg-cover bg-center opacity-45 mix-blend-overlay ${
              isDarkMode ? 'bg-[radial-gradient(#ffffff0a_1px,transparent_1px)]' : 'bg-[radial-gradient(#0000000a_1px,transparent_1px)]'
            }`} style={{ backgroundSize: '20px 20px' }} />
            
            {/* Lat/Lon Grid lines overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <svg width="100%" height="100%" className="text-slate-400 dark:text-slate-600">
                <line x1="0" y1="25%" x2="100%" y2="25%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth="0.8" />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="0.8" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
                <text x="10" y="48%" className="text-[8px] fill-current font-mono opacity-80">0° Equator</text>
                <text x="49%" y="20" className="text-[8px] fill-current font-mono opacity-80">0° Prime Meridian</text>
              </svg>
            </div>

            {/* Base landmass styling */}
            <div className={`absolute inset-0 transition-colors duration-500 ${
              isDarkMode 
                ? 'bg-slate-950/90' 
                : 'bg-slate-100/90'
            }`} />

            {/* 1. TEMPERATURE LAYER EFFECT */}
            {activeLayer === 'temperature' && (
              <div className={`absolute inset-0 transition-opacity duration-500 ${isAnimating ? 'animate-pulse' : ''}`}>
                <div className={`absolute inset-0 ${
                  isDarkMode 
                    ? 'bg-rose-950/5' 
                    : 'bg-rose-50/5'
                }`} />
                {/* Thermal cells */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full blur-3xl transition-transform duration-1000"
                    style={{
                      left: `${20 + (i * 11) % 60}%`,
                      top: `${20 + (i * 9) % 60}%`,
                      width: `${120 + i * 15}px`,
                      height: `${120 + i * 15}px`,
                      background: `radial-gradient(circle, ${
                        isDarkMode 
                          ? ['rgba(244,63,94,0.15)', 'rgba(168,85,247,0.12)', 'rgba(99,102,241,0.15)'][i % 3]
                          : ['rgba(244,63,94,0.2)', 'rgba(168,85,247,0.15)', 'rgba(99,102,241,0.2)'][i % 3]
                      } 0%, transparent 80%)`,
                      animation: isAnimating ? 'float 8s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.4}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 2. PRECIPITATION LAYER EFFECT */}
            {activeLayer === 'precipitation' && (
              <div className="absolute inset-0">
                {/* Simulated falling drops */}
                {isAnimating && Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-[1.5px] h-8 bg-indigo-500/70 rounded-full"
                    style={{
                      left: `${(i * 17) % 100}%`,
                      top: `${(i * 13) % 100}%`,
                      animation: 'fall 2.2s linear infinite',
                      animationDelay: `${i * 0.08}s`
                    }}
                  />
                ))}
                {/* Splat ripples */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full border border-blue-400/30 pointer-events-none"
                    style={{
                      left: `${20 + (i * 11) % 60}%`,
                      top: `${30 + (i * 9) % 50}%`,
                      width: '60px',
                      height: '30px',
                      animation: isAnimating ? 'ripple 3.5s ease-out infinite' : 'none',
                      animationDelay: `${i * 0.4}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 3. CLOUDS LAYER EFFECT */}
            {activeLayer === 'clouds' && (
              <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute rounded-full blur-2xl opacity-60 pointer-events-none transition-all duration-1000 ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-450/20'
                    }`}
                    style={{
                      left: `${10 + (i * 15) % 80}%`,
                      top: `${15 + (i * 11) % 70}%`,
                      width: `${180 + i * 35}px`,
                      height: `${110 + i * 20}px`,
                      animation: isAnimating ? 'drift 22s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.8}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 4. WIND LAYER EFFECT */}
            {activeLayer === 'wind' && (
              <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute h-0.5 rounded-full bg-teal-400/50 pointer-events-none`}
                    style={{
                      left: `${(i * 19) % 100}%`,
                      top: `${(i * 11) % 100}%`,
                      width: `${100 + i * 15}px`,
                      transform: `rotate(${160 + (i * 3) % 40}deg)`,
                      animation: isAnimating ? 'slide 4.5s linear infinite' : 'none',
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* 5. PRESSURE LAYER EFFECT */}
            {activeLayer === 'pressure' && (
              <div className="absolute inset-0">
                {/* Pressure centers isobars */}
                {Array.from({ length: 3 }).map((_, cIdx) => {
                  const x = cIdx === 0 ? 30 : cIdx === 1 ? 70 : 50;
                  const y = cIdx === 0 ? 40 : cIdx === 1 ? 60 : 30;
                  const isLow = cIdx % 2 === 0;
                  return (
                    <div key={cIdx} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md border ${
                        isLow 
                          ? 'bg-red-500/80 border-red-400 text-white animate-bounce' 
                          : 'bg-blue-500/80 border-blue-400 text-white'
                      }`} style={{ transform: 'translate(-50%, -50%)', animationDuration: '4s' }}>
                        {isLow ? 'L' : 'H'}
                      </div>
                      {/* Concentric Isobar curves */}
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute rounded-full border border-dashed ${
                            isLow ? 'border-red-500/20' : 'border-blue-500/20'
                          }`}
                          style={{
                            width: `${80 + i * 50}px`,
                            height: `${80 + i * 50}px`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Doppler Satellite Radar Scan Sweep Animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
                {/* Grid Radar rings */}
                <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-400/40" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-400/40" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-400/40" />
                {/* Rotating scanning ray */}
                {isAnimating && (
                  <line 
                    x1="50" y1="50" x2="50" y2="5" 
                    stroke="url(#radarSweep)" strokeWidth="1.2" 
                    className="origin-[50px_50px] animate-[spin_8s_linear_infinite]" 
                  />
                )}
                <defs>
                  <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="30%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Target Location Beacon Marker */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 bg-blue-500 rounded-full animate-ping opacity-60" />
                <div className="absolute w-8 h-8 bg-blue-500 rounded-full animate-pulse opacity-40" />
                <div className="relative bg-blue-600 dark:bg-blue-500 text-white rounded-full p-3.5 shadow-2xl border-2 border-white scale-105 hover:scale-110 active:scale-95 transition-transform duration-300">
                  <Navigation className="h-5 w-5 rotate-45" />
                </div>
              </div>
            </div>

            {/* Adjacent micro-locations markers */}
            {nearbyLocations.map((location, index) => {
              const angles = [45, 135, 225, 315]
              const angle = angles[index % 4] * (Math.PI / 180)
              const radius = 220
              const x = 50 + radius * Math.cos(angle) / 4
              const y = 50 + radius * Math.sin(angle) / 4
              
              return (
                <div
                  key={index}
                  className="absolute z-10 cursor-pointer group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`p-2 rounded-full border transition-all duration-300 group-hover:scale-110 shadow-md ${
                    isDarkMode ? 'bg-slate-900 border-white/20' : 'bg-white border-slate-200'
                  }`}>
                    <MapPin className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
                  </div>
                  
                  {/* Hover tooltip card */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    <div className="bg-slate-900/95 border border-white/10 backdrop-blur-md rounded-xl p-2.5 shadow-xl text-left whitespace-nowrap">
                      <p className="text-white font-extrabold text-xs">{location.name}</p>
                      <p className="text-blue-400 font-bold text-[10px] mt-0.5">{location.temp}°C</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* FLOATING GLASS OVERLAY PANELS ON THE MAP CONTAINER */}

          {/* Top Left Mobile Trigger: Layers Menu */}
          <div className="absolute top-4 left-4 z-30 md:hidden">
            <Button
              onClick={() => {
                setShowLayersMobile(!showLayersMobile)
                setShowDetailsMobile(false)
              }}
              size="icon"
              variant="ghost"
              className={`w-10 h-10 rounded-2xl shadow-lg border backdrop-blur-md hover:scale-105 active:scale-95 transition-transform ${
                isDarkMode 
                  ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800' 
                  : 'bg-white/80 border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-4.5 w-4.5 text-indigo-500" />
            </Button>
          </div>

          {/* Top Right Mobile Trigger: Weather Station Details */}
          {weatherData && (
            <div className="absolute top-4 right-16 z-30 md:hidden">
              <Button
                onClick={() => {
                  setShowDetailsMobile(!showDetailsMobile)
                  setShowLayersMobile(false)
                }}
                className={`px-3 h-10 rounded-2xl shadow-lg border backdrop-blur-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform ${
                  isDarkMode 
                    ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800' 
                    : 'bg-white/80 border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <MapPin className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-black">{Math.round(weatherData.main.temp)}°C</span>
              </Button>
            </div>
          )}

          {/* Top Right: Fullscreen control button */}
          <div className="absolute top-4 right-4 z-30">
            <Button
              onClick={toggleFullscreen}
              size="icon"
              variant="ghost"
              className={`w-10 h-10 rounded-2xl shadow-lg border backdrop-blur-md hover:scale-105 active:scale-95 transition-transform ${
                isDarkMode 
                  ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800' 
                  : 'bg-white/80 border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
            </Button>
          </div>

          {/* Left Side Overlay Panel: Map Layer Selection Pod */}
          <div className={`absolute z-35 max-w-[220px] sm:max-w-[260px] w-full text-left transition-all ${
            showLayersMobile ? 'top-16 left-4 block animate-in fade-in slide-in-from-top-4 duration-200' : 'hidden'
          } md:block md:top-4 md:left-4`}>
            <div className={`p-3 rounded-3xl border shadow-2xl backdrop-blur-xl ${
              isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
            }`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Map Layers</span>
              </div>
              <div className="space-y-1.5">
                {mapLayers.map((layer) => {
                  const Icon = layer.icon
                  const isActive = activeLayer === layer.id
                  return (
                    <button
                      key={layer.id}
                      onClick={() => {
                        setActiveLayer(layer.id)
                        setShowLayersMobile(false)
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center gap-2.5 transition-all text-left group ${
                        isActive
                          ? isDarkMode
                            ? 'bg-white/10 scale-[1.02] border border-white/10'
                            : 'bg-indigo-600 text-white scale-[1.02] shadow-md shadow-indigo-500/10'
                          : isDarkMode
                            ? 'hover:bg-white/5 border border-transparent'
                            : 'hover:bg-slate-100 border border-transparent'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl flex-shrink-0 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : layer.color
                      } text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-extrabold ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{layer.name}</p>
                        <p className={`text-[9px] ${
                          isActive 
                            ? 'text-white/85' 
                            : 'text-slate-500 dark:text-slate-400'
                        } truncate font-semibold`}>
                          {layer.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Side Overlay Panel: Selected Station Weather Details */}
          {weatherData && (
            <div className={`absolute z-35 max-w-[220px] sm:max-w-[260px] w-full text-left transition-all ${
              showDetailsMobile ? 'top-16 right-4 block animate-in fade-in slide-in-from-top-4 duration-200' : 'hidden'
            } md:block md:top-4 md:right-4`}>
              <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${
                isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <MapPin className="h-4 w-4 text-rose-500 animate-bounce" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">{weatherData.name}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">{weatherData.sys.country}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Temperature Info */}
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      {Math.round(weatherData.main.temp)}°C
                    </div>
                    <div className="text-left leading-tight">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase block tracking-wide">Feels Like</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{Math.round(weatherData.main.feels_like)}°C</span>
                    </div>
                  </div>

                  {/* Weather description */}
                  <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
                    {weatherData.weather[0]?.icon && (
                      <img 
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} 
                        alt="Weather status"
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="text-xs font-bold capitalize text-slate-800 dark:text-slate-200 truncate">{weatherData.weather[0]?.description}</span>
                  </div>

                  {/* Info metrics grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200/50 dark:border-slate-800/50 p-2 rounded-xl text-center">
                      <Droplets className="h-3.5 w-3.5 mx-auto mb-1 text-blue-500 dark:text-blue-400" />
                      <p className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold tracking-wider">Humidity</p>
                      <p className="text-slate-900 dark:text-white font-extrabold text-xs">{weatherData.main.humidity}%</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200/50 dark:border-slate-800/50 p-2 rounded-xl text-center">
                      <Wind className="h-3.5 w-3.5 mx-auto mb-1 text-teal-500 dark:text-teal-400" />
                      <p className="text-slate-500 dark:text-slate-400 text-[8px] uppercase font-bold tracking-wider">Wind</p>
                      <p className="text-slate-900 dark:text-white font-extrabold text-xs">{Math.round(weatherData.wind.speed * 3.6)} km/h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Float Panel: Temporal Slider, Legend, Playback Controls */}
          <div className="absolute bottom-4 left-4 right-4 z-30">
            <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${
              isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                
                {/* 1. Playback controls */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsAnimating(!isAnimating)}
                    size="icon"
                    className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 flex-shrink-0"
                    title={isAnimating ? "Pause scanning animation" : "Resume scanning animation"}
                  >
                    {isAnimating ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 ml-0.5" />}
                  </Button>
                  
                  <div className="text-left leading-tight">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Radar Scan Rate</p>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {isAnimating ? "Simulating Real-Time Doppler Sweeps" : "Radar Scan Paused"}
                    </p>
                  </div>
                </div>

                {/* 2. Map Settings (Opacity & Zoom) */}
                <div className="flex flex-1 items-center gap-4 max-w-md w-full">
                  <div className="w-full text-left">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Radar Layer Opacity</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{opacity[0]}%</span>
                    </div>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>

                  {/* Zoom indicator block */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      onClick={() => setZoom(Math.max(1, zoom - 1))}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs font-extrabold font-mono w-6 text-center text-slate-800 dark:text-slate-200">{zoom}x</span>
                    <Button
                      onClick={() => setZoom(Math.min(15, zoom + 1))}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* 3. Color Legend mapping */}
                {currentLayerInfo && (
                  <div className="w-full md:w-48 text-left">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                      {currentLayerInfo.name} Legend
                    </p>
                    <div className="flex gap-1 mb-1.5">
                      <div className={`h-2 rounded-l-full flex-1 ${currentLayerInfo.color} opacity-20`} />
                      <div className={`h-2 flex-1 ${currentLayerInfo.color} opacity-40`} />
                      <div className={`h-2 flex-1 ${currentLayerInfo.color} opacity-60`} />
                      <div className={`h-2 flex-1 ${currentLayerInfo.color} opacity-80`} />
                      <div className={`h-2 rounded-r-full flex-1 ${currentLayerInfo.color}`} />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 font-mono leading-none">
                      <span>Low</span>
                      <span>Mid</span>
                      <span>High</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Central loading indicator */}
          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
              <div className={`p-6 rounded-3xl border shadow-2xl flex flex-col items-center gap-4 text-center max-w-[280px] ${
                isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
              }`}>
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                <div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">Syncing Radar Feeds</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Connecting to live weather grid...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom geographical warnings tracker */}
        {weatherData && (
          <div className="mt-6">
            <Card className={`border rounded-3xl overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
            }`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
                      <AlertCircle className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">Doppler Monitoring Center</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Active satellite radar is scanning coordinates {weatherData.coord.lat.toFixed(4)}°, {weatherData.coord.lon.toFixed(4)}°
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs py-1 px-3 border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-500/5">
                    Station Status: Active Scans
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.25;
          }
          50% {
            transform: translateY(-15px) translateX(5px);
            opacity: 0.5;
          }
        }
        @keyframes fall {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(300px);
            opacity: 0;
          }
        }
        @keyframes slide {
          0% {
            transform: translateX(-150px);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(350px);
            opacity: 0;
          }
        }
        @keyframes drift {
          0%, 100% {
            transform: translateX(0px) translateY(0px);
          }
          50% {
            transform: translateX(35px) translateY(-10px);
          }
        }
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}