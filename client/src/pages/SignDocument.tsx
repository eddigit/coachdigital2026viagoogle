import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Check, X, FileText, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SignDocument() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const { data, isLoading, error } = trpc.signatures.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const signMutation = trpc.signatures.sign.useMutation({
    onSuccess: () => {
      toast.success("Document signé avec succès !");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const declineMutation = trpc.signatures.decline.useMutation({
    onSuccess: () => {
      toast.success("Document refusé");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [data]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("Veuillez dessiner votre signature");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    signMutation.mutate({
      token,
      signatureData,
      userAgent: navigator.userAgent,
    });
  };

  const handleDecline = () => {
    declineMutation.mutate({
      token,
      reason: declineReason || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Lien invalide</h2>
            <p className="text-muted-foreground">
              Ce lien de signature est invalide ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.signature.status === "signed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Document signé</h2>
            <p className="text-muted-foreground">
              Ce document a été signé le {new Date(data.signature.signedAt!).toLocaleDateString("fr-FR")}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.signature.status === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <X className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Document refusé</h2>
            <p className="text-muted-foreground">
              Ce document a été refusé.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Merci !</h2>
            <p className="text-muted-foreground">
              Votre signature a été enregistrée avec succès.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (declineMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Document refusé</h2>
            <p className="text-muted-foreground">
              Votre refus a été enregistré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docType = data.document?.type === "quote" ? "Devis" : "Facture";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary rounded-sm flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-bold text-xl">G</span>
          </div>
          <h1 className="text-2xl font-bold">Coach Digital</h1>
          <p className="text-muted-foreground">Signature électronique</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {docType} {data.document?.number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">
                  {data.client ? `${data.client.firstName} ${data.client.lastName}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Montant TTC</p>
                <p className="font-medium">{data.document?.totalTtc} €</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {data.document?.date ? new Date(data.document.date).toLocaleDateString("fr-FR") : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Signataire</p>
                <p className="font-medium">{data.signature.signerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showDeclineForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Votre signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Effacer
                </Button>
                <p className="text-xs text-muted-foreground self-center">
                  Dessinez votre signature avec la souris ou le doigt
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeclineForm(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSign}
                  disabled={!hasSignature || signMutation.isPending}
                >
                  {signMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Signer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Refuser le document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Raison du refus (optionnel)"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeclineForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                >
                  {declineMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Confirmer le refus
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground">
          En signant ce document, vous acceptez les conditions générales de Coach Digital.
          <br />
          Votre signature électronique a la même valeur légale qu'une signature manuscrite.
        </p>
      </div>
    </div>
  );
}
