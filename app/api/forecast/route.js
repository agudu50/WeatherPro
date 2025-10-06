import { NextResponse } from "next/server"

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    let forecastUrl
    if (lat && lon) {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    } else if (city) {
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    } else {
      return NextResponse.json({ error: "City name or coordinates required" }, { status: 400 })
    }

    const response = await fetch(forecastUrl)

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "City not found" }, { status: 404 })
      }
      throw new Error("Forecast API request failed")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Forecast API error:", error)
    return NextResponse.json({ error: "Failed to fetch forecast data" }, { status: 500 })
  }
}
