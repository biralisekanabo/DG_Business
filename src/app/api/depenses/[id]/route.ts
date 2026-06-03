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

// PUT : Modifier une dépense existante
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
    const { date, motif, montant, devise, justificatif } = body;

    if (!date || !motif || montant === undefined || !devise) {
      return NextResponse.json(
        { error: "Tous les champs sont requis pour la mise à jour" },
        { status: 400 }
      );
    }

    const { rowCount } = await pool.query(
      `UPDATE depenses
       SET date = $1, motif = $2, montant = $3, devise = $4, justificatif = $5
       WHERE id = $6 AND userid = $7`,
      [date, motif, montant, devise, justificatif || null, id, userId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Dépense non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const { rows } = await pool.query(
      `SELECT id, date, motif, montant, devise, justificatif
       FROM depenses
       WHERE id = $1 AND userid = $2`,
      [id, userId]
    );

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Erreur API depenses PUT:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE : Supprimer une dépense
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
      "DELETE FROM depenses WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Dépense non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    // Pas de contenu pour une suppression réussie
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Erreur API depenses DELETE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}