import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import PDFGenerator from '@/services/pdfGenerator';
import SignatureService from '@/services/signatureService';

/**
 * API pour générer un reçu signé
 * POST /api/receipts/generate
 * Body: { venteId: string, signature: SignatureData }
 */

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookie = request.cookies.get('token');
  return cookie?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { venteId, signature } = await request.json();

    if (!venteId || !signature) {
      return NextResponse.json(
        { error: 'Données manquantes: venteId et signature requis' },
        { status: 400 }
      );
    }

    // Récupérer la vente depuis la base de données
    const venteResult = await pool.query(
      'SELECT id, clientname, montant, devise, date FROM vente WHERE id = $1 AND userid = $2',
      [venteId, userId]
    );

    if (venteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      );
    }

    const vente = venteResult.rows[0];

    // Vérifier la signature
    const contentToSign = `${vente.id}${vente.clientname}${vente.montant}`;
    const verification = SignatureService.verifySignature(
      contentToSign,
      signature,
      process.env.PUBLIC_KEY || ''
    );

    if (!verification.isValid) {
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      );
    }

    // Préparer les données du reçu
    const receiptData = {
      id: vente.id,
      client: vente.clientname,
      montant: vente.montant,
      devise: vente.devise || 'USD',
      date: vente.date,
    };

    // Générer le PDF
    const pdfBuffer = await PDFGenerator.generateReceiptPDF(
      receiptData,
      signature,
      {
        title: 'Reçu de vente',
        author: 'DG Business',
        subject: `Reçu ${vente.id}`,
        companyName: 'DG Business',
        companyAddress: process.env.COMPANY_ADDRESS || '',
        companyPhone: process.env.COMPANY_PHONE || '',
      }
    );

    // Sauvegarder le PDF
    const filename = `receipt_${vente.id}_${Date.now()}.pdf`;
    await PDFGenerator.savePDF(pdfBuffer, filename, './public/receipts');

    // Enregistrer dans la base de données
    await pool.query(
      'UPDATE vente SET receipt_generated = true, receipt_path = $1, signed_at = $2 WHERE id = $3',
      [filename, new Date(), venteId]
    );

    return NextResponse.json({
      success: true,
      message: 'Reçu généré avec succès',
      filename,
      url: `/receipts/${filename}`,
      signature: {
        signataire: signature.signataire,
        date: signature.date,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du reçu:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du reçu' },
      { status: 500 }
    );
  }
}

/**
 * Récupère le statut de génération du reçu
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venteId = searchParams.get('venteId');

    if (!venteId) {
      return NextResponse.json(
        { error: 'venteId requis' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT id, client, montant, receipt_generated, receipt_path, signed_at FROM vente WHERE id = $1 AND userid = $2',
      [venteId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vente introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
