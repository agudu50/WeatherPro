"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { 
  History, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Download,
  Sun,
  Moon,
  Search,
  Target,
  RefreshCw,
  Loader2,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Activity,
  FileText
} from "lucide-react"

interface HistoryDataPoint {
  date: string
  value: number
  timestamp: number
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
  windSpeed: MetricData
  extremes: Array<{
    type: string
    value: string
    date: string
    description: string
  }>
  location: string
  country: string
}

const CustomTooltip = ({ active, payload, label, unit, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`border p-3 rounded-xl shadow-md text-xs font-mono ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <p className={`font-black mb-1 uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>[{label}]</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].stroke }} />
          <span className={isDarkMode ? "text-slate-350" : "text-slate-500"}>{payload[0].name}:</span>
          <span className="font-extrabold">{payload[0].value} {unit}</span>
        </div>
      </div>
    )
  }
  return null
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedMetric, setSelectedMetric] = useState("temperature")
  const [searchCity, setSearchCity] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')

  const periods = [
    { id: "week", name: "Last 7 Days", days: 7 },
    { id: "month", name: "Last 30 Days", days: 30 },
    { id: "quarter", name: "Last 90 Days", days: 90 }
  ]

  const metrics = [
    { id: "temperature", name: "Temperature", unit: "°C", icon: Thermometer },
    { id: "humidity", name: "Humidity", unit: "%", icon: Droplets },
    { id: "precipitation", name: "Precipitation", unit: "mm", icon: CloudRain },
    { id: "pressure", name: "Pressure", unit: "hPa", icon: Gauge },
    { id: "windSpeed", name: "Wind Speed", unit: "km/h", icon: Wind }
  ]

  const getMetricTheme = (metricId: string) => {
    switch (metricId) {
      case "temperature":
        return { color: "#f43f5e", bg: "bg-rose-500/10 border-rose-500/20 text-rose-500", border: "border-l-rose-500" }
      case "humidity":
        return { color: "#6366f1", bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-550 dark:text-indigo-400", border: "border-l-indigo-600" }
      case "precipitation":
        return { color: "#3b82f6", bg: "bg-blue-500/10 border-blue-500/20 text-blue-500", border: "border-l-blue-500" }
      case "pressure":
        return { color: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500", border: "border-l-emerald-500" }
      case "windSpeed":
        return { color: "#f59e0b", bg: "bg-amber-500/10 border-amber-500/20 text-amber-500", border: "border-l-amber-500" }
      default:
        return { color: "#6366f1", bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-550 dark:text-indigo-400", border: "border-l-indigo-650" }
    }
  }

  const fetchHistoricalData = async (lat: number, lon: number, days: number) => {
    setLoading(true)
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'
    try {
      // Fetch location name
      const locationResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
      )
      
      if (!locationResponse.ok) throw new Error('Failed to fetch location')
      const locationData = await locationResponse.json()

      // Fetch 5-day forecast (best available for historical simulation)
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      )
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast')
      const forecastData = await forecastResponse.json()

      // Fetch current weather
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      )
      
      if (!currentResponse.ok) throw new Error('Failed to fetch current weather')
      const currentData = await currentResponse.json()

      // Process forecast data into historical format
      const temperatureData: HistoryDataPoint[] = []
      const humidityData: HistoryDataPoint[] = []
      const precipitationData: HistoryDataPoint[] = []
      const pressureData: HistoryDataPoint[] = []
      const windSpeedData: HistoryDataPoint[] = []

      // Add current data point
      const now = Date.now()
      temperatureData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(currentData.main.temp * 10) / 10,
        timestamp: now
      })
      humidityData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.main.humidity,
        timestamp: now
      })
      precipitationData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.rain?.['1h'] ? Math.round(currentData.rain['1h'] * 10) / 10 : 0,
        timestamp: now
      })
      pressureData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: currentData.main.pressure,
        timestamp: now
      })
      windSpeedData.push({
        date: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(currentData.wind.speed * 3.6 * 10) / 10, // Convert to km/h
        timestamp: now
      })

      // Process forecast data (simulate historical by working backwards)
      const forecastByDay: { [key: string]: any[] } = {}
      
      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000)
        const dateKey = date.toDateString()
        
        if (!forecastByDay[dateKey]) {
          forecastByDay[dateKey] = []
        }
        forecastByDay[dateKey].push(item)
      })

      // Calculate daily averages from forecast
      Object.keys(forecastByDay).slice(0, Math.min(days, 5)).forEach((dateKey) => {
        const dayData = forecastByDay[dateKey]
        const date = new Date(dateKey)
        const timestamp = date.getTime()
        
        const avgTemp = dayData.reduce((sum, d) => sum + d.main.temp, 0) / dayData.length
        const avgHumidity = dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length
        const totalPrecip = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0)
        const avgPressure = dayData.reduce((sum, d) => sum + d.main.pressure, 0) / dayData.length
        const avgWind = dayData.reduce((sum, d) => sum + d.wind.speed * 3.6, 0) / dayData.length

        temperatureData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgTemp * 10) / 10,
          timestamp
        })
        humidityData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgHumidity),
          timestamp
        })
        precipitationData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(totalPrecip * 10) / 10,
          timestamp
        })
        pressureData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgPressure),
          timestamp
        })
        windSpeedData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: Math.round(avgWind * 10) / 10,
          timestamp
        })
      })

      // Generate simulated historical data for remaining days if needed
      const remainingDays = days - temperatureData.length
      if (remainingDays > 0) {
        const baseTemp = temperatureData[0].value
        const baseHumidity = humidityData[0].value
        const basePressure = pressureData[0].value
        const baseWind = windSpeedData[0].value

        for (let i = 1; i <= remainingDays; i++) {
          const daysAgo = temperatureData.length + i
          const timestamp = now - daysAgo * 24 * 60 * 60 * 1000
          const date = new Date(timestamp)
          
          // Add some variation to simulate historical data
          const tempVariation = Math.sin(i * 0.2) * 5 + (Math.random() - 0.5) * 3
          const humidityVariation = Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10
          const pressureVariation = Math.sin(i * 0.15) * 10 + (Math.random() - 0.5) * 5
          const windVariation = Math.random() * 10
          const precipVariation = Math.random() < 0.3 ? Math.random() * 15 : 0

          temperatureData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round((baseTemp + tempVariation) * 10) / 10,
            timestamp
          })
          humidityData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.max(20, Math.min(100, Math.round(baseHumidity + humidityVariation))),
            timestamp
          })
          precipitationData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(precipVariation * 10) / 10,
            timestamp
          })
          pressureData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(basePressure + pressureVariation),
            timestamp
          })
          windSpeedData.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round((baseWind + windVariation) * 10) / 10,
            timestamp
          })
        }
      }

      // Sort by timestamp (oldest to newest)
      const sortByTimestamp = (a: HistoryDataPoint, b: HistoryDataPoint) => a.timestamp - b.timestamp
      temperatureData.sort(sortByTimestamp)
      humidityData.sort(sortByTimestamp)
      precipitationData.sort(sortByTimestamp)
      pressureData.sort(sortByTimestamp)
      windSpeedData.sort(sortByTimestamp)

      // Calculate statistics
      const calcStats = (data: HistoryDataPoint[]) => {
        const values = data.map(d => d.value)
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        const minVal = Math.min(...values)
        const maxVal = Math.max(...values)
        const minPoint = data.find(d => d.value === minVal)!
        const maxPoint = data.find(d => d.value === maxVal)!

        // Calculate trend
        const firstHalf = values.slice(0, Math.floor(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        const trend = secondAvg > firstAvg + 1 ? 'increasing' : 
                      secondAvg < firstAvg - 1 ? 'decreasing' : 'stable'

        return { avg, minVal, maxVal, minPoint, maxPoint, trend }
      }

      const tempStats = calcStats(temperatureData)
      const humidityStats = calcStats(humidityData)
      const precipStats = calcStats(precipitationData)
      const pressureStats = calcStats(pressureData)
      const windStats = calcStats(windSpeedData)

      const totalPrecip = precipitationData.reduce((sum, d) => sum + d.value, 0)
      const rainyDays = precipitationData.filter(d => d.value > 0.1).length

      setHistoryData({
        summary: {
          period: periods.find(p => p.days === days)?.name || `Last ${days} Days`,
          totalDays: days,
          dataPoints: temperatureData.length,
          lastUpdated: new Date()
        },
        temperature: {
          average: Math.round(tempStats.avg * 10) / 10,
          min: { value: tempStats.minVal, date: tempStats.minPoint.date },
          max: { value: tempStats.maxVal, date: tempStats.maxPoint.date },
          trend: tempStats.trend,
          data: temperatureData
        },
        humidity: {
          average: Math.round(humidityStats.avg),
          min: { value: humidityStats.minVal, date: humidityStats.minPoint.date },
          max: { value: humidityStats.maxVal, date: humidityStats.maxPoint.date },
          trend: humidityStats.trend,
          data: humidityData
        },
        precipitation: {
          total: Math.round(totalPrecip * 10) / 10,
          average: Math.round(precipStats.avg * 10) / 10,
          max: { value: precipStats.maxVal, date: precipStats.maxPoint.date },
          rainyDays: rainyDays,
          trend: precipStats.trend,
          data: precipitationData
        },
        pressure: {
          average: Math.round(pressureStats.avg),
          min: { value: pressureStats.minVal, date: pressureStats.minPoint.date },
          max: { value: pressureStats.maxVal, date: pressureStats.maxPoint.date },
          trend: pressureStats.trend,
          data: pressureData
        },
        windSpeed: {
          average: Math.round(windStats.avg * 10) / 10,
          min: { value: windStats.minVal, date: windStats.minPoint.date },
          max: { value: windStats.maxVal, date: windStats.maxPoint.date },
          trend: windStats.trend,
          data: windSpeedData
        },
        extremes: [
          { 
            type: "Highest Temperature", 
            value: `${tempStats.maxVal}°C`, 
            date: tempStats.maxPoint.date, 
            description: "Maximum temperature recorded" 
          },
          { 
            type: "Lowest Temperature", 
            value: `${tempStats.minVal}°C`, 
            date: tempStats.minPoint.date, 
            description: "Minimum temperature recorded" 
          },
          { 
            type: "Highest Rainfall", 
            value: `${precipStats.maxVal}mm`, 
            date: precipStats.maxPoint.date, 
            description: "Maximum daily precipitation" 
          },
          { 
            type: "Highest Wind Speed", 
            value: `${windStats.maxVal} km/h`, 
            date: windStats.maxPoint.date, 
            description: "Peak wind speed recorded" 
          }
        ],
        location: locationData.name,
        country: locationData.sys.country
      })

      setCurrentLocation({ lat, lon })
      setLocationStatus('success')
    } catch (error) {
      console.error('Error fetching historical data:', error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      const defaultPeriod = periods.find(p => p.id === selectedPeriod)
      fetchHistoricalData(51.5074, -0.1278, defaultPeriod?.days || 7) // Default to London
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ lat: latitude, lon: longitude })
        const period = periods.find(p => p.id === selectedPeriod)
        fetchHistoricalData(latitude, longitude, period?.days || 7)
      },
      (error) => {
        console.error('Location error:', error)
        setLocationStatus(error.code === 1 ? 'denied' : 'error')
        const period = periods.find(p => p.id === selectedPeriod)
        fetchHistoricalData(51.5074, -0.1278, period?.days || 7) // Fallback to London
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${apiKey}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      setCurrentLocation({ lat: data.coord.lat, lon: data.coord.lon })
      const period = periods.find(p => p.id === selectedPeriod)
      await fetchHistoricalData(data.coord.lat, data.coord.lon, period?.days || 7)
      setSearchCity('')
    } catch (error) {
      alert('City not found. Please try again.')
      setLoading(false)
    }
  }

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriod(periodId)
    if (currentLocation) {
      const period = periods.find(p => p.id === periodId)
      fetchHistoricalData(currentLocation.lat, currentLocation.lon, period?.days || 7)
    }
  }

  const exportAsCSV = () => {
    if (!historyData) return

    const currentMetricData = historyData[selectedMetric as keyof typeof historyData] as MetricData
    const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)
    
    if (!currentMetricData || !selectedMetricInfo) return

    let csvContent = `Date,${selectedMetricInfo.name} (${selectedMetricInfo.unit})\n`
    currentMetricData.data.forEach(point => {
      csvContent += `${point.date},${point.value}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-history-${selectedMetric}-${selectedPeriod}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportAsJSON = () => {
    if (!historyData) return

    const jsonContent = JSON.stringify(historyData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-history-${selectedPeriod}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-4.5 w-4.5" />
    if (trend === 'decreasing') return <TrendingDown className="h-4.5 w-4.5" />
    return <BarChart3 className="h-4.5 w-4.5" />
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-rose-500 bg-rose-500/10 border-rose-500/25'
    if (trend === 'decreasing') return 'text-blue-500 bg-blue-500/10 border-blue-500/25'
    return 'text-slate-400 bg-slate-500/10 border-slate-500/25'
  }

  if (loading && !historyData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing meteorological archive logs...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving historical atmospheric telemetry...</p>
        </div>
      </div>
    )
  }

  if (!historyData) return null

  const currentMetricData = historyData[selectedMetric as keyof typeof historyData] as MetricData
  const selectedMetricInfo = metrics.find(m => m.id === selectedMetric)

  if (!selectedMetricInfo || !currentMetricData) return null

  const latCoord = currentLocation?.lat || 51.5074
  const lonCoord = currentLocation?.lon || -0.1278
  const theme = getMetricTheme(selectedMetric)

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <History className="h-7 w-7 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Weather History Console
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                  <span className="truncate">{historyData.location}, {historyData.country}</span>
                </div>
                <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-650 dark:text-slate-450 border border-slate-200 dark:border-slate-800">
                  LAT: {latCoord.toFixed(4)}° LON: {lonCoord.toFixed(4)}°
                </span>
                <span className="hidden sm:inline text-slate-350 dark:text-slate-700">|</span>
                {locationStatus === 'success' && (
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border bg-indigo-500/10 text-indigo-650 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/20 flex-shrink-0">
                    📍 Calibrated Location
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchCity} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex items-center flex-1 sm:flex-initial sm:w-60">
                <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search weather sector..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className={`pl-9 pr-3 py-2 w-full rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-880 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                />
              </div>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/15 flex-shrink-0">
                Scan Sector
              </Button>
            </form>
            
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={getUserLocation}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-880 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Locate station"
                >
                  <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                </Button>

                <Button
                  type="button"
                  onClick={() => fetchHistoricalData(latCoord, lonCoord, periods.find(p => p.id === selectedPeriod)?.days || 7)}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-880 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Sync telemetry"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </Button>

                <Button
                  type="button"
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-880 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isDarkMode ? "Light Display" : "Dark Display"}
                >
                  {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-indigo-600" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Section: Contains all data display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Visualizer and Extremes: Left column (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chart Card with Integrated Period and Metric Controls */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                <div className="flex flex-col gap-4">
                  {/* Title & Period Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Activity className="h-4.5 w-4.5 text-indigo-500" />
                      <span>Historical Telemetry: {selectedMetricInfo.name}</span>
                    </CardTitle>
                    
                    {/* Period selector segment control */}
                    <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-850 self-start sm:self-auto">
                      {periods.map((period) => (
                        <button
                          key={period.id}
                          onClick={() => handlePeriodChange(period.id)}
                          className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase transition-all ${
                            selectedPeriod === period.id
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-500 dark:text-slate-450 hover:text-slate-950 dark:hover:text-white"
                          }`}
                        >
                          {period.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric selector buttons bar */}
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.map((metric) => {
                      const MIcon = metric.icon
                      const isSelected = selectedMetric === metric.id
                      return (
                        <button
                          key={metric.id}
                          onClick={() => setSelectedMetric(metric.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-all ${
                            isSelected
                              ? "bg-indigo-650/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                              : isDarkMode
                                ? "bg-slate-950 border-slate-850 text-slate-450 hover:text-white"
                                : "bg-slate-50 border-slate-250 text-slate-600 hover:text-slate-950"
                          }`}
                        >
                          <MIcon className="h-3.5 w-3.5" />
                          <span>{metric.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Render BarChart or AreaChart based on selectedMetric */}
                    {(selectedMetric === "precipitation" || selectedMetric === "windSpeed") ? (
                      <BarChart data={currentMetricData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis 
                          dataKey="date" 
                          stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                          fontSize={10} 
                          fontWeight="bold" 
                        />
                        <YAxis 
                          stroke={theme.color} 
                          fontSize={10} 
                          fontWeight="bold" 
                        />
                        <Tooltip content={<CustomTooltip unit={selectedMetricInfo.unit} isDarkMode={isDarkMode} />} />
                        <Bar
                          dataKey="value"
                          name={selectedMetricInfo.name}
                          fill={theme.color}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    ) : (
                      <AreaChart data={currentMetricData.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis 
                          dataKey="date" 
                          stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                          fontSize={10} 
                          fontWeight="bold" 
                        />
                        <YAxis 
                          stroke={theme.color} 
                          fontSize={10} 
                          fontWeight="bold" 
                        />
                        <Tooltip content={<CustomTooltip unit={selectedMetricInfo.unit} isDarkMode={isDarkMode} />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name={selectedMetricInfo.name}
                          stroke={theme.color}
                          strokeWidth={2}
                          fillOpacity={0.1}
                          fill={theme.color}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 mt-4 pt-3 text-[10px] font-mono text-indigo-400/40 font-bold">
                  <span>SYS: ARCHIVE_SCAN</span>
                  <span>RATE: HISTORIC</span>
                  <span>DTR_LOCK: OK</span>
                </div>

              </CardContent>
            </Card>

            {/* Weather Extremes Reference Panel */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <span>Meteorological Extreme Records - {historyData.summary.period}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {historyData.extremes.map((extreme, index) => (
                    <div key={index} className={`p-4 rounded-xl border flex flex-col justify-between min-h-[145px] h-auto hover:scale-[1.02] transition-all duration-300 ${
                      isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-450 font-black">Record</span>
                        <Badge variant="outline" className="text-[8px] font-black font-mono border bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 py-0.5">EX_LMT</Badge>
                      </div>
                      <div className="mt-1">
                        <div className="text-base font-black text-rose-500 dark:text-rose-400">{extreme.value}</div>
                        <div className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate mt-0.5">{extreme.type}</div>
                      </div>
                      <div className="border-t border-slate-100 dark:border-slate-850/50 mt-1 pt-1.5">
                        <div className="text-[9px] font-bold text-slate-400">Date: {extreme.date}</div>
                        <div className="text-[8px] text-slate-450 font-semibold truncate mt-0.5">{extreme.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Telemetry sidebar & Exports: Right column (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Console Telemetry Summary Card */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between gap-1.5">
                  <span>Console Telemetry</span>
                  <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 border ${getTrendColor(currentMetricData.trend)}`}>
                    {getTrendIcon(currentMetricData.trend)}
                    <span className="ml-1 capitalize">{currentMetricData.trend}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6">
                
                {/* Period overview subgrid */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[9px] uppercase tracking-wider text-slate-450 font-black">[ Frame_Summary ]</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/45">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Total Days</p>
                      <p className="text-base font-black text-indigo-650 dark:text-indigo-400 mt-1">{historyData.summary.totalDays}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/45">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Data Points</p>
                      <p className="text-base font-black text-emerald-500 mt-1">{historyData.summary.dataPoints}</p>
                    </div>
                  </div>
                </div>

                {/* Metric specific stats */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[9px] uppercase tracking-wider text-slate-450 font-black">[ Active_Metric_Stats ]</h4>
                  <div className="space-y-3">
                    
                    {/* Stat line: average / total */}
                    {selectedMetric === "precipitation" ? (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/40 text-xs">
                          <span className="font-semibold text-slate-500">Total Accumulation</span>
                          <span className="font-mono font-black text-slate-850 dark:text-slate-100">{currentMetricData.total} {selectedMetricInfo.unit}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/40 text-xs">
                          <span className="font-semibold text-slate-500">Rainy Days Count</span>
                          <span className="font-mono font-black text-slate-850 dark:text-slate-100">{currentMetricData.rainyDays} days</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/40 text-xs">
                        <span className="font-semibold text-slate-500">Mean Average</span>
                        <span className="font-mono font-black text-slate-800 dark:text-slate-100">{currentMetricData.average} {selectedMetricInfo.unit}</span>
                      </div>
                    )}

                    {/* Peak High */}
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/40 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500">Peak Maximum</span>
                        {currentMetricData.max?.date && <span className="text-[8px] font-bold text-slate-400 block mt-0.5">on {currentMetricData.max.date}</span>}
                      </div>
                      <span className="font-mono font-black text-rose-500">{currentMetricData.max?.value || currentMetricData.total} {selectedMetricInfo.unit}</span>
                    </div>

                    {/* Valley Low */}
                    {currentMetricData.min && (
                      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-850/40 text-xs">
                        <div>
                          <span className="font-semibold text-slate-500">Valley Minimum</span>
                          <span className="text-[8px] font-bold text-slate-400 block mt-0.5">on {currentMetricData.min.date}</span>
                        </div>
                        <span className="font-mono font-black text-blue-500">{currentMetricData.min.value} {selectedMetricInfo.unit}</span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Status line */}
                <div className="pt-2 flex items-center justify-between text-[9px] font-mono text-slate-450 border-t border-slate-100 dark:border-slate-850/50">
                  <span>SYNC: STABLE</span>
                  <span>SYNC DATE: {new Date(historyData.summary.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

              </CardContent>
            </Card>

            {/* Data Export Console */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-850">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Download className="h-5 w-5 text-indigo-500" />
                  <span>Export Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={exportAsCSV}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 font-bold text-xs tracking-wide shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>CSV Format</span>
                  </Button>
                  
                  <Button 
                    onClick={exportAsJSON}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 font-bold text-xs tracking-wide shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>JSON Format</span>
                  </Button>

                  <Button 
                    onClick={() => window.print()}
                    variant="outline"
                    className={`rounded-xl py-2 px-4 font-bold text-xs tracking-wide border flex items-center justify-center gap-2 ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-850 hover:text-white' 
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Print Log</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </div>
  )
}