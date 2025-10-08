"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  AlertTriangle, 
  Bell, 
  Clock, 
  MapPin, 
  Info, 
  X, 
  Filter,
  Sun,
  Moon,
  Search,
  Target,
  RefreshCw,
  Loader2,
  CloudRain,
  Wind,
  Snowflake,
  Zap,
  CloudFog,
  Thermometer
} from "lucide-react"

interface WeatherAlert {
  id: string
  type: "warning" | "watch" | "advisory"
  severity: "extreme" | "severe" | "moderate" | "minor"
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  issued: Date
  dismissed: boolean
  urgent: boolean
  event: string
  sender: string
  tags: string[]
}

interface AlertsData {
  alerts: WeatherAlert[]
  summary: {
    total: number
    urgent: number
    active: number
  }
  location: string
  country: string
}

export default function WeatherAlertsPage() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [showDismissed, setShowDismissed] = useState(false)
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const fetchWeatherAlerts = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      // Fetch location name
      const locationResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      )
      
      if (!locationResponse.ok) throw new Error('Failed to fetch location')
      const locationData = await locationResponse.json()

      // Fetch current weather to generate alerts based on conditions
      const currentWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!currentWeatherResponse.ok) throw new Error('Failed to fetch current weather')
      const currentWeather = await currentWeatherResponse.json()

      // Fetch forecast for upcoming conditions
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Try to fetch actual alerts from One Call API
      let actualAlerts: any[] = []
      try {
        const oneCallResponse = await fetch(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        )
        if (oneCallResponse.ok) {
          const oneCallData = await oneCallResponse.json()
          actualAlerts = oneCallData.alerts || []
        }
      } catch (error) {
        console.log('One Call API not available, generating alerts from weather data')
      }

      // Generate alerts based on weather conditions
      const generatedAlerts: WeatherAlert[] = []
      let alertId = 1

      // Check current weather conditions
      const temp = currentWeather.main.temp
      const windSpeed = currentWeather.wind.speed * 3.6 // Convert to km/h
      const visibility = currentWeather.visibility / 1000 // Convert to km
      const weatherMain = currentWeather.weather[0].main.toLowerCase()
      const weatherDesc = currentWeather.weather[0].description

      // Temperature alerts
      if (temp > 35) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "warning",
          severity: "severe",
          title: "Extreme Heat Warning",
          description: `Dangerous heat conditions with temperatures reaching ${Math.round(temp)}°C. Heat exhaustion and heat stroke are possible. Stay hydrated and avoid prolonged outdoor exposure.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: true,
          event: "Extreme Heat",
          sender: "Weather Service",
          tags: ["heat", "health"]
        })
      } else if (temp < -10) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "warning",
          severity: "severe",
          title: "Extreme Cold Warning",
          description: `Dangerously cold temperatures of ${Math.round(temp)}°C. Frostbite and hypothermia possible with prolonged exposure. Dress warmly in layers.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: true,
          event: "Extreme Cold",
          sender: "Weather Service",
          tags: ["cold", "health"]
        })
      }

      // Wind alerts
      if (windSpeed > 50) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "warning",
          severity: "severe",
          title: "High Wind Warning",
          description: `Dangerous winds up to ${Math.round(windSpeed)} km/h. Secure loose objects, avoid travel if possible, and stay away from trees and power lines.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: true,
          event: "High Wind",
          sender: "Weather Service",
          tags: ["wind", "safety"]
        })
      } else if (windSpeed > 30) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "watch",
          severity: "moderate",
          title: "Wind Advisory",
          description: `Strong winds up to ${Math.round(windSpeed)} km/h expected. Secure loose objects and use caution when driving, especially in high-profile vehicles.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: false,
          event: "Wind",
          sender: "Weather Service",
          tags: ["wind"]
        })
      }

      // Visibility alerts
      if (visibility < 1) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "advisory",
          severity: "moderate",
          title: "Dense Fog Advisory",
          description: `Very low visibility of ${visibility.toFixed(1)} km due to dense fog. Reduce speed, use low-beam headlights, and allow extra travel time.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: false,
          event: "Dense Fog",
          sender: "Weather Service",
          tags: ["fog", "visibility"]
        })
      }

      // Weather condition alerts
      if (weatherMain === 'thunderstorm') {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "warning",
          severity: "severe",
          title: "Severe Thunderstorm Warning",
          description: `Severe thunderstorms in the area with ${weatherDesc}. Seek shelter immediately. Avoid open areas and stay away from windows.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: true,
          event: "Thunderstorm",
          sender: "Weather Service",
          tags: ["thunderstorm", "lightning", "safety"]
        })
      } else if (weatherMain === 'rain' && currentWeather.rain?.['1h'] > 10) {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "warning",
          severity: "moderate",
          title: "Heavy Rain Warning",
          description: `Heavy rainfall with ${weatherDesc}. Potential for localized flooding in low-lying areas. Avoid driving through flooded roads.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: false,
          event: "Heavy Rain",
          sender: "Weather Service",
          tags: ["rain", "flooding"]
        })
      } else if (weatherMain === 'snow') {
        generatedAlerts.push({
          id: `alert-${alertId++}`,
          type: "watch",
          severity: "moderate",
          title: "Winter Weather Advisory",
          description: `Snowfall with ${weatherDesc}. Expect slippery road conditions. Reduce speed and allow extra travel time.`,
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: false,
          event: "Snow",
          sender: "Weather Service",
          tags: ["snow", "winter"]
        })
      }

      // Check forecast for upcoming conditions
      forecastData.list.slice(0, 8).forEach((forecast: any) => {
        const forecastTemp = forecast.main.temp
        const forecastWind = forecast.wind.speed * 3.6
        const forecastWeather = forecast.weather[0].main.toLowerCase()
        
        if (forecastTemp > 38 && !generatedAlerts.some(a => a.event === "Extreme Heat")) {
          generatedAlerts.push({
            id: `alert-${alertId++}`,
            type: "watch",
            severity: "severe",
            title: "Heat Watch",
            description: `Extreme heat expected with temperatures reaching ${Math.round(forecastTemp)}°C. Heat-related illnesses possible. Plan ahead and stay hydrated.`,
            location: locationData.name,
            startTime: new Date(forecast.dt * 1000),
            endTime: new Date(forecast.dt * 1000 + 12 * 60 * 60 * 1000),
            issued: new Date(),
            dismissed: false,
            urgent: false,
            event: "Heat Watch",
            sender: "Weather Service",
            tags: ["heat", "forecast"]
          })
        }

        if (forecastWind > 60 && !generatedAlerts.some(a => a.event === "High Wind")) {
          generatedAlerts.push({
            id: `alert-${alertId++}`,
            type: "watch",
            severity: "severe",
            title: "High Wind Watch",
            description: `Very strong winds up to ${Math.round(forecastWind)} km/h expected. Potential for downed trees and power outages.`,
            location: locationData.name,
            startTime: new Date(forecast.dt * 1000),
            endTime: new Date(forecast.dt * 1000 + 6 * 60 * 60 * 1000),
            issued: new Date(),
            dismissed: false,
            urgent: false,
            event: "High Wind Watch",
            sender: "Weather Service",
            tags: ["wind", "forecast"]
          })
        }
      })

      // Process actual alerts from One Call API if available
      actualAlerts.forEach((alert: any) => {
        const severity = 
          alert.tags?.includes('Extreme') ? 'extreme' :
          alert.tags?.includes('Severe') ? 'severe' :
          alert.tags?.includes('Moderate') ? 'moderate' : 'minor'
        
        const type = 
          alert.event?.toLowerCase().includes('warning') ? 'warning' :
          alert.event?.toLowerCase().includes('watch') ? 'watch' : 'advisory'

        generatedAlerts.push({
          id: `api-alert-${alertId++}`,
          type,
          severity,
          title: alert.event || 'Weather Alert',
          description: alert.description || 'Weather conditions require attention.',
          location: locationData.name,
          startTime: new Date(alert.start * 1000),
          endTime: new Date(alert.end * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: severity === 'extreme' || severity === 'severe',
          event: alert.event,
          sender: alert.sender_name || 'Weather Service',
          tags: alert.tags || []
        })
      })

      // If no alerts, create a placeholder
      if (generatedAlerts.length === 0) {
        generatedAlerts.push({
          id: 'no-alerts',
          type: 'advisory',
          severity: 'minor',
          title: 'No Active Alerts',
          description: 'Weather conditions are currently normal for your area. Continue to monitor for updates.',
          location: locationData.name,
          startTime: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          issued: new Date(),
          dismissed: false,
          urgent: false,
          event: 'All Clear',
          sender: 'Weather Service',
          tags: ['normal']
        })
      }

      // Apply dismissed status from local state
      const alertsWithDismissed = generatedAlerts.map(alert => ({
        ...alert,
        dismissed: dismissedAlerts.has(alert.id)
      }))

      const activeAlerts = alertsWithDismissed.filter(a => !a.dismissed)
      const urgentAlerts = activeAlerts.filter(a => a.urgent)

      setAlertsData({
        alerts: alertsWithDismissed,
        summary: {
          total: alertsWithDismissed.length,
          urgent: urgentAlerts.length,
          active: activeAlerts.length
        },
        location: locationData.name,
        country: locationData.sys.country
      })

      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching weather alerts:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      fetchWeatherAlerts(51.5074, -0.1278) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        fetchWeatherAlerts(latitude, longitude)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        fetchWeatherAlerts(51.5074, -0.1278) // Fallback to London
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
      await fetchWeatherAlerts(data.coord.lat, data.coord.lon)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("weatherAlertsDarkMode")
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true")
    }

    // Load dismissed alerts
    const savedDismissed = localStorage.getItem("dismissedWeatherAlerts")
    if (savedDismissed) {
      setDismissedAlerts(new Set(JSON.parse(savedDismissed)))
    }

    // Get user location
    getUserLocation()
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("weatherAlertsDarkMode", String(newDarkMode))
  }

  const alertTypes = [
    { id: "all", name: "All Alerts" },
    { id: "warning", name: "Warnings" },
    { id: "watch", name: "Watches" },
    { id: "advisory", name: "Advisories" }
  ]

  const getSeverityColor = (severity: WeatherAlert['severity'], dark: boolean) => {
    if (severity === 'extreme') return {
      bg: dark ? "bg-red-500/20 border-red-400/30" : "bg-red-100 border-red-300",
      text: dark ? "text-red-300" : "text-red-800",
      badge: "bg-red-600"
    }
    if (severity === 'severe') return {
      bg: dark ? "bg-orange-500/20 border-orange-400/30" : "bg-orange-100 border-orange-300",
      text: dark ? "text-orange-300" : "text-orange-800",
      badge: "bg-orange-500"
    }
    if (severity === 'moderate') return {
      bg: dark ? "bg-yellow-500/20 border-yellow-400/30" : "bg-yellow-100 border-yellow-300",
      text: dark ? "text-yellow-300" : "text-yellow-800",
      badge: "bg-yellow-500"
    }
    return {
      bg: dark ? "bg-blue-500/20 border-blue-400/30" : "bg-blue-100 border-blue-300",
      text: dark ? "text-blue-300" : "text-blue-800",
      badge: "bg-blue-500"
    }
  }

  const getTypeIcon = (type: WeatherAlert['type']) => {
    switch(type) {
      case "warning": return <AlertTriangle className="h-5 w-5" />
      case "watch": return <Clock className="h-5 w-5" />
      case "advisory": return <Info className="h-5 w-5" />
    }
  }

  const getEventIcon = (event: string) => {
    const eventLower = event.toLowerCase()
    if (eventLower.includes('rain') || eventLower.includes('flood')) return <CloudRain className="h-5 w-5" />
    if (eventLower.includes('wind')) return <Wind className="h-5 w-5" />
    if (eventLower.includes('snow') || eventLower.includes('winter')) return <Snowflake className="h-5 w-5" />
    if (eventLower.includes('thunder') || eventLower.includes('storm')) return <Zap className="h-5 w-5" />
    if (eventLower.includes('fog')) return <CloudFog className="h-5 w-5" />
    if (eventLower.includes('heat') || eventLower.includes('cold')) return <Thermometer className="h-5 w-5" />
    return <AlertTriangle className="h-5 w-5" />
  }

  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts)
    newDismissed.add(alertId)
    setDismissedAlerts(newDismissed)
    localStorage.setItem("dismissedWeatherAlerts", JSON.stringify(Array.from(newDismissed)))
    
    if (alertsData) {
      const updatedAlerts = alertsData.alerts.map(alert => 
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
      
      const activeAlerts = updatedAlerts.filter(a => !a.dismissed)
      const urgentAlerts = activeAlerts.filter(a => a.urgent)

      setAlertsData({
        ...alertsData,
        alerts: updatedAlerts,
        summary: {
          ...alertsData.summary,
          active: activeAlerts.length,
          urgent: urgentAlerts.length
        }
      })
    }
  }

  if (loading && !alertsData) {
    return (
      <div className={`min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-red-900 to-orange-950' 
          : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
      } p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 ${
            isDarkMode ? 'text-white' : 'text-red-600'
          } animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading weather alerts...
          </p>
        </div>
      </div>
    )
  }

  if (!alertsData) return null

  const filteredAlerts = alertsData.alerts.filter(alert => {
    const typeMatch = filterType === "all" || alert.type === filterType
    const dismissMatch = showDismissed || !alert.dismissed
    return typeMatch && dismissMatch
  })

  const activeAlerts = alertsData.alerts.filter(alert => !alert.dismissed)
  const urgentAlerts = activeAlerts.filter(alert => alert.urgent)

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-red-900 to-orange-950' 
        : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
    } p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isDarkMode 
                ? 'bg-gradient-to-r from-red-500 to-orange-600' 
                : 'bg-gradient-to-r from-red-400 to-orange-500'
            }`}>
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Weather Alerts
              </h1>
              <div className={`flex items-center gap-2 mt-1 text-sm ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                <MapPin className="h-4 w-4 text-red-500" />
                <span>{alertsData.location}, {alertsData.country}</span>
                {locationStatus === 'success' && (
                  <Badge className={`${
                    isDarkMode 
                      ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                      : 'bg-red-100 text-red-700 border-red-300'
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
              <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <Button
              onClick={getUserLocation}
              size="icon"
              className="bg-orange-600 hover:bg-orange-700"
              title="Use My Location"
            >
              <Target className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => currentLocation && fetchWeatherAlerts(currentLocation.lat, currentLocation.lon)}
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
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-red-500/20 border-red-400/30' : 'bg-red-100 border-red-300'
              }`}>
                <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-red-300' : 'text-red-600'
                }`}>{urgentAlerts.length}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Urgent Alerts</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-orange-500/20 border-orange-400/30' : 'bg-orange-100 border-orange-300'
              }`}>
                <Bell className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-600'
                }`}>
                  {alertsData.alerts.filter(a => !a.dismissed && a.severity === "severe").length}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Severe Warnings</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-yellow-100 border-yellow-300'
              }`}>
                <Clock className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {alertsData.alerts.filter(a => !a.dismissed && a.type === "watch").length}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Active Watches</div>
              </div>
              <div className={`text-center p-4 rounded-lg border ${
                isDarkMode ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-100 border-blue-300'
              }`}>
                <Info className={`h-6 w-6 mx-auto mb-2 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`} />
                <div className={`text-3xl font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {alertsData.alerts.filter(a => !a.dismissed && a.type === "advisory").length}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-gray-600'
                }`}>Advisories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Controls */}
        <Card className={`${
          isDarkMode 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        } backdrop-blur-lg`}>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium mr-2">Filter:</span>
              {alertTypes.map((type) => (
                <Button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  variant={filterType === type.id ? "secondary" : "outline"}
                  size="sm"
                  className={
                    filterType === type.id 
                      ? isDarkMode 
                        ? "bg-white text-slate-900" 
                        : "bg-gray-900 text-white"
                      : isDarkMode
                        ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                  }
                >
                  {type.name}
                </Button>
              ))}
              <Button
                onClick={() => setShowDismissed(!showDismissed)}
                variant="outline"
                size="sm"
                className={isDarkMode
                  ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                }
              >
                {showDismissed ? "Hide Dismissed" : "Show Dismissed"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className={`${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            } backdrop-blur-lg`}>
              <CardContent className="p-8 text-center">
                <Bell className={`h-16 w-16 mx-auto mb-4 ${
                  isDarkMode ? 'text-white/50' : 'text-gray-400'
                }`} />
                <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
                <p className={isDarkMode ? 'text-white/70' : 'text-gray-600'}>
                  There are currently no weather alerts for your area.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const severityColors = getSeverityColor(alert.severity, isDarkMode)
              const typeIcon = getTypeIcon(alert.type)
              const eventIcon = getEventIcon(alert.event)
              
              return (
                <Card 
                  key={alert.id}
                  className={`${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } backdrop-blur-lg ${
                    alert.urgent && !alert.dismissed ? "ring-2 ring-red-500 ring-opacity-50" : ""
                  } ${alert.dismissed ? "opacity-60" : ""} transition-all duration-300`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full border ${severityColors.bg}`}>
                          {eventIcon}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            <Badge className={`${severityColors.badge} text-white capitalize`}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline" className={`capitalize ${
                              isDarkMode ? 'border-white/30' : 'border-gray-300'
                            }`}>
                              {alert.type}
                            </Badge>
                            {alert.urgent && !alert.dismissed && (
                              <Badge className="bg-red-600 text-white animate-pulse">
                                URGENT
                              </Badge>
                            )}
                            {alert.dismissed && (
                              <Badge className="bg-gray-500 text-white">
                                Dismissed
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className={`flex items-center gap-1 ${
                              isDarkMode ? 'text-white/70' : 'text-gray-600'
                            }`}>
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </div>
                            <div className={`flex items-center gap-1 ${
                              isDarkMode ? 'text-white/70' : 'text-gray-600'
                            }`}>
                              <Clock className="h-3 w-3" />
                              Issued {alert.issued.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <div className={`flex items-center gap-1 ${
                              isDarkMode ? 'text-white/70' : 'text-gray-600'
                            }`}>
                              <Info className="h-3 w-3" />
                              {alert.sender}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!alert.dismissed && alert.id !== 'no-alerts' && (
                        <Button
                          onClick={() => dismissAlert(alert.id)}
                          variant="outline"
                          size="sm"
                          className={isDarkMode
                            ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                            : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
                          }
                          title="Dismiss Alert"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className={`mb-4 ${
                      isDarkMode ? 'text-white/90' : 'text-gray-700'
                    }`}>{alert.description}</p>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <div className="text-sm font-medium mb-1">Valid From:</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>
                          {alert.startTime.toLocaleDateString()} at {alert.startTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Valid Until:</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-white/70' : 'text-gray-600'
                        }`}>
                          {alert.endTime.toLocaleDateString()} at {alert.endTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>

                    {alert.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {alert.tags.map((tag, index) => (
                          <Badge 
                            key={`tag-${index}`} 
                            variant="outline"
                            className={`text-xs ${
                              isDarkMode ? 'border-white/30' : 'border-gray-300'
                            }`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {alert.urgent && !alert.dismissed && (
                      <div className={`mt-4 p-3 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-red-500/20 border-red-400/30' 
                          : 'bg-red-100 border-red-300'
                      }`}>
                        <div className={`flex items-center gap-2 ${
                          isDarkMode ? 'text-red-300' : 'text-red-700'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Immediate Action Required</span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          isDarkMode ? 'text-white/90' : 'text-red-600'
                        }`}>
                          This is an urgent weather alert. Take appropriate safety measures immediately.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}