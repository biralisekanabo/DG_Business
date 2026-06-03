const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testReceipt() {
  try {
    console.log('\n📋 Test des données du reçu\n');

    // 1. Vérifier la table company
    console.log('1️⃣ Vérifiant la table company...');
    const companyRows = await pool.query('SELECT * FROM company LIMIT 1');
    console.log('   ✓ Company table existe. Rows:', companyRows.rowCount);
    if (companyRows.rowCount > 0) {
      console.log('   📊 Exemple:', JSON.stringify(companyRows.rows[0], null, 2));
    }

    // 2. Vérifier la table vente
    console.log('\n2️⃣ Vérifiant la table vente...');
    const venteRows = await pool.query('SELECT id, userid, clientname, montant, stock_id, modePaiement FROM vente LIMIT 1');
    console.log('   ✓ Vente table existe. Rows:', venteRows.rowCount);
    if (venteRows.rowCount > 0) {
      console.log('   📊 Exemple vente:', JSON.stringify(venteRows.rows[0], null, 2));
      
      // 3. Si stock_id existe, vérifier le produit
      if (venteRows.rows[0].stock_id) {
        console.log('\n3️⃣ Vérifiant le produit du stock...');
        const stockRows = await pool.query(
          'SELECT id, modele, nom, prix, categorie, fournisseur FROM stock WHERE id = $1 LIMIT 1',
          [venteRows.rows[0].stock_id]
        );
        if (stockRows.rowCount > 0) {
          console.log('   📦 Stock:', JSON.stringify(stockRows.rows[0], null, 2));
        }
      }
    } else {
      console.log('   ⚠️  Aucune vente trouvée. Créons une vente test...');
      
      // Créer une vente test
      const testUserId = 'user-test-' + Date.now();
      const testVente = await pool.query(
        `INSERT INTO vente (userid, clientname, montant, devise, date, modePaiement)
         VALUES ($1, $2, $3, $4, NOW(), $5)
         RETURNING *`,
        [testUserId, 'Client Test', 100, 'USD', 'Espèces']
      );
      console.log('   ✅ Vente créée:', testVente.rows[0].id);
    }

    // 4. Vérifier les colonnes de company
    console.log('\n4️⃣ Vérifiant les colonnes de company...');
    const colInfo = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'company' 
       ORDER BY ordinal_position`
    );
    console.log('   📋 Colonnes:');
    colInfo.rows.forEach(col => {
      console.log(`      - ${col.column_name}: ${col.data_type}`);
    });

    await pool.end();
    console.log('\n✅ Test complété!\n');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

testReceipt();
