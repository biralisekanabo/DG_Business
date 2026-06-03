const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function populateCompanyData() {
  try {
    console.log('\n📝 Remplissage des données company\n');

    // Mettre à jour la company existante
    const result = await pool.query(
      `UPDATE company 
       SET nom = $1, phone = $2, adresse = $3
       WHERE userid = $4
       RETURNING *`,
      [
        'DG Business Solutions',
        '+243 XX XXX XXXX',
        'Kinshasa, RDC',
        '7'  // userid du logo existant
      ]
    );

    if (result.rowCount > 0) {
      console.log('✅ Company mise à jour:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }

    // Vérifier les ventes
    console.log('\n📋 Ventes existantes:');
    const ventes = await pool.query('SELECT id, userid, clientname, stock_id, devise FROM vente LIMIT 3');
    console.log('   Total:', ventes.rowCount);
    ventes.rows.forEach(v => {
      console.log(`   - ID ${v.id}: ${v.clientname} (userid: ${v.userid}, stock_id: ${v.stock_id})`);
    });

    // Afficher l'URL pour tester
    if (ventes.rowCount > 0) {
      console.log(`\n🔗 URL test reçu: http://localhost:3000/receipts/${ventes.rows[0].id}`);
    }

    await pool.end();
    console.log('\n✅ Complété!\n');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

populateCompanyData();
