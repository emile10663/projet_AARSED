"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Modal from "@/components/Modal";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", pieceIdentite: "", adresse: "" });

  async function load() {
    const res = await fetch(`/api/clients?q=${search}`);
    setClients(await res.json());
  }

  useEffect(() => { load(); }, [search]);

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setModalOpen(false);
      setForm({ nom: "", telephone: "", pieceIdentite: "", adresse: "" });
      load();
    } else {
      alert("Erreur lors de la création");
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Clients</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Nouveau client</button>
      </div>
      <div className="card">
        <input
          placeholder="Rechercher..."
          className="input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="pb-3">Nom</th>
              <th>Téléphone</th>
              <th>Pièce d'identité</th>
              <th>Comptes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((c: any) => (
  <tr key={c.id} className="border-t border-gray-100">
    <td className="py-3 font-medium">{c.nom}</td>
    <td>{c.telephone || "—"}</td>
    <td>{c.pieceIdentite || "—"}</td>
    {/* Chaînage optionnel sur c.comptes pour éviter de lire .length sur undefined */}
    <td>{c.comptes?.length ?? 0}</td>
    <td>{formatDate(c.createdAt)}</td>
  </tr>
))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau client">
        <form onSubmit={saveClient} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nom complet</label>
            <input className="input" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Téléphone</label>
            <input className="input" required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">N° pièce d'identité</label>
            <input className="input" required value={form.pieceIdentite} onChange={(e) => setForm({ ...form, pieceIdentite: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Adresse</label>
            <input className="input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>Annuler</button>
            <button type="submit" className="btn btn-primary">Créer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
