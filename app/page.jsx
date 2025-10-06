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
  Thermometer
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
      gradient: "from-blue-400 to-blue-600",
      link: "/dashboard/analytics"
    },
    {
      icon: Users,
      title: "User Management",
      description: "Complete user management system with roles, permissions, and advanced filtering.",
      color: "bg-green-500",
      gradient: "from-green-400 to-green-600",
      link: "/dashboard/users"
    },
    {
      icon: Cloud,
      title: "Weather Integration",
      description: "Real-time weather data with forecasts and location-based services.",
      color: "bg-yellow-500",
      gradient: "from-yellow-400 to-yellow-600",
      link: "/dashboard"
    },
    {
      icon: Settings,
      title: "Advanced Settings",
      description: "Comprehensive settings panel with themes, notifications, and security options.",
      color: "bg-purple-500",
      gradient: "from-purple-400 to-purple-600",
      link: "/dashboard/settings"
    },
    {
      icon: Activity,
      title: "Performance Monitoring",
      description: "Track key metrics, monitor performance, and get actionable insights.",
      color: "bg-red-500",
      gradient: "from-red-400 to-red-600",
      link: "/dashboard/performance"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Enterprise-grade security features with 2FA and data encryption.",
      color: "bg-indigo-500",
      gradient: "from-indigo-400 to-indigo-600",
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
      {/* Animated Background Elements - Client Side Only */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundParticles.map((particle) => (
          <div
            key={`bg-element-${particle.id}`}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`relative z-10 p-6 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cloud className="h-8 w-8 text-white animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">WeatherPro</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-white/80 hover:text-white transition-colors">Features</Link>
            <Link href="#testimonials" className="text-white/80 hover:text-white transition-colors">Reviews</Link>
            <Badge className="bg-green-500/20 text-green-300 border-green-400/30 animate-pulse">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></div>
              Live
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center py-20">
          <Badge 
            className={`mb-6 bg-white/20 text-white border-white/30 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            variant="secondary"
          >
            <Bell className="mr-2 h-3 w-3" />
            New Dashboard Features Available
          </Badge>
          
          <h1 
            className={`text-5xl md:text-7xl font-bold text-white mb-6 transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
            }}
          >
            Dashboard
            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
              Pro
            </span>
          </h1>
          
          <p className={`text-xl text-white/80 mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
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
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <stat.icon className="h-6 w-6 text-white/60 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-1100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center text-lg px-8 py-6 bg-white text-blue-900 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl rounded-lg font-semibold group"
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Open Dashboard
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center text-lg px-8 py-6 text-white border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 rounded-lg font-semibold"
            >
              <Thermometer className="mr-2 h-5 w-5" />
              Try Weather Feature
              <Cloud className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/60 mx-auto" />
          </div>
        </div>

        {/* Features Showcase */}
        <div className="py-20" id="features">
          <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-400/30">
              <Star className="mr-2 h-3 w-3" />
              Premium Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need to build, monitor, and scale your applications
            </p>
          </div>

          {/* Featured Spotlight */}
          <div className="mb-16">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white overflow-hidden relative group max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${features[currentFeature].gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      {(() => {
                        const IconComponent = features[currentFeature].icon
                        return <IconComponent className="h-8 w-8 text-white" />
                      })()}
                    </div>
                    <h3 className="text-3xl font-bold mb-4">{features[currentFeature].title}</h3>
                    <p className="text-white/80 text-lg mb-6">{features[currentFeature].description}</p>
                    <Button asChild className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Link href={features[currentFeature].link}>
                        Explore Feature <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="w-full h-64 bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/20 flex items-center justify-center">
                      {(() => {
                        const IconComponent = features[currentFeature].icon
                        return <IconComponent className="h-24 w-24 text-white/40" />
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
                    className={`bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group cursor-pointer h-full ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    style={{ 
                      animationDelay: `${1300 + index * 100}ms`,
                      transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                    }}
                  >
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl group-hover:text-white transition-colors">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-white/70 group-hover:text-white/90 transition-colors leading-relaxed">
                        {feature.description}
                      </CardDescription>
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="h-5 w-5 text-white" />
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
            <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-400/30">
              <Star className="mr-2 h-3 w-3" />
              Customer Stories
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See what our users are saying about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={`testimonial-${index}`} className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-white/80 italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={`star-${i}`} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="py-20 text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-12 max-w-3xl mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-500" />
            <div className="relative z-10">
              <Zap className="h-16 w-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Get Started?
              </h3>
              <p className="text-xl text-white/80 mb-8 max-w-lg mx-auto">
                Join thousands of teams already using our platform to make better decisions with real-time data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-lg px-8 py-6 bg-white text-blue-900 hover:bg-white/90 transition-all duration-300 hover:scale-105 rounded-lg font-semibold group"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Launch Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center text-lg px-8 py-6 text-white border border-white/30 bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 rounded-lg font-semibold"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-white/60 pb-8">
        <div className="container mx-auto px-4">
          <div className="border-t border-white/20 pt-8">
            <p>&copy; 2024 WeatherPro Dashboard. Built with precision and care.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
