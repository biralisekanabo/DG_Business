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

// GET: Récupère une vente spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        id, 
        date, 
        clientname, 
        montant,
        devise,
        stock_id,
        createdat,
        signed_at,
        signature_data
       FROM vente 
       WHERE id = $1 AND userid = $2`, 
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Vente non trouvée" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error("❌ Erreur GET /api/ventes/[id]:", error.message);
    
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}

// PUT: Modifie une vente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { date, client, montant, devise } = await request.json();

    if (!date || !montant) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Vérifier que la vente appartient à l'utilisateur
    const checkResult = await pool.query(
      "SELECT id FROM vente WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Vente non trouvée ou non autorisée" }, { status: 404 });
    }

    const result = await pool.query(
      `UPDATE vente 
       SET date = $1, montant = $2, devise = $3, clientname = $4
       WHERE id = $5 AND userid = $6
       RETURNING id, date, clientname, montant, devise, stock_id`,
      [date, montant, devise || 'USD', client, id, userId]
    );

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error("❌ Erreur PUT /api/ventes/[id]:", error.message);
    
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}

// DELETE: Supprime une vente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la vente appartient à l'utilisateur
    const checkResult = await pool.query(
      "SELECT id FROM vente WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Vente non trouvée ou non autorisée" }, { status: 404 });
    }

    await pool.query(
      "DELETE FROM vente WHERE id = $1 AND userid = $2",
      [id, userId]
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Erreur DELETE /api/ventes/[id]:", error.message);
    
    return NextResponse.json(
      { error: "Erreur serveur" }, 
      { status: 500 }
    );
  }
}
