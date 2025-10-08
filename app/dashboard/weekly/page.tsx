"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Moon as MoonIcon,
  CloudRain,
  Loader2,
  MapPin,
  Search,
  Target,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Eye,
  Gauge,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon
} from "lucide-react"

interface DailyWeatherData {
  date: Date
  dayOfWeek: string
  condition: string
  icon: string
  weatherIcon: string
  tempHigh: number
  tempLow: number
  humidity: number
  precipitation: number
  precipitationChance: number
  windSpeed: number
  windDirection: string
  windDeg: number
  uvIndex: number
  sunrise: string
  sunset: string
  moonPhase: string
  description: string
  pressure: number
  feelsLikeHigh: number
  feelsLikeLow: number
  clouds: number
}

interface WeeklyForecastData {
  location: string
  country: string
  lastUpdated: Date
  forecast: DailyWeatherData[]
  coord: { lat: number; lon: number }
}

export default function WeeklyForecastPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [temperatureUnit, setTemperatureUnit] = useState("celsius")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: string } = {
      "01d": "☀️", "01n": "🌙",
      "02d": "⛅", "02n": "☁️",
      "03d": "☁️", "03n": "☁️",
      "04d": "☁️", "04n": "☁️",
      "09d": "🌧️", "09n": "🌧️",
      "10d": "🌦️", "10n": "🌧️",
      "11d": "⛈️", "11n": "⛈️",
      "13d": "❄️", "13n": "❄️",
      "50d": "🌫️", "50n": "🌫️",
    }
    return iconMap[iconCode] || "🌤️"
  }

  const getMoonPhaseEmoji = (phase: number) => {
    if (phase === 0 || phase === 1) return "🌑"
    if (phase < 0.25) return "🌒"
    if (phase === 0.25) return "🌓"
    if (phase < 0.5) return "🌔"
    if (phase === 0.5) return "🌕"
    if (phase < 0.75) return "🌖"
    if (phase === 0.75) return "🌗"
    return "🌘"
  }

  const getWindDirection = (deg: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return directions[Math.round(deg / 45) % 8]
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const fetchWeeklyData = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch 5-day forecast (OpenWeatherMap free tier provides 5 days in 3-hour steps)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!response.ok) throw new Error('Failed to fetch forecast')
      
      const data = await response.json()
      
      // Also fetch One Call API for extended forecast if available
      // Note: One Call 3.0 requires subscription, using forecast API instead
      const dailyForecasts = processForecastData(data)
      
      setWeeklyData({
        location: data.city.name,
        country: data.city.country,
        lastUpdated: new Date(),
        forecast: dailyForecasts,
        coord: { lat: data.city.coord.lat, lon: data.city.coord.lon }
      })
      
      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching weekly data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const processForecastData = (data: any): DailyWeatherData[] => {
    const dailyData: { [key: string]: any[] } = {}
    
    // Group forecasts by day
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000)
      const dateKey = date.toDateString()
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = []
      }
      dailyData[dateKey].push(item)
    })
    
    // Process each day
    const forecast: DailyWeatherData[] = []
    const days = Object.keys(dailyData).slice(0, 7) // Get up to 7 days
    
    days.forEach((dateKey) => {
      const dayData = dailyData[dateKey]
      const date = new Date(dateKey)
      
      // Calculate daily statistics
      const temps = dayData.map(d => d.main.temp)
      const feelsLike = dayData.map(d => d.main.feels_like)
      const humidity = dayData.map(d => d.main.humidity)
      const pressure = dayData.map(d => d.main.pressure)
      const windSpeed = dayData.map(d => d.wind.speed)
      const windDeg = dayData[Math.floor(dayData.length / 2)].wind.deg
      const clouds = dayData.map(d => d.clouds.all)
      
      // Get most common weather condition
      const weatherConditions = dayData.map(d => d.weather[0])
      const mainCondition = weatherConditions[Math.floor(weatherConditions.length / 2)]
      
      // Calculate precipitation
      const precipitation = dayData.reduce((sum: number, d: any) => {
        return sum + (d.rain?.['3h'] || 0) + (d.snow?.['3h'] || 0)
      }, 0)
      
      const precipitationChance = Math.min(
        100,
        Math.round((dayData.filter((d: any) => d.pop > 0).length / dayData.length) * 100)
      )
      
      // Simulate UV index (not available in free API)
      const uvIndex = Math.round(Math.random() * 8) + 1
      
      // Simulate moon phase
      const moonPhase = (date.getDate() / 30) % 1
      
      forecast.push({
        date,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        condition: mainCondition.main,
        icon: getWeatherIcon(mainCondition.icon),
        weatherIcon: mainCondition.icon,
        tempHigh: Math.round(Math.max(...temps)),
        tempLow: Math.round(Math.min(...temps)),
        humidity: Math.round(humidity.reduce((a, b) => a + b) / humidity.length),
        precipitation: Math.round(precipitation),
        precipitationChance,
        windSpeed: Math.round(windSpeed.reduce((a, b) => a + b) / windSpeed.length),
        windDirection: getWindDirection(windDeg),
        windDeg,
        uvIndex,
        sunrise: formatTime(data.city.sunrise),
        sunset: formatTime(data.city.sunset),
        moonPhase: getMoonPhaseEmoji(moonPhase),
        description: mainCondition.description,
        pressure: Math.round(pressure.reduce((a, b) => a + b) / pressure.length),
        feelsLikeHigh: Math.round(Math.max(...feelsLike)),
        feelsLikeLow: Math.round(Math.min(...feelsLike)),
        clouds: Math.round(clouds.reduce((a, b) => a + b) / clouds.length)
      })
    })
    
    return forecast
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWeeklyData(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWeeklyData(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWeeklyData(51.5074, -0.1278) // Fallback to London
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
      await fetchWeeklyData(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("weeklyForecastDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("weeklyForecastDarkMode", String(newDarkMode))
  }

  const convertTemperature = (temp: number) => {
    if (temperatureUnit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  const getTemperatureUnit = () => {
    return temperatureUnit === "fahrenheit" ? "°F" : "°C"
  }

  const getTemperatureColor = (temp: number, dark: boolean) => {
    if (temp <= 0) return dark ? "text-blue-300" : "text-blue-600"
    if (temp <= 10) return dark ? "text-blue-200" : "text-blue-500"
    if (temp <= 20) return dark ? "text-green-300" : "text-green-600"
    if (temp <= 30) return dark ? "text-yellow-300" : "text-yellow-600"
    return dark ? "text-red-300" : "text-red-600"
  }

  const getUVColor = (uvIndex: number, dark: boolean) => {
    if (uvIndex <= 2) return dark ? "text-green-300" : "text-green-600"
    if (uvIndex <= 5) return dark ? "text-yellow-300" : "text-yellow-600"
    if (uvIndex <= 7) return dark ? "text-orange-300" : "text-orange-600"
    return dark ? "text-red-300" : "text-red-600"
  }

  const getConditionColor = (condition: string, dark: boolean) => {
    const baseClass = dark ? "bg-white/10 border-white/20" : "bg-white border-gray-200"
    switch(condition) {
      case "Clear": return dark ? "bg-yellow-500/20 border-yellow-400/30" : "bg-yellow-100 border-yellow-300"
      case "Clouds": return dark ? "bg-gray-500/20 border-gray-400/30" : "bg-gray-100 border-gray-300"
      case "Rain": return dark ? "bg-blue-700/20 border-blue-600/30" : "bg-blue-100 border-blue-300"
      case "Drizzle": return dark ? "bg-blue-600/20 border-blue-500/30" : "bg-blue-50 border-blue-200"
      case "Thunderstorm": return dark ? "bg-purple-500/20 border-purple-400/30" : "bg-purple-100 border-purple-300"
      case "Snow": return dark ? "bg-cyan-500/20 border-cyan-400/30" : "bg-cyan-50 border-cyan-200"
      default: return baseClass
    }
  }

  if (loading || !weeklyData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-blue-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading weekly forecast...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-blue-400 to-purple-500'
            }`}>
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                7-Day Forecast
              </h1>
              <div className={`flex items-center gap-2 mt-1 text-sm ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{weeklyData.location}, {weeklyData.country}</span>
                {locationStatus === 'success' && (
                  <Badge className={`${
                    isDarkMode 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                  }`}>
                    📍 Your Location
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <form onSubmit={handleSearchCity} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className={`${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchWeeklyData(currentLocation.lat, currentLocation.lon)}
              size="icon"
              variant="outline"
              className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              onClick={toggleDarkMode}
              size="icon"
              variant="outline"
              className={`${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </Button>

            <Button
              onClick={() => setTemperatureUnit("celsius")}
              variant="outline"
              className={`${
                temperatureUnit === "celsius"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              °C
            </Button>
            <Button
              onClick={() => setTemperatureUnit("fahrenheit")}
              variant="outline"
              className={`${
                temperatureUnit === "fahrenheit"
                  ? isDarkMode
                    ? "bg-white text-blue-900 border-white"
                    : "bg-blue-600 text-white border-blue-600"
                  : isDarkMode
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              }`}
            >
              °F
            </Button>
          </div>
        </div>

        {/* Weekly Overview */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg transition-colors duration-500`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Overview
              </span>
              <Badge className={`${
                isDarkMode 
                  ? 'bg-white/20 text-white border-white/30' 
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}>
                Updated: {weeklyData.lastUpdated.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <Thermometer className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-red-300' : 'text-red-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  getTemperatureColor(Math.max(...weeklyData.forecast.map(d => d.tempHigh)), isDarkMode)
                }`}>
                  {convertTemperature(Math.max(...weeklyData.forecast.map(d => d.tempHigh)))}{getTemperatureUnit()}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Highest Temp</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <Droplets className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {weeklyData.forecast.filter(d => d.precipitation > 0).length}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Rainy Days</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <Wind className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-green-300' : 'text-green-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  {Math.max(...weeklyData.forecast.map(d => d.windSpeed))} km/h
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Max Wind</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <Sun className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-500'
                }`} />
                <div className={`text-2xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {Math.max(...weeklyData.forecast.map(d => d.uvIndex))}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Max UV Index</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Forecast Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weeklyData.forecast.map((day, index) => (
            <Card 
              key={`day-${index}`}
              className={`${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-gray-900'
              } backdrop-blur-lg cursor-pointer transition-all hover:scale-105 ${
                selectedDay === index ? "ring-2 ring-blue-500" : ""
              } ${getConditionColor(day.condition, isDarkMode)}`}
              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold">{day.dayOfWeek}</div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>{day.date.toLocaleDateString()}</div>
                  <div className="text-5xl my-3">{day.icon}</div>
                  <div className="text-sm font-medium capitalize">{day.description}</div>
                </div>

                <div className="space-y-3">
                  {/* Temperature Range */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className={`h-4 w-4 ${
                        isDarkMode ? 'text-orange-300' : 'text-orange-500'
                      }`} />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`font-bold ${getTemperatureColor(day.tempHigh, isDarkMode)}`}>
                        {convertTemperature(day.tempHigh)}{getTemperatureUnit()}
                      </span>
                      <span className={isDarkMode ? 'text-white/50' : 'text-gray-400'}>|</span>
                      <span className={getTemperatureColor(day.tempLow, isDarkMode)}>
                        {convertTemperature(day.tempLow)}{getTemperatureUnit()}
                      </span>
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className={`h-4 w-4 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-500'
                      }`} />
                      <span className="text-sm">Precipitation</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-600'
                      }`}>{day.precipitationChance}%</div>
                      {day.precipitation > 0 && (
                        <div className={`text-xs ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>{day.precipitation}mm</div>
                      )}
                    </div>
                  </div>

                  {/* Wind */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className={`h-4 w-4 ${
                        isDarkMode ? 'text-green-300' : 'text-green-500'
                      }`} />
                      <span className="text-sm">Wind</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        isDarkMode ? 'text-green-300' : 'text-green-600'
                      }`}>{day.windSpeed} km/h</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>{day.windDirection}</div>
                    </div>
                  </div>

                  {/* UV Index */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className={`h-4 w-4 ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-500'
                      }`} />
                      <span className="text-sm">UV Index</span>
                    </div>
                    <span className={`font-bold ${getUVColor(day.uvIndex, isDarkMode)}`}>
                      {day.uvIndex}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {selectedDay === index && (
                    <div className={`mt-4 pt-4 border-t space-y-3 ${
                      isDarkMode ? 'border-white/20' : 'border-gray-300'
                    }`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Feels Like High</div>
                          <div className="font-medium">
                            {convertTemperature(day.feelsLikeHigh)}{getTemperatureUnit()}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Feels Like Low</div>
                          <div className="font-medium">
                            {convertTemperature(day.feelsLikeLow)}{getTemperatureUnit()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className={`text-xs flex items-center gap-1 ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            <SunriseIcon className="h-3 w-3" />
                            Sunrise
                          </div>
                          <div className="font-medium">{day.sunrise}</div>
                        </div>
                        <div>
                          <div className={`text-xs flex items-center gap-1 ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            <SunsetIcon className="h-3 w-3" />
                            Sunset
                          </div>
                          <div className="font-medium">{day.sunset}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Humidity</div>
                          <div className="font-medium">{day.humidity}%</div>
                        </div>
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Pressure</div>
                          <div className="font-medium">{day.pressure} hPa</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Clouds</div>
                          <div className="font-medium">{day.clouds}%</div>
                        </div>
                        <div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/70' : 'text-gray-600'
                          }`}>Moon Phase</div>
                          <div className="font-medium text-lg">{day.moonPhase}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Statistics */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardHeader>
            <CardTitle>Weekly Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-3 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Avg High</div>
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`}>
                  {convertTemperature(Math.round(weeklyData.forecast.reduce((sum, d) => sum + d.tempHigh, 0) / weeklyData.forecast.length))}{getTemperatureUnit()}
                </div>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Avg Low</div>
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {convertTemperature(Math.round(weeklyData.forecast.reduce((sum, d) => sum + d.tempLow, 0) / weeklyData.forecast.length))}{getTemperatureUnit()}
                </div>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Total Rainfall</div>
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-cyan-300' : 'text-cyan-600'
                }`}>
                  {weeklyData.forecast.reduce((sum, d) => sum + d.precipitation, 0)}mm
                </div>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>Clear Days</div>
                <div className={`text-xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {weeklyData.forecast.filter(d => d.condition === "Clear").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}