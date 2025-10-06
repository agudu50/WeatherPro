"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, Clock, MapPin, Info, X, Filter } from "lucide-react"

interface WeatherAlert {
  id: number
  type: "warning" | "watch" | "advisory"
  severity: "extreme" | "severe" | "moderate" | "minor"
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  issued: Date
  dismissed: boolean
  urgent: boolean
}

interface AlertsData {
  alerts: WeatherAlert[]
  summary: {
    total: number
    urgent: number
    active: number
  }
}

export default function WeatherAlertsPage() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [showDismissed, setShowDismissed] = useState(false)

  const sampleAlertsData: AlertsData = {
    alerts: [
      {
        id: 1,
        type: "warning",
        severity: "severe",
        title: "Heavy Rain Warning",
        description: "Heavy rainfall expected with potential flooding in low-lying areas. Rainfall amounts of 50-75mm possible.",
        location: "London and surrounding areas",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
        issued: new Date(Date.now() - 30 * 60 * 1000),
        dismissed: false,
        urgent: true
      },
      {
        id: 2,
        type: "watch",
        severity: "moderate",
        title: "Wind Advisory",
        description: "Strong winds up to 45 km/h expected. Secure loose objects and use caution when driving.",
        location: "Greater London Area",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        issued: new Date(Date.now() - 60 * 60 * 1000),
        dismissed: false,
        urgent: false
      },
      {
        id: 3,
        type: "advisory",
        severity: "minor",
        title: "Dense Fog Advisory",
        description: "Visibility reduced to less than 1km in places. Exercise caution when traveling.",
        location: "Central London",
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
        issued: new Date(Date.now() - 90 * 60 * 1000),
        dismissed: true,
        urgent: false
      }
    ],
    summary: {
      total: 3,
      urgent: 1,
      active: 2
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setAlertsData(sampleAlertsData)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const alertTypes = [
    { id: "all", name: "All Alerts" },
    { id: "warning", name: "Warnings" },
    { id: "watch", name: "Watches" },
    { id: "advisory", name: "Advisories" }
  ]

  const getSeverityColor = (severity: WeatherAlert['severity']) => {
    switch(severity) {
      case "extreme": return { bg: "bg-red-600", text: "text-red-300", border: "border-red-500" }
      case "severe": return { bg: "bg-orange-500", text: "text-orange-300", border: "border-orange-400" }
      case "moderate": return { bg: "bg-yellow-500", text: "text-yellow-300", border: "border-yellow-400" }
      case "minor": return { bg: "bg-blue-500", text: "text-blue-300", border: "border-blue-400" }
    }
  }

  const getTypeIcon = (type: WeatherAlert['type']) => {
    switch(type) {
      case "warning": return <AlertTriangle className="h-5 w-5" />
      case "watch": return <Clock className="h-5 w-5" />
      case "advisory": return <Info className="h-5 w-5" />
    }
  }

  const dismissAlert = (alertId: number) => {
    if (!alertsData) return
    
    const updatedAlerts = alertsData.alerts.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    )
    
    setAlertsData({
      ...alertsData,
      alerts: updatedAlerts
    })
  }

  if (loading || !alertsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading weather alerts...</p>
        </div>
      </div>
    )
  }

  const filteredAlerts = alertsData.alerts.filter(alert => {
    const typeMatch = filterType === "all" || alert.type === filterType
    const dismissMatch = showDismissed || !alert.dismissed
    return typeMatch && dismissMatch
  })

  const activeAlerts = alertsData.alerts.filter(alert => !alert.dismissed)
  const urgentAlerts = activeAlerts.filter(alert => alert.urgent)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Weather Alerts</h1>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-red-500/80 text-white">{urgentAlerts.length} Urgent</Badge>
            <Badge className="bg-white/20 text-white border-white/30">{activeAlerts.length} Active</Badge>
          </div>
        </div>

        {/* Alert Summary */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-500/20 rounded-lg">
                <div className="text-3xl font-bold text-red-300">{urgentAlerts.length}</div>
                <div className="text-sm text-white/80">Urgent Alerts</div>
              </div>
              <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                <div className="text-3xl font-bold text-orange-300">
                  {alertsData.alerts.filter(a => !a.dismissed && a.severity === "severe").length}
                </div>
                <div className="text-sm text-white/80">Severe Warnings</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                <div className="text-3xl font-bold text-yellow-300">
                  {alertsData.alerts.filter(a => !a.dismissed && a.type === "watch").length}
                </div>
                <div className="text-sm text-white/80">Active Watches</div>
              </div>
              <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-300">
                  {alertsData.alerts.filter(a => !a.dismissed && a.type === "advisory").length}
                </div>
                <div className="text-sm text-white/80">Advisories</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Controls */}
        <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium mr-2">Filter:</span>
              {alertTypes.map((type) => (
                <Button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  variant={filterType === type.id ? "secondary" : "outline"}
                  size="sm"
                  className={
                    filterType === type.id 
                      ? "bg-white text-blue-900" 
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                  }
                >
                  {type.name}
                </Button>
              ))}
              <Button
                onClick={() => setShowDismissed(!showDismissed)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                {showDismissed ? "Hide Dismissed" : "Show Dismissed"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="bg-white/20 backdrop-blur-lg border-white/30 text-white">
              <CardContent className="p-8 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-white/50" />
                <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
                <p className="text-white/70">There are currently no weather alerts for your area.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const severityColors = getSeverityColor(alert.severity)
              const typeIcon = getTypeIcon(alert.type)
              
              return (
                <Card 
                  key={`alert-${alert.id}`}
                  className={`bg-white/20 backdrop-blur-lg border-white/30 text-white ${
                    alert.urgent ? "ring-2 ring-red-400 ring-opacity-50" : ""
                  } ${alert.dismissed ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${severityColors.bg}/20`}>
                          {typeIcon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{alert.title}</h3>
                            <Badge className={`${severityColors.bg} text-white capitalize`}>
                              {alert.severity}
                            </Badge>
                            {alert.urgent && (
                              <Badge className="bg-red-500 text-white animate-pulse">
                                URGENT
                              </Badge>
                            )}
                            {alert.dismissed && (
                              <Badge className="bg-gray-500 text-white">
                                Dismissed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/70">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Issued {alert.issued.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!alert.dismissed && (
                        <Button
                          onClick={() => dismissAlert(alert.id)}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-white/90 mb-4">{alert.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/10 rounded-lg">
                      <div>
                        <div className="text-sm font-medium mb-1">Valid From:</div>
                        <div className="text-sm text-white/70">
                          {alert.startTime.toLocaleDateString()} at {alert.startTime.toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Valid Until:</div>
                        <div className="text-sm text-white/70">
                          {alert.endTime.toLocaleDateString()} at {alert.endTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {alert.urgent && !alert.dismissed && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-300">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Immediate Action Required</span>
                        </div>
                        <p className="text-sm text-white/90 mt-1">
                          This is an urgent weather alert. Take appropriate safety measures immediately.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}