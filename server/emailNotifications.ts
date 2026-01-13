import { sendEmail } from "./emailService";

interface DocumentEmailData {
  clientEmail: string;
  clientName: string;
  documentType: "quote" | "invoice";
  documentNumber: string;
  totalTtc: string;
  dueDate?: Date;
  loginUrl: string;
}

/**
 * Envoie une notification au propriétaire lorsqu'un document est créé
 * (en attendant la configuration SMTP pour l'envoi direct aux clients)
 */
export async function notifyDocumentCreated(data: DocumentEmailData): Promise<boolean> {
  const typeLabel = data.documentType === "quote" ? "Devis" : "Facture";
  
  const content = `
📄 **Nouveau ${typeLabel} créé**

**Client:** ${data.clientName}
**Email:** ${data.clientEmail}
**Numéro:** ${data.documentNumber}
**Montant TTC:** ${parseFloat(data.totalTtc).toFixed(2)} €
${data.dueDate ? `**Échéance:** ${data.dueDate.toLocaleDateString("fr-FR")}` : ""}

**Action requise:**
Envoyez le ${typeLabel.toLowerCase()} au client par email avec le PDF en pièce jointe.

**Lien espace client:** ${data.loginUrl}

---
💡 Pour automatiser l'envoi d'emails aux clients, configurez vos credentials SMTP dans le Coffre-fort sécurisé.
  `.trim();

  try {
    const ownerEmail = process.env.SMTP_USER || "coachdigitalparis@gmail.com";
    const success = await sendEmail({
      to: ownerEmail,
      subject: `${typeLabel} ${data.documentNumber} créé pour ${data.clientName}`,
      html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content}</div>`,
      text: content,
    });
    
    return success;
  } catch (error) {
    console.error("Erreur notification document:", error);
    return false;
  }
}

/**
 * Envoie une notification au propriétaire lorsqu'un devis est converti en facture
 */
export async function notifyQuoteConverted(data: {
  clientName: string;
  quoteNumber: string;
  invoiceNumber: string;
  totalTtc: string;
}): Promise<boolean> {
  const content = `
🔄 **Devis converti en facture**

**Client:** ${data.clientName}
**Devis:** ${data.quoteNumber}
**Facture:** ${data.invoiceNumber}
**Montant TTC:** ${parseFloat(data.totalTtc).toFixed(2)} €

La facture a été générée automatiquement avec toutes les lignes du devis.

**Action requise:**
Envoyez la facture au client par email.
  `.trim();

  try {
    const ownerEmail = process.env.SMTP_USER || "coachdigitalparis@gmail.com";
    const success = await sendEmail({
      to: ownerEmail,
      subject: `Devis ${data.quoteNumber} converti en facture ${data.invoiceNumber}`,
      html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content}</div>`,
      text: content,
    });
    
    return success;
  } catch (error) {
    console.error("Erreur notification conversion:", error);
    return false;
  }
}

/**
 * Génère l'URL de l'espace client pour les emails
 */
export function getClientLoginUrl(): string {
  // En production, utiliser l'URL publique du site
  const baseUrl = process.env.VITE_APP_URL || "https://coachdigital.biz";
  return `${baseUrl}/client/login`;
}
