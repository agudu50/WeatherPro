import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Climafy - Advanced Weather Analytics Dashboard',
  description: 'Access real-time weather alerts, hourly forecasts, radar maps, and advanced air quality indices with Climafy (WeatherPro).',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://openweathermap.org" />
        <link rel="dns-prefetch" href="https://openweathermap.org" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-x-hidden`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
