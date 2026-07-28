"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";

export default function CollectePage() {
  const [clients, setClients] = useState<any[]>([]);
  const [collectes, setCollectes] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: "", montant: "", localisation: "Lomé, Togo" });

  async function load() {
    const [clRes, colRes] = await Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/collectes").then((r) => r.json()),
    ]);
    setClients(clRes);
    setCollectes(colRes);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/collectes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, montant: Number(form.montant) }),
    });
    if (res.ok) {
      setForm({ clientId: "", montant: "", localisation: "Lomé, Togo" });
      load();
    } else alert("Erreur");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Collecte journalière (mobile)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Nouvelle collecte</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Client</label>
              <select className="input" required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Sélectionner...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Montant (FCFA)</label>
              <input type="number" className="input" required value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Localisation</label>
              <input className="input" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
            </div>
            <button className="btn btn-primary w-full">Enregistrer la collecte</button>
          </form>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Dernières collectes</h3>
          <div className="space-y-3">
            {collectes.map((c) => (
              <div key={c.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-sm">{c.clientId ? clients.find((cl) => cl.id === c.clientId)?.nom || "—" : "—"}</div>
                  <div className="text-xs text-gray-500">{c.localisation}</div>
                </div>
                <div className="font-medium text-sm">{formatMoney(c.montant)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
