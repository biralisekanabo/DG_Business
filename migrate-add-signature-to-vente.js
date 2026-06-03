const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding signature columns to vente table...\n');
    
    // Ajouter signed_at
    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN signed_at TIMESTAMP;`);
      console.log('✓ Added column signed_at');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ Column signed_at already exists');
      } else {
        throw e;
      }
    }

    // Ajouter signature_data (pour stocker l'image de signature en data URL)
    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN signature_data TEXT;`);
      console.log('✓ Added column signature_data');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ Column signature_data already exists');
      } else {
        throw e;
      }
    }

    console.log('\n✅ Migration complete!');
    await pool.end();
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
