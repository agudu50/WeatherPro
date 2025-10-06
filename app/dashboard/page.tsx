"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Cloud, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Zap,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  ArrowRight,
  Activity,
  AlertTriangle
} from "lucide-react"

interface WeatherCard {
  icon: React.ElementType
  title: string
  value: string
  unit: string
  trend?: string
  color: string
  bgGradient: string
}

export default function DashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState<Array<{id: number, left: number, top: number, delay: number}>>([])

  useEffect(() => {
    setIsLoaded(true)
    
    // Generate animated particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const weatherCards: WeatherCard[] = [
    {
      icon: Cloud,
      title: "Temperature",
      value: "22",
      unit: "°C",
      trend: "+2°",
      color: "text-blue-600",
      bgGradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Droplets,
      title: "Humidity",
      value: "65",
      unit: "%",
      trend: "-5%",
      color: "text-teal-600",
      bgGradient: "from-teal-500 to-emerald-500"
    },
    {
      icon: Wind,
      title: "Wind Speed",
      value: "12",
      unit: "km/h",
      trend: "+3",
      color: "text-indigo-600",
      bgGradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Gauge,
      title: "Pressure",
      value: "1013",
      unit: "hPa",
      color: "text-violet-600",
      bgGradient: "from-violet-500 to-purple-500"
    },
    {
      icon: Eye,
      title: "Visibility",
      value: "10",
      unit: "km",
      color: "text-sky-600",
      bgGradient: "from-sky-500 to-blue-500"
    },
    {
      icon: Sun,
      title: "UV Index",
      value: "5",
      unit: "Moderate",
      color: "text-orange-600",
      bgGradient: "from-orange-500 to-amber-500"
    }
  ]

  const quickLinks = [
    { 
      name: "Hourly Forecast", 
      href: "/dashboard/hourly", 
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      description: "Hour by hour predictions"
    },
    { 
      name: "Weather Map", 
      href: "/dashboard/weather-map", 
      icon: MapPin,
      gradient: "from-blue-500 to-cyan-500",
      description: "Interactive radar view"
    },
    { 
      name: "Weather Details", 
      href: "/dashboard/weather", 
      icon: Activity,
      gradient: "from-green-500 to-teal-500",
      description: "Detailed weather info"
    },
    { 
      name: "Analytics", 
      href: "/dashboard/analytics", 
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-500",
      description: "Weather trends & insights"
    }
  ]

  const alerts = [
    { type: "warning", message: "Strong winds expected tomorrow", icon: Wind, color: "bg-orange-100 border-orange-400 text-orange-800" },
    { type: "info", message: "Perfect weather for outdoor activities", icon: Sun, color: "bg-blue-100 border-blue-400 text-blue-800" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Hero Header with Animation */}
        <div className={`mb-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Weather Dashboard
                </h1>
                <p className="text-gray-600 text-lg">Real-time weather insights at your fingertips</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>London, UK</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-6xl font-bold bg-gradient-to-br from-orange-400 to-pink-600 bg-clip-text text-transparent">
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-500 mt-1">Local Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        <div className={`mb-8 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert, index) => {
              const Icon = alert.icon
              return (
                <div key={index} className={`${alert.color} border-2 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <p className="font-medium">{alert.message}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weather Cards Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {weatherCards.map((card, index) => {
            const Icon = card.icon
            return (
              <div
                key={index}
                className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/20 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgGradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {card.trend && (
                      <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        {card.trend}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
                  
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${card.color}`}>
                      {card.value}
                    </span>
                    <span className="text-gray-500 text-lg">{card.unit}</span>
                  </div>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-400/50 transition-colors duration-500" />
              </div>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Quick Access
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <Link
                  key={index}
                  href={link.href}
                  className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/20 overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-90 transition-opacity duration-500`} />
                  
                  <div className="relative z-10">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${link.gradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-white transition-colors duration-300">
                      {link.name}
                    </h3>
                    <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-3">
                      {link.description}
                    </p>
                    
                    <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-white transition-colors duration-300">
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Back to Home Link */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}