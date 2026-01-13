import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { ArrowLeft, Briefcase, FileText, Code, StickyNote, CheckSquare, FileCheck, Plus, Edit, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generateRequirementPDF } from "@/lib/requirementsPdfGenerator";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  
  const utils = trpc.useUtils();

  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: client } = trpc.clients.getById.useQuery(
    { id: project?.clientId || 0 },
    { enabled: !!project?.clientId }
  );
  
  const { data: requirements } = trpc.requirements.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  
  const createRequirement = trpc.requirements.create.useMutation({
    onSuccess: () => {
      toast.success("Cahier des charges créé");
      setIsRequirementDialogOpen(false);
      setEditingRequirement(null);
      utils.requirements.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
  
  const updateRequirement = trpc.requirements.update.useMutation({
    onSuccess: () => {
      toast.success("Cahier des charges modifié");
      setIsRequirementDialogOpen(false);
      setEditingRequirement(null);
      utils.requirements.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la modification"),
  });
  
  const handleRequirementSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      projectId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      objectives: formData.get("objectives") as string,
      scope: formData.get("scope") as string,
      constraints: formData.get("constraints") as string,
      deliverables: formData.get("deliverables") as string,
      timeline: formData.get("timeline") as string,
      budget: formData.get("budget") as string,
      status: formData.get("status") as "draft" | "review" | "approved" | "archived",
    };
    
    if (editingRequirement) {
      updateRequirement.mutate({ id: editingRequirement.id, ...data });
    } else {
      createRequirement.mutate(data);
    }
  };
  
  const handleDownloadPDF = async (requirement: any) => {
    try {
      await generateRequirementPDF(requirement);
      toast.success("PDF téléchargé");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Link href="/projects">
            <Button className="mt-4">Retour aux projets</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux projets
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 shrink-0">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} className="object-cover" />
              ) : (
                <AvatarFallback>
                  <Briefcase className="h-8 w-8" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {client && (
                <p className="text-muted-foreground mt-1">
                  Client : {client.firstName} {client.lastName}
                  {client.company && ` - ${client.company}`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : project.status === "on_hold"
                    ? "bg-yellow-100 text-yellow-700"
                    : project.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {project.status === "active"
                  ? "Actif"
                  : project.status === "on_hold"
                  ? "En pause"
                  : project.status === "cancelled"
                  ? "Annulé"
                  : "Brouillon"}
              </span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Briefcase className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="requirements">
              <FileText className="h-4 w-4 mr-2" />
              Cahier des charges
            </TabsTrigger>
            <TabsTrigger value="env">
              <Code className="h-4 w-4 mr-2" />
              Variables
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tâches
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileCheck className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du Projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-medium capitalize">{project.status}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Date de début</span>
                    <span className="font-medium">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString("fr-FR") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Date de fin</span>
                    <span className="font-medium">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString("fr-FR") : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client ? (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Nom</span>
                        <span className="font-medium">
                          {client.firstName} {client.lastName}
                        </span>
                      </div>
                      {client.company && (
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Entreprise</span>
                          <span className="font-medium">{client.company}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Téléphone</span>
                          <span className="font-medium">{client.phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Aucun client associé</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Cahier des charges */}
          <TabsContent value="requirements" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Cahiers des Charges</h3>
              <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingRequirement(null)}>
                    <Plus className="h-4 w-4 mr-2" />Nouveau Cahier des Charges
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRequirement ? "Modifier le Cahier des Charges" : "Nouveau Cahier des Charges"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRequirementSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={editingRequirement?.title || ""}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={editingRequirement?.description || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="objectives">Objectifs</Label>
                      <Textarea
                        id="objectives"
                        name="objectives"
                        rows={3}
                        defaultValue={editingRequirement?.objectives || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="scope">Périmètre</Label>
                      <Textarea
                        id="scope"
                        name="scope"
                        rows={3}
                        defaultValue={editingRequirement?.scope || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="constraints">Contraintes</Label>
                      <Textarea
                        id="constraints"
                        name="constraints"
                        rows={3}
                        defaultValue={editingRequirement?.constraints || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="deliverables">Livrables</Label>
                      <Textarea
                        id="deliverables"
                        name="deliverables"
                        rows={3}
                        defaultValue={editingRequirement?.deliverables || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timeline">Planning</Label>
                      <Textarea
                        id="timeline"
                        name="timeline"
                        rows={3}
                        defaultValue={editingRequirement?.timeline || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="budget">Budget</Label>
                      <Input
                        id="budget"
                        name="budget"
                        defaultValue={editingRequirement?.budget || ""}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select name="status" defaultValue={editingRequirement?.status || "draft"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="review">En revue</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="archived">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsRequirementDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingRequirement ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {!requirements || requirements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun cahier des charges pour ce projet</p>
                  <Button onClick={() => setIsRequirementDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Créer le premier cahier des charges
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {requirements.map((req: any) => (
                  <Card key={req.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedRequirement(req)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{req.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">Version {req.version}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            req.status === "approved" ? "bg-green-100 text-green-700" :
                            req.status === "review" ? "bg-blue-100 text-blue-700" :
                            req.status === "archived" ? "bg-gray-100 text-gray-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {req.status === "approved" ? "Approuvé" :
                             req.status === "review" ? "En revue" :
                             req.status === "archived" ? "Archivé" : "Brouillon"}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {req.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRequirement(req);
                            setIsRequirementDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(req);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {selectedRequirement && (
              <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedRequirement.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">Version {selectedRequirement.version}</p>
                  </DialogHeader>
                  <div className="space-y-6">
                    {selectedRequirement.description && (
                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.description}</p>
                      </div>
                    )}
                    {selectedRequirement.objectives && (
                      <div>
                        <h4 className="font-semibold mb-2">Objectifs</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.objectives}</p>
                      </div>
                    )}
                    {selectedRequirement.scope && (
                      <div>
                        <h4 className="font-semibold mb-2">Périmètre</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.scope}</p>
                      </div>
                    )}
                    {selectedRequirement.constraints && (
                      <div>
                        <h4 className="font-semibold mb-2">Contraintes</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.constraints}</p>
                      </div>
                    )}
                    {selectedRequirement.deliverables && (
                      <div>
                        <h4 className="font-semibold mb-2">Livrables</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.deliverables}</p>
                      </div>
                    )}
                    {selectedRequirement.timeline && (
                      <div>
                        <h4 className="font-semibold mb-2">Planning</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequirement.timeline}</p>
                      </div>
                    )}
                    {selectedRequirement.budget && (
                      <div>
                        <h4 className="font-semibold mb-2">Budget</h4>
                        <p className="text-muted-foreground">{selectedRequirement.budget}</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Onglet Variables d'environnement */}
          <TabsContent value="env">
            <Card>
              <CardHeader>
                <CardTitle>Variables d'Environnement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notes */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Tâches */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tâches du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
