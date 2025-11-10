# Energy Monitor SCADA Client

A Next.js-based client application for monitoring SCADA devices and managing energy data in real-time.

## Features

### ✅ Device Management System
- **Device Discovery**: Automatically fetch available SCADA devices from `/api/scada/device-list`
- **Variable Selection**: Select specific variables from each device for monitoring
- **Database Integration**: Save selected devices and variables to the database
- **Real-time Monitoring**: Live data updates from SCADA devices

### ✅ Real-time Data Display
- **Live Values**: Real-time display of device variables
- **Configurable Refresh**: Adjustable refresh intervals (1s to 30s)
- **Multi-device Support**: Monitor multiple devices simultaneously
- **Error Handling**: Robust error handling and retry mechanisms

## API Integration

### Endpoints Used

1. **Get Device List**
   ```
   GET /api/scada/device-list
   ```
   Response:
   ```json
   {
     "devices": {
       "id": ["line", "temp", "th"]
     }
   }
   ```

2. **Get Device Values**
   ```
   GET /api/scada/device-value?id=line&id=temp&id=th
   ```
   Response:
   ```json
   {
     "values": {
       "variable": [
         {
           "id": "line.DESCRIPTION",
           "value": 0
         },
         {
           "id": "line.DO1",
           "value": 1
         }
       ]
     }
   }
   ```

3. **Save Devices to Database**
   ```
   POST /api/scada/add-devices
   ```
   Body:
   ```json
   {
     "devices": [
       {
         "id": "line",
         "name": "Line Device",
         "variables": [
           {
             "id": "line.DESCRIPTION",
             "value": 0,
             "selected": true
           }
         ],
         "selected": true
       }
     ]
   }
   ```

## File Structure

```
client/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── devices/
│   │   │   └── page.tsx          # Device management page
│   │   └── monitor/
│   │       └── page.tsx          # Real-time monitoring page
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DeviceSelector.tsx        # Device selection component
│   └── DeviceValuesDisplay.tsx   # Real-time values display
├── hooks/
│   ├── useDeviceData.ts          # Device data management hook
│   └── useWebSocket.ts           # WebSocket hook (existing)
├── lib/
│   └── api.ts                    # API client and SCADA endpoints
└── public/
```

## Components

### DeviceSelector
Interactive component for selecting SCADA devices and their variables.

**Features:**
- Fetches available devices from API
- Loads device variables on selection
- Checkbox selection for devices and variables
- Real-time variable value display
- Error handling and loading states

**Usage:**
```tsx
import DeviceSelector from '@/components/DeviceSelector';

<DeviceSelector 
  onDevicesSelected={(devices) => console.log(devices)} 
/>
```

### DeviceValuesDisplay
Real-time display component for monitoring device values.

**Features:**
- Configurable refresh intervals
- Grouped display by device
- Manual refresh capability
- Live status indicators
- Error handling and retry

**Usage:**
```tsx
import DeviceValuesDisplay from '@/components/DeviceValuesDisplay';

<DeviceValuesDisplay 
  deviceIds={['line', 'temp']}
  refreshInterval={5000}
/>
```

## API Client Extensions

### SCADA API Methods
Added to `lib/api.ts`:

```typescript
export const scadaAPI = {
  // Get list of available SCADA devices
  getDeviceList: () => Promise<ApiResponse<ScadaDeviceList>>;
  
  // Get values for selected devices
  getDeviceValues: (deviceIds: string[]) => Promise<ApiResponse<DeviceValues>>;
  
  // Add selected devices and their variables to database
  addDevicesToDatabase: (devices: SelectedDevice[]) => Promise<ApiResponse>;
};
```

### Type Definitions
```typescript
interface ScadaDevice {
  id: string;
  name?: string;
  type?: string;
  status?: 'online' | 'offline';
}

interface DeviceVariable {
  id: string;
  value: number | string | boolean;
  selected?: boolean;
}

interface SelectedDevice {
  id: string;
  name?: string;
  variables: DeviceVariable[];
  selected: boolean;
}
```

## Pages

### Device Management (`/dashboard/devices`)
Complete device management interface with:
- Device discovery and selection
- Variable selection for each device
- Save configuration to database
- Selection summary and validation

### Real-time Monitoring (`/dashboard/monitor`)
Live monitoring dashboard with:
- Device selection for monitoring
- Real-time value updates
- Configurable refresh intervals
- Multi-device display

### Main Dashboard (`/dashboard`)
Updated with navigation to new features:
- Links to device management
- Links to real-time monitoring
- Feature status indicators

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Main Dashboard: http://localhost:3000/dashboard
   - Device Management: http://localhost:3000/dashboard/devices
   - Real-time Monitoring: http://localhost:3000/dashboard/monitor

## Usage Workflow

1. **Configure Devices**
   - Go to `/dashboard/devices`
   - Select devices from the available list
   - Choose variables to monitor for each device
   - Save configuration to database

2. **Monitor Real-time Data**
   - Go to `/dashboard/monitor`
   - Select devices to monitor
   - Set refresh interval
   - View live data updates

3. **Manage Settings**
   - Return to device management to modify configuration
   - Add or remove devices and variables as needed

## Error Handling

The system includes comprehensive error handling:
- Network error recovery with retry mechanisms
- API response validation
- User-friendly error messages
- Loading states for better UX

## Future Enhancements

- Historical data charts and analytics
- Device alerts and notifications
- Data export functionality
- Custom dashboard layouts
- Device status monitoring
- Advanced filtering and search

## Technical Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **TypeScript**: Full type safety
- **State Management**: React hooks and context
- **API Integration**: Fetch-based client with error handling
# Energy_Monitor_Client
