const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Créating depenses table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS depenses (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        motif VARCHAR(255) NOT NULL,
        montant DECIMAL(10, 2) NOT NULL,
        justificatif TEXT,
        devise VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✓ depenses table created');
    
    // Créer un index sur userid pour les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_depenses_userid ON depenses(userid);
    `);
    console.log('✓ Index créé sur userid');

    await pool.end();
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
