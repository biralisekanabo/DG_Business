const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findNewUser() {
  try {
    console.log('🔍 Recherche du nouvel utilisateur...\n');
    const res = await pool.query('SELECT id, "phonenumber" FROM "user" ORDER BY id DESC LIMIT 1');
    if (res.rows[0]) {
      console.log('✅ Nouvel utilisateur créé:');
      console.log('   ID:', res.rows[0].id);
      console.log('   Phone:', res.rows[0].phonenumber);
    }

    // Créer des données de test pour cet utilisateur
    const userId = res.rows[0].id;
    
    // 1. Créer une company record
    console.log('\n📝 Création de données de test...');
    
    const company = await pool.query(
      `INSERT INTO company (userid, nom, phone, adresse, logo_url) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (userid) DO UPDATE SET nom = $2, phone = $3, adresse = $4
       RETURNING *`,
      [userId.toString(), 'Test Company', '+1 234 567 8900', 'Test City', null]
    );
    console.log('   ✅ Company créée/mise à jour');

    // 2. Créer un produit dans le stock
    const stock = await pool.query(
      `INSERT INTO stock (nom, quantite, prix_unitaire, userid, devise, categorie, fournisseur) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['Test Product', 100, 50, userId, 'USD', 'Test Category', 'Test Supplier']
    );
    const stockId = stock.rows[0].id;
    console.log('   ✅ Stock créé (ID:', stockId + ')');

    // 3. Créer une vente liée au stock
    const vente = await pool.query(
      `INSERT INTO vente (userid, clientname, montant, devise, stock_id, date) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, 'Test Client', 150, 'USD', stockId, new Date()]
    );
    const venteId = vente.rows[0].id;
    console.log('   ✅ Vente créée (ID:', venteId + ')');

    console.log('\n🔗 URL du reçu de test: http://localhost:3000/receipts/' + venteId);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

findNewUser();
