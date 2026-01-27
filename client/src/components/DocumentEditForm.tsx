import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentLine {
  id?: number;
  description: string;
  quantity: string;
  unit: string;
  unitPriceHt: string;
  tvaRate: string;
}

interface DocumentEditFormProps {
  documentId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DocumentEditForm({ documentId, onSuccess, onCancel }: DocumentEditFormProps) {
  const utils = trpc.useUtils();
  const { data: document, isLoading } = trpc.documents.get.useQuery({ id: documentId });
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: companyData } = trpc.company.get.useQuery();

  const [type, setType] = useState<"quote" | "invoice">("quote");
  const [clientId, setClientId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [subject, setSubject] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "sent" | "accepted" | "rejected" | "paid" | "cancelled">("draft");
  const [lines, setLines] = useState<DocumentLine[]>([]);

  // Charger les données du document
  useEffect(() => {
    if (document) {
      setType(document.type as "quote" | "invoice");
      setClientId(document.clientId.toString());
      setProjectId(document.projectId?.toString() || "");
      setDate(document.date ? new Date(document.date).toISOString().split("T")[0] : "");
      setDueDate(document.dueDate ? new Date(document.dueDate).toISOString().split("T")[0] : "");
      setValidityDate(document.validityDate ? new Date(document.validityDate).toISOString().split("T")[0] : "");
      setSubject(document.subject || "");
      setIntroduction(document.introduction || "");
      setConclusion(document.conclusion || "");
      setNotes(document.notes || "");
      setStatus(document.status as any);
      
      // Charger les lignes
      if (document.lines && document.lines.length > 0) {
        setLines(document.lines.map((line: any) => ({
          id: line.id,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceHt: line.unitPriceHt,
          tvaRate: line.tvaRate,
        })));
      } else {
        setLines([{
          description: "",
          quantity: "1",
          unit: "unité",
          unitPriceHt: "",
          tvaRate: companyData?.defaultTvaRate || "20.00",
        }]);
      }
    }
  }, [document, companyData]);

  const updateDocument = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Document mis à jour avec succès");
      utils.documents.list.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Calculer les totaux
  const calculateTotals = () => {
    let totalHt = 0;
    let totalTva = 0;

    lines.forEach((line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unitPriceHt) || 0;
      const tvaRate = parseFloat(line.tvaRate) || 0;

      const lineTotal = quantity * unitPrice;
      totalHt += lineTotal;
      totalTva += lineTotal * (tvaRate / 100);
    });

    const totalTtc = totalHt + totalTva;

    return { totalHt, totalTva, totalTtc };
  };

  const { totalHt, totalTva, totalTtc } = calculateTotals();

  const addLine = () => {
    setLines([
      ...lines,
      {
        description: "",
        quantity: "1",
        unit: "unité",
        unitPriceHt: "",
        tvaRate: companyData?.defaultTvaRate || "20.00",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof DocumentLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateDocument.mutate({
      id: documentId,
      status,
      subject: subject || null,
      introduction: introduction || null,
      conclusion: conclusion || null,
      notes: notes || null,
      lines: lines.map(line => ({
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unitPriceHt: line.unitPriceHt,
        tvaRate: line.tvaRate,
      })),
      totalHt: totalHt.toFixed(2),
      totalTva: totalTva.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
    });
  };

  // Filtrer les projets du client sélectionné
  const filteredProjects = projects?.filter(
    (p) => p.clientId === parseInt(clientId)
  );

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  if (!document) {
    return <div className="text-center py-8 text-destructive">Document introuvable</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* En-tête */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Document: {document.number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Input value={type === "quote" ? "Devis" : "Facture"} disabled />
            </div>

            <div>
              <Label>Client</Label>
              <Input 
                value={clients?.find(c => c.id === parseInt(clientId))?.firstName + " " + clients?.find(c => c.id === parseInt(clientId))?.lastName || ""} 
                disabled 
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input type="date" value={date} disabled />
            </div>

            <div>
              <Label>Statut *</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="accepted">Accepté</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Développement site web vitrine"
            />
          </div>

          <div>
            <Label>Introduction</Label>
            <Textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="Texte d'introduction du document..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lignes de facturation */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Lignes de facturation</CardTitle>
          <Button type="button" onClick={addLine} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, index) => (
            <div key={index} className="p-4 bg-background/50 rounded-lg space-y-3 border border-border/50">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={line.description} 
                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                    placeholder="Description de la prestation"
                    rows={2}
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Quantité</Label>
                  <Input 
                    type="number" 
                    value={line.quantity} 
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    step="0.01"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Prix HT</Label>
                  <Input 
                    type="number" 
                    value={line.unitPriceHt} 
                    onChange={(e) => updateLine(index, 'unitPriceHt', e.target.value)}
                    step="0.01"
                  />
                </div>

                <div className="col-span-1">
                  <Label className="text-xs">TVA %</Label>
                  <Input 
                    type="number" 
                    value={line.tvaRate} 
                    onChange={(e) => updateLine(index, 'tvaRate', e.target.value)}
                    step="0.01"
                  />
                </div>

                <div className="col-span-1">
                  <Label className="text-xs">Total TTC</Label>
                  <Input 
                    value={((parseFloat(line.quantity) || 0) * (parseFloat(line.unitPriceHt) || 0) * (1 + (parseFloat(line.tvaRate) || 0) / 100)).toFixed(2) + " €"} 
                    disabled 
                  />
                </div>

                <div className="col-span-1 flex items-end">
                  <Button 
                    type="button" 
                    onClick={() => removeLine(index)} 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total HT:</span>
              <span className="font-medium">{totalHt.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total TVA:</span>
              <span className="font-medium">{totalTva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total TTC:</span>
              <span className="text-primary">{totalTtc.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes et conclusion */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Conclusion</Label>
            <Textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Texte de conclusion du document..."
              rows={2}
            />
          </div>

          <div>
            <Label>Notes internes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes (non visibles sur le PDF)..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={updateDocument.isPending}>
          {updateDocument.isPending ? "Mise à jour..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
