# WeatherAPP

Lightweight Next.js + Tailwind weather dashboard that fetches live data from OpenWeather and provides a mobile-first UI with an accessible sheet/sidebar component.

## Features

- Live current weather (OpenWeather)
- 5-day and hourly forecast
- Air Quality (AQI) and UV Index
- Mobile-first responsive UI and animated background
- Accessible mobile side navigation (Sheet) with Radix Dialog fixes
- Dark / light theme and unit toggle (C/F)
- Local caching of last known coordinates and preferences

## Prerequisites

- Node.js 18+ (recommended)
- npm or yarn
- OpenWeather API key

## Environment

Create a `.env.local` in the project root:

\`\`\`env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key_here
\`\`\`

## Setup

Install dependencies:

- npm
  \`\`\`bash
  npm install
  \`\`\`

- yarn
  \`\`\`bash
  yarn
  \`\`\`

## Development

Start the dev server:

- npm
  \`\`\`bash
  npm run dev
  \`\`\`

- yarn
  \`\`\`bash
  yarn dev
  \`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Build

- npm
  \`\`\`bash
  npm run build
  npm start
  \`\`\`

- yarn
  \`\`\`bash
  yarn build
  yarn start
  \`\`\`

## Important files

- app/dashboard/page.tsx — main dashboard UI (mobile optimized)
- app/dashboard/layout.tsx — layout + sheet trigger / mobile header
- components/ui/sheet.tsx — Radix-based Sheet component (accessibility fixes)
- components/ui/* — UI primitives (Card, Badge, Button, etc.)
- pages/api/weather (or app/api/weather) — server-side proxy for OpenWeather (if present)

## Accessibility / Known Issue

An earlier runtime console error reported:
`DialogContent requires a DialogTitle...`

This repository includes a fix in `components/ui/sheet.tsx`:

- A Radix Title is injected as a visually hidden fallback inside SheetContent to satisfy screen readers.
- The component also supports a visible header optimized for mobile via props:
  - `showHeader` (boolean) — when true renders a mobile top bar with a close button
  - `title` / `headerContent` — visible title and short description

Usage example (mobile nav):

```tsx
<Sheet>
  <SheetTrigger>...</SheetTrigger>
  <SheetContent side="left" showHeader title="Menu" headerContent="Navigation">
    {/* nav items */}
  </SheetContent>
</Sheet>
```

## Mobile UX tips

- Side nav renders full width on small screens and constrained on larger screens.
- Hourly forecast uses horizontal scrolling for small widths.
- Touch targets are sized for mobile and header controls stack for compact screens.

## Troubleshooting

- Geolocation fails: ensure browser location permission is granted. The app falls back to London (51.5074, -0.1278).
- Missing API key: ensure NEXT_PUBLIC_OPENWEATHER_API_KEY is set.
- CORS / Proxy: If using a serverless proxy, confirm API route path `/api/weather` exists and forwards to OpenWeather securely.

## Contributing

- Create a branch, make changes, open a PR.
- Keep UI responsive and accessible.
- Add tests for non-trivial logic where possible.

## License

MIT
