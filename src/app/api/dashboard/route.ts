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

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Ventes totales de l'utilisateur
    const ventes = await pool.query('SELECT COALESCE(SUM(montant),0) AS total FROM vente WHERE userid = $1', [userId]);
    // Dépenses totales de l'utilisateur
    const depenses = await pool.query('SELECT COALESCE(SUM(montant),0) AS total FROM depenses WHERE userid = $1', [userId]);
    // Dettes de l'utilisateur
    const dettes = await pool.query('SELECT COALESCE(SUM(montant),0) AS total FROM dettes WHERE userid = $1', [userId]);
    // Stock total de l'utilisateur
    const stock = await pool.query('SELECT COALESCE(SUM(quantite),0) AS total FROM stock WHERE userid = $1', [userId]);

    return NextResponse.json({
      ventes_total: ventes.rows[0].total,
      depenses_total: depenses.rows[0].total,
      dettes_total: dettes.rows[0].total,
      stock_total: stock.rows[0].total,
    });
  } catch (error: any) {
    console.error("Erreur API dashboard:", error.message);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
