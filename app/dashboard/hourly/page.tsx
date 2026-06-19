"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
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
  AlertCircle,
  Umbrella,
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-800 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-2xl text-left">
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.stroke || item.color }} />
                {item.name}
              </span>
              <span className="text-xs font-black text-white">
                {item.value}
                {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
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
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'chart'>('card')
  const [chartMetric, setChartMetric] = useState<'temp' | 'humidity' | 'wind' | 'pressure'>('temp')
  const [compareHours, setCompareHours] = useState<number[]>([])
  const [showAlerts, setShowAlerts] = useState(true)

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
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === "true"
      setIsDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
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
    
    return () => {
      clearInterval(timer)
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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

      // Fetch hourly forecast
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

  const getWeatherInsights = () => {
    if (hourlyData.length === 0) return null

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

  // Define Recharts data structures
  const tempChartData = hourlyData.map((hour) => ({
    name: formatTime(hour.dt),
    'Actual Temp': formatTemp(hour.temp),
    'Feels Like': formatTemp(hour.feels_like),
  }))

  const analyticsChartData = hourlyData.map((hour) => {
    let val = hour.temp
    let name = 'Temperature'
    let unit = isCelsius ? '°C' : '°F'
    let color = '#ef4444'
    if (chartMetric === 'humidity') {
      val = hour.humidity
      name = 'Humidity'
      unit = '%'
      color = '#3b82f6'
    } else if (chartMetric === 'wind') {
      val = Math.round(hour.wind_speed * 3.6)
      name = 'Wind Speed'
      unit = ' km/h'
      color = '#22c55e'
    } else if (chartMetric === 'pressure') {
      val = hour.pressure || 1013
      name = 'Pressure'
      unit = ' hPa'
      color = '#a855f7'
    }

    return {
      time: formatTime(hour.dt),
      [name]: val,
      metricName: name,
      unit: unit,
      color: color
    }
  })

  const activeMetricName = chartMetric === 'temp' ? 'Temperature' :
                           chartMetric === 'humidity' ? 'Humidity' :
                           chartMetric === 'wind' ? 'Wind Speed' : 'Pressure';

  const activeColor = chartMetric === 'temp' ? '#ef4444' :
                      chartMetric === 'humidity' ? '#3b82f6' :
                      chartMetric === 'wind' ? '#22c55e' : '#a855f7';

  return (
    <div className={`min-h-screen relative overflow-x-hidden min-w-0 transition-colors duration-500 ${
      isDarkMode ? 'dark bg-slate-955 bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Animated Background Glow Spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1 h-1 ${
              isDarkMode ? 'bg-blue-400/20' : 'bg-blue-600/10'
            } rounded-full animate-float`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* Glow Spheres */}
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-[120px] transition-colors duration-1000 ${
          isDarkMode ? 'bg-blue-600/10' : 'bg-blue-300/15'
        }`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-[150px] transition-colors duration-1000 ${
          isDarkMode ? 'bg-purple-600/10' : 'bg-purple-300/15'
        }`} style={{animationDelay: '1s'}} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[130px] transition-colors duration-1000 ${
          isDarkMode ? 'bg-pink-600/5' : 'bg-pink-300/10'
        }`} style={{animationDelay: '2s'}} />
      </div>

      <div className="relative z-10 p-3 sm:p-5 md:p-7 max-w-7xl w-full mx-auto pb-24 box-border">
        {/* Header Section */}
        <div className="mb-6">
          <Card className={`relative overflow-hidden border transition-all duration-500 rounded-3xl backdrop-blur-xl ${
            isDarkMode 
              ? 'bg-slate-900/60 border-slate-800/80 shadow-[0_18px_55px_-25px_rgba(0,0,0,0.7)] text-white' 
              : 'bg-white/80 border-slate-200/80 shadow-[0_18px_55px_-25px_rgba(0,0,0,0.1)] text-slate-800'
          }`}>
            <CardContent className="relative z-10 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                        Hourly Weather Forecast
                      </h1>
                      <p className={`text-xs sm:text-sm font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Detailed temperature progression, weather metrics, and comfort index checks
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mt-3">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate">{weatherData?.name || 'Loading location...'}{weatherData?.sys.country ? `, ${weatherData.sys.country}` : ''}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      <Calendar className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <Badge className="bg-green-500/10 hover:bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20 py-0.5 px-2.5 rounded-full flex gap-1 items-center">
                      <Activity className="h-3 w-3 animate-pulse" />
                      Live Feed
                    </Badge>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end border-t border-slate-250/20 dark:border-slate-800/20 pt-4 lg:pt-0 lg:border-t-0">
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-2xl ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400 animate-pulse" /> : <Moon className="h-4 w-4 text-slate-700" />}
                  </Button>
                  <Button
                    onClick={() => setIsCelsius(!isCelsius)}
                    variant="outline"
                    className={`w-10 h-10 rounded-2xl font-bold ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
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
                    className={`h-10 rounded-2xl font-bold px-3 sm:px-4 ${
                      showComparison
                        ? 'bg-indigo-600 hover:bg-indigo-700 border-transparent text-white shadow-lg shadow-indigo-500/25'
                        : isDarkMode 
                          ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' 
                          : 'bg-white border-slate-200 text-slate-850 hover:bg-slate-55 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs">Compare Mode</span>
                  </Button>
                  <Button
                    onClick={shareWeather}
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-2xl ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={getUserLocation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-4 h-10 shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 flex-1 sm:flex-none justify-center"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Sync</span>
                  </Button>
                  <Button
                    onClick={exportData}
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-2xl ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
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
          <Card className={`border rounded-3xl backdrop-blur-xl ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
          }`}>
            <CardContent className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-lg font-black tracking-tight">Syncing Meteorological Feeds</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Please wait, loading live hourly grids...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Weather Insights Grid */}
            {hourlyData.length > 0 && (() => {
              const insights = getWeatherInsights()
              if (!insights) return null

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* HOTTEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-rose-950/40 to-pink-950/30 border-rose-900/50 text-rose-100'
                      : 'bg-gradient-to-br from-rose-50/90 to-pink-50/90 border-rose-100 text-rose-950'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">Hottest Hour</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {formatTemp(insights.hottestHour.temp)}°
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.hottestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25">
                      <Thermometer className="h-5 w-5" />
                    </div>
                  </div>

                  {/* COLDEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-950/40 to-cyan-950/30 border-blue-900/50 text-blue-100'
                      : 'bg-gradient-to-br from-blue-50/90 to-cyan-50/90 border-blue-100 text-blue-950'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">Coldest Hour</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {formatTemp(insights.coldestHour.temp)}°
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.coldestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
                      <Thermometer className="h-5 w-5" />
                    </div>
                  </div>

                  {/* RAINIEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-violet-950/40 to-purple-950/30 border-violet-900/50 text-violet-100'
                      : 'bg-gradient-to-br from-violet-50/90 to-purple-50/90 border-violet-100 text-violet-950'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">Rain Peak</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {Math.round(insights.rainiestHour.pop)}%
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.rainiestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/25">
                      <CloudRain className="h-5 w-5" />
                    </div>
                  </div>

                  {/* PEAK WIND SPEED */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border-emerald-900/50 text-emerald-100'
                      : 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border-emerald-100 text-emerald-950'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">Max Wind Speed</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {Math.round(insights.maxWind * 3.6)}<span className="text-xs font-bold ml-0.5">km/h</span>
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        Peak velocity scans
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                      <Wind className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Weather Alerts Panel */}
            {hourlyData.length > 0 && showAlerts && (() => {
              const alerts = getWeatherAlerts()
              if (alerts.length === 0) return null

              return (
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
                }`}>
                  <CardHeader className="p-4 sm:p-6 pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                      <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
                      <span>Environmental Conditions Check</span>
                    </CardTitle>
                    <Button
                      onClick={() => setShowAlerts(false)}
                      size="sm"
                      variant="ghost"
                      className={`h-8 rounded-xl px-2.5 ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                    >
                      Dismiss Alert List
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border-l-4 ${
                          alert.type === 'danger'
                            ? isDarkMode ? 'bg-red-500/10 border-red-500' : 'bg-red-50/90 border-red-500 text-red-950'
                            : alert.type === 'warning'
                              ? isDarkMode ? 'bg-yellow-500/10 border-yellow-500' : 'bg-yellow-50/90 border-yellow-500 text-yellow-950'
                              : isDarkMode ? 'bg-blue-500/10 border-blue-500' : 'bg-blue-50/90 border-blue-500 text-blue-950'
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                            alert.type === 'danger' ? 'text-red-550' : alert.type === 'warning' ? 'text-amber-550' : 'text-blue-550'
                          }`}>
                            {alert.type === 'danger' ? 'Severe Warning' : alert.type === 'warning' ? 'Advisory' : 'Information'}
                          </p>
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Day Part Summaries Grid */}
            {hourlyData.length > 0 && (() => {
              const summaries = getDayPartSummary()
              if (summaries.length === 0) return null

              return (
                <div className="space-y-4">
                  <h3 className={`text-base font-black uppercase tracking-wider flex items-center gap-2 pl-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Today's Phase Progression</span>
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaries.map((summary, index) => (
                      <Card
                        key={index}
                        className={`border rounded-3xl backdrop-blur-xl overflow-hidden group hover:scale-[1.03] transition-transform duration-300 ${
                          isDarkMode 
                            ? 'bg-slate-900/60 border-slate-800/80 text-white' 
                            : 'bg-white/80 border-slate-200/80 text-slate-850'
                        }`}
                      >
                        <div className={`h-2.5 bg-gradient-to-r ${summary.gradient}`} />
                        <CardContent className="p-4 flex flex-col text-left">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl">{summary.icon}</span>
                            <Badge className={`rounded-xl border border-transparent font-bold ${
                              isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {summary.description}
                            </Badge>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wide opacity-75 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {summary.period}
                          </span>
                          <span className={`text-3xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {formatTemp(summary.temp)}°
                          </span>
                          {summary.rain > 0 && (
                            <div className="flex items-center gap-1.5 mt-2.5 text-blue-500 dark:text-blue-400 text-xs font-bold">
                              <CloudRain className="h-3.5 w-3.5" />
                              <span>{Math.round(summary.rain)}% rain</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Main Interactive Graphs Container */}
            {hourlyData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Actual Temp vs Feels Like graph */}
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
                }`}>
                  <CardHeader className="p-4 sm:p-6 pb-2 text-left">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                      <Thermometer className="h-5 w-5 text-rose-500" />
                      <span>Temperature Trend: Actual vs Feels Like</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    <div className="h-[250px] w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tempChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="tempActualGrad" x1="0" y1="0" x2="0" y2="100%">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="tempFeelsGrad" x1="0" y1="0" x2="0" y2="100%">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                          <XAxis 
                            dataKey="name" 
                            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} 
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                          />
                          <YAxis 
                            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} 
                            fontSize={10}
                            fontWeight="bold"
                            unit="°"
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="Actual Temp" 
                            name="Actual Temp"
                            stroke="#ef4444" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#tempActualGrad)" 
                            unit={isCelsius ? "°C" : "°F"}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Feels Like" 
                            name="Feels Like"
                            stroke="#3b82f6" 
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            fillOpacity={1} 
                            fill="url(#tempFeelsGrad)" 
                            unit={isCelsius ? "°C" : "°F"}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-0.5 bg-red-500 inline-block" />
                        <span>Actual Temp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-0.5 border-t-2 border-dashed border-blue-500 inline-block" />
                        <span>Feels Like</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Interactive Analytics graph */}
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
                }`}>
                  <CardHeader className="p-4 sm:p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                      <Activity className="h-5 w-5 text-indigo-500" />
                      <span>Interactive Analytics</span>
                    </CardTitle>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['temp', 'humidity', 'wind', 'pressure'] as const).map((metric) => (
                        <Button
                          key={metric}
                          onClick={() => setChartMetric(metric)}
                          size="sm"
                          variant="ghost"
                          className={`h-8 rounded-xl px-2.5 text-xs font-bold capitalize ${
                            chartMetric === metric
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-500/20'
                              : isDarkMode 
                                ? 'bg-slate-800 text-slate-200 hover:bg-slate-750' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {metric === 'temp' && 'Temp'}
                          {metric === 'humidity' && 'Humidity'}
                          {metric === 'wind' && 'Wind'}
                          {metric === 'pressure' && 'Pressure'}
                        </Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    <div className="h-[250px] w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="100%">
                              <stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                          <XAxis 
                            dataKey="time" 
                            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} 
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                          />
                          <YAxis 
                            stroke={isDarkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} 
                            fontSize={10}
                            fontWeight="bold"
                            domain={['auto', 'auto']}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey={activeMetricName} 
                            name={activeMetricName}
                            stroke={activeColor} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#analyticsGrad)" 
                            unit={
                              chartMetric === 'temp' ? (isCelsius ? "°C" : "°F") :
                              chartMetric === 'humidity' ? "%" :
                              chartMetric === 'wind' ? " km/h" : " hPa"
                            }
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: activeColor }} />
                        <span>Hourly {activeMetricName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Precipitation Probability timeline */}
            {hourlyData.length > 0 && Math.max(...hourlyData.map(h => h.pop)) > 0 && (
              <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
              }`}>
                <CardHeader className="p-4 sm:p-6 pb-2 text-left">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                    <Umbrella className="h-5 w-5 text-blue-500" />
                    <span>Precipitation Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-3 space-y-3.5">
                  {hourlyData.map((hour, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-16 text-left ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatTime(hour.dt)}
                      </span>
                      <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-950/40 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-400 to-indigo-500"
                          style={{ width: `${hour.pop}%` }}
                        />
                      </div>
                      <span className={`text-xs font-extrabold w-12 text-right ${
                        hour.pop > 50 ? 'text-blue-500 font-black' : isDarkMode ? 'text-slate-400' : 'text-slate-650'
                      }`}>
                        {Math.round(hour.pop)}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weather Recommendations */}
            {hourlyData.length > 0 && (() => {
              const recommendations = getRecommendations()
              if (recommendations.length === 0) return null

              return (
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-indigo-950/45 to-purple-950/40 border-indigo-900/50 text-white' 
                    : 'bg-gradient-to-br from-indigo-50/80 to-purple-50/70 border-indigo-100 text-slate-800'
                }`}>
                  <CardHeader className="p-4 sm:p-6 pb-2 text-left">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                      <Info className="h-5 w-5 text-indigo-500" />
                      <span>Meteorological Health & Activity Guides</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-2xl border text-left ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-950/60' 
                              : 'bg-white border-slate-150 hover:bg-slate-50'
                          } transition-colors duration-200`}
                        >
                          <span className="text-2xl flex-shrink-0">{rec.split(' ')[0]}</span>
                          <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {rec.substring(rec.indexOf(' ') + 1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Next 24 Hours interactive scroll selection */}
            <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-850'
            }`}>
              <CardHeader className="p-4 sm:p-6 pb-3 text-left">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                    <Clock className="h-5 w-5 text-indigo-500" />
                    <span>Selected Timeline Inspection</span>
                  </CardTitle>
                  {showComparison && compareHours.length > 0 && (
                    <Badge className="bg-green-500 text-white border-0 font-bold px-2.5 py-0.5 rounded-full">
                      ⚖️ {compareHours.length} Hour{compareHours.length > 1 ? 's' : ''} Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
                            setSelectedHour(isSelected ? null : index)
                          }
                        }}
                        className={`w-full p-3.5 rounded-3xl transition-all duration-300 relative border flex flex-col justify-between h-40 ${
                          isCompared
                            ? isDarkMode
                              ? 'bg-emerald-500/10 border-emerald-500 scale-[1.03] shadow-lg shadow-emerald-500/10 text-white'
                              : 'bg-emerald-50/90 border-emerald-500 scale-[1.03] shadow-lg text-emerald-950'
                            : isSelected
                              ? isDarkMode
                                ? 'bg-indigo-500/10 border-indigo-500 scale-[1.03] shadow-lg shadow-indigo-500/10 text-white'
                                : 'bg-indigo-50/90 border-indigo-500 scale-[1.03] shadow-lg shadow-indigo-500/5 text-indigo-950'
                              : isDarkMode
                                ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 hover:scale-[1.02] text-slate-200'
                                : 'bg-white/80 border-slate-200/80 hover:bg-slate-100/50 hover:scale-[1.02] text-slate-800'
                        }`}
                      >
                        {isCompared && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-md">
                            ✓
                          </span>
                        )}
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-75 text-center w-full">
                          {index === 0 ? 'Now' : formatTime(hour.dt)}
                        </p>
                        <div className={`w-10 h-10 mx-auto rounded-2xl bg-gradient-to-br ${getGradientForTimeOfDay(timeOfDay)} p-2 flex items-center justify-center shadow`}>
                          <WeatherIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-center w-full">
                          <p className="text-xl font-black">{formatTemp(hour.temp)}°</p>
                          <p className="text-[9px] font-bold opacity-75 capitalize truncate">
                            {hour.weather[0]?.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Hours Comparison Dashboard Panel */}
            {showComparison && compareHours.length >= 2 && (
              <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
              }`}>
                <CardHeader className="p-4 sm:p-6 pb-2 text-left">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                    <Activity className="h-5 w-5 text-indigo-550" />
                    <span>Hourly Grid Comparison Board</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}`}>
                          <th className={`text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Parameters
                          </th>
                          {compareHours.map((idx) => (
                            <th key={idx} className="text-center py-3 px-2">
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-black">{formatTime(hourlyData[idx].dt)}</span>
                                <Badge className="text-[8px] font-black rounded-lg mt-1 border-0 bg-green-500 text-white">
                                  {idx === 0 ? 'Now' : `+${idx * 3} Hours`}
                                </Badge>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold">
                        {/* TEMPERATURE COMPARISON */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <Thermometer className="h-4 w-4 text-red-500" />
                              <span>Temperature</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => (
                            <td key={idx} className="py-4 px-2 text-center">
                              <span className="text-lg font-black">{formatTemp(hourlyData[idx].temp)}°</span>
                              <span className={`text-[10px] block opacity-75 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Feels {formatTemp(hourlyData[idx].feels_like)}°
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* WEATHER DESCRIPTION */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <Cloud className="h-4 w-4 text-blue-500" />
                              <span>Weather Status</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => {
                            const WeatherIcon = weatherIcons[hourlyData[idx].weather[0]?.main as keyof typeof weatherIcons] || Cloud
                            return (
                              <td key={idx} className="py-4 px-2 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <WeatherIcon className="h-5.5 w-5.5 text-blue-500 dark:text-blue-400" />
                                  <span className="capitalize text-[10px] tracking-wide">{hourlyData[idx].weather[0]?.description}</span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>

                        {/* RAIN PROBABILITY */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <CloudRain className="h-4 w-4 text-blue-500" />
                              <span>Rain Probability</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => (
                            <td key={idx} className="py-4 px-2 text-center">
                              <span className={`text-base font-black ${hourlyData[idx].pop > 40 ? 'text-blue-500' : ''}`}>
                                {Math.round(hourlyData[idx].pop)}%
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* HUMIDITY INDEX */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <Droplets className="h-4 w-4 text-cyan-500" />
                              <span>Humidity Index</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => (
                            <td key={idx} className="py-4 px-2 text-center">
                              <span className="text-base font-black">{hourlyData[idx].humidity}%</span>
                            </td>
                          ))}
                        </tr>

                        {/* WIND VELOCITY */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <Wind className="h-4 w-4 text-emerald-500" />
                              <span>Wind & Direction</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => (
                            <td key={idx} className="py-4 px-2 text-center">
                              <span className="text-base font-black">{Math.round(hourlyData[idx].wind_speed * 3.6)} km/h</span>
                              <span className={`text-[10px] block opacity-75 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {getWindDirection(hourlyData[idx].wind_deg)}
                              </span>
                            </td>
                          ))}
                        </tr>

                        {/* SATELLITE VISIBILITY */}
                        <tr>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-550 dark:text-slate-350">
                              <Eye className="h-4 w-4 text-purple-500" />
                              <span>Satellite Visibility</span>
                            </div>
                          </td>
                          {compareHours.map((idx) => (
                            <td key={idx} className="py-4 px-2 text-center">
                              <span className="text-base font-black">{(hourlyData[idx].visibility / 1000).toFixed(1)} km</span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Single Hour Inspector Drawer */}
            {selectedHour !== null && hourlyData[selectedHour] && (
              <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
              }`}>
                <CardHeader className="p-4 sm:p-6 pb-2 border-b border-slate-250/20 dark:border-slate-800/20 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        <span>Meteorological Details: {formatTime(hourlyData[selectedHour].dt)}</span>
                      </CardTitle>
                      <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {formatDate(hourlyData[selectedHour].dt)} Index Details
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedHour(null)}
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 rounded-xl ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
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
                        label: "Humidity Index",
                        value: `${hourlyData[selectedHour].humidity}%`,
                        subValue: hourlyData[selectedHour].pop > 0 ? `Rain likelihood: ${Math.round(hourlyData[selectedHour].pop)}%` : 'Dry conditions',
                        color: "from-blue-500 to-cyan-500"
                      },
                      {
                        icon: Wind,
                        label: "Wind Velocity",
                        value: `${Math.round(hourlyData[selectedHour].wind_speed * 3.6)} km/h`,
                        subValue: `Wind direction: ${getWindDirection(hourlyData[selectedHour].wind_deg)}`,
                        color: "from-green-500 to-teal-500"
                      },
                      {
                        icon: Eye,
                        label: "Visibility Index",
                        value: `${(hourlyData[selectedHour].visibility / 1000).toFixed(1)} km`,
                        subValue: `Horizontal clarity`,
                        color: "from-purple-500 to-pink-500"
                      },
                    ].map((stat, idx) => {
                      const Icon = stat.icon
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 ${
                            isDarkMode 
                              ? 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-950/60' 
                              : 'bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                          } transition-all duration-300 hover:scale-[1.02]`}
                        >
                          <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} text-white flex-shrink-0 shadow-md shadow-indigo-500/5`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[9px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {stat.label}
                            </p>
                            <p className={`text-lg font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {stat.value}
                            </p>
                            <p className={`text-[10px] font-semibold mt-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {stat.subValue}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Grid elements for pressure and clouds */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {hourlyData[selectedHour].pressure && (
                      <div className={`p-3.5 rounded-2xl border text-left ${isDarkMode ? 'bg-slate-950/40 border-slate-900/85' : 'bg-slate-50 border-slate-150'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Gauge className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pressure</span>
                        </div>
                        <p className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {hourlyData[selectedHour].pressure} hPa
                        </p>
                      </div>
                    )}
                    
                    {hourlyData[selectedHour].clouds !== undefined && (
                      <div className={`p-3.5 rounded-2xl border text-left ${isDarkMode ? 'bg-slate-950/40 border-slate-900/85' : 'bg-slate-50 border-slate-150'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Cloud className={`h-4 w-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cloud Cover</span>
                        </div>
                        <p className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {hourlyData[selectedHour].clouds}%
                        </p>
                      </div>
                    )}

                    {hourlyData[selectedHour].dew_point && (
                      <div className={`p-3.5 rounded-2xl border text-left ${isDarkMode ? 'bg-slate-950/40 border-slate-900/85' : 'bg-slate-50 border-slate-150'}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Droplets className={`h-4 w-4 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Dew Point</span>
                        </div>
                        <p className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {formatTemp(hourlyData[selectedHour].dew_point)}°
                        </p>
                      </div>
                    )}

                    {(() => {
                      const comfort = getComfortLevel(hourlyData[selectedHour].temp, hourlyData[selectedHour].humidity)
                      return (
                        <div className={`p-3.5 rounded-2xl border text-left ${isDarkMode ? 'bg-slate-950/40 border-slate-900/85' : 'bg-slate-50 border-slate-150'}`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm">{comfort.emoji}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Comfort Index</span>
                          </div>
                          <p className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            {comfort.level}
                          </p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Weather Status Box */}
                  <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-left ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 text-white' 
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-150 text-slate-805'
                  }`}>
                    {(() => {
                      const WeatherIcon = weatherIcons[hourlyData[selectedHour].weather[0]?.main as keyof typeof weatherIcons] || Cloud
                      return <WeatherIcon className={`h-8 w-8 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    })()}
                    <div>
                      <p className={`text-sm font-black capitalize ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {hourlyData[selectedHour].weather[0]?.main}
                      </p>
                      <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-655'}`}>
                        Weather Status: {hourlyData[selectedHour].weather[0]?.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sunrise and Sunset times */}
            {weatherData?.sys && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sunrise card */}
                <div className={`p-5 rounded-3xl border text-left shadow-xl relative overflow-hidden flex items-center justify-between transition-transform duration-300 hover:scale-[1.02] ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-yellow-950/40 to-amber-950/30 border-yellow-900/50 text-yellow-100'
                    : 'bg-gradient-to-br from-yellow-50/90 to-amber-50/80 border-yellow-100 text-yellow-950'
                }`}>
                  <div className="relative z-10 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-xl bg-white/20 text-white flex-shrink-0 shadow">
                        <Sunrise className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Sunrise Phase</span>
                    </div>
                    <h2 className="text-3xl font-black mt-1 leading-none">
                      {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </h2>
                    <p className="text-xs font-semibold opacity-75 mt-2">
                      Morning twilight begins
                    </p>
                  </div>
                </div>

                {/* Sunset card */}
                <div className={`p-5 rounded-3xl border text-left shadow-xl relative overflow-hidden flex items-center justify-between transition-transform duration-300 hover:scale-[1.02] ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border-indigo-900/50 text-indigo-100'
                    : 'bg-gradient-to-br from-indigo-50/90 to-purple-50/80 border-indigo-100 text-indigo-950'
                }`}>
                  <div className="relative z-10 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-xl bg-white/20 text-white flex-shrink-0 shadow">
                        <Sunset className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Sunset Phase</span>
                    </div>
                    <h2 className="text-3xl font-black mt-1 leading-none">
                      {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </h2>
                    <p className="text-xs font-semibold opacity-75 mt-2">
                      Evening twilight begins
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
        
        button, a, [role="button"] {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  )
}