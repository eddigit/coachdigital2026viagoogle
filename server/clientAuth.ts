import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { ClientUser } from "./schema";
import { db } from "./firestore";

/**
 * Authentification pour l'espace client séparé
 * Système login/password indépendant de l'OAuth Manus
 */

// Helper to get next numeric ID
async function getNextId(collection: string): Promise<number> {
  const counterRef = db.collection('_counters').doc(collection);
  try {
    const res = await db.runTransaction(async (t) => {
      const doc = await t.get(counterRef);
      const newId = (doc.exists ? doc.data()!.count : 0) + 1;
      t.set(counterRef, { count: newId });
      return newId;
    });
    return res;
  } catch (error) {
    console.error(`Failed to generate ID for ${collection}:`, error);
    throw error;
  }
}

const mapDoc = <T>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
  return { id: Number(doc.id), ...data } as unknown as T;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createClientUser(data: {
  clientId: number;
  email: string;
  password: string;
}): Promise<{ success: boolean; userId?: number; error?: string }> {
  try {
    // Vérifier si l'email existe déjà
    const snapshot = await db.collection('clientUsers').where('email', '==', data.email).limit(1).get();

    if (!snapshot.empty) {
      return { success: false, error: "Email already exists" };
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(data.password);

    // Créer l'utilisateur client
    const newId = await getNextId('clientUsers');
    await db.collection('clientUsers').doc(String(newId)).set({
      id: newId,
      clientId: data.clientId,
      email: data.email,
      passwordHash,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, userId: newId };
  } catch (error) {
    console.error("[ClientAuth] Error creating client user:", error);
    return { success: false, error: "Failed to create client user" };
  }
}

export async function authenticateClientUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Trouver l'utilisateur par email
    const snapshot = await db.collection('clientUsers').where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: "Invalid credentials" };
    }

    const user = mapDoc<ClientUser>(snapshot.docs[0]);

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return { success: false, error: "Account is inactive" };
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Mettre à jour la date de dernière connexion
    await db.collection('clientUsers').doc(String(user.id)).update({
      lastLogin: new Date()
    });

    return {
      success: true,
      user: {
        id: user.id,
        clientId: user.clientId,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("[ClientAuth] Error authenticating client user:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function generateInvitationToken(clientId: number, email: string): Promise<string> {
  const token = nanoid(32);

  // Créer ou mettre à jour l'utilisateur client avec le token d'invitation
  const snapshot = await db.collection('clientUsers').where('email', '==', email).limit(1).get();

  if (!snapshot.empty) {
    // Mettre à jour le token
    const doc = snapshot.docs[0];
    await doc.ref.update({
      invitationToken: token,
      invitationSentAt: new Date(),
      updatedAt: new Date()
    });
  } else {
    // Créer un nouvel utilisateur avec token (sans mot de passe encore)
    const newId = await getNextId('clientUsers');
    await db.collection('clientUsers').doc(String(newId)).set({
      id: newId,
      clientId,
      email,
      passwordHash: "", // Sera défini lors de l'acceptation de l'invitation
      invitationToken: token,
      invitationSentAt: new Date(),
      isActive: false, // Inactif jusqu'à l'acceptation
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return token;
}

export async function acceptInvitation(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Trouver l'utilisateur par token
    const snapshot = await db.collection('clientUsers').where('invitationToken', '==', token).limit(1).get();

    if (snapshot.empty) {
      return { success: false, error: "Invalid invitation token" };
    }

    const userDoc = snapshot.docs[0];
    const user = mapDoc<ClientUser>(userDoc);

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(password);

    // Activer le compte et définir le mot de passe
    await userDoc.ref.update({
      passwordHash,
      isActive: true,
      invitationToken: null,
      invitationSentAt: null,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error("[ClientAuth] Error accepting invitation:", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}
