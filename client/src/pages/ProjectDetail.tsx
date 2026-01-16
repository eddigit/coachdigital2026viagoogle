import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { ArrowLeft, Briefcase, FileText, Code, StickyNote, CheckSquare, FileCheck, Plus, Edit, Download, Eye, EyeOff, Trash2, AlertTriangle, Pin, Key } from "lucide-react";
import ProjectSecrets from "@/components/ProjectSecrets";
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
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<any>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<number>>(new Set());
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  
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
  
  const { data: variables } = trpc.projectVariables.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  
  const { data: notes } = trpc.projectNotes.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  
  const { data: tasks } = trpc.tasks.byProject.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  
  const { data: documents } = trpc.documents.byClient.useQuery(
    { clientId: project?.clientId || 0 },
    { enabled: !!project?.clientId }
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
  
  const createVariable = trpc.projectVariables.create.useMutation({
    onSuccess: () => {
      toast.success("Variable créée");
      setIsVariableDialogOpen(false);
      setEditingVariable(null);
      utils.projectVariables.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
  
  const updateVariable = trpc.projectVariables.update.useMutation({
    onSuccess: () => {
      toast.success("Variable modifiée");
      setIsVariableDialogOpen(false);
      setEditingVariable(null);
      utils.projectVariables.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la modification"),
  });
  
  const deleteVariable = trpc.projectVariables.delete.useMutation({
    onSuccess: () => {
      toast.success("Variable supprimée");
      utils.projectVariables.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
  
  const handleVariableSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      projectId,
      name: formData.get("name") as string,
      value: formData.get("value") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string || undefined,
      isSecret: formData.get("isSecret") === "true",
    };
    
    if (editingVariable) {
      updateVariable.mutate({ id: editingVariable.id, ...data });
    } else {
      createVariable.mutate(data);
    }
  };
  
  const toggleSecretVisibility = (id: number) => {
    setVisibleSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const createNote = trpc.projectNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note créée");
      setIsNoteDialogOpen(false);
      setEditingNote(null);
      utils.projectNotes.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
  
  const updateNote = trpc.projectNotes.update.useMutation({
    onSuccess: () => {
      toast.success("Note modifiée");
      setIsNoteDialogOpen(false);
      setEditingNote(null);
      utils.projectNotes.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la modification"),
  });
  
  const deleteNote = trpc.projectNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note supprimée");
      utils.projectNotes.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
  
  const handleNoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      projectId,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      tags: formData.get("tags") as string || undefined,
      isPinned: formData.get("isPinned") === "true",
    };
    
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, ...data });
    } else {
      createNote.mutate(data);
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
      <div className="container max-w-full py-6 px-3 sm:px-4 md:px-6 overflow-x-hidden">
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
          <TabsList className="grid w-full grid-cols-7">
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
            <TabsTrigger value="secrets">
              <Key className="h-4 w-4 mr-2" />
              Secrets
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
          <TabsContent value="env" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Variables d'Environnement</h3>
                <p className="text-sm text-muted-foreground">Stockage sécurisé des credentials (hébergement, SMTP, API, FTP)</p>
              </div>
              <Dialog open={isVariableDialogOpen} onOpenChange={setIsVariableDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingVariable(null)}>
                    <Plus className="h-4 w-4 mr-2" />Nouvelle Variable
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingVariable ? "Modifier la Variable" : "Nouvelle Variable"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleVariableSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: FTP_HOST, SMTP_PASSWORD"
                        defaultValue={editingVariable?.name || ""}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="value">Valeur</Label>
                      <Input
                        id="value"
                        name="value"
                        type="text"
                        defaultValue={editingVariable?.value || ""}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" defaultValue={editingVariable?.type || "other"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hosting">Hébergement</SelectItem>
                          <SelectItem value="smtp">SMTP</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="ftp">FTP</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={2}
                        placeholder="Ex: Identifiants FTP du serveur OVH"
                        defaultValue={editingVariable?.description || ""}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isSecret"
                        name="isSecret"
                        value="true"
                        defaultChecked={editingVariable?.isSecret !== false}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isSecret" className="cursor-pointer">
                        Masquer la valeur par défaut (recommandé pour les mots de passe)
                      </Label>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsVariableDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingVariable ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
              <CardContent className="py-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">Avertissement RGPD et Sécurité</p>
                    <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                      Ces informations sont stockées de manière sécurisée et ne sont accessibles que par vous. 
                      Ne partagez jamais ces credentials par email. Utilisez cet espace sécurisé conforme RGPD.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {!variables || variables.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune variable d'environnement</p>
                  <Button onClick={() => setIsVariableDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Ajouter la première variable
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {variables.map((variable: any) => (
                  <Card key={variable.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{variable.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              variable.type === "hosting" ? "bg-blue-100 text-blue-700" :
                              variable.type === "smtp" ? "bg-green-100 text-green-700" :
                              variable.type === "api" ? "bg-purple-100 text-purple-700" :
                              variable.type === "ftp" ? "bg-orange-100 text-orange-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {variable.type === "hosting" ? "Hébergement" :
                               variable.type === "smtp" ? "SMTP" :
                               variable.type === "api" ? "API" :
                               variable.type === "ftp" ? "FTP" : "Autre"}
                            </span>
                          </div>
                          {variable.description && (
                            <p className="text-sm text-muted-foreground mb-2">{variable.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {variable.isSecret && !visibleSecrets.has(variable.id) 
                                ? "•".repeat(20)
                                : variable.value}
                            </code>
                            {variable.isSecret && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSecretVisibility(variable.id)}
                              >
                                {visibleSecrets.has(variable.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingVariable(variable);
                              setIsVariableDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Supprimer cette variable ?")) {
                                deleteVariable.mutate({ id: variable.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Secrets */}
          <TabsContent value="secrets" className="space-y-4">
            <ProjectSecrets projectId={projectId} />
          </TabsContent>

          {/* Onglet Notes */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Notes du Projet</h3>
                <p className="text-sm text-muted-foreground">Documentation, idées et informations importantes</p>
              </div>
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingNote(null)}>
                    <Plus className="h-4 w-4 mr-2" />Nouvelle Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNote ? "Modifier la Note" : "Nouvelle Note"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Ex: Réunion client, Idées design"
                        defaultValue={editingNote?.title || ""}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Contenu</Label>
                      <Textarea
                        id="content"
                        name="content"
                        rows={8}
                        placeholder="Saisissez vos notes ici..."
                        defaultValue={editingNote?.content || ""}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        placeholder="Ex: design, technique, urgent"
                        defaultValue={editingNote?.tags || ""}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPinned"
                        name="isPinned"
                        value="true"
                        defaultChecked={editingNote?.isPinned || false}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="isPinned" className="cursor-pointer">
                        Épingler cette note en haut
                      </Label>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingNote ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {!notes || notes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune note pour ce projet</p>
                  <Button onClick={() => setIsNoteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Créer la première note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {notes
                  .sort((a: any, b: any) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((note: any) => (
                  <Card key={note.id} className={note.isPinned ? "border-[#E67E50]" : ""}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {note.isPinned && <Pin className="h-4 w-4 text-[#E67E50]" />}
                          <h4 className="font-semibold">{note.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNote(note);
                              setIsNoteDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Supprimer cette note ?")) {
                                deleteNote.mutate({ id: note.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mb-2">{note.content}</p>
                      {note.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.split(",").map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-muted rounded text-xs">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Tâches */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Tâches du Projet</h3>
                <p className="text-sm text-muted-foreground">Liste des tâches liées à ce projet</p>
              </div>
              <Link href="/tasks">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />Nouvelle Tâche
                </Button>
              </Link>
            </div>
            
            {!tasks || tasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune tâche pour ce projet</p>
                  <Link href="/tasks">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />Créer la première tâche
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {tasks.map((task: any) => (
                  <Card key={task.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{task.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              task.status === "done" ? "bg-green-100 text-green-700" :
                              task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                              task.status === "review" ? "bg-purple-100 text-purple-700" :
                              task.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {task.status === "done" ? "Terminée" :
                               task.status === "in_progress" ? "En cours" :
                               task.status === "review" ? "En revue" :
                               task.status === "cancelled" ? "Annulée" : "À faire"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              task.priority === "urgent" ? "bg-red-100 text-red-700" :
                              task.priority === "high" ? "bg-orange-100 text-orange-700" :
                              task.priority === "normal" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {task.priority === "urgent" ? "Urgent" :
                               task.priority === "high" ? "Haute" :
                               task.priority === "normal" ? "Normale" : "Basse"}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <span>Échéance: {new Date(task.dueDate).toLocaleDateString("fr-FR")}</span>
                            )}
                            {task.estimatedHours && (
                              <span>{task.estimatedHours}h estimées</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Documents du Projet</h3>
                <p className="text-sm text-muted-foreground">Devis et factures liés au client</p>
              </div>
              <Link href="/documents">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />Nouveau Document
                </Button>
              </Link>
            </div>
            
            {!documents || documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun document pour ce client</p>
                  <Link href="/documents">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />Créer le premier document
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{doc.number}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              doc.type === "quote" ? "bg-blue-100 text-blue-700" :
                              doc.type === "invoice" ? "bg-green-100 text-green-700" :
                              "bg-purple-100 text-purple-700"
                            }`}>
                              {doc.type === "quote" ? "Devis" :
                               doc.type === "invoice" ? "Facture" : "Avoir"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              doc.status === "paid" ? "bg-green-100 text-green-700" :
                              doc.status === "sent" ? "bg-blue-100 text-blue-700" :
                              doc.status === "accepted" ? "bg-purple-100 text-purple-700" :
                              doc.status === "rejected" ? "bg-red-100 text-red-700" :
                              doc.status === "cancelled" ? "bg-gray-100 text-gray-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {doc.status === "paid" ? "Payé" :
                               doc.status === "sent" ? "Envoyé" :
                               doc.status === "accepted" ? "Accepté" :
                               doc.status === "rejected" ? "Refusé" :
                               doc.status === "cancelled" ? "Annulé" : "Brouillon"}
                            </span>
                          </div>
                          {doc.subject && (
                            <p className="text-sm text-muted-foreground mb-2">{doc.subject}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Date: {new Date(doc.date).toLocaleDateString("fr-FR")}</span>
                            <span className="font-semibold text-foreground">{doc.totalTtc} € TTC</span>
                            {doc.dueDate && (
                              <span>Échéance: {new Date(doc.dueDate).toLocaleDateString("fr-FR")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
