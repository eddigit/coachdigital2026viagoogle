import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { downloadRequirementPDF } from "@/lib/requirementsPdfGenerator";
import { FileText, Plus, Eye, CheckCircle2, Clock, Archive, Download } from "lucide-react";
import { toast } from "sonner";

export default function Requirements() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: companyData } = trpc.company.get.useQuery();

  const handleDownloadPDF = (requirement: any, project: any) => {
    if (!companyData) {
      toast.error("Informations entreprise manquantes");
      return;
    }

    const client = clients?.find((c) => c.id === project.clientId);
    const clientName = client
      ? `${client.firstName} ${client.lastName}${client.company ? ` - ${client.company}` : ""}`
      : "Client inconnu";

    downloadRequirementPDF({
      title: requirement.title,
      version: requirement.version,
      status: requirement.status,
      projectName: project.name,
      clientName,
      description: requirement.description || undefined,
      objectives: requirement.objectives || undefined,
      scope: requirement.scope || undefined,
      constraints: requirement.constraints || undefined,
      deliverables: requirement.deliverables || undefined,
      timeline: requirement.timeline || undefined,
      budget: requirement.budget || undefined,
      createdAt: new Date(requirement.createdAt),
      companyName: companyData.name,
    });

    toast.success("PDF téléchargé avec succès");
  };

  const createRequirement = trpc.requirements.create.useMutation({
    onSuccess: () => {
      toast.success("Cahier des charges créé avec succès");
      setShowForm(false);
      utils.requirements.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedProjectId) {
      toast.error("Veuillez sélectionner un projet");
      return;
    }

    createRequirement.mutate({
      projectId: parseInt(selectedProjectId),
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      objectives: (formData.get("objectives") as string) || null,
      scope: (formData.get("scope") as string) || null,
      constraints: (formData.get("constraints") as string) || null,
      deliverables: (formData.get("deliverables") as string) || null,
      timeline: (formData.get("timeline") as string) || null,
      budget: (formData.get("budget") as string) || null,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: "default" | "secondary" | "outline"; icon: any; label: string }
    > = {
      draft: { variant: "outline", icon: Clock, label: "Brouillon" },
      review: { variant: "secondary", icon: Eye, label: "En révision" },
      approved: { variant: "default", icon: CheckCircle2, label: "Approuvé" },
      archived: { variant: "outline", icon: Archive, label: "Archivé" },
    };

    const { variant, icon: Icon, label } = config[status] || config.draft;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Templates de cahier des charges
  const templates = [
    {
      id: "website",
      name: "Site Web",
      description: "Template pour un projet de site web",
      fields: {
        title: "Cahier des charges - Site Web",
        objectives:
          "- Créer une présence en ligne professionnelle\n- Améliorer la visibilité de l'entreprise\n- Générer des leads qualifiés",
        scope:
          "- Design responsive (mobile, tablette, desktop)\n- Pages principales (accueil, services, à propos, contact)\n- Formulaire de contact\n- Intégration réseaux sociaux",
        deliverables:
          "- Maquettes graphiques\n- Site web complet et fonctionnel\n- Formation à l'administration\n- Documentation technique",
      },
    },
    {
      id: "app",
      name: "Application Métier",
      description: "Template pour une application sur mesure",
      fields: {
        title: "Cahier des charges - Application Métier",
        objectives:
          "- Automatiser les processus métier\n- Améliorer la productivité\n- Centraliser les données",
        scope:
          "- Interface utilisateur intuitive\n- Gestion des utilisateurs et permissions\n- Base de données sécurisée\n- API REST pour intégrations",
        deliverables:
          "- Spécifications fonctionnelles détaillées\n- Application complète et testée\n- Documentation utilisateur\n- Support et maintenance",
      },
    },
    {
      id: "coaching",
      name: "Coaching IA",
      description: "Template pour un accompagnement IA",
      fields: {
        title: "Cahier des charges - Coaching IA",
        objectives:
          "- Comprendre les opportunités de l'IA\n- Identifier les cas d'usage pertinents\n- Former les équipes aux outils IA",
        scope:
          "- Audit des processus actuels\n- Ateliers de découverte IA\n- Mise en place d'outils IA adaptés\n- Formation continue",
        deliverables:
          "- Rapport d'audit\n- Plan d'action personnalisé\n- Sessions de formation\n- Suivi et accompagnement",
      },
    },
  ];

  const applyTemplate = (template: any) => {
    // Pré-remplir le formulaire avec le template
    const form = document.querySelector("form") as HTMLFormElement;
    if (form) {
      (form.elements.namedItem("title") as HTMLInputElement).value = template.fields.title;
      (form.elements.namedItem("objectives") as HTMLTextAreaElement).value =
        template.fields.objectives;
      (form.elements.namedItem("scope") as HTMLTextAreaElement).value = template.fields.scope;
      (form.elements.namedItem("deliverables") as HTMLTextAreaElement).value =
        template.fields.deliverables;
      toast.success(`Template "${template.name}" appliqué`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cahiers des charges</h1>
            <p className="text-muted-foreground">Gérez les spécifications de vos projets</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau cahier des charges
          </Button>
        </div>

        {/* Liste des projets avec leurs requirements */}
        <div className="grid gap-4">
          {projects?.map((project) => {
            const { data: requirements } = trpc.requirements.list.useQuery({
              projectId: project.id,
            });

            if (!requirements || requirements.length === 0) return null;

            return (
              <Card key={project.id} className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <span>{project.name}</span>
                    </div>
                    <Badge variant="outline">{requirements.length} version(s)</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requirements.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-4 bg-background/50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{req.title}</h3>
                            {getStatusBadge(req.status)}
                            <Badge variant="secondary" className="text-xs">
                              v{req.version}
                            </Badge>
                          </div>
                          {req.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {req.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>
                              Créé le {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                            {req.budget && <span>Budget: {req.budget} €</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequirement(req)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(req, project)}
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
            );
          })}
        </div>

        {/* Message si aucun cahier des charges */}
        {projects?.every((p) => {
          const { data: reqs } = trpc.requirements.list.useQuery({ projectId: p.id });
          return !reqs || reqs.length === 0;
        }) && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Aucun cahier des charges pour le moment
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier cahier des charges
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog formulaire création */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau cahier des charges</DialogTitle>
          </DialogHeader>

          {/* Templates */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => applyTemplate(template)}
              >
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Projet *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titre *</Label>
              <Input name="title" required placeholder="Ex: Cahier des charges - Site web vitrine" />
            </div>

            <div>
              <Label>Description générale</Label>
              <Textarea
                name="description"
                rows={3}
                placeholder="Description générale du projet..."
              />
            </div>

            <div>
              <Label>Objectifs</Label>
              <Textarea
                name="objectives"
                rows={4}
                placeholder="Listez les objectifs du projet..."
              />
            </div>

            <div>
              <Label>Périmètre / Fonctionnalités</Label>
              <Textarea name="scope" rows={4} placeholder="Décrivez le périmètre du projet..." />
            </div>

            <div>
              <Label>Contraintes</Label>
              <Textarea
                name="constraints"
                rows={3}
                placeholder="Contraintes techniques, budgétaires, temporelles..."
              />
            </div>

            <div>
              <Label>Livrables</Label>
              <Textarea
                name="deliverables"
                rows={4}
                placeholder="Listez les livrables attendus..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Planning</Label>
                <Textarea name="timeline" rows={3} placeholder="Planning prévisionnel..." />
              </div>

              <div>
                <Label>Budget estimé (€)</Label>
                <Input
                  name="budget"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5000.00"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createRequirement.isPending}>
                {createRequirement.isPending ? "Création..." : "Créer le cahier des charges"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog visualisation */}
      {selectedRequirement && (
        <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedRequirement.title}
                {getStatusBadge(selectedRequirement.status)}
                <Badge variant="secondary">v{selectedRequirement.version}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {selectedRequirement.description && (
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.description}
                  </p>
                </div>
              )}

              {selectedRequirement.objectives && (
                <div>
                  <h3 className="font-medium mb-2">Objectifs</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.objectives}
                  </p>
                </div>
              )}

              {selectedRequirement.scope && (
                <div>
                  <h3 className="font-medium mb-2">Périmètre</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.scope}
                  </p>
                </div>
              )}

              {selectedRequirement.constraints && (
                <div>
                  <h3 className="font-medium mb-2">Contraintes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.constraints}
                  </p>
                </div>
              )}

              {selectedRequirement.deliverables && (
                <div>
                  <h3 className="font-medium mb-2">Livrables</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.deliverables}
                  </p>
                </div>
              )}

              {selectedRequirement.timeline && (
                <div>
                  <h3 className="font-medium mb-2">Planning</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRequirement.timeline}
                  </p>
                </div>
              )}

              {selectedRequirement.budget && (
                <div>
                  <h3 className="font-medium mb-2">Budget</h3>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(selectedRequirement.budget).toFixed(2)} €
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Créé le {new Date(selectedRequirement.createdAt).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(selectedRequirement.createdAt).toLocaleTimeString("fr-FR")}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
