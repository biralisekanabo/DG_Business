const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testMovements() {
  try {
    console.log('Testing Mouvements (Movements) APIs...\n');

    // 1. Test GET mouvements
    console.log('1️⃣  Testing GET /api/mouvements');
    const getMRes = await fetch('http://localhost:3000/api/mouvements');
    if (!getMRes.ok) throw new Error(`GET failed: ${getMRes.status}`);
    const mouvements = await getMRes.json();
    console.log(`✓ GET Success - Found ${mouvements.length} movements\n`);

    // 2. Test POST mouvement
    console.log('2️⃣  Testing POST /api/mouvements');
    const newMouvement = {
      stockId: 1,  // iPhone 15 Pro
      type: 'entree',
      quantite: 5,
      date: new Date().toISOString(),
      raison: 'Réapprovisionnement du fournisseur',
      utilisateur: 'propriétaire'
    };
    const postMRes = await fetch('http://localhost:3000/api/mouvements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMouvement)
    });
    if (!postMRes.ok) throw new Error(`POST failed: ${postMRes.status}`);
    const createdMouvement = await postMRes.json();
    console.log(`✓ POST Success - Created mouvement (ID: ${createdMouvement.id})\n`);

    // 3. Verify all mouvements
    console.log('3️⃣  Fetching all mouvements');
    const verifyMRes = await fetch('http://localhost:3000/api/mouvements');
    const allMouvements = await verifyMRes.json();
    console.log(`✓ ${allMouvements.length} total mouvements`);
    allMouvements.slice(0, 3).forEach(m => {
      console.log(`  - Type: ${m.type}, Quantité: ${m.quantite}, Raison: ${m.raison}`);
    });

    console.log('\n✅ All Mouvements API tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

testMovements();
