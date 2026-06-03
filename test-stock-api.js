const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testStockAPIs() {
  try {
    console.log('Testing Stock APIs...\n');

    // 1. Test GET - Récupérer tous les articles
    console.log('1️⃣  Testing GET /api/stock');
    const getRes = await fetch('http://localhost:3000/api/stock');
    if (!getRes.ok) throw new Error(`GET failed: ${getRes.status}`);
    const stockItems = await getRes.json();
    console.log(`✓ GET Success - Found ${stockItems.length} items\n`);

    // 2. Test POST - Ajouter un nouvel article
    console.log('2️⃣  Testing POST /api/stock');
    const newArticle = {
      modele: 'Test Product',
      quantite: 5,
      prix: 150.00,
      categorie: 'Test',
      fournisseur: 'Test Supplier',
      devise: 'USD',
      seuil: 2
    };
    const postRes = await fetch('http://localhost:3000/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle)
    });
    if (!postRes.ok) throw new Error(`POST failed: ${postRes.status}`);
    const createdArticle = await postRes.json();
    console.log(`✓ POST Success - Created: ${createdArticle.modele} (ID: ${createdArticle.id})\n`);

    const testArticleId = createdArticle.id;

    // 3. Test GET [id] - Récupérer un article spécifique
    console.log(`3️⃣  Testing GET /api/stock/${testArticleId}`);
    const getByIdRes = await fetch(`http://localhost:3000/api/stock/${testArticleId}`);
    if (!getByIdRes.ok) throw new Error(`GET [id] failed: ${getByIdRes.status}`);
    const retrievedArticle = await getByIdRes.json();
    console.log(`✓ GET [id] Success - Retrieved: ${retrievedArticle.modele}\n`);

    // 4. Test PUT - Modifier un article
    console.log(`4️⃣  Testing PUT /api/stock/${testArticleId}`);
    const updatedArticle = {
      ...retrievedArticle,
      quantite: 20,
      prix: 175.00
    };
    const putRes = await fetch(`http://localhost:3000/api/stock/${testArticleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedArticle)
    });
    if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status}`);
    const modifiedArticle = await putRes.json();
    console.log(`✓ PUT Success - Updated: ${modifiedArticle.modele} (Quantité: ${modifiedArticle.quantite}, Prix: $${modifiedArticle.prix})\n`);

    // 5. Test DELETE - Supprimer un article
    console.log(`5️⃣  Testing DELETE /api/stock/${testArticleId}`);
    const deleteRes = await fetch(`http://localhost:3000/api/stock/${testArticleId}`, {
      method: 'DELETE'
    });
    if (!deleteRes.ok) throw new Error(`DELETE failed: ${deleteRes.status}`);
    console.log(`✓ DELETE Success - Deleted article ID: ${testArticleId}\n`);

    // 6. Verify deletion
    console.log(`6️⃣  Verifying deletion`);
    const verifyRes = await fetch(`http://localhost:3000/api/stock/${testArticleId}`);
    if (verifyRes.status === 404) {
      console.log(`✓ Verification Success - Article deleted\n`);
    } else {
      throw new Error('Article still exists after deletion');
    }

    // 7. List final stock
    console.log('7️⃣  Final stock list:');
    const finalRes = await fetch('http://localhost:3000/api/stock');
    const finalItems = await finalRes.json();
    console.log(`✓ ${finalItems.length} items in stock`);
    finalItems.forEach(item => {
      console.log(`  - ${item.modele}: ${item.quantite} units @ $${item.prix}`);
    });

    console.log('\n✅ All Stock API tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

testStockAPIs();
