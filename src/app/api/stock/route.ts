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

// GET: Récupère le stock de l'utilisateur authentifié
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT id, nom as modele, quantite, prix_unitaire as prix, seuil_alerte, categorie, fournisseur, devise, seuil 
       FROM stock 
       WHERE userid = $1 
       ORDER BY nom ASC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Stock GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du stock." },
      { status: 500 }
    );
  }
}

// POST: Ajoute un article au stock de l'utilisateur authentifié
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { modele, quantite, prix, categorie, fournisseur, devise, seuil } = body;

    const { rows } = await pool.query(
      `INSERT INTO stock (userid, nom, quantite, prix_unitaire, categorie, fournisseur, devise, seuil_alerte, seuil)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, nom as modele, quantite, prix_unitaire as prix, seuil_alerte, categorie, fournisseur, devise, seuil`,
      [userId, modele, quantite, prix, categorie, fournisseur, devise, seuil, seuil]
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Stock POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du stock." },
      { status: 500 }
    );
  }
}
