"use client"

import { useTheme } from "@/lib/ThemeContext"
import { useState, useEffect, useMemo } from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Activity,
  ArrowUpIcon,
  Compass,
  Radio,
  Server,
  CloudRain,
  Thermometer,
  Cpu,
  Signal,
  MapPin,
  Search,
  Target,
  RefreshCw,
  Sun,
  Moon,
  Loader2
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

interface AnalyticsData {
  location: string
  country: string
  coord: { lat: number; lon: number }
  currentTemp: number
  weatherCondition: string
  lastUpdated: string
}

const CustomTooltip = ({ active, payload, label, isDarkMode }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`border p-3 rounded-xl shadow-md text-xs font-mono ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}>
        <p className={`font-black mb-1.5 uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>[{label}]</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.stroke }} />
            <span className={isDarkMode ? "text-slate-350" : "text-slate-500"}>{item.name}:</span>
            <span className="font-extrabold">{item.value}{item.name === "Temperature" ? "°C" : item.name === "Rainfall" ? " mm" : "%"}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("7d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchCity, setSearchCity] = useState("")
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied'>('loading')
  const { isDarkMode, toggleDarkMode } = useTheme()

  const fetchAnalytics = async (lat: number, lon: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      if (!response.ok) throw new Error('Failed to fetch weather data')
      const data = await response.json()

      const currentTemp = data.main.temp
      const weatherMain = data.weather[0]?.main || "Clear"

      setAnalyticsData({
        location: data.name,
        country: data.sys.country,
        coord: { lat, lon },
        currentTemp,
        weatherCondition: weatherMain,
        lastUpdated: new Date().toISOString()
      })
      setLocationStatus('success')
    } catch (error) {
      console.error("Error fetching analytics data:", error)
      setLocationStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'ca695dcbc66c5fa3d0cb955033fd918f'}`
      )
      
      if (!response.ok) throw new Error('City not found')
      
      const data = await response.json()
      setAnalyticsData({
        location: data.name,
        country: data.sys.country,
        coord: data.coord,
        currentTemp: data.main.temp,
        weatherCondition: data.weather[0]?.main || "Clear",
        lastUpdated: new Date().toISOString()
      })
      setSearchCity("")
      setLocationStatus('success')
    } catch (error) {
      alert("City not found. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('loading')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          fetchAnalytics(latitude, longitude)
        },
        (error) => {
          console.error("Location error:", error)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
          // Fallback to New York City
          fetchAnalytics(40.7128, -74.0060)
        }
      )
    } else {
      // Fallback
      fetchAnalytics(40.7128, -74.0060)
    }
  }

  useEffect(() => {
    handleUseCurrentLocation()
  }, [])

  // Dynamic simulation data hook
  const generatedData = useMemo(() => {
    if (!analyticsData) return null

    const { lat, lon } = analyticsData.coord
    const baseTemp = analyticsData.currentTemp
    const condition = analyticsData.weatherCondition.toLowerCase()

    let rainMultiplier = 1.0
    let tempOffset = 0
    if (condition.includes("rain") || condition.includes("drizzle")) {
      rainMultiplier = 2.2
      tempOffset = -2
    } else if (condition.includes("clear") || condition.includes("hot")) {
      rainMultiplier = 0.3
      tempOffset = 3
    } else if (condition.includes("snow") || condition.includes("ice")) {
      rainMultiplier = 1.6
      tempOffset = -8
    }

    let kpis = {
      sensorsActive: "48 / 50",
      sensorsActivePercent: 96,
      meanTemp: (baseTemp + tempOffset).toFixed(1) + " °C",
      accumulatedRain: (145.2 * rainMultiplier).toFixed(1) + " mm",
      barometricMean: "1,012.4 hPa"
    }

    let chartData = []
    if (timeRange === "7d") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      chartData = days.map((day, idx) => {
        const seed = Math.sin(lat + lon + idx) * 4
        const temp = parseFloat((baseTemp + tempOffset + seed).toFixed(1))
        const rain = Math.max(0, parseFloat((12 * rainMultiplier + Math.cos(idx) * 8).toFixed(1)))
        const humidity = Math.min(100, Math.max(20, Math.round(65 + Math.sin(idx) * 15)))
        return { label: day, temp, rain, humidity }
      })
      kpis.sensorsActive = "48 / 50"
      kpis.sensorsActivePercent = 96
      kpis.accumulatedRain = chartData.reduce((acc, curr) => acc + curr.rain, 0).toFixed(1) + " mm"
      kpis.barometricMean = "1,013.2 hPa"
    } else if (timeRange === "30d") {
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
      chartData = weeks.map((week, idx) => {
        const seed = Math.sin(lat - lon + idx) * 3
        const temp = parseFloat((baseTemp + tempOffset + seed - 1).toFixed(1))
        const rain = Math.max(0, parseFloat((55 * rainMultiplier + Math.cos(idx * 2) * 20).toFixed(1)))
        const humidity = Math.min(100, Math.max(20, Math.round(62 + Math.sin(idx * 2) * 10)))
        return { label: week, temp, rain, humidity }
      })
      kpis.sensorsActive = "49 / 50"
      kpis.sensorsActivePercent = 98
      kpis.accumulatedRain = chartData.reduce((acc, curr) => acc + curr.rain, 0).toFixed(1) + " mm"
      kpis.barometricMean = "1,011.8 hPa"
    } else {
      const months = ["Month 1", "Month 2", "Month 3"]
      chartData = months.map((month, idx) => {
        const seed = Math.sin(lat * 2 + lon * 3 + idx) * 2
        const temp = parseFloat((baseTemp + tempOffset + seed - 2).toFixed(1))
        const rain = Math.max(0, parseFloat((180 * rainMultiplier + Math.sin(idx) * 60).toFixed(1)))
        const humidity = Math.min(100, Math.max(20, Math.round(60 + Math.cos(idx) * 8)))
        return { label: month, temp, rain, humidity }
      })
      kpis.sensorsActive = "50 / 50"
      kpis.sensorsActivePercent = 100
      kpis.accumulatedRain = chartData.reduce((acc, curr) => acc + curr.rain, 0).toFixed(1) + " mm"
      kpis.barometricMean = "1,012.4 hPa"
    }

    const sensorsBreakdown = [
      { name: "Thermal Probes", value: 35, color: "#6366f1" },
      { name: "Hydrometers", value: 25, color: "#06b6d4" },
      { name: "Anemometers", value: 20, color: "#a855f7" },
      { name: "Barometric Sensors", value: 15, color: "#10b981" },
      { name: "Solar Irradiance", value: 5, color: "#f59e0b" },
    ]

    const sectors = [
      { name: "Sector North-East", packets: timeRange === "7d" ? 12450 : timeRange === "30d" ? 54800 : 164000, trend: 12.5 },
      { name: "Sector Central Grid", packets: timeRange === "7d" ? 14100 : timeRange === "30d" ? 61200 : 185000, trend: 8.2 },
      { name: "Sector Coastal Station", packets: timeRange === "7d" ? 8900 : timeRange === "30d" ? 38400 : 112000, trend: -2.1 },
      { name: "Sector Western Ranges", packets: timeRange === "7d" ? 11800 : timeRange === "30d" ? 49100 : 148000, trend: 5.7 },
      { name: "Sector Southern Buffer", packets: timeRange === "7d" ? 9200 : timeRange === "30d" ? 41000 : 123000, trend: -1.5 },
    ]

    return { kpis, chartData, sensorsBreakdown, sectors }
  }, [analyticsData, timeRange])

  if (loading && !analyticsData) {
    return (
      <div className={`w-full min-h-[calc(100vh-3.5rem)] ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } p-4 md:p-6 flex items-center justify-center transition-colors duration-500`}>
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-indigo-650 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold tracking-tight">Syncing meteorological archive charts...</p>
          <p className="text-xs text-slate-400 mt-1">Running sector telemetry analysis algorithms...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData || !generatedData) return null

  const latCoord = analyticsData.coord.lat
  const lonCoord = analyticsData.coord.lon

  return (
    <div className={`w-full max-w-full overflow-x-hidden min-h-[calc(100vh-3.5rem)] ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } p-4 md:p-6 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Console */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10 flex-shrink-0">
              <Activity className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                Meteorological Analytics
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-rose-500 animate-pulse flex-shrink-0" />
                  <span className="truncate">{analyticsData.location}, {analyticsData.country}</span>
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
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
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
              {/* Range Filters */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setTimeRange("7d")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    timeRange === "7d"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setTimeRange("30d")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    timeRange === "30d"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  30D
                </button>
                <button
                  onClick={() => setTimeRange("90d")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    timeRange === "90d"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  90D
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Locate station"
                >
                  <Target className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                </Button>

                <Button
                  type="button"
                  onClick={() => fetchAnalytics(latCoord, lonCoord)}
                  variant="outline"
                  size="icon"
                  className={`rounded-xl border h-10 w-10 ${
                    isDarkMode 
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
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
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white' 
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

        {/* Top KPI Telemetry Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Active Sensors */}
          <Card className={`border border-l-4 border-l-indigo-600 ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Sensors</CardTitle>
              <Radio className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{generatedData.kpis.sensorsActive}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{generatedData.kpis.sensorsActivePercent}%</span>
                <span>telemetry coverage rate</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Mean Temperature */}
          <Card className={`border border-l-4 border-l-rose-500 ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mean Temperature</CardTitle>
              <Thermometer className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{generatedData.kpis.meanTemp}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <ArrowUpIcon className="h-3 w-3 text-rose-500" />
                <span className="text-rose-500 font-extrabold">+1.2°C</span>
                <span>above baseline norm</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Accumulated Rain */}
          <Card className={`border border-l-4 border-l-blue-500 ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rain Accumulation</CardTitle>
              <CloudRain className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{generatedData.kpis.accumulatedRain}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <ArrowUpIcon className="h-3 w-3 text-blue-500" />
                <span className="text-blue-500 font-extrabold">+8.4%</span>
                <span>vs historical volume</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Barometric Mean */}
          <Card className={`border border-l-4 border-l-emerald-500 ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
          } rounded-2xl shadow-sm hover:border-indigo-500/20 transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Mean Pressure</CardTitle>
              <Compass className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{generatedData.kpis.barometricMean}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-emerald-500 dark:text-emerald-400 font-extrabold">STABLE</span>
                <span>anticyclonic state</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Charts & Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Trends & Regional Stats (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Chart 1: Climate Trends double-axis AreaChart */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Climate Trends Overview</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400">
                  Regional temperature variations and rainfall volumes over the {timeRange === "7d" ? "last 7 days" : timeRange === "30d" ? "last 30 days" : "last 90 days"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generatedData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                      <XAxis 
                        dataKey="label" 
                        stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                        fontSize={10} 
                        fontWeight="bold" 
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#f43f5e" 
                        fontSize={10} 
                        fontWeight="bold" 
                        label={{ value: "Temp (°C)", angle: -90, position: "insideLeft", offset: 0, style: { fill: "#f43f5e", fontSize: 9, fontWeight: 900 } }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#3b82f6" 
                        fontSize={10} 
                        fontWeight="bold" 
                        label={{ value: "Rain (mm)", angle: 90, position: "insideRight", offset: 0, style: { fill: "#3b82f6", fontSize: 9, fontWeight: 900 } }}
                      />
                      <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 10, fontWeight: "bold" }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="temp"
                        name="Temperature"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        fillOpacity={0.1}
                        fill="rgba(244, 63, 94, 0.05)"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="rain"
                        name="Rainfall"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={0.1}
                        fill="rgba(59, 130, 246, 0.05)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Regional Sector Telemetry Packets Log */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Server className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Regional Weather Station Telemetry load</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400">
                  Total data packets logged and signal stability ratings per sector
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                {generatedData.sectors.map((sector, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-850/30 pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">{sector.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-450">{sector.packets.toLocaleString()} packets</span>
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                            sector.trend > 0 
                              ? 'bg-emerald-500/10 text-emerald-550 dark:text-emerald-450 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {sector.trend > 0 ? "+" : ""}{sector.trend}% sync
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full sm:w-[120px] flex items-center gap-2">
                      <Progress 
                        value={Math.max(20, Math.min(100, 80 + sector.trend * 1.5))} 
                        className="h-1.5 w-full bg-slate-100 dark:bg-slate-950"
                      />
                      <span className="font-mono text-[10px] font-black text-slate-450">
                        {Math.round(Math.max(20, Math.min(100, 80 + sector.trend * 1.5)))}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

          {/* Right Side: Calibration Breakdown & Target KPI Progress (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Chart 2: Doughnut PieChart for sensor categories */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Hardware Sensor array</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400">
                  Distribution of hardware instruments in active duty
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="relative w-full max-w-[200px] aspect-square mx-auto mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={generatedData.sensorsBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {generatedData.sensorsBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={isDarkMode ? "#0f172a" : "#ffffff"} strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Absolute core counter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                      {generatedData.kpis.sensorsActive.split(" / ")[0]}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-450 tracking-wider mt-1">
                      ACTIVE SENSORS
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full space-y-2 mt-2">
                  {generatedData.sensorsBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-450 flex-shrink-0">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diagnostics indicators cards */}
            <Card className={`border ${
              isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'
            } rounded-2xl shadow-sm overflow-hidden hover:border-indigo-500/20 transition-all duration-300`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Signal className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Telemetry Diagnostic health</span>
                </CardTitle>
                <CardDescription className="text-[10px] font-semibold text-slate-400">
                  Real-time status markers and target parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                
                {/* Metric 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-550 dark:text-slate-350">Station Sync Rate</span>
                    <span className="font-mono text-indigo-650 dark:text-indigo-400 font-black">98.1%</span>
                  </div>
                  <Progress value={98} className="h-1.5 bg-slate-100 dark:bg-slate-950" />
                </div>

                {/* Metric 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-550 dark:text-slate-350">Solar Array Efficiency</span>
                    <span className="font-mono text-amber-500 font-black">92.4%</span>
                  </div>
                  <Progress value={92} className="h-1.5 bg-slate-100 dark:bg-slate-950" />
                </div>

                {/* Metric 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-550 dark:text-slate-350">Signal Integrity Index</span>
                    <span className="font-mono text-cyan-500 font-black">95.8%</span>
                  </div>
                  <Progress value={96} className="h-1.5 bg-slate-100 dark:bg-slate-950" />
                </div>

                {/* Metric 4 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-550 dark:text-slate-350">Battery Backup Reserve</span>
                    <span className="font-mono text-emerald-500 font-black">87.5%</span>
                  </div>
                  <Progress value={88} className="h-1.5 bg-slate-100 dark:bg-slate-950" />
                </div>

              </CardContent>
            </Card>

          </div>

        </div>

      </div>

      {/* Embedded CSS styles */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}