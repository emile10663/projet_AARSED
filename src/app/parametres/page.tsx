"use client";

import { useEffect, useState } from "react";

export default function ParametresPage() {
  const [params, setParams] = useState({ tauxEpargne: 3.5, tauxProjet: 5.0, fraisRetrait: 500, commissionVirement: 0.5 });

  useEffect(() => {
    fetch("/api/parametres").then((r) => r.json()).then((data) => {
      const map: Record<string, number> = {};
      data.forEach((p: any) => { map[p.cle] = parseFloat(p.valeur); });
      setParams({
        tauxEpargne: map["TAUX_EPARGNE"] || 3.5,
        tauxProjet: map["TAUX_PROJET"] || 5.0,
        fraisRetrait: map["FRAIS_RETRAIT"] || 500,
        commissionVirement: map["COMMISSION_VIREMENT"] || 0.5,
      });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/parametres", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) alert("Paramètres sauvegardés");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Paramètres système</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="text-sm font-medium">Taux et commissions</h3>
          <div>
            <label className="text-sm text-gray-600">Taux intérêt épargne (% / an)</label>
            <input type="number" step="0.1" className="input" value={params.tauxEpargne} onChange={(e) => setParams({ ...params, tauxEpargne: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Taux intérêt projet (% / an)</label>
            <input type="number" step="0.1" className="input" value={params.tauxProjet} onChange={(e) => setParams({ ...params, tauxProjet: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Frais de retrait (FCFA)</label>
            <input type="number" className="input" value={params.fraisRetrait} onChange={(e) => setParams({ ...params, fraisRetrait: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Commission virement (%)</label>
            <input type="number" step="0.01" className="input" value={params.commissionVirement} onChange={(e) => setParams({ ...params, commissionVirement: Number(e.target.value) })} />
          </div>
          <button className="btn btn-primary" onClick={save}>Sauvegarder</button>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium mb-2">Sécurité</h3>
          <p className="text-sm text-gray-500">Journal d'audit actif. Sauvegardes automatiques quotidiennes.</p>
        </div>
      </div>
    </div>
  );
}
