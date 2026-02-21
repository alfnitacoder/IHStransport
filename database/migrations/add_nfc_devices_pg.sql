-- Create nfc_devices table if missing (PostgreSQL).
-- Run this if you get "relation nfc_devices does not exist".
-- Requires: users, bus_owners, buses must already exist.

CREATE TABLE IF NOT EXISTS nfc_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255),
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE SET NULL,
    bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unassigned')),
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_bus_owner_id ON nfc_devices(bus_owner_id);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_bus_id ON nfc_devices(bus_id);
