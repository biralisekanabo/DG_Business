const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name='vente' 
       ORDER BY ordinal_position`
    );
    
    console.log('📋 Colonnes de la table vente sur Railway:\n');
    res.rows.forEach(r => {
      console.log(`   - ${r.column_name}: ${r.data_type}`);
    });
    
    // Vérifier spécifiquement signature_data
    const hasSignature = res.rows.some(r => r.column_name === 'signature_data');
    console.log(hasSignature ? '\n✅ signature_data existe' : '\n❌ signature_data n\'existe pas');
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
})();
