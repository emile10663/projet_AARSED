"use client";

import { useEffect, useState, useCallback } from "react";
import { formatMoney, formatDate } from "@/lib/utils";
import Modal from "@/components/Modal";

export default function ComptesPage() {
  const [comptes, setComptes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    type: "COURANT",
    soldeInitial: 0,
    projetNom: "",
  });

  const load = useCallback(async () => {
    try {
      setError(null);
      const [cRes, clRes] = await Promise.all([
        fetch(`/api/comptes?q=${encodeURIComponent(search)}&type=${typeFilter}`).then((r) => {
          if (!r.ok) throw new Error("Erreur de chargement des comptes");
          return r.json();
        }),
        fetch("/api/clients").then((r) => {
          if (!r.ok) throw new Error("Erreur de chargement des clients");
          return r.json();
        }),
      ]);

      setComptes(Array.isArray(cRes) ? cRes : []);
      setClients(Array.isArray(clRes) ? clRes : []);
    } catch (err: any) {
      console.error("Échec du chargement /comptes:", err);
      setError("Impossible de charger les données des comptes. Assurez-vous d'être connecté.");
      setComptes([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCompte(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/comptes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setModalOpen(false);
        setForm({ clientId: "", type: "COURANT", soldeInitial: 0, projetNom: "" });
        load();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Erreur lors de la création du compte");
      }
    } catch (err) {
      alert("Erreur réseau lors de la création");
    }
  }

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      EPARGNE: "bg-green-100 text-green-700",
      COURANT: "bg-blue-100 text-blue-700",
      PROJET: "bg-purple-100 text-purple-700",
    };
    return <span className={`badge ${map[t] || "bg-gray-100 text-gray-700"}`}>{t}</span>;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Comptes</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Ouvrir un compte
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="card flex gap-3">
        <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="EPARGNE">Épargne</option>
          <option value="COURANT">Courant</option>
          <option value="PROJET">Projet</option>
        </select>
        <input
          placeholder="Rechercher..."
          className="input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Chargement des comptes...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-3">N° compte</th>
                <th>Client</th>
                <th>Type</th>
                <th>Solde</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {(comptes || []).length > 0 ? (
                comptes.map((c: any) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="py-3 font-medium">{c.numero || "—"}</td>
                    <td>{c.client?.nom ? `${c.client.nom} ${c.client.prenom || ""}` : "—"}</td>
                    <td>{typeBadge(c.type)}</td>
                    <td className="font-medium">{formatMoney(c.solde ?? 0)}</td>
                    <td>{c.dateOuverture ? formatDate(c.dateOuverture) : "—"}</td>
                    <td>
                      <span className="badge bg-green-100 text-green-700">{c.statut || "ACTIF"}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-gray-500">
                    Aucun compte trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Ouvrir un compte">
        <form onSubmit={saveCompte} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Client</label>
            <select
              className="input"
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            >
              <option value="">Sélectionner un client...</option>
              {(clients || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.prenom || ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="COURANT">Courant</option>
              <option value="EPARGNE">Épargne</option>
              <option value="PROJET">Épargne projet</option>
            </select>
          </div>
          {form.type === "PROJET" && (
            <div>
              <label className="text-sm text-gray-600">Nom du projet</label>
              <input
                className="input"
                required
                value={form.projetNom}
                onChange={(e) => setForm({ ...form, projetNom: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Dépôt initial (FCFA)</label>
            <input
              type="number"
              className="input"
              value={form.soldeInitial}
              onChange={(e) => setForm({ ...form, soldeInitial: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Ouvrir
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}