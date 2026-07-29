"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/audit");
      if (!res.ok) {
        throw new Error("Impossible de charger les journaux d'audit.");
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erreur chargement audit:", err);
      setError("Erreur lors de la récupération des journaux d'audit.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Journal d'audit</h1>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="card overflow-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Chargement des enregistrements...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-3">Horodatage</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Détails</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="py-3">{l.createdAt ? formatDate(l.createdAt) : "—"}</td>
                    <td>{l.user?.name || "Système"}</td>
                    <td>
                      <span className="badge bg-yellow-100 text-yellow-700">
                        {l.action || "ACTION"}
                      </span>
                    </td>
                    <td>{l.details || "—"}</td>
                    <td className="font-mono text-xs">{l.ipAddress || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-xs text-gray-500">
                    Aucun événement enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}