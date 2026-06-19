"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl text-left">
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

  const getColorForTimeOfDay = (timeOfDay: string) => {
    const colors = {
      morning: 'bg-amber-500',
      afternoon: 'bg-blue-500',
      evening: 'bg-rose-500',
      night: 'bg-indigo-600'
    }
    return colors[timeOfDay as keyof typeof colors] || colors.afternoon
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
        color: 'bg-amber-500'
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
        color: 'bg-blue-500'
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
        color: 'bg-rose-500'
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
        color: 'bg-indigo-500'
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
      isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Animated Background Glow Spots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-1 h-1 ${
              isDarkMode ? 'bg-blue-450/20 bg-blue-400/20' : 'bg-blue-600/10'
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
                    <div className="p-2.5 rounded-2xl bg-indigo-650 bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h1 className={`text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        Hourly Weather Forecast
                      </h1>
                      <p className={`text-xs sm:text-sm font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Detailed temperature progression, weather metrics, and comfort index checks
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold mt-3">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${isDarkMode ? 'bg-slate-805 bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      <MapPin className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate">{weatherData?.name || 'Loading location...'}{weatherData?.sys.country ? `, ${weatherData.sys.country}` : ''}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${isDarkMode ? 'bg-slate-805 bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                      <Calendar className="h-3.5 w-3.5 text-blue-550 text-blue-500 flex-shrink-0" />
                      <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <Badge className="bg-green-500/10 hover:bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20 py-0.5 px-2.5 rounded-full flex gap-1 items-center">
                      <Activity className="h-3 w-3 animate-pulse" />
                      Live Feed
                    </Badge>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end border-t border-slate-800/20 pt-4 lg:pt-0 lg:border-t-0">
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    size="icon"
                    className={`w-10 h-10 rounded-2xl ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-55 hover:bg-slate-100'
                    }`}
                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400 animate-pulse" /> : <Moon className="h-4 w-4 text-slate-700" />}
                  </Button>
                  <Button
                    onClick={() => setIsCelsius(!isCelsius)}
                    variant="outline"
                    className={`w-10 h-10 rounded-2xl font-bold ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-55 hover:bg-slate-100'
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
                        ? 'bg-indigo-600 hover:bg-indigo-700 border-transparent text-white shadow shadow-indigo-500/20'
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
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-55 hover:bg-slate-100'
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
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-55 hover:bg-slate-100'
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
            isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-805 text-slate-800'
          }`}>
            <CardContent className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-lg font-black tracking-tight">Syncing Meteorological Feeds</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Please wait, loading live hourly grids...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Weather Insights Grid (Flat Colored Accents) */}
            {hourlyData.length > 0 && (() => {
              const insights = getWeatherInsights()
              if (!insights) return null

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* HOTTEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-slate-900/60 border-slate-800/80 text-white'
                      : 'bg-white/90 border-slate-200 text-slate-800'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-450 dark:text-rose-400">Hottest Hour</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {formatTemp(insights.hottestHour.temp)}°
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.hottestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow shadow-rose-500/25">
                      <Thermometer className="h-5 w-5" />
                    </div>
                  </div>

                  {/* COLDEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-slate-900/60 border-slate-800/80 text-white'
                      : 'bg-white/90 border-slate-200 text-slate-800'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-450 dark:text-blue-400">Coldest Hour</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {formatTemp(insights.coldestHour.temp)}°
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.coldestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-blue-500 text-white shadow shadow-blue-500/25">
                      <Thermometer className="h-5 w-5" />
                    </div>
                  </div>

                  {/* RAINIEST HOUR */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-slate-900/60 border-slate-800/80 text-white'
                      : 'bg-white/90 border-slate-200 text-slate-800'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-violet-500 dark:text-violet-450 dark:text-violet-400">Rain Peak</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {Math.round(insights.rainiestHour.pop)}%
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        at {formatTime(insights.rainiestHour.dt)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-violet-500 text-white shadow shadow-violet-500/25">
                      <CloudRain className="h-5 w-5" />
                    </div>
                  </div>

                  {/* PEAK WIND SPEED */}
                  <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] ${
                    isDarkMode 
                      ? 'bg-slate-900/60 border-slate-800/80 text-white'
                      : 'bg-white/90 border-slate-200 text-slate-800'
                  }`}>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-505 text-emerald-500 dark:text-emerald-450 dark:text-emerald-400">Max Wind Speed</p>
                      <h3 className="text-3xl font-black mt-1 leading-none">
                        {Math.round(insights.maxWind * 3.6)}<span className="text-xs font-bold ml-0.5">km/h</span>
                      </h3>
                      <p className="text-xs font-semibold opacity-75 mt-1.5">
                        Peak velocity scans
                      </p>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow shadow-emerald-500/25">
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
                <Card className={`border rounded-3xl overflow-hidden shadow-2xl relative ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-white/10 text-white' 
                    : 'bg-white/40 border-slate-200/80 text-slate-800'
                } backdrop-blur-2xl`}>
                  <CardHeader className="p-5 pb-4 flex flex-row items-center justify-between border-b border-white/10 dark:border-white/5">
                    <CardTitle className="flex items-center gap-3 text-sm sm:text-base font-black tracking-wider uppercase">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </div>
                      <span>Environmental Conditions Check</span>
                    </CardTitle>
                    <Button
                      onClick={() => setShowAlerts(false)}
                      size="sm"
                      variant="outline"
                      className={`h-8 rounded-xl px-3 border-slate-200 dark:border-slate-800 text-xs font-extrabold shadow-sm ${
                        isDarkMode 
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' 
                          : 'bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      Dismiss Alert List
                    </Button>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {alerts.map((alert, index) => {
                      const alertStyles = alert.type === 'danger' 
                        ? {
                            bg: 'bg-red-500/5 dark:bg-red-950/10',
                            border: 'border-red-500/20 dark:border-red-500/30',
                            badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                            label: 'Severe Warning',
                            iconBg: 'bg-red-500/10 text-red-500'
                          }
                        : alert.type === 'warning'
                          ? {
                              bg: 'bg-amber-500/5 dark:bg-amber-950/10',
                              border: 'border-amber-500/20 dark:border-amber-500/30',
                              badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                              label: 'Advisory',
                              iconBg: 'bg-amber-500/10 text-amber-500'
                            }
                          : {
                              bg: 'bg-blue-500/5 dark:bg-blue-950/10',
                              border: 'border-blue-500/20 dark:border-blue-500/30',
                              badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                              label: 'Information',
                              iconBg: 'bg-blue-500/10 text-blue-500'
                            };

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 hover:shadow-md ${alertStyles.bg} ${alertStyles.border}`}
                        >
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 text-xl font-bold shadow-sm ${alertStyles.iconBg}`}>
                            {alert.icon}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Status Check
                              </span>
                              <Badge variant="outline" className={`rounded-xl px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${alertStyles.badge}`}>
                                {alertStyles.label}
                              </Badge>
                            </div>
                            <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                              isDarkMode ? 'text-slate-105 text-white' : 'text-slate-800'
                            }`}>
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })()}

            {/* Day Part Summaries Grid (Flat accents) */}
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
                    {summaries.map((summary, index) => {
                      const getPhaseIcon = (period: string) => {
                        switch (period) {
                          case 'Morning':
                            return <Sunrise className="h-3.5 w-3.5" />
                          case 'Afternoon':
                            return <Sun className="h-3.5 w-3.5 animate-spin-slow" />
                          case 'Evening':
                            return <Sunset className="h-3.5 w-3.5" />
                          case 'Night':
                            return <Moon className="h-3.5 w-3.5" />
                          default:
                            return <Sun className="h-3.5 w-3.5" />
                        }
                      }

                      const phaseThemes = summary.period === 'Morning'
                        ? {
                            badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                            iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                            borderHover: 'hover:border-amber-500/30 dark:hover:border-amber-500/40',
                            indicatorColor: 'bg-amber-500'
                          }
                        : summary.period === 'Afternoon'
                          ? {
                              badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                              iconBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                              borderHover: 'hover:border-blue-500/30 dark:hover:border-blue-500/40',
                              indicatorColor: 'bg-blue-500'
                            }
                          : summary.period === 'Evening'
                            ? {
                                badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                                iconBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                                borderHover: 'hover:border-rose-500/30 dark:hover:border-rose-500/40',
                                indicatorColor: 'bg-rose-500'
                              }
                            : {
                                badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                                iconBg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
                                borderHover: 'hover:border-indigo-500/30 dark:hover:border-indigo-500/40',
                                indicatorColor: 'bg-indigo-500'
                              };

                      return (
                        <Card
                          key={index}
                          className={`border rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${phaseThemes.borderHover} ${
                            isDarkMode 
                              ? 'bg-slate-900/60 border-slate-800/80 text-white' 
                              : 'bg-white border-slate-200/60 text-slate-800'
                          } backdrop-blur-2xl relative overflow-hidden group`}
                        >
                          {/* Inner glowing corner flare */}
                          <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${phaseThemes.indicatorColor}`} />

                          <CardContent className="p-6 flex flex-col text-left space-y-4">
                            {/* Card Header: Phase badge & Emoji icon */}
                            <div className="flex items-center justify-between">
                              <Badge className={`rounded-xl border font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 shadow-sm ${phaseThemes.badgeBg}`}>
                                <span className="mr-1.5 flex items-center">{getPhaseIcon(summary.period)}</span>
                                {summary.period}
                              </Badge>
                              
                              <div className="text-2xl h-10 w-10 rounded-2xl flex items-center justify-center border border-slate-200/40 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-950/60 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                {summary.icon}
                              </div>
                            </div>
                            
                            {/* Temperature and description */}
                            <div className="space-y-1 pt-1">
                              <div className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatTemp(summary.temp)}°
                              </div>
                              
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{summary.description}</span>
                              </div>
                            </div>

                            {/* Divider line */}
                            <div className="w-full border-t border-slate-100 dark:border-slate-800/40" />

                            {/* Precipitation Tracker */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                                  Precipitation
                                </span>
                                <span className="text-blue-500 dark:text-blue-400 font-extrabold text-xs">
                                  {Math.round(summary.rain)}%
                                </span>
                              </div>
                              
                              {/* Sleek dynamic progress track */}
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden relative">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-700 relative" 
                                  style={{ width: `${summary.rain}%` }}
                                >
                                  {summary.rain > 0 && (
                                    <div className="absolute right-0 top-0 h-full w-1 bg-white/40 rounded-full" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Main Interactive Graphs Container (Recharts flat line charts) */}
            {hourlyData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Actual Temp vs Feels Like line chart */}
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200/80 text-slate-800'
                }`}>
                  <CardHeader className="p-4 sm:p-6 pb-2 text-left">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-black tracking-wide">
                      <Thermometer className="h-5 w-5 text-rose-550 text-rose-500" />
                      <span>Temperature Trend: Actual vs Feels Like</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-3">
                    <div className="h-[250px] w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tempChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
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
                          <Line 
                            type="monotone" 
                            dataKey="Actual Temp" 
                            name="Actual Temp"
                            stroke="#ef4444" 
                            strokeWidth={3}
                            dot={{ r: 3, strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                            unit={isCelsius ? "°C" : "°F"}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Feels Like" 
                            name="Feels Like"
                            stroke="#3b82f6" 
                            strokeWidth={2.5}
                            strokeDasharray="4 4"
                            dot={{ r: 2, strokeWidth: 1 }}
                            activeDot={{ r: 5 }}
                            unit={isCelsius ? "°C" : "°F"}
                          />
                        </LineChart>
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

                {/* 2. Interactive Analytics line chart */}
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
                              ? 'bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white shadow'
                              : isDarkMode 
                                ? 'bg-slate-800 text-slate-200 hover:bg-slate-750' 
                                : 'bg-slate-105 bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                        <LineChart data={analyticsChartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
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
                          <Line 
                            type="monotone" 
                            dataKey={activeMetricName} 
                            name={activeMetricName}
                            stroke={activeColor} 
                            strokeWidth={3}
                            dot={{ r: 3, strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                            unit={
                              chartMetric === 'temp' ? (isCelsius ? "°C" : "°F") :
                              chartMetric === 'humidity' ? "%" :
                              chartMetric === 'wind' ? " km/h" : " hPa"
                            }
                          />
                        </LineChart>
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

            {/* Precipitation Probability timeline (Solid color bars) */}
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
                          className="h-full rounded-full transition-all duration-500 bg-blue-500"
                          style={{ width: `${hour.pop}%` }}
                        />
                      </div>
                      <span className={`text-xs font-extrabold w-12 text-right ${
                        hour.pop > 50 ? 'text-blue-500 font-black' : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {Math.round(hour.pop)}%
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weather Recommendations (Solid color cards) */}
            {hourlyData.length > 0 && (() => {
              const recommendations = getRecommendations()
              if (recommendations.length === 0) return null

              return (
                <Card className={`border rounded-3xl backdrop-blur-xl overflow-hidden ${
                  isDarkMode 
                    ? 'bg-slate-900/60 border-slate-800/80 text-white' 
                    : 'bg-white/80 border-slate-200/80 text-slate-800'
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
                              : 'bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                          } transition-colors duration-200`}
                        >
                          <span className="text-2xl flex-shrink-0">{rec.split(' ')[0]}</span>
                          <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-655'}`}>
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
                    <Clock className="h-5 w-5 text-indigo-555 text-indigo-500" />
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
                                : 'bg-white/80 border-slate-200/80 hover:bg-slate-100/50 hover:scale-[1.02] text-slate-805'
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
                        <div className={`w-10 h-10 mx-auto rounded-2xl ${getColorForTimeOfDay(timeOfDay)} p-2 flex items-center justify-center shadow`}>
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
                    <Activity className="h-5 w-5 text-indigo-500" />
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
                      <tbody className="text-xs font-bold text-left">
                        {/* TEMPERATURE COMPARISON */}
                        <tr className={`border-b ${isDarkMode ? 'border-slate-850/50' : 'border-slate-100'}`}>
                          <td className="py-4 px-3 text-left">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                              <Thermometer className="h-4 w-4 text-red-505 text-red-500" />
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
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
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
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                              <CloudRain className="h-4 w-4 text-blue-550 text-blue-500" />
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
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
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
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
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
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
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
                <CardHeader className="p-4 sm:p-6 pb-2 border-b border-slate-800/20 text-left">
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
                        color: "bg-rose-500"
                      },
                      {
                        icon: Droplets,
                        label: "Humidity Index",
                        value: `${hourlyData[selectedHour].humidity}%`,
                        subValue: hourlyData[selectedHour].pop > 0 ? `Rain likelihood: ${Math.round(hourlyData[selectedHour].pop)}%` : 'Dry conditions',
                        color: "bg-blue-500"
                      },
                      {
                        icon: Wind,
                        label: "Wind Velocity",
                        value: `${Math.round(hourlyData[selectedHour].wind_speed * 3.6)} km/h`,
                        subValue: `Wind direction: ${getWindDirection(hourlyData[selectedHour].wind_deg)}`,
                        color: "bg-teal-500"
                      },
                      {
                        icon: Eye,
                        label: "Visibility Index",
                        value: `${(hourlyData[selectedHour].visibility / 1000).toFixed(1)} km`,
                        subValue: `Horizontal clarity`,
                        color: "bg-purple-500"
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
                          <div className={`p-2 rounded-xl ${stat.color} text-white flex-shrink-0 shadow-md shadow-indigo-500/5`}>
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

                  {/* Weather Status Box (Solid Colors) */}
                  <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-left ${
                    isDarkMode 
                      ? 'bg-slate-950/40 border-slate-900/80 text-white' 
                      : 'bg-indigo-50 border-indigo-150 text-indigo-950'
                  }`}>
                    {(() => {
                      const WeatherIcon = weatherIcons[hourlyData[selectedHour].weather[0]?.main as keyof typeof weatherIcons] || Cloud
                      return <WeatherIcon className={`h-8 w-8 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    })()}
                    <div>
                      <p className={`text-sm font-black capitalize ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
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

            {/* Sunrise and Sunset times (Solid glass cards) */}
            {weatherData?.sys && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sunrise card */}
                <div className={`p-6 rounded-3xl border text-left shadow-xl relative overflow-hidden flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group ${
                  isDarkMode 
                    ? 'bg-slate-900/60 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                } backdrop-blur-2xl`}>
                  {/* Inner glowing corner flare */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 bg-amber-500 pointer-events-none" />
                  
                  <div className="relative z-10 text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-xl border font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 shadow-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                        <Sunrise className="mr-1.5 h-3.5 w-3.5 flex items-center" />
                        Sunrise Phase
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className={`text-4xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Morning twilight begins</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-3xl h-12 w-12 rounded-2xl flex items-center justify-center border border-slate-200/40 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-950/60 shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10">
                    🌅
                  </div>
                </div>

                {/* Sunset card */}
                <div className={`p-6 rounded-3xl border text-left shadow-xl relative overflow-hidden flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group ${
                  isDarkMode 
                    ? 'bg-slate-900/60 border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                } backdrop-blur-2xl`}>
                  {/* Inner glowing corner flare */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 bg-indigo-500 pointer-events-none" />
                  
                  <div className="relative z-10 text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-xl border font-bold uppercase tracking-wider text-[10px] px-2.5 py-1 shadow-sm bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                        <Sunset className="mr-1.5 h-3.5 w-3.5 flex items-center" />
                        Sunset Phase
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h2 className={`text-4xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span>Evening twilight begins</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-3xl h-12 w-12 rounded-2xl flex items-center justify-center border border-slate-200/40 dark:border-slate-800/85 bg-slate-50/50 dark:bg-slate-950/60 shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10">
                    🌇
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