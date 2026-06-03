const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getUser7() {
  try {
    const result = await pool.query('SELECT phone, password FROM users WHERE id = 7');
    if (result.rows[0]) {
      console.log('User 7 credentials:');
      console.log('Phone:', result.rows[0].phone);
      console.log('Password hash starts with:', result.rows[0].password.substring(0, 20));
    }
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

getUser7();
