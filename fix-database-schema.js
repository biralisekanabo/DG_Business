const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
  try {
    console.log('Starting schema fix for Railway database...\n');

    // ==================== VENTE TABLE ====================
    console.log('Fixing vente table...');
    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN clientname VARCHAR(255);`);
      console.log('✓ Added clientname to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has clientname');
      } else {
        console.log('⚠ vente clientname:', e.message.substring(0, 50));
      }
    }

    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN montant DECIMAL(10, 2);`);
      console.log('✓ Added montant to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has montant');
      } else {
        console.log('⚠ vente montant:', e.message.substring(0, 50));
      }
    }

    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN devise VARCHAR(10) DEFAULT 'USD';`);
      console.log('✓ Added devise to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has devise');
      } else {
        console.log('⚠ vente devise:', e.message.substring(0, 50));
      }
    }

    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN receipt_generated BOOLEAN DEFAULT false;`);
      console.log('✓ Added receipt_generated to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has receipt_generated');
      }
    }

    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN receipt_path VARCHAR(500);`);
      console.log('✓ Added receipt_path to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has receipt_path');
      }
    }

    try {
      await pool.query(`ALTER TABLE vente ADD COLUMN signed_at TIMESTAMP;`);
      console.log('✓ Added signed_at to vente');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ vente already has signed_at');
      }
    }

    // ==================== STOCK TABLE ====================
    console.log('\nFixing stock table...');
    try {
      await pool.query(`ALTER TABLE stock ADD COLUMN nom VARCHAR(255);`);
      console.log('✓ Added nom to stock');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ stock already has nom');
      }
    }

    try {
      await pool.query(`ALTER TABLE stock ADD COLUMN prix_unitaire DECIMAL(10, 2);`);
      console.log('✓ Added prix_unitaire to stock');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ stock already has prix_unitaire');
      }
    }

    try {
      await pool.query(`ALTER TABLE stock ADD COLUMN seuil_alerte INTEGER;`);
      console.log('✓ Added seuil_alerte to stock');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ stock already has seuil_alerte');
      }
    }

    try {
      await pool.query(`ALTER TABLE stock ADD COLUMN devise VARCHAR(10) DEFAULT 'USD';`);
      console.log('✓ Added devise to stock');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ stock already has devise');
      }
    }

    // ==================== RAPPORTS TABLE ====================
    console.log('\nFixing rapports table...');
    try {
      await pool.query(`ALTER TABLE rapports ADD COLUMN rapport_path VARCHAR(500);`);
      console.log('✓ Added rapport_path to rapports');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ rapports already has rapport_path');
      }
    }

    try {
      await pool.query(`ALTER TABLE rapports ADD COLUMN total_amount DECIMAL(10, 2);`);
      console.log('✓ Added total_amount to rapports');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ rapports already has total_amount');
      }
    }

    try {
      await pool.query(`ALTER TABLE rapports ADD COLUMN nb_transactions INTEGER;`);
      console.log('✓ Added nb_transactions to rapports');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ rapports already has nb_transactions');
      }
    }

    try {
      await pool.query(`ALTER TABLE rapports ADD COLUMN signed_by VARCHAR(255);`);
      console.log('✓ Added signed_by to rapports');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ rapports already has signed_by');
      }
    }

    try {
      await pool.query(`ALTER TABLE rapports ADD COLUMN signed_at TIMESTAMP;`);
      console.log('✓ Added signed_at to rapports');
    } catch (e) {
      if (e.code === '42701') {
        console.log('✓ rapports already has signed_at');
      }
    }

    console.log('\n✅ Schema fix complete!');
    await pool.end();
  } catch (err) {
    console.error('❌ Schema fix error:', err.message);
    process.exit(1);
  }
}

fixSchema();
