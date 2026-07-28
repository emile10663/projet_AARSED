import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const collecteSchema = z.object({
  clientId: z.string(),
  montant: z.number().positive(),
  localisation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const collectes = await prisma.collecte.findMany({
    include: { agent: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(collectes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const parsed = collecteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const compte = await prisma.compte.findFirst({
    where: { clientId: client.id, type: "COURANT" },
  });

  const collecte = await prisma.collecte.create({
    data: {
      clientId: parsed.data.clientId,
      montant: parsed.data.montant,
      localisation: parsed.data.localisation,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      agentId: session.user.id,
    },
  });

  if (compte) {
    await prisma.compte.update({
      where: { id: compte.id },
      data: { solde: { increment: parsed.data.montant } },
    });
    await prisma.transaction.create({
      data: {
        type: "COLLECTE",
        compteId: compte.id,
        montant: parsed.data.montant,
        agentId: session.user.id,
        motif: parsed.data.localisation || "Collecte terrain",
      },
    });
  }

  await prisma.auditLog.create({
    data: { action: "COLLECTE", details: `${parsed.data.montant} FCFA chez ${client.nom}`, userId: session.user.id },
  });

  return NextResponse.json(collecte, { status: 201 });
}
