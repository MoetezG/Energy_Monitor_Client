# Style Index & Design System

## Current Style Analysis

### Color Palette
- **Primary**: `#F28707` (Orange) - CSS variable `--primary-color`
- **Secondary**: `#71A700` (Green) - CSS variable `--secondary-color`
- **Chart Colors**: 
  - Blue: `#3b82f6`
  - Emerald: `#10b981` 
  - Purple: `#8b5cf6`
  - Amber: `#f59e0b`
  - Red: `#ef4444`
  - Cyan: `#06b6d4`

### Inconsistencies Found

#### 1. Card Styling
**Current Patterns:**
- `bg-white rounded-xl shadow-lg border border-gray-200` (MultiVariableChart)
- `bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl` (EnergyPieChart)
- `bg-white rounded-lg p-6` (DeviceDeleteModal)
- `relative w-full max-w-md transform rounded-2xl bg-white shadow-xl` (DeviceDeleteModal)

**Issues:**
- Inconsistent border radius (lg, xl, 2xl, 3xl)
- Inconsistent shadow depths
- Mixed use of backdrop-blur
- Different padding patterns

#### 2. Button Styling
**Current Patterns:**
- `px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700`
- `px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50`

#### 3. Modal/Overlay Styling
**Current Patterns:**
- `fixed inset-0 z-50 overflow-y-auto`
- `fixed inset-0 backdrop:blur-3xl flex items-center justify-center z-50`

#### 4. Status Indicators
**Current Patterns:**
- `w-3 h-3 rounded-full` with color classes
- Various animation patterns (pulse, ping)

## Unified Design System

### 1. Core CSS Variables
```css
:root {
  /* Brand Colors */
  --primary: #F28707;
  --secondary: #71A700;
  --accent: #3b82f6;
  
  /* Neutral Colors */
  --background: #ffffff;
  --surface: #f8fafc;
  --surface-elevated: #ffffff;
  --border: #e2e8f0;
  --border-subtle: #f1f5f9;
  
  /* Text Colors */
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
```

### 2. Component Classes

#### Card Components
```css
/* Base Card */
.card {
  @apply bg-white rounded-lg shadow border border-gray-200 overflow-hidden;
}

/* Elevated Card */
.card-elevated {
  @apply bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden;
}

/* Interactive Card */
.card-interactive {
  @apply bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden 
         hover:shadow-xl transition-shadow duration-200;
}

/* Glass Card */
.card-glass {
  @apply bg-white/95 backdrop-blur-sm rounded-xl shadow-lg 
         border border-gray-200/50 overflow-hidden;
}
```

#### Button Components
```css
/* Primary Button */
.btn-primary {
  @apply px-4 py-2 bg-primary text-white rounded-lg font-medium
         hover:opacity-90 disabled:opacity-50 transition-all duration-200;
}

/* Secondary Button */
.btn-secondary {
  @apply px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium
         hover:bg-gray-50 disabled:opacity-50 transition-all duration-200;
}

/* Destructive Button */
.btn-destructive {
  @apply px-4 py-2 bg-red-600 text-white rounded-lg font-medium
         hover:bg-red-700 disabled:opacity-50 transition-all duration-200;
}

/* Icon Button */
.btn-icon {
  @apply p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200;
}
```

#### Status Indicators
```css
/* Status Dot */
.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-online {
  @apply bg-green-400 animate-pulse;
}

.status-offline {
  @apply bg-red-400;
}

.status-warning {
  @apply bg-yellow-400;
}

.status-unknown {
  @apply bg-gray-400;
}
```

#### Modal Components
```css
/* Modal Overlay */
.modal-overlay {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
         flex items-center justify-center p-4;
}

/* Modal Content */
.modal-content {
  @apply bg-white rounded-xl shadow-xl border border-gray-200 
         w-full max-w-md transform transition-all;
}
```

### 3. Layout Patterns

#### Container
```css
.container-main {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.container-section {
  @apply max-w-4xl mx-auto px-4 sm:px-6;
}
```

#### Grid Layouts
```css
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.grid-auto-fit {
  @apply grid gap-6;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### 4. Typography Scale

```css
.text-display {
  @apply text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900;
}

.text-heading-1 {
  @apply text-2xl md:text-3xl font-bold text-gray-900;
}

.text-heading-2 {
  @apply text-xl md:text-2xl font-semibold text-gray-900;
}

.text-heading-3 {
  @apply text-lg md:text-xl font-semibold text-gray-900;
}

.text-body {
  @apply text-base text-gray-700;
}

.text-caption {
  @apply text-sm text-gray-600;
}

.text-micro {
  @apply text-xs text-gray-500;
}
```

### 5. Animation Standards

```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-bounce-gentle {
  animation: bounceGentle 2s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(1rem); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes bounceGentle {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -0.5rem, 0);
  }
  70% {
    transform: translate3d(0, -0.25rem, 0);
  }
}
```

## Implementation Plan

### Phase 1: Update Global Styles
1. Update `globals.css` with unified CSS variables
2. Add utility classes for common patterns
3. Standardize animations

### Phase 2: Component Refactoring
1. **High Priority:**
   - DeviceMultiVariableChart.tsx
   - DeviceSelector.tsx
   - EnergyPieChart.tsx
   - SystemStatusIndicator.tsx

2. **Medium Priority:**
   - DeviceDeleteModal.tsx
   - DeviceValuesDisplay.tsx
   - VariableEditModal.tsx

### Phase 3: Layout Standardization
1. Dashboard pages
2. Auth pages
3. Component spacing and alignment

### Phase 4: Documentation
1. Component library documentation
2. Usage examples
3. Design tokens reference