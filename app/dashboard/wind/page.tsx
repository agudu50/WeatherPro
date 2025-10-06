"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wind, Navigation, Activity, TrendingUp, AlertTriangle } from "lucide-react"

interface WindData {
  current: {
    speed: number
    direction: number
    gust: number
    location: string
    beaufortScale: number
  }
  hourly: Array<{
    time: string
    speed: number
    direction: number
    gust: number
  }>
  daily: Array<{
    day: string
    avgSpeed: number
    maxSpeed: number
    direction: string
    gustMax: number
  }>
  alerts: Array<{
    type: string
    message: string
    severity: string
  }>
}

export default function WindPage() {
  const [windData, setWindData] = useState<WindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState("kmh")

  const sampleWindData: WindData = {
    current: {
      speed: 18,
      direction: 225,
      gust: 32,
      location: "London, UK",
      beaufortScale: 4
    },
    hourly: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
      speed: Math.round(10 + Math.sin(i * 0.3) * 15 + Math.random() * 8),
      direction: Math.round(180 + Math.sin(i * 0.2) * 90),
      gust: Math.round(15 + Math.sin(i * 0.3) * 20 + Math.random() * 10)
    })),
    daily: Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      avgSpeed: Math.round(12 + Math.random() * 15),
      maxSpeed: Math.round(25 + Math.random() * 20),
      direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
      gustMax: Math.round(30 + Math.random() * 25)
    })),
    alerts: [
      {
        type: "Wind Advisory",
        message: "Strong winds expected with gusts up to 45 km/h",
        severity: "moderate"
      }
    ]
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setWindData(sampleWindData)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const convertSpeed = (speed: number) => {
    if (unit === "mph") return Math.round(speed * 0.621371)
    if (unit === "ms") return Math.round(speed * 0.277778)
    return speed
  }

  const getSpeedUnit = () => {
    if (unit === "mph") return "mph"
    if (unit === "ms") return "m/s"
    return "km/h"
  }

  const getDirectionName = (degrees: number) => {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    return directions[Math.round(degrees / 22.5) % 16]
  }

  const getBeaufortDescription = (scale: number) => {
    const descriptions = [
      "Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze",
      "Fresh breeze", "Strong breeze", "Near gale", "Gale", "Strong gale",
      "Storm", "Violent storm", "Hurricane"
    ]
    return descriptions[Math.min(scale, 12)]
  }

  const getWindColor = (speed: number) => {
    if (speed < 10) return "text-green-300"
    if (speed < 20) return "text-yellow-300"
    if (speed < 40) return "text-orange-300"
    return "text-red-300"
  }

  const getWindBg = (speed: number) => {
    if (speed < 10) return "bg-green-500/20"
    if (speed < 20) return "bg-yellow-500/20"
    if (speed < 40) return "bg-orange-500/20"
    return "bg-red-500/20"
  }

  if (loading || !windData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading wind data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wind className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Wind Conditions</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUnit("kmh")}
              className={`px-3 py-1 rounded ${unit === "kmh" ? "bg-white text-blue-900" : "bg-white/20 text-white"}`}
            >
              km/h
            </button>
            <button
              onClick={() => setUnit("mph")}
              className={`px-3 py-1 rounded ${unit === "mph" ? "bg-white text-blue-900" : "bg-white/20 text-white"}`}
            >
              mph
            </button>
            <button
              onClick={() => setUnit("ms")}
              className={`px-3 py-1 rounded ${unit === "ms" ? "bg-white text-blue-900" : "bg-white/20 text-white"}`}
            >
              m/s
            </button>
          </div>
        </div>

        {/* Wind Alerts */}
        {windData.alerts.length > 0 && (
          <Card className="bg-orange-500/20 backdrop-blur-lg border-orange-400/30 text-white">
            <CardContent className="p-4">
              {windData.alerts.map((alert, index) => (
                <div key={`alert-${index}`} className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-300" />
                  <div>
                    <span className="font-medium">{alert.type}: </span>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Current Wind Conditions */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{windData.current.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold ${getWindColor(windData.current.speed)}`}>
                    {convertSpeed(windData.current.speed)}
                  </div>
                  <div>
                    <div className="text-xl text-white/80">{getSpeedUnit()}</div>
                    <Badge className={`${getWindBg(windData.current.speed)} border border-white/20 text-white`}>
                      {getBeaufortDescription(windData.current.beaufortScale)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Navigation className="h-5 w-5 text-blue-300" style={{ transform: `rotate(${windData.current.direction}deg)` }} />
                  <span className="text-lg">{getDirectionName(windData.current.direction)} ({windData.current.direction}°)</span>
                </div>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
                  <div className="absolute inset-2 border-2 border-white/30 rounded-full"></div>
                  <Navigation 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-white"
                    style={{ transform: `translate(-50%, -50%) rotate(${windData.current.direction}deg)` }}
                  />
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">N</div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">E</div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">S</div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">W</div>
                </div>
                <div className="text-sm text-white/80">Wind Direction</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-red-300" />
                  <div className="text-2xl font-bold text-red-300">{convertSpeed(windData.current.gust)}</div>
                  <div className="text-sm text-white/80">Gust {getSpeedUnit()}</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <Wind className="h-6 w-6 mx-auto mb-2 text-blue-300" />
                  <div className="text-2xl font-bold text-blue-300">{windData.current.beaufortScale}</div>
                  <div className="text-sm text-white/80">Beaufort Scale</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Wind Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              24-Hour Wind Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {windData.hourly.slice(0, 12).map((hour, index) => (
                <div key={`hourly-wind-${index}`} className="bg-white/10 rounded-lg p-2 text-center text-xs">
                  <div className="font-medium">{hour.time}</div>
                  <div className={`text-lg font-bold ${getWindColor(hour.speed)}`}>
                    {convertSpeed(hour.speed)}
                  </div>
                  <div className="text-white/60 mb-1">{getSpeedUnit()}</div>
                  <Navigation 
                    className="h-4 w-4 mx-auto text-blue-300"
                    style={{ transform: `rotate(${hour.direction}deg)` }}
                  />
                  <div className="text-white/60 mt-1">G{convertSpeed(hour.gust)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Wind Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              7-Day Wind Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {windData.daily.map((day, index) => (
                <div key={`daily-wind-${index}`} className="grid grid-cols-5 gap-4 items-center p-3 bg-white/10 rounded-lg">
                  <div className="font-medium">{day.day}</div>
                  
                  <div className="text-center">
                    <div className={`text-xl font-bold ${getWindColor(day.avgSpeed)}`}>
                      {convertSpeed(day.avgSpeed)}
                    </div>
                    <div className="text-xs text-white/70">Avg {getSpeedUnit()}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getWindColor(day.maxSpeed)}`}>
                      {convertSpeed(day.maxSpeed)}
                    </div>
                    <div className="text-xs text-white/70">Max {getSpeedUnit()}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-300">{day.direction}</div>
                    <div className="text-xs text-white/70">Direction</div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={`${getWindBg(day.gustMax)} border border-white/20 text-white`}>
                      Gust: {convertSpeed(day.gustMax)} {getSpeedUnit()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Beaufort Scale Reference */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle>Beaufort Wind Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { scale: "0-1", name: "Calm to Light Air", speed: "0-5 km/h", desc: "Smoke rises vertically" },
                { scale: "2-3", name: "Light to Gentle Breeze", speed: "6-19 km/h", desc: "Leaves rustle, flags move" },
                { scale: "4-5", name: "Moderate to Fresh Breeze", speed: "20-38 km/h", desc: "Small branches move" },
                { scale: "6-7", name: "Strong Breeze to Gale", speed: "39-61 km/h", desc: "Large branches move" }
              ].map((item, index) => (
                <div key={`beaufort-${index}`} className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="font-bold text-lg text-blue-300">{item.scale}</div>
                  <div className="text-sm text-white/90 mb-2">{item.name}</div>
                  <div className="text-xs text-white/70 mb-2">{item.speed}</div>
                  <div className="text-xs text-white/60">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}