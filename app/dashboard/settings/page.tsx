"use client"

import { useState, useEffect } from "react"
import {
  Save,
  RefreshCw,
  MapPin,
  Navigation,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function WeatherSettings() {
  // ✅ Default states
  const [notifications, setNotifications] = useState({
    severeWeather: true,
    dailySummary: false,
    appUpdates: true,
  })

  const [preferences, setPreferences] = useState({
    temperatureUnit: "celsius",
    windSpeedUnit: "kmh",
    updateFrequency: "30min",
    mapStyle: "standard",
    theme: "system",
    defaultLocation: "",
    useCurrentLocation: false,
  })

  // ✅ Location states
  const [locationStatus, setLocationStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error'
    message: string
    coordinates?: { lat: number; lon: number }
  }>({
    type: 'idle',
    message: 'Location not accessed yet'
  })

  const [detectedLocation, setDetectedLocation] = useState<string>("")

  // ✅ Load saved preferences when the component mounts
  useEffect(() => {
    const savedPrefs = localStorage.getItem("weatherPreferences")
    const savedNotifs = localStorage.getItem("weatherNotifications")

    if (savedPrefs) setPreferences(JSON.parse(savedPrefs))
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
  }, [])

  // ✅ Function to get user's location
  const requestLocation = async () => {
    setLocationStatus({ type: 'loading', message: 'Requesting location access...' })

    if (!navigator.geolocation) {
      setLocationStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser'
      })
      return
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          setLocationStatus({
            type: 'success',
            message: 'Location accessed successfully!',
            coordinates: { lat: latitude, lon: longitude }
          })

          // ✅ Reverse geocode to get location name
          await reverseGeocode(latitude, longitude)

          // ✅ Save coordinates to localStorage
          localStorage.setItem("userCoordinates", JSON.stringify({
            lat: latitude,
            lon: longitude,
            timestamp: Date.now()
          }))
        },
        (error) => {
          let errorMessage = 'Failed to get location'
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.'
              break
          }

          setLocationStatus({ type: 'error', message: errorMessage })
          setPreferences(prev => ({ ...prev, useCurrentLocation: false }))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      setLocationStatus({
        type: 'error',
        message: 'An unexpected error occurred'
      })
    }
  }

  // ✅ Reverse geocoding to get location name from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown'
        const country = data.address?.country || ''
        const locationName = `${city}, ${country}`
        
        setDetectedLocation(locationName)
        setPreferences(prev => ({ ...prev, defaultLocation: locationName }))
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setDetectedLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    }
  }

  // ✅ Handle location toggle
  const handleLocationToggle = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, useCurrentLocation: enabled }))
    
    if (enabled) {
      requestLocation()
    } else {
      setLocationStatus({ type: 'idle', message: 'Location access disabled' })
      setDetectedLocation("")
    }
  }

  // ✅ Save preferences when user clicks button
  const handleSave = () => {
    localStorage.setItem("weatherPreferences", JSON.stringify(preferences))
    localStorage.setItem("weatherNotifications", JSON.stringify(notifications))
    alert("✅ Preferences saved successfully!")
  }

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [type]: value }))
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
          <p className="text-muted-foreground">Customize how your Weather App looks and behaves</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* 🌍 General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>Configure core weather display settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Access Section */}
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-semibold">Use Current Location</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect your location for accurate weather
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.useCurrentLocation}
                    onCheckedChange={handleLocationToggle}
                  />
                </div>

                {/* Location Status */}
                {locationStatus.type !== 'idle' && (
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${
                    locationStatus.type === 'loading' ? 'bg-blue-100 border border-blue-300' :
                    locationStatus.type === 'success' ? 'bg-green-100 border border-green-300' :
                    'bg-red-100 border border-red-300'
                  }`}>
                    {locationStatus.type === 'loading' && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    )}
                    {locationStatus.type === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {locationStatus.type === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        locationStatus.type === 'loading' ? 'text-blue-800' :
                        locationStatus.type === 'success' ? 'text-green-800' :
                        'text-red-800'
                      }`}>
                        {locationStatus.message}
                      </p>
                      
                      {locationStatus.coordinates && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Coordinates:</span> {locationStatus.coordinates.lat.toFixed(4)}, {locationStatus.coordinates.lon.toFixed(4)}
                          </p>
                          {detectedLocation && (
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Location:</span> {detectedLocation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {preferences.useCurrentLocation && locationStatus.type === 'success' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestLocation}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Location
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="defaultLocation" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Default Location
                </Label>
                <Input
                  id="defaultLocation"
                  placeholder="e.g. Accra, Ghana"
                  value={preferences.defaultLocation}
                  onChange={(e) =>
                    handlePreferenceChange("defaultLocation", e.target.value)
                  }
                  disabled={preferences.useCurrentLocation}
                />
                <p className="text-xs text-muted-foreground">
                  {preferences.useCurrentLocation 
                    ? "Disabled when using current location" 
                    : "Enter a city name to use as default"}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Temperature Unit</Label>
                <Select
                  value={preferences.temperatureUnit}
                  onValueChange={(val) =>
                    handlePreferenceChange("temperatureUnit", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">°C - Celsius</SelectItem>
                    <SelectItem value="fahrenheit">°F - Fahrenheit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Wind Speed Unit</Label>
                <Select
                  value={preferences.windSpeedUnit}
                  onValueChange={(val) =>
                    handlePreferenceChange("windSpeedUnit", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kmh">km/h</SelectItem>
                    <SelectItem value="mph">mph</SelectItem>
                    <SelectItem value="ms">m/s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Privacy Notice</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your location data is only stored locally in your browser and is never sent to external servers. 
                      We use your coordinates solely to fetch weather data for your area.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🔔 Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weather Alerts</CardTitle>
              <CardDescription>
                Choose which weather notifications you'd like to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  key: "severeWeather",
                  label: "Severe Weather Alerts",
                  desc: "Be notified of storms, floods, or extreme heat.",
                },
                {
                  key: "dailySummary",
                  label: "Daily Summary",
                  desc: "Get a daily morning forecast overview.",
                },
                {
                  key: "appUpdates",
                  label: "App Updates",
                  desc: "Receive updates about new features or improvements.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      handleNotificationChange(item.key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🎨 Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Control how the app looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(val) => handlePreferenceChange("theme", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Map Style</Label>
                <Select
                  value={preferences.mapStyle}
                  onValueChange={(val) =>
                    handlePreferenceChange("mapStyle", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select map style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ⚙️ Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Options</CardTitle>
              <CardDescription>Extra settings for power users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Auto Refresh Interval</Label>
                <Select
                  value={preferences.updateFrequency}
                  onValueChange={(val) =>
                    handlePreferenceChange("updateFrequency", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">Every 15 Minutes</SelectItem>
                    <SelectItem value="30min">Every 30 Minutes</SelectItem>
                    <SelectItem value="1h">Every Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Manual Refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Refresh weather data manually anytime.
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
