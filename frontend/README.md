# WasteLess AI — Frontend Web Application

The interactive kitchen operations and waste prevention client for **WasteLess AI**, built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Features & Views

The frontend provides an intuitive, high-contrast dashboard engineered for kitchen managers, dining hall directors, and mess supervisors:

1. **Overview Dashboard (`/`)**:
   - Executive scorecards: Total Prepared (kg), Measured Waste Rate (%), Financial Loss ($), and Rescued Surplus (kg).
   - Real-time **Critical Shelf-Life Warning Banner** alerting on ingredients expiring in $\le 72$ hours.
   - Interactive 10-day preparation vs leftover historical trend area chart.
   - Transparent Data Provenance badges (Differentiating verified kitchen scales vs ML models vs simulated rescue).

2. **AI Waste Predictor & Staged Batch Cooking**:
   - Live scenario inputs: Expected diner headcount, kitchen staff on shift, ambient temperature & humidity, day of week, event flags, and historical waste benchmarks.
   - Dynamic 90% confidence uncertainty interval bounds (`[lower, upper]`).
   - Staged batch cooking recommendations (65% initial prep, 35% contingent midpoint prep) with a configurable safety buffer (e.g. +5% standard) to protect against food shortages.
   - Audited kitchen manager override tool with SQLite ledger recording operational adjustments.

3. **Kitchen Waste Logs**:
   - Scale-based physical service logging: planned diners, prepared kg, served kg, leftover kg, and automated waste percentage.
   - Categorized waste reason classification (Overpreparation, Low Attendance, Quality/Spoilage, Portion Size).
   - Instant search and date-range filtering.

4. **Inventory & Shelf-Life Tracker**:
   - Automatic deterministic status calculation:
     - 🔴 `Expired`: Past use-by date.
     - 🟠 `Expiring Soon`: 1 to 3 days remaining.
     - 🟡 `Low Stock`: Current quantity at or below minimum threshold.
     - 🟢 `Safe`: Optimal stock conditions.
   - Quick one-click $+10$ kg restock and $-5$ kg consumption buttons.

5. **Surplus Food Rescue & Pickup Hub**:
   - Multi-stage food donation state machine:
     `pending_review` ➔ `available` ➔ `claimed` ➔ `collected`.
   - Mandatory food safety verification sign-off by head chef before publishing.
   - Recipient organization assignment and collection verification codes.

6. **Model Insights & Benchmark Validation**:
   - Full tabular ML performance report comparing Ridge Regression, Random Forest, HistGradientBoosting, and Dummy Baseline.
   - Waste distribution by food category (Meat, Dairy, Vegetables, Grains) and meal type (Breakfast, Lunch, Dinner, Snacks).
   - Root cause attribution analytics.

7. **System Diagnostics & Seed Controls**:
   - Kitchen profile configuration and capacity limits.
   - Safety buffer margin and warning threshold adjustments.
   - One-click **Seed Demo Data** and **Reset Database** buttons for operational testing.

---

## 🛠️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Bundler & Dev Server**: Vite 8
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm 9.x or later

### Installation
```bash
# From the frontend directory
npm install
```

### Running Locally (Development)
```bash
npm run dev
```
The application will start at `http://localhost:5173/`. 
All `/api/*` requests are automatically proxied to the FastAPI backend running at `http://127.0.0.1:8001`.

### Production Build
```bash
npm run build
```
Type checks via `tsc -b` and bundles optimized production assets into `dist/`.

---

## 📁 Directory Structure

```
frontend/
├── public/                 # Static assets & favicon
├── src/
│   ├── assets/             # Images and design assets
│   ├── components/         # Reusable UI widgets, banners, scorecards
│   ├── views/              # 7 Primary operational views
│   │   ├── DashboardView.tsx
│   │   ├── PredictView.tsx
│   │   ├── WasteLogsView.tsx
│   │   ├── InventoryView.tsx
│   │   ├── SurplusRescueView.tsx
│   │   ├── InsightsView.tsx
│   │   └── SettingsView.tsx
│   ├── services/           # Typed API client services
│   ├── types/              # TypeScript interface & enum definitions
│   ├── App.tsx             # Root application shell & router
│   ├── main.tsx            # DOM mounting entrypoint
│   └── index.css           # Tailwind CSS directives & custom styling
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts          # Vite configuration with API reverse proxy
```
