# Modern Weather App

A beautiful, responsive weather application built with React, Next.js, and Tailwind CSS.

## Features

- 🌤️ Real-time weather data from OpenWeatherMap API
- 📱 Fully responsive design with glass morphism effects
- 🎨 Dynamic background gradients based on weather conditions
- 📍 Automatic location detection with geolocation API
- 📊 5-day weather forecast
- 🔍 City search functionality
- ⚡ Fast loading with optimized performance

## Setup Instructions

### 1. Get Your OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to the API keys section
4. Copy your API key

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your API key:

\`\`\`env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
\`\`\`

**Important:** Replace `your_api_key_here` with your actual OpenWeatherMap API key.

### 3. Installation

\`\`\`bash
# Install dependencies
npm install

# Run the development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
weather-app/
├── app/
│   ├── globals.css          # Global styles and theme
│   ├── layout.tsx           # Root layout
│   └── page.jsx             # Main app component
├── components/
│   └── WeatherCard.jsx      # Weather display component
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies
└── README.md               # This file
\`\`\`

## Weather Conditions & Backgrounds

The app dynamically changes its background gradient based on weather conditions:

- ☀️ **Sunny/Clear**: Golden yellow gradient
- ☁️ **Cloudy**: Gray gradient
- 🌧️ **Rainy**: Blue gradient
- ❄️ **Snowy**: Light gray gradient
- ⛈️ **Stormy**: Dark gray gradient

## API Usage

The app uses the OpenWeatherMap API with the following endpoints:

- Current weather: `https://api.openweathermap.org/data/2.5/weather`
- 5-day forecast: `https://api.openweathermap.org/data/2.5/forecast`

All temperatures are displayed in Celsius (`units=metric`).

## Browser Support

- Modern browsers with ES6+ support
- Geolocation API support for automatic location detection
- CSS backdrop-filter support for glass morphism effects

## License

MIT License - feel free to use this project for learning or personal use.
