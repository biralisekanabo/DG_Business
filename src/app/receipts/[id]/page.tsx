"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  LuArrowLeft,
  LuPrinter,
  LuDownload,
  LuMessageSquare,
  LuMail,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import SignaturePad from "@/components/Signature/SignaturePad";

type VenteItem = {
  id: number;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  categorie?: string;
  fournisseur?: string;
};

type Receipt = {
  id: number;
  numeroFacture: string;
  clientname: string;
  montant: number;
  devise: string;
  date: string;
  modePaiement: string;
  garantie: string;
  items: VenteItem[];
  signature_data?: string | null;
};

type Company = {
  nom: string;
  phone: string;
  adresse: string;
  email?: string;
  logo?: string;
  logo_url?: string;
  signature?: string;
  signature_url?: string;
};

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [companyCheckError, setCompanyCheckError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [venteSignedAt, setVenteSignedAt] = useState<string | null>(null);
  const [isSigningReceipt, setIsSigningReceipt] = useState(false);
  // Signature state managed by receipt modal

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Non authentifié");

        const checkRes = await fetch("/api/company/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!checkRes.ok) {
          const checkData = await checkRes.json();
          setCompanyCheckError(checkData.message);
        }

        const venteRes = await fetch(`/api/ventes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!venteRes.ok) throw new Error("Reçu non trouvé");
        const venteData = await venteRes.json();

        let productDetails = null;
        if (venteData.stock_id) {
          try {
            const stockRes = await fetch(`/api/stock/${venteData.stock_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (stockRes.ok) productDetails = await stockRes.json();
          } catch (_e) {}
        }

        const numeroFacture = `FV-${venteData.id.toString().padStart(6, "0")}-${new Date(venteData.date).getFullYear()}`;
        const dateAchat = new Date(venteData.date);
        const dateFinGarantie = new Date(dateAchat);
        dateFinGarantie.setFullYear(dateFinGarantie.getFullYear() + 1);
        const garantie = `Jusqu'au ${dateFinGarantie.toLocaleDateString("fr-FR")}`;

        setCurrentDateTime(new Date());

        setReceipt({
          id: venteData.id,
          numeroFacture,
          clientname: venteData.clientname,
          montant: Number(venteData.montant),
          devise: venteData.devise || "USD",
          date: venteData.createdat || venteData.date,
          modePaiement: venteData.modePaiement || "Espèces",
          garantie,
          items: productDetails
            ? [
                {
                  id: productDetails.id,
                  produitNom: productDetails.modele || productDetails.nom,
                  quantite: 1,
                  prixUnitaire: Number(productDetails.prix || 0),
                  total: Number(venteData.montant),
                  categorie: productDetails.categorie,
                  fournisseur: productDetails.fournisseur,
                },
              ]
            : [],
          signature_data: venteData.signature_data || null,
        });

        const companyRes = await fetch("/api/company", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (companyRes.ok) setCompany(await companyRes.json());

        const baseUrl = window.location.origin;
        setQrValue(`${baseUrl}/receipts/${venteData.id}`);
        setCurrentDateTime(new Date(venteData.createdat || new Date()));
        
        // Check if signature is needed
        setVenteSignedAt(venteData.signed_at || null);
        if (!venteData.signed_at) {
          setShowSignatureModal(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getCurrentDateTime = () => {
    return currentDateTime.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handlePrint = () => window.print();
  const handlePDF = () => {
    const printContent = receiptRef.current?.cloneNode(true) as HTMLElement;
    if (printContent) {
      const actionButtons = printContent.querySelectorAll(".print-hide");
      actionButtons.forEach((btn) => btn.remove());
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reçu ${receipt?.numeroFacture}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', system-ui, sans-serif; padding: 20px; background: white; }
                .print-hide { display: none; }
                @media print { body { margin: 0; padding: 0; } }
              </style>
            </head>
            <body>${printContent.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const shareViaWhatsApp = () => {
    const text = `📄 Reçu ${receipt?.numeroFacture} - Montant: ${receipt?.montant} ${receipt?.devise} - Client: ${receipt?.clientname}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = `Reçu ${receipt?.numeroFacture}`;
    const body = `Bonjour, veuillez trouver ci-joint le reçu pour ${receipt?.clientname} d'un montant de ${receipt?.montant} ${receipt?.devise}.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSignatureCapture = async (signatureData: string) => {
    if (!id) return;
    
    setIsSigningReceipt(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");

      const res = await fetch(`/api/ventes/${id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          signature: signatureData,
          signed_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde de la signature");
      }

      const signedData = await res.json();
      
      // Mettre à jour le reçu avec la signature sauvegardée
      setReceipt(prev => prev ? {
        ...prev,
        signature_data: signedData.signature_data
      } : null);
      
      setVenteSignedAt(signedData.signed_at);
      setShowSignatureModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde de la signature");
    } finally {
      setIsSigningReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-gray-700 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "Reçu non trouvé"}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black flex items-center gap-2 mx-auto"
          >
            <LuArrowLeft size={16} /> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-3 md:p-6 overflow-x-hidden overflow-y-auto md:max-h-[calc(100vh-100px)]">
      {/* Avertissement compact */}
      {companyCheckError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="print-hide max-w-xs mx-auto mb-2 p-1.5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 rounded text-xs"
        >
          <p className="font-semibold">⚠️ Informations incomplètes</p>
          <p>
            Allez dans{" "}
            <button onClick={() => router.push("/settings")} className="underline font-semibold">
              Paramètres
            </button>{" "}
            pour compléter vos informations.
          </p>
        </motion.div>
      )}

      {/* Barre d'actions */}
      <div className="print-hide max-w-xs mx-auto mb-2 flex flex-wrap justify-between items-center gap-1">
        <button
          onClick={() => router.back()}
          className="px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 flex items-center gap-0.5 text-gray-800 text-[10px] font-medium shadow-sm"
        >
          <LuArrowLeft size={12} /> Retour
        </button>
        <div className="flex gap-1">
          <button onClick={handlePrint} className="p-1 bg-gray-800 text-white rounded hover:bg-black shadow-sm">
            <LuPrinter size={14} />
          </button>
          <button onClick={handlePDF} className="p-1 bg-gray-800 text-white rounded hover:bg-black shadow-sm">
            <LuDownload size={14} />
          </button>
          <button onClick={shareViaWhatsApp} className="p-1 bg-gray-800 text-white rounded hover:bg-black shadow-sm">
            <LuMessageSquare size={14} />
          </button>
          <button onClick={shareViaEmail} className="p-1 bg-gray-800 text-white rounded hover:bg-black shadow-sm">
            <LuMail size={14} />
          </button>
        </div>
      </div>

      {/* Reçu noir et blanc */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs mx-auto bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
        ref={receiptRef}
      >
        {/* En-tête noir et blanc */}
        <div className="bg-gray-900 text-white p-2.5">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              {company?.logo_url && (
                <img src={company.logo_url} alt="Logo" className="h-8 w-8 object-contain bg-white rounded p-0.5" />
              )}
              <div>
                <h1 className="text-sm font-bold tracking-wide">FACTURE</h1>
                <p className="text-gray-300 text-[10px]">{company?.nom || "DG Business"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold">{receipt.numeroFacture}</p>
              <p className="text-gray-300 text-[9px]">{formatDate(receipt.date)}</p>
            </div>
          </div>

          {/* Coordonnées */}
          {company && (
            <div className="border-t border-gray-700 pt-1 grid grid-cols-2 gap-1 text-[8px]">
              <div>
                <p className="text-gray-400 text-[7px] uppercase">Tél</p>
                <p className="font-medium text-[8px]">{company.phone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[7px] uppercase">Adresse</p>
                <p className="font-medium text-[7px]">{company.adresse || "-"}</p>
              </div>
            </div>
          )}

          {/* Client */}
          <div className="border-t border-gray-700 pt-1 mt-1">
            <p className="text-gray-400 text-[7px] uppercase">Client</p>
            <p className="font-bold text-xs">{receipt.clientname}</p>
          </div>
        </div>

        {/* Corps du reçu */}
        <div className="p-2">
          {/* Détails des articles */}
          <div className="mb-2">
            <h3 className="text-[9px] font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-0.5 mb-1">
              DÉTAILS
            </h3>
            {receipt.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[8px]">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-1 py-0.5 text-left">Produit</th>
                      <th className="px-0.5 py-0.5 text-center">Qté</th>
                      <th className="px-0.5 py-0.5 text-right">Prix</th>
                      <th className="px-0.5 py-0.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                          <td className="px-1 py-0.5 font-medium max-w-[80px] break-words">{item.produitNom}</td>
                          <td className="px-0.5 py-0.5 text-center">{item.quantite}</td>
                          <td className="px-0.5 py-0.5 text-right">{item.prixUnitaire.toFixed(0)}</td>
                          <td className="px-0.5 py-0.5 text-right font-semibold">{item.total.toFixed(0)}</td>
                        </tr>
                        {(item.categorie || item.fournisseur) && (
                          <tr className="bg-gray-50 dark:bg-gray-800/50">
                            <td colSpan={4} className="px-1 py-0.5 text-[7px] text-gray-500">
                              {item.categorie && <span>Catégorie: {item.categorie}</span>}
                              {item.categorie && item.fournisseur && <span> • </span>}
                              {item.fournisseur && <span>Fournisseur: {item.fournisseur}</span>}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                      <td colSpan={3} className="px-1 py-0.5 text-right text-[8px]">Total :</td>
                      <td className="px-0.5 py-0.5 text-right text-[8px]">
                        {receipt.montant.toFixed(0)} {receipt.devise}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-1 text-center text-gray-500 text-[8px]">Aucun article</div>
            )}
          </div>

          {/* Infos supplémentaires */}
          <div className="grid grid-cols-2 gap-1 mb-2 text-[8px]">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-1.5">
              <p className="text-gray-500 uppercase text-[7px] mb-0.5">Mode paiement</p>
              <p className="font-semibold text-[8px]">{receipt.modePaiement}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-1.5">
              <p className="text-gray-500 uppercase text-[7px] mb-0.5">Garantie</p>
              <p className="font-semibold text-[8px]">{receipt.garantie}</p>
            </div>
          </div>

          {/* QR Code + mentions légales */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
            <div className="text-center">
              {qrValue && (
                <QRCodeCanvas value={qrValue} size={60} level="H" bgColor="#FFFFFF" fgColor="#000000" />
              )}
              <p className="text-[7px] text-gray-500 mt-0.5">Scannez</p>
            </div>
            <div className="text-center text-[8px] text-gray-500">
              <p>Merci</p>
              <p className="font-mono text-[7px]">ID: {receipt.id}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-1.5 pt-1.5">
            <div className="grid grid-cols-3 gap-1 text-center text-[7px]">
              <div>
                <div className="h-3 border-b border-gray-400 mb-0.5"></div>
                <p className="uppercase font-semibold text-gray-600 text-[6px]">Client</p>
              </div>
              <div>
                {receipt.signature_data ? (
                  <img src={receipt.signature_data} alt="Signature" className="h-8 object-contain mx-auto mb-0.5" />
                ) : (
                  <div className="h-3 border-b border-gray-400 mb-0.5"></div>
                )}
                <p className="uppercase font-semibold text-gray-600 text-[6px]">Signature</p>
              </div>
              <div>
                <div className="h-3 border-b border-gray-400 mb-0.5"></div>
                <p className="uppercase font-semibold text-gray-600 text-[6px]">Cachet</p>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="mt-1 pt-1 text-center border-t border-gray-200 dark:border-gray-700">
            <p className="text-[7px] text-gray-500">{company?.nom || "DG Business"} © 2026</p>
            <p className="text-[7px] text-gray-400">Généré le {getCurrentDateTime()}</p>
          </div>
        </div>
      </motion.div>

      {/* Modal de signature */}
      {showSignatureModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Signature requise</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Veuillez signer le reçu pour valider la transaction
              </p>
              
              <SignaturePad 
                onSign={handleSignatureCapture}
                onCancel={() => setShowSignatureModal(false)}
                title="Signature du reçu"
                message="Signez dans le cadre ci-dessous"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
            padding: 0;
            margin: 0;
          }
          .print-hide {
            display: none !important;
          }
          .max-w-2xl {
            max-width: 100%;
            margin: 0;
            box-shadow: none;
          }
          .rounded-lg {
            border-radius: 0;
          }
          .bg-gray-900 {
            background: #111 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-white {
            color: white !important;
          }
        }
      `}</style>
    </div>
  );
}