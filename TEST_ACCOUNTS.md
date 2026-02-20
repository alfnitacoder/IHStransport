# Test Accounts

All test accounts have been created and are ready to use.

## Login Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|-------------|
| **Admin** | `admin` | `admin123` | Full access to all features |
| **Bus Owner** | `busowner` | `owner123` | Dashboard, Buses, Reports (own buses only) |
| **Customer** | `customer` | `customer123` | Dashboard, Cards, Payments (own cards only) |
| **Agent** | `agent` | `agent123` | Dashboard, Cards, Payments (card management) |

## Role-Based Access

### Admin
- ✅ Full dashboard with all statistics
- ✅ Manage all cards
- ✅ Manage all payments and transactions
- ✅ Manage all buses
- ✅ Manage bus owners
- ✅ View all reports

### Bus Owner
- ✅ Dashboard (revenue statistics for own buses)
- ✅ View own buses
- ✅ View revenue reports for own buses
- ❌ Cannot manage cards or other owners' buses

### Customer
- ✅ Customer dashboard (own cards and transactions)
- ✅ View own cards
- ✅ Top up cards via MyCash
- ✅ View own transaction history
- ❌ Cannot manage buses or other users

### Agent
- ✅ Dashboard
- ✅ Manage cards (create, view)
- ✅ Assist with MyCash top-ups
- ❌ Cannot manage buses or owners

## Testing Login

You can test login using curl:

```bash
# Admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Bus Owner login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"busowner","password":"owner123"}'

# Customer login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"customer123"}'

# Agent login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"agent","password":"agent123"}'
```

## Frontend Access

1. Navigate to: http://localhost:3000
2. Use any of the test accounts above
3. The interface will automatically adjust based on your role

## Notes

- All passwords should be changed in production
- The bus owner account has an associated `bus_owners` record
- Customer and agent accounts are ready to use but may need cards/buses assigned
- Default admin password should be changed immediately after first login
