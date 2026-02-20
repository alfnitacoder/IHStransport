# Installation Guide

This guide will help you set up the Bus Cashless Card Payment System web application.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Step 1: Install PostgreSQL

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Windows:
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE bus_cashless;
CREATE USER bus_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE bus_cashless TO bus_user;
\q
```

## Step 3: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials and MyCash API details
nano .env  # or use your preferred editor
```

Update the `.env` file with:
- Database credentials
- JWT secret (generate a random string)
- MyCash API credentials (provided by Digicel)

## Step 4: Run Database Migrations

```bash
# From the backend directory
npm run migrate
```

This will:
- Create all database tables
- Create a default admin user (username: `admin`, password: `admin123`)
- Create default fare configuration

**⚠️ IMPORTANT: Change the default admin password after first login!**

## Step 5: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend API will run on `http://localhost:3001`

## Step 6: Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 7: Access the Application

1. Open your browser and navigate to: `http://localhost:3000`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **Change the admin password immediately!**

## API Endpoints

The backend API provides the following endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

- `GET /api/cards` - List all cards
- `POST /api/cards` - Create new card
- `GET /api/cards/:cardUid` - Get card by UID

- `POST /api/payments/topup/initiate` - Initiate MyCash top-up
- `POST /api/payments/topup/send-otp` - Send OTP for payment
- `POST /api/payments/topup/approve` - Approve payment with OTP
- `POST /api/payments/fare` - Process bus fare payment (for NFC devices)
- `GET /api/payments/transactions` - Get transaction history

- `GET /api/buses` - List all buses
- `POST /api/buses` - Create new bus
- `GET /api/buses/:id/revenue` - Get bus revenue

- `GET /api/owners` - List bus owners
- `POST /api/owners` - Create bus owner
- `GET /api/owners/:id/revenue` - Get owner revenue

- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/transactions` - Transaction reports
- `GET /api/reports/mycash` - MyCash transaction reports

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Ensure database exists: `psql -U bus_user -d bus_cashless`

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: Change port in `vite.config.js`

### MyCash Integration
- Ensure MyCash API credentials are correct in `.env`
- Check API URL is accessible
- Verify merchant mobile number is correct

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2: `npm install -g pm2 && pm2 start src/app.js`
3. Set up reverse proxy (Nginx) for HTTPS
4. Configure SSL certificates
5. Set up database backups
6. Use environment-specific configuration

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database and JWT secret
- Enable HTTPS in production
- Regularly update dependencies
- Review and restrict API access based on roles

## Support

For issues or questions:
- Check the main README.md
- Review API documentation
- Contact system administrator
