import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { DocumentForm } from "@/components/DocumentForm";
import { downloadDocumentPDF } from "@/lib/pdfGenerator";
import { FileText, Download, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Documents() {
  const { data: documents, isLoading } = trpc.documents.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: companyData } = trpc.company.get.useQuery();
  const [showForm, setShowForm] = useState(false);

  const getClient = (clientId: number) => {
    return clients?.find((c) => c.id === clientId);
  };

  const handleDownloadPDF = async (docId: number) => {
    const doc = documents?.find((d) => d.id === docId);
    if (!doc || !companyData) {
      toast.error("Impossible de générer le PDF");
      return;
    }

    const client = getClient(doc.clientId);
    if (!client) {
      toast.error("Client introuvable");
      return;
    }

    // Récupérer les lignes du document
    const docDetails = await trpc.documents.get.useQuery({ id: docId });
    
    // Préparer les données pour le PDF
    const pdfData = {
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
        name: `${client.firstName} ${client.lastName}`,
        email: client.email || null,
        phone: client.phone || null,
        address: client.address || null,
        city: client.city || null,
        postalCode: client.postalCode || null,
        country: client.country || null,
        company: client.company || null,
      },
      lines: docDetails.data?.lines?.map((line) => ({
        description: line.description,
        quantity: parseFloat(line.quantity || "0"),
        unitPrice: parseFloat(line.unitPriceHt || "0"),
        vatRate: parseFloat(line.tvaRate || "0"),
      })) || [],
      notes: doc.notes || undefined,
      legalMentions: companyData.legalMentions || undefined,
    };

    downloadDocumentPDF(pdfData);
    toast.success("PDF téléchargé avec succès");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      accepted: "default",
      rejected: "destructive",
      paid: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyé",
      accepted: "Accepté",
      rejected: "Refusé",
      paid: "Payé",
      cancelled: "Annulé",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      quote: "Devis",
      invoice: "Facture",
      credit_note: "Avoir",
    };

    return (
      <Badge variant="outline" className="font-normal">
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Devis et factures</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Document
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : documents && documents.length > 0 ? (
          <div className="grid gap-4">
            {documents.map((doc) => {
              const client = getClient(doc.clientId);
              return (
                <Card key={doc.id} className="bg-card/50 border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-xl font-bold">{doc.number}</span>
                          {getTypeBadge(doc.type)}
                          {getStatusBadge(doc.status)}
                        </div>
                        {doc.subject && (
                          <p className="text-sm text-muted-foreground">{doc.subject}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(doc.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">Client</div>
                        <div className="font-medium">
                          {client
                            ? `${client.firstName} ${client.lastName}`
                            : "Client inconnu"}
                        </div>
                        {client?.company && (
                          <div className="text-xs text-muted-foreground">{client.company}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Date</div>
                        <div className="font-medium">
                          {new Date(doc.date).toLocaleDateString("fr-FR")}
                        </div>
                        {doc.dueDate && (
                          <div className="text-xs text-muted-foreground">
                            Échéance: {new Date(doc.dueDate).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Total HT</div>
                        <div className="font-medium">{parseFloat(doc.totalHt).toFixed(2)} €</div>
                        <div className="text-xs text-muted-foreground">
                          TVA: {parseFloat(doc.totalTva).toFixed(2)} €
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Total TTC</div>
                        <div className="font-bold text-lg text-primary">
                          {parseFloat(doc.totalTtc).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Aucun document pour le moment</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog formulaire */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
          </DialogHeader>
          <DocumentForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
