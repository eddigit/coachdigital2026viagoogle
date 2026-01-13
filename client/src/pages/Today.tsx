import { useState } from "react";
import { Plus, Clock, Play, Pause, Trash2, Edit2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Period = "morning" | "afternoon" | "evening";

interface TimeEntryFormData {
  clientId?: number;
  projectId?: number;
  title: string;
  description?: string;
  type: "billable" | "non_billable";
  period: Period;
  hourlyRate?: string;
}

const PERIODS = [
  { id: "morning" as Period, label: "Matinée", time: "8h - 12h", color: "bg-orange-500/10 border-orange-500/20" },
  { id: "afternoon" as Period, label: "Après-midi", time: "12h - 18h", color: "bg-blue-500/10 border-blue-500/20" },
  { id: "evening" as Period, label: "Soirée", time: "18h - 22h", color: "bg-purple-500/10 border-purple-500/20" },
];

export default function Today() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("morning");
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Queries
  const { data: entries = [], refetch } = trpc.timeEntries.listByDate.useQuery({ date: selectedDate });
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  // Mutations
  const createMutation = trpc.timeEntries.create.useMutation({
    onSuccess: () => {
      toast.success("Entrée créée avec succès");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = trpc.timeEntries.update.useMutation({
    onSuccess: () => {
      toast.success("Entrée mise à jour");
      refetch();
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.timeEntries.delete.useMutation({
    onSuccess: () => {
      toast.success("Entrée supprimée");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const startTimerMutation = trpc.timeEntries.startTimer.useMutation({
    onSuccess: () => {
      toast.success("Chronomètre démarré");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const stopTimerMutation = trpc.timeEntries.stopTimer.useMutation({
    onSuccess: (data) => {
      toast.success(`Chronomètre arrêté - Durée: ${Math.floor(data.duration / 60)}h ${data.duration % 60}m`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state
  const [formData, setFormData] = useState<TimeEntryFormData>({
    title: "",
    description: "",
    type: "billable",
    period: "morning",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "billable",
      period: "morning",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        ...formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        date: selectedDate,
      });
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      clientId: entry.clientId || undefined,
      projectId: entry.projectId || undefined,
      title: entry.title,
      description: entry.description || "",
      type: entry.type,
      period: entry.period,
      hourlyRate: entry.hourlyRate || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleStartTimer = (id: number) => {
    startTimerMutation.mutate({ id });
  };

  const handleStopTimer = (id: number) => {
    stopTimerMutation.mutate({ id });
  };

  const getEntriesByPeriod = (period: Period) => {
    return entries.filter((entry) => entry.period === period);
  };

  const calculatePeriodStats = (period: Period) => {
    const periodEntries = getEntriesByPeriod(period);
    const totalMinutes = periodEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableMinutes = periodEntries.filter(e => e.type === "billable").reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    return {
      total: totalMinutes,
      billable: billableMinutes,
      nonBillable: totalMinutes - billableMinutes,
      entries: periodEntries.length,
    };
  };

  const calculateDayStats = () => {
    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableMinutes = entries.filter(e => e.type === "billable").reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    return {
      total: totalMinutes,
      billable: billableMinutes,
      nonBillable: totalMinutes - billableMinutes,
      entries: entries.length,
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const dayStats = calculateDayStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ma Journée</h1>
          <p className="text-muted-foreground mt-1">
            Organisez votre temps et suivez vos activités
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Statistiques du jour */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(dayStats.total)}</div>
            <p className="text-xs text-muted-foreground">{dayStats.entries} entrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Facturable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatDuration(dayStats.billable)}</div>
            <p className="text-xs text-muted-foreground">
              {dayStats.total > 0 ? Math.round((dayStats.billable / dayStats.total) * 100) : 0}% du temps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Non Facturable</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{formatDuration(dayStats.nonBillable)}</div>
            <p className="text-xs text-muted-foreground">
              {dayStats.total > 0 ? Math.round((dayStats.nonBillable / dayStats.total) * 100) : 0}% du temps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Facturation</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dayStats.total > 0 ? Math.round((dayStats.billable / dayStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Objectif: 80%</p>
          </CardContent>
        </Card>
      </div>

      {/* Périodes de la journée */}
      <div className="grid gap-6 md:grid-cols-3">
        {PERIODS.map((period) => {
          const stats = calculatePeriodStats(period.id);
          const periodEntries = getEntriesByPeriod(period.id);

          return (
            <Card key={period.id} className={period.color}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{period.label}</CardTitle>
                    <p className="text-sm text-muted-foreground">{period.time}</p>
                  </div>
                  <Dialog
                    open={isDialogOpen && selectedPeriod === period.id}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (open) {
                        setSelectedPeriod(period.id);
                        setFormData({ ...formData, period: period.id });
                      } else {
                        setEditingEntry(null);
                        resetForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPeriod(period.id);
                          setFormData({ ...formData, period: period.id });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingEntry ? "Modifier l'entrée" : `Nouvelle entrée - ${period.label}`}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Ex: Développement site client X"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Détails de l'activité..."
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="type">Type *</Label>
                              <Select
                                value={formData.type}
                                onValueChange={(value: "billable" | "non_billable") =>
                                  setFormData({ ...formData, type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="billable">Facturable</SelectItem>
                                  <SelectItem value="non_billable">Non facturable</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="client">Client</Label>
                              <Select
                                value={formData.clientId?.toString() || ""}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, clientId: value ? parseInt(value) : undefined })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Aucun client</SelectItem>
                                  {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                      {client.firstName} {client.lastName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="project">Projet</Label>
                              <Select
                                value={formData.projectId?.toString() || ""}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, projectId: value ? parseInt(value) : undefined })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un projet" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Aucun projet</SelectItem>
                                  {projects
                                    .filter((p) => !formData.clientId || p.clientId === formData.clientId)
                                    .map((project) => (
                                      <SelectItem key={project.id} value={project.id.toString()}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.type === "billable" && (
                              <div>
                                <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                                <Input
                                  id="hourlyRate"
                                  type="number"
                                  step="0.01"
                                  value={formData.hourlyRate || ""}
                                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                  placeholder="Ex: 80.00"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setEditingEntry(null);
                              resetForm();
                            }}
                          >
                            Annuler
                          </Button>
                          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingEntry ? "Mettre à jour" : "Créer"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  <span>{formatDuration(stats.total)}</span>
                  <span className="text-green-500">{formatDuration(stats.billable)} facturable</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {periodEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune activité planifiée
                    </p>
                  ) : (
                    periodEntries.map((entry) => {
                      const client = clients.find((c) => c.id === entry.clientId);
                      const project = projects.find((p) => p.id === entry.projectId);
                      const isRunning = entry.status === "in_progress";

                      return (
                        <Card key={entry.id} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                                <Badge
                                  variant={entry.type === "billable" ? "default" : "secondary"}
                                  className="shrink-0"
                                >
                                  {entry.type === "billable" ? "Facturable" : "Non facturable"}
                                </Badge>
                              </div>
                              {entry.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {entry.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {client && (
                                  <span className="flex items-center gap-1">
                                    👤 {client.firstName} {client.lastName}
                                  </span>
                                )}
                                {project && (
                                  <span className="flex items-center gap-1">📁 {project.name}</span>
                                )}
                                {entry.duration && (
                                  <span className="flex items-center gap-1 text-primary font-medium">
                                    ⏱️ {formatDuration(entry.duration)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {isRunning ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleStopTimer(entry.id)}
                                  disabled={stopTimerMutation.isPending}
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartTimer(entry.id)}
                                  disabled={startTimerMutation.isPending}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(entry)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(entry.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
