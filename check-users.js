const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('Checking database users...\n');

    const result = await pool.query('SELECT id, email FROM "user" LIMIT 10');
    
    if (result.rows.length === 0) {
      console.log('⚠️  No users found in database');
      console.log('\nTo test the stock/vente sync, we need an existing user.');
      console.log('Please login to the app first or create a test user.');
    } else {
      console.log('📋 Existing users:');
      result.rows.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ID: ${user.id}, Email: ${user.email}`);
      });
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUsers();
