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
    
    const result = await pool.query(
      'SELECT id, clientname, montant, date FROM vente WHERE userid = $1 ORDER BY date DESC LIMIT 5',
      [userId]
    );
    return NextResponse.json({ ventes: result.rows });
  } catch (error: any) {
    console.error("Erreur API ventes-recentes:", error.message);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
