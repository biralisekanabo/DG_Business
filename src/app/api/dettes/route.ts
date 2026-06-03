import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Helper pour extraire userId
function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {});
  return cookies["token"] || null;
}

// GET : toutes les dettes de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const { rows } = await pool.query(
      `SELECT id,
              creancier AS client,
              montant,
              devise,
              date_octroi AS date,
              date_limite AS echeance,
              statut
       FROM dettes
       WHERE userid = $1
       ORDER BY date_limite DESC`,
      [userId]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur GET /api/dettes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dettes." },
      { status: 500 }
    );
  }
}

// POST : créer une dette (date d'octroi automatique = aujourd'hui)
export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const body = await req.json();
    const { client, montant, devise, echeance, statut } = body;

    // Validation des champs obligatoires
    if (!client || !montant || !devise || !echeance) {
      return NextResponse.json(
        { error: "Champs manquants : client, montant, devise, échéance" },
        { status: 400 }
      );
    }
    if (devise !== "USD" && devise !== "CDF") {
      return NextResponse.json({ error: "Devise invalide (USD ou CDF)" }, { status: 400 });
    }

    // La date d'octroi est toujours la date du jour (ne pas utiliser celle du frontend)
    const date_octroi = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { rows } = await pool.query(
      `INSERT INTO dettes (creancier, montant, devise, date_octroi, date_limite, statut, userid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id,
                 creancier AS client,
                 montant,
                 devise,
                 date_octroi AS date,
                 date_limite AS echeance,
                 statut`,
      [client, montant, devise, date_octroi, echeance, statut || "En attente", userId]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/dettes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la dette." },
      { status: 500 }
    );
  }
}