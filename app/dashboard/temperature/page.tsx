"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Thermometer, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TemperatureData {
  current: {
    temperature: number
    feelsLike: number
    high: number
    low: number
    location: string
  }
  hourly: Array<{
    time: string
    temperature: number
    feelsLike: number
  }>
  daily: Array<{
    day: string
    high: number
    low: number
    trend: "up" | "down" | "stable"
  }>
  extremes: {
    recordHigh: { temp: number; date: string }
    recordLow: { temp: number; date: string }
    avgHigh: number
    avgLow: number
  }
}

export default function TemperaturePage() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState<"celsius" | "fahrenheit">("celsius")

  const sampleTemperatureData: TemperatureData = {
    current: {
      temperature: 22,
      feelsLike: 25,
      high: 28,
      low: 18,
      location: "London, UK"
    },
    hourly: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
      temperature: Math.round(20 + Math.sin((i - 6) * Math.PI / 12) * 8),
      feelsLike: Math.round(22 + Math.sin((i - 6) * Math.PI / 12) * 8)
    })),
    daily: Array.from({ length: 7 }, (_, i) => {
      const trendValue = Math.random()
      let trend: "up" | "down" | "stable"
      if (trendValue > 0.66) trend = "up"
      else if (trendValue > 0.33) trend = "down"
      else trend = "stable"
      
      return {
        day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(25 + Math.sin(i * 0.5) * 8),
        low: Math.round(15 + Math.sin(i * 0.5) * 5),
        trend
      }
    }),
    extremes: {
      recordHigh: { temp: 35, date: "July 15, 2023" },
      recordLow: { temp: -5, date: "January 8, 2023" },
      avgHigh: 24,
      avgLow: 12
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTemperatureData(sampleTemperatureData)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const convertTemp = (temp: number): number => {
    if (unit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32)
    }
    return temp
  }

  const getTemperatureColor = (temp: number): string => {
    if (temp <= 0) return "text-blue-300"
    if (temp <= 10) return "text-blue-200"
    if (temp <= 20) return "text-green-300"
    if (temp <= 30) return "text-yellow-300"
    return "text-red-300"
  }

  const getTemperatureBg = (temp: number): string => {
    if (temp <= 0) return "bg-blue-500/20"
    if (temp <= 10) return "bg-blue-400/20"
    if (temp <= 20) return "bg-green-400/20"
    if (temp <= 30) return "bg-yellow-400/20"
    return "bg-red-400/20"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch(trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-red-400" />
      case "down": return <TrendingDown className="h-4 w-4 text-blue-400" />
      default: return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading || !temperatureData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading temperature data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Thermometer className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Temperature Analysis</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setUnit("celsius")}
              variant={unit === "celsius" ? "secondary" : "outline"}
              className={unit === "celsius" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              °C
            </Button>
            <Button
              onClick={() => setUnit("fahrenheit")}
              variant={unit === "fahrenheit" ? "secondary" : "outline"}
              className={unit === "fahrenheit" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              °F
            </Button>
          </div>
        </div>

        {/* Current Temperature */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{temperatureData.current.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold ${getTemperatureColor(temperatureData.current.temperature)}`}>
                    {convertTemp(temperatureData.current.temperature)}°
                  </div>
                  <div>
                    <div className="text-xl text-white/80">{unit === "celsius" ? "Celsius" : "Fahrenheit"}</div>
                    <div className="text-sm text-white/70">
                      Feels like {convertTemp(temperatureData.current.feelsLike)}°
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="8"
                      strokeDasharray={`${(temperatureData.current.temperature + 20) * 2.5} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Thermometer className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-sm text-white/80">Temperature Scale</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/20 rounded-lg p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-red-300" />
                  <div className="text-2xl font-bold text-red-300">{convertTemp(temperatureData.current.high)}°</div>
                  <div className="text-sm text-white/80">Today&apos;s High</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <TrendingDown className="h-6 w-6 mx-auto mb-2 text-blue-300" />
                  <div className="text-2xl font-bold text-blue-300">{convertTemp(temperatureData.current.low)}°</div>
                  <div className="text-sm text-white/80">Today&apos;s Low</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Temperature Chart */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              24-Hour Temperature Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-white/10 rounded-lg mb-4 flex items-end justify-around p-4">
              {temperatureData.hourly.slice(0, 12).map((hour, index) => {
                const height = ((hour.temperature + 20) / 60) * 100
                return (
                  <div key={`temp-chart-${index}`} className="flex flex-col items-center">
                    <div className="text-xs mb-1">{convertTemp(hour.temperature)}°</div>
                    <div 
                      className={`w-3 rounded-t ${getTemperatureBg(hour.temperature)} bg-opacity-60`}
                      style={{ height: `${height}%`, minHeight: '10px' }}
                    ></div>
                    <div className="text-xs mt-1 text-white/70">{hour.time}</div>
                  </div>
                )
              })}
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {temperatureData.hourly.slice(0, 12).map((hour, index) => (
                <div key={`temp-hourly-${index}`} className="bg-white/10 rounded-lg p-2 text-center text-xs">
                  <div className="font-medium">{hour.time}</div>
                  <div className={`text-lg font-bold ${getTemperatureColor(hour.temperature)}`}>
                    {convertTemp(hour.temperature)}°
                  </div>
                  <div className="text-white/60">
                    Feels {convertTemp(hour.feelsLike)}°
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Temperature Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              7-Day Temperature Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {temperatureData.daily.map((day, index) => (
                <div key={`temp-daily-${index}`} className="grid grid-cols-4 gap-4 items-center p-3 bg-white/10 rounded-lg">
                  <div className="font-medium">{day.day}</div>
                  
                  <div className="flex items-center gap-2">
                    {getTrendIcon(day.trend)}
                    <span className="text-sm capitalize">{day.trend}</span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getTemperatureColor(day.high)}`}>
                        {convertTemp(day.high)}°
                      </div>
                      <div className="text-xs text-white/70">High</div>
                    </div>
                    <div className="text-white/50">|</div>
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getTemperatureColor(day.low)}`}>
                        {convertTemp(day.low)}°
                      </div>
                      <div className="text-xs text-white/70">Low</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={`${getTemperatureBg(day.high)} border border-white/20 text-white`}>
                      Range: {convertTemp(day.high - day.low)}°
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Temperature Records */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle>Temperature Records & Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-red-500/20 rounded-lg">
                <div className="text-3xl font-bold text-red-300 mb-2">
                  {convertTemp(temperatureData.extremes.recordHigh.temp)}°
                </div>
                <div className="text-sm text-white/80 mb-1">Record High</div>
                <div className="text-xs text-white/60">{temperatureData.extremes.recordHigh.date}</div>
              </div>
              
              <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-300 mb-2">
                  {convertTemp(temperatureData.extremes.recordLow.temp)}°
                </div>
                <div className="text-sm text-white/80 mb-1">Record Low</div>
                <div className="text-xs text-white/60">{temperatureData.extremes.recordLow.date}</div>
              </div>
              
              <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-300 mb-2">
                  {convertTemp(temperatureData.extremes.avgHigh)}°
                </div>
                <div className="text-sm text-white/80">Average High</div>
                <div className="text-xs text-white/60">This month</div>
              </div>
              
              <div className="text-center p-4 bg-cyan-500/20 rounded-lg">
                <div className="text-3xl font-bold text-cyan-300 mb-2">
                  {convertTemp(temperatureData.extremes.avgLow)}°
                </div>
                <div className="text-sm text-white/80">Average Low</div>
                <div className="text-xs text-white/60">This month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}