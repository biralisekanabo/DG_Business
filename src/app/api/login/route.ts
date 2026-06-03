import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Champs requis" }, { status: 400 });
    }

    // On sélectionne uniquement l'id, le nom et le mot de passe
    const result = await pool.query(
      'SELECT id, name, "passwordhash" FROM "user" WHERE "phonenumber" = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.passwordhash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
    }

    // Réponse de succès sans le rôle
    const response = NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      message: "Connexion réussie" 
    });

    // Création du cookie pour le Middleware et les APIs
    response.cookies.set('token', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Erreur serveur lors du login:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}