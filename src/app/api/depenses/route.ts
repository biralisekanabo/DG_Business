import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper pour extraire userId du header Authorization ou du cookie
function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});
  return cookies["token"] || null;
}

// GET : Récupère toutes les dépenses de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { rows } = await pool.query(
      `SELECT id, date, motif, montant, devise, justificatif
       FROM depenses
       WHERE userid = $1
       ORDER BY date DESC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Erreur API depenses GET:", error.message);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la récupération des dépenses." },
      { status: 500 }
    );
  }
}

// POST : Crée une nouvelle dépense
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { date, motif, montant, devise, justificatif } = body;

    // Validation
    if (!date || !motif || montant === undefined || !devise) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (date, motif, montant, devise)" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO depenses (userid, date, motif, montant, devise, justificatif)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, date, motif, montant, devise, justificatif`,
      [userId, date, motif, montant, devise, justificatif || null]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Erreur API depenses POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}