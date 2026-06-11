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
  Thermometer,
  Gauge,
  Activity,
  Calendar,
  MapPin,
  RefreshCw,
  Loader2,
  Sun,
  Cloud,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  Zap,
  Moon,
  Download,
  Share2,
  Filter,
  AlertCircle,
  Umbrella,
  Shirt,
  Wind as WindIcon,
  Info,
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
  pressure?: number
  wind_deg?: number
  clouds?: number
  dew_point?: number
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
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])
  const [showComparison, setShowComparison] = useState(false)
  const [filterMetric, setFilterMetric] = useState<'all' | 'rain' | 'temp' | 'wind'>('all')
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'chart'>('card')
  const [showDetails, setShowDetails] = useState(false)
  const [chartMetric, setChartMetric] = useState<'temp' | 'humidity' | 'wind' | 'pressure'>('temp')
  const [compareHours, setCompareHours] = useState<number[]>([])
  const [showAlerts, setShowAlerts] = useState(true)
  const [animatedGradient, setAnimatedGradient] = useState(0)

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
    
    // Animate gradient
    const gradientTimer = setInterval(() => {
      setAnimatedGradient(prev => (prev + 1) % 360)
    }, 50)
    
    return () => {
      clearInterval(timer)
      clearInterval(gradientTimer)
    }
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
        visibility: item.visibility || 10000,
        pressure: item.main.pressure,
        wind_deg: item.wind.deg,
        clouds: item.clouds?.all || 0,
        dew_point: item.main.temp - ((100 - item.main.humidity) / 5)
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

  // Removed horizontal scroll controls; layout now uses a wrapping grid

  const getWeatherInsights = () => {
    if (hourlyData.length === 0) return null

    const temps = hourlyData.map(h => h.temp)
    const hottestHour = hourlyData.reduce((max, h) => h.temp > max.temp ? h : max, hourlyData[0])
    const coldestHour = hourlyData.reduce((min, h) => h.temp < min.temp ? h : min, hourlyData[0])
    const rainiestHour = hourlyData.reduce((max, h) => h.pop > max.pop ? h : max, hourlyData[0])
    const maxWind = Math.max(...hourlyData.map(h => h.wind_speed))
    const avgHumidity = Math.round(hourlyData.reduce((sum, h) => sum + h.humidity, 0) / hourlyData.length)

    return { hottestHour, coldestHour, rainiestHour, maxWind, avgHumidity }
  }

  const getRecommendations = () => {
    if (hourlyData.length === 0) return []

    const recommendations: string[] = []
    const avgTemp = hourlyData.reduce((sum, h) => sum + h.temp, 0) / hourlyData.length
    const maxPop = Math.max(...hourlyData.map(h => h.pop))
    const maxWind = Math.max(...hourlyData.map(h => h.wind_speed * 3.6))

    if (maxPop > 70) {
      recommendations.push("🌧️ High rain probability - bring an umbrella!")
    } else if (maxPop > 40) {
      recommendations.push("☔ Possible rain - keep an umbrella handy")
    }

    if (avgTemp < 0) {
      recommendations.push("🧥 Very cold - bundle up with heavy winter coat")
    } else if (avgTemp < 10) {
      recommendations.push("🧣 Cold weather - wear warm layers")
    } else if (avgTemp < 20) {
      recommendations.push("👔 Cool temperature - light jacket recommended")
    } else if (avgTemp < 30) {
      recommendations.push("👕 Pleasant weather - comfortable for outdoor activities")
    } else {
      recommendations.push("🌞 Hot weather - stay hydrated and use sunscreen")
    }

    if (maxWind > 50) {
      recommendations.push("💨 Very windy - secure loose objects")
    } else if (maxWind > 30) {
      recommendations.push("🍃 Windy conditions - dress accordingly")
    }

    return recommendations
  }

  const exportData = () => {
    const csv = [
      ['Time', 'Temperature (°C)', 'Feels Like', 'Humidity (%)', 'Wind (km/h)', 'Rain %', 'Weather', 'Pressure (hPa)', 'Visibility (km)'],
      ...hourlyData.map(hour => [
        formatTime(hour.dt),
        hour.temp.toFixed(1),
        hour.feels_like.toFixed(1),
        hour.humidity,
        (hour.wind_speed * 3.6).toFixed(1),
        Math.round(hour.pop),
        hour.weather[0]?.description || '',
        hour.pressure || 'N/A',
        (hour.visibility / 1000).toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hourly-forecast-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getWindDirection = (deg?: number) => {
    if (deg === undefined) return 'N/A'
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return directions[Math.round(deg / 22.5) % 16]
  }

  const getComfortLevel = (temp: number, humidity: number) => {
    if (temp < 0) return { level: 'Very Cold', color: 'blue', emoji: '🥶' }
    if (temp < 10) return { level: 'Cold', color: 'cyan', emoji: '🧊' }
    if (temp < 15) return { level: 'Cool', color: 'teal', emoji: '😊' }
    if (temp < 25) return { level: 'Comfortable', color: 'green', emoji: '✨' }
    if (temp < 30) return { level: 'Warm', color: 'yellow', emoji: '☀️' }
    if (temp < 35) return { level: 'Hot', color: 'orange', emoji: '🌡️' }
    return { level: 'Very Hot', color: 'red', emoji: '🔥' }
  }

  const shareWeather = async () => {
    const shareText = `Weather in ${weatherData?.name}: ${hourlyData[0]?.temp.toFixed(1)}°C, ${hourlyData[0]?.weather[0]?.description}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Weather Update', text: shareText })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Weather info copied to clipboard!')
    }
  }

  const getWeatherAlerts = () => {
    if (hourlyData.length === 0) return []
    
    const alerts: Array<{type: 'warning' | 'info' | 'danger'; message: string; icon: string}> = []
    
    const highestTemp = Math.max(...hourlyData.map(h => h.temp))
    const lowestTemp = Math.min(...hourlyData.map(h => h.temp))
    const maxRain = Math.max(...hourlyData.map(h => h.pop))
    const maxWind = Math.max(...hourlyData.map(h => h.wind_speed * 3.6))
    
    if (highestTemp > 35) {
      alerts.push({
        type: 'danger',
        message: `Extreme heat expected: ${Math.round(highestTemp)}°C. Stay hydrated and avoid prolonged sun exposure.`,
        icon: '🔥'
      })
    } else if (highestTemp > 30) {
      alerts.push({
        type: 'warning',
        message: `Hot weather ahead: ${Math.round(highestTemp)}°C. Use sunscreen and drink plenty of water.`,
        icon: '☀️'
      })
    }
    
    if (lowestTemp < 0) {
      alerts.push({
        type: 'danger',
        message: `Freezing temperatures: ${Math.round(lowestTemp)}°C. Risk of ice formation on roads.`,
        icon: '❄️'
      })
    } else if (lowestTemp < 5) {
      alerts.push({
        type: 'warning',
        message: `Cold conditions: ${Math.round(lowestTemp)}°C. Dress warmly.`,
        icon: '🧥'
      })
    }
    
    if (maxRain > 80) {
      alerts.push({
        type: 'danger',
        message: `Heavy rain expected: ${Math.round(maxRain)}% probability. Possible flooding in low areas.`,
        icon: '⚠️'
      })
    } else if (maxRain > 60) {
      alerts.push({
        type: 'warning',
        message: `Significant rain likely: ${Math.round(maxRain)}% chance. Carry an umbrella.`,
        icon: '☔'
      })
    }
    
    if (maxWind > 60) {
      alerts.push({
        type: 'danger',
        message: `Very strong winds: ${Math.round(maxWind)} km/h. Secure outdoor items and avoid tree-lined routes.`,
        icon: '💨'
      })
    } else if (maxWind > 40) {
      alerts.push({
        type: 'warning',
        message: `Windy conditions: ${Math.round(maxWind)} km/h. Be cautious when driving.`,
        icon: '🌬️'
      })
    }
    
    const tempChange = Math.abs(highestTemp - lowestTemp)
    if (tempChange > 15) {
      alerts.push({
        type: 'info',
        message: `Large temperature swing: ${Math.round(tempChange)}°C difference today. Dress in layers.`,
        icon: '🌡️'
      })
    }
    
    return alerts
  }

  const getDayPartSummary = () => {
    if (hourlyData.length === 0) return []
    
    const now = new Date()
    const summaries = []
    
    // Morning (6am - 12pm)
    const morningHours = hourlyData.filter(h => {
      const hour = new Date(h.dt * 1000).getHours()
      return hour >= 6 && hour < 12
    })
    
    if (morningHours.length > 0) {
      const avgTemp = morningHours.reduce((sum, h) => sum + h.temp, 0) / morningHours.length
      const maxRain = Math.max(...morningHours.map(h => h.pop))
      summaries.push({
        period: 'Morning',
        icon: '🌅',
        temp: avgTemp,
        rain: maxRain,
        description: morningHours[0].weather[0]?.main,
        gradient: 'from-orange-400 via-yellow-300 to-amber-400'
      })
    }
    
    // Afternoon (12pm - 5pm)
    const afternoonHours = hourlyData.filter(h => {
      const hour = new Date(h.dt * 1000).getHours()
      return hour >= 12 && hour < 17
    })
    
    if (afternoonHours.length > 0) {
      const avgTemp = afternoonHours.reduce((sum, h) => sum + h.temp, 0) / afternoonHours.length
      const maxRain = Math.max(...afternoonHours.map(h => h.pop))
      summaries.push({
        period: 'Afternoon',
        icon: '☀️',
        temp: avgTemp,
        rain: maxRain,
        description: afternoonHours[0].weather[0]?.main,
        gradient: 'from-blue-400 via-sky-400 to-cyan-400'
      })
    }
    
    // Evening (5pm - 9pm)
    const eveningHours = hourlyData.filter(h => {
      const hour = new Date(h.dt * 1000).getHours()
      return hour >= 17 && hour < 21
    })
    
    if (eveningHours.length > 0) {
      const avgTemp = eveningHours.reduce((sum, h) => sum + h.temp, 0) / eveningHours.length
      const maxRain = Math.max(...eveningHours.map(h => h.pop))
      summaries.push({
        period: 'Evening',
        icon: '🌆',
        temp: avgTemp,
        rain: maxRain,
        description: eveningHours[0].weather[0]?.main,
        gradient: 'from-purple-500 via-pink-400 to-rose-400'
      })
    }
    
    // Night (9pm - 6am)
    const nightHours = hourlyData.filter(h => {
      const hour = new Date(h.dt * 1000).getHours()
      return hour >= 21 || hour < 6
    })
    
    if (nightHours.length > 0) {
      const avgTemp = nightHours.reduce((sum, h) => sum + h.temp, 0) / nightHours.length
      const maxRain = Math.max(...nightHours.map(h => h.pop))
      summaries.push({
        period: 'Night',
        icon: '🌙',
        temp: avgTemp,
        rain: maxRain,
        description: nightHours[0].weather[0]?.main,
        gradient: 'from-indigo-900 via-blue-900 to-purple-900'
      })
    }
    
    return summaries
  }

  const toggleCompareHour = (index: number) => {
    setCompareHours(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      } else if (prev.length < 3) {
        return [...prev, index]
      } else {
        return [...prev.slice(1), index]
      }
    })
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden min-w-0 transition-all duration-1000`}
      style={{
        background: isDarkMode 
          ? `linear-gradient(${animatedGradient}deg, #0f172a, #1e3a8a, #312e81, #4c1d95)`
          : `linear-gradient(${animatedGradient}deg, #dbeafe, #e0e7ff, #f3e8ff, #fce7f3)`
      }}
    >
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
        
        {/* Additional animated elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      <div className="relative z-10 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 sm:pb-12 box-border px-2 sm:px-4 md:px-6 min-w-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} transition-all duration-500 rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/80 to-purple-900/80' : 'from-indigo-50 to-purple-50'}`}>
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.5),transparent_45%)]'}`} />
            <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/10' : 'border-white/50'} rounded-2xl`} />
            <CardContent className="relative z-10 p-3 sm:p-4 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg ring-1 ring-white/25">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow" />
                    </div>
                    <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${
                      isDarkMode 
                        ? 'text-white' 
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
                    }`}>
                      Hourly Forecast
                    </h1>
                  </div>
                  <div className={`flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-indigo-700'
                  }`}>
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className={`h-3 w-3 sm:h-4 sm:w-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
                      <span className="truncate font-medium">{weatherData?.name || 'Loading...'}{weatherData?.sys.country ? `, ${weatherData.sys.country}` : ''}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1 min-w-0">
                      <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-1">
                      <Clock className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span>{currentTime.toLocaleTimeString()}</span>
                    </div>
                    <Badge className={`flex-shrink-0 ${
                      isDarkMode 
                        ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                        : 'bg-green-100 text-green-700 border-green-300'
                    }`}>
                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    size="sm"
                    className={`px-3 ${
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
                    className={`px-3 ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    °{isCelsius ? 'C' : 'F'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowComparison(!showComparison)
                      if (showComparison) setCompareHours([])
                    }}
                    variant="outline"
                    size="sm"
                    className={`px-2 sm:px-3 ${
                      showComparison
                        ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-none'
                        : isDarkMode 
                          ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <span className="hidden sm:inline text-xs">Compare</span>
                    <span className="sm:hidden">⚖️</span>
                  </Button>
                  <Button
                    onClick={() => setViewMode(viewMode === 'card' ? 'list' : viewMode === 'list' ? 'chart' : 'card')}
                    variant="outline"
                    size="sm"
                    className={`px-3 ${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {viewMode === 'card' ? '📊' : viewMode === 'list' ? '📈' : '🎴'}
                  </Button>
                  <Button
                    onClick={shareWeather}
                    variant="outline"
                    size="sm"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={getUserLocation}
                    size="sm"
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    <span className="hidden xs:inline sm:hidden md:inline">Refresh</span>
                  </Button>
                  <Button
                    onClick={exportData}
                    size="sm"
                    variant="outline"
                    className={`${
                      isDarkMode 
                        ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                        : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <Download className="h-4 w-4" />
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
            {/* Weather Insights Summary */}
            {hourlyData.length > 0 && (() => {
              const insights = getWeatherInsights()
              if (!insights) return null

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                  {/* HOTTEST Card */}
                  <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-rose-600 via-pink-700 to-red-800' : 'from-rose-400 via-pink-500 to-red-500'} text-white cursor-pointer active:scale-100`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                    <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-semibold text-white group-hover:scale-105 transition-transform origin-left">
                            HOTTEST
                          </CardTitle>
                          <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow group-hover:drop-shadow-lg" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-2 group-hover:scale-110 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-shadow-lg transition-all">
                            {formatTemp(insights.hottestHour.temp)}°
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white/95 transition-colors">
                          at {formatTime(insights.hottestHour.dt)}
                        </p>
                      </CardContent>
                    </div>
                  </Card>

                  {/* COLDEST Card */}
                  <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-cyan-600 via-blue-700 to-indigo-800' : 'from-cyan-400 via-blue-500 to-indigo-600'} text-white cursor-pointer active:scale-100`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                    <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-semibold text-white group-hover:scale-105 transition-transform origin-left">
                            COLDEST
                          </CardTitle>
                          <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                            <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow group-hover:drop-shadow-lg" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-2 group-hover:scale-110 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-shadow-lg transition-all">
                            {formatTemp(insights.coldestHour.temp)}°
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white/95 transition-colors">
                          at {formatTime(insights.coldestHour.dt)}
                        </p>
                      </CardContent>
                    </div>
                  </Card>

                  {/* RAIN PEAK Card */}
                  <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-violet-600 via-purple-700 to-fuchsia-800' : 'from-violet-400 via-purple-500 to-fuchsia-600'} text-white cursor-pointer active:scale-100`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                    <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-semibold text-white group-hover:scale-105 transition-transform origin-left">
                            RAIN PEAK
                          </CardTitle>
                          <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                            <CloudRain className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow group-hover:drop-shadow-lg" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-2 group-hover:scale-110 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-shadow-lg transition-all">
                            {Math.round(insights.rainiestHour.pop)}%
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white/95 transition-colors">
                          at {formatTime(insights.rainiestHour.dt)}
                        </p>
                      </CardContent>
                    </div>
                  </Card>

                  {/* MAX WIND Card */}
                  <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-green-600 via-emerald-700 to-teal-800' : 'from-green-400 via-emerald-500 to-teal-600'} text-white cursor-pointer active:scale-100`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                    <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                    <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs sm:text-sm font-semibold text-white group-hover:scale-105 transition-transform origin-left">
                            MAX WIND
                          </CardTitle>
                          <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                            <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow group-hover:drop-shadow-lg" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1 sm:mb-2 group-hover:scale-110 transition-transform origin-left">
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-shadow-lg transition-all">
                            {Math.round(insights.maxWind * 3.6)}
                          </span>
                          <span className="text-white/80 text-xs sm:text-sm font-medium group-hover:text-white transition-colors">km/h</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-white/80 font-medium group-hover:text-white/95 transition-colors">
                          peak speed
                        </p>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              )
            })()}

            {/* Weather Alerts */}
            {hourlyData.length > 0 && showAlerts && (() => {
              const alerts = getWeatherAlerts()
              if (alerts.length === 0) return null

              return (
                <Card className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                } backdrop-blur-xl mb-4 sm:mb-6 overflow-hidden`}>
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                        <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} animate-pulse`} />
                        <span className="truncate">Weather Alerts</span>
                      </CardTitle>
                      <Button
                        onClick={() => setShowAlerts(false)}
                        size="sm"
                        variant="ghost"
                        className={isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                      >
                        <span className="text-xs">Dismiss</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 space-y-3">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border-l-4 ${
                          alert.type === 'danger'
                            ? isDarkMode
                              ? 'bg-red-500/10 border-red-500'
                              : 'bg-red-50 border-red-500'
                            : alert.type === 'warning'
                              ? isDarkMode
                                ? 'bg-yellow-500/10 border-yellow-500'
                                : 'bg-yellow-50 border-yellow-500'
                              : isDarkMode
                                ? 'bg-blue-500/10 border-blue-500'
                                : 'bg-blue-50 border-blue-500'
                        } transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold mb-1 uppercase tracking-wider ${
                            alert.type === 'danger'
                              ? 'text-red-600 dark:text-red-400'
                              : alert.type === 'warning'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {alert.type === 'danger' ? 'Danger' : alert.type === 'warning' ? 'Warning' : 'Info'}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Day Part Summary */}
            {hourlyData.length > 0 && (() => {
              const summaries = getDayPartSummary()
              if (summaries.length === 0) return null

              return (
                <div className="mb-4 sm:mb-6">
                  <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Calendar className="h-5 w-5" />
                    Today's Forecast
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {summaries.map((summary, index) => (
                      <Card
                        key={index}
                        className={`${
                          isDarkMode 
                            ? 'bg-white/10 border-white/20' 
                            : 'bg-white border-gray-200'
                        } backdrop-blur-xl hover:scale-105 transition-all duration-300 overflow-hidden group cursor-pointer`}
                      >
                        <div className={`h-2 bg-gradient-to-r ${summary.gradient}`} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{summary.icon}</span>
                            <Badge className={`${
                              isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                            } capitalize`}>
                              {summary.description}
                            </Badge>
                          </div>
                          <h4 className={`text-sm font-semibold mb-2 ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            {summary.period}
                          </h4>
                          <p className={`text-3xl font-bold mb-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatTemp(summary.temp)}°
                          </p>
                          {summary.rain > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <CloudRain className={`h-4 w-4 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`} />
                              <span className={`text-sm ${
                                isDarkMode ? 'text-white/70' : 'text-gray-600'
                              }`}>
                                {Math.round(summary.rain)}% rain
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Precipitation Timeline */}
            {hourlyData.length > 0 && Math.max(...hourlyData.map(h => h.pop)) > 0 && (
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl mb-4 sm:mb-6`}>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <Umbrella className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className="truncate">Precipitation Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-2">
                    {hourlyData.map((hour, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className={`text-xs w-16 flex-shrink-0 ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>
                          {formatTime(hour.dt)}
                        </span>
                        <div className="flex-1 h-8 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              hour.pop > 70 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                                : hour.pop > 40
                                  ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                                  : 'bg-gradient-to-r from-blue-300 to-blue-400'
                            }`}
                            style={{ width: `${hour.pop}%` }}
                          >
                            {hour.pop > 20 && (
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                                {Math.round(hour.pop)}%
                              </span>
                            )}
                          </div>
                        </div>
                        {hour.pop > 0 && (
                          <CloudRain className={`h-4 w-4 flex-shrink-0 ${
                            hour.pop > 70 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-blue-400 dark:text-blue-300'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temperature Comparison Chart (Feels-Like vs Actual) */}
            {hourlyData.length > 0 && (
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl mb-4 sm:mb-6`}>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <Thermometer className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span className="truncate">Temperature: Actual vs Feels Like</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="relative h-64">
                    <svg className="w-full h-full" viewBox="0 0 800 280" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="actualTempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(239,68,68,0.4)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <linearGradient id="feelsLikeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(59,130,246,0.4)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 70}
                          x2="800"
                          y2={i * 70}
                          stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                          strokeWidth="1"
                        />
                      ))}
                      
                      {/* Data */}
                      {hourlyData.length > 1 && (() => {
                        const temps = hourlyData.map(h => h.temp)
                        const feelsLike = hourlyData.map(h => h.feels_like)
                        const minTemp = Math.min(...temps, ...feelsLike)
                        const maxTemp = Math.max(...temps, ...feelsLike)
                        
                        return (
                          <>
                            {/* Actual Temperature */}
                            <path
                              d={`M 0 280 ${hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 260 - ((hour.temp - minTemp) / (maxTemp - minTemp)) * 240
                                return `L ${x} ${y}`
                              }).join(' ')} L 800 280 Z`}
                              fill="url(#actualTempGradient)"
                            />
                            <path
                              d={hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 260 - ((hour.temp - minTemp) / (maxTemp - minTemp)) * 240
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                              }).join(' ')}
                              stroke="rgba(239,68,68,1)"
                              strokeWidth="3"
                              fill="none"
                            />
                            
                            {/* Feels Like Temperature */}
                            <path
                              d={`M 0 280 ${hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 260 - ((hour.feels_like - minTemp) / (maxTemp - minTemp)) * 240
                                return `L ${x} ${y}`
                              }).join(' ')} L 800 280 Z`}
                              fill="url(#feelsLikeGradient)"
                            />
                            <path
                              d={hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 260 - ((hour.feels_like - minTemp) / (maxTemp - minTemp)) * 240
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                              }).join(' ')}
                              stroke="rgba(59,130,246,1)"
                              strokeWidth="3"
                              strokeDasharray="5,5"
                              fill="none"
                            />
                          </>
                        )
                      })()}
                    </svg>
                  </div>
                  
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500" />
                      <span className={isDarkMode ? 'text-white/80' : 'text-gray-700'}>Actual Temp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-blue-500 border-dashed" style={{borderTop: '2px dashed'}} />
                      <span className={isDarkMode ? 'text-white/80' : 'text-gray-700'}>Feels Like</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Recommendations */}
            {hourlyData.length > 0 && (() => {
              const recommendations = getRecommendations()
              if (recommendations.length === 0) return null

              return (
                <Card className={`${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                } backdrop-blur-xl mb-4 sm:mb-6`}>
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <Info className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className="truncate">Weather Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            isDarkMode 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-white hover:bg-gray-50'
                          } transition-colors duration-200`}
                        >
                          <span className="text-2xl flex-shrink-0">{rec.split(' ')[0]}</span>
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                            {rec.substring(rec.indexOf(' ') + 1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Interactive Multi-Metric Chart */}
            {hourlyData.length > 0 && (
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl mb-4 sm:mb-6`}>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <Activity className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className="truncate">Interactive Analytics</span>
                    </CardTitle>
                    <div className="flex gap-2">
                      {(['temp', 'humidity', 'wind', 'pressure'] as const).map((metric) => (
                        <Button
                          key={metric}
                          onClick={() => setChartMetric(metric)}
                          size="sm"
                          variant={chartMetric === metric ? 'default' : 'outline'}
                          className={`px-2 sm:px-3 text-xs ${
                            chartMetric === metric
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : isDarkMode 
                                ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white' 
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
                          }`}
                        >
                          {metric === 'temp' && '🌡️'}
                          {metric === 'humidity' && '💧'}
                          {metric === 'wind' && '💨'}
                          {metric === 'pressure' && '📊'}
                          <span className="ml-1 capitalize hidden sm:inline">{metric}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="relative h-48 sm:h-56 md:h-64">
                    <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={
                            chartMetric === 'temp' ? (isDarkMode ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.3)') :
                            chartMetric === 'humidity' ? (isDarkMode ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.3)') :
                            chartMetric === 'wind' ? (isDarkMode ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.3)') :
                            (isDarkMode ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.3)')
                          } />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 62.5}
                          x2="800"
                          y2={i * 62.5}
                          stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                          strokeWidth="1"
                        />
                      ))}
                      
                      {/* Data visualization */}
                      {hourlyData.length > 1 && (() => {
                        const values = hourlyData.map(h => {
                          if (chartMetric === 'temp') return h.temp
                          if (chartMetric === 'humidity') return h.humidity
                          if (chartMetric === 'wind') return h.wind_speed * 3.6
                          return h.pressure || 1013
                        })
                        const minVal = Math.min(...values)
                        const maxVal = Math.max(...values)
                        
                        return (
                          <>
                            {/* Area */}
                            <path
                              d={`M 0 250 ${hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 230 - ((values[i] - minVal) / (maxVal - minVal)) * 210
                                return `L ${x} ${y}`
                              }).join(' ')} L 800 250 Z`}
                              fill="url(#chartGradient)"
                            />
                            
                            {/* Line */}
                            <path
                              d={hourlyData.map((hour, i) => {
                                const x = (i / (hourlyData.length - 1)) * 800
                                const y = 230 - ((values[i] - minVal) / (maxVal - minVal)) * 210
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                              }).join(' ')}
                              stroke={
                                chartMetric === 'temp' ? (isDarkMode ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,1)') :
                                chartMetric === 'humidity' ? (isDarkMode ? 'rgba(59,130,246,0.8)' : 'rgba(59,130,246,1)') :
                                chartMetric === 'wind' ? (isDarkMode ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,1)') :
                                (isDarkMode ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,1)')
                              }
                              strokeWidth="3"
                              fill="none"
                            />
                            
                            {/* Points */}
                            {hourlyData.map((hour, i) => {
                              const x = (i / (hourlyData.length - 1)) * 800
                              const y = 230 - ((values[i] - minVal) / (maxVal - minVal)) * 210
                              return (
                                <g key={i}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="6"
                                    fill={
                                      chartMetric === 'temp' ? '#ef4444' :
                                      chartMetric === 'humidity' ? '#3b82f6' :
                                      chartMetric === 'wind' ? '#22c55e' :
                                      '#a855f7'
                                    }
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={x}
                                    y={y - 15}
                                    textAnchor="middle"
                                    fill={isDarkMode ? 'white' : 'black'}
                                    fontSize="12"
                                    fontWeight="bold"
                                  >
                                    {values[i].toFixed(chartMetric === 'pressure' ? 0 : 1)}
                                  </text>
                                </g>
                              )
                            })}
                          </>
                        )
                      })()}
                    </svg>
                    
                    {/* Time labels */}
                    <div className={`absolute bottom-0 left-0 right-0 flex justify-between px-1 sm:px-2 text-[10px] sm:text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>
                      {hourlyData.slice(0, 8).map((hour, i) => (
                        <span key={i} className="truncate">{formatTime(hour.dt)}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Chart Legend */}
                  <div className="mt-4 flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        chartMetric === 'temp' ? 'bg-red-500' :
                        chartMetric === 'humidity' ? 'bg-blue-500' :
                        chartMetric === 'wind' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`} />
                      <span className={isDarkMode ? 'text-white/80' : 'text-gray-700'}>
                        {chartMetric === 'temp' && `Temperature (°${isCelsius ? 'C' : 'F'})`}
                        {chartMetric === 'humidity' && 'Humidity (%)'}
                        {chartMetric === 'wind' && 'Wind Speed (km/h)'}
                        {chartMetric === 'pressure' && 'Pressure (hPa)'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hourly Timeline Scroll */}
            <div className="mb-4 sm:mb-6">
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl overflow-hidden`}>
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                      <Clock className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className="truncate">Next 24 Hours</span>
                      {showComparison && compareHours.length > 0 && (
                        <Badge className="ml-2 bg-green-500 text-white">
                          {compareHours.length} selected
                        </Badge>
                      )}
                    </CardTitle>
                    {showComparison && compareHours.length > 0 && (
                      <Button
                        onClick={() => setCompareHours([])}
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-6"
                  >
                    {hourlyData.map((hour, index) => {
                      const WeatherIcon = weatherIcons[hour.weather[0]?.main as keyof typeof weatherIcons] || Cloud
                      const timeOfDay = getTimeOfDay(hour.dt)
                      const isSelected = selectedHour === index
                      const isCompared = compareHours.includes(index)
                      
                      return (
                        <button
                          key={hour.dt}
                          onClick={() => {
                            if (showComparison) {
                              toggleCompareHour(index)
                            } else {
                              setSelectedHour(index)
                            }
                          }}
                          className={`w-full p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 relative ${
                            isCompared
                              ? isDarkMode
                                ? 'bg-green-500/20 scale-105 shadow-xl border-2 border-green-400'
                                : 'bg-green-100 scale-105 shadow-xl border-2 border-green-500'
                              : isSelected
                                ? isDarkMode
                                  ? 'bg-white/20 scale-105 shadow-xl border-2 border-white/30'
                                  : 'bg-blue-100 scale-105 shadow-xl border-2 border-blue-300'
                                : isDarkMode
                                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {isCompared && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              ✓
                            </div>
                          )}
                          <div className="text-center space-y-1.5 sm:space-y-2 md:space-y-3">
                            <p className="text-xs sm:text-sm font-semibold truncate">
                              {index === 0 ? 'Now' : formatTime(hour.dt)}
                            </p>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto rounded-lg sm:rounded-xl bg-gradient-to-br ${getGradientForTimeOfDay(timeOfDay)} p-1 sm:p-1.5 md:p-2 flex items-center justify-center`}>
                              <WeatherIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                            </div>
                            <div>
                              <p className="text-lg sm:text-xl md:text-2xl font-bold">{formatTemp(hour.temp)}°</p>
                              <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'} capitalize truncate`}>
                                {hour.weather[0]?.description}
                              </p>
                            </div>
                            {hour.pop > 0 && (
                              <div className={`flex items-center justify-center gap-0.5 sm:gap-1 ${
                                isDarkMode ? 'text-blue-300' : 'text-blue-600'
                              }`}>
                                <CloudRain className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="text-[10px] sm:text-xs">{Math.round(hour.pop)}%</span>
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

            {/* Hour Comparison View */}
            {showComparison && compareHours.length >= 2 && (
              <Card className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              } backdrop-blur-xl mb-4 sm:mb-6`}>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                    <Activity className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span className="truncate">Comparing {compareHours.length} Hours</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                          <th className={`text-left py-3 px-2 text-xs sm:text-sm font-semibold ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            Metric
                          </th>
                          {compareHours.map((hourIndex) => (
                            <th key={hourIndex} className="text-center py-3 px-2">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs sm:text-sm font-bold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {formatTime(hourlyData[hourIndex].dt)}
                                </span>
                                <Badge className="text-[10px] bg-green-500 text-white">
                                  {hourIndex === 0 ? 'Now' : `+${hourIndex * 3}h`}
                                </Badge>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Temperature Row */}
                        <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-red-500" />
                              Temperature
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => (
                            <td key={hourIndex} className="text-center py-3 px-2">
                              <div className="flex flex-col items-center">
                                <span className={`text-lg sm:text-xl font-bold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {formatTemp(hourlyData[hourIndex].temp)}°
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                  Feels {formatTemp(hourlyData[hourIndex].feels_like)}°
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Weather Row */}
                        <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Cloud className="h-4 w-4 text-blue-500" />
                              Weather
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => {
                            const WeatherIcon = weatherIcons[hourlyData[hourIndex].weather[0]?.main as keyof typeof weatherIcons] || Cloud
                            return (
                              <td key={hourIndex} className="text-center py-3 px-2">
                                <div className="flex flex-col items-center gap-1">
                                  <WeatherIcon className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                  <span className={`text-xs capitalize ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                                    {hourlyData[hourIndex].weather[0]?.description}
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                        
                        {/* Rain Probability Row */}
                        <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <CloudRain className="h-4 w-4 text-blue-500" />
                              Rain
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => (
                            <td key={hourIndex} className="text-center py-3 px-2">
                              <span className={`text-base sm:text-lg font-bold ${
                                hourlyData[hourIndex].pop > 50 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {Math.round(hourlyData[hourIndex].pop)}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Humidity Row */}
                        <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-cyan-500" />
                              Humidity
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => (
                            <td key={hourIndex} className="text-center py-3 px-2">
                              <span className={`text-base sm:text-lg font-bold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {hourlyData[hourIndex].humidity}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Wind Row */}
                        <tr className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Wind className="h-4 w-4 text-green-500" />
                              Wind
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => (
                            <td key={hourIndex} className="text-center py-3 px-2">
                              <div className="flex flex-col items-center">
                                <span className={`text-base sm:text-lg font-bold ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {Math.round(hourlyData[hourIndex].wind_speed * 3.6)} km/h
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                                  {getWindDirection(hourlyData[hourIndex].wind_deg)}
                                </span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        
                        {/* Visibility Row */}
                        <tr>
                          <td className={`py-3 px-2 font-medium text-xs sm:text-sm ${
                            isDarkMode ? 'text-white/80' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-purple-500" />
                              Visibility
                            </div>
                          </td>
                          {compareHours.map((hourIndex) => (
                            <td key={hourIndex} className="text-center py-3 px-2">
                              <span className={`text-base sm:text-lg font-bold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {(hourlyData[hourIndex].visibility / 1000).toFixed(1)} km
                              </span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Hour View */}
            {selectedHour !== null && hourlyData[selectedHour] && (
              <div className="mb-4 sm:mb-6">
                <Card className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                } backdrop-blur-xl`}>
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                          <Activity className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          <span className="truncate">Detailed - {formatTime(hourlyData[selectedHour].dt)}</span>
                        </div>
                        <Button
                          onClick={() => setSelectedHour(null)}
                          size="sm"
                          variant="ghost"
                          className={isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
                        >
                          ✕
                        </Button>
                      </CardTitle>
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'} pl-6 sm:pl-7`}>
                        {formatDate(hourlyData[selectedHour].dt)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 space-y-4">
                    {/* Main Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
                          subValue: `${getWindDirection(hourlyData[selectedHour].wind_deg)} ${(hourlyData[selectedHour].wind_speed * 2.237).toFixed(1)} mph`,
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
                            <CardContent className="p-2.5 sm:p-3 md:p-4">
                              <div className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3`}>
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                              </div>
                              <p className={`text-[10px] sm:text-xs md:text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-500'} mb-0.5 sm:mb-1 truncate`}>
                                {stat.label}
                              </p>
                              <p className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                {stat.value}
                              </p>
                              <p className={`text-[9px] sm:text-[10px] md:text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-400'} mt-0.5 sm:mt-1 truncate`}>
                                {stat.subValue}
                              </p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {hourlyData[selectedHour].pressure && (
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Gauge className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <span className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Pressure</span>
                          </div>
                          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hourlyData[selectedHour].pressure} hPa
                          </p>
                        </div>
                      )}
                      
                      {hourlyData[selectedHour].clouds !== undefined && (
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Cloud className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            <span className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Cloud Cover</span>
                          </div>
                          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hourlyData[selectedHour].clouds}%
                          </p>
                        </div>
                      )}

                      {hourlyData[selectedHour].dew_point && (
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Droplets className={`h-4 w-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                            <span className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Dew Point</span>
                          </div>
                          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatTemp(hourlyData[selectedHour].dew_point)}°
                          </p>
                        </div>
                      )}

                      {(() => {
                        const comfort = getComfortLevel(hourlyData[selectedHour].temp, hourlyData[selectedHour].humidity)
                        return (
                          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{comfort.emoji}</span>
                              <span className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>Comfort</span>
                            </div>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {comfort.level}
                            </p>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Weather Description */}
                    <div className={`p-4 rounded-xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20' 
                        : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const WeatherIcon = weatherIcons[hourlyData[selectedHour].weather[0]?.main as keyof typeof weatherIcons] || Cloud
                          return <WeatherIcon className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        })()}
                        <div>
                          <p className={`text-lg font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {hourlyData[selectedHour].weather[0]?.main}
                          </p>
                          <p className={`text-sm capitalize ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            {hourlyData[selectedHour].weather[0]?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sun Times */}
            {weatherData?.sys && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {/* Sunrise Card */}
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-yellow-600 via-amber-700 to-orange-800' : 'from-yellow-400 via-amber-500 to-orange-600'} text-white cursor-pointer active:scale-100`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-300/30 via-yellow-200/20 to-amber-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative z-10">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                          <Sunrise className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow group-hover:drop-shadow-lg" />
                        </div>
                        <span className="font-bold text-base sm:text-lg text-white group-hover:scale-105 transition-transform origin-left">Sunrise</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="group-hover:scale-110 transition-transform origin-left">
                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-1 sm:mb-2">
                          {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium group-hover:text-white/95 transition-colors">
                        Morning begins
                      </p>
                    </CardContent>
                  </div>
                </Card>

                {/* Sunset Card */}
                <Card className={`relative overflow-hidden border-0 ${isDarkMode ? 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)]' : 'shadow-[0_18px_55px_-25px_rgba(0,0,0,0.45)]'} hover:shadow-[0_30px_90px_-25px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-105 group rounded-2xl backdrop-blur-2xl bg-gradient-to-br ${isDarkMode ? 'from-indigo-600 via-purple-700 to-pink-800' : 'from-indigo-400 via-purple-500 to-pink-600'} text-white cursor-pointer active:scale-100`}>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-300/30 via-pink-200/20 to-indigo-300/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]'}`} />
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/5'} mix-blend-overlay`} />
                  <div className={`absolute inset-0 border ${isDarkMode ? 'border-white/15' : 'border-white/20'} rounded-2xl group-hover:border-white/40 transition-colors`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative z-10">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg ring-1 ring-white/25 group-hover:ring-2 group-hover:ring-white/50">
                          <Sunset className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow group-hover:drop-shadow-lg" />
                        </div>
                        <span className="font-bold text-base sm:text-lg text-white group-hover:scale-105 transition-transform origin-left">Sunset</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="group-hover:scale-110 transition-transform origin-left">
                        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-1 sm:mb-2">
                          {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-white/80 font-medium group-hover:text-white/95 transition-colors">
                        Evening begins
                      </p>
                    </CardContent>
                  </div>
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
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .animate-slide-in {
          animation: slide-in-right 0.5s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Smooth transitions for all interactive elements */
        button, a, [role="button"] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Hover effects */
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        /* Glass morphism effect */
        .backdrop-blur-xl {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </div>
  )
}