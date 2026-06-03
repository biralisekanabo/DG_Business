import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

// PUT : mise à jour d'une dette (la date d'octroi n'est pas modifiable)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    // On n'accepte pas de champ "date" (date_octroi) – elle reste inchangée
    const { client, montant, devise, echeance, statut } = body;

    if (!client || !montant || !devise || !echeance) {
      return NextResponse.json(
        { error: "Tous les champs (client, montant, devise, échéance) sont requis" },
        { status: 400 }
      );
    }
    if (devise !== "USD" && devise !== "CDF") {
      return NextResponse.json({ error: "Devise invalide (USD ou CDF)" }, { status: 400 });
    }

    const { rowCount } = await pool.query(
      `UPDATE dettes
       SET creancier = $1,
           montant = $2,
           devise = $3,
           date_limite = $4,
           statut = $5
       WHERE id = $6 AND userid = $7`,
      [client, montant, devise, echeance, statut, id, userId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Dette non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Retourner la dette mise à jour (avec la date d'octroi d'origine)
    const { rows } = await pool.query(
      `SELECT id,
              creancier AS client,
              montant,
              devise,
              date_octroi AS date,
              date_limite AS echeance,
              statut
       FROM dettes
       WHERE id = $1 AND userid = $2`,
      [id, userId]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Erreur PUT /api/dettes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la dette." },
      { status: 500 }
    );
  }
}

// DELETE : suppression d'une dette
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { rowCount } = await pool.query(
      "DELETE FROM dettes WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Dette non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erreur DELETE /api/dettes/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la dette." },
      { status: 500 }
    );
  }
}