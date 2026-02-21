# NFC Bus Device Application

This folder contains the Android application that runs on NFC-enabled devices installed on buses.

## Overview

The NFC app runs on Android tablets/devices mounted on buses and handles:
- Reading NFC card UIDs when passengers tap their cards
- Processing fare payments
- Sending GPS coordinates with transactions
- Offline transaction storage and sync
- Displaying transaction status to passengers

## Technology Stack

- **Platform**: Android (Java/Kotlin)
- **NFC**: Android NFC API
- **GPS**: Android Location Services
- **Network**: Retrofit/OkHttp for API calls
- **Database**: SQLite for offline storage
- **Sync**: Background service for syncing transactions

## Integration with Backend

### API Endpoints Used

1. **Process Fare Payment**
   ```
   POST /api/payments/fare
   ```
   - Reads card UID from NFC tap
   - Sends: card_uid, bus_id, fare_amount, GPS coordinates
   - Receives: transaction confirmation, new balance

2. **Update Bus Location**
   ```
   POST /api/buses/:id/location
   ```
   - Periodically sends GPS coordinates
   - Updates bus location in real-time

3. **Sync Offline Transactions**
   ```
   POST /api/payments/fare (multiple)
   ```
   - When internet is available, syncs stored offline transactions

## Key Features

### 1. NFC Card Reading
- Continuously listens for NFC card taps
- Reads card UID from NFC tag
- Validates card format

### 2. Fare Processing
- Retrieves fare amount from configuration
- Checks card balance (via API)
- Processes payment
- Updates card balance
- Displays success/failure message

### 3. GPS Integration
- Captures GPS coordinates with each transaction
- Sends location updates periodically
- Stores location history

### 4. Offline Support
- Stores transactions locally when offline
- Queues transactions for sync
- Syncs when internet connection restored
- Handles sync conflicts

### 5. User Interface
- Large, clear display for bus driver
- Transaction status feedback
- Error messages
- Connection status indicator

## Project Structure

```
NFC-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   ├── MainActivity.java
│   │   │   │   ├── NFCReader.java
│   │   │   │   ├── PaymentProcessor.java
│   │   │   │   ├── LocationService.java
│   │   │   │   ├── SyncService.java
│   │   │   │   └── api/
│   │   │   │       └── ApiClient.java
│   │   │   ├── res/
│   │   │   │   ├── layout/
│   │   │   │   └── values/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
├── README.md
└── build.gradle
```

## Configuration

### Required Settings

1. **Backend API URL**
   ```
   API_BASE_URL=https://your-backend-url.com/api
   ```

2. **Bus Device ID**
   ```
   DEVICE_ID=unique-device-id
   BUS_ID=bus-id-from-backend
   ```

3. **Fare Configuration**
   ```
   DEFAULT_FARE=2.50
   ```

4. **GPS Settings**
   ```
   LOCATION_UPDATE_INTERVAL=30000  # 30 seconds
   GPS_ACCURACY_THRESHOLD=50       # meters
   ```

## API Integration Example

### Process Fare Payment

```java
public class PaymentProcessor {
    public void processFare(String cardUid, double fareAmount, Location location) {
        FarePaymentRequest request = new FarePaymentRequest();
        request.card_uid = cardUid;
        request.bus_id = getBusId();
        request.fare_amount = fareAmount;
        request.device_timestamp = new Date();
        request.latitude = location.getLatitude();
        request.longitude = location.getLongitude();
        request.location_accuracy = location.getAccuracy();
        
        Call<FarePaymentResponse> call = apiService.processFare(request);
        call.enqueue(new Callback<FarePaymentResponse>() {
            @Override
            public void onResponse(Call<FarePaymentResponse> call, Response<FarePaymentResponse> response) {
                if (response.isSuccessful()) {
                    showSuccess(response.body().new_balance);
                } else {
                    handleError(response.errorBody());
                    // Store for offline sync
                    saveOfflineTransaction(request);
                }
            }
            
            @Override
            public void onFailure(Call<FarePaymentResponse> call, Throwable t) {
                // Network error - store for offline sync
                saveOfflineTransaction(request);
                showOfflineMessage();
            }
        });
    }
}
```

## Offline Transaction Flow

1. **Transaction Occurs**
   - NFC card tapped
   - Transaction stored in local SQLite database
   - Status: `pending_sync`

2. **When Online**
   - Background service checks for pending transactions
   - Sends each transaction to backend
   - Updates local status to `synced`
   - If sync fails, keeps as `pending_sync`

3. **Conflict Resolution**
   - If transaction already exists (duplicate), mark as `duplicate`
   - If card balance changed, update local cache

## Security Considerations

- API authentication tokens stored securely
- Card UIDs not logged in plain text
- GPS coordinates encrypted in transit
- Offline transactions encrypted in local database
- Certificate pinning for API calls

## Testing

### Test Scenarios

1. **Online Payment**
   - Tap card → Process payment → Show success

2. **Offline Payment**
   - Disable internet → Tap card → Store locally → Enable internet → Sync

3. **GPS Tracking**
   - Verify location updates sent periodically
   - Verify GPS included in transactions

4. **Error Handling**
   - Insufficient balance
   - Invalid card
   - Network timeout
   - GPS unavailable

## Deployment

1. Build APK for Android devices
2. Install on bus NFC devices
3. Configure device ID and bus ID
4. Set backend API URL
5. Test NFC reading and payment processing
6. Monitor sync status

## Support

For integration issues:
- Check backend API connectivity
- Verify device ID and bus ID configuration
- Review offline transaction sync logs
- Check GPS permissions and accuracy
