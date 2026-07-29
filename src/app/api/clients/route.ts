import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/lib/auth"; // corrected import path

const clientSchema = z.object({
  nom: z.string().min(2),
  telephone: z.string().min(8),
  pieceIdentite: z.string().min(3),
  adresse: z.string().optional(),
  dateNaissance: z.string().optional(),
  profession: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { telephone: { contains: q } },
        ],
      },
      include: { comptes: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur GET /api/clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", issues: parsed.error.issues }, { status: 400 });
    }

    const exists = await prisma.client.findUnique({ where: { telephone: parsed.data.telephone } });
    if (exists) {
      return NextResponse.json({ error: "Un client avec ce téléphone existe déjà" }, { status: 409 });
    }

    const client = await prisma.client.create({ data: parsed.data });

    // 👈 FIX 2: Sécurisation de l'audit log avec userId optionnel
    if (session.user.id) {
      await prisma.auditLog.create({
        data: {
          action: "CREATION_CLIENT",
          details: `Client créé: ${client.nom}`,
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/clients:", error);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}