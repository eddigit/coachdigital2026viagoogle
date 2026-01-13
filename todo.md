# COACH DIGITAL - TODO (Reconstruction complète)

## Phase 1 : Base de données
- [x] Schéma clients (infos complètes + catégories)
- [x] Schéma projets (lié clients + statuts)
- [x] Schéma tâches (lié projets + temps)
- [x] Schéma documents (devis/factures + lignes)
- [x] Schéma company (infos entreprise Gilles)
- [x] Pousser migrations DB

## Phase 2 : API Backend
- [x] Router clients (CRUD complet)
- [x] Router projets (CRUD complet)
- [x] Router tâches (CRUD complet)
- [x] Router documents (CRUD + génération PDF)
- [x] Router company (lecture/mise à jour)
- [ ] Tests unitaires API

## Phase 3 : Interface Admin
- [ ] Dashboard avec stats
- [ ] Page Clients (liste + formulaires)
- [ ] Page Projets (liste + formulaires)
- [ ] Page Tâches (liste + formulaires)
- [ ] Page Documents (liste + création devis/factures)
- [ ] Page Paramètres (company info)

## Phase 4 : Documents & PDF
- [x] Génération PDF devis
- [x] Génération PDF factures
- [ ] Calculs automatiques (HT, TVA, TTC)
- [ ] Numérotation automatique
- [ ] Conversion devis → facture

## Phase 5 : Espace Client
- [ ] Authentification client
- [ ] Mes projets
- [ ] Mes tâches
- [ ] Mes documents
- [ ] Faire une demande

## Phase 6 : Tests & Livraison
- [ ] Tests complets de l'interface
- [ ] Tests des formulaires
- [ ] Tests de génération PDF
- [ ] Vérification authentification
- [ ] Checkpoint final


## Tâches urgentes à compléter
- [x] Formulaires complets Clients (création + édition)
- [x] Formulaires complets Projets (création + édition)
- [x] Formulaires complets Tâches (création + édition)
- [x] Formulaires complets Documents (création devis/factures)
- [x] Page Paramètres avec infos entreprise
- [x] Génération PDF devis
- [x] Génération PDF factures
- [ ] Numérotation automatique documents
- [ ] Calculs automatiques (HT, TVA, TTC)
- [ ] Espace client (portail séparé)
- [ ] Navigation sidebar complète


## Nouvelles tâches urgentes (demande utilisateur)
- [x] Créer données de démonstration (clients)
- [x] Créer données de démonstration (projets)
- [x] Créer données de démonstration (tâches)
- [ ] Créer données de démonstration (documents)
- [ ] Créer données de démonstration (infos entreprise)
- [ ] Formulaire création documents complet
- [ ] Calculs automatiques HT/TVA/TTC
- [ ] Génération PDF effective
- [ ] Espace client sécurisé


## CRITIQUE - Problèmes à corriger immédiatement
- [x] Corriger DashboardLayout - sidebar ne s'affiche pas
- [x] Ajouter menu de navigation complet
- [ ] Implémenter toutes les fonctionnalités du cahier des charges manquantes
- [ ] Créer l'espace client complet
- [ ] Ajouter système de messagerie
- [ ] Ajouter calendrier intégré
- [ ] Ajouter coffre-fort documents
- [ ] Ajouter suivi du temps intégré
- [ ] Ajouter tableau de bord analytique


## Refonte Design Ultra-Moderne (demande utilisateur)
- [x] Changer theme en dark mode
- [x] Intégrer police Inter (Google Fonts)
- [x] Palette de couleurs bleu nuit (background, accents)
- [x] Coins carrés (border-radius minimal)
- [x] Style Tesla/Apple épuré
- [ ] Refonte sidebar avec nouveau design
- [ ] Refonte cards dashboard
- [ ] Refonte formulaires
- [ ] Refonte boutons et interactions


## Espace Client Sécurisé (demande utilisateur prioritaire)
- [x] Créer table clientUsers pour authentification séparée
- [x] Système login/password pour clients (URL /client)
- [x] Système d'invitation par email
- [ ] Page login client (/client/login)
- [ ] Dashboard client avec ses documents
- [ ] Liste devis/factures accessibles au client
- [ ] Messagerie sécurisée client-coach
- [ ] Coffre-fort RGPD pour credentials (API, logins, passwords)
- [ ] Formulaire de demande avec onboarding
- [ ] Notification email automatique à Gilles
- [ ] Gestion des demandes côté admin
- [ ] Historique des échanges


