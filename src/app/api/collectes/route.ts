import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth"; // 👈 FIX 1: Import correct pour NextAuth v5

const collecteSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  montant: z.number().positive("Le montant doit être supérieur à 0"),
  localisation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const collectes = await prisma.collecte.findMany({
      include: {
        client: { select: { id: true, nom: true, prenom: true } }, // 👈 FIX 2: Inclus les infos du client pour l'UI
        agent: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(collectes || []);
  } catch (error) {
    console.error("Erreur GET /api/collectes:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des collectes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié ou utilisateur invalide" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const parsed = collecteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    // Récupérer un compte du client (ou compte courant par défaut)
    const compte = await prisma.compte.findFirst({
      where: { clientId: client.id, type: "COURANT" },
    });

    // Créer la collecte
    const collecte = await prisma.collecte.create({
      data: {
        clientId: parsed.data.clientId,
        montant: parsed.data.montant,
        localisation: parsed.data.localisation,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        agentId: userId,
      },
    });

    // Mettre à jour le solde et enregistrer la transaction
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
          agentId: userId,
          motif: parsed.data.localisation || "Collecte terrain",
        },
      });
    }

    // Journal d'audit
    await prisma.auditLog.create({
      data: {
        action: "COLLECTE",
        details: `${parsed.data.montant} FCFA chez ${client.nom}`,
        userId: userId,
      },
    });

    return NextResponse.json(collecte, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/collectes:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la collecte" }, { status: 500 });
  }
}