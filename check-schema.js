const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('\n📋 Schéma des tables\n');

    // Vérifier les colonnes de vente
    console.log('1️⃣ Colonnes de la table VENTE:');
    const venteColumns = await pool.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns 
       WHERE table_name = 'vente' 
       ORDER BY ordinal_position`
    );
    venteColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Colonnes de company
    console.log('\n2️⃣ Colonnes de la table COMPANY:');
    const companyColumns = await pool.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns 
       WHERE table_name = 'company' 
       ORDER BY ordinal_position`
    );
    companyColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Colonnes de stock
    console.log('\n3️⃣ Colonnes de la table STOCK:');
    const stockColumns = await pool.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns 
       WHERE table_name = 'stock' 
       ORDER BY ordinal_position`
    );
    stockColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Afficher les données
    console.log('\n3️⃣ Données existantes:');
    const ventes = await pool.query('SELECT * FROM vente LIMIT 1');
    console.log('   Ventes:', ventes.rowCount);
    if (ventes.rowCount > 0) {
      console.log('   ', JSON.stringify(ventes.rows[0], null, 2));
    }

    const company = await pool.query('SELECT * FROM company LIMIT 1');
    console.log('\n   Company:', company.rowCount);
    if (company.rowCount > 0) {
      console.log('   ', JSON.stringify(company.rows[0], null, 2));
    }

    await pool.end();
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

checkSchema();
