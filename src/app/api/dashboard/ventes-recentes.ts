import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }
    const result = await pool.query(
      'SELECT client, montant, date FROM vente WHERE "id" = $1 ORDER BY date DESC LIMIT 5',
      [userId]
    );
    return NextResponse.json({ ventes: result.rows });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
