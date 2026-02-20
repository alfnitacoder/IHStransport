# Quick Start Guide

## ✅ Installation Complete!

All required software has been installed and configured:

- ✅ Node.js v20.20.0
- ✅ PostgreSQL 16.11
- ✅ Database `bus_cashless` created
- ✅ All dependencies installed
- ✅ Database migrations completed
- ✅ Default admin user created

## 🚀 Starting the Application

### Step 1: Start Backend Server

Open Terminal 1:
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Step 2: Start Frontend Server

Open Terminal 2:
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔐 Login Credentials

- **URL**: http://localhost:3000
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the admin password after first login!

## 📝 Next Steps

1. **Configure MyCash API** (if you have credentials):
   - Edit `backend/.env`
   - Add your MyCash API credentials

2. **Create Test Data**:
   - Create bus owners
   - Add buses
   - Create cards
   - Test transactions

3. **Production Deployment**:
   - Set `NODE_ENV=production` in `.env`
   - Use PM2 or similar process manager
   - Set up HTTPS
   - Configure database backups

## 🛠️ Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `.env` file exists and has correct database credentials
- Check port 3001 is not in use

### Frontend won't start
- Check port 3000 is not in use
- Verify backend is running first
- Check browser console for errors

### Database connection errors
- Verify PostgreSQL service: `sudo systemctl status postgresql`
- Check database credentials in `backend/.env`
- Test connection: `psql -U bus_user -d bus_cashless -h localhost`

## 📚 Documentation

- See `README.md` for full documentation
- See `INSTALLATION.md` for detailed setup instructions