## Refonte Design - Identité Visuelle Coach Digital Paris
- [x] Mettre à jour palette de couleurs avec orange #E67E50
- [x] Remplacer bleu par orange pour tous les accents
- [x] Créer logo "G" avec bordure orange
- [x] Adapter tous les boutons CTA en orange
- [x] Mettre à jour les hover states
- [x] Vérifier cohérence sur toutes les pages


## Formulaire de Demande Client Multi-Étapes
- [x] Créer composant formulaire multi-étapes avec indicateur progression
- [x] Étape 1 : Sélection type de besoin (Coaching IA, Site web, App, Optimisation)
- [x] Étape 2 : Description détaillée (contexte, objectifs, besoins)
- [x] Étape 3 : Budget et délai (montant, échéance, priorité)
- [x] Étape 4 : Récapitulatif et validation
- [x] Validation Zod à chaque étape
- [ ] Sauvegarde automatique en brouillon
- [x] Router tRPC pour créer/modifier demandes
- [x] Notification email à coachdigitalparis@gmail.com
- [ ] Afficher historique demandes dans dashboard client
- [ ] Statuts demandes (brouillon, envoyée, en cours, terminée)


## Système de Gestion de Projet avec Coffre-fort RGPD
- [x] Créer table projectRequirements (cahier des charges)
- [x] Créer table projectCredentials (coffre-fort par projet)
- [x] Catégories credentials (hébergement, API, SMTP, domaine, CMS, autre)
- [x] Chiffrement AES-256 des credentials côté serveur
- [x] Logs d'accès pour traçabilité CNIL/ANSSI
- [x] Interface admin : vue coffre-fort par projet (backend)
- [x] Interface admin : ajout/modification/suppression credentials (backend)
- [x] Interface admin : déchiffrement à la demande (backend)
- [ ] Interface client : formulaire partage credentials sécurisé
- [ ] Interface client : catégorisation des credential- [x] Interface admin : historique des accèsedentials partagés
- [ ] Template cahier des charges par type de projet
- [ ] Formulaire structuré cahier des charges
- [ ] Versioning et historique modifications cahier des charges
- [ ] Export PDF cahier des charges validé
- [ ] Aucun transit credentials par email (100% interface)
- [ ] Conformité RGPD/CNIL/ANSSI complète


## Implémentation des 3 Fonctionnalités Recommandées

### 1. Interface Admin Coffre-fort
- [ ] Créer page admin Coffre-fort (/vault ou intégré dans projet)
- [ ] Liste des credentials par projet avec catégories
- [ ] Bouton "Voir" avec déchiffrement à la demande
- [ ] Formulaire ajout/modification credential
- [ ] Suppression avec confirmation
- [ ] Historique des accès (logs)
- [ ] Filtres par catégorie et projet
- [ ] Indicateur d'expiration des credentials

### 2. Interface Client Partage Credentials
- [ ] Section "Coffre-fort" dans dashboard client
- [ ] Formulaire partage credentials par catégorie
- [ ] Champs dynamiques selon catégorie sélectionnée
- [ ] Validation et chiffrement côté serveur
- [ ] Liste des credentials partagés (masqués)
- [ ] Possibilité de modifier/supprimer
- [ ] Notification au coach lors du partage

### 3. Système Cahier des Charges
- [ ] Créer page admin Cahier des Charges
- [ ] Templates par type de projet (site web, app, coaching IA, optimisation)
- [ ] Formulaire structuré avec sections
- [ ] Versioning automatique
- [ ] Statuts (brouillon, en revue, approuvé, archivé)
- [ ] Export PDF du cahier des charges
- [ ] Liaison avec projets
- [ ] Historique des modifications


## Interface Client Partage Credentials (EN COURS)
- [x] Créer composant ClientCredentialsManager dans l'espace client
- [x] Formulaire ajout credentials avec catégories
- [x] Liste des credentials partagés du client
- [x] Modification/suppression credentials
- [ ] Notification email au coach à chaque ajout
- [x] Intégrer dans ClientDashboard


## Système Cahier des Charges (TERMINÉ)
- [x] Créer templates de cahier des charges par type (site web, app, coaching IA)
- [x] Page admin Requirements avec formulaire structuré
- [x] Versioning automatique des modifications
- [ ] Export PDF du cahier des charges validé
- [x] Intégrer dans la sidebar navigation

## Génération Documents PDF (TERMINÉ)
- [x] Formulaire création devis avec lignes de facturation
- [x] Formulaire création factures avec lignes
- [x] Calculs automatiques HT/TVA/TTC en temps réel
- [x] Numérotation automatique (DEV-2025-001, FACT-2025-001)
- [x] Génération PDF avec logo orange et infos entreprise
- [x] Téléchargement PDF depuis admin
- [ ] Téléchargement PDF depuis client dashboard
- [ ] Conversion devis → facture

## Système Invitation Client (TERMINÉ)
- [x] Bouton "Inviter" dans page admin Clients
- [x] Génération token d'invitation sécurisé
- [x] Envoi notification d'invitation avec lien
- [x] Page acceptation invitation (/client/invitation/:token)
- [x] Création compte client avec mot de passe
- [x] Liaison automatique client → clientUser


## Nouvelles Fonctionnalités (demande utilisateur)
- [x] Export PDF des cahiers des charges avec mise en page professionnelle
- [x] Accès client aux documents (liste devis/factures dans dashboard client)
- [x] Téléchargement PDF depuis le dashboard client
- [x] Bouton "Convertir en facture" sur les devis acceptés
- [x] Copie automatique des lignes devis → facture
- [ ] Tests complets des 3 nouvelles fonctionnalités

## Nouvelles Fonctionnalités - Phase 2 (demande utilisateur)
- [x] Notifications email automatiques lors création devis/factures
- [x] Envoi notification au propriétaire avec infos document
- [x] Lien direct vers espace client dans les notifications
- [x] Notification lors conversion devis→facture
- [x] Tableau de bord analytique avec graphiques (Chart.js)
- [x] Graphique évolution chiffre d'affaires (6 derniers mois)
- [x] Graphique répartition clients par catégorie
- [x] Graphique taux conversion devis→factures
- [x] Intégration Stripe pour paiements en ligne
- [x] Configuration Stripe avec webdev_add_feature
- [x] Bouton "Payer" sur les factures dans espace client
- [ ] Webhook Stripe pour mise à jour automatique statuts
- [x] Composant ClientPayments avec liste factures et paiement

## Nouvelles Fonctionnalités - Phase 3 (demande utilisateur)
- [x] Webhook Stripe endpoint /api/stripe/webhook
- [x] Vérification signature webhook Stripe
- [x] Gestion événement checkout.session.completed
- [x] Mise à jour automatique statut facture → "paid"
- [x] Enregistrement date paiement (paidAt)
- [x] Enregistrement payment_intent_id
- [x] Système de messagerie interne
- [x] Schéma base de données pour messages
- [x] Router tRPC pour messages (list, send, markAsRead)
- [x] Composant chat temps réel avec historique
- [x] Interface messagerie dans page Messages
- [x] Rafraîchissement automatique toutes les 5 secondes
- [x] Calendrier interactif
- [x] Composant calendrier avec vue mensuelle/hebdomadaire (react-big-calendar)
- [x] Création/édition/suppression événements
- [x] Liaison événements avec clients/projets/tâches
- [x] Sélection couleur personnalisée par événement
- [x] Types d'événements (réunion, appel, échéance, rappel, événement, autre)
- [x] Vue détaillée événement avec formulaire complet

## Corrections Bugs
- [x] Corriger l'erreur React Hooks dans Requirements (utilisation conditionnelle de hooks dans map)

## CRUD Complet - Gestion Clients et Projets
- [x] CRUD clients : édition fiche client (existe déjà)
- [x] CRUD clients : suppression client (existe déjà)
- [x] Upload avatar photo clients avec S3 (backend prêt)
- [ ] Affichage avatar dans fiches clients (frontend à intégrer)
- [x] Upload logo projets avec S3 (backend prêt)
- [ ] Affichage logo dans fiches projets (frontend à intégrer)
- [ ] Page détail projet : vue complète avec onglets
- [ ] Onglet cahier des charges : affichage et édition
- [ ] Onglet variables d'environnement : CRUD complet (ajout/édition/suppression)
- [ ] Onglet notes projet : CRUD notes avec éditeur riche
- [ ] Onglet tâches projet : liste et gestion des tâches liées
- [ ] Onglet productions : liste documents/livrables du projet

