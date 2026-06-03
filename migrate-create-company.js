const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Creating company table...');
    
    // Create company table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255) NOT NULL UNIQUE,
        nom VARCHAR(255),
        phone VARCHAR(20),
        adresse TEXT,
        logo_url VARCHAR(500),
        signature_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Company table created');

    // Verify company table schema
    const companyCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'company'
      ORDER BY ordinal_position;
    `);
    console.log('\nCompany table columns:');
    companyCols.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    await pool.end();
    console.log('\nMigration complete');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
