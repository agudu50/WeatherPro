"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sun, Shield, Clock, AlertTriangle, TrendingUp } from "lucide-react"

interface UVData {
  current: {
    uvIndex: number
    location: string
    sunlightIntensity: string
    burnTime: number
  }
  hourly: Array<{
    time: string
    uvIndex: number
    sunPosition: string
  }>
  daily: Array<{
    day: string
    maxUV: number
    cloudCover: number
    ozoneFactor: number
  }>
  skinTypes: Array<{
    type: string
    description: string
    burnTime: number
    protection: string
  }>
}

export default function UVIndexPage() {
  const [uvData, setUvData] = useState<UVData | null>(null)
  const [loading, setLoading] = useState(true)

  const sampleUVData: UVData = {
    current: {
      uvIndex: 7,
      location: "London, UK",
      sunlightIntensity: "High",
      burnTime: 15
    },
    hourly: Array.from({ length: 12 }, (_, i) => {
      const hour = (8 + i) % 24
      const uvIndex = hour > 6 && hour < 18 ? Math.round(Math.sin((hour - 6) * Math.PI / 12) * 10) : 0
      return {
        time: `${hour}:00`,
        uvIndex: Math.max(0, uvIndex),
        sunPosition: hour > 6 && hour < 18 ? "visible" : "below"
      }
    }),
    daily: Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      maxUV: Math.round(3 + Math.random() * 8),
      cloudCover: Math.round(Math.random() * 100),
      ozoneFactor: Math.round(280 + Math.random() * 60)
    })),
    skinTypes: [
      { type: "I", description: "Very Fair", burnTime: 10, protection: "SPF 30+" },
      { type: "II", description: "Fair", burnTime: 15, protection: "SPF 15+" },
      { type: "III", description: "Medium", burnTime: 20, protection: "SPF 15+" },
      { type: "IV", description: "Olive", burnTime: 30, protection: "SPF 15+" }
    ]
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setUvData(sampleUVData)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getUVCategory = (uvIndex: number) => {
    if (uvIndex <= 2) return { 
      category: "Low", 
      color: "bg-green-500", 
      textColor: "text-green-300",
      bgColor: "bg-green-500/20",
      risk: "Minimal risk"
    }
    if (uvIndex <= 5) return { 
      category: "Moderate", 
      color: "bg-yellow-500", 
      textColor: "text-yellow-300",
      bgColor: "bg-yellow-500/20",
      risk: "Low risk"
    }
    if (uvIndex <= 7) return { 
      category: "High", 
      color: "bg-orange-500", 
      textColor: "text-orange-300",
      bgColor: "bg-orange-500/20",
      risk: "Moderate risk"
    }
    if (uvIndex <= 10) return { 
      category: "Very High", 
      color: "bg-red-500", 
      textColor: "text-red-300",
      bgColor: "bg-red-500/20",
      risk: "High risk"
    }
    return { 
      category: "Extreme", 
      color: "bg-purple-600", 
      textColor: "text-purple-300",
      bgColor: "bg-purple-500/20",
      risk: "Very high risk"
    }
  }

  if (loading || !uvData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading UV index data...</p>
        </div>
      </div>
    )
  }

  const currentUVCategory = getUVCategory(uvData.current.uvIndex)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Sun className="h-8 w-8 text-white" />
          <h1 className="text-4xl font-bold text-white">UV Index Monitor</h1>
        </div>

        {/* Current UV Index */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold mb-2">{uvData.current.location}</h2>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className={`text-6xl font-bold ${currentUVCategory.textColor}`}>
                    {uvData.current.uvIndex}
                  </div>
                  <div>
                    <Badge className={`${currentUVCategory.color} text-white mb-2`}>
                      {currentUVCategory.category}
                    </Badge>
                    <div className="text-sm text-white/80">{currentUVCategory.risk}</div>
                  </div>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <Sun className="h-5 w-5 text-yellow-300" />
                  <span className="text-lg">{uvData.current.sunlightIntensity} Intensity</span>
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
                      stroke="rgba(251, 191, 36, 0.8)"
                      strokeWidth="8"
                      strokeDasharray={`${(uvData.current.uvIndex / 11) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sun className="h-8 w-8 text-yellow-300" />
                  </div>
                </div>
                <div className="text-sm text-white/80">UV Exposure Level</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`${currentUVCategory.bgColor} rounded-lg p-4 text-center`}>
                  <Clock className="h-6 w-6 mx-auto mb-2 text-orange-300" />
                  <div className="text-2xl font-bold text-orange-300">{uvData.current.burnTime}</div>
                  <div className="text-sm text-white/80">Burn Time (min)</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-purple-300" />
                  <div className="text-2xl font-bold text-purple-300">SPF 30+</div>
                  <div className="text-sm text-white/80">Recommended</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly UV Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today&apos;s UV Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {uvData.hourly.map((hour, index) => {
                const category = getUVCategory(hour.uvIndex)
                return (
                  <div key={`hourly-uv-${index}`} className="bg-white/10 rounded-lg p-2 text-center text-xs">
                    <div className="font-medium">{hour.time}</div>
                    <div className={`text-lg font-bold ${category.textColor}`}>
                      {hour.uvIndex}
                    </div>
                    <Badge className={`${category.color} text-white text-xs mt-1`}>
                      {category.category}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 7-Day UV Forecast */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              7-Day UV Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uvData.daily.map((day, index) => {
                const category = getUVCategory(day.maxUV)
                return (
                  <div key={`daily-uv-${index}`} className="grid grid-cols-5 gap-4 items-center p-3 bg-white/10 rounded-lg">
                    <div className="font-medium">{day.day}</div>
                    
                    <div className="text-center">
                      <div className={`text-xl font-bold ${category.textColor}`}>
                        {day.maxUV}
                      </div>
                      <div className="text-xs text-white/70">Max UV</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`${category.color} text-white`}>
                        {category.category}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-300">{day.cloudCover}%</div>
                      <div className="text-xs text-white/70">Cloud Cover</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-white/80">Ozone: {day.ozoneFactor} DU</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Protection Guidelines */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sun Protection Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Current Conditions (UV {uvData.current.uvIndex})</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-300 flex-shrink-0" />
                    <span className="text-sm">
                      {uvData.current.uvIndex <= 2 ? "Minimal sun protection needed" :
                       uvData.current.uvIndex <= 5 ? "Take precautions when outside" :
                       uvData.current.uvIndex <= 7 ? "Protection required" :
                       "Extra protection required"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-lg">Skin Type Protection Times</h3>
                <div className="space-y-2">
                  {uvData.skinTypes.map((skin, index) => (
                    <div key={`skin-${index}`} className="flex justify-between items-center p-2 bg-white/10 rounded">
                      <div>
                        <span className="font-medium">Type {skin.type}</span>
                        <span className="text-sm text-white/70 ml-2">({skin.description})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(skin.burnTime * (11 - uvData.current.uvIndex) / 8)} min</div>
                        <div className="text-xs text-white/60">{skin.protection}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}