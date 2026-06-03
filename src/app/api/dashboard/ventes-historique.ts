import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }
    // Regrouper les ventes par date (7 derniers jours)
    const result = await pool.query(
      'SELECT date, SUM(montant) as total FROM vente WHERE "id" = $1 GROUP BY date ORDER BY date DESC LIMIT 7',
      [userId]
    );
    return NextResponse.json({ historique: result.rows });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
