"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Cloud,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Gauge,
  Navigation,
  Activity,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  Umbrella,
  AlertTriangle
} from "lucide-react"

interface WeatherData {
  city: string
  country: string
  temperature: number
  feelsLike: number
  description: string
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  uvIndex: number
  sunrise: number
  sunset: number
  icon: string
  coord: {
    lat: number
    lon: number
  }
}

interface WeatherAlert {
  event: string
  description: string
  severity: string
}

interface HourlyForecast {
  time: string
  temperature: number
  icon: string
  description: string
  precipitation: number
}

interface AirQualityData {
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
}

export default function WeatherDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const API_KEY = "ca695dcbc66c5fa3d0cb955033fd918f"

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setError(null)
      
      // Current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )
      
      // Hourly forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      )

      // Air quality
      const airQualityResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      )
      
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json()
        
        setWeather({
          city: weatherData.name,
          country: weatherData.sys.country,
          temperature: Math.round(weatherData.main.temp),
          feelsLike: Math.round(weatherData.main.feels_like),
          description: weatherData.weather[0].description,
          condition: weatherData.weather[0].main,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6),
          pressure: weatherData.main.pressure,
          visibility: Math.round((weatherData.visibility || 10000) / 1000),
          uvIndex: 0, // UV data requires a separate API call
          sunrise: weatherData.sys.sunrise,
          sunset: weatherData.sys.sunset,
          icon: weatherData.weather[0].icon,
          coord: {
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
          }
        })
      } else {
        throw new Error('Failed to fetch weather data')
      }

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        const hourlyData = forecastData.list.slice(0, 8).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
          }),
          temperature: Math.round(item.main.temp),
          icon: item.weather[0].icon,
          description: item.weather[0].description,
          precipitation: Math.round((item.pop || 0) * 100)
        }))
        setHourlyForecast(hourlyData)
      }

      if (airQualityResponse.ok) {
        const airData = await airQualityResponse.json()
        setAirQuality(airData.list[0])
      }

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setError('Failed to fetch weather data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherByCity = async (city: string) => {
    try {
      setError(null)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      )
      
      if (response.ok) {
        const data = await response.json()
        await fetchWeatherData(data.coord.lat, data.coord.lon)
      } else {
        throw new Error('City not found')
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setError('City not found. Please try a different location.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Try to get user's location first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude: lat, longitude: lon } = position.coords
              await fetchWeatherData(lat, lon)
            },
            async () => {
              // If geolocation fails, fetch weather for London as default
              await fetchWeatherByCity('London')
            }
          )
        } else {
          // If geolocation is not supported, fetch weather for London
          await fetchWeatherByCity('London')
        }
      } catch (error) {
        console.error("Weather fetch error:", error)
        setError('Failed to load weather data')
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCity.trim()) {
      setLoading(true)
      await fetchWeatherByCity(searchCity.trim())
      setSearchCity("")
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lon } = position.coords
          await fetchWeatherData(lat, lon)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError('Unable to get your location')
          setLoading(false)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  const refreshWeather = async () => {
    if (weather) {
      setLoading(true)
      await fetchWeatherData(weather.coord.lat, weather.coord.lon)
    }
  }

  const getAirQualityStatus = (aqi: number) => {
    if (aqi <= 1) return { label: "Good", color: "bg-green-500", textColor: "text-green-800" }
    if (aqi <= 2) return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-800" }
    if (aqi <= 3) return { label: "Moderate", color: "bg-orange-500", textColor: "text-orange-800" }
    if (aqi <= 4) return { label: "Poor", color: "bg-red-500", textColor: "text-red-800" }
    return { label: "Very Poor", color: "bg-purple-500", textColor: "text-purple-800" }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getConditionIcon = (condition: string) => {
    switch(condition.toLowerCase()) {
      case "clear": return "☀️"
      case "clouds": return "☁️"
      case "rain": return "🌧️"
      case "drizzle": return "🌦️"
      case "thunderstorm": return "⛈️"
      case "snow": return "❄️"
      case "mist": 
      case "fog": return "🌫️"
      default: return "🌤️"
    }
  }

  // Navigation items array
  const navigationItems = [
    { href: "/dashboard/hourly", icon: Clock, label: "Hourly", color: "text-blue-300" },
    { href: "/dashboard/weekly", icon: Calendar, label: "Weekly", color: "text-green-300" },
    { href: "/dashboard/precipitation", icon: Umbrella, label: "Rain", color: "text-blue-400" },
    { href: "/dashboard/temperature", icon: Thermometer, label: "Temperature", color: "text-red-300" },
    { href: "/dashboard/uv-index", icon: Sun, label: "UV Index", color: "text-yellow-300" },
    { href: "/dashboard/air-quality", icon: Activity, label: "Air Quality", color: "text-purple-300" }
  ]

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading weather data...</p>
        </div>
      </div>
    )
  }

  if (error && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-300" />
          <p className="text-xl mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Weather Dashboard</h1>
            <p className="text-blue-100">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          
          {/* Search and Actions */}
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search city..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
              <Button type="submit" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Button onClick={getCurrentLocation} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" disabled={loading}>
              <MapPin className="h-4 w-4" />
            </Button>
            <Button onClick={refreshWeather} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/20 backdrop-blur-lg border-red-400/30 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-300" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {weather && (
          <>
            {/* Current Weather Hero Section */}
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  {/* Main Weather Info */}
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                      <div className="text-8xl">
                        {getConditionIcon(weather.condition)}
                      </div>
                      <div>
                        <div className="text-6xl font-bold">{weather.temperature}°C</div>
                        <div className="text-blue-100">Feels like {weather.feelsLike}°C</div>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{weather.city}, {weather.country}</h2>
                    <p className="text-xl text-blue-100 capitalize mb-4">{weather.description}</p>
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{weather.coord.lat.toFixed(2)}, {weather.coord.lon.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Weather Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/humidity">
                      <div className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer">
                        <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                        <div className="text-2xl font-bold">{weather.humidity}%</div>
                        <div className="text-sm text-blue-200">Humidity</div>
                      </div>
                    </Link>
                    
                    <Link href="/dashboard/wind">
                      <div className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer">
                        <Wind className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                        <div className="text-2xl font-bold">{weather.windSpeed}</div>
                        <div className="text-sm text-blue-200">km/h</div>
                      </div>
                    </Link>

                    <Link href="/dashboard/pressure">
                      <div className="bg-white/10 rounded-lg p-4 text-center hover:bg-white/20 transition-colors cursor-pointer">
                        <Gauge className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                        <div className="text-2xl font-bold">{weather.pressure}</div>
                        <div className="text-sm text-blue-200">hPa</div>
                      </div>
                    </Link>

                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                      <div className="text-2xl font-bold">{weather.visibility}</div>
                      <div className="text-sm text-blue-200">km</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white hover:bg-white/30 transition-colors cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                      <div className="font-medium text-sm">{item.label}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Sun & Moon Info + Air Quality */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sunrise */}
              <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
                <CardContent className="p-6 text-center">
                  <Sunrise className="h-8 w-8 mx-auto mb-3 text-yellow-300" />
                  <div className="text-2xl font-bold mb-1">{formatTime(weather.sunrise)}</div>
                  <div className="text-blue-200">Sunrise</div>
                </CardContent>
              </Card>

              {/* Sunset */}
              <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
                <CardContent className="p-6 text-center">
                  <Sunset className="h-8 w-8 mx-auto mb-3 text-orange-300" />
                  <div className="text-2xl font-bold mb-1">{formatTime(weather.sunset)}</div>
                  <div className="text-blue-200">Sunset</div>
                </CardContent>
              </Card>

              {/* Air Quality */}
              {airQuality && (
                <Link href="/dashboard/air-quality">
                  <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white hover:bg-white/30 transition-colors cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-8 w-8 mx-auto mb-3 text-green-300" />
                      <div className="text-2xl font-bold mb-1">{airQuality.main.aqi}</div>
                      <Badge className={`${getAirQualityStatus(airQuality.main.aqi).color} text-white`}>
                        {getAirQualityStatus(airQuality.main.aqi).label}
                      </Badge>
                      <div className="text-sm text-blue-200 mt-1">Air Quality</div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Hourly Forecast */}
            {hourlyForecast.length > 0 && (
              <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today&apos;s Hourly Forecast
                  </CardTitle>
                  <Link href="/dashboard/hourly">
                    <Button className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {hourlyForecast.map((hour, index) => (
                      <div key={`hourly-${index}`} className="text-center p-3 bg-white/10 rounded-lg">
                        <div className="text-sm text-blue-200 mb-2">{hour.time}</div>
                        <div className="text-3xl mb-2">{getConditionIcon(hour.description)}</div>
                        <div className="font-bold text-lg">{hour.temperature}°</div>
                        <div className="text-xs text-blue-300">{hour.precipitation}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Alerts */}
            {alerts.length > 0 && (
              <Card className="bg-red-500/20 backdrop-blur-lg border-red-400/30 text-white">
                <CardHeader>
                  <CardTitle className="text-red-200 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Weather Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.map((alert, index) => (
                    <div key={`alert-${index}`} className="mb-4 last:mb-0">
                      <Badge className="bg-red-500 text-white mb-2">{alert.severity}</Badge>
                      <h4 className="font-semibold mb-1">{alert.event}</h4>
                      <p className="text-sm text-red-100">{alert.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}