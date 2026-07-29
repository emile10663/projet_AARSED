import { PrismaClient, Role, TypeCompte, TypeTransaction } from "@prisma/client";
import bcrypt from "bcryptjs";

// Force Prisma à utiliser DIRECT_URL pour le seeding local
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Début de la réinitialisation et génération des données de démo...");

  // 1. Nettoyage ordonné des données existantes (évite les erreurs de clés étrangères)
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.collecte.deleteMany();
  await prisma.demandeCredit.deleteMany();
  await prisma.compte.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.parametre.deleteMany();

  // 2. Création des Utilisateurs
  console.log("👤 Création des utilisateurs...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Administrateur Système",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const agentGuichet = await prisma.user.create({
    data: {
      email: "guichet@demo.com",
      name: "Jean Dupont (Guichet)",
      password: agentPassword,
      role: Role.AGENT_GUICHET,
    },
  });

  const agentCollecteur = await prisma.user.create({
    data: {
      email: "collecteur@demo.com",
      name: "Marc Koffi (Collecteur)",
      password: agentPassword,
      role: Role.AGENT_COLLECTEUR,
    },
  });

  // 3. Création des Clients
  console.log("👥 Création des clients...");
  const client1 = await prisma.client.create({
    data: {
      nom: "KOFFI Amen",
      telephone: "+22890000001",
      pieceIdentite: "TOGO-CNI-12345678",
      adresse: "Lomé, quartier Adidogomé",
      profession: "Commerçant",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      nom: "MENSAH Akpéné",
      telephone: "+22890000002",
      pieceIdentite: "TOGO-CNI-87654321",
      adresse: "Atakpamé, centre-ville",
      profession: "Enseignante",
    },
  });

  // 4. Création des Comptes bancaires
  console.log("💳 Création des comptes...");
  const compte1 = await prisma.compte.create({
    data: {
      numero: "CPT-2026-0001",
      clientId: client1.id,
      type: TypeCompte.COURANT,
      solde: 150000.00,
      soldeInitial: 50000.00,
    },
  });

  const compte2 = await prisma.compte.create({
    data: {
      numero: "CPT-2026-0002",
      clientId: client1.id,
      type: TypeCompte.EPARGNE,
      solde: 350000.00,
      soldeInitial: 100000.00,
      tauxInteret: 3.50,
    },
  });

  const compte3 = await prisma.compte.create({
    data: {
      numero: "CPT-2026-0003",
      clientId: client2.id,
      type: TypeCompte.PROJET,
      projetNom: "Achat Équipement Informatique",
      solde: 75000.00,
      soldeInitial: 25000.00,
      tauxInteret: 5.00,
    },
  });

  // 5. Création des Transactions
  console.log("📊 Création des transactions...");
  await prisma.transaction.create({
    data: {
      type: TypeTransaction.DEPOT,
      compteId: compte1.id,
      montant: 100000.00,
      motif: "Dépôt initial au guichet",
      agentId: agentGuichet.id,
    },
  });

  await prisma.transaction.create({
    data: {
      type: TypeTransaction.RETRAIT,
      compteId: compte1.id,
      montant: 20000.00,
      frais: 100.00,
      motif: "Retrait espèces client",
      agentId: agentGuichet.id,
    },
  });

  // 6. Création des Collectes de terrain
  console.log("📱 Création des collectes terrain...");
  await prisma.collecte.create({
    data: {
      clientId: client1.id,
      montant: 5000.00,
      localisation: "Grand Marché de Lomé",
      latitude: 6.13720000,
      longitude: 1.21250000,
      agentId: agentCollecteur.id,
      synchronise: true,
    },
  });

  // 7. Création des Paramètres du système
  console.log("⚙️ Enregistrement des paramètres...");
  await prisma.parametre.createMany({
    data: [
      { cle: "TAUX_EPARGNE_PAR_DEFAUT", valeur: "3.5", description: "Taux annuel épargne (%)" },
      { cle: "FRAIS_RETRAIT_FIXE", valeur: "100", description: "Frais de retrait fixes en FCFA" },
    ],
  });

  // 8. Enregistrement dans les journaux d'audit
  console.log("📝 Enregistrement des journaux d'audit...");
  await prisma.auditLog.create({
    data: {
      action: "INITIALISATION_SYSTEME",
      details: "Génération automatique des données de démonstration",
      userId: admin.id,
      ipAddress: "127.0.0.1",
    },
  });

  console.log("✅ Base de données initialisée avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });