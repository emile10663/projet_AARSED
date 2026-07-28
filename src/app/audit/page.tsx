"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/audit").then((r) => r.json()).then(setLogs);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Journal d'audit</h1>
      <div className="card overflow-auto">
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
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="py-3">{formatDate(l.createdAt)}</td>
                <td>{l.user?.name || "Système"}</td>
                <td><span className="badge bg-yellow-100 text-yellow-700">{l.action}</span></td>
                <td>{l.details}</td>
                <td className="font-mono text-xs">{l.ipAddress || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
