import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // 👈 FIX : Import de la fonction auth() v5

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error("Erreur GET /api/audit:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du journal d'audit" },
      { status: 500 }
    );
  }
}