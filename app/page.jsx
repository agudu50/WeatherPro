"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowRight, 
  BarChart3, 
  Users, 
  Settings, 
  Cloud, 
  Activity, 
  Shield, 
  Bell,
  Star,
  Zap,
  Eye,
  Play,
  ChevronDown,
  MapPin,
  Calendar,
  Thermometer,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentFeature, setCurrentFeature] = useState(0)
  const [backgroundParticles, setBackgroundParticles] = useState([])
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  const [stats, setStats] = useState({
    users: 0,
    dashboards: 0,
    uptime: 0,
    countries: 0
  })

  const features = [
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics with interactive charts and real-time data visualization.",
      color: "bg-blue-500",
      link: "/dashboard/analytics"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Complete user management system with roles, permissions, and advanced filtering.",
      color: "bg-green-500",
      link: "/dashboard/users"
    },
    {
      icon: Cloud,
      title: "Weather Integration",
      description: "Real-time weather data with forecasts and location-based services.",
      color: "bg-yellow-500",
      link: "/dashboard"
    },
    {
      icon: Settings,
      title: "Advanced Settings",
      description: "Comprehensive settings panel with themes, notifications, and security options.",
      color: "bg-purple-500",
      link: "/dashboard/settings"
    },
    {
      icon: Activity,
      title: "Performance Monitoring",
      description: "Track key metrics, monitor performance, and get actionable insights.",
      color: "bg-red-500",
      link: "/dashboard/performance"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Enterprise-grade security features with 2FA and data encryption.",
      color: "bg-indigo-500",
      link: "/dashboard/security"
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Data Analyst",
      content: "This dashboard has transformed how we visualize and interpret our data. The analytics are incredible!",
      avatar: "SJ"
    },
    {
      name: "Mike Chen",
      role: "Product Manager",
      content: "The weather integration is seamless. Our team now makes better decisions with real-time data.",
      avatar: "MC"
    },
    {
      name: "Emily Davis",
      role: "DevOps Engineer",
      content: "Security features are top-notch. We feel confident about our data protection.",
      avatar: "ED"
    }
  ]

  // Generate background particles only on client side
  useEffect(() => {
    setIsMounted(true)
    
    // Load dark mode preference (defaults to false)
    const savedDarkMode = localStorage.getItem("darkMode")
    if (savedDarkMode !== null) {
      const mode = savedDarkMode === "true"
      setIsDarkMode(mode)
      if (mode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    
    // Generate consistent particles for client-side only
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 3 + Math.random() * 4
    }))
    
    setBackgroundParticles(particles)
    setIsLoaded(true)
    
    // Animate stats
    const animateStats = () => {
      const duration = 2000
      const startTime = Date.now()
      const targetStats = { users: 10000, dashboards: 500, uptime: 99.9, countries: 150 }
      
      const updateStats = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        setStats({
          users: Math.floor(targetStats.users * progress),
          dashboards: Math.floor(targetStats.dashboards * progress),
          uptime: Number((targetStats.uptime * progress).toFixed(1)),
          countries: Math.floor(targetStats.countries * progress)
        })
        
        if (progress < 1) {
          requestAnimationFrame(updateStats)
        }
      }
      
      requestAnimationFrame(updateStats)
    }
    
    setTimeout(animateStats, 1000)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMounted])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [features.length])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'dark bg-slate-950 text-white' 
        : 'bg-slate-50 text-slate-900'
    } relative overflow-hidden transition-colors duration-500`}>
      {/* Animated Background Elements - Client Side Only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {backgroundParticles.map((particle) => (
          <div
            key={`bg-element-${particle.id}`}
            className={`absolute w-2 h-2 ${
              isDarkMode ? 'bg-indigo-400/15' : 'bg-indigo-500/10'
            } rounded-full animate-float blur-sm`}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
        {/* Additional decorative elements */}
        <div className={`absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`} />
        <div className={`absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-500/5'}`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className={`relative z-10 p-6 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cloud className="h-8 w-8 text-indigo-600 dark:text-white animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Climafy</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Features</Link>
              <Link href="#testimonials" className="text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Reviews</Link>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20 animate-pulse">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-ping"></div>
                Live
              </Badge>
            </div>
            
            <Button
              onClick={toggleDarkMode}
              variant="outline"
              size="icon"
              className={`w-10 h-10 rounded-2xl ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5 text-yellow-400" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center py-20">
          <Badge 
            className={`mb-6 bg-slate-200/50 dark:bg-white/10 text-slate-800 dark:text-white border-slate-300 dark:border-white/20 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            variant="secondary"
          >
            <Bell className="mr-2 h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            New Dashboard Features Available
          </Badge>
          
          <h1 
            className={`text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
            }}
          >
            Dashboard
            <span className="text-indigo-600 dark:text-indigo-400"> Pro</span>
          </h1>
          
          <p className={`text-lg md:text-xl text-slate-600 dark:text-white/80 mb-8 max-w-3xl mx-auto font-medium transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            A comprehensive dashboard application with analytics, user management, 
            weather integration, and much more. Built with Next.js and modern UI components.
          </p>

          {/* Live Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-900 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {[
              { label: "Active Users", value: `${stats.users.toLocaleString()}+`, icon: Users },
              { label: "Dashboards", value: `${stats.dashboards}+`, icon: BarChart3 },
              { label: "Uptime", value: `${stats.uptime}%`, icon: Activity },
              { label: "Countries", value: `${stats.countries}+`, icon: MapPin }
            ].map((stat, index) => (
              <div 
                key={`stat-${index}`}
                className={`rounded-2xl p-4 transition-all duration-300 hover:scale-105 border backdrop-blur-md ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-white/10 text-white hover:bg-slate-900/60 shadow-xl' 
                    : 'bg-white/60 border-slate-200 text-slate-800 hover:bg-white shadow-md'
                }`}
              >
                <stat.icon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-1100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center text-base px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all rounded-2xl font-bold group"
            >
              <Play className="mr-2 h-4.5 w-4.5 group-hover:scale-110 transition-transform ml-0.5" />
              Open Dashboard
              <ArrowRight className="ml-2 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard"
              className={`inline-flex items-center justify-center text-base px-8 py-4 border hover:scale-105 active:scale-95 transition-all rounded-2xl font-bold ${
                isDarkMode 
                  ? 'border-white/10 text-white bg-slate-900/50 hover:bg-slate-900/80 shadow-md shadow-slate-950/20' 
                  : 'border-slate-200 text-slate-800 bg-white/55 hover:bg-slate-100 shadow-md shadow-slate-100/10'
              }`}
            >
              <Thermometer className="mr-2 h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
              Try Weather Feature
              <Cloud className="ml-2 h-4.5 w-4.5 text-blue-500 dark:text-blue-450 text-blue-400" />
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="h-6 w-6 text-slate-400 dark:text-white/60 mx-auto" />
          </div>
        </div>

        {/* Features Showcase */}
        <div className="py-20" id="features">
          <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Badge className="mb-4 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-400/20">
              <Star className="mr-2 h-3 w-3 text-indigo-500" />
              Premium Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to build, monitor, and scale your applications
            </p>
          </div>

          {/* Featured Spotlight */}
          <div className="mb-16">
            <Card className={`border shadow-2xl overflow-hidden relative group max-w-4xl mx-auto rounded-3xl backdrop-blur-xl ${
              isDarkMode ? 'bg-slate-900/40 border-white/10 text-white' : 'bg-white/60 border-slate-200 text-slate-800'
            }`}>
              <div className={`absolute inset-0 opacity-10 transition-opacity duration-500 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`} />
              <CardContent className="p-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className={`w-16 h-16 rounded-2xl ${features[currentFeature].color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 text-white shadow-lg`}>
                      {(() => {
                        const IconComponent = features[currentFeature].icon
                        return <IconComponent className="h-8 w-8" />
                      })()}
                    </div>
                    <h3 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">{features[currentFeature].title}</h3>
                    <p className="text-slate-500 dark:text-slate-300 text-lg mb-6 leading-relaxed">{features[currentFeature].description}</p>
                    <Button asChild className={`rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 ${
                      isDarkMode 
                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10'
                    }`}>
                      <Link href={features[currentFeature].link}>
                        Explore Feature <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative">
                    <div className={`w-full h-64 rounded-2xl border flex items-center justify-center backdrop-blur-md ${
                      isDarkMode ? 'bg-slate-950/20 border-white/5' : 'bg-slate-50/50 border-slate-200/50'
                    }`}>
                      {(() => {
                        const IconComponent = features[currentFeature].icon
                        return <IconComponent className="h-24 w-24 text-slate-300 dark:text-white/20" />
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Link key={`feature-${index}`} href={feature.link}>
                  <Card 
                    className={`border transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 group cursor-pointer h-full backdrop-blur-xl ${
                      isDarkMode 
                        ? 'bg-slate-900/40 border-white/10 text-white hover:bg-slate-900/60 shadow-xl' 
                        : 'bg-white/60 border-slate-200 text-slate-800 hover:bg-white shadow-md'
                    } ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    style={{ 
                      animationDelay: `${1300 + index * 100}ms`,
                      transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                    }}
                  >
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg text-white`}>
                        <IconComponent className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-slate-900 dark:text-white text-xl transition-colors">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-white" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-20" id="testimonials">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-400/20">
              <Star className="mr-2 h-3 w-3 text-indigo-500" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              See what our users are saying about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={`testimonial-${index}`} className={`border transition-all duration-300 hover:scale-105 backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-slate-900/40 border-white/10 text-white shadow-xl' 
                  : 'bg-white/60 border-slate-200 text-slate-800 shadow-md'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center font-black">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-slate-405 text-slate-400 dark:text-white/60 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-white/80 italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={`star-${i}`} className="h-4 w-4 text-amber-500 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="py-20 text-center">
          <div className={`backdrop-blur-xl border rounded-3xl p-12 max-w-3xl mx-auto relative overflow-hidden group shadow-2xl transition-all duration-500 ${
            isDarkMode ? 'bg-slate-900/40 border-white/10 text-white shadow-indigo-950/10' : 'bg-white/60 border-slate-200 text-slate-800 shadow-indigo-100/10'
          }`}>
            <div className={`absolute inset-0 transition-all duration-500 ${isDarkMode ? 'bg-indigo-950/10' : 'bg-indigo-50/5'}`} />
            <div className="relative z-10">
              <Zap className="h-16 w-16 text-amber-500 mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
                Ready to Get Started?
              </h3>
              <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of teams already using our platform to make better decisions with real-time data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-base px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all rounded-2xl font-bold group"
                >
                  <Play className="mr-2 h-4.5 w-4.5 group-hover:scale-110 transition-transform ml-0.5" />
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/dashboard"
                  className={`inline-flex items-center justify-center text-base px-8 py-4 border hover:scale-105 active:scale-95 transition-all rounded-2xl font-bold ${
                    isDarkMode 
                      ? 'border-white/10 text-white bg-slate-900/50 hover:bg-slate-900/80 shadow-md shadow-slate-950/20' 
                      : 'border-slate-200 text-slate-800 bg-white/55 hover:bg-slate-100 shadow-md shadow-slate-100/10'
                  }`}
                >
                  <Eye className="mr-2 h-4.5 w-4.5" />
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-slate-400 dark:text-white/60 pb-8">
        <div className="container mx-auto px-4">
          <div className="border-t border-slate-200 dark:border-white/10 pt-8">
            <p className="text-slate-500 dark:text-slate-400">&copy; 2024 Climafy Dashboard. Built with precision and care.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
