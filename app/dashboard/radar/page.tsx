"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Satellite, Radar, Play, Pause, RotateCcw, Layers } from "lucide-react"

interface RadarView {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export default function RadarPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [activeView, setActiveView] = useState("radar")

  const radarViews: RadarView[] = [
    { id: "radar", name: "Weather Radar", icon: Radar, description: "Precipitation and storm tracking" },
    { id: "satellite", name: "Satellite", icon: Satellite, description: "Cloud coverage and movement" },
    { id: "temperature", name: "Temperature", icon: Layers, description: "Temperature distribution" },
    { id: "wind", name: "Wind Flow", icon: Layers, description: "Wind patterns and direction" }
  ]

  const getCurrentView = (): RadarView => {
    return radarViews.find(v => v.id === activeView) || radarViews[0]
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 10)
      }, 500)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying])

  const currentView = getCurrentView()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Satellite className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Radar & Satellite</h1>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">Real-time Data</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  View Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {radarViews.map((view) => {
                  const IconComponent = view.icon
                  return (
                    <Button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      variant={activeView === view.id ? "secondary" : "outline"}
                      className={`w-full justify-start gap-2 ${
                        activeView === view.id 
                          ? "bg-white text-blue-900" 
                          : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {view.name}
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle>Animation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentFrame(0)
                      setIsPlaying(false)
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Frame</span>
                    <span>{currentFrame + 1}/10</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full">
                    <div 
                      className="h-2 bg-white rounded-full transition-all duration-200"
                      style={{ width: `${((currentFrame + 1) / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-xs text-white/70 space-y-1">
                  <div>• Each frame: 10 minutes</div>
                  <div>• Total span: 100 minutes</div>
                  <div>• Auto-updates every 5 min</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-green-400 rounded"></div>
                    <span>Light Rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-yellow-400 rounded"></div>
                    <span>Moderate Rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-orange-500 rounded"></div>
                    <span>Heavy Rain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-red-500 rounded"></div>
                    <span>Severe Weather</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar/Satellite Display */}
          <div className="lg:col-span-3">
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <currentView.icon className="h-5 w-5" />
                  {currentView.name}
                  <Badge className="ml-auto bg-green-500 text-white">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-white/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Animated Background */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400 opacity-20"></div>
                    
                    {/* Simulated Weather Patterns */}
                    <div 
                      className="absolute w-32 h-32 bg-green-400/30 rounded-full blur-sm transition-all duration-500 ease-in-out"
                      style={{
                        top: '20%',
                        left: `${20 + currentFrame * 5}%`
                      }}
                    ></div>
                    <div 
                      className="absolute w-24 h-24 bg-yellow-400/40 rounded-full blur-sm transition-all duration-500 ease-in-out"
                      style={{
                        top: '60%',
                        right: `${15 + currentFrame * 3}%`
                      }}
                    ></div>
                    <div 
                      className="absolute w-16 h-16 bg-red-400/50 rounded-full blur-sm transition-all duration-500 ease-in-out"
                      style={{
                        bottom: '30%',
                        left: `${40 + currentFrame * 2}%`
                      }}
                    ></div>

                    {/* Additional animated elements based on view type */}
                    {activeView === "wind" && (
                      <>
                        {Array.from({ length: 8 }, (_, i) => (
                          <div
                            key={`wind-arrow-${i}`}
                            className="absolute w-6 h-1 bg-white/40 rounded"
                            style={{
                              top: `${20 + i * 10}%`,
                              left: `${30 + Math.sin(currentFrame * 0.5 + i) * 10}%`,
                              transform: `rotate(${currentFrame * 10 + i * 45}deg)`,
                              transition: 'all 0.5s ease-in-out'
                            }}
                          />
                        ))}
                      </>
                    )}

                    {activeView === "satellite" && (
                      <div 
                        className="absolute w-40 h-40 bg-white/10 rounded-full blur-md transition-all duration-1000 ease-in-out"
                        style={{
                          top: '30%',
                          left: `${10 + currentFrame * 7}%`
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Center Content */}
                  <div className="text-center z-10">
                    <currentView.icon className="h-16 w-16 mx-auto mb-4 text-white/70" />
                    <p className="text-lg mb-2">{currentView.name}</p>
                    <p className="text-sm text-white/70 mb-4">
                      {currentView.description}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                    </div>
                  </div>
                </div>

                {/* Time Stamps */}
                <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                  {Array.from({ length: 5 }, (_, i) => {
                    const time = new Date(Date.now() - (4 - i) * 10 * 60 * 1000)
                    const frameIndex = Math.floor((i * 10) / 5)
                    return (
                      <div 
                        key={`timestamp-${i}`}
                        className={`text-center p-2 rounded transition-colors ${
                          frameIndex === Math.floor(currentFrame / 2) ? 'bg-white/20 text-white' : 'text-white/70'
                        }`}
                      >
                        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Weather Activity Cards */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle>Current Weather Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="font-medium">Light Rain</span>
                </div>
                <p className="text-sm text-white/80">Southwest region - Moving northeast at 15 km/h</p>
                <div className="mt-2 text-xs text-white/60">
                  Intensity: 2-5 mm/hr
                </div>
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="font-medium">Moderate Rain</span>
                </div>
                <p className="text-sm text-white/80">Central region - Stationary system</p>
                <div className="mt-2 text-xs text-white/60">
                  Intensity: 5-10 mm/hr
                </div>
              </div>
              
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="font-medium">Cloud Cover</span>
                </div>
                <p className="text-sm text-white/80">Dense clouds - 85% coverage</p>
                <div className="mt-2 text-xs text-white/60">
                  Altitude: 2,000-8,000m
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Information */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardHeader>
            <CardTitle>Radar Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-medium mb-1">Coverage Area</div>
                <div className="text-white/80">500km radius</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-medium mb-1">Update Frequency</div>
                <div className="text-white/80">Every 5 minutes</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-medium mb-1">Resolution</div>
                <div className="text-white/80">1km x 1km</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-medium mb-1">Data Source</div>
                <div className="text-white/80">Weather Service</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}