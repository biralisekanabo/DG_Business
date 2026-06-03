const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createFreshVente() {
  try {
    // Create a new vente with current timestamp
    const result = await pool.query(
      `INSERT INTO vente (userid, clientname, montant, devise, stock_id, date, createdat) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, date, createdat`,
      [9, 'Test Client 2', 250, 'USD', 11]
    );

    const venteId = result.rows[0].id;
    console.log('✅ Nouvelle vente créée:');
    console.log('   ID:', venteId);
    console.log('   Date:', result.rows[0].date);
    console.log('   Créée à:', result.rows[0].createdat);
    console.log('\n🔗 URL test reçu: http://localhost:3000/receipts/' + venteId);

    await pool.end();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

createFreshVente();
