"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Erreur HTTP: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => setStats(data))
      .catch((err) => {
        console.error("Échec du chargement des stats:", err);
        setError("Impossible de charger les statistiques. Assurez-vous d'être connecté.");
      });
  }, []);

  if (error) {
    return (
      <div className="p-8 text-red-500 font-medium">
        {error}
      </div>
    );
  }

  if (!stats) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Tableau de bord</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-3xl font-medium">{stats.totalClients ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Clients actifs</div>
        </div>
        <div className="card">
          <div className="text-3xl font-medium">{formatMoney(stats.totalSolde ?? 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Solde global</div>
        </div>
        <div className="card">
          <div className="text-3xl font-medium">{stats.transactionsToday ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Transactions aujourd'hui</div>
        </div>
        <div className="card">
          <div className="text-3xl font-medium">{formatMoney(stats.collectesToday ?? 0)}</div>
          <div className="text-xs text-gray-500 mt-1">Collecte du jour</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Évolution des dépôts (7 jours)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.evolution || []}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => formatMoney(v)} />
              <Area type="monotone" dataKey="montant" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium mb-4">Dernières transactions</h3>
          <div className="space-y-3">
            {/* L'opérateur ?. et l'alternative || [] empêchent le crash si recentTransactions est undefined */}
            {stats.recentTransactions?.length > 0 ? (
              stats.recentTransactions.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-medium text-sm">{t.type}</div>
                    <div className="text-xs text-gray-500">
                      {t.compte?.client?.nom || "—"} • {formatDate(t.createdAt)}
                    </div>
                  </div>
                  <div className={`font-medium text-sm ${t.type === "RETRAIT" ? "text-red-600" : ""}`}>
                    {t.type === "RETRAIT" ? "-" : "+"}
                    {formatMoney(t.montant)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 py-2">Aucune transaction récente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}