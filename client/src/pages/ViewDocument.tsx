import { useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Loader2, AlertTriangle, Calendar, Euro, User } from "lucide-react";

export default function ViewDocument() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data, isLoading, error } = trpc.documentTracking.getDocumentByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const recordViewMutation = trpc.documentTracking.recordView.useMutation();

  useEffect(() => {
    if (token && data) {
      recordViewMutation.mutate({
        token,
        userAgent: navigator.userAgent,
      });
    }
  }, [token, data?.document?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data || !data.document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Document introuvable</h2>
            <p className="text-muted-foreground">
              Ce lien est invalide ou le document n'existe plus.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doc = data.document;
  const client = data.client;
  const docType = doc.type === "quote" ? "Devis" : doc.type === "invoice" ? "Facture" : "Avoir";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary rounded-sm flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-xl">G</span>
          </div>
          <h1 className="text-2xl font-bold">Coach Digital</h1>
          <p className="text-muted-foreground">Consultation de document</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {docType} {doc.number}
              </CardTitle>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                doc.status === "paid" ? "bg-green-500/20 text-green-500" :
                doc.status === "accepted" ? "bg-blue-500/20 text-blue-500" :
                doc.status === "sent" ? "bg-yellow-500/20 text-yellow-500" :
                doc.status === "rejected" ? "bg-red-500/20 text-red-500" :
                "bg-muted text-muted-foreground"
              }`}>
                {doc.status === "paid" ? "Payé" :
                 doc.status === "accepted" ? "Accepté" :
                 doc.status === "sent" ? "Envoyé" :
                 doc.status === "rejected" ? "Refusé" :
                 doc.status === "draft" ? "Brouillon" : doc.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">
                      {client ? `${client.firstName} ${client.lastName}` : "-"}
                    </p>
                    {client?.company && (
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(doc.date).toLocaleDateString("fr-FR")}
                    </p>
                    {doc.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Échéance: {new Date(doc.dueDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <div className="space-y-1">
                      <p className="text-sm">HT: {doc.totalHt} €</p>
                      <p className="text-sm">TVA: {doc.totalTva} €</p>
                      <p className="text-lg font-bold text-primary">TTC: {doc.totalTtc} €</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {doc.subject && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Objet</p>
                <p>{doc.subject}</p>
              </div>
            )}

            {doc.introduction && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Introduction</p>
                <p className="text-sm">{doc.introduction}</p>
              </div>
            )}

            {doc.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{doc.notes}</p>
              </div>
            )}

            {doc.pdfUrl && (
              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le PDF
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Document généré par Coach Digital - coachdigitalparis@gmail.com
        </p>
      </div>
    </div>
  );
}
