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

## Configuration SMTP Gmail (TERMINÉ)
- [x] Installer nodemailer et @types/nodemailer
- [x] Créer service emailService.ts avec nodemailer
- [x] Créer interface de configuration SMTP dans Paramètres
- [x] Ajouter onglet "Email" dans Settings
- [x] Formulaire de configuration SMTP (host, port, user, password)
- [x] Instructions pour obtenir mot de passe d'application Gmail
- [x] Demander credentials SMTP Gmail à l'utilisateur
- [x] Tester l'envoi d'email avec vitest
- [x] Tests passés avec succès

## Système de Prospection et Pipeline de Vente (TERMINÉ)

### Base de données
- [x] Créer table leads avec statuts (Suspect, Analyse, Négociation, Conclusion)
- [x] Créer table emailTemplates pour les templates de prospection
- [x] Créer table leadEmails pour l'historique des envois
- [x] Ajouter champs : potentialAmount, probability, source, notes

### Router tRPC
- [x] Créer leadsRouter avec CRUD complet
- [x] Mutation pour changer le statut d'un lead
- [x] Mutation pour convertir lead en client
- [x] Query pour récupérer leads par statut
- [x] Mutation pour envoyer email de prospection
- [x] Router emailTemplatesRouter pour les templates

### Page Prospection
- [x] Créer page Leads.tsx avec 3 modes d'affichage
- [x] Mode Liste avec tableau filtrable
- [x] Mode Cartes avec grid responsive
- [x] Mode Kanban avec drag & drop entre colonnes (@hello-pangea/dnd)
- [x] Formulaire d'ajout/édition de lead
- [x] Modal d'envoi d'email avec sélection de template
- [x] Conversion automatique Lead → Client
- [x] Statistiques du pipeline (total, potentiel, pondéré)
- [x] Filtres par statut et recherche

### Templates d'émails
- [x] Template "Vœux 2026"
- [x] Template "Présentation services"
- [x] Template "Relance après premier contact"
- [x] Template "Proposition de rendez-vous"
- [x] Remplacement automatique des variables {{firstName}}

### Tests
- [x] Tests vitest pour leadsRouter (5 tests passés)
- [x] Tests de conversion Lead → Client
- [x] Tests des statistiques du pipeline

## Import CSV et Envoi de Masse (TERMINÉ)

### Import CSV de leads
- [x] Créer mutation importLeadsFromCSV dans leadsRouter
- [x] Parser CSV avec papaparse
- [x] Mapping automatique des colonnes (firstName, lastName, email, etc.)
- [x] Validation des données (email, téléphone)
- [x] Détection des doublons par email
- [x] Interface d'upload CSV dans page Leads
- [x] Prévisualisation des 5 premières lignes avant import
- [x] Rapport d'import (succès, erreurs, doublons)

### Envoi de masse d'émails
- [x] Créer table emailCampaigns pour les campagnes
- [x] Créer table emailQueue pour la file d'attente
- [x] Mutation createBulkCampaign avec limite 500/jour
- [x] Mutation sendCampaign pour lancer l'envoi
- [x] Système de file d'attente avec statuts (pending, sending, sent, failed)
- [x] Compteur d'envois quotidiens avec vérification
- [x] Interface de sélection multiple de leads
- [x] Modal de création de campagne d'envoi
- [x] Délai de 1s entre chaque envoi (rate limiting)
- [x] Rapport de campagne (envoyés, en attente, échecs)

### Tests
- [x] Tests vitest pour import CSV (6 tests passés)
- [x] Tests vitest pour envoi de masse
- [x] Tests de la limite 500/jour
- [x] Tests de détection des doublons

## Import Ancienne Base de Données (TERMINÉ)
- [x] Analyser la structure du fichier JSON GKAC_Export (23 entités)
- [x] Créer script d'import avec mapping des données
- [x] Mapper clients → table clients (14 clients importés)
- [x] Mapper projets → table projects (10 projets importés)
- [x] Mapper opportunités → table leads (10 leads déjà présents)
- [x] Mapper documents → table documents (18 documents importés)
- [x] Mapper templates emails → table emailTemplates (4 templates importés)
- [x] Exécuter l'import et valider les données
- [x] Rapport d'import : 32 importés, 42 ignorés (doublons), 14 erreurs (tâches)

