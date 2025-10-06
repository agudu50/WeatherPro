"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Satellite, Layers, Zap, CloudRain, Thermometer } from "lucide-react"

export default function WeatherMapPage() {
  const [activeLayer, setActiveLayer] = useState("temperature")
  const [mapData, setMapData] = useState(null)

  const mapLayers = [
    { id: "temperature", name: "Temperature", icon: Thermometer, color: "bg-red-500" },
    { id: "precipitation", name: "Precipitation", icon: CloudRain, color: "bg-blue-500" },
    { id: "clouds", name: "Clouds", icon: Satellite, color: "bg-gray-500" },
    { id: "pressure", name: "Pressure", icon: Layers, color: "bg-purple-500" },
    { id: "wind", name: "Wind", icon: Zap, color: "bg-green-500" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Interactive Weather Map</h1>
          </div>
          <Badge className="bg-white/20 text-white border-white/30">Live Data</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Map Layers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mapLayers.map((layer) => (
                  <Button
                    key={layer.id}
                    onClick={() => setActiveLayer(layer.id)}
                    variant={activeLayer === layer.id ? "secondary" : "outline"}
                    className={`w-full justify-start gap-2 ${
                      activeLayer === layer.id 
                        ? "bg-white text-blue-900" 
                        : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${layer.color}`}></div>
                    <layer.icon className="h-4 w-4" />
                    {layer.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-blue-300 rounded"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-yellow-400 rounded"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-red-500 rounded"></div>
                    <span>High</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map Display */}
          <div className="lg:col-span-3">
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="h-5 w-5" />
                  Weather Map - {mapLayers.find(l => l.id === activeLayer)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-white/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Placeholder Map */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-400 opacity-30"></div>
                  <div className="text-center z-10">
                    <MapPin className="h-16 w-16 mx-auto mb-4 text-white/70" />
                    <p className="text-lg mb-2">Interactive Weather Map</p>
                    <p className="text-sm text-white/70">
                      Showing {mapLayers.find(l => l.id === activeLayer)?.name.toLowerCase()} data
                    </p>
                    <p className="text-xs text-white/50 mt-2">
                      Map integration with Leaflet/OpenStreetMap coming soon
                    </p>
                  </div>
                  
                  {/* Sample Data Points */}
                  <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}