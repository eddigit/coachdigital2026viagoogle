# Guide de Configuration Locale - COACH DIGITAL

**Développement en local avec backend et base de données Manus**

---

## 1. Vue d'Ensemble

Ce guide vous permet de développer le frontend COACH DIGITAL en local (VS Code) tout en conservant :

- **Backend** hébergé sur Manus (serveur Node.js/Express)
- **Base de données** MySQL sur AWS RDS (gérée par Manus)
- **Authentification** OAuth via Manus
- **Stockage fichiers** S3 (gérée par Manus)

**Avantages de cette approche :**

- Développement frontend rapide avec rechargement automatique
- Pas de duplication de base de données
- Modifications backend appliquées directement via Git
- Synchronisation facile des changements entre local et production

---

## 2. Prérequis

### 2.1 Logiciels Requis

Installez ces outils sur votre machine locale :

| Outil | Version | Lien |
|-------|---------|------|
| **Node.js** | 18+ | https://nodejs.org/ |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **Git** | Latest | https://git-scm.com/ |
| **VS Code** | Latest | https://code.visualstudio.com/ |

### 2.2 Accès aux Secrets

Vous aurez besoin des variables d'environnement suivantes. **Elles sont disponibles dans Manus Management UI → Settings → Secrets** :

```
VITE_APP_ID
VITE_APP_TITLE
VITE_APP_URL (sera remplacée par http://localhost:5173)
VITE_OAUTH_PORTAL_URL
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

---

## 3. Configuration Initiale

### 3.1 Cloner le Repository

```bash
# Cloner depuis GitHub
git clone https://github.com/eddigit/coachdigitalmanus.git
cd coachdigitalmanus

# Vérifier que le remote Manus est configuré
git remote -v
# Vous devriez voir :
# origin  https://github.com/eddigit/coachdigitalmanus.git (fetch)
# user_github  ... (push)
```

### 3.2 Installer les Dépendances

```bash
# Installer les dépendances du projet
pnpm install

# Vérifier l'installation
pnpm --version
node --version
```

### 3.3 Créer le Fichier .env.local

Créez un fichier `.env.local` à la racine du projet (ce fichier est ignoré par Git) :

```bash
# Créer le fichier
touch .env.local
```

**Contenu du fichier `.env.local` :**

```env
# ===== FRONTEND VARIABLES =====
VITE_APP_ID=5evvQHYxZbgpbBkTD2rF9K
VITE_APP_TITLE=COACH DIGITAL
VITE_APP_URL=http://localhost:5173
VITE_OAUTH_PORTAL_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=[COPIER DEPUIS MANUS SETTINGS → SECRETS]
VITE_STRIPE_PUBLISHABLE_KEY=[COPIER DEPUIS MANUS SETTINGS → SECRETS]
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=[COPIER DEPUIS MANUS SETTINGS → SECRETS]

# ===== BACKEND CONFIGURATION =====
# Le backend tourne sur Manus, pas en local
# Vous vous connecterez au backend distant via VITE_FRONTEND_FORGE_API_URL
```

**Comment récupérer les secrets depuis Manus :**

1. Ouvrez le Management UI de votre projet COACH DIGITAL
2. Cliquez sur **Settings** (engrenage en bas à gauche)
3. Allez dans l'onglet **Secrets**
4. Copiez les valeurs des variables listées ci-dessus
5. Collez-les dans votre `.env.local`

### 3.4 Vérifier la Configuration

```bash
# Vérifier que le fichier .env.local est créé
cat .env.local

# Vérifier que .env.local est dans .gitignore
grep ".env.local" .gitignore
```

---

## 4. Lancer le Projet en Local

### 4.1 Démarrer le Serveur de Développement

```bash
# Depuis la racine du projet
pnpm run dev

# Vous devriez voir :
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### 4.2 Accéder à l'Application

Ouvrez votre navigateur et allez à :

```
http://localhost:5173/
```

**Vous devriez voir :**

- Page de connexion COACH DIGITAL
- Bouton "Se connecter avec Manus"
- Après connexion : dashboard avec tous vos leads, projets, tâches

### 4.3 Architecture de la Connexion