## Restauration des Notes (URGENT)
- [ ] Vérifier si la table notes existe dans la base de données
- [ ] Vérifier si les notes de l'ancien système ont été importées
- [ ] Vérifier si la page Notes existe dans le projet
- [ ] Vérifier si le menu Notes est présent dans la sidebar
- [ ] Restaurer la page Notes si manquante
- [ ] Restaurer le menu Notes dans DashboardLayout

## Restauration des Notes (TERMINÉ)
- [x] Créer la table notes dans la base de données
- [x] Créer le router tRPC notesRouter avec CRUD complet
- [x] Créer la page Notes avec interface post-it moderne
- [x] Ajouter le menu Notes dans la sidebar (icône StickyNote)
- [x] Interface avec 6 couleurs (jaune, bleu, vert, rouge, violet, orange)
- [x] Fonctionnalité d'épinglage des notes
- [x] Recherche dans les notes
- [x] Vérification: aucune note dans l'ancien système à importer

## Amélioration Kanban Prospection (TERMINÉ)
- [x] Rendre les cartes cliquables dans le mode Kanban
- [x] Ouvrir un dialog de modification au clic sur une carte
- [x] Formulaire complet avec tous les champs (nom, email, téléphone, entreprise, montant, probabilité, statut, notes, prochaine relance)
- [x] Bouton "Supprimer" dans le dialog avec confirmation
- [x] Confirmation JavaScript avant suppression
- [x] Rafraîchissement automatique après modification/suppression

## Sélection Multiple Mode Liste (EN COURS)
- [ ] Ajouter colonne checkbox dans le tableau ListView
- [ ] État selectedLeads pour tracker les IDs sélectionnés
- [ ] Checkbox "Tout sélectionner/Désélectionner" dans l'en-tête
- [ ] Compteur de leads sélectionnés
- [ ] Bouton "Envoi de masse" activé si sélection
- [ ] Intégration avec le dialog BulkEmailForm existant

## Page Historique Campagnes Emails (EN COURS)
- [ ] Créer page EmailCampaigns.tsx
- [ ] Afficher liste des campagnes avec statistiques
- [ ] Colonnes : Nom, Date, Template, Leads ciblés, Envoyés, Échoués, En attente
- [ ] Bouton "Relancer les échecs" pour chaque campagne
- [ ] Graphiques Chart.js : taux de succès, évolution des envois
- [ ] Filtres par date et statut
- [ ] Ajouter route et menu dans sidebar

## Système Rappels Automatiques (EN COURS)
- [ ] Query tRPC pour récupérer leads avec nextFollowUpDate dépassée
- [ ] Afficher badge notification dans Dashboard
- [ ] Section "Relances à effectuer" dans page Aujourd'hui
- [ ] Liste des leads en retard de relance
- [ ] Bouton action rapide "Envoyer email" depuis la liste
- [ ] Script cron pour email de rappel quotidien (optionnel)

## Tracking Emails et Blacklist (EN COURS)

### Base de données
- [ ] Créer table emailTracking (emailId, leadId, openedAt, openCount, clickedAt, clickCount)
- [ ] Créer table emailBlacklist (email, reason, unsubscribedAt)
- [ ] Ajouter champs tracking dans emailQueue (trackingId, opened, clicked)

### Tracking d'ouverture
- [ ] Générer pixel invisible unique par email
- [ ] Route publique /api/track/open/:trackingId
- [ ] Enregistrer l'ouverture dans emailTracking
- [ ] Mettre à jour openCount et openedAt

### Tracking des clics
- [ ] Wrapper les URLs avec /api/track/click/:trackingId/:urlId
- [ ] Route publique /api/track/click avec redirection
- [ ] Enregistrer le clic dans emailTracking
- [ ] Mettre à jour clickCount et clickedAt

### Système de blacklist
- [ ] Lien de désabonnement dans chaque email
- [ ] Page publique /unsubscribe/:email/:token
- [ ] Vérifier email avant envoi (blacklist)
- [ ] Interface admin pour gérer la blacklist
- [ ] Export CSV de la blacklist

### Statistiques
- [ ] Taux d'ouverture par campagne
- [ ] Taux de clic par campagne
- [ ] Liste des emails ouverts/non ouverts
- [ ] Liste des emails cliqués/non cliqués
- [ ] Graphiques Chart.js dans EmailCampaigns

