# Health Equity NYC - AI Coding Agent Instructions

## Project Overview

Health Equity NYC is a Next.js 15 community health dashboard that aggregates NYC health and environmental data to help residents, advocates, and health workers understand neighborhood-level health disparities. The app emphasizes **plain-language accessibility** for non-technical users while providing data-driven insights.

**Key Mission**: Transform complex public health data into actionable community knowledge using AI-powered analysis and intuitive visualizations.

## Architecture & Tech Stack

### Frontend Architecture
- **Next.js 15** with React 19, TypeScript, App Router (`app/` directory)
- **Styling**: Tailwind CSS + shadcn/ui component library (Radix UI primitives)
- **State Management**: React hooks (useState, useEffect) - no Redux/Zustand
- **Data Visualization**: Recharts for charts, React-Leaflet for maps
- **AI Integration**: Vercel AI SDK with Google Gemini/OpenAI for health analysis

### Key Architectural Patterns

**1. Filter-Driven Data Architecture**
The entire dashboard revolves around `FilterState` (see `types/index.ts`):
```typescript
interface FilterState {
  healthConditions: string[]      // Primary driver - conditions like "Diabetes", "Hypertension"
  geographic: { boroughs, neighborhoods }
  demographics: { ageGroups, ethnicities, incomeRanges }
  environmental: { airQuality, greenSpace, foodAccess, transitAccess, housingQuality }
}
```
- Filters cascade through components as props, not context
- Main dashboard (`app/page.tsx`) generates **mock data locally** based on filters using `HEALTH_CONDITION_RATES` constant
- API routes fetch real data but often fall back to mock data due to API reliability issues

**2. API Route Pattern: "Safe Fetch with Mock Fallback"**
Every API route in `app/api/` follows this pattern:
```typescript
try {
  const response = await fetch(EXTERNAL_API_URL)
  if (!response.ok) throw new Error()
  return NextResponse.json({ success: true, data })
} catch (error) {
  // ALWAYS return mock data as fallback
  return NextResponse.json({ success: false, data: mockData, error })
}
```
**Critical**: Never throw errors to the client. Always return structured JSON with `success: boolean` flag.

**3. Component Communication Flow**
```
app/page.tsx (main dashboard)
  ├── FilterPanel (left sidebar) - emits filter changes
  ├── DataVisualizations - receives filters + data
  ├── MapDisplay - receives healthData + boroughData
  └── AISummary - receives filters + comprehensiveData, calls /api/ai/analyze
```

## Development Workflows

### Getting Started
```bash
# Clone the repository
git clone https://github.com/CurlyCr8tive/Health-Equity-NYC-V4.git
cd Health-Equity-NYC-V4

# Install dependencies
pnpm install
```

### Running the App
```bash
pnpm dev        # Start dev server on localhost:3000
pnpm build      # Production build (checks TypeScript/ESLint)
pnpm start      # Run production build
```

**Important**: `next.config.mjs` has `ignoreDuringBuilds: true` for TypeScript/ESLint to prioritize deployment velocity over strict type safety.

### Working with UI Components
- **All UI components** are in `components/ui/` (shadcn/ui)
- Use `cn()` utility from `lib/utils.ts` for conditional Tailwind classes
- Import pattern: `import { Button } from "@/components/ui/button"`
- Never modify `components/ui/*` directly - regenerate via `npx shadcn-ui add <component>`

### Data Fetching Conventions

**Custom Hooks Pattern** (`hooks/` directory):
- `use-cdc-health-data.ts` - CDC PLACES API
- `use-nyc-data.ts` - NYC Open Data
- `use-environmental-data.ts` - Environmental factors
- `use-perplexity-insights.ts` - Real-time AI research

Each hook returns: `{ data, loading, error, isEmpty }`

**API Routes**:
- `/api/cdc-health-data` - CDC health conditions
- `/api/nyc-data/combined` - Aggregates multiple NYC Open Data endpoints
- `/api/ai/analyze` - AI-powered health analysis (Gemini/OpenAI)
- `/api/perplexity/health-insights` - Real-time health research

### Mock Data Strategy
When external APIs fail (common), use mock data generators:
- `HEALTH_CONDITION_RATES` in `app/page.tsx` - Borough-level health rates
- `lib/mock-data.ts` - Comprehensive mock datasets
- Always log when using mock data: `console.log("🔄 Using mock data fallback")`

## Project-Specific Conventions

### 1. Plain Language First
This app serves non-technical community members. Always:
- Use terms like "out of 100 neighbors" instead of "prevalence rate"
- Replace "elevated prevalence" → "more people affected"
- Include "What This Means" and "What You Can Do" sections in analysis
- See `DEFAULT_NYC_DATA` in `app/page.tsx` for tone examples

