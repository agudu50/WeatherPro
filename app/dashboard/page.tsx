"use client"

import React, { useState, useEffect } from "react"
import {
  Cloud,
  Droplets,
  Wind,
  Eye,
  Gauge,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Mic,
  Moon,
  Sun,
  Navigation,
  Loader2,
  AlertCircle,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
  Compass,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface WeatherData {
  name: string
  coord: {
    lat: number
    lon: number
  }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
    temp_min: number
    temp_max: number
    sea_level?: number
    grnd_level?: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
    gust?: number
  }
  visibility: number
  clouds: {
    all: number
  }
  rain?: {
    "1h"?: number
    "3h"?: number
  }
  snow?: {
    "1h"?: number
    "3h"?: number
  }
  sys: {
    country: string
    sunrise: number
    sunset: number
  }
  dt: number
  timezone: number
}

interface ForecastItem {
  dt: number
  dt_txt: string
  main: {
    temp: number
    temp_min: number
    temp_max: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    icon: string
    description: string
    main: string
  }>
  wind: {
    speed: number
    deg: number
  }
  pop: number
}

interface AirQualityData {
  list: Array<{
    main: {
      aqi: number
    }
    components: {
      co: number
      no: number
      no2: number
      o3: number
      so2: number
      pm2_5: number
      pm10: number
      nh3: number
    }
  }>
}

