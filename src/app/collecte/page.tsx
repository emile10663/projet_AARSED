"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";

export default function CollectePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [collectes, setCollectes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ clientId: "", montant: "", localisation: "Lomé, Togo" });

  async function load() {
    try {
      setError(null);
      const [clRes, colRes] = await Promise.all([
        fetch("/api/clients").then((r) => {
          if (!r.ok) throw new Error("Erreur de chargement des clients");
          return r.json();
        }),
        fetch("/api/collectes").then((r) => {
          if (!r.ok) throw new Error("Erreur de chargement des collectes");
          return r.json();
        }),
      ]);

      // Garantir qu'on injecte des tableaux valides
      setClients(Array.isArray(clRes) ? clRes : []);
      setCollectes(Array.isArray(colRes) ? colRes : []);
    } catch (err: any) {
      console.error("Échec du chargement des collectes:", err);
      setError("Impossible de charger les données. Vérifiez votre connexion.");
      setClients([]);
      setCollectes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/collectes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, montant: Number(form.montant) }),
      });

      if (res.ok) {
        setForm({ clientId: "", montant: "", localisation: "Lomé, Togo" });
        load();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      alert("Erreur réseau lors de la soumission");
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Collecte journalière (mobile)</h1>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulaire */}
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Nouvelle collecte</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Client</label>
              <select
                className="input"
                required
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {(clients || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} {c.prenom || ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Montant (FCFA)</label>
              <input
                type="number"
                className="input"
                required
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Localisation</label>
              <input
                className="input"
                value={form.localisation}
                onChange={(e) => setForm({ ...form, localisation: e.target.value })}
              />
            </div>
            <button className="btn btn-primary w-full">Enregistrer la collecte</button>
          </form>
        </div>

        {/* Historique */}
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Dernières collectes</h3>
          <div className="space-y-3">
            {(collectes || []).length > 0 ? (
              collectes.map((c: any) => {
                // Recherche sécurisée avec support des clients inclus directement dans l'API (c.client) ou via l'état local
                const clientName =
                  c.client?.nom ||
                  (Array.isArray(clients) ? clients.find((cl) => cl.id === c.clientId)?.nom : null) ||
                  "—";

                return (
                  <div key={c.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-sm">{clientName}</div>
                      <div className="text-xs text-gray-500">
                        {c.localisation || "Non spécifiée"} • {c.createdAt ? formatDate(c.createdAt) : ""}
                      </div>
                    </div>
                    <div className="font-medium text-sm">{formatMoney(c.montant ?? 0)}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-gray-500 py-2">Aucune collecte enregistrée</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}