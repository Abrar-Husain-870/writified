const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // First, check if the users table already exists
        const checkTableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        const tablesExist = checkTableResult.rows[0].exists;
        
        if (tablesExist) {
            console.log('✅ Database tables already exist, skipping initialization');
            return;
        }
        
        // If tables don't exist, proceed with initialization
        console.log('No existing tables found, initializing database...');
        
        // Read and execute SQL file
        const sqlPath = path.join(__dirname, 'init.sql');
        console.log(`Reading SQL file from: ${sqlPath}`);
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        
        // Execute SQL commands
        console.log('Executing SQL commands...');
        await client.query(sqlContent);
        console.log('✅ Database tables created successfully');
    } catch (error) {
        console.error('❌ Error during database setup:', error);
        // Don't exit the process on error, just log it
        // process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };