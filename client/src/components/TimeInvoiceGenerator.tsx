import { useState } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TimeInvoiceGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState<number | undefined>();
  const [projectId, setProjectId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const { data: preview } = trpc.timeInvoice.preview.useQuery(
    {
      clientId,
      projectId,
      startDate,
      endDate,
    },
    {
      enabled: !!startDate && !!endDate,
    }
  );

  const generateMutation = trpc.timeInvoice.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Facture générée avec succès");
      
      // Télécharger le PDF
      const blob = base64ToBlob(data.pdf, "application/pdf");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `facture-temps-${startDate}-${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    generateMutation.mutate({
      clientId,
      projectId,
      startDate,
      endDate,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Générer Facture de Temps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Générer une Facture de Temps</DialogTitle>
          <DialogDescription>
            Créez une facture PDF détaillée basée sur vos heures trackées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Période */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="client">Client (optionnel)</Label>
              <Select
                value={clientId?.toString() || ""}
                onValueChange={(value) => setClientId(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">Projet (optionnel)</Label>
              <Select
                value={projectId?.toString() || ""}
                onValueChange={(value) => setProjectId(value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter((p) => !clientId || p.clientId === clientId)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Taux horaire */}
          <div>
            <Label htmlFor="hourlyRate">Taux horaire (€) - optionnel</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Utiliser le taux des entrées"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si non spécifié, le taux horaire de chaque entrée sera utilisé
            </p>
          </div>

          {/* Aperçu */}
          {preview && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Aperçu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre d'entrées :</span>
                    <span className="font-medium">{preview.entriesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total heures :</span>
                    <span className="font-medium">{preview.totalHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taux horaire moyen :</span>
                    <span className="font-medium">{preview.averageRate} €</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">Montant estimé :</span>
                    <span className="font-bold text-primary">{preview.estimatedAmount} € HT</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={generateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !startDate || !endDate}
            >
              {generateMutation.isPending ? (
                "Génération..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Générer PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
