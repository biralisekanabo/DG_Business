const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDB() {
  try {
    console.log('Creating mouvements table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mouvements (
        id SERIAL PRIMARY KEY,
        stock_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
        quantite INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        raison TEXT,
        utilisateur VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ mouvements table created');
    
    console.log('Creating stock table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        modele VARCHAR(255) NOT NULL,
        quantite INTEGER NOT NULL,
        prix DECIMAL(10, 2),
        statut VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ stock table created');
    
    await pool.end();
    console.log('Database setup complete');
  } catch (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
}

setupDB();
