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

// GET: Récupère les mouvements de l'utilisateur authentifié
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT m.id, m.stock_id as stockId, m.type, m.quantite, m.date, m.raison, m.utilisateur 
       FROM mouvements m
       JOIN stock s ON m.stock_id = s.id
       WHERE s.userid = $1
       ORDER BY m.date DESC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur mouvements GET:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mouvements." },
      { status: 500 }
    );
  }
}

// POST: Ajoute un mouvement pour l'utilisateur authentifié
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { stockId, type, quantite, date, raison, utilisateur } = body;

    // Vérifier que le stock appartient à l'utilisateur
    const checkResult = await pool.query(
      "SELECT userid FROM stock WHERE id = $1",
      [stockId]
    );
    
    if (checkResult.rows.length === 0 || checkResult.rows[0].userid !== userId) {
      return NextResponse.json({ error: "Stock non autorisé" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "INSERT INTO mouvements (stock_id, type, quantite, date, raison, utilisateur) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, stock_id as stockId, type, quantite, date, raison, utilisateur",
      [stockId, type, quantite, date, raison, utilisateur]
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erreur mouvements POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du mouvement." },
      { status: 500 }
    );
  }
}
