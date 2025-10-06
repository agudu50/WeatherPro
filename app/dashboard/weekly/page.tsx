"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Thermometer, Droplets, Wind, Sun, Cloud, CloudRain } from "lucide-react"

interface DailyWeatherData {
  date: Date
  dayOfWeek: string
  condition: string
  icon: string
  tempHigh: number
  tempLow: number
  humidity: number
  precipitation: number
  precipitationChance: number
  windSpeed: number
  windDirection: string
  uvIndex: number
  sunrise: string
  sunset: string
  moonPhase: string
  description: string
}

interface WeeklyForecastData {
  location: string
  lastUpdated: Date
  forecast: DailyWeatherData[]
}

export default function WeeklyForecastPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [temperatureUnit, setTemperatureUnit] = useState("celsius")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const weatherConditions = [
    { condition: "Sunny", icon: "☀️", description: "Clear skies with plenty of sunshine" },
    { condition: "Partly Cloudy", icon: "⛅", description: "Mix of sun and clouds" },
    { condition: "Cloudy", icon: "☁️", description: "Overcast with gray skies" },
    { condition: "Light Rain", icon: "🌦️", description: "Light showers expected" },
    { condition: "Rain", icon: "🌧️", description: "Steady rainfall throughout the day" },
    { condition: "Thunderstorms", icon: "⛈️", description: "Thunderstorms with heavy rain" }
  ]

  const moonPhases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
  const windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

  const generateWeeklyData = (): WeeklyForecastData => {
    const forecast: DailyWeatherData[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
      const weatherType = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
      
      forecast.push({
        date,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        condition: weatherType.condition,
        icon: weatherType.icon,
        tempHigh: Math.round(18 + Math.random() * 15),
        tempLow: Math.round(8 + Math.random() * 10),
        humidity: Math.round(40 + Math.random() * 40),
        precipitation: Math.random() > 0.6 ? Math.round(Math.random() * 15) : 0,
        precipitationChance: Math.round(Math.random() * 100),
        windSpeed: Math.round(5 + Math.random() * 25),
        windDirection: windDirections[Math.floor(Math.random() * windDirections.length)],
        uvIndex: Math.round(Math.random() * 10),
        sunrise: `${6 + Math.floor(Math.random() * 2)}:${15 + Math.floor(Math.random() * 30)}`,
        sunset: `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60)}`,
        moonPhase: moonPhases[Math.floor(Math.random() * moonPhases.length)],
        description: weatherType.description
      })
    }
    
    return {
      location: "London, UK",
      lastUpdated: new Date(),
      forecast
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setWeeklyData(generateWeeklyData())
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

  const getUVColor = (uvIndex: number) => {
    if (uvIndex <= 2) return "text-green-300"
    if (uvIndex <= 5) return "text-yellow-300"
    if (uvIndex <= 7) return "text-orange-300"
    return "text-red-300"
  }

  const getConditionColor = (condition: string) => {
    switch(condition) {
      case "Sunny": return "bg-yellow-500/20 border-yellow-400/30"
      case "Partly Cloudy": return "bg-blue-500/20 border-blue-400/30"
      case "Cloudy": return "bg-gray-500/20 border-gray-400/30"
      case "Light Rain": return "bg-blue-600/20 border-blue-500/30"
      case "Rain": return "bg-blue-700/20 border-blue-600/30"
      case "Thunderstorms": return "bg-purple-500/20 border-purple-400/30"
      default: return "bg-white/10 border-white/20"
    }
  }

  if (loading || !weeklyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading weekly forecast...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">7-Day Forecast</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTemperatureUnit("celsius")}
              className={`px-3 py-1 rounded ${temperatureUnit === "celsius" ? "bg-white text-blue-900" : "bg-white/20 text-white"}`}
            >
              °C
            </button>
            <button
              onClick={() => setTemperatureUnit("fahrenheit")}
              className={`px-3 py-1 rounded ${temperatureUnit === "fahrenheit" ? "bg-white text-blue-900" : "bg-white/20 text-white"}`}
            >
              °F
            </button>
          </div>
        </div>

        {/* Weekly Overview */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Weekly Overview - {weeklyData.location}</span>
              <Badge className="bg-white/20 text-white">
                Updated: {weeklyData.lastUpdated.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Thermometer className="h-6 w-6 mx-auto mb-2 text-red-300" />
                <div className="text-2xl font-bold text-red-300">
                  {convertTemperature(Math.max(...weeklyData.forecast.map(d => d.tempHigh)))}{getTemperatureUnit()}
                </div>
                <div className="text-sm text-white/80">Highest Temp</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-300" />
                <div className="text-2xl font-bold text-blue-300">
                  {weeklyData.forecast.filter(d => d.precipitation > 0).length}
                </div>
                <div className="text-sm text-white/80">Rainy Days</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Wind className="h-6 w-6 mx-auto mb-2 text-green-300" />
                <div className="text-2xl font-bold text-green-300">
                  {Math.max(...weeklyData.forecast.map(d => d.windSpeed))} km/h
                </div>
                <div className="text-sm text-white/80">Max Wind</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-300" />
                <div className="text-2xl font-bold text-yellow-300">
                  {Math.max(...weeklyData.forecast.map(d => d.uvIndex))}
                </div>
                <div className="text-sm text-white/80">Max UV Index</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Forecast Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {weeklyData.forecast.map((day, index) => (
            <Card 
              key={`day-${index}`}
              className={`bg-white/20 backdrop-blur-lg border-white/30 text-white cursor-pointer transition-all hover:scale-105 ${
                selectedDay === index ? "ring-2 ring-white/50" : ""
              } ${getConditionColor(day.condition)}`}
              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold">{day.dayOfWeek}</div>
                  <div className="text-sm text-white/70">{day.date.toLocaleDateString()}</div>
                  <div className="text-5xl my-3">{day.icon}</div>
                  <div className="text-sm font-medium">{day.condition}</div>
                </div>

                <div className="space-y-3">
                  {/* Temperature Range */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-300" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`font-bold ${getTemperatureColor(day.tempHigh)}`}>
                        {convertTemperature(day.tempHigh)}{getTemperatureUnit()}
                      </span>
                      <span className="text-white/50">|</span>
                      <span className={`${getTemperatureColor(day.tempLow)}`}>
                        {convertTemperature(day.tempLow)}{getTemperatureUnit()}
                      </span>
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-300" />
                      <span className="text-sm">Precipitation</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-300">{day.precipitationChance}%</div>
                      {day.precipitation > 0 && (
                        <div className="text-xs text-white/70">{day.precipitation}mm</div>
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
                      <div className="font-bold text-green-300">{day.windSpeed} km/h</div>
                      <div className="text-xs text-white/70">{day.windDirection}</div>
                    </div>
                  </div>

                  {/* UV Index */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-yellow-300" />
                      <span className="text-sm">UV Index</span>
                    </div>
                    <span className={`font-bold ${getUVColor(day.uvIndex)}`}>
                      {day.uvIndex}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {selectedDay === index && (
                    <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                      <div className="text-sm text-white/90">{day.description}</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-white/70">Sunrise</div>
                          <div className="font-medium">{day.sunrise}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/70">Sunset</div>
                          <div className="font-medium">{day.sunset}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-white/70">Humidity</div>
                          <div className="font-medium">{day.humidity}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/70">Moon Phase</div>
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
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle>Weekly Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Avg High</div>
                <div className="text-xl font-bold text-orange-300">
                  {convertTemperature(Math.round(weeklyData.forecast.reduce((sum, d) => sum + d.tempHigh, 0) / 7))}{getTemperatureUnit()}
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Avg Low</div>
                <div className="text-xl font-bold text-blue-300">
                  {convertTemperature(Math.round(weeklyData.forecast.reduce((sum, d) => sum + d.tempLow, 0) / 7))}{getTemperatureUnit()}
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Total Rainfall</div>
                <div className="text-xl font-bold text-cyan-300">
                  {weeklyData.forecast.reduce((sum, d) => sum + d.precipitation, 0)}mm
                </div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg">
                <div className="text-sm text-white/70 mb-1">Sunny Days</div>
                <div className="text-xl font-bold text-yellow-300">
                  {weeklyData.forecast.filter(d => d.condition === "Sunny").length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}