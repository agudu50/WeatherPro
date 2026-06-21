import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const city = searchParams.get('city')

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' }, 
      { status: 500 }
    )
  }

  try {
    let url = 'https://api.openweathermap.org/data/2.5/weather?'
    
    if (lat && lon) {
      url += `lat=${lat}&lon=${lon}`
    } else if (city) {
      url += `q=${encodeURIComponent(city)}`
    } else {
      return NextResponse.json({ error: 'Location required' }, { status: 400 })
    }
    
    url += `&appid=${API_KEY}&units=metric`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' }, 
      { status: 500 }
    )
  }
}
