import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalClients, totalComptes, totalSolde, transactionsToday, collectesToday] = await Promise.all([
    prisma.client.count(),
    prisma.compte.count(),
    prisma.compte.aggregate({ _sum: { solde: true } }),
    prisma.transaction.count({ where: { createdAt: { gte: today } } }),
    prisma.collecte.aggregate({ where: { createdAt: { gte: today } }, _sum: { montant: true } }),
  ]);

  // Évolution sur 7 jours
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const evolution = await Promise.all(
    last7.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const depots = await prisma.transaction.aggregate({
        where: { type: "DEPOT", createdAt: { gte: date, lt: nextDay } },
        _sum: { montant: true },
      });
      return { date: date.toISOString().split("T")[0], montant: depots._sum.montant || 0 };
    })
  );

  // Dernières transactions
  const recentTransactions = await prisma.transaction.findMany({
    include: { compte: { include: { client: true } }, agent: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    totalClients,
    totalComptes,
    totalSolde: totalSolde._sum.solde || 0,
    transactionsToday,
    collectesToday: collectesToday._sum.montant || 0,
    evolution,
    recentTransactions,
  });
}
