const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getNewUserId() {
  try {
    const res = await pool.query('SELECT id, phone FROM users WHERE phone = $1 ORDER BY id DESC LIMIT 1', ['0990999999']);
    if (res.rows[0]) {
      console.log('New user ID:', res.rows[0].id);
      console.log('Phone:', res.rows[0].phone);
    }
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

getNewUserId();
