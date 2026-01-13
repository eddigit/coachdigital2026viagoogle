# Documentation Espace Client - Coach Digital

## URL de Connexion Client

**URL principale :** `https://3000-iljfflpwzxo4mihsuvyfo-9aa912fa.us2.manus.computer/client/login`

Une fois le site publié, l'URL sera : `https://[votre-domaine]/client/login`

## Processus de Création de Comptes Clients

### Méthode 1 : Invitation par Email (Recommandée)

1. **Accéder à la page Clients**
   - Connectez-vous à votre espace admin
   - Naviguez vers "Clients" dans la sidebar

2. **Inviter un client**
   - Cliquez sur le bouton "Inviter" à côté du client souhaité
   - Le système génère automatiquement un token d'invitation unique
   - Un email d'invitation est envoyé au client avec un lien sécurisé

3. **Le client accepte l'invitation**
   - Le client clique sur le lien dans l'email
   - Il est redirigé vers `/client/invitation/:token`
   - Il crée son mot de passe
   - Son compte est automatiquement activé et lié à sa fiche client

### Méthode 2 : Création Manuelle (Base de données)

Si vous devez créer un compte manuellement :

```sql
-- 1. Créer un hash de mot de passe (utiliser bcrypt)
-- 2. Insérer dans la table clientUsers
INSERT INTO clientUsers (clientId, email, passwordHash, isActive, createdAt, updatedAt)
VALUES (
  [ID_DU_CLIENT],
  'email@client.com',
  '[HASH_BCRYPT_DU_MOT_DE_PASSE]',
  true,
  NOW(),
  NOW()
);
```

**Note :** Cette méthode n'est pas recommandée car elle nécessite de générer manuellement le hash du mot de passe.

## Fonctionnalités de l'Espace Client

### 1. Dashboard Client
- Vue d'ensemble des projets en cours
- Statistiques personnalisées
- Accès rapide aux documents

### 2. Documents
- Consultation des devis
- Consultation des factures
- Téléchargement PDF
- Paiement en ligne via Stripe (pour les factures)

### 3. Projets
- Liste des projets en cours
- Détails de chaque projet
- Suivi de l'avancement

### 4. Tâches
- Tâches assignées au client
- Statut des tâches
- Échéances

### 5. Demandes
- Formulaire multi-étapes pour créer une nouvelle demande
- Types de demandes :
  * Coaching IA
  * Site web
  * Application métier
  * Optimisation spécifique
- Historique des demandes
- Suivi du statut

### 6. Coffre-fort Sécurisé (RGPD)
- Partage sécurisé de credentials
- Catégories :
  * Hébergement
  * API
  * SMTP
  * Domaine
  * CMS
  * Autre
- Chiffrement AES-256
- Logs d'accès pour traçabilité CNIL/ANSSI

### 7. Messagerie
- Chat en temps réel avec le coach
- Historique des conversations
- Notifications

## Sécurité

### Authentification
- Système de login/password séparé de l'espace admin
- Tokens d'invitation uniques et sécurisés
- Expiration des tokens après utilisation
- Hachage bcrypt des mots de passe

### Réinitialisation de Mot de Passe
Le système supporte la réinitialisation de mot de passe via :
- Token de réinitialisation stocké dans `passwordResetToken`
- Expiration du token dans `passwordResetExpires`

### RGPD
- Chiffrement des données sensibles (credentials)
- Logs d'accès pour traçabilité
- Conformité CNIL/ANSSI

## Structure de la Base de Données

### Table `clientUsers`
```sql
CREATE TABLE clientUsers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,                    -- Lié à la table clients
  email VARCHAR(320) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  isActive BOOLEAN DEFAULT true NOT NULL,
  lastLogin TIMESTAMP NULL,
  invitationToken VARCHAR(64) NULL,
  invitationSentAt TIMESTAMP NULL,
  passwordResetToken VARCHAR(64) NULL,
  passwordResetExpires TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

### Relation avec la table `clients`
- Un client (table `clients`) peut avoir un compte utilisateur (table `clientUsers`)
- Le lien se fait via `clientUsers.clientId = clients.id`
- Un client ne peut avoir qu'un seul compte utilisateur

## Routes Espace Client

| Route | Description |
|-------|-------------|
| `/client` | Redirection vers `/client/login` |
| `/client/login` | Page de connexion client |
| `/client/dashboard` | Dashboard principal du client |
| `/client/invitation/:token` | Page d'acceptation d'invitation |

## Notifications Email

### Email d'Invitation
Envoyé automatiquement lors de l'invitation d'un client :
- Sujet : "Invitation à rejoindre Coach Digital"
- Contenu : Lien d'invitation sécurisé
- Expéditeur : coachdigitalparis@gmail.com

### Email de Notification (Documents)
Envoyé automatiquement lors de la création de devis/factures :
- Notification au propriétaire
- Lien direct vers l'espace client
- Détails du document

## Gestion des Clients

### Workflow Complet

1. **Création d'un client dans l'admin**
   - Remplir les informations du client
   - Sauvegarder la fiche

2. **Invitation du client**
   - Cliquer sur "Inviter" dans la liste des clients
   - Email envoyé automatiquement

3. **Acceptation par le client**
   - Le client reçoit l'email
   - Il clique sur le lien
   - Il crée son mot de passe
   - Son compte est activé

4. **Connexion du client**
   - Le client se connecte sur `/client/login`
   - Il accède à son espace personnel
   - Il peut consulter ses documents, projets, tâches, etc.

## Support Technique

Pour toute question ou problème :
- Email : coachdigitalparis@gmail.com
- L'espace admin permet de voir tous les clients et leur statut de compte

## Logs et Traçabilité

Le système enregistre :
- Date de dernière connexion (`lastLogin`)
- Date d'envoi de l'invitation (`invitationSentAt`)
- Accès aux credentials (table `credentialAccessLogs`)
- Historique des messages (table `messages`)

## Bonnes Pratiques

1. **Toujours utiliser le système d'invitation** plutôt que de créer manuellement les comptes
2. **Vérifier l'email du client** avant d'envoyer l'invitation
3. **Informer le client** qu'il va recevoir un email d'invitation
4. **Vérifier le statut** `isActive` avant de résoudre des problèmes de connexion
5. **Ne jamais partager de credentials par email** - utiliser le coffre-fort sécurisé

## Développement Futur

Fonctionnalités prévues :
- Réinitialisation de mot de passe par email
- Authentification à deux facteurs (2FA)
- Notifications push
- Application mobile
- Export de données RGPD