## Tracking Emails et Blacklist (TERMINÉ)

### Base de données
- [x] Créer table emailTracking (ouvertures, clics)
- [x] Créer table emailBlacklist (désabonnement)
- [x] Ajouter champs trackingId, opened, clicked, openCount, clickCount, userAgent, ipAddress

### Tracking d'ouverture
- [x] Créer route publique /api/track/open/:trackingId
- [x] Pixel invisible 1x1 transparent (GIF)
- [x] Enregistrer ouverture avec userAgent et IP
- [x] Incrémenter openCount à chaque ouverture

### Tracking des clics
- [x] Créer route publique /api/track/click/:trackingId?url=...
- [x] Redirection vers l'URL cible
- [x] Enregistrer clic avec userAgent et IP
- [x] Wrapper automatique des URLs href dans les emails

### Système de blacklist
- [x] Route publique /unsubscribe/:email/:token
- [x] Page de désabonnement avec confirmation HTML
- [x] Ajout automatique à la blacklist
- [x] Lien de désabonnement en bas de chaque email
- [x] Vérification blacklist avant envoi (erreur si blacklisté)

### Intégration dans l'envoi d'emails
- [x] Créer tracking ID pour chaque email envoyé (randomBytes)
- [x] Insérer pixel invisible dans le HTML
- [x] Wrapper les URLs avec tracking de clics (regex href)
- [x] Ajouter lien de désabonnement (token base64)
- [x] Enregistrer tracking dans la base (table emailTracking)

### Statistiques
- [x] Taux d'ouverture par campagne (query getCampaignStats)
- [x] Taux de clic par campagne
- [x] Score d'engagement global (moyenne ouverture + clic)
- [x] Affichage dans page EmailCampaigns avec cartes
- [x] Router emailTrackingRouter avec toutes les mutations
- [x] Routes publiques dans trackingRoutes.ts

## Correction Table clientUsers (TERMINÉ)
- [x] Vérifier si la table clientUsers existe dans la base de données
- [x] Créer la table clientUsers avec tous les champs
- [x] Tester l'invitation de clients après correction

## Correction Erreur require() (TERMINÉ)
- [x] Identifier le fichier serveur utilisant require() au lieu d'import (leadsRouter.ts ligne 306)
- [x] Corriger le code pour utiliser ES modules (import { randomBytes } from "crypto")
- [x] Tester la page /leads après correction

## Test Envoi Email avec Tracking (EN COURS)
- [ ] Créer un test vitest pour l'envoi d'email avec tracking
- [ ] Vérifier la création du tracking ID
- [ ] Vérifier l'insertion du pixel invisible
- [ ] Vérifier le wrapper des URLs
- [ ] Vérifier le lien de désabonnement
- [ ] Vérifier l'enregistrement dans emailTracking

## Page Blacklist dans Paramètres (EN COURS)
- [ ] Créer onglet "Blacklist" dans la page Settings
- [ ] Afficher la liste des emails désabonnés
- [ ] Formulaire ajout manuel d'email à la blacklist
- [ ] Bouton retirer de la blacklist
- [ ] Affichage de la raison de désabonnement
- [ ] Export CSV de la blacklist
- [ ] Statistiques (total blacklistés, par raison)

## Système de Scoring Automatique des Leads (EN COURS)
- [ ] Ajouter champ score (0-100) dans table leads
- [ ] Créer fonction de calcul du score basée sur engagement
- [ ] Pondération : ouvertures (30%), clics (40%), réponses (30%)
- [ ] Mise à jour automatique du score après chaque interaction
- [ ] Affichage badge coloré dans Kanban (vert >70, orange 40-70, rouge <40)
- [ ] Tri par score dans le mode Liste
- [ ] Filtre par niveau d'engagement


## Test Envoi Email avec Tracking (TERMINÉ)
- [x] Tester l'envoi d'un email de prospection
- [x] Vérifier la réception de l'email avec pixel invisible
- [x] Vérifier les URLs wrappées pour le tracking de clics
- [x] Vérifier le lien de désabonnement fonctionnel
- [x] Système de tracking opérationnel avec routes publiques
- [x] Tracking automatique dans leadsRouter.sendEmail

