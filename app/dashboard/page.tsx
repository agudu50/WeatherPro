"use client"

import React, { useState, useEffect, useRef } from "react"
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
  User,
  LogOut,
  Umbrella,
  Shirt,
  Glasses,
  Wind as WindIcon,
  CloudDrizzle,
  Snowflake,
  Heart,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Waves,
  Menu,
  X,
  Settings,
  Bell,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  CloudSun,
  Droplet,
  Map,
  History,
  Home,
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

const mockWeatherData: WeatherData = {
  name: "Medina Estates",
  coord: { lat: 5.6515, lon: -0.1856 },
  main: {
    temp: 27.7, // 27.7°C ~ 81.86°F (rounds to 82°F)
    feels_like: 29.5,
    humidity: 78,
    pressure: 1012,
    temp_min: 26.0,
    temp_max: 29.0
  },
  weather: [{
    main: "Clear",
    description: "clear sky",
    icon: "01d"
  }],
  wind: { speed: 4.1, deg: 180 },
  visibility: 10000,
  clouds: { all: 10 },
  sys: { country: "GH", sunrise: 1765104000, sunset: 1765147200 },
  dt: 1775858930,
  timezone: 0
}

const mockHourlyForecast: ForecastItem[] = [
  {
    dt: 1775854800,
    dt_txt: "2026-06-10 21:00:00",
    main: { temp: 27.7, temp_min: 27.7, temp_max: 27.7, humidity: 78, pressure: 1012 },
    weather: [{ icon: "01n", description: "clear sky", main: "Clear" }],
    wind: { speed: 4.1, deg: 180 },
    pop: 0.1
  },
  {
    dt: 1775865600,
    dt_txt: "2026-06-11 00:00:00",
    main: { temp: 26.5, temp_min: 26.5, temp_max: 26.5, humidity: 82, pressure: 1013 },
    weather: [{ icon: "01n", description: "clear sky", main: "Clear" }],
    wind: { speed: 3.8, deg: 175 },
    pop: 0.05
  },
  {
    dt: 1775876400,
    dt_txt: "2026-06-11 03:00:00",
    main: { temp: 25.8, temp_min: 25.8, temp_max: 25.8, humidity: 85, pressure: 1012 },
    weather: [{ icon: "03n", description: "scattered clouds", main: "Clouds" }],
    wind: { speed: 3.2, deg: 170 },
    pop: 0.15
  },
  {
    dt: 1775887200,
    dt_txt: "2026-06-11 06:00:00",
    main: { temp: 26.0, temp_min: 26.0, temp_max: 26.0, humidity: 80, pressure: 1013 },
    weather: [{ icon: "02d", description: "few clouds", main: "Clouds" }],
    wind: { speed: 3.5, deg: 175 },
    pop: 0.2
  },
  {
    dt: 1775898000,
    dt_txt: "2026-06-11 09:00:00",
    main: { temp: 28.5, temp_min: 28.5, temp_max: 28.5, humidity: 72, pressure: 1014 },
    weather: [{ icon: "01d", description: "clear sky", main: "Clear" }],
    wind: { speed: 4.5, deg: 185 },
    pop: 0.1
  },
  {
    dt: 1775908800,
    dt_txt: "2026-06-11 12:00:00",
    main: { temp: 30.2, temp_min: 30.2, temp_max: 30.2, humidity: 65, pressure: 1013 },
    weather: [{ icon: "01d", description: "clear sky", main: "Clear" }],
    wind: { speed: 5.0, deg: 190 },
    pop: 0.05
  },
  {
    dt: 1775919600,
    dt_txt: "2026-06-11 15:00:00",
    main: { temp: 29.8, temp_min: 29.8, temp_max: 29.8, humidity: 68, pressure: 1012 },
    weather: [{ icon: "03d", description: "scattered clouds", main: "Clouds" }],
    wind: { speed: 4.8, deg: 185 },
    pop: 0.25
  },
  {
    dt: 1775930400,
    dt_txt: "2026-06-11 18:00:00",
    main: { temp: 28.0, temp_min: 28.0, temp_max: 28.0, humidity: 75, pressure: 1012 },
    weather: [{ icon: "02d", description: "few clouds", main: "Clouds" }],
    wind: { speed: 4.2, deg: 180 },
    pop: 0.15
  }
]

const mockForecastData: ForecastItem[] = [
  {
    dt: 1775908800,
    dt_txt: "2026-06-11 12:00:00",
    main: { temp: 30.2, temp_min: 26.0, temp_max: 31.0, humidity: 65, pressure: 1013 },
    weather: [{ icon: "01d", description: "clear sky", main: "Clear" }],
    wind: { speed: 5.0, deg: 190 },
    pop: 0.1
  },
  {
    dt: 1775995200,
    dt_txt: "2026-06-12 12:00:00",
    main: { temp: 29.5, temp_min: 25.5, temp_max: 30.5, humidity: 70, pressure: 1012 },
    weather: [{ icon: "02d", description: "few clouds", main: "Clouds" }],
    wind: { speed: 4.8, deg: 185 },
    pop: 0.2
  },
  {
    dt: 1776081600,
    dt_txt: "2026-06-13 12:00:00",
    main: { temp: 28.0, temp_min: 25.0, temp_max: 29.0, humidity: 78, pressure: 1011 },
    weather: [{ icon: "10d", description: "light rain", main: "Rain" }],
    wind: { speed: 4.5, deg: 175 },
    pop: 0.6
  },
  {
    dt: 1776168000,
    dt_txt: "2026-06-14 12:00:00",
    main: { temp: 28.5, temp_min: 24.8, temp_max: 29.5, humidity: 75, pressure: 1012 },
    weather: [{ icon: "02d", description: "few clouds", main: "Clouds" }],
    wind: { speed: 4.0, deg: 180 },
    pop: 0.3
  },
  {
    dt: 1776254400,
    dt_txt: "2026-06-15 12:00:00",
    main: { temp: 29.0, temp_min: 25.0, temp_max: 30.0, humidity: 72, pressure: 1013 },
    weather: [{ icon: "01d", description: "clear sky", main: "Clear" }],
    wind: { speed: 4.2, deg: 185 },
    pop: 0.15
  }
]

const mockAirQuality: AirQualityData = {
  list: [{
    main: { aqi: 2 },
    components: {
      co: 350.5,
      no: 0.1,
      no2: 4.5,
      o3: 45.0,
      so2: 1.2,
      pm2_5: 12.5,
      pm10: 22.0,
      nh3: 0.5
    }
  }]
}

