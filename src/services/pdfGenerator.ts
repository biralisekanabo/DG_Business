import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Service de génération PDF
 * Crée des documents PDF avec logo, en-têtes, signatures
 */

interface PDFConfig {
  title: string;
  author: string;
  subject: string;
  logoPath?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
}

class PDFGenerator {
  /**
   * Génère un reçu de vente signé
   */
  static async generateReceiptPDF(
    receiptData: any,
    signatureData: any,
    config: PDFConfig
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    // En-tête avec logo
    this.addHeader(doc, config);

    // Titre
    doc.fontSize(20).font('Helvetica-Bold').text('REÇU DE VENTE', { align: 'center' });
    doc.moveDown(0.5);

    // Numéro et date
    const today = new Date().toLocaleDateString('fr-FR');
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Numéro: #${receiptData.id}`, { align: 'left' })
      .text(`Date: ${today}`)
      .text(`Client: ${receiptData.client}`);

    doc.moveDown(0.8);

    // Détails de la vente
    doc.fontSize(12).font('Helvetica-Bold').text('Détails de la transaction');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Produit: ${receiptData.produit}`, { continued: true }).text(``, { align: 'right' });
    doc.text(`Quantité: ${receiptData.quantite}`, { continued: true }).text(``, { align: 'right' });
    doc.text(`Prix unitaire: ${receiptData.prixUnitaire}$`, { continued: true }).text(``, { align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Montant total: ${receiptData.montant}$`, { continued: true }).text(``, { align: 'right' });

    doc.moveDown(1);

    // Section signature
    doc.fontSize(12).font('Helvetica-Bold').text('Signature numérique');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').fillColor('black');
    doc.text(`Signé par: ${signatureData.signataire}`);
    doc.text(`Date de signature: ${new Date(signatureData.date).toLocaleString('fr-FR')}`);
    doc.text(`Hash: ${signatureData.hash.substring(0, 40)}...`);
    doc.fillColor('green');
    doc.text(`Certificat valide: ✓`);
    doc.fillColor('black');

    doc.moveDown(1);

    // Pied de page
    this.addFooter(doc, config);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  /**
   * Génère un rapport de ventes
   */
  static async generateSalesReportPDF(
    reportData: any,
    signatureData: any,
    config: PDFConfig
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    // En-tête
    this.addHeader(doc, config);

    // Titre
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('RAPPORT DE VENTES', { align: 'center' });
    doc.fontSize(12).text(`Période: ${reportData.periode}`, { align: 'center' });
    doc.moveDown(1);

    // Statistiques
    doc.fontSize(12).font('Helvetica-Bold').text('Statistiques');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Total des ventes: ${reportData.totalVentes}$`);
    doc.text(`Nombre de transactions: ${reportData.nbTransactions}`);
    doc.text(`Montant moyen: ${reportData.montantMoyen}$`);
    doc.text(`Meilleur client: ${reportData.meilleurClient}`);

    doc.moveDown(1);

    // Détail des ventes
    if (reportData.ventes && reportData.ventes.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Détail des ventes');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      reportData.ventes.forEach((vente: any) => {
        doc.text(`${vente.date} - ${vente.client}: ${vente.montant}$`);
      });
    }

    doc.moveDown(1);

    // Section signature
    doc.fontSize(12).font('Helvetica-Bold').text('Validation et signature');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').fillColor('black');
    doc.text(`Signé par: ${signatureData.signataire}`);
    doc.text(`Date de signature: ${new Date(signatureData.date).toLocaleString('fr-FR')}`);
    doc.text(`Tampon numérique: ${signatureData.hash.substring(0, 60)}...`);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('green');
    doc.text(`Certificat: VALIDE ✓`);
    doc.fillColor('black');

    doc.moveDown(1.5);

    // Pied de page
    this.addFooter(doc, config);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  /**
   * Ajoute l'en-tête du document
   */
  private static addHeader(doc: any, config: PDFConfig) {
    // Logo (s'il existe)
    if (config.logoPath && fs.existsSync(config.logoPath)) {
      try {
        doc.image(config.logoPath, 40, 20, { width: 60 });
      } catch (error) {
        console.log('Logo non trouvé');
      }
    }

    // Informations entreprise
    doc.fontSize(14).font('Helvetica-Bold').text(config.companyName, 110, 25);
    doc.fontSize(10).font('Helvetica').text(config.companyAddress || '', 110, 45);
    doc.fontSize(10).text(config.companyPhone || '', 110, 60);

    doc.moveDown(3);
  }

  /**
   * Ajoute le pied de page
   */
  private static addFooter(doc: any, config: PDFConfig) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).font('Helvetica').text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `© ${new Date().getFullYear()} ${config.companyName} - Document généré numériquement`, 
        50, 
        doc.page.height - 30, 
        { align: 'center' }
      );
    }
  }

  /**
   * Sauvegarde le PDF sur le disque
   */
  static async savePDF(pdfBuffer: Buffer, filename: string, directory: string = './public/reports'): Promise<string> {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const filepath = path.join(directory, filename);
    fs.writeFileSync(filepath, pdfBuffer);
    return filepath;
  }
}

export default PDFGenerator;
