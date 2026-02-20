# GPS Support API Documentation

The bus cashless system now supports GPS tracking for buses and transactions.

## Database Changes

### Transactions Table
- `latitude` (DECIMAL 10,8) - GPS latitude of transaction
- `longitude` (DECIMAL 11,8) - GPS longitude of transaction  
- `location_accuracy` (DECIMAL 8,2) - GPS accuracy in meters

### Buses Table
- `last_latitude` (DECIMAL 10,8) - Last known latitude
- `last_longitude` (DECIMAL 11,8) - Last known longitude
- `last_location_update` (TIMESTAMP) - When location was last updated

### Bus Locations Table (New)
Tracks historical bus locations:
- `bus_id` - Reference to bus
- `latitude`, `longitude` - GPS coordinates
- `accuracy`, `speed`, `heading` - Additional GPS data
- `recorded_at` - Timestamp of location recording

## API Endpoints

### 1. Process Fare Payment with GPS

**POST** `/api/payments/fare`

Process a fare payment and optionally include GPS coordinates.

**Request Body:**
```json
{
  "card_uid": "ABC123",
  "bus_id": 1,
  "fare_amount": 2.50,
  "device_timestamp": "2024-02-19T12:00:00Z",
  "latitude": -17.8252,
  "longitude": 31.0335,
  "location_accuracy": 10.5
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "card_id": 1,
    "bus_id": 1,
    "amount": 2.50,
    "latitude": -17.8252,
    "longitude": 31.0335,
    "location_accuracy": 10.5,
    ...
  },
  "new_balance": 47.50
}
```

**Notes:**
- GPS coordinates are optional
- If provided, bus location is automatically updated
- Location history is recorded in `bus_locations` table

### 2. Update Bus Location

**POST** `/api/buses/:id/location`

Update the current location of a bus (for GPS-enabled devices).

**Request Body:**
```json
{
  "latitude": -17.8252,
  "longitude": 31.0335,
  "accuracy": 10.5,
  "speed": 45.2,
  "heading": 180.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bus location updated",
  "location": {
    "latitude": -17.8252,
    "longitude": 31.0335,
    "accuracy": 10.5,
    "speed": 45.2,
    "heading": 180.5
  }
}
```

**Access Control:**
- Bus owners can only update their own buses
- Admins can update any bus

### 3. Get Bus Current Location

**GET** `/api/buses/:id/location`

Get the current location of a specific bus.

**Response:**
```json
{
  "location": {
    "id": 1,
    "bus_number": "BUS-001",
    "last_latitude": -17.8252,
    "last_longitude": 31.0335,
    "last_location_update": "2024-02-19T12:00:00Z"
  }
}
```

### 4. Get Bus Location History

**GET** `/api/buses/:id/location/history`

Get historical location data for a bus.

**Query Parameters:**
- `start_date` - Filter from date (optional)
- `end_date` - Filter to date (optional)
- `limit` - Max records to return (default: 100)

**Response:**
```json
{
  "locations": [
    {
      "id": 1,
      "bus_id": 1,
      "latitude": -17.8252,
      "longitude": 31.0335,
      "accuracy": 10.5,
      "speed": 45.2,
      "heading": 180.5,
      "recorded_at": "2024-02-19T12:00:00Z"
    },
    ...
  ]
}
```

### 5. Get All Buses with Locations

**GET** `/api/buses/locations/all`

Get all buses with their current GPS locations (for map view).

**Response:**
```json
{
  "buses": [
    {
      "id": 1,
      "bus_number": "BUS-001",
      "route_name": "Route A",
      "status": "active",
      "last_latitude": -17.8252,
      "last_longitude": 31.0335,
      "last_location_update": "2024-02-19T12:00:00Z",
      "owner_name": "John Doe"
    },
    ...
  ]
}
```

**Access Control:**
- Bus owners see only their own buses
- Admins see all buses

## Usage Examples

### Android NFC Device Example

```javascript
// When processing a fare payment
const farePayment = {
  card_uid: "ABC123",
  bus_id: 1,
  fare_amount: 2.50,
  device_timestamp: new Date().toISOString(),
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  location_accuracy: location.coords.accuracy
};

fetch('https://api.example.com/api/payments/fare', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(farePayment)
});
```

### Periodic Location Updates

```javascript
// Update bus location every 30 seconds
setInterval(async () => {
  const location = await getCurrentPosition();
  
  await fetch(`https://api.example.com/api/buses/${busId}/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      speed: location.coords.speed,
      heading: location.coords.heading
    })
  });
}, 30000);
```

## Frontend Integration

The frontend includes a "Bus Map" page (`/bus-map`) that displays:
- All buses with GPS locations
- Real-time location updates (refreshes every 30 seconds)
- Click on a bus to see details and Google Maps link
- Location history tracking

## Benefits

1. **Transaction Verification**: GPS coordinates stored with each transaction
2. **Route Tracking**: Monitor bus routes and verify they're on schedule
3. **Real-time Monitoring**: See where all buses are at any time
4. **Historical Analysis**: Analyze bus movement patterns
5. **Fraud Prevention**: Verify transactions occurred at expected locations
6. **Customer Service**: Help customers locate buses in real-time

## Security Notes

- GPS coordinates are stored with transactions for audit purposes
- Bus owners can only access location data for their own buses
- Location updates require authentication
- Historical location data can be used for route analysis
