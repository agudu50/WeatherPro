"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Thermometer, Droplets, Wind, Eye, Gauge } from "lucide-react"

interface HourlyWeatherData {
  time: string
  temperature: number
  feelsLike: number
  humidity: number
  precipitation: number
  precipitationChance: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  uvIndex: number
  cloudCover: number
  condition: string
  icon: string
}

interface HourlyForecastData {
  location: string
  timezone: string
  lastUpdated: Date
  forecast: HourlyWeatherData[]
}

export default function HourlyForecastPage() {
  const [hourlyData, setHourlyData] = useState<HourlyForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedHours, setSelectedHours] = useState(24)
  const [temperatureUnit, setTemperatureUnit] = useState("celsius")

  const weatherConditions = [
    "Sunny", "Partly Cloudy", "Cloudy", "Overcast", "Light Rain", 
    "Rain", "Heavy Rain", "Thunderstorm", "Snow", "Fog"
  ]

  const generateHourlyData = (): HourlyForecastData => {
    const forecast: HourlyWeatherData[] = []
    
    for (let i = 0; i < 48; i++) {
      const hour = new Date(Date.now() + i * 60 * 60 * 1000)
      const hourOfDay = hour.getHours()
      
      // Temperature varies by time of day
      const baseTemp = 18
      const tempVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 8
      const temperature = Math.round(baseTemp + tempVariation + Math.random() * 4 - 2)
      
      forecast.push({
        time: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temperature,
        feelsLike: temperature + Math.round(Math.random() * 4 - 2),
        humidity: Math.round(50 + Math.random() * 40),
        precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 5) : 0,
        precipitationChance: Math.round(Math.random() * 100),
        windSpeed: Math.round(5 + Math.random() * 20),
        windDirection: Math.round(Math.random() * 360),
        pressure: Math.round(1010 + Math.random() * 20 - 10),
        visibility: Math.round(8 + Math.random() * 7),
        uvIndex: hourOfDay > 6 && hourOfDay < 19 ? Math.round(Math.random() * 10) : 0,
        cloudCover: Math.round(Math.random() * 100),
        condition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
        icon: "☀️"
      })
    }
    
    return {
      location: "London, UK",
      timezone: "GMT",
      lastUpdated: new Date(),
      forecast
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setHourlyData(generateHourlyData())
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const convertTemperature = (temp: number) => {
    if (temperatureUnit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  const getTemperatureUnit = () => {
    return temperatureUnit === "fahrenheit" ? "°F" : "°C"
  }

  const getTemperatureColor = (temp: number) => {
    if (temp <= 0) return "text-blue-300"
    if (temp <= 10) return "text-blue-200"
    if (temp <= 20) return "text-green-300"
    if (temp <= 30) return "text-yellow-300"
    return "text-red-300"
  }

  const getPrecipitationColor = (chance: number) => {
    if (chance <= 25) return "text-green-300"
    if (chance <= 50) return "text-yellow-300"
    if (chance <= 75) return "text-orange-300"
    return "text-blue-300"
  }

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return directions[Math.round(degrees / 22.5) % 16]
  }

  if (loading || !hourlyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading hourly forecast...</p>
        </div>
      </div>
    )
  }

  const displayedForecast = hourlyData.forecast.slice(0, selectedHours)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Hourly Forecast</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setTemperatureUnit("celsius")}
              variant={temperatureUnit === "celsius" ? "secondary" : "outline"}
              className={temperatureUnit === "celsius" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              °C
            </Button>
            <Button
              onClick={() => setTemperatureUnit("fahrenheit")}
              variant={temperatureUnit === "fahrenheit" ? "secondary" : "outline"}
              className={temperatureUnit === "fahrenheit" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              °F
            </Button>
          </div>
        </div>

        {/* Forecast Summary */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Forecast for {hourlyData.location}</span>
              <Badge className="bg-white/20 text-white">
                Last updated: {hourlyData.lastUpdated.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-300" />
                <div className="text-2xl font-bold text-orange-300">
                  {convertTemperature(Math.max(...displayedForecast.map(h => h.temperature)))}{getTemperatureUnit()}
                </div>
                <div className="text-sm text-white/80">High Today</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-300" />
                <div className="text-2xl font-bold text-blue-300">
                  {Math.max(...displayedForecast.map(h => h.precipitationChance))}%
                </div>
                <div className="text-sm text-white/80">Max Rain Chance</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Wind className="h-6 w-6 mx-auto mb-2 text-green-300" />
                <div className="text-2xl font-bold text-green-300">
                  {Math.max(...displayedForecast.map(h => h.windSpeed))} km/h
                </div>
                <div className="text-sm text-white/80">Max Wind Speed</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Eye className="h-6 w-6 mx-auto mb-2 text-purple-300" />
                <div className="text-2xl font-bold text-purple-300">
                  {Math.min(...displayedForecast.map(h => h.visibility))} km
                </div>
                <div className="text-sm text-white/80">Min Visibility</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Range Selection */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {[12, 24, 48].map((hours) => (
                <Button
                  key={hours}
                  onClick={() => setSelectedHours(hours)}
                  variant={selectedHours === hours ? "secondary" : "outline"}
                  className={
                    selectedHours === hours 
                      ? "bg-white text-blue-900" 
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  }
                >
                  {hours} Hours
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedForecast.map((hour, index) => (
            <Card key={`hour-${index}`} className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold mb-1">{hour.time}</div>
                  <div className="text-sm text-white/70">{hour.condition}</div>
                  <div className="text-3xl my-2">{hour.icon}</div>
                </div>

                <div className="space-y-3">
                  {/* Temperature */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-300" />
                      <span className="text-sm">Temp</span>
                    </div>
                    <span className={`font-bold ${getTemperatureColor(hour.temperature)}`}>
                      {convertTemperature(hour.temperature)}{getTemperatureUnit()}
                    </span>
                  </div>

                  {/* Feels Like */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Feels like</span>
                    <span className="text-sm">
                      {convertTemperature(hour.feelsLike)}{getTemperatureUnit()}
                    </span>
                  </div>

                  {/* Precipitation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-300" />
                      <span className="text-sm">Rain</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getPrecipitationColor(hour.precipitationChance)}`}>
                        {hour.precipitationChance}%
                      </div>
                      {hour.precipitation > 0 && (
                        <div className="text-xs text-white/70">{hour.precipitation}mm</div>
                      )}
                    </div>
                  </div>

                  {/* Wind */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-green-300" />
                      <span className="text-sm">Wind</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-300">{hour.windSpeed} km/h</div>
                      <div className="text-xs text-white/70">{getWindDirection(hour.windDirection)}</div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-xs text-white/70">Humidity</div>
                      <div className="text-sm font-bold">{hour.humidity}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/70">Pressure</div>
                      <div className="text-sm font-bold">{hour.pressure} hPa</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-white/70">UV Index</div>
                      <div className="text-sm font-bold">{hour.uvIndex}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/70">Visibility</div>
                      <div className="text-sm font-bold">{hour.visibility} km</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Summary */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              {selectedHours}-Hour Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Avg Temperature</div>
                <div className="text-xl font-bold text-yellow-300">
                  {convertTemperature(Math.round(displayedForecast.reduce((sum, h) => sum + h.temperature, 0) / displayedForecast.length))}{getTemperatureUnit()}
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Avg Humidity</div>
                <div className="text-xl font-bold text-blue-300">
                  {Math.round(displayedForecast.reduce((sum, h) => sum + h.humidity, 0) / displayedForecast.length)}%
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Avg Wind</div>
                <div className="text-xl font-bold text-green-300">
                  {Math.round(displayedForecast.reduce((sum, h) => sum + h.windSpeed, 0) / displayedForecast.length)} km/h
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Rain Hours</div>
                <div className="text-xl font-bold text-purple-300">
                  {displayedForecast.filter(h => h.precipitation > 0).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}