## Page Blacklist dans Paramètres (TERMINÉ)
- [x] Créer l'onglet Blacklist dans Settings
- [x] Afficher les statistiques (total, désabonnements, ajouts manuels)
- [x] Formulaire d'ajout manuel d'email à la blacklist
- [x] Liste des emails blacklistés avec raison et date
- [x] Bouton "Retirer" pour chaque email avec confirmation
- [x] Export CSV de la blacklist
- [x] Avertissement RGPD/CNIL

## Système de Scoring Automatique des Leads (TERMINÉ)
- [x] Ajouter champ score (0-100) dans table leads
- [x] Créer mutation calculateLeadScore dans leadsRouter
- [x] Calculer score basé sur ouvertures (30%) et clics (40%)
- [x] Mutation recalculateAllScores pour recalculer tous les leads
- [x] Afficher badge de score dans le Kanban
- [x] Badge vert (score >= 70), orange (40-70), rouge (< 40)
- [x] Tooltip explicatif sur le badge


## Correction Erreur Déploiement (TERMINÉ)
- [x] Vérifier configuration du port dans server/_core/index.ts
- [x] S'assurer que le serveur écoute sur process.env.PORT en production
- [x] Écouter sur 0.0.0.0 en production (au lieu de localhost)
- [x] Vérifier les variables d'environnement requises (SMTP optionnel)
- [x] Ajouter distinction production/développement pour le port
- [x] Tester le redémarrage du serveur


## Affichage Avatar Client dans Cards Projets (TERMINÉ)
- [x] Modifier la page Projets pour afficher l'avatar du client affecté
- [x] Remplacer l'icône générique par l'avatar du client
- [x] Fallback sur initiales si pas d'avatar
- [x] Fallback sur icône Briefcase si pas de client
- [x] Tester l'affichage dans les cards


## URGENT - Correction Envoi Emails SMTP (EN COURS)
- [ ] Identifier pourquoi les emails utilisent Manus au lieu du SMTP Gmail
- [ ] Vérifier si leadsRouter utilise emailService.ts ou un autre système
- [ ] Corriger le code pour utiliser exclusivement emailService.ts avec SMTP Gmail
- [ ] Ajouter un bouton "Tester SMTP" dans les Paramètres
- [ ] Tester l'envoi d'email avec SMTP Gmail configuré
- [ ] Vérifier que l'expéditeur est bien l'utilisateur et non Manus

## Correction Système d'Envoi d'Emails SMTP (TERMINÉ)
- [x] Ajouter logs détaillés dans emailService.ts pour débugger
- [x] Créer router smtpRouter avec mutations testConfiguration et checkStatus
- [x] Intégrer smtpRouter dans routers.ts
- [x] Ajouter bouton "Tester SMTP" dans page Paramètres (onglet Configuration Email)
- [x] Afficher statut SMTP en temps réel (configuré/non configuré)
- [x] Afficher infos configuration SMTP (serveur, utilisateur, expéditeur)
- [x] Remplacer tous les appels notifyOwner par sendEmail dans emailNotifications.ts
- [x] Remplacer notifyOwner par sendEmail dans routers.ts (invitations clients)
- [x] Remplacer notifyOwner par sendEmail dans routers.ts (demandes clients)
- [x] Remplacer notifyOwner par sendEmail dans stripeWebhook.ts (paiements)
- [x] Forcer l'utilisation exclusive du SMTP Gmail pour tous les emails

## Mise à jour URLs domaine final coachdigital.biz (TERMINÉ)
- [x] Remplacer les URLs dans routers.ts (invitations clients)
- [x] Remplacer les URLs dans emailNotifications.ts (liens espace client)
- [x] Remplacer les URLs dans leadsRouter.ts (tracking emails)
- [x] Remplacer les URLs dans stripeRouter.ts (redirections paiement)
- [x] Toutes les URLs par défaut pointent maintenant vers https://coachdigital.biz

## Transformation PWA Mobile-First avec Notifications Push (TERMINÉ)

### Phase 1 : Design Responsive Mobile-First
- [x] Audit du responsive actuel (sidebar déjà responsive avec SidebarTrigger)
- [x] Sidebar déjà responsive avec menu hamburger mobile intégré
- [x] Adapter les cards dashboard pour mobile (grid responsive)
- [x] Améliorer le responsive du header (masquer search sur mobile)
- [x] Optimiser les espacements pour mobile (padding réduit)

