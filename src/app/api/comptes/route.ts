import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { TypeCompte } from "@prisma/client";

const compteSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  type: z.enum(["EPARGNE", "COURANT", "PROJET"]),
  soldeInitial: z.number().min(0).default(0),
  projetNom: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || undefined;
    const q = searchParams.get("q") || "";

    const comptes = await prisma.compte.findMany({
      where: {
        AND: [
          type ? { type: type as TypeCompte } : {},
          q
            ? {
                OR: [
                  { numero: { contains: q, mode: "insensitive" } },
                  { client: { nom: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {},
        ],
      },
      include: {
        client: true, // Requis pour afficher nom & prénom dans l'UI
        _count: { select: { transactions: true } },
      },
      orderBy: { dateOuverture: "desc" },
    });

    return NextResponse.json(comptes || []);
  } catch (error) {
    console.error("Erreur GET /api/comptes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des comptes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const parsed = compteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Génération du numéro de compte
    const count = await prisma.compte.count();
    const numero = `AAR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Récupération des paramètres pour les taux
    const params = await prisma.parametre.findMany();
    const getParam = (cle: string) =>
      parseFloat(params.find((p) => p.cle === cle)?.valeur || "0");

    const tauxInteret =
      parsed.data.type === "EPARGNE"
        ? getParam("TAUX_EPARGNE")
        : parsed.data.type === "PROJET"
        ? getParam("TAUX_PROJET")
        : null;

    // Création du compte
    const compte = await prisma.compte.create({
      data: {
        numero,
        clientId: parsed.data.clientId,
        type: parsed.data.type,
        solde: parsed.data.soldeInitial,
        soldeInitial: parsed.data.soldeInitial,
        projetNom: parsed.data.projetNom,
        tauxInteret,
      },
    });

    // Transaction pour dépôt initial
    if (parsed.data.soldeInitial > 0) {
      await prisma.transaction.create({
        data: {
          type: "DEPOT",
          compteId: compte.id,
          montant: parsed.data.soldeInitial,
          agentId: userId,
          motif: "Ouverture de compte",
        },
      });
    }

    // Journal d'audit
    await prisma.auditLog.create({
      data: {
        action: "OUVERTURE_COMPTE",
        details: `Compte ${numero} ouvert`,
        userId: userId,
      },
    });

    return NextResponse.json(compte, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/comptes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}