const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding missing columns to stock table...');
    
    // Check if columns exist before adding them
    await pool.query(`
      ALTER TABLE stock
      ADD COLUMN IF NOT EXISTS categorie VARCHAR(255),
      ADD COLUMN IF NOT EXISTS fournisseur VARCHAR(255),
      ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS seuil INTEGER DEFAULT 10;
    `);
    console.log('✓ Stock table updated');

    // Verify stock table schema
    const stockCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stock'
      ORDER BY ordinal_position;
    `);
    console.log('\nStock table columns:');
    stockCols.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Verify mouvements table schema
    const mouvementsCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mouvements'
      ORDER BY ordinal_position;
    `);
    console.log('\nMouvements table columns:');
    mouvementsCols.rows.forEach(col => {
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
