-- Add GPS support to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2);

-- Add GPS tracking to buses table (current location)
ALTER TABLE buses
ADD COLUMN IF NOT EXISTS last_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS last_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_location ON transactions(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buses_location ON buses(last_latitude, last_longitude) WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL;

-- Create bus location history table for tracking bus movements
CREATE TABLE IF NOT EXISTS bus_locations (
    id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_recorded_at ON bus_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_bus_locations_location ON bus_locations(latitude, longitude);
