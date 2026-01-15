import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PenTool,
  Eye,
  Send,
  Clock,
  Check,
  X,
  RefreshCw,
  Link,
  Copy,
  Bell,
} from "lucide-react";

interface DocumentActionsProps {
  documentId: number;
  documentNumber: string;
  documentType: "quote" | "invoice" | "credit_note";
  clientName: string;
  clientEmail?: string | null;
}

export function DocumentActions({
  documentId,
  documentNumber,
  documentType,
  clientName,
  clientEmail,
}: DocumentActionsProps) {
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signerName, setSignerName] = useState(clientName);
  const [signerEmail, setSignerEmail] = useState(clientEmail || "");
  const [message, setMessage] = useState("");

  const utils = trpc.useUtils();

  const { data: tracking } = trpc.documentTracking.getByDocument.useQuery({ documentId });
  const { data: signatures } = trpc.signatures.getByDocument.useQuery({ documentId });
  const { data: views } = trpc.documentTracking.getViews.useQuery({ documentId });

  const createTrackingMutation = trpc.documentTracking.createTracking.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.viewUrl);
      toast.success("Lien de suivi créé et copié !");
      utils.documentTracking.getByDocument.invalidate({ documentId });
    },
  });

  const sendSignatureRequestMutation = trpc.signatures.sendRequest.useMutation({
    onSuccess: () => {
      toast.success("Demande de signature envoyée !");
      setIsSignatureDialogOpen(false);
      utils.signatures.getByDocument.invalidate({ documentId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const sendReminderMutation = trpc.signatures.sendReminder.useMutation({
    onSuccess: () => {
      toast.success("Rappel envoyé !");
      utils.signatures.getByDocument.invalidate({ documentId });
    },
  });

  const handleCreateTrackingLink = () => {
    createTrackingMutation.mutate({ documentId });
  };

  const handleCopyTrackingLink = () => {
    if (tracking) {
      const url = `${window.location.origin}/view/${tracking.trackingToken}`;
      navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  const handleSendSignatureRequest = () => {
    if (!signerEmail) {
      toast.error("Veuillez saisir un email");
      return;
    }
    sendSignatureRequestMutation.mutate({
      documentId,
      signerName,
      signerEmail,
      message: message || undefined,
    });
  };

  const docTypeLabel = documentType === "quote" ? "devis" : "facture";

  return (
    <div className="flex items-center gap-2">
      {/* Tracking */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="relative">
            <Eye className="h-4 w-4" />
            {tracking && tracking.viewCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center">
                {tracking.viewCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <h4 className="font-medium">Suivi des vues</h4>
            
            {tracking ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vues totales</span>
                  <span className="font-medium">{tracking.viewCount}</span>
                </div>
                {tracking.firstViewedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Première vue</span>
                    <span>{new Date(tracking.firstViewedAt).toLocaleString("fr-FR")}</span>
                  </div>
                )}
                {tracking.lastViewedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dernière vue</span>
                    <span>{new Date(tracking.lastViewedAt).toLocaleString("fr-FR")}</span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleCopyTrackingLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Créez un lien de suivi pour savoir quand le client consulte le document.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCreateTrackingLink}
                  disabled={createTrackingMutation.isPending}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Créer un lien de suivi
                </Button>
              </div>
            )}

            {views && views.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Historique des vues</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {views.slice(0, 5).map((view) => (
                    <div key={view.id} className="text-xs flex justify-between">
                      <span>{new Date(view.viewedAt).toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Signatures */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="relative">
            <PenTool className="h-4 w-4" />
            {signatures && signatures.some(s => s.status === "signed") && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center">
                <Check className="h-3 w-3" />
              </span>
            )}
            {signatures && signatures.some(s => s.status === "pending") && !signatures.some(s => s.status === "signed") && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 text-[10px] text-white flex items-center justify-center">
                <Clock className="h-3 w-3" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <h4 className="font-medium">Signatures électroniques</h4>
            
            {signatures && signatures.length > 0 ? (
              <div className="space-y-2">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">{sig.signerName}</p>
                      <p className="text-xs text-muted-foreground">{sig.signerEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sig.status === "signed" && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Signé
                        </Badge>
                      )}
                      {sig.status === "pending" && (
                        <>
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            En attente
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => sendReminderMutation.mutate({ signatureId: sig.id })}
                            disabled={sendReminderMutation.isPending}
                          >
                            <Bell className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {sig.status === "declined" && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Refusé
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune demande de signature pour ce document.
              </p>
            )}

            <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Demander une signature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demande de signature</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Envoyez une demande de signature pour le {docTypeLabel} {documentNumber}.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="signerName">Nom du signataire</Label>
                    <Input
                      id="signerName"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Nom complet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signerEmail">Email du signataire</Label>
                    <Input
                      id="signerEmail"
                      type="email"
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message personnalisé (optionnel)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ajoutez un message personnel..."
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendSignatureRequest}
                    disabled={sendSignatureRequestMutation.isPending}
                  >
                    {sendSignatureRequestMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Envoyer la demande
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DocumentViewsNotifications() {
  const { data: recentViews, isLoading } = trpc.documentTracking.getRecentViews.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: pendingSignatures } = trpc.signatures.getPendingSignatures.useQuery(undefined, {
    refetchInterval: 30000,
  });

  if (isLoading) return null;

  const hasActivity = (recentViews && recentViews.length > 0) || (pendingSignatures && pendingSignatures.length > 0);

  if (!hasActivity) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Activité documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentViews && recentViews.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Vues récentes</p>
            <div className="space-y-2">
              {recentViews.slice(0, 3).map((view) => (
                <div key={view.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <div>
                    <span className="font-medium">
                      {view.document.type === "quote" ? "Devis" : "Facture"} {view.document.number}
                    </span>
                    {view.client && (
                      <span className="text-muted-foreground ml-2">
                        - {view.client.firstName} {view.client.lastName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(view.viewedAt).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingSignatures && pendingSignatures.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Signatures en attente</p>
            <div className="space-y-2">
              {pendingSignatures.slice(0, 3).map((sig) => (
                <div key={sig.id} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded text-sm">
                  <div>
                    <span className="font-medium">{sig.signerName}</span>
                    <span className="text-muted-foreground ml-2">
                      - {sig.document.type === "quote" ? "Devis" : "Facture"} {sig.document.number}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
