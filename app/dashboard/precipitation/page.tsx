"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CloudRain, Droplets, Umbrella, BarChart3, TrendingUp, Calendar } from "lucide-react"

interface PrecipitationData {
  current: {
    intensity: number
    type: string
    accumulation: number
    location: string
    duration: number
  }
  hourly: Array<{
    time: string
    intensity: number
    probability: number
    accumulation: number
    type: string
  }>
  daily: Array<{
    day: string
    totalRainfall: number
    maxIntensity: number
    probability: number
    rainyHours: number
    type: string
  }>
  monthly: {
    totalRainfall: number
    rainyDays: number
    averageIntensity: number
    comparison: number
  }
}

export default function PrecipitationPage() {
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unit, setUnit] = useState("mm")
  const [viewMode, setViewMode] = useState("hourly")

  const precipitationTypes = ["None", "Light Rain", "Moderate Rain", "Heavy Rain", "Drizzle", "Snow", "Sleet"]

  const generatePrecipitationData = (): PrecipitationData => {
    return {
      current: {
        intensity: 5.2,
        type: "Light Rain",
        accumulation: 2.4,
        location: "London, UK",
        duration: 45
      },
      hourly: Array.from({ length: 24 }, (_, i) => {
        const probability = Math.round(Math.random() * 100)
        const intensity = probability > 50 ? Math.random() * 15 : 0
        return {
          time: new Date(Date.now() + i * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          intensity: Math.round(intensity * 10) / 10,
          probability,
          accumulation: Math.round(intensity * 0.5 * 10) / 10,
          type: intensity === 0 ? "None" : intensity < 2 ? "Drizzle" : intensity < 8 ? "Light Rain" : "Heavy Rain"
        }
      }),
      daily: Array.from({ length: 7 }, (_, i) => {
        const totalRainfall = Math.round(Math.random() * 25 * 10) / 10
        const maxIntensity = Math.round(Math.random() * 20 * 10) / 10
        return {
          day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          totalRainfall,
          maxIntensity,
          probability: Math.round(Math.random() * 100),
          rainyHours: Math.round(Math.random() * 12),
          type: totalRainfall === 0 ? "None" : totalRainfall < 5 ? "Light Rain" : totalRainfall < 15 ? "Moderate Rain" : "Heavy Rain"
        }
      }),
      monthly: {
        totalRainfall: 68.5,
        rainyDays: 12,
        averageIntensity: 4.2,
        comparison: 15
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPrecipitationData(generatePrecipitationData())
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const convertPrecipitation = (amount: number) => {
    if (unit === "inches") {
      return Math.round(amount * 0.0393701 * 100) / 100
    }
    return amount
  }

  const getUnitSymbol = () => {
    return unit === "inches" ? "in" : "mm"
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "text-gray-300"
    if (intensity < 2) return "text-blue-300"
    if (intensity < 8) return "text-blue-400"
    if (intensity < 15) return "text-blue-500"
    return "text-blue-600"
  }

  const getIntensityBg = (intensity: number) => {
    if (intensity === 0) return "bg-gray-500/20"
    if (intensity < 2) return "bg-blue-300/20"
    if (intensity < 8) return "bg-blue-400/20"
    if (intensity < 15) return "bg-blue-500/20"
    return "bg-blue-600/20"
  }

  const getProbabilityColor = (probability: number) => {
    if (probability < 25) return "text-green-300"
    if (probability < 50) return "text-yellow-300"
    if (probability < 75) return "text-orange-300"
    return "text-red-300"
  }

  const getRainfallCategory = (amount: number) => {
    if (amount === 0) return "No Rain"
    if (amount < 2) return "Light"
    if (amount < 10) return "Moderate"
    if (amount < 25) return "Heavy"
    return "Very Heavy"
  }

  if (loading || !precipitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading precipitation data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <CloudRain className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Precipitation Forecast</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setUnit("mm")}
              variant={unit === "mm" ? "secondary" : "outline"}
              className={unit === "mm" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              mm
            </Button>
            <Button
              onClick={() => setUnit("inches")}
              variant={unit === "inches" ? "secondary" : "outline"}
              className={unit === "inches" ? "bg-white text-blue-900" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              inches
            </Button>
          </div>
        </div>

        {/* Current Precipitation */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{precipitationData.current.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold ${getIntensityColor(precipitationData.current.intensity)}`}>
                    {convertPrecipitation(precipitationData.current.intensity)}
                  </div>
                  <div>
                    <div className="text-xl text-white/80">{getUnitSymbol()}/hr</div>
                    <Badge className={`${getIntensityBg(precipitationData.current.intensity)} border border-white/20 text-white`}>
                      {precipitationData.current.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-white/80">
                  Duration: {precipitationData.current.duration} minutes
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
                      stroke="rgba(59, 130, 246, 0.8)"
                      strokeWidth="8"
                      strokeDasharray={`${(precipitationData.current.intensity / 20) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Droplets className="h-8 w-8 text-blue-300" />
                  </div>
                </div>
                <div className="text-sm text-white/80">Intensity Level</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                  <Umbrella className="h-6 w-6 mx-auto mb-2 text-blue-300" />
                  <div className="text-2xl font-bold text-blue-300">
                    {convertPrecipitation(precipitationData.current.accumulation)} {getUnitSymbol()}
                  </div>
                  <div className="text-sm text-white/80">Total Today</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-300" />
                  <div className="text-2xl font-bold text-purple-300">
                    {precipitationData.monthly.rainyDays}
                  </div>
                  <div className="text-sm text-white/80">Rainy Days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Selection */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {["hourly", "daily", "weekly"].map((mode) => (
                <Button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  variant={viewMode === mode ? "secondary" : "outline"}
                  className={
                    viewMode === mode 
                      ? "bg-white text-blue-900" 
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  }
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} View
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Precipitation */}
        {viewMode === "hourly" && (
          <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour Precipitation Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {precipitationData.hourly.slice(0, 12).map((hour, index) => (
                  <div key={`hourly-precip-${index}`} className="bg-white/10 rounded-lg p-2 text-center text-xs">
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${getIntensityColor(hour.intensity)}`}>
                      {convertPrecipitation(hour.intensity)}
                    </div>
                    <div className="text-white/60 mb-1">{getUnitSymbol()}/hr</div>
                    <div className={`text-sm ${getProbabilityColor(hour.probability)}`}>
                      {hour.probability}%
                    </div>
                    <Badge className={`${getIntensityBg(hour.intensity)} text-white text-xs mt-1`}>
                      {hour.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Precipitation */}
        {viewMode === "daily" && (
          <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day Precipitation Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {precipitationData.daily.map((day, index) => (
                  <div key={`daily-precip-${index}`} className="grid grid-cols-5 gap-4 items-center p-3 bg-white/10 rounded-lg">
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getIntensityColor(day.totalRainfall)}`}>
                        {convertPrecipitation(day.totalRainfall)} {getUnitSymbol()}
                      </div>
                      <div className="text-xs text-white/70">Total</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getProbabilityColor(day.probability)}`}>
                        {day.probability}%
                      </div>
                      <div className="text-xs text-white/70">Chance</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-300">{day.rainyHours}h</div>
                      <div className="text-xs text-white/70">Duration</div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={`${getIntensityBg(day.totalRainfall)} border border-white/20 text-white`}>
                        {getRainfallCategory(day.totalRainfall)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Statistics */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Precipitation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-blue-300 mb-2">
                  {convertPrecipitation(precipitationData.monthly.totalRainfall)} {getUnitSymbol()}
                </div>
                <div className="text-sm text-white/80 mb-1">Total This Month</div>
                <div className="text-xs text-white/60">
                  {precipitationData.monthly.comparison > 0 ? "+" : ""}{precipitationData.monthly.comparison}% vs avg
                </div>
              </div>
              
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-green-300 mb-2">
                  {precipitationData.monthly.rainyDays}
                </div>
                <div className="text-sm text-white/80">Rainy Days</div>
                <div className="text-xs text-white/60">Out of 30 days</div>
              </div>
              
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-yellow-300 mb-2">
                  {convertPrecipitation(precipitationData.monthly.averageIntensity)} {getUnitSymbol()}/hr
                </div>
                <div className="text-sm text-white/80">Avg Intensity</div>
                <div className="text-xs text-white/60">When raining</div>
              </div>
              
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-purple-300 mb-2">
                  {Math.round((precipitationData.monthly.rainyDays / 30) * 100)}%
                </div>
                <div className="text-sm text-white/80">Rainy Days</div>
                <div className="text-xs text-white/60">Percentage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Precipitation Tips */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Umbrella className="h-5 w-5" />
              Precipitation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Current Conditions</h3>
                <div className="space-y-2">
                  {precipitationData.current.intensity > 0 ? (
                    <>
                      <div className="flex items-start gap-2">
                        <Droplets className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                        <span className="text-sm">Carry an umbrella or raincoat</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Umbrella className="h-4 w-4 mt-0.5 text-blue-300 flex-shrink-0" />
                        <span className="text-sm">Allow extra travel time</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-sm">No precipitation expected - enjoy the dry weather!</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-lg">Today&apos;s Outlook</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    Peak intensity: {convertPrecipitation(Math.max(...precipitationData.hourly.map(h => h.intensity)))} {getUnitSymbol()}/hr
                  </div>
                  <div className="text-sm">
                    Highest chance: {Math.max(...precipitationData.hourly.map(h => h.probability))}%
                  </div>
                  <div className="text-sm">
                    Total expected: {convertPrecipitation(precipitationData.hourly.reduce((sum, h) => sum + h.accumulation, 0))} {getUnitSymbol()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}