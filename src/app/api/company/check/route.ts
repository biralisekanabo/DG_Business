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
 * Check if company settings are complete for receipt generation
 * Requires: logo, address, phone, company name, signature
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    try {
      const result = await pool.query(
        `SELECT id, nom, phone, adresse FROM company WHERE userid = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            isComplete: false,
            missing: ["nom", "phone", "adresse"],
            message:
              "Veuillez compléter vos informations d'entreprise dans les paramètres",
          },
          { status: 400 }
        );
      }

      const company = result.rows[0];
      const missing = [];

      if (!company.nom || company.nom.trim() === "") missing.push("nom");
      if (!company.phone || company.phone.trim() === "") missing.push("phone");
      if (!company.adresse || company.adresse.trim() === "")
        missing.push("adresse");

      if (missing.length > 0) {
        return NextResponse.json(
          {
            isComplete: false,
            missing,
            company: {
              nom: company.nom,
              phone: company.phone,
              adresse: company.adresse,
            },
            message: `Complétez les champs manquants: ${missing.join(", ")}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        isComplete: true,
        company: {
          nom: company.nom,
          phone: company.phone,
          adresse: company.adresse,
        },
        message: "Tous les paramètres sont complets",
      });
    } catch (dbError: any) {
      // If company table doesn't exist
      if (dbError.code === "42P01") {
        return NextResponse.json(
          {
            isComplete: false,
            missing: ["nom", "phone", "adresse"],
            message:
              "Veuillez compléter vos informations d'entreprise dans les paramètres",
          },
          { status: 400 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Erreur GET /api/company/check:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
