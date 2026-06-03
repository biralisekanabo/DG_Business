const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Updating vente table...');
    
    // Ajouter les colonnes manquantes à la table vente
    const addColumns = [
      { name: 'clientname', type: 'VARCHAR(255)' },
      { name: 'montant', type: 'DECIMAL(10, 2)' },
      { name: 'devise', type: 'VARCHAR(10) DEFAULT \'USD\'' }
    ];

    for (const col of addColumns) {
      try {
        await pool.query(`ALTER TABLE vente ADD COLUMN ${col.name} ${col.type};`);
        console.log(`✓ Added column ${col.name}`);
      } catch (e) {
        if (e.code === '42701') { // column already exists
          console.log(`✓ Column ${col.name} already exists`);
        } else {
          throw e;
        }
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
