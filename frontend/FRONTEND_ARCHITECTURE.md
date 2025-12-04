# Frontend Architecture - Drone Detection Dashboard

## Overview

A modern Angular standalone component-based frontend for the Drone Detection API. Built with TypeScript, TailwindCSS, and Angular Signals for state management.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── drone-dashboard.component.ts    # Main dashboard view
│   │   │   └── drone-card.component.ts         # Individual drone card
│   │   ├── services/
│   │   │   ├── api.service.ts                  # HTTP API client
│   │   │   └── drone-state.service.ts          # Signal-based state management
│   │   ├── models/
│   │   │   └── drone.model.ts                  # TypeScript interfaces
│   │   ├── app.ts                              # Root component
│   │   ├── app.config.ts                       # App configuration
│   │   └── app.routes.ts                       # Routing configuration
│   ├── index.html                              # Main HTML file
│   ├── main.ts                                 # Bootstrap file
│   └── styles.css                              # Global styles with Tailwind
├── public/
│   └── favicon.ico
├── angular.json                                # Angular CLI configuration
├── tsconfig.json                               # TypeScript configuration
├── tailwind.config.js                          # TailwindCSS configuration
├── postcss.config.js                           # PostCSS configuration
├── proxy.conf.json                             # Dev server proxy config
└── package.json
```

## Key Features

### 1. **Standalone Components**
- No NgModules required
- Tree-shakeable and easier to understand
- Components: `DroneDashboardComponent`, `DroneCardComponent`

### 2. **Signal-Based State Management** (`DroneStateService`)
- Real-time state tracking using Angular Signals
- Automatic blocked drone detection (MAC duplicates)
- Computed properties for UI optimization
- Methods:
  - `addDetection(detection)` - Add single detection
  - `addDetections(detections)` - Batch add detections
  - `setDetections(detections)` - Replace all (for pagination)
  - `isBlocked(macAddress)` - Check if MAC is blocked
  - `getDetectionCount(macAddress)` - Count detections per MAC
  - `clearDetections()` - Reset state

### 3. **API Service** (`ApiService`)
- Typed HTTP requests using Angular HttpClient
- Error handling with proper messages
- Methods:
  - `getDetections(page, limit, manufacturerId?, location?)` - Paginated detections
  - `getLatestDetections()` - Last 5 detections
  - `createDetection(payload)` - Simulate new detection
  - `getManufacturers()` - Fetch all manufacturers
  - `getStats()` - Dashboard statistics

### 4. **Data Models** (`drone.model.ts`)
- Strict TypeScript interfaces
- Full type safety (no `any`)
- Models:
  - `Detection` - Single drone detection record
  - `Manufacturer` - OUI manufacturer info
  - `CreateDetectionPayload` - Payload for creating detections
  - `PaginatedResponse<T>` - Pagination wrapper
  - `StatsResponse` - Dashboard statistics
  - `DroneBlockStatus` - Blocked drone status

### 5. **Dashboard Component**
- Real-time statistics display
- Drone detection simulation form with validation
- Paginated detection list
- Visual blocking indicator for duplicate MACs
- Error handling and loading states
- Manual refresh and clear functionality

### 6. **Drone Card Component**
- Individual drone display card
- Visual indicators:
  - Red badge for blocked drones
  - RSSI signal strength
  - Manufacturer information
  - Detection count
  - Last detected timestamp
- Responsive grid layout

## Styling

**Framework:** TailwindCSS v3

**Utilities Used:**
- Flexbox and Grid layouts
- Responsive design (`md:`, `lg:` breakpoints)
- Color scheme (blue, indigo, red for alerts)
- Spacing and typography

**Global Styles:**
- Tailwind directives (`@tailwind base`, `components`, `utilities`)
- CSS Box Model reset

## Validation Rules

### MAC Address
- Format: `XX:XX:XX:XX:XX:XX`
- Regex: `/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/`
- **Frontend validation:** Checked before API submission

### RSSI
- Type: Integer
- Range: -100 to -10 dBm (typical)
- **Frontend validation:** Checked for valid number

### Sensor Location
- Type: String
- Max: 255 characters
- **Frontend validation:** Required field check

### Timestamp
- Format: ISO 8601
- Auto-generated on client: `new Date().toISOString()`

## Business Logic

### Blocking System
1. **Duplicate Detection:** When a MAC address is detected multiple times
2. **Status Tracking:** `DroneStateService` maintains a `Set<string>` of blocked MACs
3. **Visual Indicator:** Red "BLOCKED" badge on `DroneCardComponent`
4. **Count Display:** Shows number of detections per MAC

## Setup & Running

### Prerequisites
- Node.js v22.x
- npm v9.x

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
# With CORS proxy (recommended)
npm start

# Or with direct API calls
npm run start -- --serve
```

Navigate to `http://localhost:4200/`

The dev server will proxy API calls to `http://localhost:8080/api/v1` via `proxy.conf.json`

### Build for Production
```bash
npm run build
```

Output: `dist/frontend/`

### Testing
```bash
npm test
```

## API Integration

### Base URL
- **Development:** `http://localhost:8080/api/v1` (via proxy)
- **Production:** Update `ApiService.apiBaseUrl` or environment config

### CORS Handling
- Development: Proxy via `proxy.conf.json` and `--proxy-config` flag
- Production: Ensure backend CORS headers are configured (already in CodeIgniter)

### Error Handling
All API calls include error handling:
```typescript
.pipe(catchError(this.handleError))
```

Displays user-friendly error messages in UI

## Testing Endpoints

Use the provided `test-api.http` file in the workspace root:

```http
# Create a detection
POST http://localhost:8080/api/v1/detections
Content-Type: application/json

{
  "mac": "60:60:1F:AA:BB:CC",
  "rssi": -50,
  "sensor_location": "Building A - Floor 3",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Signal API Usage

Example of reactive state management:

```typescript
// In component
constructor(private droneState: DroneStateService) {}

ngOnInit() {
  const blockedDrones = this.droneState.blockedList(); // Computed signal
}

// Add detection
this.droneState.addDetection(newDetection);

// Check if blocked
if (this.droneState.isBlocked(macAddress)) {
  console.log('Drone is blocked');
}
```

## Type Safety

All components and services use strict TypeScript:
- No `any` type used
- Full interface definitions for all API responses
- Constructor dependency injection with types
- Readonly signals for immutability

## Future Enhancements

1. **Real-time Updates:** WebSocket integration for live detections
2. **Filtering & Search:** Advanced drone filtering by manufacturer
3. **Charts & Analytics:** Detection trends over time
4. **Geomapping:** Visual location mapping for sensors
5. **Export:** CSV/JSON export of detection logs
6. **User Authentication:** OAuth2 integration
7. **Dark Mode:** Theme switching with Tailwind
8. **Unit Tests:** Jasmine test suite
9. **E2E Tests:** Cypress or Playwright tests
10. **Performance:** Lazy loading and virtual scrolling for large lists

## SOLID Principles Applied

- **S (Single Responsibility):** Each service handles one concern
- **O (Open/Closed):** Components extensible without modification
- **L (Liskov Substitution):** Interfaces used for contracts
- **I (Interface Segregation):** Specific, focused interfaces
- **D (Dependency Inversion):** Services injected, not instantiated

## Browser Support

Modern browsers with ES2022+ support:
- Chrome/Edge 91+
- Firefox 89+
- Safari 15+

## License

Same as parent project (see LICENSE file)

---

**Last Updated:** 2025-12-04  
**Angular Version:** 21.x  
**TypeScript Version:** 5.x  
**TailwindCSS Version:** 3.x