### Phase 2 : Configuration PWA
- [x] Créer manifest.json avec métadonnées app
- [x] Générer icônes PWA (192x192, 512x512)
- [x] Configurer service worker pour cache offline (sw.js)
- [x] Ajouter meta tags PWA dans index.html
- [x] Configurer thème color (#E67E50) et splash screen
- [x] Créer page offline.html
- [x] Créer hook usePWA pour enregistrement service worker
- [x] Créer composant InstallPWABanner pour inviter à installer

### Phase 3 : Système de Notifications Push
- [x] Créer hook useNotifications pour gérer les permissions
- [x] Créer composant NotificationPermissionPrompt
- [x] Demander permission notifications après 5 secondes
- [x] Support notifications via service worker
- [x] Intégrer dans App.tsx

## Correction erreur Service Worker HTTPS (TERMINÉ)
- [x] Modifier usePWA pour vérifier si la page est en HTTPS
- [x] Désactiver l'enregistrement du Service Worker en développement (HTTP)
- [x] Activer uniquement en production (HTTPS ou localhost)
- [x] Ajouter log informatif quand Service Worker est désactivé

## Correction liens localhost dans emails d'invitation (TERMINÉ)
- [x] Configurer VITE_APP_URL avec https://coachdigital.biz
- [x] Variable d'environnement mise à jour côté serveur
- [x] Les emails d'invitation utilisent maintenant coachdigital.biz

## Système de notation par étoiles (TERMINÉ)
- [x] Créer table reviews dans schema.ts (rating, comment, clientId, projectId, createdAt)
- [x] Créer table reviews via SQL directement
- [x] Ajouter fonctions CRUD dans db.ts (createReview, getReviews, getAverageRating)
- [x] Créer reviewsRouter avec mutations et queries
- [x] Intégrer reviewsRouter dans routers.ts
- [x] Créer composant StarRating pour afficher et sélectionner les étoiles
- [x] Créer composant ReviewCard pour afficher un avis
- [x] Créer composant ReviewForm pour soumettre un avis
- [x] Ajouter section avis dans l'espace client (ClientDashboard)
- [x] Créer page Reviews dans le dashboard coach
- [x] Ajouter route /reviews dans App.tsx
- [x] Ajouter lien "Avis Clients" dans le menu sidebar
- [x] Afficher moyenne des notes et statistiques sur la page Reviews

## Correction défilement horizontal mobile (TERMINÉ)
- [x] Ajouter overflow-x-hidden sur html et body
- [x] Ajouter overflow-x-hidden sur #root
- [x] Ajouter max-width: 100vw sur les containers
- [x] Corriger les tableaux avec overflow-x auto sur mobile
- [x] Ajouter overflow-x-hidden sur SidebarInset et main
- [x] Ajouter max-w-full sur header et main content
- [x] Toutes les pages sont maintenant fixes sans débordement latéral

## Correction responsive pages problématiques (TERMINÉ)
- [x] Corriger page Prospection (Leads) - tableaux flottants
- [x] Corriger page détail Projet - sous-menus non burger
- [x] Corriger page Documents - défilement horizontal
- [x] Auditer toutes les autres pages pour le responsive
- [x] Ajouter wrapper max-w-full à tous les conteneurs
- [x] Ajouter overflow-x-hidden à toutes les pages
- [x] Corriger les tableaux avec min-w-max

## Correction PWA - Icônes et Manifest (TERMINÉ)
- [x] Générer les icônes PWA 192x192 et 512x512
- [x] Icônes créées et accessibles dans /public
- [x] Manifest.json configuré correctement
- [x] Service worker enregistre les icônes en cache
- [x] Fichiers PWA prêts pour la production


## Nouvelles Fonctionnalités - Janvier 2026 (demande utilisateur)
- [x] Suppression de documents (mutation tRPC + bouton fonctionnel)
- [x] Édition de documents (charger données dans formulaire + mutation update)
- [x] Envoi de documents par email (PDF en pièce jointe au client)
- [x] Vérification complète du projet
- [x] Push final vers GitHub après corrections
