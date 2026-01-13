import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Briefcase, Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function Projects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  
  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projet créé");
      setIsDialogOpen(false);
      utils.projects.list.invalidate();
      utils.stats.get.invalidate();
    },
  });

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Projet modifié");
      setIsDialogOpen(false);
      setEditingProject(null);
      utils.projects.list.invalidate();
    },
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projet supprimé");
      utils.projects.list.invalidate();
      utils.stats.get.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      clientId: parseInt(formData.get("clientId") as string),
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      type: (formData.get("type") as any) || "other",
      status: (formData.get("status") as any) || "draft",
      priority: (formData.get("priority") as any) || "normal",
      startDate: null,
      endDate: null,
      estimatedHours: (formData.get("estimatedHours") as string) || null,
      budgetEstimate: (formData.get("budgetEstimate") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, data });
    } else {
      createProject.mutate(data);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projets</h1>
            <p className="text-muted-foreground">Gérez vos projets clients</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingProject(null);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nouveau Projet</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProject ? "Modifier" : "Créer"} un projet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select name="clientId" defaultValue={editingProject?.clientId?.toString()} required>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input name="name" defaultValue={editingProject?.name} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" defaultValue={editingProject?.description || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" defaultValue={editingProject?.type || "other"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Site Web</SelectItem>
                        <SelectItem value="app">Application</SelectItem>
                        <SelectItem value="coaching">Coaching</SelectItem>
                        <SelectItem value="ia_integration">IA</SelectItem>
                        <SelectItem value="optimization">Optimisation</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select name="status" defaultValue={editingProject?.status || "draft"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="on_hold">Pause</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">{editingProject ? "Modifier" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const client = clients?.find(c => c.id === p.clientId);
              return (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 border-2 shrink-0">
                          {p.logoUrl ? (
                            <img src={p.logoUrl} alt={p.name} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-sm font-medium">
                              <Briefcase className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="truncate">{p.name}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {client && <div className="text-sm">{client.firstName} {client.lastName}</div>}
                    <div className="flex gap-2">
                      <Link href={`/projects/${p.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />Voir
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingProject(p); setIsDialogOpen(true); }}>
                        <Pencil className="h-3 w-3 mr-1" />Modifier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer ?")) deleteProject.mutate({ id: p.id }); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center">Aucun projet</CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
