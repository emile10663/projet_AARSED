"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";

export default function OperationsPage() {
  const [tab, setTab] = useState("depot");
  const [comptes, setComptes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depot, setDepot] = useState({ compteId: "", montant: "", motif: "" });
  const [retrait, setRetrait] = useState({ compteId: "", montant: "", pin: "" });
  const [virement, setVirement] = useState({ from: "", to: "", montant: "" });

  async function load() {
    const [cRes, tRes] = await Promise.all([
      fetch("/api/comptes").then((r) => r.json()),
      fetch("/api/transactions").then((r) => r.json()),
    ]);
    setComptes(cRes);
    setTransactions(tRes);
  }

  useEffect(() => { load(); }, []);

  async function doDepot(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DEPOT", ...depot, montant: Number(depot.montant) }),
    });
    if (res.ok) {
      alert("Dépôt effectué");
      setDepot({ compteId: "", montant: "", motif: "" });
      load();
    } else alert("Erreur");
  }

  async function doRetrait(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "RETRAIT", ...retrait, montant: Number(retrait.montant) }),
    });
    if (res.ok) {
      alert("Retrait effectué");
      setRetrait({ compteId: "", montant: "", pin: "" });
      load();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur");
    }
  }

  async function doVirement(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "VIREMENT", compteSourceId: virement.from, compteDestId: virement.to, montant: Number(virement.montant) }),
    });
    if (res.ok) {
      alert("Virement effectué");
      setVirement({ from: "", to: "", montant: "" });
      load();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur");
    }
  }

  const compteOptions = comptes.map((c) => (
    <option key={c.id} value={c.id}>{c.numero} — {c.client?.nom} ({formatMoney(c.solde)})</option>
  ));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Opérations</h1>
      <div className="flex gap-1 border-b border-gray-200">
        {["depot", "retrait", "virement", "historique"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === t ? "border-gray-900 text-gray-900 font-medium" : "border-transparent text-gray-500"}`}>
            {t === "depot" ? "Dépôt" : t === "retrait" ? "Retrait" : t === "virement" ? "Virement" : "Historique"}
          </button>
        ))}
      </div>

      {tab === "depot" && (
        <div className="card max-w-md">
          <form onSubmit={doDepot} className="space-y-3">
            <div><label className="text-sm text-gray-600">Compte</label><select className="input" required value={depot.compteId} onChange={(e) => setDepot({ ...depot, compteId: e.target.value })}><option value="">Sélectionner...</option>{compteOptions}</select></div>
            <div><label className="text-sm text-gray-600">Montant (FCFA)</label><input type="number" className="input" required value={depot.montant} onChange={(e) => setDepot({ ...depot, montant: e.target.value })} /></div>
            <div><label className="text-sm text-gray-600">Motif</label><input className="input" value={depot.motif} onChange={(e) => setDepot({ ...depot, motif: e.target.value })} /></div>
            <button className="btn btn-primary w-full">Valider le dépôt</button>
          </form>
        </div>
      )}

      {tab === "retrait" && (
        <div className="card max-w-md">
          <form onSubmit={doRetrait} className="space-y-3">
            <div><label className="text-sm text-gray-600">Compte</label><select className="input" required value={retrait.compteId} onChange={(e) => setRetrait({ ...retrait, compteId: e.target.value })}><option value="">Sélectionner...</option>{compteOptions}</select></div>
            <div><label className="text-sm text-gray-600">Montant (FCFA)</label><input type="number" className="input" required value={retrait.montant} onChange={(e) => setRetrait({ ...retrait, montant: e.target.value })} /></div>
            <div><label className="text-sm text-gray-600">Code PIN (démo: 1234)</label><input type="password" className="input" required value={retrait.pin} onChange={(e) => setRetrait({ ...retrait, pin: e.target.value })} /></div>
            <button className="btn btn-primary w-full">Valider le retrait</button>
          </form>
        </div>
      )}

      {tab === "virement" && (
        <div className="card max-w-md">
          <form onSubmit={doVirement} className="space-y-3">
            <div><label className="text-sm text-gray-600">Compte émetteur</label><select className="input" required value={virement.from} onChange={(e) => setVirement({ ...virement, from: e.target.value })}><option value="">Sélectionner...</option>{compteOptions}</select></div>
            <div><label className="text-sm text-gray-600">Compte bénéficiaire</label><select className="input" required value={virement.to} onChange={(e) => setVirement({ ...virement, to: e.target.value })}><option value="">Sélectionner...</option>{compteOptions}</select></div>
            <div><label className="text-sm text-gray-600">Montant (FCFA)</label><input type="number" className="input" required value={virement.montant} onChange={(e) => setVirement({ ...virement, montant: e.target.value })} /></div>
            <button className="btn btn-primary w-full">Valider le virement</button>
          </form>
        </div>
      )}

      {tab === "historique" && (
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-3">Date</th><th>Type</th><th>Compte</th><th>Montant</th><th>Agent</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="py-3">{formatDate(t.createdAt)}</td>
                  <td><span className={`badge ${t.type === "RETRAIT" ? "bg-red-100 text-red-700" : t.type === "VIREMENT" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{t.type}</span></td>
                  <td>{t.compte?.numero || `${t.compteSourceId?.slice(0,6)}→${t.compteDestId?.slice(0,6)}`}</td>
                  <td className="font-medium">{formatMoney(t.montant)}</td>
                  <td>{t.agent?.name}</td>
                  <td><span className="badge bg-green-100 text-green-700">{t.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
