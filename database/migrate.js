const fs = require('fs');
const path = require('path');

// Add backend node_modules to the path
const backendPath = path.join(__dirname, '..', 'backend');
require('module')._resolveFilename = ((originalResolveFilename) => {
  return function(request, parent) {
    if (!request.startsWith('.') && !path.isAbsolute(request)) {
      const backendModules = path.join(backendPath, 'node_modules', request);
      try {
        return require.resolve(backendModules);
      } catch (e) {
        // Fall back to original
      }
    }
    return originalResolveFilename(request, parent);
  };
})(require('module')._resolveFilename);

const pool = require(path.join(backendPath, 'src/config/database'));

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database migrations...');
    await pool.query(schema);
    // Add transport_type to existing tables (bus, plane, ship)
    try {
      await pool.query(`ALTER TABLE buses ADD COLUMN IF NOT EXISTS transport_type VARCHAR(20) DEFAULT 'bus'`);
      await pool.query(`ALTER TABLE fare_config ADD COLUMN IF NOT EXISTS transport_type VARCHAR(20) DEFAULT 'bus'`);
      console.log('✅ Transport type columns applied (if needed)');
    } catch (e) {
      // Ignore if columns already exist or constraint issues
    }
    console.log('✅ Database migrations completed successfully!');
    
    // Create default admin user (password: admin123 - should be changed in production)
    const bcrypt = require(path.join(backendPath, 'node_modules/bcryptjs'));
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminCheck = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (username, password_hash, role, full_name) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin', 'System Administrator']
      );
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
    
    // Create default fare configuration
    const fareCheck = await pool.query('SELECT id FROM fare_config LIMIT 1');
    if (fareCheck.rows.length === 0) {
      await pool.query(
        'INSERT INTO fare_config (route_name, fare_amount) VALUES ($1, $2)',
        ['Default Route', 2.50]
      );
      console.log('✅ Default fare configuration created');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
