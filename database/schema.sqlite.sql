-- Cashless Transit Database Schema for SQLite (development/test)
-- Same structure as PostgreSQL schema + GPS support

PRAGMA foreign_keys = ON;

-- Users table (admin, operators/bus_owners, agents, customers)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'bus_owner', 'agent', 'customer')),
    phone TEXT,
    full_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Bus owners table
CREATE TABLE IF NOT EXISTS bus_owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    settlement_method TEXT DEFAULT 'bank_transfer',
    bank_account TEXT,
    total_revenue REAL DEFAULT 0,
    pending_settlement REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Buses / vehicles table (bus, plane, ship) + GPS
CREATE TABLE IF NOT EXISTS buses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE CASCADE,
    bus_number TEXT UNIQUE NOT NULL,
    transport_type TEXT DEFAULT 'bus' CHECK (transport_type IN ('bus', 'plane', 'ship')),
    route_name TEXT,
    device_id TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    last_latitude REAL,
    last_longitude REAL,
    last_location_update TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- NFC devices (manage and assign to operators / buses; app can register when online)
CREATE TABLE IF NOT EXISTS nfc_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    label TEXT,
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE SET NULL,
    bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unassigned')),
    last_seen_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_bus_owner_id ON nfc_devices(bus_owner_id);
CREATE INDEX IF NOT EXISTS idx_nfc_devices_bus_id ON nfc_devices(bus_id);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_uid TEXT UNIQUE NOT NULL,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'lost')),
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Fare configuration table
CREATE TABLE IF NOT EXISTS fare_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transport_type TEXT DEFAULT 'bus' CHECK (transport_type IN ('bus', 'plane', 'ship')),
    route_name TEXT,
    fare_amount REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Transactions table (bus tap payments) + GPS
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    fare_amount REAL NOT NULL,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    transaction_type TEXT DEFAULT 'fare_payment' CHECK (transaction_type IN ('fare_payment', 'top_up', 'refund')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'synced')),
    device_timestamp TEXT,
    synced_at TEXT,
    latitude REAL,
    longitude REAL,
    location_accuracy REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- MyCash transactions table
CREATE TABLE IF NOT EXISTS mycash_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    request_id TEXT,
    transaction_id TEXT,
    reference_number TEXT,
    card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
    customer_mobile TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'otp_sent', 'approved', 'failed', 'cancelled')),
    otp_sent_at TEXT,
    approved_at TEXT,
    error_message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Settlements table (for bus owner payouts)
CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    total_amount REAL NOT NULL,
    commission_rate REAL DEFAULT 5.00,
    commission_amount REAL NOT NULL,
    net_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    payment_reference TEXT,
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- System settings (admin-editable, e.g. MyCash API key)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Bus location history (GPS tracking)
CREATE TABLE IF NOT EXISTS bus_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    speed REAL,
    heading REAL,
    recorded_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_card_uid ON cards(card_uid);
CREATE INDEX IF NOT EXISTS idx_cards_customer_id ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bus_id ON transactions(bus_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_mycash_transactions_order_id ON mycash_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mycash_transactions_status ON mycash_transactions(status);
CREATE INDEX IF NOT EXISTS idx_buses_bus_owner_id ON buses(bus_owner_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_bus_locations_bus_id ON bus_locations(bus_id);
CREATE INDEX IF NOT EXISTS idx_bus_locations_recorded_at ON bus_locations(recorded_at);
