import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const paramsSchema = z.object({
  tauxEpargne: z.number().min(0).max(100),
  tauxProjet: z.number().min(0).max(100),
  fraisRetrait: z.number().min(0),
  commissionVirement: z.number().min(0).max(100),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const params = await prisma.parametre.findMany();
  return NextResponse.json(params);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = paramsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  await prisma.$transaction([
    prisma.parametre.update({ where: { cle: "TAUX_EPARGNE" }, data: { valeur: String(parsed.data.tauxEpargne) } }),
    prisma.parametre.update({ where: { cle: "TAUX_PROJET" }, data: { valeur: String(parsed.data.tauxProjet) } }),
    prisma.parametre.update({ where: { cle: "FRAIS_RETRAIT" }, data: { valeur: String(parsed.data.fraisRetrait) } }),
    prisma.parametre.update({ where: { cle: "COMMISSION_VIREMENT" }, data: { valeur: String(parsed.data.commissionVirement) } }),
  ]);

  await prisma.auditLog.create({
    data: { action: "MODIFICATION_PARAMETRES", details: "Taux et commissions mis à jour", userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
