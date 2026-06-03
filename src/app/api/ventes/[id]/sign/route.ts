import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { signature, signed_at } = await request.json();

    if (!signature) {
      return NextResponse.json(
        { error: "Signature manquante" },
        { status: 400 }
      );
    }

    // Update the vente with signed_at timestamp and signature data
    const result = await pool.query(
      `UPDATE vente 
       SET signed_at = $1, signature_data = $2 
       WHERE id = $3 AND userid = $4 
       RETURNING id, signed_at, signature_data`,
      [signed_at || new Date().toISOString(), signature, id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Vente non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la signature du reçu" },
      { status: 500 }
    );
  }
}
