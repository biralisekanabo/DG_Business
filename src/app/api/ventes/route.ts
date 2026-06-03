import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Helper pour extraire userId du header Authorization ou du cookie
function getUserId(req: NextRequest): string | null {
  // Chercher d'abord dans le header Authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7); // Retirer "Bearer "
  }
  
  // Sinon chercher dans les cookies
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies["token"] || null;
}

// GET: Récupère les ventes de l'utilisateur authentifié
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        v.id, 
        v.date, 
        v.stock_id, 
        v.clientname,
        v.montant,
        v.devise
       FROM vente v
       WHERE v.userid = $1 
       ORDER BY v.date DESC`, 
      [userId]
    );

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error("❌ Erreur GET /api/ventes:", error.message);
    
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des ventes" }, 
      { status: 500 }
    );
  }
}

// POST: Crée une nouvelle vente ET déduction du stock
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { date, client: nomClient, montant, devise, produitId, quantite } = await req.json();

    // Validation des champs
    if (!date || !nomClient) {
      return NextResponse.json({ error: "Champs requis manquants (date, client)" }, { status: 400 });
    }

    // Valider montant
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      return NextResponse.json({ error: "Montant invalide ou manquant" }, { status: 400 });
    }

    // Si produitId et quantite sont fournis, vérifier et déduire le stock
    if (produitId && quantite) {
      const qtVente = parseInt(quantite);
      
      if (isNaN(qtVente) || qtVente <= 0) {
        return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
      }

      // Vérifier que le produit existe et appartient à l'utilisateur
      const stockCheck = await client.query(
        "SELECT id, quantite FROM stock WHERE id = $1 AND userid = $2",
        [produitId, userId]
      );

      if (stockCheck.rows.length === 0) {
        return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
      }

      const stockActuel = stockCheck.rows[0].quantite;
      
      // Vérifier que le stock est suffisant
      if (stockActuel < qtVente) {
        return NextResponse.json(
          { error: `Stock insuffisant. Disponible: ${stockActuel}, Demandé: ${qtVente}` },
          { status: 400 }
        );
      }

      // BEGIN TRANSACTION
      await client.query("BEGIN");

      try {
        // 1. Créer la vente
        const venteResult = await client.query(
          `INSERT INTO vente (userid, date, clientname, montant, devise, stock_id) 
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, date, clientname, montant, devise, stock_id`,
          [userId, date, nomClient, montant, devise || 'USD', produitId]
        );

        // 2. Déduire le stock
        const newQuantite = stockActuel - qtVente;
        await client.query(
          "UPDATE stock SET quantite = $1 WHERE id = $2",
          [newQuantite, produitId]
        );

        // 3. Enregistrer le mouvement (sortie)
        await client.query(
          `INSERT INTO mouvements (userid, stock_id, type, quantite, date, raison, utilisateur) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, produitId, 'sortie', qtVente, date, `Vente au client: ${nomClient}`, userId]
        );

        // COMMIT
        await client.query("COMMIT");

        return NextResponse.json({
          ...venteResult.rows[0],
          stockRestant: newQuantite,
          message: `✅ Vente créée et stock décoté. Stock restant: ${newQuantite}`
        });

      } catch (txError) {
        await client.query("ROLLBACK");
        throw txError;
      }
    } else {
      // Ancienne logique si pas de produitId (rétro-compatibilité)
      const result = await client.query(
        `INSERT INTO vente (userid, date, clientname, montant, devise) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, date, clientname, montant, devise`,
        [userId, date, nomClient, montant, devise || 'USD']
      );

      return NextResponse.json(result.rows[0]);
    }

  } catch (error: any) {
    console.error("❌ Erreur POST /api/ventes:", error.message);
    
    return NextResponse.json(
      { error: error.message || "Erreur serveur lors de la création de la vente" }, 
      { status: 500 }
    );
  } finally {
    client.release();
  }
}