# Modern Weather Dashboard

A comprehensive dashboard application built with Next.js 15, React, TypeScript, and Tailwind CSS, featuring weather integration, analytics, user management, and more.

## 🚀 Features

### Weather Integration
- **Real-time weather data** with OpenWeatherMap API
- **Geolocation support** for automatic location detection
- **Weather details** including temperature, humidity, wind speed
- **Weather cards** integrated into the main dashboard
- **Dedicated weather page** with detailed forecasts

### Dashboard Features
- **Analytics Dashboard** with interactive charts using Recharts
- **User Management** with CRUD operations and filtering
- **Project Progress** tracking with visual progress bars
- **KPI Cards** showing key metrics and statistics
- **Responsive Design** optimized for desktop and mobile
- **Modern UI** using shadcn/ui components

### Additional Pages
- **Calendar** for schedule management
- **Orders** management system
- **Settings** panel for configuration
- **Landing Page** showcasing features

## 🛠️ Tech Stack

- **Framework:** Next.js 15.2.4 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Weather API:** OpenWeatherMap

## 📦 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd weather-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_api_key_here
```

4. **Get your OpenWeatherMap API key**
- Go to [OpenWeatherMap API](https://openweathermap.org/api)
- Sign up for a free account
- Generate an API key
- Replace `your_api_key_here` in `.env.local` with your actual API key

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🌟 Usage

### Dashboard Navigation
- **Dashboard**: Main overview with KPIs and weather integration
- **Analytics**: Data visualization and charts
- **Users**: User management interface
- **Weather**: Detailed weather information and forecasts
- **Calendar**: Schedule and event management
- **Orders**: Order tracking and management
- **Settings**: Application configuration

### Weather Features
- The dashboard automatically detects your location for weather data
- Weather information is displayed in multiple places:
  - Welcome section with current conditions
  - Weather card in the main dashboard grid
  - Dedicated weather page with detailed information
- If geolocation fails, it defaults to London weather

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY`: Your OpenWeatherMap API key (required)

### API Limits
- Free OpenWeatherMap accounts include:
  - 1,000 API calls per day
  - 60 calls per minute
  - Current weather and 5-day forecast

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## 🚀 Deployment

### Deploy on Vercel
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
Make sure to add `NEXT_PUBLIC_OPENWEATHERMAP_API_KEY` in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Recharts](https://recharts.org)

## 📞 Support

If you have any questions or need help setting up the application, please open an issue in the GitHub repository.