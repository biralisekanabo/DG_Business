// src/app/api/signup/route.ts
import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import pool from "@/lib/db";


export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, password, name } = await req.json();

    // 1. Validation des champs reçus depuis le formulaire
    if (!phoneNumber || !password || !name) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires (Nom, Téléphone, Mot de passe) doivent être remplis." }, 
        { status: 400 }
      );
    }



    // 2. Transformation du numéro en identifiant unique pour satisfaire la colonne "email" de la BDD
    const formattedEmail = `${phoneNumber.trim()}@dg-business.com`;


    // Vérifier si l'utilisateur existe déjà
    const exists = await pool.query(
      'SELECT id FROM "user" WHERE "phonenumber" = $1',
      [phoneNumber]
    );
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Numéro déjà utilisé" }, { status: 409 });
    }

    // (Suppression de la logique de rôle, plus de colonne role)

    // 4. Hachage sécurisé du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);



    // Insérer l'utilisateur dans la base
    const result = await pool.query(
      'INSERT INTO "user" ("phonenumber", "passwordhash", "name", "email") VALUES ($1, $2, $3, $4) RETURNING id, name',
      [phoneNumber, passwordHash, name, formattedEmail]
    );
    console.log("Résultat SQL signup:", result.rows);
    const user = result.rows[0];

    // Inscription réussie !
    const response = NextResponse.json(
      { message: "Compte créé avec succès", name: user.name, id: user.id },
      { status: 201 }
    );

    // Créer un token cookie comme dans le login
    response.cookies.set('token', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("====== ERREUR CRITIQUE SERVEUR ======");
    console.error(error);
    console.error("=====================================");
    let message = "Erreur de connexion Neon";
    if (error instanceof Error) {
      message = error.message;
    }
    // Renvoie l'erreur réelle au navigateur pour qu'on puisse la lire directement à l'écran
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
  }
