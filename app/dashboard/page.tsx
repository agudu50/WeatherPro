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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
}

interface ForecastItem {
  dt: number
  dt_txt: string
  main: {
    temp: number
  }
  weather: Array<{
    icon: string
    description: string
  }>
}

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number, delay: number}>>([])
  
  const [userLocation, setUserLocation] = useState({
    name: "Detecting location...",
    lat: null as number | null,
    lon: null as number | null
  })

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCelsius, setIsCelsius] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [weatherMessage, setWeatherMessage] = useState("")
  const [locationRequested, setLocationRequested] = useState(false)

  // ✅ Utility functions
  const kelvinToCelsius = (kelvin: number) => (kelvin - 273.15)
  const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5 + 32)
  const metersPerSecondToKmh = (ms: number) => (ms * 3.6)

  // ✅ Request user's current location
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setUserLocation({ name: "London, UK", lat: null, lon: null })
      fetchWeather({ name: "London, UK", lat: null, lon: null })
      return
    }

    setLocationRequested(true)
    setUserLocation({ name: "Requesting location permission...", lat: null, lon: null })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        console.log('Location granted:', latitude, longitude)
        
        // Save to localStorage
        localStorage.setItem("userCoordinates", JSON.stringify({
          lat: latitude,
          lon: longitude,
          timestamp: Date.now()
        }))

        // Update preferences to use current location
        const savedPrefs = localStorage.getItem("weatherPreferences")
        const prefs = savedPrefs ? JSON.parse(savedPrefs) : {}
        prefs.useCurrentLocation = true
        localStorage.setItem("weatherPreferences", JSON.stringify(prefs))

        setUserLocation({
          name: "Fetching weather for your location...",
          lat: latitude,
          lon: longitude
        })

        // Fetch weather using coordinates
        fetchWeather({ name: "", lat: latitude, lon: longitude })
      },
      (error) => {
        console.error('Location error:', error)
        let errorMessage = 'Failed to get location'
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Using default location.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Using default location.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using default location.'
            break
        }

        setError(errorMessage)
        
        // Fall back to London
        const fallbackLocation = { name: "London, UK", lat: null, lon: null }
        setUserLocation(fallbackLocation)
        fetchWeather(fallbackLocation)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // ✅ Load preferences and check for saved location
  useEffect(() => {
    setIsLoaded(true)
    
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(savedDarkMode)
    
    // Load temperature unit preference
    const savedPrefs = localStorage.getItem("weatherPreferences")
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      setIsCelsius(prefs.temperatureUnit === "celsius")
    }
    
    // Check if user has previously granted location access
    const savedCoords = localStorage.getItem("userCoordinates")
    
    if (savedCoords) {
      // User has previously granted location, use saved coordinates
      const coords = JSON.parse(savedCoords)
      const hoursSinceLastUpdate = (Date.now() - coords.timestamp) / (1000 * 60 * 60)
      
      // If coordinates are less than 24 hours old, use them
      if (hoursSinceLastUpdate < 24) {
        console.log('Using saved coordinates')
        setUserLocation({
          name: "Loading weather...",
          lat: coords.lat,
          lon: coords.lon
        })
        fetchWeather({ name: "", lat: coords.lat, lon: coords.lon })
      } else {
        // Coordinates are old, request fresh location
        console.log('Saved coordinates are old, requesting new location')
        requestUserLocation()
      }
    } else {
      // No saved location, request user's location
      console.log('No saved location, requesting permission')
      requestUserLocation()
    }
    
    // Generate animated particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ✅ Fetch weather from API
  const fetchWeather = async (location: typeof userLocation) => {
    setLoading(true)
    setError(null)
    
    try {
      let url = '/api/weather?'
      
      // Use coordinates if available, otherwise use city name
      if (location.lat && location.lon) {
        url += `lat=${location.lat}&lon=${location.lon}`
        console.log('Fetching weather by coordinates:', location.lat, location.lon)
      } else if (location.name) {
        url += `city=${encodeURIComponent(location.name)}`
        console.log('Fetching weather by city:', location.name)
      } else {
        throw new Error('No location data available')
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch weather')
      }
      
      const data = await response.json()
      console.log('Weather data received:', data)
      setWeatherData(data)
      
      // Update location name with city from API
      setUserLocation(prev => ({
        ...prev,
        name: data.name,
        lat: data.coord.lat,
        lon: data.coord.lon
      }))

      // Fetch 5-day forecast
      if (data.coord) {
        await fetchForecast(data.coord.lat, data.coord.lon)
      }

      // Generate weather message
      const tempCelsius = kelvinToCelsius(data.main.temp)
      generateWeatherMessage(tempCelsius)
      
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load weather')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fetch 5-day forecast
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch forecast')
      
      const data = await response.json()
      // Get one forecast per day at 12:00 PM
      const dailyData = data.list.filter((item: ForecastItem) => 
        item.dt_txt.includes("12:00:00")
      ).slice(0, 5)
      
      setForecastData(dailyData)
    } catch (error) {
      console.error('Forecast fetch error:', error)
    }
  }

  // ✅ Generate weather message
  const generateWeatherMessage = (tempCelsius: number) => {
    if (tempCelsius >= 15 && tempCelsius <= 25) {
      setWeatherMessage("Perfect weather for a walk! 🌳")
    } else if (tempCelsius > 30) {
      setWeatherMessage("Stay hydrated, it's hot out there! ☀️")
    } else {
      setWeatherMessage("Grab a jacket, it's chilly! 🧥")
    }
  }

  // ✅ Refresh weather data
  const handleRefresh = () => {
    if (userLocation.lat && userLocation.lon) {
      fetchWeather(userLocation)
    } else {
      requestUserLocation()
    }
  }

  // ✅ Toggle temperature unit
  const toggleUnit = () => {
    setIsCelsius(!isCelsius)
  }

  // ✅ Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
  }

  // ✅ Voice search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Voice recognition not supported in this browser")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const city = event.results[0][0].transcript
      console.log('Voice input:', city)
      fetchWeather({ name: city, lat: null, lon: null })
    }
    
    recognition.onerror = () => {
      setError("Voice recognition failed. Please try again.")
    }
    
    recognition.start()
  }

  // ✅ Format temperature
  const formatTemp = (kelvin: number) => {
    const celsius = kelvinToCelsius(kelvin)
    const temp = isCelsius ? celsius : celsiusToFahrenheit(celsius)
    return Math.round(temp)
  }

  const weatherCards = [
    {
      icon: Droplets,
      title: "Humidity",
      value: weatherData?.main.humidity.toString() || "0",
      unit: "%",
      color: "text-blue-600",
      bgGradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Wind,
      title: "Wind Speed",
      value: weatherData?.wind.speed ? metersPerSecondToKmh(weatherData.wind.speed).toFixed(1) : "0",
      unit: "km/h",
      color: "text-green-600",
      bgGradient: "from-green-500 to-teal-500",
    },
    {
      icon: Eye,
      title: "Visibility",
      value: weatherData?.visibility ? (weatherData.visibility / 1000).toFixed(1) : "0",
      unit: "km",
      color: "text-purple-600",
      bgGradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Gauge,
      title: "Pressure",
      value: weatherData?.main.pressure.toString() || "0",
      unit: "hPa",
      color: "text-orange-600",
      bgGradient: "from-orange-500 to-red-500",
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

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className={`mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg rounded-3xl shadow-2xl p-8 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} transition-colors duration-500`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2`}>
                  Weather Dashboard
                </h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>Real-time weather insights at your fingertips</p>
                
                {/* Weather Message */}
                {weatherMessage && (
                  <div className={`mt-4 px-4 py-2 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-lg inline-block`}>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>{weatherMessage}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-4">
                  <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {loading && !weatherData ? (
                      <>
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <span>{userLocation.name}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span>{userLocation.name}</span>
                        {userLocation.lat && userLocation.lon && (
                          <span className="text-xs text-gray-400">
                            ({userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestUserLocation}
                    className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}
                    title="Use my location"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceSearch}
                    className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleUnit}
                    className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}
                  >
                    °{isCelsius ? 'C' : 'F'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDarkMode}
                    className={isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 text-red-800 rounded-2xl p-4">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Main Temperature Card */}
        <div className={`mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-6 bg-white/20 rounded-3xl backdrop-blur-md">
                    {weatherData?.weather[0]?.icon ? (
                      <img 
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                        alt={weatherData.weather[0].description}
                        className="h-20 w-20"
                      />
                    ) : (
                      <Cloud className="h-20 w-20" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-6xl font-bold mb-2">
                      {loading ? '--' : formatTemp(weatherData?.main.temp || 0)}°{isCelsius ? 'C' : 'F'}
                    </h2>
                    <p className="text-xl opacity-90 capitalize">
                      {loading ? 'Loading...' : weatherData?.weather[0]?.description || 'N/A'}
                    </p>
                    <p className="text-sm opacity-75 mt-2">
                      Feels like {loading ? '--' : formatTemp(weatherData?.main.feels_like || 0)}°{isCelsius ? 'C' : 'F'}
                    </p>
                  </div>
                </div>
                
                <div className="text-center md:text-right">
                  <Badge className="bg-white/30 text-white text-lg px-4 py-2 mb-3">
                    {loading ? 'Loading' : weatherData?.weather[0]?.main || 'N/A'}
                  </Badge>
                  <p className="text-sm opacity-75">Last updated: {currentTime.toLocaleTimeString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {weatherCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className={`transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg overflow-hidden group`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {card.title}
                      </CardTitle>
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${card.bgGradient} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${card.color}`}>
                        {card.value}
                      </span>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>{card.unit}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* 5-Day Forecast */}
        {forecastData.length > 0 && (
          <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`border-0 shadow-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg`}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-gray-200' : ''}>5-Day Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {forecastData.map((day, index) => {
                    const date = new Date(day.dt * 1000)
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
                    return (
                      <div key={index} className={`text-center p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'} hover:scale-105 transition-transform duration-300`}>
                        <p className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{dayName}</p>
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                          alt={day.weather[0].description}
                          className="h-12 w-12 mx-auto"
                        />
                        <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {formatTemp(day.main.temp)}°
                        </p>
                      </div>
                    )
                  })}
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