## Gestion Profil Admin
- [x] Page profil admin avec photo et informations
- [x] Upload photo profil admin avec S3
- [ ] Édition informations profil (nom, email, téléphone) - TODO mutation backend
- [x] Lien "Mon Profil" dans dropdown menu sidebar

## Backend Admin
- [ ] Page backend admin pour gestion plateforme
- [ ] Statistiques globales (utilisateurs, projets, CA)
- [ ] Logs d'activité et audit trail
- [ ] Gestion paramètres système

## UX Amélioration
- [x] Déplacer widget profil (avatar, nom, email, dropdown) de sidebar vers header haut droite
- [x] Afficher photo de profil si avatarUrl existe, sinon initiales
- [x] Dropdown menu avec "Mon Profil" et "Sign out"

## Nouvelles Fonctionnalités - Phase 4
- [x] Afficher avatars clients dans les cards de la page Clients
- [x] Afficher logos projets dans les cards de la page Projets
- [x] Fallback sur initiales/icône si pas d'image
- [x] Page détail projet /projects/:id avec onglets
- [x] Onglet Vue d'ensemble (infos projet, client, statut, dates)
- [ ] Onglet Cahier des charges (affichage et édition) - TODO implémentation
- [ ] Onglet Variables d'environnement (CRUD complet) - TODO implémentation
- [ ] Onglet Notes (CRUD notes avec éditeur) - TODO implémentation
- [ ] Onglet Tâches (liste tâches liées au projet) - TODO implémentation
- [ ] Onglet Documents (liste devis/factures du projet) - TODO implémentation
- [x] Mutation auth.updateProfile dans backend
- [x] Validation Zod pour updateProfile
- [x] Mise à jour session après modification profil (invalidate)

## Onglet Cahier des Charges - Page Détail Projet
- [x] Afficher la liste des requirements liés au projet
- [x] Bouton "Créer un cahier des charges" si aucun requirement
- [x] Formulaire de création requirement avec tous les champs
- [x] Affichage détaillé du requirement sélectionné
- [x] Bouton "Modifier" pour éditer le requirement
- [x] Versioning automatique lors des modifications (backend existant)
- [x] Export PDF du cahier des charges depuis la page détail projet

## Onglets Manquants - Page Détail Projet
### Variables d'environnement
- [x] Créer table projectVariables dans le schéma
- [x] Router tRPC pour CRUD variables (list, create, update, delete)
- [x] Interface onglet avec liste des variables
- [x] Formulaire ajout/édition variable (nom, valeur, type, description)
- [x] Champs masqués par défaut avec bouton "Afficher"
- [x] Types de variables (hébergement, SMTP, API, FTP, autre)
- [x] Avertissement RGPD et sécurité

### Notes projet
- [ ] Créer table projectNotes dans le schéma
- [ ] Router tRPC pour CRUD notes (list, create, update, delete)
- [ ] Interface onglet avec liste des notes
- [ ] Éditeur de texte riche (Textarea avec markdown)
- [ ] Tags/catégories pour les notes
- [ ] Épinglage des notes importantes
- [ ] Recherche dans les notes

### Tâches et Documents
- [ ] Onglet Tâches : afficher les tâches liées au projet
- [ ] Filtres par statut (todo, in_progress, done)
- [ ] Onglet Documents : afficher les devis/factures du projet
- [ ] Filtres par type (devis, facture) et statut

## Nouvelles Fonctionnalités - Phase 5
- [x] Intégrer ImageUpload dans le dialog de création client
- [x] Intégrer ImageUpload dans le dialog d'édition client
- [x] Intégrer ImageUpload dans le dialog de création projet
- [x] Intégrer ImageUpload dans le dialog d'édition projet
- [x] Recherche globale dans le header avec Command palette
- [x] Recherche clients, projets, tâches, documents par nom/numéro
- [x] Navigation directe vers les résultats de recherche
- [x] Raccourci clavier Cmd/Ctrl+K pour ouvrir
- [x] Système de notifications en temps réel
- [x] Icône cloche dans le header avec badge compteur
- [x] Table notifications dans la base de données
- [x] Router tRPC pour CRUD notifications
- [x] Composant NotificationsBell avec popover
- [x] Rafraîchissement automatique toutes les 30 secondes
- [x] Marquer comme lu / Supprimer notifications
- [ ] Dropdown menu notifications avec liste et actions