### 2. Borough-Centric Data Model
NYC has 5 boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island):
- Borough selection is THE primary filter after health conditions
- All health rates are pre-calculated per borough in `HEALTH_CONDITION_RATES`
- Borough comparisons are core feature (see "Compare Areas" tab)
- Never use ZIP codes as primary identifier - boroughs + neighborhoods

### 3. Environmental Justice Integration
Health conditions are ALWAYS analyzed alongside environmental factors:
- `filters.environmental` toggles: airQuality, greenSpace, foodAccess, transitAccess, housingQuality
- Environmental data adds 2-5% to health risk calculations (see `getCommunityInsights()` in `app/page.tsx`)
- Bronx has highest environmental risk multiplier (1.5x)

### 4. AI Analysis Conventions
When calling `/api/ai/analyze`:
- Prompt emphasizes "health equity", "disparities", "community-actionable"
- Always request JSON output with structure: `{ summary, insights, recommendations, correlations, topConcerns }`
- Check `process.env.GOOGLE_GENERATIVE_AI_API_KEY` first, fallback to OpenAI
- Include borough context explicitly in prompts

### 5. TypeScript Patterns
- `types/index.ts` is the single source of truth for interfaces
- Many components have legacy `borough?: string` props alongside new `geographic.boroughs` - support both
- Use type assertions sparingly: `item.borough as keyof typeof HEALTH_CONDITION_RATES`

## Common Pitfalls & Solutions

### Issue: "API returns empty data"
**Solution**: This is expected behavior. NYC Open Data and CDC APIs are unreliable. Always implement mock fallback:
```typescript
const data = await fetchRealData().catch(() => getMockData())
```

### Issue: "Map not rendering"
**Solution**: Leaflet requires dynamic import in Next.js:
```typescript
const MapComponent = dynamic(() => import('./map-component'), { ssr: false })
```

### Issue: "Filters not updating data"
**Solution**: Check `useEffect` dependencies. Most data hooks depend on `filters.healthConditions` and `filters.borough`:
```typescript
useEffect(() => { /* fetch */ }, [filters.healthConditions, filters.borough])
```

### Issue: "TypeScript errors during build"
**Solution**: `next.config.mjs` ignores TS errors during builds. Fix locally but don't block on them for deployment.

## Key Files to Reference

- `app/page.tsx` - **Main dashboard logic**, 807 lines, contains all data generation functions
- `types/index.ts` - **Interface definitions** for FilterState, HealthData, etc.
- `components/filter-panel.tsx` - **Filter UI**, 672 lines, defines all health conditions
- `app/api/ai/analyze/route.ts` - **AI analysis endpoint**, handles Gemini/OpenAI
- `hooks/use-cdc-health-data.ts` - **Example data fetching hook** with error handling

## Environment Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=<gemini-key>  # Primary AI provider
OPENAI_API_KEY=<openai-key>                # Fallback AI provider
NEXT_PUBLIC_APP_TOKEN=<nyc-open-data-token> # Optional, NYC Open Data
```

## Testing Strategy

No formal test suite exists. Manual testing workflow:
1. Select filters in left sidebar
2. Verify data updates in all 5 tabs (Health Spotlight, Data Visualizations, Map, Compare Areas, AI Report)
3. Check console for "🔄" emoji logs indicating data flow
4. Export CSV/PDF to verify data structure

## When Adding New Features

1. **New Health Condition**: Add to `HEALTH_CONDITIONS` array in `components/filter-panel.tsx` AND add rates to `HEALTH_CONDITION_RATES` in `app/page.tsx`
2. **New Environmental Factor**: Add to `filters.environmental` in types, update `generateEnvironmentalDataFromFilters()` function
3. **New Visualization**: Use Recharts components in `components/data-visualizations.tsx`, follow existing chart patterns
4. **New API Endpoint**: Copy `/api/cdc-health-data/route.ts` structure, implement mock fallback

## Deployment Context

- **GitHub Repository**: https://github.com/CurlyCr8tive/Health-Equity-NYC-V4
- **Primary deployment**: Vercel (auto-deploys from GitHub)
- **Build command**: `pnpm build`
- **Environment**: Node.js 20+
- **Workflow**: Code changes → GitHub push → Vercel auto-deploy
- Originally generated via v0.dev (https://v0.dev/chat/projects/mg77cKYCYGB), now manually maintained

---

**Remember**: This app prioritizes **community accessibility** and **deployment reliability** over technical perfection. Mock data fallbacks and plain language are features, not bugs.
