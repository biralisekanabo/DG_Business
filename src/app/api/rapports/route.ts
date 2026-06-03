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

// GET: Récupère les rapports de l'utilisateur authentifié
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { rows } = await pool.query(
      "SELECT id, titre, type, date_generation as date, data, created_at FROM rapports WHERE userid = $1 ORDER BY date_generation DESC",
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur API rapports:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des rapports." }, { status: 500 });
  }
}