const mockUVIndex: UVIndexData = {
  value: 4.5,
  date: 1775855587
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number, delay: number}>>([])
  
  // ✅ Add useRef to track the timer
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const [userLocation, setUserLocation] = useState<{
    name: string;
    lat: number | null;
    lon: number | null;
  }>({
    name: "Medina Estates, GH",
    lat: 5.6515,
    lon: -0.1856
  })

  const [weatherData, setWeatherData] = useState<WeatherData | null>(mockWeatherData)
  const [forecastData, setForecastData] = useState<ForecastItem[]>(mockForecastData)
  const [hourlyForecast, setHourlyForecast] = useState<ForecastItem[]>(mockHourlyForecast)
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(mockAirQuality)
  const [uvIndexData, setUVIndexData] = useState<UVIndexData | null>(mockUVIndex)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCelsius, setIsCelsius] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [weatherMessage, setWeatherMessage] = useState("🌞 It's getting warm! Stay hydrated.")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date("2026-06-10T22:08:50Z"))
  const [recommendations, setRecommendations] = useState<string[]>([
    "Drink plenty of water throughout the day",
    "Wear light, loose-fitting clothes",
    "Use sunscreen if spending time outdoors",
    "💧 High humidity - may feel warmer than actual temperature"
  ])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ✅ Utility functions
  const formatClientTime = (date: Date | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!mounted || !date) return ""
    const d = typeof date === 'number' ? new Date(date * 1000) : date
    return d.toLocaleTimeString('en-US', options)
  }

  const formatClientDate = (date: Date | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!mounted || !date) return ""
    const d = typeof date === 'number' ? new Date(date * 1000) : date
    return d.toLocaleDateString('en-US', options)
  }

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

  // ✅ FIXED: Use recursive setTimeout to avoid StrictMode issues with setInterval
  useEffect(() => {
    console.log('🕐 Clock timer starting...') // Debug log
    
    const updateClock = () => {
      const now = new Date()
      console.log('⏰ Clock updating:', now.toLocaleTimeString()) // Debug log
      setCurrentTime(now)
      clockTimerRef.current = setTimeout(updateClock, 1000)
    }

    // Start the timer
    updateClock()

    return () => {
      console.log('🛑 Cleaning up clock timer') // Debug log
      if (clockTimerRef.current) {
        clearTimeout(clockTimerRef.current)
        clockTimerRef.current = null
      }
    }
  }, []) // Empty dependency array

  // ✅ Load preferences and initialize app
  useEffect(() => {
    setMounted(true)
    setIsLoaded(true)
    
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
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
  }, []) // Only run once on mount

  // ✅ Weather refresh timer - separate useEffect
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    
    const weatherRefreshTimer = setInterval(() => {
      if (userLocation.lat && userLocation.lon && !loading) {
        console.log('🔄 Auto-refreshing weather data...', new Date().toISOString())
        fetchWeather(userLocation).catch(() => {
          retryCount++
          if (retryCount < maxRetries) {
            console.log(`🔄 Retry ${retryCount}/${maxRetries} in ${retryCount * 5}s`)
            setTimeout(() => fetchWeather(userLocation), retryCount * 5000)
          }
        })
      }
    }, 5 * 60 * 1000) // Refresh every 5 minutes for live data

    return () => {
      clearInterval(weatherRefreshTimer)
    }
  }, [userLocation.lat, userLocation.lon, loading]) // This can have dependencies

  // ✅ Enhanced fetch functions with better error handling and live data optimization
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
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        // Enhanced error handling
        if (response.status === 404) {
          throw new Error('📍 Location not found. Please check the city name or enable GPS.')
        } else if (response.status === 401) {
          throw new Error('🔑 API key invalid. Please check your OpenWeatherMap API key.')
        } else if (response.status === 429) {
          throw new Error('⏰ Too many requests. Please try again in a moment.')
        } else if (response.status >= 500) {
          throw new Error('🛠️ Weather service temporarily unavailable. Please try again later.')
        }
        throw new Error(errorData.error || 'Failed to fetch weather data')
      }
      
      const data = await response.json()
      console.log('✅ LIVE Weather data received:', {
        location: data.name,
        temp: data.main.temp,
        weather: data.weather[0].main,
        timestamp: new Date().toISOString()
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
      setError(err instanceof Error ? err.message : 'Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Enhanced forecast with live data optimization
  const fetchForecast = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch forecast')
      
      const data = await response.json()
      console.log('✅ LIVE Forecast data received:', data.list.length, 'items')
      
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

  // ✅ Enhanced Air Quality with live data
  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/air-quality?lat=${lat}&lon=${lon}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) throw new Error('Failed to fetch air quality')
      
      const data = await response.json()
      console.log('✅ LIVE Air Quality data received:', data.list[0].main.aqi)
      setAirQuality(data)
    } catch (error) {
      console.error('❌ Air quality fetch error:', error)
    }
  }

  // ✅ This function should be in your dashboard component
  interface UVIndexApiResponse {
    value: number
    date: number
  }

  const fetchUVIndex = async (lat: number, lon: number): Promise<void> => {
    try {
      const response: Response = await fetch(`/api/uv?lat=${lat}&lon=${lon}`, {
        headers: { 'Cache-Control': 'no-cache' }
      })
      
      if (!response.ok) {
        const errorData: { error: string } = await response.json()
        console.warn('⚠️ UV index fetch failed:', errorData.error)
        return // Gracefully fail without crashing the app
      }
      
      const data: UVIndexApiResponse = await response.json()
      console.log('✅ LIVE UV Index data received:', data.value)
      setUVIndexData(data)
    } catch (error) {
      console.warn('⚠️ UV index fetch error:', error)
      // Don't set error state, just log it
    }
  }

  // ✅ Enhanced weather message with recommendations
  const generateWeatherMessage = (tempCelsius: number) => {
    const recs: string[] = []
    
    if (tempCelsius < -10) {
      setWeatherMessage("🥶 Extreme cold! Bundle up with layers and stay warm!")
      recs.push("Wear thermal underwear, heavy coat, and insulated gloves")
      recs.push("Limit time outdoors to prevent frostbite")
      recs.push("Keep emergency supplies in your car")
    } else if (tempCelsius >= -10 && tempCelsius < 0) {
      setWeatherMessage("❄️ It's freezing! Wear a heavy coat and gloves!")
      recs.push("Bundle up with warm layers")
      recs.push("Watch for icy conditions when walking")
      recs.push("Keep hot drinks handy")
    } else if (tempCelsius >= 0 && tempCelsius < 10) {
      setWeatherMessage("🧥 Grab a jacket, it's quite chilly outside!")
      recs.push("Wear a warm jacket or coat")
      recs.push("Consider layering for comfort")
      recs.push("Perfect weather for hot beverages")
    } else if (tempCelsius >= 10 && tempCelsius < 15) {
      setWeatherMessage("🧣 A bit cool! Light jacket recommended.")
      recs.push("A light jacket or sweater is ideal")
      recs.push("Great weather for outdoor activities")
      recs.push("Morning jog conditions are perfect")
    } else if (tempCelsius >= 15 && tempCelsius < 20) {
      setWeatherMessage("🌸 Pleasant weather! Perfect for a walk.")
      recs.push("Comfortable temperature for most activities")
      recs.push("Ideal for a walk in the park")
      recs.push("No special clothing needed")
    } else if (tempCelsius >= 20 && tempCelsius < 25) {
      setWeatherMessage("😊 Comfortable temperature! Enjoy your day!")
      recs.push("Perfect weather for outdoor dining")
      recs.push("Great time for sports and exercise")
      recs.push("Light, breathable clothing recommended")
    } else if (tempCelsius >= 25 && tempCelsius < 30) {
      setWeatherMessage("🌞 It's getting warm! Stay hydrated.")
      recs.push("Drink plenty of water throughout the day")
      recs.push("Wear light, loose-fitting clothes")
      recs.push("Use sunscreen if spending time outdoors")
    } else if (tempCelsius >= 30 && tempCelsius < 35) {
      setWeatherMessage("🔥 Hot day ahead! Drink plenty of water.")
      recs.push("Stay in air-conditioned areas when possible")
      recs.push("Avoid strenuous outdoor activity")
      recs.push("Wear sunglasses and a hat")
    } else if (tempCelsius >= 35 && tempCelsius < 40) {
      setWeatherMessage("☀️ Very hot! Limit outdoor activities.")
      recs.push("Minimize time outdoors during peak hours")
      recs.push("Stay hydrated and seek shade")
      recs.push("Check on elderly and vulnerable people")
    } else if (tempCelsius >= 40) {
      setWeatherMessage("🌡️ Extreme heat warning! Stay indoors!")
      recs.push("Stay indoors with air conditioning")
      recs.push("Avoid all outdoor activities")
      recs.push("Drink water every 15-20 minutes")
    }
    
    // Add weather-specific recommendations
    if (weatherData?.rain) {
      recs.push("☔ Bring an umbrella - rain expected")
    }
    if (weatherData?.wind.speed && weatherData.wind.speed > 10) {
      recs.push("💨 Windy conditions - secure loose objects")
    }
    if (weatherData?.main.humidity && weatherData.main.humidity > 80) {
      recs.push("💧 High humidity - may feel warmer than actual temperature")
    }
    
    setRecommendations(recs)
  }

  const handleRefresh = () => {
    console.log('🔄 Manual refresh')
    requestUserLocation(true)
  }

  const handleUserProfile = () => {
    console.log('👤 User profile clicked')
    // Add user profile logic here
  }

  const handleLogout = () => {
    console.log('🚪 Logout clicked')
    // Add logout logic here, e.g., clear localStorage, redirect to login
    localStorage.clear()
    window.location.href = '/login' // or wherever the login page is
  }

  const toggleUnit = () => {
    setIsCelsius(!isCelsius)
  }

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

  const getSunPosition = () => {
    if (!weatherData) return { x: 50, y: 38, isDay: true, ratio: 0.5 }
    const now = Math.floor(currentTime.getTime() / 1000)
    const sunrise = weatherData.sys.sunrise
    const sunset = weatherData.sys.sunset
    
    const isDay = now >= sunrise && now <= sunset
    
    if (isDay) {
      const ratio = Math.max(0, Math.min((now - sunrise) / (sunset - sunrise), 1))
      const x = 5 + ratio * 90
      const y = 38 - 30 * Math.sin(ratio * Math.PI)
      return { x, y, isDay, ratio }
    } else {
      const nightDuration = 43200 // 12 hours fallback
      let timeSinceSunset = now - sunset
      if (timeSinceSunset < 0) {
        timeSinceSunset = now + 43200 - sunrise
      }
      const ratio = Math.min(Math.max(timeSinceSunset / nightDuration, 0), 1)
      const x = 5 + ratio * 90
      const y = 38 - 30 * Math.sin(ratio * Math.PI)
      return { x, y, isDay, ratio }
    }
  }

  const sidebarMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true, badge: null },
    { icon: CloudSun, label: 'Weather', href: '/dashboard/weather', active: false, badge: 'Live' },
    { icon: Calendar, label: 'Weekly Forecast', href: '/dashboard/weekly', active: false, badge: null },
    { icon: Clock, label: 'Hourly', href: '/dashboard/hourly', active: false, badge: null },
    { icon: Thermometer, label: 'Temperature', href: '/dashboard/temperature', active: false, badge: null },
    { icon: Droplet, label: 'Precipitation', href: '/dashboard/precipitation', active: false, badge: null },
    { icon: Wind, label: 'Wind', href: '/dashboard/wind', active: false, badge: null },
    { icon: Activity, label: 'Air Quality', href: '/dashboard/air-quality', active: false, badge: airQuality ? getAQIDescription(airQuality.list[0].main.aqi).label : null },
    { icon: Sun, label: 'UV Index', href: '/dashboard/uv-index', active: false, badge: uvIndexData ? getUVDescription(uvIndexData.value).label : null },
    { icon: Map, label: 'Weather Map', href: '/dashboard/weather-map', active: false, badge: null },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', active: false, badge: null },
    { icon: History, label: 'History', href: '/dashboard/history', active: false, badge: null },
    { icon: Bell, label: 'Alerts', href: '/dashboard/alerts', active: false, badge: weatherData && (weatherData.main.temp > 308.15 || weatherData.wind.speed > 15 || weatherData.visibility < 1000) ? 'New' : null },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', active: false, badge: null },
  ]


  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} relative overflow-x-hidden min-w-0 transition-colors duration-500`}>
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

      <div className="relative z-10 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto pb-24 sm:pb-12 box-border px-2 sm:px-4 md:px-6 page-inner">
        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          {/* Overlay */}
          <div 
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar Drawer */}
          <div 
            className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] ${
              isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
            } shadow-2xl z-50 transition-all duration-300 ease-out overflow-y-auto ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              boxShadow: isSidebarOpen ? '0 0 50px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            {/* Sidebar Header */}
            <div className={`sticky top-0 ${
              isDarkMode ? 'bg-slate-900/95' : 'bg-blue-600'
            } backdrop-blur-lg p-4 flex items-center justify-between border-b ${
              isDarkMode ? 'border-blue-800' : 'border-blue-400'
            } z-10 shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
                  <CloudSun className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Weather App</h2>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live Updates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-600 rounded-full">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Guest User</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{userLocation.name.split(',')[0]}</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'
                }`}>
                  <Thermometer className={`h-4 w-4 mx-auto mb-1 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <p className={`text-xs font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{weatherData ? formatTemp(weatherData.main.temp) : '--'}°</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-cyan-900/40' : 'bg-cyan-100'
                }`}>
                  <Droplets className={`h-4 w-4 mx-auto mb-1 ${
                    isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                  }`} />
                  <p className={`text-xs font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{weatherData?.main.humidity || '--'}%</p>
                </div>
                <div className={`p-2 rounded-lg text-center ${
                  isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-100'
                }`}>
                  <Wind className={`h-4 w-4 mx-auto mb-1 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                  <p className={`text-xs font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{weatherData ? (weatherData.wind.speed * 3.6).toFixed(0) : '--'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Navigation</p>
              <nav className="space-y-1">
                {sidebarMenuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={index}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        setIsSidebarOpen(false)
                        // Add navigation logic here
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                        item.active
                          ? isDarkMode
                            ? 'bg-blue-900/60 text-white shadow-lg'
                            : 'bg-blue-600 text-white shadow-lg'
                          : isDarkMode
                          ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {/* Hover effect background */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                      }`} />
                      
                      <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 relative z-10 ${
                        item.active
                          ? 'text-white'
                          : isDarkMode
                          ? 'text-gray-400 group-hover:text-white'
                          : 'text-gray-500 group-hover:text-blue-600'
                      }`} />
                      <span className="font-medium text-sm flex-1 relative z-10">{item.label}</span>
                      
                      {/* Active indicator */}
                      {item.active && (
                        <div className="ml-auto relative z-10">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                      
                      {/* Badge */}
                      {item.badge && !item.active && (
                        <Badge className={`ml-auto text-[10px] px-1.5 py-0.5 relative z-10 ${
                          item.badge === 'New' || item.badge === 'Live'
                            ? 'bg-red-500 text-white border-0 animate-pulse'
                            : item.badge === 'Good' || item.badge === 'Low'
                            ? 'bg-green-500 text-white border-0'
                            : item.badge === 'Moderate' || item.badge === 'Fair'
                            ? 'bg-yellow-500 text-white border-0'
                            : 'bg-orange-500 text-white border-0'
                        }`}>
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  )
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className={`p-4 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Quick Actions</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    toggleUnit()
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Thermometer className="h-5 w-5" />
                  <span className="text-sm font-medium">Temperature Unit: °{isCelsius ? 'C' : 'F'}</span>
                </button>
                
                <button
                  onClick={() => {
                    toggleDarkMode()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                
                <button
                  onClick={() => {
                    requestUserLocation(true)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Navigation className="h-5 w-5" />
                  <span className="text-sm font-medium">Refresh Location</span>
                </button>

                <button
                  onClick={() => {
                    handleVoiceSearch()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                  <span className="text-sm font-medium">Voice Search</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t mt-auto ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => {
                  handleLogout()
                  setIsSidebarOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
              
              <div className={`mt-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-white/5' : 'bg-gray-100'
              }`}>
                <div className={`text-center text-xs space-y-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p className="font-semibold flex items-center justify-center gap-2">
                    <CloudSun className="h-3 w-3" />
                    Weather App v1.0
                  </p>
                  {lastUpdated && (
                    <p className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last update: {formatClientTime(lastUpdated)}
                    </p>
                  )}
                  <p className="text-[10px] opacity-75">© 2026 All rights reserved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && !weatherData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4`}>
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <div className="text-center">
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Loading Weather Data
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {userLocation.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section - Mobile Optimized */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-5 md:p-7 border ${isDarkMode ? 'border-gray-700' : 'border-white/20'} transition-colors duration-500`}>
            <div className="flex flex-col gap-3 sm:gap-5">
              <div className="flex items-start gap-3">
               
                
              <div className="flex-1">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-2`}>
                  <span className="text-blue-600 dark:text-blue-400">Live Weather</span> Dashboard
                </h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base md:text-lg`}>Real-time weather data from your location</p>
                
                {weatherMessage && !loading && (
                  <div className={`mt-2 sm:mt-3 px-3 sm:px-4 py-2 sm:py-2.5 ${isDarkMode ? 'bg-blue-950/60 border border-blue-800' : 'bg-blue-50 border border-blue-200'} rounded-xl shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 inline-block`}>
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">
                        <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                      </div>
                      <p className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>{weatherMessage}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-2 sm:mt-3">
                  <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {loading && !weatherData ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 animate-spin" />
                        <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{userLocation.name}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 animate-pulse" />
                        <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{userLocation.name}</span>
                        {userLocation.lat && userLocation.lon && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                            GPS: {userLocation.lat.toFixed(4)}°, {userLocation.lon.toFixed(4)}°
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    <span className="hidden sm:inline">{formatClientDate(currentTime, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    <span className="sm:hidden">{formatClientDate(currentTime, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {lastUpdated && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      Updated: {formatClientTime(lastUpdated)}
                    </Badge>
                  )}
                </div>
              </div>
              </div>
              
              {/* Controls - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-1">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  <span className={`text-lg sm:text-xl md:text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formatClientTime(currentTime, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 sm:gap-1.5 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestUserLocation(true)}
                    className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    title="Refresh GPS location"
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceSearch}
                    className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    title="Voice search"
                  >
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleUnit}
                    className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                  >
                    <span className="text-xs sm:text-sm">°{isCelsius ? 'C' : 'F'}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDarkMode}
                    className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                  >
                    {isDarkMode ? <Sun className="h-3 w-3 sm:h-4 sm:w-4" /> : <Moon className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUserProfile}
                    className={`flex-1 sm:flex-none min-w-[36px] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
                    title="User profile"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    size="sm"
                    className="flex-1 sm:flex-none min-w-[36px] bg-blue-600 hover:bg-blue-700 text-white"
                    title="Refresh all data"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 shadow-lg animate-in slide-in-from-top duration-500">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold text-sm sm:text-base mb-1">⚠️ Alert</p>
              <p className="text-xs sm:text-sm">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Weather Alerts/Warnings */}
        {weatherData && !loading && (
          <>
            {weatherData.main.temp > 308.15 && ( // > 35°C
              <div className="mb-4 sm:mb-6 bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-400 dark:border-orange-850 rounded-xl p-3 sm:p-4 shadow-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="font-bold text-sm sm:text-base text-orange-900 mb-1">🌡️ Extreme Heat Warning</p>
                    <p className="text-xs sm:text-sm text-orange-800">
                      Temperature is dangerously high. Stay indoors, stay hydrated, and avoid outdoor activities.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {weatherData.wind.speed > 15 && ( // > 54 km/h
              <div className="mb-4 sm:mb-6 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-800 rounded-xl p-3 sm:p-4 shadow-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Wind className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 animate-bounce" />
                  <div>
                    <p className="font-bold text-sm sm:text-base text-blue-900 mb-1">💨 High Wind Advisory</p>
                    <p className="text-xs sm:text-sm text-blue-800">
                      Strong winds detected. Secure loose objects and be cautious when driving.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {weatherData.visibility < 1000 && (
              <div className="mb-4 sm:mb-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-400 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm sm:text-base text-gray-900 mb-1">🌫️ Low Visibility Warning</p>
                    <p className="text-xs sm:text-sm text-gray-800">
                      Poor visibility conditions. Drive carefully and use fog lights if available.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Weather Statistics Summary */}
        {weatherData && !loading && (
          <div className={`mb-4 sm:mb-6 transition-all duration-1000 delay-150 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className={`${isDarkMode ? 'bg-blue-700' : 'bg-blue-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <Thermometer className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">Now</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{formatTemp(weatherData.main.temp)}°</p>
                <p className="text-xs sm:text-sm text-white/80">Temperature</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-cyan-700' : 'bg-cyan-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">Live</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{weatherData.main.humidity}%</p>
                <p className="text-xs sm:text-sm text-white/80">Humidity</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-emerald-700' : 'bg-emerald-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <Wind className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">{getWindDirection(weatherData.wind.deg)}</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{(weatherData.wind.speed * 3.6).toFixed(0)}</p>
                <p className="text-xs sm:text-sm text-white/80">Wind (km/h)</p>
              </div>
              
              <div className={`${isDarkMode ? 'bg-purple-700' : 'bg-purple-500'} rounded-xl p-3 sm:p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="flex items-center justify-between mb-2">
                  <Cloud className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Badge className="bg-white/20 text-white border-0 text-xs">Sky</Badge>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{weatherData.clouds.all}%</p>
                <p className="text-xs sm:text-sm text-white/80">Cloud Cover</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Temperature Card - Mobile Optimized */}
        <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Card className={`border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} overflow-hidden relative group transition-all duration-500 hover:scale-[1.01]`}>
            <div className={`absolute inset-0 w-full h-full box-border rounded-2xl sm:rounded-3xl pointer-events-none ${isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50/20'}`} />
            
            {/* Animated weather icons in background */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <Cloud className="absolute top-4 right-8 h-24 w-24 animate-float" style={{animationDelay: '0s'}} />
              <Sun className="absolute bottom-8 left-8 h-20 w-20 animate-float" style={{animationDelay: '2s'}} />
              <Droplets className="absolute top-1/2 left-1/4 h-16 w-16 animate-float" style={{animationDelay: '1s'}} />
            </div>

            <CardContent className="p-3 sm:p-5 md:p-7 relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-5 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 w-full sm:w-auto">
                  <div className="p-3 sm:p-5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl sm:rounded-3xl shadow-md border border-blue-100 dark:border-blue-900 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {weatherData?.weather[0]?.icon ? (
                      <img 
                        src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`}
                        alt={weatherData.weather[0].description}
                        className="h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 drop-shadow-lg animate-bounce"
                        style={{animationDuration: '3s'}}
                      />
                    ) : (
                      <Cloud className="h-14 w-14 sm:h-18 sm:w-18 animate-pulse drop-shadow-lg" />
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1 sm:mb-2 text-slate-900 dark:text-white drop-shadow-lg animate-in slide-in-from-bottom duration-700">
                        {loading ? '--' : formatTemp(weatherData?.main.temp || 0)}°{isCelsius ? 'C' : 'F'}
                      </h2>
                      {weatherData?.main && (
                        <div className="relative group/tooltip">
                          <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-help transition-colors" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl z-50">
                            <p className="font-semibold mb-1">Temperature Details</p>
                            <p>Current: {formatTemp(weatherData.main.temp)}°</p>
                            <p>Feels like: {formatTemp(weatherData.main.feels_like)}°</p>
                            <p>High: {formatTemp(weatherData.main.temp_max)}°</p>
                            <p>Low: {formatTemp(weatherData.main.temp_min)}°</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 font-medium capitalize drop-shadow-md flex items-center gap-2 justify-center sm:justify-start">
                      {loading ? 'Loading live data...' : (
                        <>
                          <span>{weatherData?.weather[0]?.description || 'N/A'}</span>
                          {weatherData?.weather[0]?.main === 'Rain' && <Umbrella className="h-4 w-4 text-blue-500" />}
                          {weatherData?.weather[0]?.main === 'Snow' && <Snowflake className="h-4 w-4 text-blue-300" />}
                          {weatherData?.weather[0]?.main === 'Clear' && <Sun className="h-4 w-4 text-amber-500" />}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 justify-center sm:justify-start">
                      <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400" />
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Feels like {loading ? '--' : formatTemp(weatherData?.main.feels_like || 0)}°{isCelsius ? 'C' : 'F'}
                      </p>
                    </div>
                    {weatherData?.main && (
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm">
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-750">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{formatTemp(weatherData.main.temp_max)}°</span>
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-750">
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{formatTemp(weatherData.main.temp_min)}°</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center sm:text-right w-full sm:w-auto">
                  <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800 text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1.5 sm:py-2 mb-2 sm:mb-3 font-semibold hover:scale-105 transition-transform border">
                    {loading ? 'Loading' : weatherData?.weather[0]?.main || 'N/A'}
                  </Badge>
                  {weatherData?.clouds && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-1 sm:mb-2 flex items-center gap-1 justify-center sm:justify-end">
                      <Cloud className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                      Cloud cover: {weatherData.clouds.all}%
                    </p>
                  )}
                  {weatherData?.visibility && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1 justify-center sm:justify-end">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                      Visibility: {(weatherData.visibility / 1000).toFixed(1)} km
                    </p>
                  )}
                  {weatherData?.dt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
                      📡 Updated: {formatClientTime(weatherData.dt)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Recommendations */}
        {recommendations.length > 0 && !loading && (
          <div className={`mb-4 sm:mb-6 transition-all duration-1000 delay-250 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`border shadow-xl ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  Weather Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-2 sm:p-3 rounded-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-sm transition-colors border ${isDarkMode ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weather Details Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {/* Card 1: Humidity */}
          <div
            className={`transition-all duration-1000 min-w-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-blue-50/70 border-blue-200 text-slate-800'} hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between h-full min-h-[140px]">
                <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Humidity</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                      {loading ? '--' : (weatherData?.main.humidity || 0)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold">%</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                    {weatherData?.main.humidity ? `${weatherData.main.humidity}% relative humidity` : 'No data'}
                  </p>
                </div>
                
                <div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-100/50 dark:bg-slate-850/50 rounded-full shadow-inner p-1">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%" cy="50%" r="28"
                      className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                      strokeWidth="5"
                    />
                    <circle
                      cx="50%" cy="50%" r="28"
                      className="stroke-blue-500 dark:stroke-blue-400 fill-none transition-all duration-1000 ease-out"
                      strokeWidth="5"
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 - (175.9 * (weatherData?.main.humidity || 0)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl animate-float">💧</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Card 2: Wind Speed & Direction */}
          <div
            className={`transition-all duration-1000 min-w-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-teal-50/70 border-teal-200 text-slate-800'} hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between h-full min-h-[140px]">
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-teal-500 transition-colors">Wind Speed</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                      {loading ? '--' : (weatherData ? (weatherData.wind.speed * 3.6).toFixed(1) : '0.0')}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">km/h</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {weatherData?.wind.deg ? `${getWindDirection(weatherData.wind.deg)} direction (${weatherData.wind.deg}°)` : 'Calm'}
                  </p>
                  {weatherData?.wind.gust && (
                    <p className="text-[9px] sm:text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-0.5 mt-0.5">
                      <Zap className="h-2.5 w-2.5 animate-pulse" /> Gusts: {(weatherData.wind.gust * 3.6).toFixed(0)} km/h
                    </p>
                  )}
                </div>

                <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-slate-200/50 dark:bg-slate-850 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <span className="absolute top-0.5 text-[8px] font-extrabold text-slate-400">N</span>
                  <span className="absolute right-0.5 text-[8px] font-extrabold text-slate-400">E</span>
                  <span className="absolute bottom-0.5 text-[8px] font-extrabold text-slate-400">S</span>
                  <span className="absolute left-0.5 text-[8px] font-extrabold text-slate-400">W</span>
                  
                  <div 
                    className="w-1.5 h-10 sm:h-12 relative transition-transform duration-1000 ease-out"
                    style={{ transform: `rotate(${(weatherData?.wind.deg || 0) + 180}deg)` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[20px] sm:border-b-[24px] border-b-red-500 border-l-transparent border-r-transparent" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[20px] sm:border-t-[24px] border-t-slate-400 dark:border-t-slate-500 border-l-transparent border-r-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 dark:bg-slate-100 rounded-full border border-white" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Card 3: Visibility */}
          <div
            className={`transition-all duration-1000 min-w-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '500ms' }}
          >
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-indigo-50/70 border-indigo-200 text-slate-800'} hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full min-h-[140px] space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">Visibility</p>
                    <div className="p-1.5 rounded-lg bg-indigo-250/20 dark:bg-indigo-900/40 border border-indigo-300/20">
                      <Eye className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                      {loading ? '--' : (weatherData ? (weatherData.visibility / 1000).toFixed(1) : '0.0')}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">km</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-slate-400/80 via-blue-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(((weatherData?.visibility || 0) / 10000) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span>0 km</span>
                    <Badge className="bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800 py-0 px-1.5 text-[9px] font-bold">
                      {weatherData?.visibility ? (weatherData.visibility >= 10000 ? "Excellent" : weatherData.visibility >= 5000 ? "Good" : "Moderate") : "No data"}
                    </Badge>
                    <span>10+ km</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Card 4: Pressure */}
          <div
            className={`transition-all duration-1000 min-w-0 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ transitionDelay: '600ms' }}
          >
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-rose-50/70 border-rose-200 text-slate-800'} hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between h-full min-h-[140px]">
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-500 transition-colors">Barometer</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                      {loading ? '--' : (weatherData?.main.pressure || 0)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">hPa</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {weatherData?.main.pressure ? (weatherData.main.pressure > 1013 ? "High Pressure" : weatherData.main.pressure < 1013 ? "Low Pressure" : "Normal Pressure") : "No data"}
                  </p>
                </div>

                <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-slate-200/50 dark:bg-slate-850 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative">
                    <Gauge className="h-5 w-5 text-rose-500/80 animate-pulse" />
                    
                    <div 
                      className="absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-1000 ease-out"
                      style={{ transform: `rotate(${Math.min(Math.max(((weatherData?.main.pressure || 1013) - 1013) * 2.5, -90), 90)}deg)` }}
                    >
                      <div className="w-0.5 h-6 sm:h-8 bg-rose-550 -translate-y-2 relative rounded-full">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Weather Info - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {/* UV Index */}
          {uvIndexData && (
            <Card className={`relative overflow-hidden border border-amber-200 dark:border-amber-800/80 bg-amber-100/60 dark:bg-amber-950/40 hover:bg-amber-200/40 dark:hover:bg-amber-900/50 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full min-h-[160px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <div className="p-1.5 rounded-xl bg-amber-200/60 dark:bg-amber-900/50 group-hover:scale-110 transition-all duration-500">
                      <Sun className="h-4 w-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    UV Index
                  </CardTitle>
                  <Badge className={`${getUVDescription(uvIndexData.value).bgColor} ${getUVDescription(uvIndexData.value).color} border-0 text-[10px] sm:text-xs font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                    {getUVDescription(uvIndexData.value).label}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-1.5 group-hover:scale-105 transition-transform origin-left">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-none">{uvIndexData.value.toFixed(1)}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">of 11+</span>
                  </div>

                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-450 via-orange-500 via-red-500 to-purple-600 rounded-full" />
                    <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-white border border-slate-400 shadow-md rounded-full transition-all duration-1000 ease-out animate-pulse" 
                      style={{ left: `calc(${Math.min((uvIndexData.value / 11) * 100, 100)}% - 3px)` }} 
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium">
                    {uvIndexData.value <= 2 ? "Minimal protection required" :
                     uvIndexData.value <= 5 ? "Moderate sun protection needed" :
                     uvIndexData.value <= 7 ? "High sun protection required" :
                     "Extreme protection necessary"}
                  </p>
                </div>

                {/* Recommendations Icons */}
                <div className="flex items-center gap-2 pt-1.5 border-t border-amber-250/30 dark:border-amber-900/30">
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 mr-auto">Protection:</p>
                  <div className="flex gap-1.5">
                    <div className={`p-1.5 rounded-lg border text-xs transition-all ${uvIndexData.value >= 3 ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-md scale-105 animate-pulse' : 'bg-slate-200/30 dark:bg-slate-800/30 border-transparent text-slate-400'}`} title="Sunglasses Recommendeded">
                      <Glasses className="h-3.5 w-3.5" />
                    </div>
                    <div className={`p-1.5 rounded-lg border text-xs transition-all ${uvIndexData.value >= 3 ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-md scale-105 animate-pulse' : 'bg-slate-200/30 dark:bg-slate-800/30 border-transparent text-slate-400'}`} title="Hat Recommendeded">
                      <Shirt className="h-3.5 w-3.5" />
                    </div>
                    <div className={`p-1.5 rounded-lg border text-xs transition-all ${uvIndexData.value >= 3 ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-md scale-105 animate-pulse' : 'bg-slate-200/30 dark:bg-slate-800/30 border-transparent text-slate-400'}`} title="Sunscreen Recommendeded">
                      <Sun className="h-3.5 w-3.5" />
                    </div>
                    <div className={`p-1.5 rounded-lg border text-xs transition-all ${uvIndexData.value >= 6 ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-md scale-105 animate-pulse' : 'bg-slate-200/30 dark:bg-slate-800/30 border-transparent text-slate-400'}`} title="Shade Recommendeded">
                      <Umbrella className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Air Quality */}
          {airQuality && (
            <Card className={`relative overflow-hidden border border-emerald-200 dark:border-emerald-800/80 bg-emerald-100/60 dark:bg-emerald-950/40 hover:bg-emerald-200/40 dark:hover:bg-emerald-900/50 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full min-h-[160px] space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <div className="p-1.5 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/50 group-hover:scale-110 transition-all duration-500">
                      <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                    </div>
                    Air Quality
                  </CardTitle>
                  <Badge className={`${getAQIDescription(airQuality.list[0].main.aqi).bgColor} ${getAQIDescription(airQuality.list[0].main.aqi).color} border-0 text-[10px] sm:text-xs font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                    {getAQIDescription(airQuality.list[0].main.aqi).label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1 group-hover:scale-105 transition-transform origin-left">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-none">
                        {airQuality.list[0].main.aqi}
                      </span>
                      <span className="text-slate-550 dark:text-slate-400 text-xs font-semibold">/ 5</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium leading-tight">
                      Index scale (1 - 5)
                    </p>
                  </div>

                  <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-850/50 rounded-full shadow-inner p-1">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="50%" cy="50%" r="18" className="stroke-slate-200 dark:stroke-slate-800 fill-none" strokeWidth="4" />
                      <circle 
                        cx="50%" cy="50%" r="18" 
                        className={`fill-none transition-all duration-1000 ease-out ${
                          airQuality.list[0].main.aqi === 1 ? 'stroke-green-500' :
                          airQuality.list[0].main.aqi === 2 ? 'stroke-yellow-500' :
                          airQuality.list[0].main.aqi === 3 ? 'stroke-orange-500' :
                          airQuality.list[0].main.aqi === 4 ? 'stroke-red-500' :
                          'stroke-purple-500'
                        }`} 
                        strokeWidth="4" 
                        strokeDasharray="113.1" 
                        strokeDashoffset={113.1 - (113.1 * airQuality.list[0].main.aqi) / 5}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-slate-500 dark:text-slate-400">AQI</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-emerald-250/30 dark:border-emerald-900/30 text-[10px] font-semibold text-slate-505 dark:text-slate-400">
                  <div className="bg-slate-200/30 dark:bg-slate-850/40 p-1 rounded-lg border border-slate-300/10 hover:scale-[1.02] hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${airQuality.list[0].components.pm2_5 <= 12 ? 'bg-green-500' : airQuality.list[0].components.pm2_5 <= 35 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span>PM2.5</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-xs mt-0.5">{airQuality.list[0].components.pm2_5.toFixed(1)} <span className="text-[8px] font-normal text-slate-400">μg/m³</span></span>
                  </div>

                  <div className="bg-slate-200/30 dark:bg-slate-850/40 p-1 rounded-lg border border-slate-300/10 hover:scale-[1.02] hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${airQuality.list[0].components.pm10 <= 54 ? 'bg-green-500' : airQuality.list[0].components.pm10 <= 154 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span>PM10</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-xs mt-0.5">{airQuality.list[0].components.pm10.toFixed(1)} <span className="text-[8px] font-normal text-slate-400">μg/m³</span></span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Sunrise/Sunset */}
          {weatherData?.sys && (
            <Card className={`relative overflow-hidden border border-orange-200 dark:border-orange-850/80 bg-orange-100/60 dark:bg-orange-950/40 hover:bg-orange-200/40 dark:hover:bg-orange-900/50 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group rounded-2xl cursor-pointer active:scale-100 shadow-md`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/5' : 'bg-white/5'}`} />
              
              <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full min-h-[160px] space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    <div className="p-1.5 rounded-xl bg-orange-200/60 dark:bg-orange-900/50 group-hover:scale-110 transition-all duration-500">
                      <Sunrise className="h-4 w-4 text-orange-500" />
                    </div>
                    Sun Times
                  </CardTitle>
                  <span className="text-[10px] bg-orange-200/60 dark:bg-orange-900/50 text-orange-700 dark:text-orange-350 px-2 py-0.5 rounded-full font-bold border border-orange-350/40">
                    Daylight: {(((weatherData.sys.sunset - weatherData.sys.sunrise) / 3600)).toFixed(1)}h
                  </span>
                </div>

                {/* Daylight Arc Visual */}
                <div className="relative w-full h-12 mt-1">
                  {(() => {
                    const sunPos = getSunPosition();
                    return (
                      <svg viewBox="0 0 100 42" className="w-full h-full overflow-visible">
                        {/* Sun Curve Path */}
                        <path 
                          d="M 5,38 Q 50,8 95,38" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.2" 
                          strokeDasharray="2,2" 
                          className="text-slate-350 dark:text-slate-700" 
                        />
                        {/* Ground Horizon line */}
                        <line 
                          x1="0" 
                          y1="38" 
                          x2="100" 
                          y2="38" 
                          stroke="currentColor" 
                          strokeWidth="0.8" 
                          className="text-slate-200 dark:text-slate-800" 
                        />
                        {/* Animated Sun / Moon position */}
                        <g 
                          transform={`translate(${sunPos.x}, ${sunPos.y})`} 
                          className="transition-all duration-1000 ease-out"
                        >
                          {sunPos.isDay ? (
                            <>
                              <circle r="4.5" fill="#f59e0b" className="animate-pulse" />
                              <circle r="7.5" fill="none" stroke="#f59e0b" strokeWidth="0.6" className="animate-ping" style={{ animationDuration: '3s' }} />
                            </>
                          ) : (
                            <>
                              <circle r="4" fill="#60a5fa" />
                              {/* Moon crescent shape overlap */}
                              <circle cx="1.5" cy="-1.5" r="4" fill={isDarkMode ? '#0f172a' : '#f8fafc'} />
                            </>
                          )}
                        </g>
                      </svg>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1.5 border-t border-orange-250/30 dark:border-orange-900/30">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-semibold text-slate-450">Sunrise</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{formatClientTime(weatherData.sys.sunrise, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-semibold text-slate-450">Sunset</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{formatClientTime(weatherData.sys.sunset, { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Hourly Forecast - Mobile Optimized */}
        {hourlyForecast.length > 0 && (
          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl group shadow-xl`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/10' : 'bg-slate-50/10'}`} />
              
              <div className="relative z-10">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 group-hover:scale-110 transition-all duration-500">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 dark:text-indigo-400 group-hover:animate-pulse" />
                    </div>
                    Hourly Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="overflow-x-auto pb-2 sidebar-scroll">
                    <div className="flex gap-2 sm:gap-3 px-1 pb-1 snap-x snap-mandatory overflow-y-hidden">
                      {hourlyForecast.map((hour, index) => {
                        const rainPop = Math.round(hour.pop * 100);
                        const isRaining = rainPop > 20;
                        return (
                          <div 
                            key={index} 
                            className={`flex-shrink-0 text-center p-3 rounded-2xl ${
                              isDarkMode 
                                ? 'bg-slate-900/50 hover:bg-slate-850/70 border-slate-800 hover:border-slate-700' 
                                : 'bg-blue-50/30 hover:bg-blue-50/70 border-blue-100 hover:border-blue-200'
                            } snap-center hover:scale-[1.05] hover:shadow-lg transition-all duration-300 border w-[95px] sm:w-[115px] cursor-pointer group/hour flex flex-col justify-between min-h-[165px]`}
                          >
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-400">
                              {formatClientTime(hour.dt, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            
                            <div className="relative my-1 flex items-center justify-center">
                              <img 
                                src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`}
                                alt={hour.weather[0].description}
                                className="h-10 w-10 sm:h-12 sm:w-12 mx-auto drop-shadow-md group-hover/hour:scale-120 transition-all duration-300 group-hover/hour:rotate-6"
                              />
                            </div>
                            
                            <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate font-semibold capitalize my-0.5">
                              {hour.weather[0].description}
                            </p>
                            
                            <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-none">
                              {formatTemp(hour.main.temp)}°
                            </p>
                            
                            <div className={`mt-2 flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-[10px] font-bold ${
                              isRaining 
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            } transition-colors`}>
                              <Droplets className="h-2.5 w-2.5" />
                              <span>{rainPop}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* 5-Day Forecast - Mobile Optimized */}
        {forecastData.length > 0 && (
          <div className={`mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl group shadow-xl`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/10' : 'bg-slate-50/10'}`} />
              
              <div className="relative z-10">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-slate-900 dark:text-white group-hover:scale-105 transition-transform origin-left">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 group-hover:scale-110 transition-all duration-500">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 group-hover:animate-pulse" />
                    </div>
                    5-Day Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2.5">
                    {forecastData.map((day, index) => {
                      const dayName = formatClientDate(day.dt, { weekday: 'long' })
                      const dateStr = formatClientDate(day.dt, { month: 'short', day: 'numeric' })
                      const rainPop = Math.round(day.pop * 100);
                      const isRaining = rainPop > 20;
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-2xl ${
                            isDarkMode 
                              ? 'bg-slate-900/40 hover:bg-slate-850/60 border-slate-850 hover:border-slate-800' 
                              : 'bg-indigo-50/35 hover:bg-indigo-50/70 border-indigo-100 hover:border-indigo-150'
                          } transition-all duration-300 hover:scale-[1.01] hover:shadow-md border cursor-pointer group/day gap-3`}
                        >
                          {/* Day & Date */}
                          <div className="w-[110px] sm:w-[130px] flex-shrink-0 text-left">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-905 dark:text-white group-hover/day:text-indigo-500 dark:group-hover/day:text-indigo-400 transition-colors">
                              {index === 0 ? "Today" : dayName}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-semibold">{dateStr}</p>
                          </div>

                          {/* Weather Icon & Condition */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <img 
                                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                                alt={day.weather[0].description}
                                className="h-8 w-8 sm:h-10 sm:w-10 object-contain drop-shadow group-hover/day:scale-110 transition-transform"
                              />
                            </div>
                            <div className="hidden sm:block text-left min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize truncate">{day.weather[0].main}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate capitalize">{day.weather[0].description}</p>
                            </div>
                          </div>

                          {/* Precipitation Chance */}
                          <div className="flex-shrink-0 text-center w-12 sm:w-16">
                            <div className={`inline-flex items-center gap-0.5 py-1 px-1.5 rounded-lg text-[10px] font-bold ${
                              isRaining 
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800/40 text-slate-450 dark:text-slate-500'
                            }`}>
                              <Droplets className="h-2.5 w-2.5" />
                              <span>{rainPop}%</span>
                            </div>
                          </div>

                          {/* Temperature Range (min / max) */}
                          <div className="flex items-center justify-end gap-2 w-20 sm:w-32 flex-shrink-0 text-right font-bold text-xs sm:text-sm">
                            <span className="text-slate-400 dark:text-slate-500 font-medium w-8 text-left">{formatTemp(day.main.temp_min)}°</span>
                            
                            {/* Temp Range Slider visual */}
                            <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden hidden sm:block min-w-[50px]">
                              <div 
                                className="absolute h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full"
                                style={{ 
                                  left: '15%', 
                                  right: '15%' 
                                }}
                              />
                            </div>

                            <span className="text-slate-905 dark:text-white w-8 text-right">{formatTemp(day.main.temp_max)}°</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Additional Weather Details - Mobile Optimized */}
        {weatherData && (
          <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className={`relative overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl group shadow-xl`}>
              <div className={`absolute inset-0 w-full h-full pointer-events-none ${isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50/10'}`} />
              
              <div className="relative z-10">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className={`flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:scale-105 transition-transform origin-left`}>
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 group-hover:scale-110 transition-all duration-500">
                      <Thermometer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-500 dark:text-violet-400 group-hover:animate-pulse" />
                    </div>
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {/* Card 1: Wind Gust */}
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-amber-50/30 border-amber-100'
                    } hover:shadow-md hover:scale-[1.03] transition-all duration-300 flex items-center justify-between min-h-[90px] cursor-pointer group/gust`}>
                      <div className="space-y-1 flex-1 min-w-0 pr-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover/gust:text-amber-500 transition-colors">Wind Gust</span>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {weatherData.wind.gust ? (weatherData.wind.gust * 3.6).toFixed(1) : (weatherData.wind.speed * 4.2).toFixed(1)} <span className="text-[9px] font-normal text-slate-400">km/h</span>
                        </p>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded-lg group-hover/gust:scale-110 transition-transform">
                        <Zap className="h-4 w-4 text-amber-550 group-hover/gust:animate-bounce" />
                      </div>
                    </div>
                    
                    {/* Card 2: Wind Direction */}
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-blue-50/30 border-blue-100'
                    } hover:shadow-md hover:scale-[1.03] transition-all duration-300 flex items-center justify-between min-h-[90px] cursor-pointer group/dir`}>
                      <div className="space-y-1 flex-1 min-w-0 pr-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover/dir:text-blue-500 transition-colors">Wind Direction</span>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {getWindDirection(weatherData.wind.deg)} <span className="text-[9px] font-normal text-slate-400">({weatherData.wind.deg}°)</span>
                        </p>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded-lg group-hover/dir:scale-110 group-hover/dir:rotate-180 transition-transform duration-700">
                        <Compass className="h-4 w-4 text-blue-550" />
                      </div>
                    </div>

                    {/* Card 3: Cloudiness */}
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-sky-50/30 border-sky-100'
                    } hover:shadow-md hover:scale-[1.03] transition-all duration-300 flex items-center justify-between min-h-[90px] cursor-pointer group/cloud`}>
                      <div className="space-y-1 flex-1 min-w-0 pr-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover/cloud:text-sky-500 transition-colors">Cloudiness</span>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {weatherData.clouds.all}%
                        </p>
                      </div>
                      <div className="p-2 bg-sky-500/10 rounded-lg group-hover/cloud:scale-110 transition-transform">
                        <Cloud className="h-4 w-4 text-sky-500" />
                      </div>
                    </div>

                    {/* Card 4: Rainfall */}
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-indigo-50/30 border-indigo-100'
                    } hover:shadow-md hover:scale-[1.03] transition-all duration-300 flex items-center justify-between min-h-[90px] cursor-pointer group/rain`}>
                      <div className="space-y-1 flex-1 min-w-0 pr-1">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover/rain:text-indigo-500 transition-colors">Rain Volume</span>
                        <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {weatherData.rain ? (weatherData.rain["1h"] || weatherData.rain["3h"] || 0) : 0} <span className="text-[9px] font-normal text-slate-450">mm</span>
                        </p>
                      </div>
                      <div className="p-2 bg-indigo-500/10 rounded-lg group-hover/rain:scale-110 transition-transform">
                        <CloudRain className="h-4 w-4 text-indigo-500 group-hover/rain:animate-bounce" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="lg:hidden fixed left-2 right-2 bottom-2 z-50">
        <div className={`flex items-center justify-between gap-1 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} backdrop-blur-xl rounded-full shadow-2xl px-2 py-1.5 border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="w-10 h-10 rounded-full flex items-center justify-center relative bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
            {/* Notification Badge */}
            {weatherData && (weatherData.main.temp > 308.15 || weatherData.wind.speed > 15 || weatherData.visibility < 1000) && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          <button
            onClick={() => requestUserLocation(true)}
            aria-label="Refresh location"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
            title="Refresh GPS"
          >
            <Navigation className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </button>

          <button
            onClick={handleVoiceSearch}
            aria-label="Voice search"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
            title="Voice search"
          >
            <Mic className={`h-4 w-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} />
          </button>

          <button
            onClick={toggleUnit}
            aria-label="Toggle unit"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
            title="Toggle °C/°F"
          >
            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{isCelsius ? '°C' : '°F'}</span>
          </button>

          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <button
            onClick={handleUserProfile}
            aria-label="User profile"
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
            title="User profile"
          >
            <User className={`h-4 w-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} />
          </button>

          <button
            onClick={handleRefresh}
            aria-label="Refresh all data"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            title="Refresh all data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
         
         @keyframes slide-in-from-top {
           from {
             transform: translateY(-100%);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         @keyframes slide-in-from-bottom {
           from {
             transform: translateY(20px);
             opacity: 0;
           }
           to {
             transform: translateY(0);
             opacity: 1;
           }
         }
         
         .animate-float {
           animation: float 6s ease-in-out infinite;
         }
         
         .animate-in {
           animation-fill-mode: forwards;
         }
         
         .slide-in-from-top {
           animation: slide-in-from-top 0.5s ease-out;
         }
         
         .slide-in-from-bottom {
           animation: slide-in-from-bottom 0.7s ease-out;
         }
         
         /* hide native scrollbars for a cleaner mobile look */
         .overflow-x-auto::-webkit-scrollbar { display: none; }
         .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
 
        /* reset & layout safeguards */
        :global(html), :global(body), :global(#__next) {
          margin: 0;
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          touch-action: pan-y;
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }

        :global(*), :global(*::before), :global(*::after) {
          box-sizing: inherit;
        }

        /* Prevent grid/flex children from pushing their column larger */
        :global(.grid > *), :global(.flex > *), :global(.page-inner > *) {
          min-width: 0;
        }

        /* Ensure images and svgs don't overflow their containers */
        :global(img), :global(svg) {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Smooth transitions for all interactive elements */
        :global(button), :global(a), :global(.card) {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Custom scrollbar for desktop */
        @media (min-width: 1024px) {
          :global(::-webkit-scrollbar) {
            width: 8px;
            height: 8px;
          }
          
          :global(::-webkit-scrollbar-track) {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          
          :global(::-webkit-scrollbar-thumb) {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          
          :global(::-webkit-scrollbar-thumb:hover) {
            background: rgba(0, 0, 0, 0.3);
          }
        }
       `}</style>
     </div>
   )
}