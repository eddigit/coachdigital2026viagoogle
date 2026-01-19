import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Plus, CheckSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tâche créée");
      setIsDialogOpen(false);
      utils.tasks.list.invalidate();
      utils.stats.get.invalidate();
    },
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tâche modifiée");
      setIsDialogOpen(false);
      setEditingTask(null);
      utils.tasks.list.invalidate();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tâche supprimée");
      utils.tasks.list.invalidate();
      utils.stats.get.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectId = formData.get("projectId") as string;
    const clientId = formData.get("clientId") as string;
    
    const dueDateStr = formData.get("dueDate") as string;
    
    const data = {
      projectId: projectId && projectId !== "none" ? parseInt(projectId) : null,
      clientId: clientId && clientId !== "none" ? parseInt(clientId) : null,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as any) || "todo",
      priority: (formData.get("priority") as any) || "normal",
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      period: (formData.get("period") as any) || "all_day",
      completedAt: null,
      estimatedHours: (formData.get("estimatedHours") as string) || null,
      isBillable: formData.get("isBillable") === "on",
      hourlyRate: (formData.get("hourlyRate") as string) || null,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data });
    } else {
      createTask.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-green-100 text-green-700";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "review": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tâches</h1>
            <p className="text-muted-foreground">Gérez vos tâches et suivez votre temps</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTask(null);
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nouvelle Tâche</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Modifier" : "Créer"} une tâche</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input name="title" defaultValue={editingTask?.title} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" defaultValue={editingTask?.description || ""} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projet</Label>
                    <Select name="projectId" defaultValue={editingTask?.projectId?.toString()}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun projet</SelectItem>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select name="clientId" defaultValue={editingTask?.clientId?.toString()}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun client</SelectItem>
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select name="status" defaultValue={editingTask?.status || "todo"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="review">En revue</SelectItem>
                        <SelectItem value="done">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priorité</Label>
                    <Select name="priority" defaultValue={editingTask?.priority || "normal"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input name="dueDate" type="date" defaultValue={editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Période</Label>
                    <Select name="period" defaultValue={editingTask?.period || "all_day"}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_day">Toute la journée</SelectItem>
                        <SelectItem value="morning">Matinée</SelectItem>
                        <SelectItem value="afternoon">Après-midi</SelectItem>
                        <SelectItem value="evening">Soirée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heures estimées</Label>
                    <Input name="estimatedHours" type="number" step="0.5" defaultValue={editingTask?.estimatedHours || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>Taux horaire (€)</Label>
                    <Input name="hourlyRate" type="number" step="0.01" defaultValue={editingTask?.hourlyRate || ""} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="isBillable" name="isBillable" defaultChecked={editingTask?.isBillable !== false} />
                  <Label htmlFor="isBillable" className="cursor-pointer">Facturable</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">{editingTask ? "Modifier" : "Créer"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : tasks && tasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const project = projects?.find(p => p.id === task.projectId);
              const client = clients?.find(c => c.id === task.clientId);
              return (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span className="truncate">{task.title}</span>
                      <CheckSquare className="h-5 w-5" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {project && <div className="text-sm">Projet: {project.name}</div>}
                    {client && <div className="text-sm">Client: {client.firstName} {client.lastName}</div>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingTask(task); setIsDialogOpen(true); }}>
                        <Pencil className="h-3 w-3 mr-1" />Modifier
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer ?")) deleteTask.mutate({ id: task.id }); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center">Aucune tâche</CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
