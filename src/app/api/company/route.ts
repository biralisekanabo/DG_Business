import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';

const LOGO_PATH = './public/company/logo.png';
const LOGO_DIR = './public/company';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookie = request.cookies.get('token');
  return cookie?.value || null;
}

/**
 * API pour gérer l'entreprise
 * GET /api/company - Retourne les infos company en JSON
 * GET /api/company?logo - Retourne le logo
 */

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Si query param "logo", retourner le logo
    const url = new URL(request.url);
    if (url.searchParams.get('logo') !== null) {
      if (!fs.existsSync(LOGO_PATH)) {
        return NextResponse.json({ error: 'Logo non trouvé' }, { status: 404 });
      }

      const logoBuffer = fs.readFileSync(LOGO_PATH);
      return new NextResponse(logoBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'max-age=3600',
        },
      });
    }

    // Sinon retourner les infos company (par défaut si pas de table company)
    try {
      const result = await pool.query(
        'SELECT id, nom, phone, adresse, logo_url, signature_url FROM company WHERE userid = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { nom: 'DG Business', phone: '', adresse: '', logo_url: null, signature_url: null },
          { status: 200 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } catch (dbError: any) {
      // Si table company n'existe pas, retourner infos par défaut
      if (dbError.code === '42P01') { // relation does not exist
        return NextResponse.json(
          { nom: 'DG Business', phone: '', adresse: '' },
          { status: 200 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Erreur GET /api/company:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const cookie = request.cookies.get('token');
      if (!cookie) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier manquant' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true });
    }

    // Sauvegarder le fichier
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(LOGO_PATH, Buffer.from(buffer));

    return NextResponse.json(
      {
        success: true,
        message: 'Logo uploadé avec succès',
        url: '/company/logo.png',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'upload du logo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/company/logo - Supprime le logo
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const cookie = request.cookies.get('token');
      if (!cookie) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }
    }

    if (fs.existsSync(LOGO_PATH)) {
      fs.unlinkSync(LOGO_PATH);
    }

    return NextResponse.json({
      success: true,
      message: 'Logo supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du logo:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
