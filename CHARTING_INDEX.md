# Energy Monitor Client - Charting System Index

## Overview
The Energy Monitor Client features a comprehensive charting system built with multiple visualization libraries and custom components for energy data analysis and monitoring.

## Core Charting Libraries

### 1. **Chart.js & react-chartjs-2**
- **Primary library** for time-series and real-time data visualization
- Used in: `SampleChart`, `MultiVariableChart`, `DeviceMultiVariableChart`
- **Registered components:**
  - CategoryScale, LinearScale, TimeScale
  - PointElement, LineElement
  - Title, Tooltip, Legend, Filler
- **Date adapter:** `chartjs-adapter-date-fns`

### 2. **Recharts**
- **Secondary library** for statistical and energy consumption charts
- Used in: `EnergyBarChart`, `EnergyPieChart`
- **Components used:**
  - BarChart, Bar, PieChart, Pie
  - XAxis, YAxis, Tooltip, CartesianGrid
  - ResponsiveContainer, ReferenceLine, Cell

## Chart Components Architecture

### Core Chart Components

#### 1. **SampleChart** (`/components/SampleChart.tsx`)
**Purpose:** Single variable time-series visualization
- **Chart Type:** Line chart with temporal data
- **Features:**
  - Time range selection (24h, 3d, 7d, 1m, 3m)
  - Dynamic time scaling with sparse data handling
  - Interactive tooltips with units
  - Loading/error states with retry functionality
  - Export capabilities
- **Data Source:** Individual variable via `scadaAPI.getDeviceCharts()`
- **Dependencies:** Chart.js, date-fns adapter

#### 2. **MultiVariableChart** (`/components/MultiVariableChart.tsx`)
**Purpose:** Cross-variable comparison and correlation analysis
- **Chart Type:** Multi-line chart with variable selection
- **Features:**
  - Variable selection interface (max 8 variables)
  - Data normalization (0-100% scale)
  - Custom date/time range picker
  - Aggregation periods (hour/day/week/month)
  - Legend toggle, synchronized tooltips
  - Device grouping with variable filtering
- **Data Source:** Multiple variables via concurrent API calls
- **Color System:** Predefined 12-color palette with transparency

#### 3. **DeviceMultiVariableChart** (`/components/DeviceMultiVariableChart.tsx`)
**Purpose:** Device-centric variable analysis
- **Chart Type:** Device-grouped multi-line charts
- **Features:**
  - Device selection with variable counts
  - Individual chart per device
  - Data normalization toggle
  - Date range selection with period aggregation
  - Auto-selection of first 4 devices
  - Variable filtering by enabled status
- **Data Source:** Device-based variable grouping
- **Layout:** Grid of individual device charts

#### 4. **EnergyBarChart** (`/components/EnergyBarChart.tsx`)
**Purpose:** Energy consumption analysis with performance metrics
- **Chart Type:** Enhanced bar chart with statistics
- **Features:**
  - Performance categorization (optimal/normal/high)
  - Statistical calculations (total, average, max, std dev)
  - Trend analysis with color coding
  - Reference line for average consumption
  - Export to CSV functionality
  - Advanced tooltip with efficiency metrics
- **Themes:** Blue, Green, Purple, Orange
- **Analytics:** Variance calculation and trend indicators

#### 5. **EnergyPieChart** (`/components/EnergyPieChart.tsx`)
**Purpose:** Energy distribution breakdown by category
- **Chart Type:** Pie chart with gradient fills
- **Features:**
  - Percentage calculations
  - Animated rendering (2s duration)
  - Gradient color fills
  - Interactive hover effects
  - Glass-morphism design
- **Styling:** Backdrop blur, linear gradients, shadow effects

## Data Management & Hooks

### 1. **useChartData Hook** (`/hooks/useChartData.ts`)
**Purpose:** Single variable data management with auto-refresh
- **Features:**
  - Automatic data fetching on dependency changes
  - Configurable auto-refresh (default: 30s)
  - Date range management with start/end dates
  - Separate aggregation period control
  - Error handling and loading states
  - Manual refresh capability
- **Return Values:** data, loading, error, dateRange, aggregationPeriod, setDateRange, setAggregationPeriod, refresh, lastUpdate

### 2. **useMultipleCharts Hook** (`/hooks/useChartData.ts`)
**Purpose:** Multi-variable data management with concurrent fetching
- **Features:**
  - Concurrent API calls for multiple variables
  - Individual loading/error states per variable
  - Shared date range and aggregation period configuration
  - Batch refresh functionality
- **State Management:** `ChartDataState` object keyed by variable ID

## API Integration

### Chart Data Interfaces

