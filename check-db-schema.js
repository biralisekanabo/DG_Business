const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check vente table structure
    console.log('📋 Table VENTE structure:');
    const venteColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vente'
      ORDER BY ordinal_position;
    `);
    
    if (venteColumns.rows.length === 0) {
      console.log('⚠️  Table vente does not exist!');
    } else {
      console.log(venteColumns.rows.map(r => 
        `  - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`
      ).join('\n'));
    }

    console.log('\n📋 Table STOCK structure:');
    const stockColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'stock'
      ORDER BY ordinal_position;
    `);
    
    if (stockColumns.rows.length === 0) {
      console.log('⚠️  Table stock does not exist!');
    } else {
      console.log(stockColumns.rows.map(r => 
        `  - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`
      ).join('\n'));
    }

    console.log('\n📋 Table MOUVEMENTS structure:');
    const mouvementsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mouvements'
      ORDER BY ordinal_position;
    `);
    
    if (mouvementsColumns.rows.length === 0) {
      console.log('⚠️  Table mouvements does not exist!');
    } else {
      console.log(mouvementsColumns.rows.map(r => 
        `  - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`
      ).join('\n'));
    }

    // Check if stock_id exists in vente
    const hasStockId = venteColumns.rows.some(r => r.column_name === 'stock_id');
    console.log(`\n✅ Vente table has stock_id: ${hasStockId}`);

    if (!hasStockId && venteColumns.rows.length > 0) {
      console.log('\n⚠️  WARNING: stock_id column is missing from vente table!');
      console.log('Action: Need to run migration to add stock_id column');
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSchema();
