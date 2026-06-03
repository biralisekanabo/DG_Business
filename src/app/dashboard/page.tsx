"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuCreditCard,
  LuTriangleAlert,
  LuBox,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuWallet,
  LuCalendar,
  LuBell,
  LuUser,
  LuRefreshCw,
} from "react-icons/lu";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

const EXCHANGE_RATE = 2500; // 1 USD = 2500 CDF

interface DashboardStats {
  ventes_total: number;
  depenses_total: number;
  dettes_total: number;
  stock_total: number;
}

interface HistoriqueVente {
  date: string;
  total: number;
  devise?: string; // Ajouté pour savoir si l'historique est en USD ou CDF
}

interface VenteRecente {
  clientname: string;
  montant: number;
  date: string;
  devise: string; // "USD" ou "CDF"
}

interface AlerteStock {
  modele: string;
  quantite: number;
  seuil: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historique, setHistorique] = useState<HistoriqueVente[]>([]);
  const [ventesRecentes, setVentesRecentes] = useState<VenteRecente[]>([]);
  const [alertesStock, setAlertesStock] = useState<AlerteStock[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("Utilisateur");

  // Conversion fiable basée sur la devise d'entrée
  const convertAmount = (amount: number, fromDevise: string, toDevise: string): number => {
    if (fromDevise === toDevise) return amount;
    if (fromDevise === "CDF" && toDevise === "USD") return amount / EXCHANGE_RATE;
    if (fromDevise === "USD" && toDevise === "CDF") return amount * EXCHANGE_RATE;
    return amount;
  };

  const formatMoney = (amount: number, currency: string = "USD") => {
    const formatter = new Intl.NumberFormat("fr-CD", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  // Formate un montant selon sa devise d'origine et la devise cible
  const displayAmount = (amount: number, fromDevise: string, toDevise: string): string => {
    const converted = convertAmount(amount, fromDevise, toDevise);
    return formatMoney(converted, toDevise);
  };

  const fetchDashboardData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    let token: string | null = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.name) setUserName(payload.name);
            else if (payload.username) setUserName(payload.username);
          } catch (e) {
            console.warn("Impossible de décoder le token");
          }
        }
      }
    } catch (e) {
      console.error("Impossible d'accéder au localStorage", e);
    }

    if (!token) {
      setError("Non authentifié. Veuillez vous reconnecter.");
      setLoading(false);
      if (showRefresh) setRefreshing(false);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const [statsData, histoData, ventesData, alertesData] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard`, { headers }).then((res) =>
          res.ok ? res.json() : null
        ),
        fetch(`${API_BASE_URL}/api/dashboard/ventes-historique`, { headers }).then((res) =>
          res.ok ? res.json() : { historique: [] }
        ),
        fetch(`${API_BASE_URL}/api/dashboard/ventes-recentes`, { headers }).then((res) =>
          res.ok ? res.json() : { ventes: [] }
        ),
        fetch(`${API_BASE_URL}/api/dashboard/alertes-stock`, { headers }).then((res) =>
          res.ok ? res.json() : { alertes: [] }
        ),
      ]);

      if (!statsData) {
        setError("Impossible de charger les indicateurs principaux.");
      } else {
        setStats(statsData);
        setError(null);
      }
      setHistorique(histoData?.historique || []);
      setVentesRecentes(ventesData?.ventes || []);
      setAlertesStock(alertesData?.alertes || []);
    } catch (err) {
      console.error("Erreur critique du dashboard:", err);
      setError("Une erreur critique est survenue lors du chargement.");
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Préparation des données pour les graphiques : convertir tout en CDF pour la tendance, et en USD pour la comparaison
  const chartData = historique.map((h) => {
    const montantCDF = h.devise === "USD" ? h.total * EXCHANGE_RATE : h.total;
    const montantUSD = h.devise === "CDF" ? h.total / EXCHANGE_RATE : h.total;
    return {
      date: h.date ? format(new Date(h.date), "dd/MM") : "N/A",
      "Ventes (CDF)": montantCDF || 0,
      "Ventes (USD)": montantUSD || 0,
    };
  });

  // Tendances (à calculer dynamiquement selon vos besoins)
  const ventesVariation = "+12%";
  const depensesVariation = "+8%";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex animate-spin rounded-full h-14 w-14 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 text-center border border-red-200 dark:border-red-800">
          <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LuTriangleAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Oups ! Une erreur est survenue</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm">{error || "Aucune donnée disponible."}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 mx-auto"
          >
            <LuRefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 md:py-8">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bonjour, {userName} 
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Voici les performances de votre activité
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-full hover:bg-white dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              <LuRefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <LuCalendar className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <button className="p-2 bg-white/60 dark:bg-slate-800/60 rounded-full hover:bg-white dark:hover:bg-slate-700 transition">
              <LuBell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              <LuUser className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Cartes KPI (inchangées, mais les stats doivent venir de l'API en USD cohérent) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ventes totales</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {formatMoney(stats.ventes_total, "USD")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatMoney(stats.ventes_total * EXCHANGE_RATE, "CDF")}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl">
                  <LuTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="flex items-center text-green-600 font-semibold">
                  <LuArrowUpRight className="w-4 h-4 mr-1" />
                  {ventesVariation}
                </span>
                <span className="text-slate-400 text-xs ml-2">vs mois dernier</span>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dépenses</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {formatMoney(stats.depenses_total, "USD")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatMoney(stats.depenses_total * EXCHANGE_RATE, "CDF")}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl">
                  <LuTrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="flex items-center text-red-600 font-semibold">
                  <LuArrowDownLeft className="w-4 h-4 mr-1" />
                  {depensesVariation}
                </span>
                <span className="text-slate-400 text-xs ml-2">vs mois dernier</span>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-rose-500"></div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dettes clients</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {formatMoney(stats.dettes_total, "USD")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatMoney(stats.dettes_total * EXCHANGE_RATE, "CDF")}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-xl">
                  <LuCreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="flex items-center text-orange-600 font-semibold">
                  <LuTriangleAlert className="w-4 h-4 mr-1" />
                  À surveiller
                </span>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-amber-500"></div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Stock total</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                    {stats.stock_total.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">unités</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl">
                  <LuBox className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="flex items-center text-blue-600 font-semibold">
                  <LuTrendingUp className="w-4 h-4 mr-1" />
                  Stable
                </span>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-5 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">
                Tendance des ventes (7 derniers jours)
              </h2>
              <LuTrendingUp className="w-5 h-5 text-green-500" />
            </div>
            {chartData.length > 0 ? (
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCDF" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value) => formatMoney(value as number, "CDF")}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area
                      type="monotone"
                      dataKey="Ventes (CDF)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#colorCDF)"
                      fillOpacity={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 lg:h-80 flex items-center justify-center text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-5 transition-all hover:shadow-xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">
                Comparaison USD vs CDF
              </h2>
              <LuWallet className="w-5 h-5 text-indigo-500" />
            </div>
            {chartData.length > 0 ? (
              <div className="h-72 lg:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      formatter={(value) => formatMoney(value as number, "USD")}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="Ventes (USD)"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 lg:h-80 flex items-center justify-center text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Tableau des ventes récentes avec conversion correcte selon devise */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LuTrendingUp className="w-5 h-5 text-green-500" />
                Dernières transactions
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm lg:text-base">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left py-3 px-5 text-slate-600 dark:text-slate-300 font-semibold">Client</th>
                    <th className="text-center py-3 px-5 text-slate-600 dark:text-slate-300 font-semibold">Montant (USD)</th>
                    <th className="text-center py-3 px-5 text-slate-600 dark:text-slate-300 font-semibold">Montant (CDF)</th>
                    <th className="text-right py-3 px-5 text-slate-600 dark:text-slate-300 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {ventesRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        Aucune vente récente
                      </td>
                    </tr>
                  ) : (
                    ventesRecentes.slice(0, 5).map((vente, idx) => {
                      // Calcul correct selon la devise de la vente
                      const montantUSD =
                        vente.devise === "USD"
                          ? vente.montant
                          : vente.montant / EXCHANGE_RATE;
                      const montantCDF =
                        vente.devise === "CDF"
                          ? vente.montant
                          : vente.montant * EXCHANGE_RATE;
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                        >
                          <td className="py-3 px-5 font-medium text-slate-800 dark:text-white truncate max-w-[150px]">
                            {vente.clientname || "Anonyme"}
                          </td>
                          <td className="py-3 px-5 text-center text-blue-600 dark:text-blue-400 font-semibold">
                            {montantUSD.toFixed(2)} USD
                          </td>
                          <td className="py-3 px-5 text-center text-green-600 dark:text-green-400 font-semibold">
                            {montantCDF.toLocaleString()} FC
                          </td>
                          <td className="py-3 px-5 text-right text-slate-500 dark:text-slate-400 text-xs lg:text-sm">
                            {vente.date ? format(new Date(vente.date), "dd/MM/yyyy") : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes stock - inchangé */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <LuTriangleAlert className="w-5 h-5 text-amber-500" />
                Alertes stock
              </h3>
            </div>
            <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
              {alertesStock.length === 0 ? (
                <div className="text-center py-6">
                  <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LuBox className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">✅ Aucune alerte, stock suffisant</p>
                </div>
              ) : (
                alertesStock.map((alerte, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
                  >
                    <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full">
                      <LuTriangleAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-red-800 dark:text-red-200 text-sm lg:text-base">
                        {alerte.modele || "Article sans nom"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-red-700 dark:text-red-300">
                          Stock: {alerte.quantite}
                        </span>
                        <span className="text-xs text-red-500">•</span>
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Seuil: {alerte.seuil}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-bold bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                      Critique
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}