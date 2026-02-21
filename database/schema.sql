-- Cashless Transit Database Schema (bus, plane, ship)

-- Users table (admin, operators/bus_owners, agents, customers)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'bus_owner', 'agent', 'customer')),
    phone VARCHAR(20),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus owners table
CREATE TABLE IF NOT EXISTS bus_owners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    settlement_method VARCHAR(50) DEFAULT 'bank_transfer',
    bank_account VARCHAR(255),
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    pending_settlement DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses / vehicles table (bus, plane, ship)
CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE CASCADE,
    bus_number VARCHAR(50) UNIQUE NOT NULL,
    transport_type VARCHAR(20) DEFAULT 'bus' CHECK (transport_type IN ('bus', 'plane', 'ship')),
    route_name VARCHAR(255),
    device_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFC devices (manage and assign to operators / buses; app can register when online)
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
CREATE INDEX idx_nfc_devices_bus_owner_id ON nfc_devices(bus_owner_id);
CREATE INDEX idx_nfc_devices_bus_id ON nfc_devices(bus_id);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    card_uid VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'lost')),
    customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fare configuration table (per route, optional per transport type)
CREATE TABLE IF NOT EXISTS fare_config (
    id SERIAL PRIMARY KEY,
    transport_type VARCHAR(20) DEFAULT 'bus' CHECK (transport_type IN ('bus', 'plane', 'ship')),
    route_name VARCHAR(255),
    fare_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (bus tap payments)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    fare_amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(50) DEFAULT 'fare_payment' CHECK (transaction_type IN ('fare_payment', 'top_up', 'refund')),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'synced')),
    device_timestamp TIMESTAMP,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MyCash transactions table
CREATE TABLE IF NOT EXISTS mycash_transactions (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    request_id VARCHAR(255),
    transaction_id VARCHAR(255),
    reference_number VARCHAR(255),
    card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
    customer_mobile VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'otp_sent', 'approved', 'failed', 'cancelled')),
    otp_sent_at TIMESTAMP,
    approved_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settlements table (for bus owner payouts)
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    bus_owner_id INTEGER REFERENCES bus_owners(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 5.00,
    commission_amount DECIMAL(12, 2) NOT NULL,
    net_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings (admin-editable, e.g. MyCash API key)
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
