import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendar() {
  const { user } = useAuth();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    location: "",
    type: "event" as "meeting" | "call" | "deadline" | "reminder" | "event" | "other",
    color: "#E67E50",
    clientId: undefined as number | undefined,
    projectId: undefined as number | undefined,
  });

  const utils = trpc.useUtils();

  // Charger les événements
  const { data: events, isLoading } = trpc.calendar.list.useQuery();

  // Charger les clients et projets pour les selects
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  // Mutations
  const createEvent = trpc.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate();
      setShowEventDialog(false);
      resetForm();
      toast.success("Événement créé");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateEvent = trpc.calendar.update.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate();
      setShowEventDialog(false);
      resetForm();
      toast.success("Événement modifié");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteEvent = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate();
      setShowEventDialog(false);
      resetForm();
      toast.success("Événement supprimé");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      allDay: false,
      location: "",
      type: "event",
      color: "#E67E50",
      clientId: undefined,
      projectId: undefined,
    });
    setSelectedEvent(null);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setFormData({
      ...formData,
      startDate: format(start, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(end, "yyyy-MM-dd'T'HH:mm"),
    });
    setShowEventDialog(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"),
      endDate: event.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : "",
      allDay: event.allDay || false,
      location: event.location || "",
      type: event.type || "event",
      color: event.color || "#E67E50",
      clientId: event.clientId,
      projectId: event.projectId,
    });
    setShowEventDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate) {
      toast.error("Le titre et la date de début sont obligatoires");
      return;
    }

    const data = {
      title: formData.title,
      description: formData.description,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      allDay: formData.allDay,
      location: formData.location,
      type: formData.type,
      color: formData.color,
      clientId: formData.clientId,
      projectId: formData.projectId,
    };

    if (selectedEvent) {
      updateEvent.mutate({
        eventId: selectedEvent.id,
        ...data,
      });
    } else {
      createEvent.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!selectedEvent) return;
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      deleteEvent.mutate({ eventId: selectedEvent.id });
    }
  };

  // Transformer les événements pour react-big-calendar
  const calendarEvents = events?.map((event) => ({
    ...event,
    start: new Date(event.startDate),
    end: event.endDate ? new Date(event.endDate) : new Date(event.startDate),
    title: event.title,
  })) || [];

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.color || "#E67E50",
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendrier</h1>
            <p className="text-muted-foreground">
              Gérez vos rendez-vous, réunions et échéances
            </p>
          </div>
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div style={{ height: "600px" }}>
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="fr"
                messages={{
                  next: "Suivant",
                  previous: "Précédent",
                  today: "Aujourd'hui",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Heure",
                  event: "Événement",
                  noEventsInRange: "Aucun événement dans cette période",
                  showMore: (total) => `+ ${total} événement(s)`,
                }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog création/édition événement */}
      <Dialog open={showEventDialog} onOpenChange={(open) => {
        if (!open) {
          setShowEventDialog(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? "Modifier l'événement" : "Nouvel événement"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Réunion</SelectItem>
                    <SelectItem value="call">Appel</SelectItem>
                    <SelectItem value="deadline">Échéance</SelectItem>
                    <SelectItem value="reminder">Rappel</SelectItem>
                    <SelectItem value="event">Événement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Adresse ou lien visio"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client (optionnel)</Label>
                <Select
                  value={formData.clientId?.toString() || "none"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, clientId: value === "none" ? undefined : parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="projectId">Projet (optionnel)</Label>
                <Select
                  value={formData.projectId?.toString() || "none"}
                  onValueChange={(value) => 
                    setFormData({ ...formData, projectId: value === "none" ? undefined : parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {selectedEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEventDialog(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createEvent.isPending || updateEvent.isPending}
                >
                  {selectedEvent ? "Modifier" : "Créer"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
