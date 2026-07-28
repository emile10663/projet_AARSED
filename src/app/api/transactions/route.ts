import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";

const depotSchema = z.object({
  compteId: z.string(),
  montant: z.number().positive(),
  motif: z.string().optional(),
});

const retraitSchema = z.object({
  compteId: z.string(),
  montant: z.number().positive(),
  pin: z.string().optional(),
});

const virementSchema = z.object({
  compteSourceId: z.string(),
  compteDestId: z.string(),
  montant: z.number().positive(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    include: {
      compte: { include: { client: true } },
      agent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { type, ...data } = body;

  if (type === "DEPOT") {
    const parsed = depotSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const compte = await prisma.compte.findUnique({ where: { id: parsed.data.compteId } });
    if (!compte) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

    const updated = await prisma.compte.update({
      where: { id: compte.id },
      data: { solde: { increment: parsed.data.montant } },
    });

    const tx = await prisma.transaction.create({
      data: {
        type: "DEPOT",
        compteId: compte.id,
        montant: parsed.data.montant,
        agentId: session.user.id,
        motif: parsed.data.motif,
      },
    });

    await prisma.auditLog.create({
      data: { action: "DEPOT", details: `${parsed.data.montant} FCFA sur ${compte.numero}`, userId: session.user.id },
    });

    return NextResponse.json({ transaction: tx, solde: updated.solde });
  }

  if (type === "RETRAIT") {
    const parsed = retraitSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    const params = await prisma.parametre.findMany();
    const fraisRetrait = parseFloat(params.find(p => p.cle === "FRAIS_RETRAIT")?.valeur || "500");

    const compte = await prisma.compte.findUnique({ where: { id: parsed.data.compteId } });
    if (!compte) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

    const total = parsed.data.montant + fraisRetrait;
    if (parseFloat(compte.solde.toString()) < total) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const updated = await prisma.compte.update({
      where: { id: compte.id },
      data: { solde: { decrement: total } },
    });

    const tx = await prisma.transaction.create({
      data: {
        type: "RETRAIT",
        compteId: compte.id,
        montant: parsed.data.montant,
        frais: fraisRetrait,
        agentId: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: { action: "RETRAIT", details: `${parsed.data.montant} FCFA sur ${compte.numero}`, userId: session.user.id },
    });

    return NextResponse.json({ transaction: tx, solde: updated.solde });
  }

  if (type === "VIREMENT") {
    const parsed = virementSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

    if (parsed.data.compteSourceId === parsed.data.compteDestId) {
      return NextResponse.json({ error: "Comptes identiques" }, { status: 400 });
    }

    const params = await prisma.parametre.findMany();
    const commPct = parseFloat(params.find(p => p.cle === "COMMISSION_VIREMENT")?.valeur || "0.5");
    const frais = Math.round(parsed.data.montant * commPct / 100);

    const source = await prisma.compte.findUnique({ where: { id: parsed.data.compteSourceId } });
    const dest = await prisma.compte.findUnique({ where: { id: parsed.data.compteDestId } });
    if (!source || !dest) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

    const total = parsed.data.montant + frais;
    if (parseFloat(source.solde.toString()) < total) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const [updatedSource, updatedDest, tx] = await prisma.$transaction([
      prisma.compte.update({ where: { id: source.id }, data: { solde: { decrement: total } } }),
      prisma.compte.update({ where: { id: dest.id }, data: { solde: { increment: parsed.data.montant } } }),
      prisma.transaction.create({
        data: {
          type: "VIREMENT",
          compteSourceId: source.id,
          compteDestId: dest.id,
          montant: parsed.data.montant,
          frais,
          agentId: session.user.id,
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: { action: "VIREMENT", details: `${parsed.data.montant} FCFA de ${source.numero} vers ${dest.numero}`, userId: session.user.id },
    });

    return NextResponse.json({ transaction: tx, soldeSource: updatedSource.solde, soldeDest: updatedDest.solde });
  }

  return NextResponse.json({ error: "Type de transaction inconnu" }, { status: 400 });
}
