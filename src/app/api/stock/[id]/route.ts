import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

// GET: Récupère un article du stock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT id, nom as modele, quantite, prix_unitaire as prix, seuil_alerte, categorie, fournisseur, devise, seuil 
       FROM stock 
       WHERE id = $1 AND userid = $2`,
      [id, userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Stock item GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'article." },
      { status: 500 }
    );
  }
}

// PUT: Modifie un article du stock
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { modele, quantite, prix, categorie, fournisseur, devise, seuil } = body;

    // Vérifier que l'article appartient à l'utilisateur
    const checkResult = await pool.query(
      "SELECT userid FROM stock WHERE id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0 || checkResult.rows[0].userid !== userId) {
      return NextResponse.json({ error: "Article non autorisé" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `UPDATE stock
       SET nom = $1, quantite = $2, prix_unitaire = $3, categorie = $4, fournisseur = $5, devise = $6, seuil_alerte = $7, seuil = $8
       WHERE id = $9 AND userid = $10
       RETURNING id, nom as modele, quantite, prix_unitaire as prix, seuil_alerte, categorie, fournisseur, devise, seuil`,
      [modele, quantite, prix, categorie, fournisseur, devise, seuil, seuil, id, userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Stock item PUT error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'article." },
      { status: 500 }
    );
  }
}

// DELETE: Supprime un article du stock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'article appartient à l'utilisateur
    const checkResult = await pool.query(
      "SELECT userid FROM stock WHERE id = $1",
      [id]
    );
    
    if (checkResult.rows.length === 0 || checkResult.rows[0].userid !== userId) {
      return NextResponse.json({ error: "Article non autorisé" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "DELETE FROM stock WHERE id = $1 AND userid = $2 RETURNING *",
      [id, userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stock item DELETE error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'article." },
      { status: 500 }
    );
  }
}
