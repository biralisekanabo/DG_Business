const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertTestProducts() {
  try {
    console.log('Inserting test products...');
    
    const products = [
      { nom: 'iPhone 15 Pro', quantite: 10, prix_unitaire: 999, categorie: 'Smartphone', fournisseur: 'Apple', devise: 'USD', seuil: 3 },
      { nom: 'Samsung Galaxy S24', quantite: 15, prix_unitaire: 899, categorie: 'Smartphone', fournisseur: 'Samsung', devise: 'USD', seuil: 3 },
      { nom: 'Google Pixel 8', quantite: 8, prix_unitaire: 799, categorie: 'Smartphone', fournisseur: 'Google', devise: 'USD', seuil: 2 },
      { nom: 'OnePlus 12', quantite: 12, prix_unitaire: 649, categorie: 'Smartphone', fournisseur: 'OnePlus', devise: 'USD', seuil: 2 },
    ];

    for (const product of products) {
      const { rows } = await pool.query(
        `INSERT INTO stock (nom, quantite, prix_unitaire, categorie, fournisseur, devise, seuil)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, nom, quantite, prix_unitaire, categorie, fournisseur, devise, seuil`,
        [product.nom, product.quantite, product.prix_unitaire, product.categorie, product.fournisseur, product.devise, product.seuil]
      );
      console.log(`✓ Added: ${product.nom} - $${product.prix_unitaire}`);
    }

    // Verify products
    const { rows } = await pool.query(`
      SELECT id, nom as modele, quantite, prix_unitaire as prix, categorie, fournisseur, devise, seuil 
      FROM stock 
      WHERE quantite > 0
      ORDER BY nom ASC
    `);
    
    console.log('\nProducts in stock:');
    rows.forEach(p => {
      console.log(`  - ${p.modele}: ${p.quantite} units @ $${p.prix}`);
    });

    await pool.end();
    console.log('\nProducts inserted successfully');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

insertTestProducts();
