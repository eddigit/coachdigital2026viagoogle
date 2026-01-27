import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClientDocumentsProps {
  clientUserId: number;
}

export default function ClientDocuments({ clientUserId }: ClientDocumentsProps) {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  const { data: documents, isLoading } = trpc.documents.listByClientUser.useQuery({
    clientUserId,
  });

  const { data: companyData } = trpc.company.get.useQuery();
  const utils = trpc.useUtils();

  const handleDownloadPDF = async (doc: any) => {
    if (!companyData) {
      toast.error("Informations entreprise manquantes");
      return;
    }

    try {
      // Récupérer les détails du document avec les lignes via fetch
      const docDetails = await utils.documents.get.fetch({ id: doc.id });
      
      if (!docDetails) {
        toast.error("Document introuvable");
        return;
      }

      // Importer dynamiquement le générateur PDF
      const { downloadDocumentPDF } = await import("@/lib/pdfGenerator");

      // Récupérer les infos client
      const clientName = doc.clientFirstName && doc.clientLastName
        ? `${doc.clientFirstName} ${doc.clientLastName}`
        : "Client";

      downloadDocumentPDF({
        type: doc.type as "quote" | "invoice",
        number: doc.number,
        date: new Date(doc.date),
        dueDate: doc.dueDate ? new Date(doc.dueDate) : undefined,
        company: {
          name: companyData.name,
          address: companyData.address || null,
          city: companyData.city || null,
          postalCode: companyData.postalCode || null,
          country: companyData.country || null,
          phone: companyData.phone || null,
          email: companyData.email || null,
          siret: companyData.siret || null,
          tvaNumber: companyData.tvaNumber || null,
          iban: companyData.iban || null,
          bic: companyData.bic || null,
        },
        client: {
          name: clientName,
          email: doc.clientEmail || null,
          phone: doc.clientPhone || null,
          address: doc.clientAddress || null,
          city: doc.clientCity || null,
          postalCode: doc.clientPostalCode || null,
          country: doc.clientCountry || null,
          company: doc.clientCompany || null,
        },
        lines: docDetails.lines?.map((line: any) => ({
          description: line.description,
          quantity: parseFloat(line.quantity || "0"),
          unitPrice: parseFloat(line.unitPriceHt || "0"),
          vatRate: parseFloat(line.tvaRate || "0"),
        })) || [],
        notes: doc.notes || undefined,
        legalMentions: companyData.legalMentions || undefined,
      });

      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("Erreur téléchargement PDF:", error);
      toast.error("Erreur lors du téléchargement du PDF");
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quote: "Devis",
      invoice: "Facture",
      credit_note: "Avoir",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "Brouillon" },
      sent: { variant: "secondary", label: "Envoyé" },
      accepted: { variant: "default", label: "Accepté" },
      rejected: { variant: "outline", label: "Refusé" },
      paid: { variant: "default", label: "Payé" },
      cancelled: { variant: "outline", label: "Annulé" },
    };

    const { variant, label } = config[status] || config.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mes Documents</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Aucun document disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Mes Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-background/50 rounded-lg flex items-center justify-between hover:bg-background/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">
                        {getDocumentTypeLabel(doc.type)} {doc.number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {parseFloat(doc.totalTtc || "0").toFixed(2)} €
                    </span>
                    {doc.dueDate && (
                      <span>
                        Échéance: {new Date(doc.dueDate).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPDF(doc)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog visualisation document */}
      {selectedDoc && (
        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {getDocumentTypeLabel(selectedDoc.type)} {selectedDoc.number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedDoc.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <div className="mt-1">{getStatusBadge(selectedDoc.status)}</div>
                </div>
                {selectedDoc.dueDate && (
                  <div>
                    <p className="text-muted-foreground">Échéance</p>
                    <p className="font-medium">
                      {new Date(selectedDoc.dueDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Montant total TTC</p>
                  <p className="font-medium text-lg">
                    {parseFloat(selectedDoc.totalTtc || "0").toFixed(2)} €
                  </p>
                </div>
              </div>

              {selectedDoc.subject && (
                <div>
                  <p className="text-muted-foreground text-sm">Objet</p>
                  <p className="mt-1">{selectedDoc.subject}</p>
                </div>
              )}

              {selectedDoc.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedDoc.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                  Fermer
                </Button>
                <Button onClick={() => handleDownloadPDF(selectedDoc)}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
