const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addStockIdToVente() {
  try {
    console.log('🔧 Adding stock_id column to vente table...\n');

    // Check if column already exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'vente' AND column_name = 'stock_id';
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column stock_id already exists in vente table');
      await pool.end();
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE vente
      ADD COLUMN stock_id INTEGER REFERENCES stock(id) ON DELETE SET NULL
    `);

    console.log('✅ Column stock_id added successfully to vente table');
    console.log('   - Foreign key: references stock(id)');
    console.log('   - ON DELETE: SET NULL');

    // Verify
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vente' AND column_name = 'stock_id';
    `);

    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log(`\n✅ Verification successful:`);
      console.log(`   - Column: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Nullable: ${col.is_nullable}`);
    }

    await pool.end();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

addStockIdToVente();
