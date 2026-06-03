// components/ReportPDF.tsx

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Enregistrement des polices (optionnel, placez les fichiers .ttf dans public/fonts/)
Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });
Font.register({ family: 'Inter-Bold', src: '/fonts/Inter-Bold.ttf' });

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 10,
    color: '#4b5563',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 20,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  table: {
    marginVertical: 15,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  col1: { width: '30%' },
  col2: { width: '35%' },
  col3: { width: '35%' },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    borderTopStyle: 'dashed',
    paddingTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
});

// Types
export interface RapportData {
  id?: number;
  titre: string;
  type: string;
  date: string;
  taille?: string;
  contenu?: string;
  statistics?: {
    totalVentes: string;
    nbTransactions: number;
    montantMoyen: string;
    meilleurClient: string;
    periode: string;
    ventes?: Array<{ date: string; client: string; montant: string }>;
  };
}

interface ReportPDFProps {
  rapport: RapportData;
}

export const ReportPDF = ({ rapport }: ReportPDFProps) => {
  // Données par défaut si statistics non fournies
  const hasStats = rapport.statistics !== undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête fixe sur chaque page */}
        <View style={styles.header} fixed>
          <Text style={styles.headerText}>Rapport {rapport.type}</Text>
          <Text style={styles.headerText}>
            Date : {rapport.date ? new Date(rapport.date).toLocaleDateString('fr-FR') : 'Non définie'}
          </Text>
        </View>

        {/* Titre principal */}
        <Text style={styles.title}>{rapport.titre}</Text>
        <Text style={styles.subtitle}>
          Taille : {rapport.taille || 'N/A'} – Généré le {new Date().toLocaleDateString('fr-FR')}
        </Text>

        {/* Contenu / Résumé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Résumé exécutif</Text>
          <Text>{rapport.contenu || 'Aucune description fournie.'}</Text>
        </View>

        {/* Section statistiques si disponibles */}
        {hasStats && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Synthèse de la période</Text>
              <Text>Période : {rapport.statistics!.periode}</Text>
              <Text>Total des ventes : {rapport.statistics!.totalVentes} €</Text>
              <Text>Nombre de transactions : {rapport.statistics!.nbTransactions}</Text>
              <Text>Montant moyen : {rapport.statistics!.montantMoyen} €</Text>
              <Text>Meilleur client : {rapport.statistics!.meilleurClient}</Text>
            </View>

            {rapport.statistics!.ventes && rapport.statistics!.ventes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Détail des ventes</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.col1}>Date</Text>
                    <Text style={styles.col2}>Client</Text>
                    <Text style={styles.col3}>Montant (€)</Text>
                  </View>
                  {rapport.statistics!.ventes.slice(0, 20).map((vente, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={styles.col1}>{vente.date}</Text>
                      <Text style={styles.col2}>{vente.client}</Text>
                      <Text style={styles.col3}>{vente.montant}</Text>
                    </View>
                  ))}
                  {rapport.statistics!.ventes.length > 20 && (
                    <Text style={{ marginTop: 5, fontSize: 9, color: '#6b7280' }}>
                      ... et {rapport.statistics!.ventes.length - 20} autres ventes
                    </Text>
                  )}
                </View>
              </View>
            )}
          </>
        )}

        {/* Bloc signature */}
        <View style={styles.signature}>
          <Text>Approuvé par : _________________</Text>
          <Text>Date : {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>

        {/* Pied de page fixe avec numérotation */}
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Société X – Rapport confidentiel – Page ${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
};