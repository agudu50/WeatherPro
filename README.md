# 🌤️ WeatherAPP 🚀

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

A lightweight, **mobile-first weather dashboard** built with **Next.js 14** and **Tailwind CSS**.  
It fetches **real-time weather data** from the **OpenWeather API** and delivers a clean, intuitive, and accessible interface — complete with **smooth animations**, **dark/light themes**, and **geolocation support**.  

Perfect for developers looking for a **production-ready starter** or a **quick weather app prototype**.

---

## ✨ Live Demo  

🔗 **[View Live Demo (Deployed on Vercel)](https://climafy-gamma.vercel.app/)**  
🖼️ *(Replace with a GIF or screenshot — host via GitHub Assets, Imgur, or Giphy)*  

---

## 🚀 Features  

- 🌍 **Live Weather Data:** Real-time temperature, humidity, wind, pressure, visibility, and cloud cover.  
- 📅 **Forecasts:** 5-day forecast + 8-hour hourly view with precipitation probability (POP).  
- 🌫️ **Advanced Metrics:** Air Quality Index (AQI) + pollutant breakdown (PM2.5/PM10) + UV Index.  
- 📍 **Smart Location:** Auto GPS detection with fallback to London; coordinates cached for 30 min.  
- 📱 **Responsive Design:** Mobile-optimized layout with horizontal scroll and side navigation sheet.  
- 🌓 **Themes & Units:** Toggle dark/light mode and Celsius/Fahrenheit (persisted via localStorage).  
- 💫 **Animations:** Floating particle backgrounds for a modern, dynamic experience.  
- ♿ **Accessibility:** ARIA-compliant UI; full keyboard and screen-reader support.  
- 🎙️ **Voice Search:** Browser-based speech recognition for hands-free city lookup.  
- ⚠️ **Error Handling:** Graceful fallback for geolocation, API, and offline scenarios.  

---

## 🛠️ Tech Stack  

| Category | Technologies |
|-----------|--------------|
| **Framework** | Next.js 14 (App Router, Server Components) |
| **Styling** | Tailwind CSS 3.4, CSS-in-JS for animations |
| **UI Components** | Radix UI (Dialog/Sheet), Lucide React Icons, shadcn/ui (Card, Badge, Button, Progress) |
| **API Integration** | OpenWeatherMap API (Current, Forecast, Air Pollution, UV) |
| **State & Utils** | React Hooks (`useState`, `useEffect`, `useRef`), localStorage for caching |
| **Build & Deploy** | TypeScript 5.2, ESLint, Vercel (one-click deploy) |

---

## 📋 Prerequisites  

- **Node.js:** v18+ (LTS recommended)  
- **Package Manager:** npm 9+ or Yarn 1.22+  
- **API Key:** Free OpenWeatherMap account  

---

## ⚙️ Environment Setup  

1. Duplicate the example environment file:  
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenWeather API key to `.env.local`:  
   ```env
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```
   > **Note:** The `NEXT_PUBLIC_` prefix exposes it to the client-side for API calls. Keep it secure in production by using server-side proxies for sensitive keys.

---

## 🏗 Installation & Setup

### Clone & Install
```bash
git clone https://github.com/agudu50/weatherapp.git
cd weatherapp
```

**npm:**
```bash
npm install
```

**Yarn:**
```bash
yarn install
```

### Run Locally

**Development** (Hot reload on http://localhost:3000):
- npm: `npm run dev`
- Yarn: `yarn dev`

**Build & Start Production:**

npm:
```bash
npm run build
npm start
```

Yarn:
```bash
yarn build
yarn start
```

---

## 📁 Project Structure

```text
weatherapp/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          # Main dashboard component (mobile-optimized UI)
│   │   └── layout.tsx        # Layout with Sheet trigger and mobile header
│   └── api/                  # API routes (proxies for OpenWeather)
│       ├── weather/route.ts  # Current weather endpoint
│       ├── forecast/route.ts # Forecast data
│       ├── air-quality/route.ts # AQI data
│       └── uv/route.ts       # UV Index
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   │   ├── sheet.tsx         # Custom Radix Sheet with accessibility fixes
│   │   ├── card.tsx          # Weather cards
│   │   └── ...               # Button, Badge, Progress, etc.
│   └── layout/               # Header, particles background
├── lib/                      # Utils (API helpers, utils.ts for temp conversions)
├── public/                   # Static assets (icons, etc.)
├── tailwind.config.js        # Tailwind setup with custom themes
└── README.md                 # You're reading it!
```

---

## ♿ Accessibility & Known Fixes

The app prioritizes **WCAG 2.1 AA compliance**:

- **Screen Reader Support:** Hidden DialogTitle injected into SheetContent for Radix Dialog errors.
- **Keyboard Navigation:** Full tab-focus support in Sheet and controls.
- **Contrast & Spacing:** Tailwind's default ensures 4.5:1 ratios; touch targets ≥ 44px.

**Fixed Issue:** `DialogContent requires a DialogTitle` – Resolved by adding a visually hidden `<Title>` as a child of `<DialogContent>`. Custom props like `showHeader` enable mobile-optimized headers:

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger>Open Menu</SheetTrigger>
  <SheetContent side="left" showHeader title="Navigation" headerContent="App menu options">
    <nav>
      {/* Menu items */}
    </nav>
  </SheetContent>
</Sheet>
```

---

## 📱 Mobile UX Enhancements

- **Adaptive Layout:** Stacks controls vertically on small screens; horizontal scroll for hourly forecast.
- **Geolocation Prompts:** Non-intrusive alerts for permission; accuracy displayed in badges.
- **Performance:** Lazy-loaded forecasts; no-cache headers for live data.
- **PWA Ready:** Add manifest.json and service worker for offline use (future enhancement).

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Geolocation Denied** | Grant browser permissions; app falls back to London (51.5074° N, -0.1278° W). Check console for errors. |
| **API Key Error (401)** | Verify `NEXT_PUBLIC_OPENWEATHER_API_KEY` in `.env.local`; restart dev server. |
| **CORS/Proxy Issues** | Ensure `/api/*` routes proxy OpenWeather correctly (no client-side CORS). |
| **Sheet Not Closing** | Update Radix UI to latest; confirm `onOpenChange` handlers. |
| **Animations Lag** | Reduce particle count in `useEffect` for low-end devices. |

Run `npm run lint` for code issues or check browser console for API logs.

---

## 🌐 Deployment

- **Vercel (Recommended):** Connect GitHub repo; auto-deploys on push. Free tier supports API routes.
- **Netlify:** Drag-drop `out/` folder after `npm run build`.
- **Custom Server:** Use `npm run build` and host on Node/Express.

**Environment vars:** Set `NEXT_PUBLIC_OPENWEATHER_API_KEY` in platform dashboard.

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repo and create a feature branch (`git checkout -b feat/amazing-feature`).
2. Commit changes (`git commit -m 'Add some amazing feature'`).
3. Push to branch (`git push origin feat/amazing-feature`).
4. Open a Pull Request.

**Guidelines:**
- Follow **Conventional Commits**.
- Ensure responsive design (test on mobile).
- Add unit tests for utils (e.g., temp conversions) with Vitest.
- Update README for new features.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by [Anthony Gudu/agudu50]**. Star ⭐ the repo if it helps! Questions? [Open an issue](https://github.com/agudu50/weatherapp/issues).