#### **SampleChartData** (`/lib/api.ts`)
```typescript
interface SampleChartData {
  x: string; // ISO timestamp
  y: number; // aggregated value
}
```

#### **ChartQueryParams** (`/lib/api.ts`)
```typescript
interface ChartQueryParams {
  startTime: string;      // ISO timestamp
  endTime: string;        // ISO timestamp  
  period: "hour" | "day" | "week" | "month"; // aggregation period
}
```

### API Endpoints
- **`scadaAPI.getDeviceCharts(variableId, params)`**
  - Fetches time-series data for specific variable
  - Returns `ApiResponse<SampleChartData[]>`
  - Supports time range and aggregation parameters

## Chart Features & Functionality

### Time Management
- **Time Scales:** Hour, Day, Week, Month aggregation
- **Range Selection:** DatePicker components for precise start/end date selection
- **Standardized Structure:** All charts use `startDate`/`endDate` with separate `aggregationPeriod`
- **Timezone Handling:** Local time display with ISO storage
- **Consistent UX:** Uniform date range and period controls across all chart components

### Interactive Features
- **Tooltips:** Custom-styled with device/variable context
- **Legends:** Toggleable with device + variable naming
- **Zoom/Pan:** Native Chart.js interactions
- **Hover Effects:** Color changes and enhanced visibility

### Data Processing
- **Normalization:** 0-100% scaling for comparison
- **Filtering:** Invalid data point removal
- **Aggregation:** Server-side time-based grouping
- **Validation:** Type checking and NaN filtering

### Styling & Themes
- **Color Palettes:** 
  - Chart.js: 8-color variable palette
  - Energy charts: 6-color COLORS array
  - Themed colors for EnergyBarChart
- **Responsive Design:** ResponsiveContainer, mobile-friendly
- **Modern UI:** Glass-morphism, gradients, shadows

## Page Integration

### Analytics Page (`/app/dashboard/analytics/page.tsx`)
**Chart Usage:**
- `MultiVariableChart` - Cross-variable analysis
- `DeviceMultiVariableChart` - Device-focused analysis
- `EnergyBarChart` - Daily/hourly consumption (3 instances)
- `EnergyPieChart` - Energy distribution
- `ReportGenerator` - Export functionality

### Monitor Page (Inferred)
**Expected Usage:**
- `SampleChart` - Real-time variable monitoring
- Real-time data hooks integration

## Data Flow Architecture

### 1. **Component Level**
```
Component → useChartData/useMultipleCharts → scadaAPI → Backend
```

### 2. **State Management**
- Local component state for UI controls
- Custom hooks for data management
- API client for HTTP operations
- Error boundaries and loading states

### 3. **Real-time Updates**
- Auto-refresh intervals (configurable)
- Manual refresh buttons
- WebSocket integration (via separate hooks)
- State synchronization across components

## Configuration & Customization

### Chart.js Configuration
- **Responsive:** `maintainAspectRatio: false`
- **Interactions:** Nearest point, x-axis intersection
- **Elements:** Line tension 0.1-0.2, point radius 3-6
- **Scales:** Time-based with custom formatters

### Color Systems
- **Variable Colors:** 8-color rotation system
- **Performance Colors:** Red (high), Blue/Theme (normal), Green (optimal)
- **Gradients:** Linear gradients for visual enhancement

### Performance Optimizations
- **Concurrent API calls** for multi-variable charts
- **Data filtering** before rendering
- **Memoized calculations** in components
- **Proper cleanup** in useEffect hooks

## File Structure Summary

```
/components/
├── SampleChart.tsx              # Single variable time-series
├── MultiVariableChart.tsx       # Cross-variable comparison  
├── DeviceMultiVariableChart.tsx # Device-grouped analysis
├── EnergyBarChart.tsx          # Energy consumption bars
└── EnergyPieChart.tsx          # Energy distribution pie

/hooks/
└── useChartData.ts             # Data management hooks

/lib/
└── api.ts                      # API interfaces & client

/app/
├── dashboard/analytics/page.tsx # Main analytics page
└── mock/energy.js              # Mock data for development
```

## Dependencies

### Core Charting
- `chart.js` - Chart.js library
- `react-chartjs-2` - React wrapper for Chart.js
- `chartjs-adapter-date-fns` - Date adapter
- `date-fns` - Date utility library
- `recharts` - React charting library

### UI Components  
- `react-datepicker` - Date range selection
- `lucide-react` - Icons for UI elements

### Styling
- `tailwindcss` - Utility-first CSS framework

## Future Enhancements
- Real-time streaming charts
- Advanced filtering and search
- Chart export formats (PNG, PDF)
- Dashboard customization
- Performance optimization for large datasets
- Mobile-specific chart adaptations