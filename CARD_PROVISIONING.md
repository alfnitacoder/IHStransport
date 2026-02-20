# Card Provisioning Guide

## Current System Design

### Who Can Provision Cards?

**Currently: Only Admin and Agents can provision cards**

- ✅ **Admin** - Full access to create, view, and manage all cards
- ✅ **Agent** - Can create cards and assign them to customers
- ❌ **Customer** - Cannot create cards (must purchase from agent/admin)
- ❌ **Bus Owner** - Cannot create cards (not involved in card distribution)

### Card Provisioning Flow

```
1. Customer visits Agent/Admin location
   ↓
2. Agent/Admin creates card in system
   - Enters Card UID (from physical NFC card)
   - Optionally assigns to customer
   - Sets initial balance (if any)
   ↓
3. Card is activated and ready to use
   ↓
4. Customer can top up via MyCash
```

## Database Schema

Cards table tracks:
- `card_uid` - Unique NFC card identifier
- `customer_id` - Optional link to customer account
- `issued_by` - User ID of admin/agent who created the card
- `balance` - Current card balance
- `status` - active, blocked, expired, lost

## Recommended Workflow

### Option 1: Provider-Only Provisioning (Current)
**Who provisions:** Admin and Agents only

**Pros:**
- Controlled card distribution
- Prevents duplicate cards
- Better security and audit trail
- Agents can verify customer identity

**Cons:**
- Requires physical visit to agent location
- Less convenient for customers

### Option 2: Self-Service Provisioning
**Who provisions:** Customers can register their own cards

**Pros:**
- More convenient for customers
- Can register card online
- Faster onboarding

**Cons:**
- Less control over card distribution
- Potential for fraud/duplicate cards
- Harder to verify card authenticity

## Current Implementation

### Backend API
- `POST /api/cards` - Create card (Admin/Agent only)
- `GET /api/cards` - List cards (Admin/Agent only)
- `GET /api/cards/:cardUid` - Get card details (Any authenticated user)
- `PATCH /api/cards/:id/balance` - Update balance (Admin only)
- `PATCH /api/cards/:id/status` - Update status (Admin only)

### Frontend Access
- **Admin**: Full card management interface
- **Agent**: Can create cards and assign to customers
- **Customer**: Can view their own cards (via customer_id filter)
- **Bus Owner**: No card access

## Best Practice Recommendation

**Recommended: Provider-Only Provisioning**

1. **Physical Card Distribution**
   - Cards are physical NFC cards purchased from authorized vendors
   - Cards must be registered in system before use
   - Agent/Admin scans card UID and registers it

2. **Card Registration Process**
   - Customer visits agent location
   - Agent verifies customer identity
   - Agent creates card record in system
   - Card is linked to customer account
   - Customer can immediately use card

3. **Security Benefits**
   - Prevents card duplication
   - Ensures proper card inventory management
   - Maintains audit trail of who issued each card
   - Allows verification of card authenticity

## Alternative: Self-Registration (If Needed)

If you want customers to register their own cards, you would need to:

1. Add endpoint: `POST /api/cards/register` (for customers)
2. Allow customers to enter their card UID
3. System validates card UID format
4. Card is created and linked to customer automatically

**Note:** This requires additional validation to prevent abuse.

## Summary

**Current System:** Only Admin and Agents can provision cards
**Recommended:** Keep provider-only provisioning for security and control
**Customers:** Purchase cards from agents, then cards are registered in system
**Bus Owners:** Not involved in card provisioning (they operate buses, not card sales)
