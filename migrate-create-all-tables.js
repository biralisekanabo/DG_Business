const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Créer ou mettre à jour les tables
    
    // 1. Table depenses
    console.log('Handling depenses table...');
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
    console.log('✓ depenses table OK');
    
    // 2. Table dettes
    console.log('Handling dettes table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dettes (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255) NOT NULL,
        creancier VARCHAR(255) NOT NULL,
        montant DECIMAL(10, 2) NOT NULL,
        date_limite DATE,
        statut VARCHAR(50) DEFAULT 'En attente',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ dettes table OK');
    
    // 3. Table rapports
    console.log('Handling rapports table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rapports (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255) NOT NULL,
        titre VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        date_generation TIMESTAMP DEFAULT NOW(),
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ rapports table OK');
    
    // 4. Table stock - ajouter userid si elle existe mais sans la colonne
    console.log('Handling stock table...');
    try {
      await pool.query(`ALTER TABLE stock ADD COLUMN userid VARCHAR(255);`);
      console.log('✓ Added userid to stock');
    } catch (e) {
      if (e.code === '42701') { // column already exists
        console.log('✓ stock already has userid column');
      } else {
        console.log('✓ stock table handling...');
      }
    }
    
    // Récréer stock si elle n'a pas les bonnes colonnes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255),
        modele VARCHAR(255) NOT NULL,
        quantite INTEGER NOT NULL DEFAULT 0,
        seuil INTEGER,
        prix DECIMAL(10, 2),
        categorie VARCHAR(100),
        fournisseur VARCHAR(255),
        statut VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ stock table OK');
    
    // 5. Table vente
    console.log('Handling vente table...');
    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN userid VARCHAR(255);`);
      console.log('✓ Added userid to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has userid column');
      }
    }
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vente (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255),
        stock_id INTEGER,
        quantite INTEGER NOT NULL,
        prix_unitaire DECIMAL(10, 2),
        date TIMESTAMP DEFAULT NOW(),
        statut VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ vente table OK');
    
    // 6. Table mouvements
    console.log('Handling mouvements table...');
    try {
      await pool.query(`ALTER TABLE mouvements ADD COLUMN userid VARCHAR(255);`);
      console.log('✓ Added userid to mouvements');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ mouvements already has userid column');
      }
    }
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mouvements (
        id SERIAL PRIMARY KEY,
        userid VARCHAR(255),
        stock_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
        quantite INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        raison TEXT,
        utilisateur VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ mouvements table OK');
    
    // Créer les index sans erreur si la colonne n'existe pas
    console.log('\nCreating indexes...');
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_depenses_userid ON depenses(userid);`);
      console.log('✓ idx_depenses_userid');
    } catch (e) {
      console.log('⚠ idx_depenses_userid skipped');
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_dettes_userid ON dettes(userid);`);
      console.log('✓ idx_dettes_userid');
    } catch (e) {
      console.log('⚠ idx_dettes_userid skipped');
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_rapports_userid ON rapports(userid);`);
      console.log('✓ idx_rapports_userid');
    } catch (e) {
      console.log('⚠ idx_rapports_userid skipped');
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_stock_userid ON stock(userid);`);
      console.log('✓ idx_stock_userid');
    } catch (e) {
      console.log('⚠ idx_stock_userid skipped');
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_vente_userid ON vente(userid);`);
      console.log('✓ idx_vente_userid');
    } catch (e) {
      console.log('⚠ idx_vente_userid skipped');
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_mouvements_userid ON mouvements(userid);`);
      console.log('✓ idx_mouvements_userid');
    } catch (e) {
      console.log('⚠ idx_mouvements_userid skipped');
    }

    await pool.end();
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