```
┌─────────────────────────────────────────────────────────────┐
│                  Votre Ordinateur Local                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend React (http://localhost:5173)              │   │
│  │  ├─ Développement avec Vite (rechargement auto)      │   │
│  │  ├─ Fichiers modifiables en temps réel               │   │
│  │  └─ Connexion à backend distant via HTTPS            │   │
│  └──────────────────────────────────────────────────────┘   │
│           │                                                   │
│           │ Requêtes HTTPS (tRPC)                            │
│           │                                                   │
└───────────┼───────────────────────────────────────────────────┘
            │
            │ (Internet)
            │
┌───────────▼───────────────────────────────────────────────────┐
│              Infrastructure Manus (Cloud)                      │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Backend Node.js (Express + tRPC)                    │    │
│  │  ├─ Routers tRPC (leads, clients, projects, etc.)   │    │
│  │  ├─ Authentification OAuth                           │    │
│  │  └─ Logique métier                                   │    │
│  └──────────────────────────────────────────────────────┘    │
│           │                                                    │
│           ├─ Requêtes SQL                                     │
│           │                                                    │
│  ┌────────▼──────────────────────────────────────────┐       │
│  │  MySQL Database (AWS RDS)                         │       │
│  │  ├─ Leads, Clients, Projects, Tasks, etc.        │       │
│  │  └─ Données persistantes                          │       │
│  └───────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Services Externes                                   │    │
│  │  ├─ S3 (Stockage fichiers)                          │    │
│  │  ├─ Stripe (Paiements)                              │    │
│  │  └─ SMTP Gmail (Emails)                             │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Workflow de Développement

### 5.1 Développer le Frontend

**Fichiers à modifier :**

- `client/src/pages/*.tsx` - Pages de l'application
- `client/src/components/*.tsx` - Composants réutilisables
- `client/src/styles/*.css` - Styles globaux
- `client/src/lib/*.ts` - Utilitaires et helpers

**Exemple : Modifier la page Leads**

```bash
# 1. Ouvrir le fichier dans VS Code
code client/src/pages/LeadsBase.tsx

# 2. Faire vos modifications
# 3. Sauvegarder (Ctrl+S)
# 4. Le navigateur se recharge automatiquement (HMR)
# 5. Tester vos changements
```

### 5.2 Modifier le Backend (Depuis Manus)

**Important :** Le backend tourne sur Manus, pas en local. Si vous devez modifier le backend :

1. **Via Manus Management UI :**
   - Ouvrez le Management UI
   - Allez dans l'onglet **Code**
   - Modifiez les fichiers serveur (`server/*.ts`)
   - Sauvegardez (le serveur redémarre automatiquement)

2. **Via Git (depuis VS Code) :**
   - Modifiez les fichiers `server/*.ts` en local
   - Commitez et poussez vers GitHub
   - Manus synchronise automatiquement via Git

### 5.3 Synchroniser avec Git

**Workflow recommandé :**

```bash
# 1. Avant de commencer, récupérer les derniers changements
git pull origin main

# 2. Créer une branche pour vos modifications (optionnel)
git checkout -b feature/ma-fonctionnalite

# 3. Faire vos modifications en local
# ... modifiez les fichiers ...

# 4. Vérifier les changements
git status

# 5. Ajouter les fichiers modifiés
git add client/src/pages/LeadsBase.tsx

# 6. Committer avec un message clair
git commit -m "feat: amélioration de la page Base de Leads"

# 7. Pousser vers GitHub
git push origin feature/ma-fonctionnalite

# 8. (Optionnel) Créer une Pull Request sur GitHub
# Allez sur https://github.com/eddigit/coachdigitalmanus
# Cliquez sur "New Pull Request"
# Sélectionnez votre branche
# Décrivez vos changements
# Cliquez sur "Create Pull Request"

# 9. Après approbation, fusionner dans main
git checkout main
git pull origin main
git merge feature/ma-fonctionnalite
git push origin main
```

**Manus synchronisera automatiquement les changements depuis GitHub.**

---

## 6. Gestion de la Base de Données

### 6.1 Accéder à la Base de Données

Vous pouvez consulter/modifier la base de données via le Management UI de Manus :

1. Ouvrez le Management UI
2. Cliquez sur **Database** (en bas à gauche)
3. Vous verrez :
   - Vue CRUD des tables
   - Informations de connexion (Host, Port, Username, Password)
   - Option pour télécharger les données

### 6.2 Connexion Directe (Optionnel)

Si vous voulez vous connecter directement à MySQL depuis votre machine locale :

**Récupérer les informations de connexion :**

1. Management UI → **Database** → **Settings** (engrenage en bas à gauche)
2. Notez :
   - Host
   - Port
   - Username
   - Password
   - Database name

**Connexion via MySQL Workbench ou CLI :**

```bash
# Via MySQL CLI
mysql -h [HOST] -P [PORT] -u [USERNAME] -p

# Puis entrez le mot de passe quand demandé
# Vous pouvez alors faire des requêtes SQL

# Exemple : voir tous les leads
SELECT * FROM leads;

# Exemple : voir tous les clients
SELECT * FROM clients;
```

**⚠️ Important :** N'effectuez des modifications directes à la base de données que si vous savez ce que vous faites. Préférez passer par l'interface de l'application.

### 6.3 Migrations de Schéma

Si vous devez modifier le schéma de la base de données :

1. **Modifiez le schéma en local :**
   ```bash
   # Éditez le fichier
   code drizzle/schema.ts
   
   # Ajoutez vos colonnes/tables
   ```

2. **Générez la migration :**
   ```bash
   pnpm db:generate
   ```

3. **Appliquez la migration :**
   ```bash
   pnpm db:push
   ```

4. **Commitez les changements :**
   ```bash
   git add drizzle/
   git commit -m "chore: migration schema"
   git push origin main
   ```

**Manus appliquera automatiquement la migration sur la base de données production.**

---

## 7. Dépannage

### 7.1 Le Frontend ne se connecte pas au Backend

**Symptôme :** Erreur "Cannot connect to backend" ou "Network error"

**Solutions :**

1. Vérifiez que `VITE_FRONTEND_FORGE_API_URL` est correctement défini dans `.env.local`
2. Vérifiez votre connexion Internet
3. Vérifiez que le backend Manus est opérationnel (Management UI → Dashboard)
4. Videz le cache du navigateur (Ctrl+Shift+Delete)
5. Redémarrez le serveur de développement (`pnpm run dev`)

### 7.2 Les variables d'environnement ne sont pas chargées

**Symptôme :** `VITE_APP_ID` est undefined dans la console

**Solutions :**

1. Vérifiez que `.env.local` existe à la racine du projet
2. Vérifiez que les variables commencent par `VITE_` (requis par Vite)
3. Redémarrez le serveur de développement après modification de `.env.local`
4. Videz le cache du navigateur

### 7.3 Les modifications du frontend ne s'affichent pas

**Symptôme :** Vous modifiez un fichier mais les changements n'apparaissent pas

**Solutions :**

1. Vérifiez que le serveur de développement tourne (`pnpm run dev`)
2. Vérifiez que le fichier a été sauvegardé (Ctrl+S)
3. Attendez quelques secondes (HMR peut être lent)
4. Videz le cache du navigateur (Ctrl+Shift+Delete)
5. Redémarrez le serveur de développement

### 7.4 Erreur "Port 5173 already in use"

**Symptôme :** Impossible de démarrer le serveur, port déjà utilisé

**Solutions :**

```bash
# Trouver le processus qui utilise le port 5173
lsof -i :5173

# Tuer le processus
kill -9 [PID]

# Ou utiliser un port différent
pnpm run dev -- --port 5174
```

### 7.5 Erreur "CORS" lors d'appels API

**Symptôme :** Erreur CORS dans la console du navigateur

**Solutions :**

1. Vérifiez que `VITE_APP_URL` est défini correctement
2. Vérifiez que le backend autorise les requêtes depuis `http://localhost:5173`
3. Contactez le support Manus si le problème persiste

---

## 8. Bonnes Pratiques

### 8.1 Gestion des Commits

**Format des messages de commit :**

```
feat: ajouter une nouvelle fonctionnalité
fix: corriger un bug
chore: tâche de maintenance
docs: mise à jour de la documentation
style: changements de style/formatage
refactor: refactorisation du code
test: ajout/modification de tests
```

**Exemples :**

```bash
git commit -m "feat: ajouter filtre par audience dans Base de Leads"
git commit -m "fix: corriger le bug d'affichage des tâches par période"
git commit -m "chore: mettre à jour les dépendances"
```

### 8.2 Avant de Pousser

```bash
# 1. Vérifier que votre code compile
pnpm run build

# 2. Exécuter les tests (si disponibles)
pnpm run test

# 3. Vérifier les changements
git diff

# 4. Vérifier les fichiers à committer
git status

# 5. Pousser uniquement si tout est OK
git push origin main
```

### 8.3 Éviter les Erreurs Courantes

- ❌ Ne commitez pas `.env.local` (il est dans `.gitignore`)
- ❌ Ne modifiez pas `node_modules/` directement
- ❌ Ne poussez pas directement sur `main` sans test
- ✅ Créez une branche pour chaque fonctionnalité
- ✅ Testez en local avant de pousser
- ✅ Écrivez des messages de commit clairs

---

## 9. Mise à Jour du Projet

### 9.1 Récupérer les Derniers Changements

```bash
# Récupérer les changements depuis GitHub
git fetch origin

# Voir les changements
git log --oneline origin/main..main

# Fusionner les changements
git pull origin main
```

### 9.2 Mettre à Jour les Dépendances

```bash
# Voir les dépendances obsolètes
pnpm outdated

# Mettre à jour les dépendances
pnpm update

# Mettre à jour une dépendance spécifique
pnpm add react@latest
```

### 9.3 Redémarrer le Serveur Après Mise à Jour

```bash
# Arrêter le serveur (Ctrl+C)
# Réinstaller les dépendances
pnpm install

# Redémarrer le serveur
pnpm run dev
```

---

## 10. Commandes Utiles

### 10.1 Commandes pnpm

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm run dev

# Construire pour la production
pnpm run build

# Prévisualiser la build de production
pnpm run preview

# Exécuter les tests
pnpm run test

# Linter le code
pnpm run lint

# Formater le code
pnpm run format

# Générer les migrations de schéma
pnpm db:generate

# Appliquer les migrations
pnpm db:push
```

### 10.2 Commandes Git

```bash
# Voir l'état des fichiers
git status

# Voir les changements
git diff

# Ajouter des fichiers
git add [fichier]
git add .  # Tous les fichiers

# Committer
git commit -m "message"

# Pousser
git push origin [branche]

# Récupérer les changements
git pull origin [branche]

# Voir l'historique
git log --oneline

# Créer une branche
git checkout -b [nom-branche]

# Changer de branche
git checkout [nom-branche]

# Fusionner une branche
git merge [nom-branche]
```

---

## 11. Support et Ressources

### 11.1 Documentation

- **Manus Documentation** : https://help.manus.im
- **React Documentation** : https://react.dev
- **Vite Documentation** : https://vitejs.dev
- **tRPC Documentation** : https://trpc.io
- **Drizzle Documentation** : https://orm.drizzle.team

### 11.2 Problèmes Courants

**Q : Comment ajouter une nouvelle page ?**
A : Créez un fichier `.tsx` dans `client/src/pages/`, puis ajoutez la route dans `client/src/App.tsx`

**Q : Comment ajouter une nouvelle API ?**
A : Créez un nouveau router dans `server/` et ajoutez-le à `server/routers.ts`

**Q : Comment modifier le schéma de la base de données ?**
A : Modifiez `drizzle/schema.ts`, puis exécutez `pnpm db:push`

**Q : Comment déployer mes changements ?**
A : Poussez sur GitHub (`git push origin main`), Manus synchronisera automatiquement

### 11.3 Contacter le Support

- **Email** : support@manus.im
- **Formulaire** : https://help.manus.im
- **Chat** : Disponible dans le Management UI

---

## 12. Checklist de Démarrage

Avant de commencer le développement, vérifiez que :

- [ ] Node.js 18+ est installé (`node --version`)
- [ ] pnpm est installé (`pnpm --version`)
- [ ] Git est installé (`git --version`)
- [ ] Le repository est cloné localement
- [ ] Le fichier `.env.local` est créé avec les bonnes variables
- [ ] `pnpm install` a été exécuté
- [ ] `pnpm run dev` démarre sans erreur
- [ ] Vous pouvez accéder à `http://localhost:5173/`
- [ ] Vous pouvez vous connecter avec vos identifiants Manus
- [ ] Vous voyez vos leads, clients et projets

---

**Bon développement ! 🚀**

Document rédigé par : Manus AI  
Date : 21 janvier 2026  
Version : 1.0
