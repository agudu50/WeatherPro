"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Gauge, AlertTriangle, TrendingUp } from "lucide-react"

interface AirQualityData {
  aqi: number
  location: string
  components: {
    pm25: number
    pm10: number
    o3: number
    no2: number
    so2: number
    co: number
  }
  forecast: Array<{
    day: string
    aqi: number
  }>
}

export default function AirQualityPage() {
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(true)

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "bg-green-500", textColor: "text-green-800", bgColor: "bg-green-50" }
    if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-800", bgColor: "bg-yellow-50" }
    if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "bg-orange-500", textColor: "text-orange-800", bgColor: "bg-orange-50" }
    if (aqi <= 200) return { label: "Unhealthy", color: "bg-red-500", textColor: "text-red-800", bgColor: "bg-red-50" }
    if (aqi <= 300) return { label: "Very Unhealthy", color: "bg-purple-500", textColor: "text-purple-800", bgColor: "bg-purple-50" }
    return { label: "Hazardous", color: "bg-gray-800", textColor: "text-gray-800", bgColor: "bg-gray-50" }
  }

  const sampleAirQuality: AirQualityData = {
    aqi: 42,
    location: "London, UK",
    components: {
      pm25: 15,
      pm10: 23,
      o3: 88,
      no2: 45,
      so2: 12,
      co: 250
    },
    forecast: Array.from({ length: 5 }, (_, i) => ({
      day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      aqi: Math.round(40 + Math.random() * 60)
    }))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setAirQualityData(sampleAirQuality)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading || !airQualityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading air quality data...</p>
        </div>
      </div>
    )
  }

  const aqiStatus = getAQIStatus(airQualityData.aqi)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-white" />
          <h1 className="text-4xl font-bold text-white">Air Quality Index</h1>
        </div>

        {/* Main AQI Display */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{airQualityData.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className="text-6xl font-bold">{airQualityData.aqi}</div>
                  <div>
                    <Badge className={`${aqiStatus.color} text-white mb-2`}>
                      {aqiStatus.label}
                    </Badge>
                    <div className="text-sm text-white/80">Air Quality Index</div>
                  </div>
                </div>
                <p className="text-white/80">
                  {aqiStatus.label === "Good" ? "Air quality is satisfactory" : 
                   aqiStatus.label === "Moderate" ? "Air quality is acceptable for most people" :
                   "Air quality may be unhealthy for sensitive individuals"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{airQualityData.components.pm25}</div>
                  <div className="text-sm text-white/80">PM2.5 μg/m³</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{airQualityData.components.pm10}</div>
                  <div className="text-sm text-white/80">PM10 μg/m³</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{airQualityData.components.o3}</div>
                  <div className="text-sm text-white/80">O₃ μg/m³</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <Gauge className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{airQualityData.components.no2}</div>
                  <div className="text-sm text-white/80">NO₂ μg/m³</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5-Day AQI Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              5-Day Air Quality Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {airQualityData.forecast.map((day, index) => {
                const dayStatus = getAQIStatus(day.aqi)
                return (
                  <div key={`forecast-${index}`} className="text-center p-3 bg-white/10 rounded-lg">
                    <div className="font-medium mb-2">{day.day}</div>
                    <div className="text-2xl font-bold mb-2">{day.aqi}</div>
                    <Badge className={`${dayStatus.color} text-white text-xs`}>
                      {dayStatus.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Health Recommendations */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">General Population</h3>
                <ul className="space-y-2 text-sm text-white/90">
                  <li>• Enjoy your usual outdoor activities</li>
                  <li>• Air quality is satisfactory</li>
                  <li>• No health implications</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Sensitive Groups</h3>
                <ul className="space-y-2 text-sm text-white/90">
                  <li>• People with lung disease should consider reducing prolonged outdoor exertion</li>
                  <li>• Watch for symptoms such as coughing or shortness of breath</li>
                  <li>• Children and elderly should limit outdoor activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}