interface UVIndexData {
  value: number
  date: number
}

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number, delay: number}>>([])
  
  const [userLocation, setUserLocation] = useState({
    name: "Detecting your location...",
    lat: null as number | null,
    lon: null as number | null
  })

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastItem[]>([])
  const [hourlyForecast, setHourlyForecast] = useState<ForecastItem[]>([])
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [uvIndex, setUVIndex] = useState<UVIndexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [weatherMessage, setWeatherMessage] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ✅ Utility functions
  const kelvinToCelsius = (kelvin: number) => (kelvin - 273.15)
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5 + 32)
  const metersPerSecondToKmh = (ms: number) => (ms * 3.6)
  
  const getWindDirection = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(deg / 22.5) % 16
    return directions[index]
  }

  const getAQIDescription = (aqi: number) => {
    switch(aqi) {
      case 1: return { label: "Good", color: "text-green-600", bgColor: "bg-green-100" }
      case 2: return { label: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" }
      case 3: return { label: "Moderate", color: "text-orange-600", bgColor: "bg-orange-100" }
      case 4: return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100" }
      case 5: return { label: "Very Poor", color: "text-purple-600", bgColor: "bg-purple-100" }
      default: return { label: "Unknown", color: "text-gray-600", bgColor: "bg-gray-100" }
    }
  }

  const getUVDescription = (uv: number) => {
    if (uv <= 2) return { label: "Low", color: "text-green-600", bgColor: "bg-green-100" }
    if (uv <= 5) return { label: "Moderate", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    if (uv <= 7) return { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" }
    if (uv <= 10) return { label: "Very High", color: "text-red-600", bgColor: "bg-red-100" }
    return { label: "Extreme", color: "text-purple-600", bgColor: "bg-purple-100" }
  }

  // ✅ Request user's current location - LIVE GPS
  const requestUserLocation = (showAlert = false) => {
    if (!navigator.geolocation) {
      setError("❌ Geolocation is not supported by your browser")
      setUserLocation({ name: "London, UK", lat: 51.5074, lon: -0.1278 })
      fetchWeather({ name: "London, UK", lat: 51.5074, lon: -0.1278 })
      return
    }

    setLoading(true)
    setError(null)
    setUserLocation({ name: "📍 Getting your GPS location...", lat: null, lon: null })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        console.log('✅ Live GPS Location:', { latitude, longitude, accuracy: position.coords.accuracy })
        
        if (showAlert) {
          alert(`✅ Location Access Granted!\nLatitude: ${latitude.toFixed(4)}\nLongitude: ${longitude.toFixed(4)}\nAccuracy: ${position.coords.accuracy.toFixed(0)}m`)
        }
        
        localStorage.setItem("userCoordinates", JSON.stringify({
          lat: latitude,
          lon: longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        }))

        const savedPrefs = localStorage.getItem("weatherPreferences")
        const prefs = savedPrefs ? JSON.parse(savedPrefs) : {}
        prefs.useCurrentLocation = true
        prefs.lastLocationUpdate = new Date().toISOString()
        localStorage.setItem("weatherPreferences", JSON.stringify(prefs))

        setUserLocation({
          name: "🌍 Fetching live weather data...",
          lat: latitude,
          lon: longitude
        })

        await fetchWeather({ name: "", lat: latitude, lon: longitude })
      },
      (error) => {
        console.error('❌ Location error:', error)
        let errorMessage = '❌ Failed to get your location'
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '🚫 Location permission denied. Please enable location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '📡 Location information is unavailable. Check your GPS/internet connection.'
            break
          case error.TIMEOUT:
            errorMessage = '⏱️ Location request timed out. Please try again.'
            break
        }

        setError(errorMessage)
        
        const fallbackLocation = { name: "London, UK (Fallback)", lat: 51.5074, lon: -0.1278 }
        setUserLocation(fallbackLocation)
        fetchWeather(fallbackLocation)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  }

  // ✅ Load preferences
  useEffect(() => {
    setIsLoaded(true)
    
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(savedDarkMode)
    
    const savedPrefs = localStorage.getItem("weatherPreferences")
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      setIsCelsius(prefs.temperatureUnit === "celsius")
    }
    
    const savedCoords = localStorage.getItem("userCoordinates")
    
    if (savedCoords) {
      const coords = JSON.parse(savedCoords)
      const minutesSinceLastUpdate = (Date.now() - coords.timestamp) / (1000 * 60)
      
      if (minutesSinceLastUpdate < 30) {
        console.log('✅ Using recent saved coordinates')
        setUserLocation({
          name: "Loading weather from saved location...",
          lat: coords.lat,
          lon: coords.lon
        })
        fetchWeather({ name: "", lat: coords.lat, lon: coords.lon })
      } else {
        console.log('🔄 Requesting fresh GPS location')
        requestUserLocation(false)
      }
    } else {
      console.log('📍 No saved location, requesting GPS')
      requestUserLocation(false)
    }
    
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    const weatherRefreshTimer = setInterval(() => {
      console.log('🔄 Auto-refreshing weather data...')
      if (userLocation.lat && userLocation.lon) {
        fetchWeather(userLocation)
      }
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(timer)
      clearInterval(weatherRefreshTimer)
    }
  }, [])

  // ✅ Fetch REAL weather data
  const fetchWeather = async (location: typeof userLocation) => {
    setLoading(true)
    setError(null)
    
    try {
      let url = '/api/weather?'
      
      if (location.lat && location.lon) {
        url += `lat=${location.lat}&lon=${location.lon}`
        console.log('🌍 Fetching LIVE weather by GPS:', location.lat, location.lon)
      } else if (location.name && !location.name.includes("Detecting") && !location.name.includes("Getting")) {
        url += `city=${encodeURIComponent(location.name)}`
        console.log('🏙️ Fetching weather by city:', location.name)
      } else {
        throw new Error('No valid location data')
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch weather')
      }
      
      const data = await response.json()
      console.log('✅ LIVE Weather data received:', {
        location: data.name,
        temp: data.main.temp,
        weather: data.weather[0].main
      })
      
      setWeatherData(data)
      setLastUpdated(new Date())
      
      setUserLocation(prev => ({
        ...prev,
        name: `${data.name}, ${data.sys.country}`,
        lat: data.coord.lat,
        lon: data.coord.lon
      }))

      if (data.coord) {
        await Promise.all([
          fetchForecast(data.coord.lat, data.coord.lon),
          fetchAirQuality(data.coord.lat, data.coord.lon),
          fetchUVIndex(data.coord.lat, data.coord.lon)
        ])
      }

      const tempCelsius = data.main.temp
      generateWeatherMessage(tempCelsius)
      
    } catch (err) {
      console.error('❌ Weather fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load weather')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fetch forecast data
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      if (!response.ok) throw new Error('Failed to fetch forecast')
      
      const data = await response.json()
      console.log('✅ LIVE Forecast data received')
      
      const hourly = data.list.slice(0, 8)
      setHourlyForecast(hourly)
      
      const dailyData = data.list.filter((item: ForecastItem) => 
        item.dt_txt.includes("12:00:00")
      ).slice(0, 5)
      
      setForecastData(dailyData)
    } catch (error) {
      console.error('❌ Forecast fetch error:', error)
    }
  }

  // ✅ Fetch Air Quality data
  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch air quality')
      
      const data = await response.json()
      console.log('✅ Air Quality data received:', data.list[0].main.aqi)
      setAirQuality(data)
    } catch (error) {
      console.error('❌ Air quality fetch error:', error)
    }
  }

  // ✅ Fetch UV Index
  const fetchUVIndex = async (lat: number, lon: number) => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch UV index')
      
      const data = await response.json()
      console.log('✅ UV Index data received:', data.value)
      setUVIndex(data)
    } catch (error) {
      console.error('❌ UV index fetch error:', error)
    }
  }

  // ✅ Enhanced weather message
  const generateWeatherMessage = (tempCelsius: number) => {
    if (tempCelsius < -10) {
      setWeatherMessage("🥶 Extreme cold! Bundle up with layers and stay warm!")
    } else if (tempCelsius >= -10 && tempCelsius < 0) {
      setWeatherMessage("❄️ It's freezing! Wear a heavy coat and gloves!")
    } else if (tempCelsius >= 0 && tempCelsius < 10) {
      setWeatherMessage("🧥 Grab a jacket, it's quite chilly outside!")
    } else if (tempCelsius >= 10 && tempCelsius < 15) {
      setWeatherMessage("🧣 A bit cool! Light jacket recommended.")
    } else if (tempCelsius >= 15 && tempCelsius < 20) {
      setWeatherMessage("🌸 Pleasant weather! Perfect for a walk.")
    } else if (tempCelsius >= 20 && tempCelsius < 25) {
      setWeatherMessage("😊 Comfortable temperature! Enjoy your day!")
    } else if (tempCelsius >= 25 && tempCelsius < 30) {
      setWeatherMessage("🌞 It's getting warm! Stay hydrated.")
    } else if (tempCelsius >= 30 && tempCelsius < 35) {
      setWeatherMessage("🔥 Hot day ahead! Drink plenty of water.")
    } else if (tempCelsius >= 35 && tempCelsius < 40) {
      setWeatherMessage("☀️ Very hot! Limit outdoor activities.")
    } else if (tempCelsius >= 40) {
      setWeatherMessage("🌡️ Extreme heat warning! Stay indoors!")
    }
  }

  const handleRefresh = () => {
    console.log('🔄 Manual refresh')
    requestUserLocation(true)
  }

  const toggleUnit = () => {
    setIsCelsius(!isCelsius)
  }

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Voice recognition not supported")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const city = event.results[0][0].transcript
      console.log('🎤 Voice input:', city)
      fetchWeather({ name: city, lat: null, lon: null })
    }
    
    recognition.onerror = () => {
      setError("Voice recognition failed")
    }
    
    recognition.start()
  }

  const formatTemp = (temp: number) => {
    const celsius = temp
    const displayTemp = isCelsius ? celsius : celsiusToFahrenheit(celsius)
    return Math.round(displayTemp)
  }

  const weatherCards = [
    {
      icon: Droplets,
      title: "Humidity",
      value: weatherData?.main.humidity.toString() || "0",
      unit: "%",
      color: "text-blue-600",
      bgGradient: "from-blue-500 to-cyan-500",
      description: `${weatherData?.main.humidity || 0}% relative humidity`
    },
    {
      icon: Wind,
      title: "Wind Speed",
      value: weatherData?.wind.speed ? (weatherData.wind.speed * 3.6).toFixed(1) : "0",
      unit: "km/h",
      color: "text-green-600",
      bgGradient: "from-green-500 to-teal-500",
      description: weatherData?.wind.deg ? `${getWindDirection(weatherData.wind.deg)} direction` : "No data"
    },
    {
      icon: Eye,
      title: "Visibility",
      value: weatherData?.visibility ? (weatherData.visibility / 1000).toFixed(1) : "0",
      unit: "km",
      color: "text-purple-600",
      bgGradient: "from-purple-500 to-pink-500",
      description: weatherData?.visibility ? (weatherData.visibility >= 10000 ? "Excellent" : weatherData.visibility >= 5000 ? "Good" : "Moderate") : "No data"
    },
    {
      icon: Gauge,
      title: "Pressure",
      value: weatherData?.main.pressure.toString() || "0",
      unit: "hPa",
      color: "text-orange-600",
      bgGradient: "from-orange-500 to-red-500",
      description: weatherData?.main.pressure ? (weatherData.main.pressure > 1013 ? "High" : weatherData.main.pressure < 1013 ? "Low" : "Normal") : "No data"
    },
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'} relative overflow-hidden transition-colors duration-500`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute w-2 h-2 ${isDarkMode ? 'bg-blue-300/20' : 'bg-blue-400/20'} rounded-full animate-float`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Section - Mobile Optimized */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} transition-colors duration-500`}>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex-1">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2`}>
                  Live Weather Dashboard
                </h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base md:text-lg`}>Real-time weather data from your location</p>
                
                {weatherMessage && !loading && (
                  <div className={`mt-3 sm:mt-4 px-3 sm:px-4 py-2 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-lg inline-block animate-pulse`}>
                    <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>{weatherMessage}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mt-3 sm:mt-4">
                  <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {loading && !weatherData ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-spin" />
                        <span className="font-semibold truncate max-w-[150px] sm:max-w-none">{userLocation.name}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 animate-pulse" />
                        <span className="font-semibold truncate max-w-[150px] sm:max-w-none">{userLocation.name}</span>
                        {userLocation.lat && userLocation.lon && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                            GPS: {userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <span className="hidden sm:inline">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    <span className="sm:hidden">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {lastUpdated && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      Updated: {lastUpdated.toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Controls - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  <span className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestUserLocation(true)}
                    className={`flex-1 sm:flex-none ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    title="Refresh GPS location"
                  >
                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceSearch}
                    className={`flex-1 sm:flex-none ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    title="Voice search"
                  >
                    <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleUnit}
                    className={`flex-1 sm:flex-none ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                  >
                    <span className="text-xs sm:text-sm">°{isCelsius ? 'C' : 'F'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDarkMode}
                    className={`flex-1 sm:flex-none ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                  >
                    {isDarkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </Button>
                  
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    title="Refresh all data"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border-2 border-red-300 text-red-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Error</p>
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Temperature Card - Mobile Optimized */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="p-4 sm:p-6 bg-white/20 rounded-2xl sm:rounded-3xl backdrop-blur-md">
                    {weatherData?.weather[0]?.icon ? (
                      <img 
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                        alt={weatherData.weather[0].description}
                        className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
                      />
                    ) : (
                      <Cloud className="h-16 w-16 sm:h-20 sm:w-20 animate-pulse" />
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2">
                      {loading ? '--' : formatTemp(weatherData?.main.temp || 0)}°{isCelsius ? 'C' : 'F'}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl opacity-90 capitalize">
                      {loading ? 'Loading live data...' : weatherData?.weather[0]?.description || 'N/A'}
                    </p>
                    <p className="text-xs sm:text-sm opacity-75 mt-2">
                      Feels like {loading ? '--' : formatTemp(weatherData?.main.feels_like || 0)}°{isCelsius ? 'C' : 'F'}
                    </p>
                    {weatherData?.main && (
                      <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm opacity-90">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatTemp(weatherData.main.temp_max)}°
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          {formatTemp(weatherData.main.temp_min)}°
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center sm:text-right w-full sm:w-auto">
                  <Badge className="bg-white/30 text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 py-1.5 sm:py-2 mb-2 sm:mb-3">
                    {loading ? 'Loading' : weatherData?.weather[0]?.main || 'N/A'}
                  </Badge>
                  {weatherData?.clouds && (
                    <p className="text-xs sm:text-sm opacity-75 mb-1 sm:mb-2">
                      ☁️ Cloud cover: {weatherData.clouds.all}%
                    </p>
                  )}
                  {weatherData?.dt && (
                    <p className="text-xs sm:text-sm opacity-75">
                      Data from: {new Date(weatherData.dt * 1000).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Details Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {weatherCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg overflow-hidden group`}>
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {card.title}
                      </CardTitle>
                      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.bgGradient} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-bold ${card.color}`}>
                        {loading ? '--' : card.value}
                      </span>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm sm:text-base md:text-lg`}>{card.unit}</span>
                    </div>
                    <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Additional Weather Info - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* UV Index */}
          {uvIndex && (
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  UV Index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-600">{uvIndex.value.toFixed(1)}</span>
                    <Badge className={`${getUVDescription(uvIndex.value).bgColor} ${getUVDescription(uvIndex.value).color} border-0 text-xs`}>
                      {getUVDescription(uvIndex.value).label}
                    </Badge>
                  </div>
                  <Progress value={(uvIndex.value / 11) * 100} className="h-1.5 sm:h-2" />
                  <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {uvIndex.value <= 2 ? "Minimal sun protection required" :
                     uvIndex.value <= 5 ? "Moderate sun protection needed" :
                     uvIndex.value <= 7 ? "High sun protection required" :
                     "Extreme protection necessary"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Air Quality */}
          {airQuality && (
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  Air Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">{airQuality.list[0].main.aqi}</span>
                    <Badge className={`${getAQIDescription(airQuality.list[0].main.aqi).bgColor} ${getAQIDescription(airQuality.list[0].main.aqi).color} border-0 text-xs`}>
                      {getAQIDescription(airQuality.list[0].main.aqi).label}
                    </Badge>
                  </div>
                  <Progress value={(airQuality.list[0].main.aqi / 5) * 100} className="h-1.5 sm:h-2" />
                  <div className={`text-[10px] sm:text-xs space-y-0.5 sm:space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>PM2.5: {airQuality.list[0].components.pm2_5.toFixed(1)} μg/m³</p>
                    <p>PM10: {airQuality.list[0].components.pm10.toFixed(1)} μg/m³</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sunrise/Sunset */}
          {weatherData?.sys && (
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <Sunrise className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  Sun Times
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sunrise className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                      <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sunrise</span>
                    </div>
                    <span className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sunset className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                      <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sunset</span>
                    </div>
                    <span className={`font-bold text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {weatherData.sys.sunrise && weatherData.sys.sunset && (
                    <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center pt-1 sm:pt-2`}>
                      Daylight: {((weatherData.sys.sunset - weatherData.sys.sunrise) / 3600).toFixed(1)} hours
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hourly Forecast - Mobile Optimized */}
        {hourlyForecast.length > 0 && (
          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : ''}`}>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Hourly Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6">
                  <div className="flex gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 pb-2">
                    {hourlyForecast.map((hour, index) => {
                      const time = new Date(hour.dt * 1000)
                      return (
                        <div key={index} className={`flex-shrink-0 text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'} min-w-[70px] sm:min-w-[85px] md:min-w-[100px]`}>
                          <p className={`text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <img 
                            src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`}
                            alt={hour.weather[0].description}
                            className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 mx-auto"
                          />
                          <p className={`text-base sm:text-lg md:text-xl font-bold mt-1 sm:mt-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {formatTemp(hour.main.temp)}°
                          </p>
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-1 sm:mt-2">
                            <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />
                            <span className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {(hour.pop * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 5-Day Forecast - Mobile Optimized */}
        {forecastData.length > 0 && (
          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : ''}`}>
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  5-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                  {forecastData.map((day, index) => {
                    const date = new Date(day.dt * 1000)
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <div key={index} className={`text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'} hover:scale-105 transition-transform duration-300`}>
                        <p className={`font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{dayName}</p>
                        <p className={`text-[10px] sm:text-xs mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{dateStr}</p>
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                          alt={day.weather[0].description}
                          className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 mx-auto"
                        />
                        <p className={`text-xl sm:text-2xl font-bold mt-1 sm:mt-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {formatTemp(day.main.temp)}°
                        </p>
                        <p className={`text-[10px] sm:text-xs capitalize mt-0.5 sm:mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                          {day.weather[0].description}
                        </p>
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-[10px] sm:text-xs">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline" /> {formatTemp(day.main.temp_max)}°
                          </span>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline" /> {formatTemp(day.main.temp_min)}°
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-1 sm:mt-2">
                          <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />
                          <span className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(day.pop * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Weather Details - Mobile Optimized */}
        {weatherData && (
          <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : ''}`}>
                  <Thermometer className="h-4 w-4 sm:h-5 sm:w-5" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {weatherData.wind.gust && (
                    <div className={`p-2 sm:p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                        <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Wind Gust</span>
                      </div>
                      <p className={`text-base sm:text-lg md:text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {(weatherData.wind.gust * 3.6).toFixed(1)} km/h
                      </p>
                    </div>
                  )}
                  
                  <div className={`p-2 sm:p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                      <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Wind Dir</span>
                    </div>
                    <p className={`text-base sm:text-lg md:text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {getWindDirection(weatherData.wind.deg)}
                    </p>
                    <p className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({weatherData.wind.deg}°)
                    </p>
                  </div>

                  {weatherData.rain && (
                    <div className={`p-2 sm:p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                        <CloudRain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rainfall</span>
                      </div>
                      <p className={`text-base sm:text-lg md:text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {weatherData.rain["1h"] || weatherData.rain["3h"] || 0} mm
                      </p>
                    </div>
                  )}

                  <div className={`p-2 sm:p-3 md:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Cloud className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                      <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cloudiness</span>
                    </div>
                    <p className={`text-base sm:text-lg md:text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {weatherData.clouds.all}%
                    </p>
                  </div>
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
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}