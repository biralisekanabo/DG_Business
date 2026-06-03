import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import pool from '@/lib/db';
import { ReportPDF, RapportData } from '@/components/ReportPDF';
import fs from 'fs/promises';
import path from 'path';

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
  const cookie = request.cookies.get('token');
  return cookie?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const ventesResult = await pool.query(
      `SELECT * FROM vente WHERE userid = $1 ORDER BY date DESC`,
      [userId]
    );
    const ventes = ventesResult.rows;

    if (ventes.length === 0) {
      return NextResponse.json(
        { error: 'Aucune vente trouvée pour cet utilisateur' },
        { status: 404 }
      );
    }

    const totalVentes = ventes.reduce((sum, v) => sum + parseFloat(v.montant), 0);
    const nbTransactions = ventes.length;
    const montantMoyen = nbTransactions > 0 ? totalVentes / nbTransactions : 0;

    const clientStats: Record<string, number> = {};
    for (const v of ventes) {
      clientStats[v.client] = (clientStats[v.client] || 0) + parseFloat(v.montant);
    }
    let meilleurClient = 'N/A', maxMontant = 0;
    for (const [client, montant] of Object.entries(clientStats)) {
      if (montant > maxMontant) {
        maxMontant = montant;
        meilleurClient = client;
      }
    }

    const dates = ventes.map(v => new Date(v.date));
    const dateMin = new Date(Math.min(...dates.map(d => d.getTime())));
    const dateMax = new Date(Math.max(...dates.map(d => d.getTime())));
    const periode = `Du ${dateMin.toLocaleDateString('fr-FR')} au ${dateMax.toLocaleDateString('fr-FR')}`;

    const reportData = {
      periode,
      totalVentes: totalVentes.toFixed(2),
      nbTransactions,
      montantMoyen: montantMoyen.toFixed(2),
      meilleurClient,
      ventes: ventes.map((v: any) => ({
        date: new Date(v.date).toLocaleDateString('fr-FR'),
        client: v.client,
        montant: parseFloat(v.montant).toFixed(2),
      })),
    };

    const rapportPDFData: RapportData = {
      titre: `Rapport global des ventes - ${new Date().toLocaleDateString('fr-FR')}`,
      type: 'global',
      date: new Date().toISOString(),
      contenu: `Période : ${periode}. Total ventes : ${totalVentes.toFixed(2)} €, ${nbTransactions} transactions.`,
      statistics: reportData,
    };

    // Génération du PDF avec JSX (maintenant supporté car fichier .tsx)
    const pdfBuffer = await renderToBuffer(<ReportPDF rapport={rapportPDFData} />);

    const filename = `rapport_global_${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), 'public', 'reports');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, filename), pdfBuffer);

    await pool.query(
      `INSERT INTO rapports (userid, type, rapport_path, total_amount, nb_transactions, signed_by, signed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId, 'global', filename, totalVentes, nbTransactions, null, null]
    );

    return NextResponse.json({
      success: true,
      message: 'Rapport global généré avec succès',
      filename,
      url: `/reports/${filename}`,
      statistics: reportData,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport global:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    let query = 'SELECT * FROM rapports WHERE userid = $1';
    const params: any[] = [userId];
    if (type && ['global', 'daily', 'weekly', 'monthly'].includes(type)) {
      query += ' AND type = $2';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}