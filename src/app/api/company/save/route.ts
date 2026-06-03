import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookie = request.cookies.get("token");
  return cookie?.value || null;
}

/**
 * Save company information
 * POST /api/company/save
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { nom, phone, adresse } = await request.json();

    if (!nom || !phone || !adresse) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    try {
      // Check if company record exists
      const checkResult = await pool.query(
        "SELECT id FROM company WHERE userid = $1",
        [userId]
      );

      let result;
      if (checkResult.rows.length === 0) {
        // Insert new
        result = await pool.query(
          `INSERT INTO company (userid, nom, phone, adresse)
           VALUES ($1, $2, $3, $4)
           RETURNING id, nom, phone, adresse`,
          [userId, nom, phone, adresse]
        );
      } else {
        // Update existing
        result = await pool.query(
          `UPDATE company SET nom = $1, phone = $2, adresse = $3
           WHERE userid = $4
           RETURNING id, nom, phone, adresse`,
          [nom, phone, adresse, userId]
        );
      }

      return NextResponse.json({
        success: true,
        company: result.rows[0],
        message: "Informations d'entreprise sauvegardées",
      });
    } catch (dbError: any) {
      // If company table doesn't exist, create it
      if (dbError.code === "42P01") {
        console.log("Creating company table...");

        await pool.query(`
          CREATE TABLE company (
            id SERIAL PRIMARY KEY,
            userid VARCHAR(255) UNIQUE NOT NULL,
            nom VARCHAR(255),
            phone VARCHAR(20),
            adresse TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Now insert the data
        const result = await pool.query(
          `INSERT INTO company (userid, nom, phone, adresse)
           VALUES ($1, $2, $3, $4)
           RETURNING id, nom, phone, adresse`,
          [userId, nom, phone, adresse]
        );

        return NextResponse.json({
          success: true,
          company: result.rows[0],
          message: "Informations d'entreprise sauvegardées",
        });
      }

      throw dbError;
    }
  } catch (error) {
    console.error("Erreur POST /api/company/save:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