## Templates de Documents Personnalisables
- [x] Créer table documentTemplates dans le schéma
- [x] Router tRPC pour CRUD templates (getDefault, create, update)
- [x] Page Paramètres avec onglets (Entreprise, Templates)
- [x] Formulaire personnalisation template (logo, couleurs, mentions légales, CGV)
- [x] Upload logo entreprise pour les documents
- [x] Sélecteur de couleurs pour le thème des documents
- [x] Prévisualisation en temps réel du rendu PDF
- [ ] Intégrer les templates dans pdfGenerator.ts (TODO)
- [x] Bouton "Réinitialiser aux valeurs par défaut"

## Page Aujourd'hui - Gestion Journée
- [x] Modifier table timeEntries (ajout userId, title, date, period, type, status)
- [ ] Router tRPC pour CRUD timeEntries
- [ ] Page Aujourd'hui avec 3 sections (Matinée 8h-12h, Après-midi 12h-18h, Soirée 18h-22h)
- [ ] Drag & drop tâches entre périodes
- [ ] Distinction tâches non facturables vs productions facturables
- [ ] Chronomètre pour tracker le temps en temps réel
- [ ] Fiche honoraire par client/projet avec cumul heures
- [ ] Génération facture de temps basée sur heures trackées
- [ ] Taux horaire configurable par client
- [ ] Export PDF fiche honoraire
- [ ] Statistiques temps passé (jour, semaine, mois)
- [ ] Intégration avec calendrier existant

## Page "Aujourd'hui" - Suivi du temps quotidien (EN COURS)
- [x] Créer schéma timeEntries dans la base de données
- [x] Router tRPC timeEntries avec CRUD complet
- [x] Procédures startTimer et stopTimer pour chronomètre
- [x] Procédure statsByClient pour statistiques
- [x] Créer page Today avec 3 périodes (Matinée, Après-midi, Soirée)
- [x] Cartes statistiques du jour (temps total, facturable, non facturable, taux)
- [x] Formulaire création entrée temps avec client/projet
- [x] Distinction facturable/non facturable
- [x] Chronomètre démarrer/arrêter par entrée
- [x] Édition et suppression entrées
- [x] Ajouter route /today dans App.tsx
- [x] Ajouter menu "Aujourd'hui" dans la sidebar
- [ ] Corriger problème insertion Drizzle ORM (tests échouent)
- [ ] Génération facture de temps basée sur heures trackées
- [ ] Export fiche honoraire PDF par client/projet
- [ ] Statistiques hebdomadaires et mensuelles

## URGENT - Corrections Layout et Espace Client
- [x] Corriger la page Today pour utiliser DashboardLayout
- [x] Vérifier que TOUTES les pages admin utilisent DashboardLayout
- [x] Vérifier que TOUTES les sous-pages utilisent DashboardLayout
- [ ] Documenter l'URL de connexion client
- [ ] Documenter le processus de création de comptes clients
- [ ] Créer documentation complète espace client

## Améliorations Page Aujourd'hui (TERMINÉ)
- [x] Installer et configurer @hello-pangea/dnd pour drag & drop
- [x] Implémenter drag & drop des cartes entre périodes
- [x] Ajouter champ priority (1-5) dans schéma timeEntries
- [x] Système de réorganisation par priorité (flèches haut/bas)
- [x] Bouton checkmark pour marquer tâche terminée
- [x] Archivage automatique des tâches terminées (status = 'archived')
- [x] Section "Tâches en retard" en haut de page
- [x] Affichage des tâches en retard depuis la table tasks
- [x] Migration base de données pour nouveau champ priority
- [x] Tri automatique des entrées par priorité

## Corrections Base de Données
- [x] Créer table projectCredentials manquante
- [x] Créer table credentialAccessLogs manquante
- [x] Corriger erreur page Settings

## Génération de Factures de Temps (TERMINÉ)
- [x] Créer router tRPC generateTimeInvoice
- [x] Implémenter logique de calcul des heures par période
- [x] Générer PDF avec détail des heures (pdf-lib)
- [x] Ajouter bouton "Générer facture" dans page Aujourd'hui
- [x] Composant TimeInvoiceGenerator avec aperçu
- [x] Filtres par client et projet
- [x] Téléchargement automatique du PDF
