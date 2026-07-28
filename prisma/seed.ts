import { PrismaClient, Role, TypeCompte, TypeTransaction, StatutTransaction } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Créer les utilisateurs
  const adminPass = await bcrypt.hash("admin123", 10);
  const agentPass = await bcrypt.hash("agent123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@aarsed.com", name: "Administrateur", role: Role.ADMIN, password: adminPass },
  });

  const agent = await prisma.user.create({
    data: { email: "agent@aarsed.com", name: "Agent Guichet", role: Role.AGENT_GUICHET, password: agentPass },
  });

  const collecteur = await prisma.user.create({
    data: { email: "collecteur@aarsed.com", name: "Agent Collecteur", role: Role.AGENT_COLLECTEUR, password: agentPass },
  });

  const analyste = await prisma.user.create({
    data: { email: "analyste@aarsed.com", name: "Analyste Crédit", role: Role.ANALYSTE_CREDIT, password: agentPass },
  });

  const dirigeant = await prisma.user.create({
    data: { email: "dg@aarsed.com", name: "Directeur Général", role: Role.DIRIGEANT, password: agentPass },
  });

  // Créer les clients
  const clients = await Promise.all([
    prisma.client.create({ data: { nom: "Koffi Amani", telephone: "+22890123456", pieceIdentite: "ID-TO-88432", adresse: "Lomé, Tokoin" } }),
    prisma.client.create({ data: { nom: "Amouzou Esi", telephone: "+22892456789", pieceIdentite: "ID-TO-99121", adresse: "Lomé, Adidogin" } }),
    prisma.client.create({ data: { nom: "Dossou Paul", telephone: "+22870334455", pieceIdentite: "ID-TO-11209", adresse: "Lomé, Kégué" } }),
    prisma.client.create({ data: { nom: "Kossi Mawuena", telephone: "+22896789012", pieceIdentite: "ID-TO-44567", adresse: "Lomé, Bé" } }),
    prisma.client.create({ data: { nom: "Abla Mensah", telephone: "+22891234567", pieceIdentite: "ID-TO-77890", adresse: "Lomé, Agoè" } }),
  ]);

  // Créer les comptes
  const comptes = await Promise.all([
    prisma.compte.create({ data: { numero: "AAR-2026-0001", clientId: clients[0].id, type: TypeCompte.COURANT, solde: 450000, soldeInitial: 450000 } }),
    prisma.compte.create({ data: { numero: "AAR-2026-0002", clientId: clients[0].id, type: TypeCompte.EPARGNE, solde: 1200000, soldeInitial: 1200000, tauxInteret: 3.5 } }),
    prisma.compte.create({ data: { numero: "AAR-2026-0003", clientId: clients[1].id, type: TypeCompte.COURANT, solde: 320000, soldeInitial: 320000 } }),
    prisma.compte.create({ data: { numero: "AAR-2026-0004", clientId: clients[2].id, type: TypeCompte.PROJET, solde: 800000, soldeInitial: 800000, tauxInteret: 5.0, projetNom: "Achat moto" } }),
    prisma.compte.create({ data: { numero: "AAR-2026-0005", clientId: clients[3].id, type: TypeCompte.EPARGNE, solde: 2500000, soldeInitial: 2500000, tauxInteret: 3.5 } }),
    prisma.compte.create({ data: { numero: "AAR-2026-0006", clientId: clients[4].id, type: TypeCompte.COURANT, solde: 150000, soldeInitial: 150000 } }),
  ]);

  // Créer des transactions
  const now = new Date();
  await Promise.all([
    prisma.transaction.create({ data: { type: TypeTransaction.DEPOT, compteId: comptes[0].id, montant: 200000, agentId: agent.id, createdAt: new Date(now.getTime() - 2 * 86400000), motif: "Versement initial" } }),
    prisma.transaction.create({ data: { type: TypeTransaction.RETRAIT, compteId: comptes[0].id, montant: 50000, agentId: agent.id, createdAt: new Date(now.getTime() - 86400000) } }),
    prisma.transaction.create({ data: { type: TypeTransaction.DEPOT, compteId: comptes[1].id, montant: 500000, agentId: agent.id, createdAt: new Date(now.getTime() - 3 * 86400000) } }),
    prisma.transaction.create({ data: { type: TypeTransaction.VIREMENT, compteSourceId: comptes[1].id, compteDestId: comptes[2].id, montant: 150000, agentId: agent.id, createdAt: new Date(now.getTime() - 1.5 * 86400000) } }),
    prisma.transaction.create({ data: { type: TypeTransaction.COLLECTE, compteId: comptes[0].id, montant: 25000, agentId: collecteur.id, createdAt: now, motif: "Lomé" } }),
  ]);

  // Paramètres système
  await Promise.all([
    prisma.parametre.create({ data: { cle: "TAUX_EPARGNE", valeur: "3.5", description: "Taux d'intérêt épargne annuel (%)" } }),
    prisma.parametre.create({ data: { cle: "TAUX_PROJET", valeur: "5.0", description: "Taux d'intérêt épargne projet annuel (%)" } }),
    prisma.parametre.create({ data: { cle: "FRAIS_RETRAIT", valeur: "500", description: "Frais fixes par retrait (FCFA)" } }),
    prisma.parametre.create({ data: { cle: "COMMISSION_VIREMENT", valeur: "0.5", description: "Commission virement (%)" } }),
    prisma.parametre.create({ data: { cle: "PLAFOND_RETRAIT_SANS_2FA", valeur: "100000", description: "Plafond retrait sans 2FA (FCFA)" } }),
    prisma.parametre.create({ data: { cle: "DUREE_SESSION", valeur: "30", description: "Durée session en minutes" } }),
  ]);

  // Logs d'audit
  await Promise.all([
    prisma.auditLog.create({ data: { action: "INITIALISATION", details: "Base de données initialisée avec données de démo", userId: admin.id } }),
    prisma.auditLog.create({ data: { action: "CONNEXION", details: "Connexion back-office", userId: admin.id } }),
  ]);

  console.log("✅ Seed terminé avec succès !");
  console.log("Identifiants de démo :");
  console.log("  Admin    : admin@aarsed.com / admin123");
  console.log("  Agent    : agent@aarsed.com / agent123");
  console.log("  Collecteur : collecteur@aarsed.com / agent123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
