import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const { phoneNumber, password, name } = await req.json();
  if (!phoneNumber || !password || !name) {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }
  try {
    // Vérifier si l'utilisateur existe déjà
    const exists = await pool.query(
      'SELECT id FROM "user" WHERE "phoneNumber" = $1',
      [phoneNumber]
    );
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Numéro déjà utilisé" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "user" ("phoneNumber", "passwordHash", "name", "email") VALUES ($1, $2, $3, $4) RETURNING id, name',
      [phoneNumber, passwordHash, name, phoneNumber + "@dummy.com"]
    );
    const user = result.rows[0];
    return NextResponse.json({ name: user.name });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
