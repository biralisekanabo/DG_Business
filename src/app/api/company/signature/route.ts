import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("signature") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Pas de fichier fourni" },
        { status: 400 }
      );
    }

    // Créer le répertoire s'il n'existe pas
    const uploadDir = join(process.cwd(), "public/uploads/signatures");
    await mkdir(uploadDir, { recursive: true });

    // Sauvegarder le fichier
    const buffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const filename = `signature-${userId}-${timestamp}.${file.name.split(".").pop()}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, Buffer.from(buffer));

    // Mettre à jour la base de données
    const signature_url = `/uploads/signatures/${filename}`;
    
    await pool.query(
      `UPDATE company 
       SET signature_url = $1 
       WHERE userid = $2`,
      [signature_url, userId]
    );

    return NextResponse.json(
      { 
        success: true, 
        signature_url,
        message: "Signature sauvegardée avec succès" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'upload de la signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de la signature" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mettre à jour la base de données
    await pool.query(
      `UPDATE company 
       SET signature_url = NULL 
       WHERE userid = $1`,
      [userId]
    );

    return NextResponse.json(
      { success: true, message: "Signature supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la signature:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la signature" },
      { status: 500 }
    );
  }
}
