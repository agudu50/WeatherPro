"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, Calendar, TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react"

interface HistoryDataPoint {
  date: string
  value: number
}

interface MetricData {
  average?: number
  min?: { value: number; date: string }
  max?: { value: number; date: string }
  total?: number
  rainyDays?: number
  trend: string
  data: HistoryDataPoint[]
}

interface HistoryData {
  summary: {
    period: string
    totalDays: number
    dataPoints: number
    lastUpdated: Date
  }
  temperature: MetricData
  humidity: MetricData
  precipitation: MetricData
  pressure: MetricData
  extremes: Array<{
    type: string
    value: string
    date: string
    description: string
  }>
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedMetric, setSelectedMetric] = useState("temperature")

  const periods = [
    { id: "week", name: "Last 7 Days" },
    { id: "month", name: "Last 30 Days" },
    { id: "quarter", name: "Last 3 Months" },
    { id: "year", name: "Last Year" }
  ]

  const metrics = [
    { id: "temperature", name: "Temperature", unit: "°C", icon: TrendingUp },
    { id: "humidity", name: "Humidity", unit: "%", icon: BarChart3 },
    { id: "precipitation", name: "Precipitation", unit: "mm", icon: TrendingDown },
    { id: "pressure", name: "Pressure", unit: "hPa", icon: BarChart3 }
  ]

  const generateHistoryData = (period: string): HistoryData => {
    const days = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365
    
    return {
      summary: {
        period: period,
        totalDays: days,
        dataPoints: days * 24,
        lastUpdated: new Date()
      },
      temperature: {
        average: 18.5,
        min: { value: -2, date: "Jan 15" },
        max: { value: 32, date: "Jul 22" },
        trend: "increasing",
        data: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          value: Math.round(15 + Math.sin(i * 0.2) * 10 + Math.random() * 5)
        }))
      },
      humidity: {
        average: 68,
        min: { value: 35, date: "Aug 10" },
        max: { value: 95, date: "Nov 3" },
        trend: "stable",
        data: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          value: Math.round(60 + Math.sin(i * 0.3) * 20 + Math.random() * 10)
        }))
      },
      precipitation: {
        total: 156.7,
        average: 5.2,
        max: { value: 42.3, date: "Oct 15" },
        rainyDays: 18,
        trend: "decreasing",
        data: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          value: Math.round(Math.random() * 15)
        }))
      },
      pressure: {
        average: 1013.2,
        min: { value: 985.4, date: "Sep 20" },
        max: { value: 1035.8, date: "Feb 8" },
        trend: "stable",
        data: Array.from({ length: Math.min(days, 30) }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          value: Math.round(1010 + Math.sin(i * 0.1) * 15 + Math.random() * 10)
        }))
      },
      extremes: [
        { type: "Hottest Day", value: "32°C", date: "July 22, 2024", description: "Record high temperature" },
        { type: "Coldest Day", value: "-2°C", date: "January 15, 2024", description: "Lowest temperature recorded" },
        { type: "Wettest Day", value: "42.3mm", date: "October 15, 2024", description: "Highest daily rainfall" },
        { type: "Windiest Day", value: "65 km/h", date: "March 8, 2024", description: "Peak wind speed recorded" }
      ]
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setHistoryData(generateHistoryData(selectedPeriod))
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [selectedPeriod])

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "increasing": return <TrendingUp className="h-4 w-4 text-red-400" />
      case "decreasing": return <TrendingDown className="h-4 w-4 text-blue-400" />
      default: return <BarChart3 className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case "increasing": return "text-red-300"
      case "decreasing": return "text-blue-300"
      default: return "text-gray-300"
    }
  }

  if (loading || !historyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading historical data...</p>
        </div>
      </div>
    )
  }

  const currentMetricData = historyData[selectedMetric as keyof typeof historyData] as MetricData
  const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)

  if (!selectedMetricInfo || !currentMetricData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Weather History</h1>
          </div>
          <Button className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Period Selection */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <Button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period.id)}
                  variant={selectedPeriod === period.id ? "secondary" : "outline"}
                  className={selectedPeriod === period.id 
                    ? "bg-white text-blue-900" 
                    : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  }
                >
                  {period.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data Summary - {periods.find(p => p.id === selectedPeriod)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-blue-300">{historyData.summary.totalDays}</div>
                <div className="text-sm text-white/80">Total Days</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-green-300">{historyData.summary.dataPoints.toLocaleString()}</div>
                <div className="text-sm text-white/80">Data Points</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-purple-300">24/7</div>
                <div className="text-sm text-white/80">Monitoring</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <div className="text-3xl font-bold text-orange-300">
                  {historyData.summary.lastUpdated.toLocaleDateString()}
                </div>
                <div className="text-sm text-white/80">Last Updated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric Selection */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              {metrics.map((metric) => (
                <Button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id)}
                  variant={selectedMetric === metric.id ? "secondary" : "outline"}
                  className={`gap-2 ${
                    selectedMetric === metric.id 
                      ? "bg-white text-blue-900" 
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  }`}
                >
                  <metric.icon className="h-4 w-4" />
                  {metric.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Metric Details */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedMetricInfo.icon className="h-5 w-5" />
              {selectedMetricInfo.name} Analysis
              <Badge className={`ml-2 ${getTrendColor(currentMetricData.trend)}`}>
                {getTrendIcon(currentMetricData.trend)}
                {currentMetricData.trend}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Statistics</h3>
                
                {selectedMetric === "precipitation" ? (
                  <>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-300">
                        {currentMetricData.total}{selectedMetricInfo.unit}
                      </div>
                      <div className="text-sm text-white/80">Total {selectedMetricInfo.name}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-300">
                        {currentMetricData.rainyDays}
                      </div>
                      <div className="text-sm text-white/80">Rainy Days</div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-300">
                      {currentMetricData.average}{selectedMetricInfo.unit}
                    </div>
                    <div className="text-sm text-white/80">Average {selectedMetricInfo.name}</div>
                  </div>
                )}

                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-300">
                    {currentMetricData.max?.value || currentMetricData.total}{selectedMetricInfo.unit}
                  </div>
                  <div className="text-sm text-white/80">
                    Maximum ({currentMetricData.max?.date || "N/A"})
                  </div>
                </div>

                {currentMetricData.min && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-300">
                      {currentMetricData.min.value}{selectedMetricInfo.unit}
                    </div>
                    <div className="text-sm text-white/80">
                      Minimum ({currentMetricData.min.date})
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-lg mb-4">Historical Trend</h3>
                <div className="h-64 bg-white/10 rounded-lg p-4">
                  <div className="h-full flex items-end justify-around">
                    {currentMetricData.data.slice(-14).map((point, index) => {
                      const maxValue = Math.max(...currentMetricData.data.map(d => d.value))
                      const height = (point.value / maxValue) * 100
                      return (
                        <div key={`chart-${index}`} className="flex flex-col items-center">
                          <div className="text-xs mb-1 text-white/70">{point.value}</div>
                          <div 
                            className="w-4 bg-gradient-to-t from-blue-400 to-blue-200 rounded-t"
                            style={{ height: `${Math.max(height, 5)}%`, minHeight: '5px' }}
                          ></div>
                          <div className="text-xs mt-1 text-white/60 transform -rotate-45 origin-bottom-left">
                            {point.date.split('/')[1]}/{point.date.split('/')[0]}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Extremes */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weather Extremes - {periods.find(p => p.id === selectedPeriod)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {historyData.extremes.map((extreme, index) => (
                <div key={`extreme-${index}`} className="bg-white/10 rounded-lg p-4">
                  <div className="text-lg font-bold text-yellow-300 mb-2">{extreme.value}</div>
                  <div className="text-sm font-medium text-white/90 mb-1">{extreme.type}</div>
                  <div className="text-xs text-white/70 mb-2">{extreme.date}</div>
                  <div className="text-xs text-white/60">{extreme.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Export Options */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              <Button className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-4">
              Export historical weather data for analysis, research, or backup purposes. 
              Data includes temperature, humidity, precipitation, and atmospheric pressure measurements.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}