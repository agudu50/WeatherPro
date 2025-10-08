"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CloudRain,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
  TrendingUp,
  TrendingDown,
  Navigation,
  Thermometer,
  Gauge,
  Activity,
  Calendar,
  MapPin,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  Zap,
  Moon,
} from "lucide-react"

interface HourlyForecast {
  dt: number
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  pop: number
  visibility: number
}

interface WeatherData {
  name: string
  coord: { lat: number; lon: number }
  sys: { country: string; sunrise: number; sunset: number }
}

export default function HourlyForecastPage() {
  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>([])
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false) // Default to light mode
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])

  const weatherIcons = {
    Clear: Sun,
    Clouds: Cloud,
    Rain: CloudRain,
    Drizzle: CloudDrizzle,
    Thunderstorm: CloudLightning,
    Snow: CloudSnow,
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("hourlyDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Generate particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    // Get user location and fetch data
    getUserLocation()

    // Update time
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("hourlyDarkMode", String(newDarkMode))
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      fetchHourlyData(51.5074, -0.1278)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchHourlyData(position.coords.latitude, position.coords.longitude)
      },
      () => {
        fetchHourlyData(51.5074, -0.1278)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const fetchHourlyData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch current weather for location info
      const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      const weatherInfo = await weatherResponse.json()
      setWeatherData(weatherInfo)

      // Fetch hourly forecast (using 5-day forecast API)
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch hourly data')
      
      const data = await forecastResponse.json()
      
      // Get next 24 hours (8 data points, 3-hour intervals)
      const next24Hours = data.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        wind_speed: item.wind.speed,
        weather: item.weather,
        pop: item.pop * 100,
        visibility: item.visibility || 10000
      }))
      
      setHourlyData(next24Hours)
      console.log('Live hourly data:', next24Hours)
    } catch (error) {
      console.error('Hourly fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTemp = (temp: number) => {
    const displayTemp = isCelsius ? temp : (temp * 9/5 + 32)
    return Math.round(displayTemp)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: true
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeOfDay = (timestamp: number) => {
    const hour = new Date(timestamp * 1000).getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  const getGradientForTimeOfDay = (timeOfDay: string) => {
    const gradients = {
      morning: 'from-orange-400 via-yellow-400 to-blue-400',
      afternoon: 'from-blue-400 via-cyan-400 to-blue-500',
      evening: 'from-purple-500 via-pink-500 to-orange-500',
      night: 'from-indigo-900 via-purple-900 to-blue-900'
    }
    return gradients[timeOfDay as keyof typeof gradients] || gradients.afternoon
  }

  const scrollHourly = (direction: 'left' | 'right') => {
    const container = document.getElementById('hourly-scroll')
    if (!container) return
    
    const scrollAmount = direction === 'left' ? -300 : 300
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } relative overflow-hidden transition-colors duration-500`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1 h-1 ${
              isDarkMode ? 'bg-blue-400/30' : 'bg-blue-600/20'
            } rounded-full animate-float`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-xl transition-colors duration-500`}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-r from-blue-400 to-purple-500'
                    } rounded-xl`}>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${
                      isDarkMode 
                        ? 'from-blue-400 via-purple-400 to-pink-400' 
                        : 'from-blue-600 via-purple-600 to-pink-600'
                    } bg-clip-text text-transparent`}>
                      Hourly Forecast
                    </h1>
                  </div>
                  <div className={`flex flex-wrap items-center gap-3 text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span>{weatherData?.name || 'Loading...'}, {weatherData?.sys.country || ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-purple-500" />
                      <span>{currentTime.toLocaleTimeString()}</span>
                    </div>
                    <Badge className={`${
                      isDarkMode 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : 'bg-green-100 text-green-700 border-green-300'
                    }`}>
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Live Updates
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    size="sm"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => setIsCelsius(!isCelsius)}
                    variant="outline"
                    size="sm"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    °{isCelsius ? 'C' : 'F'}
                  </Button>
                  <Button
                    onClick={getUserLocation}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className={`${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          } backdrop-blur-xl`}>
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className={`h-12 w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-spin mb-4`} />
              <p className="text-lg font-semibold">Loading live hourly forecast...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hourly Timeline Scroll */}
            <div className="mb-6">
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl overflow-hidden`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      Next 24 Hours
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => scrollHourly('left')}
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${
                          isDarkMode 
                            ? 'text-white hover:bg-white/10' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => scrollHourly('right')}
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 ${
                          isDarkMode 
                            ? 'text-white hover:bg-white/10' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    id="hourly-scroll"
                    className="flex gap-4 overflow-x-auto pb-4 px-6 scrollbar-hide scroll-smooth"
                  >
                    {hourlyData.map((hour, index) => {
                      const WeatherIcon = weatherIcons[hour.weather[0]?.main as keyof typeof weatherIcons] || Cloud
                      const timeOfDay = getTimeOfDay(hour.dt)
                      const isSelected = selectedHour === index
                      
                      return (
                        <button
                          key={hour.dt}
                          onClick={() => setSelectedHour(index)}
                          className={`flex-shrink-0 w-32 p-4 rounded-2xl transition-all duration-300 ${
                            isSelected
                              ? isDarkMode
                                ? 'bg-white/20 scale-105 shadow-xl border-2 border-white/30'
                                : 'bg-blue-100 scale-105 shadow-xl border-2 border-blue-300'
                              : isDarkMode
                                ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <div className="text-center space-y-3">
                            <p className="text-sm font-semibold">
                              {index === 0 ? 'Now' : formatTime(hour.dt)}
                            </p>
                            <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${getGradientForTimeOfDay(timeOfDay)} p-2 flex items-center justify-center`}>
                              <WeatherIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{formatTemp(hour.temp)}°</p>
                              <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'} capitalize`}>
                                {hour.weather[0]?.description}
                              </p>
                            </div>
                            {hour.pop > 0 && (
                              <div className={`flex items-center justify-center gap-1 ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-600'
                              }`}>
                                <CloudRain className="h-3 w-3" />
                                <span className="text-xs">{Math.round(hour.pop)}%</span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Hour View */}
            {selectedHour !== null && hourlyData[selectedHour] && (
              <div className="mb-6">
                <Card className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                } backdrop-blur-xl`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      Detailed Forecast - {formatTime(hourlyData[selectedHour].dt)}
                    </CardTitle>
                    <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                      {formatDate(hourlyData[selectedHour].dt)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          icon: Thermometer,
                          label: "Temperature",
                          value: `${formatTemp(hourlyData[selectedHour].temp)}°${isCelsius ? 'C' : 'F'}`,
                          subValue: `Feels like ${formatTemp(hourlyData[selectedHour].feels_like)}°`,
                          color: "from-red-500 to-orange-500"
                        },
                        {
                          icon: Droplets,
                          label: "Humidity",
                          value: `${hourlyData[selectedHour].humidity}%`,
                          subValue: hourlyData[selectedHour].pop > 0 ? `Rain: ${Math.round(hourlyData[selectedHour].pop)}%` : 'No rain',
                          color: "from-blue-500 to-cyan-500"
                        },
                        {
                          icon: Wind,
                          label: "Wind Speed",
                          value: `${Math.round(hourlyData[selectedHour].wind_speed * 3.6)} km/h`,
                          subValue: `${(hourlyData[selectedHour].wind_speed * 2.237).toFixed(1)} mph`,
                          color: "from-green-500 to-teal-500"
                        },
                        {
                          icon: Eye,
                          label: "Visibility",
                          value: `${(hourlyData[selectedHour].visibility / 1000).toFixed(1)} km`,
                          subValue: `${(hourlyData[selectedHour].visibility * 0.000621371).toFixed(1)} mi`,
                          color: "from-purple-500 to-pink-500"
                        },
                      ].map((stat, index) => {
                        const Icon = stat.icon
                        return (
                          <Card
                            key={index}
                            className={`${
                              isDarkMode 
                                ? 'bg-white/5 border-white/10' 
                                : 'bg-gray-50 border-gray-200'
                            } backdrop-blur-lg hover:scale-105 transition-transform duration-300`}
                          >
                            <CardContent className="p-4">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'} mb-1`}>
                                {stat.label}
                              </p>
                              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {stat.value}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-400'} mt-1`}>
                                {stat.subValue}
                              </p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Temperature Trend Chart */}
            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-xl mb-6`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  Temperature Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-48">
                  <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={i * 50}
                        x2="800"
                        y2={i * 50}
                        stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Temperature line */}
                    {hourlyData.length > 1 && (
                      <>
                        <defs>
                          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={isDarkMode ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.3)"} />
                            <stop offset="100%" stopColor={isDarkMode ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.05)"} />
                          </linearGradient>
                        </defs>
                        
                        {/* Area under curve */}
                        <path
                          d={`M 0 200 ${hourlyData.map((hour, i) => {
                            const x = (i / (hourlyData.length - 1)) * 800
                            const minTemp = Math.min(...hourlyData.map(h => h.temp))
                            const maxTemp = Math.max(...hourlyData.map(h => h.temp))
                            const y = 180 - ((hour.temp - minTemp) / (maxTemp - minTemp)) * 160
                            return `L ${x} ${y}`
                          }).join(' ')} L 800 200 Z`}
                          fill="url(#tempGradient)"
                        />
                        
                        {/* Line */}
                        <path
                          d={hourlyData.map((hour, i) => {
                            const x = (i / (hourlyData.length - 1)) * 800
                            const minTemp = Math.min(...hourlyData.map(h => h.temp))
                            const maxTemp = Math.max(...hourlyData.map(h => h.temp))
                            const y = 180 - ((hour.temp - minTemp) / (maxTemp - minTemp)) * 160
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                          }).join(' ')}
                          stroke={isDarkMode ? "rgba(59,130,246,0.8)" : "rgba(59,130,246,1)"}
                          strokeWidth="3"
                          fill="none"
                        />
                        
                        {/* Points */}
                        {hourlyData.map((hour, i) => {
                          const x = (i / (hourlyData.length - 1)) * 800
                          const minTemp = Math.min(...hourlyData.map(h => h.temp))
                          const maxTemp = Math.max(...hourlyData.map(h => h.temp))
                          const y = 180 - ((hour.temp - minTemp) / (maxTemp - minTemp)) * 160
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="5"
                              fill={isDarkMode ? "white" : "#3b82f6"}
                              stroke="rgba(59,130,246,1)"
                              strokeWidth="2"
                            />
                          )
                        })}
                      </>
                    )}
                  </svg>
                  
                  {/* Labels */}
                  <div className={`absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    {hourlyData.slice(0, 8).map((hour, i) => (
                      <span key={i}>{formatTime(hour.dt)}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sun Times */}
            {weatherData?.sys && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30' 
                    : 'bg-gradient-to-br from-orange-100 to-yellow-100 border-orange-300'
                } backdrop-blur-xl`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-orange-900'}`}>
                      <Sunrise className={`h-5 w-5 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} />
                      <span className="font-bold">Sunrise</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-orange-900'} drop-shadow-lg`}>
                      {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-orange-700'} mt-2`}>
                      Morning begins
                    </p>
                  </CardContent>
                </Card>

                <Card className={`${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300'
                } backdrop-blur-xl`}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                      <Sunset className={`h-5 w-5 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                      <span className="font-bold">Sunset</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'} drop-shadow-lg`}>
                      {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-purple-700'} mt-2`}>
                      Evening begins
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}