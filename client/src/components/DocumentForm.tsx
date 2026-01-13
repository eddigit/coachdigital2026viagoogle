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
  description: string;
  quantity: string;
  unit: string;
  unitPriceHt: string;
  tvaRate: string;
}

interface DocumentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DocumentForm({ onSuccess, onCancel }: DocumentFormProps) {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: companyData } = trpc.company.get.useQuery();

  const [type, setType] = useState<"quote" | "invoice">("quote");
  const [clientId, setClientId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [subject, setSubject] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "check" | "card" | "cash" | "other">("bank_transfer");

  const [lines, setLines] = useState<DocumentLine[]>([
    {
      description: "",
      quantity: "1",
      unit: "unité",
      unitPriceHt: "",
      tvaRate: companyData?.defaultTvaRate || "20.00",
    },
  ]);

  const createDocument = trpc.documents.create.useMutation({
    onSuccess: () => {
      toast.success(`${type === "quote" ? "Devis" : "Facture"} créé avec succès`);
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

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (lines.some((line) => !line.description || !line.unitPriceHt)) {
      toast.error("Veuillez remplir toutes les lignes");
      return;
    }

    createDocument.mutate({
      type,
      clientId: parseInt(clientId),
      projectId: projectId ? parseInt(projectId) : null,
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
      validityDate: validityDate ? new Date(validityDate) : null,
      subject: subject || null,
      introduction: introduction || null,
      conclusion: conclusion || null,
      notes: notes || null,
      paymentTerms: parseInt(paymentTerms),
      paymentMethod,
      isAcompteRequired: false,
      acomptePercentage: null,
      lines,
    });
  };

  // Filtrer les projets du client sélectionné
  const filteredProjects = projects?.filter(
    (p) => p.clientId === parseInt(clientId)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* En-tête */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type de document *</Label>
              <Select value={type} onValueChange={(v: "quote" | "invoice") => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">Devis</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.firstName} {client.lastName}
                      {client.company && ` - ${client.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Projet (optionnel)</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={!clientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            {type === "invoice" && (
              <div>
                <Label>Date d'échéance</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            )}

            {type === "quote" && (
              <div>
                <Label>Date de validité</Label>
                <Input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Délai de paiement (jours)</Label>
              <Input
                type="number"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>

            <div>
              <Label>Moyen de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
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

      {/* Lignes */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lignes de facturation</CardTitle>
            <Button type="button" onClick={addLine} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line, index) => (
            <div key={index} className="p-4 bg-background/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Ligne {index + 1}
                </span>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeLine(index)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label className="text-xs">Description *</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(index, "description", e.target.value)}
                    placeholder="Description de la prestation"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Quantité</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, "quantity", e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Unité</Label>
                  <Input
                    value={line.unit}
                    onChange={(e) => updateLine(index, "unit", e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Prix HT *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.unitPriceHt}
                    onChange={(e) => updateLine(index, "unitPriceHt", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="col-span-1">
                  <Label className="text-xs">TVA %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.tvaRate}
                    onChange={(e) => updateLine(index, "tvaRate", e.target.value)}
                  />
                </div>
              </div>

              <div className="text-right text-sm text-muted-foreground">
                Total ligne:{" "}
                <span className="font-medium text-foreground">
                  {(
                    (parseFloat(line.quantity) || 0) *
                    (parseFloat(line.unitPriceHt) || 0) *
                    (1 + (parseFloat(line.tvaRate) || 0) / 100)
                  ).toFixed(2)}{" "}
                  € TTC
                </span>
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
        <Button type="submit" disabled={createDocument.isPending}>
          {createDocument.isPending ? "Création..." : `Créer le ${type === "quote" ? "devis" : "la facture"}`}
        </Button>
      </div>
    </form>
  );
}
