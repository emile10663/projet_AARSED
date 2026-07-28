# AARSED - Plateforme Microfinance

## Prérequis

- **Node.js** 20+ (vérifier avec `node -v`)
- **PostgreSQL** 14+ (local ou cloud)
- **npm** ou **pnpm**

---

## Étape 1 : Installer PostgreSQL

### Option A - Windows
1. Télécharger PostgreSQL : https://www.postgresql.org/download/windows/
2. Lancer l'installateur, choisir :
   - **Port** : `5432`
   - **Mot de passe superuser** : choisis un mot de passe (ex: `postgres123`)
   - Cocher "pgAdmin 4" et "Stack Builder"
3. Ouvrir **pgAdmin 4** → clic droit sur "Databases" → "Create" → "Database"
   - **Database name** : `aarsed`
   - **Owner** : `postgres`
   - Cliquer "Save"

### Option B - Mac (Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14

# Créer la base de données
createdb aarsed
```

### Option C - Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Se connecter en postgres
sudo -u postgres psql

# Dans psql, taper :
CREATE DATABASE aarsed;
CREATE USER aarsed_user WITH ENCRYPTED PASSWORD 'ton_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE aarsed TO aarsed_user;
\q
```

### Option D - Cloud (Neon, Supabase, Railway)
Si tu n'as pas envie d'installer PostgreSQL localement :
1. Créer un compte sur https://neon.tech (gratuit)
2. Créer un projet → copier la **Connection String**
3. Passer directement à l'Étape 2

---

## Étape 2 : Configurer le fichier .env

```bash
cp .env.example .env
```

Ouvrir `.env` et modifier la ligne :

### Si PostgreSQL local (Windows/Mac/Linux) :
```env
DATABASE_URL="postgresql://postgres:TON_MOT_DE_PASSE@localhost:5432/aarsed?schema=public"
AUTH_SECRET="une-chaine-aleatoire-tres-longue-minimum-32-caracteres"
AUTH_URL="http://localhost:3000"
```

### Exemple concret (mot de passe = postgres123) :
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/aarsed?schema=public"
AUTH_SECRET="aarsed-secret-key-2026-microfinance-afrique-ouest"
AUTH_URL="http://localhost:3000"
```

### Si Neon/Supabase (cloud) :
```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/aarsed?sslmode=require"
AUTH_SECRET="aarsed-secret-key-2026-microfinance-afrique-ouest"
AUTH_URL="http://localhost:3000"
```

> **IMPORTANT** : Remplace `TON_MOT_DE_PASSE` par le mot de passe que tu as choisi lors de l'installation de PostgreSQL.

---

## Étape 3 : Installer les dépendances

```bash
npm install
```

Si tu as des erreurs, essayer :
```bash
npm install --legacy-peer-deps
```

---

## Étape 4 : Générer le client Prisma

```bash
npx prisma generate
```

Cette commande génère les types TypeScript à partir du schéma Prisma.

---

## Étape 5 : Créer les tables (Migration)

```bash
npx prisma migrate dev --name init
```

Quand on te demande :
```
? Do you want to create the migration? (yes/no)
```
→ Taper `yes` et Entrée.

Cela va :
- Créer toutes les tables (users, clients, comptes, transactions, etc.)
- Créer un dossier `prisma/migrations/`
- Appliquer la migration à la base de données

---

## Étape 6 : Insérer les données de démo (Seed)

```bash
npx tsx prisma/seed.ts
```

Tu devrais voir :
```
✅ Seed terminé avec succès !
Identifiants de démo :
  Admin    : admin@aarsed.com / admin123
  Agent    : agent@aarsed.com / agent123
  Collecteur : collecteur@aarsed.com / agent123
```

---

## Étape 7 : Lancer l'application

```bash
npm run dev
```

Ouvrir le navigateur à : **http://localhost:3000**

---

## Vérifier que tout fonctionne

1. Page de login → `admin@aarsed.com` / `admin123`
2. Tableau de bord → voir les KPI (5 clients, ~5M FCFA de solde)
3. Clients → liste avec recherche
4. Comptes → filtres par type
5. Opérations → dépôt/retrait/virement
6. Collecte → simulation collecte mobile
7. Audit → journal des actions
8. Paramètres → modifier les taux

---

## Résolution des problèmes courants

### Erreur : "Database does not exist"
→ La base `aarsed` n'existe pas. La créer manuellement dans pgAdmin ou avec `createdb aarsed`.

### Erreur : "password authentication failed"
→ Le mot de passe dans `.env` est incorrect. Vérifier avec pgAdmin.

### Erreur : "prisma: command not found"
→ `npm install` n'a pas fonctionné. Réessayer : `npm install -g prisma` puis `npm install`.

### Erreur : "next-auth" / module not found
→ Supprimer `node_modules` et réinstaller :
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur : Port 3000 déjà utilisé
→ Lancer sur un autre port :
```bash
npm run dev -- --port 3001
```

---

## Structure du projet

```
aarsed/
├── prisma/
│   ├── schema.prisma      # Schéma base de données
│   └── seed.ts            # Données de démo
├── src/
│   ├── app/               # Pages Next.js (App Router)
│   │   ├── api/           # API Routes
│   │   ├── dashboard/     # Tableau de bord
│   │   ├── clients/       # Gestion clients
│   │   ├── comptes/       # Gestion comptes
│   │   ├── operations/    # Dépôt/Retrait/Virement
│   │   ├── collecte/      # Collecte mobile
│   │   ├── audit/         # Journal d'audit
│   │   └── parametres/    # Configuration système
│   ├── components/        # Composants réutilisables
│   ├── lib/               # Utilitaires (Prisma, Auth, Utils)
│   └── types/             # Types TypeScript
├── .env                   # Variables d'environnement
└── package.json
```

---

## Identifiants de démo

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@aarsed.com | admin123 |
| Agent Guichet | agent@aarsed.com | agent123 |
| Agent Collecteur | collecteur@aarsed.com | agent123 |
| Analyste Crédit | analyste@aarsed.com | agent123 |
| Dirigeant | dg@aarsed.com | agent123 |

---

## Commandes utiles

```bash
# Voir la base de données (GUI)
npx prisma studio

# Réinitialiser la base (ATTENTION : supprime tout !)
npx prisma migrate reset

# Nouvelle migration après modification du schéma
npx prisma migrate dev --name nom_de_la_modif

# Générer le client Prisma
npx prisma generate

# Voir les logs
npm run dev
```

---

## Déploiement production

1. **Base de données** : Neon, Supabase, ou VPS avec PostgreSQL
2. **Hébergement** : Vercel (`vercel --prod`) ou VPS (Docker)
3. **Variables d'environnement** : configurer `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
4. **Build** : `npm run build` puis `npm start`

---

Développé pour AARSED - Microfinance Afrique de l'Ouest.
