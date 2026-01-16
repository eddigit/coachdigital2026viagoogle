import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Mail,
  Phone,
  Building2,
  Euro,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  MoreHorizontal,
  Eye,
  Send,
  FileText,
  Trash2,
  GripVertical,
  LayoutGrid,
  List,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type LeadStatus = "suspect" | "prospect" | "analyse" | "negociation" | "conclusion" | "ordre";

type Lead = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  status: LeadStatus;
  potentialAmount: string | null;
  probability: number | null;
  source: string | null;
  notes: string | null;
  isActivated: boolean;
  activatedAt: string | null;
  createdAt: string;
};

const SPANCO_PHASES: { id: LeadStatus; label: string; color: string }[] = [
  { id: "suspect", label: "Suspect", color: "#6b7280" },
  { id: "prospect", label: "Prospect", color: "#3b82f6" },
  { id: "analyse", label: "Analyse", color: "#8b5cf6" },
  { id: "negociation", label: "Négociation", color: "#f59e0b" },
  { id: "conclusion", label: "Conclusion", color: "#10b981" },
  { id: "ordre", label: "Prise d'Ordre", color: "#ef4444" },
];

export default function Portfolio() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Query pour les leads activés uniquement
  const { data: leads = [], refetch } = trpc.leads.listActivated.useQuery();

  // Mutations
  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Phase mise à jour");
      refetch();
    },
  });

  const deactivateMutation = trpc.leads.deactivateFromPortfolio.useMutation({
    onSuccess: () => {
      toast.success("Lead retiré du portefeuille");
      refetch();
    },
  });

  const convertToClientMutation = trpc.leads.convertToClient.useMutation({
    onSuccess: () => {
      toast.success("Lead converti en client !");
      refetch();
    },
  });

  // Grouper les leads par phase
  const leadsByPhase = SPANCO_PHASES.reduce((acc, phase) => {
    acc[phase.id] = leads.filter((lead: Lead) => lead.status === phase.id);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  // Calcul des stats
  const stats = {
    total: leads.length,
    totalPotential: leads.reduce(
      (sum: number, lead: Lead) => sum + (parseFloat(lead.potentialAmount || "0") || 0),
      0
    ),
    weightedPotential: leads.reduce(
      (sum: number, lead: Lead) =>
        sum +
        (parseFloat(lead.potentialAmount || "0") || 0) *
          ((lead.probability || 0) / 100),
      0
    ),
  };

  // Drag & Drop handler
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const leadId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as LeadStatus;

    updateStatusMutation.mutate({ id: leadId, status: newStatus });
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-orange-500" />
            Portefeuille d'Affaires
          </h1>
          <p className="text-muted-foreground">
            Pipeline SPANCO - {leads.length} affaires en cours
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            Liste
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affaires en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potentiel Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPotential.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potentiel Pondéré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats.weightedPotential.toLocaleString()} €
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {leads.length > 0
                ? Math.round(
                    (leadsByPhase["ordre"]?.length / leads.length) * 100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue Kanban */}
      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
            {SPANCO_PHASES.map((phase) => (
              <Droppable key={phase.id} droppableId={phase.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-w-[280px] rounded-lg p-3 ${
                      snapshot.isDraggingOver ? "bg-orange-500/10" : "bg-muted/50"
                    }`}
                  >
                    {/* Header de colonne */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: phase.color }}
                        />
                        <span className="font-semibold">{phase.label}</span>
                      </div>
                      <Badge variant="secondary">
                        {leadsByPhase[phase.id]?.length || 0}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {leadsByPhase[phase.id]?.map((lead: Lead, index: number) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 ml-2">
                                    <p className="font-medium text-sm">
                                      {lead.firstName} {lead.lastName}
                                    </p>
                                    {lead.company && (
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {lead.company}
                                      </p>
                                    )}
                                    {lead.potentialAmount && (
                                      <p className="text-sm font-semibold text-orange-500 mt-1">
                                        {parseFloat(lead.potentialAmount).toLocaleString()} €
                                      </p>
                                    )}
                                    {lead.probability && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-orange-500"
                                            style={{ width: `${lead.probability}%` }}
                                          />
                                        </div>
                                        <span className="text-xs">{lead.probability}%</span>
                                      </div>
                                    )}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Voir détails
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Send className="h-4 w-4 mr-2" />
                                        Envoyer email
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Créer devis
                                      </DropdownMenuItem>
                                      {phase.id === "ordre" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            convertToClientMutation.mutate({ leadId: lead.id })
                                          }
                                        >
                                          <UserCheck className="h-4 w-4 mr-2" />
                                          Convertir en client
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          deactivateMutation.mutate({ leadId: lead.id })
                                        }
                                      >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Retirer du portefeuille
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Vue Liste */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Entreprise</th>
                  <th className="text-left p-4">Phase</th>
                  <th className="text-left p-4">Potentiel</th>
                  <th className="text-left p-4">Probabilité</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: Lead) => {
                  const phase = SPANCO_PHASES.find((p) => p.id === lead.status);
                  return (
                    <tr key={lead.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </p>
                          {lead.email && (
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {lead.company}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge style={{ backgroundColor: phase?.color, color: "white" }}>
                          {phase?.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {lead.potentialAmount && (
                          <span className="font-semibold">
                            {parseFloat(lead.potentialAmount).toLocaleString()} €
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {lead.probability && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500"
                                style={{ width: `${lead.probability}%` }}
                              />
                            </div>
                            <span className="text-sm">{lead.probability}%</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                          {lead.status === "ordre" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                convertToClientMutation.mutate({ leadId: lead.id })
                              }
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Dialog détails lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedLead.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedLead.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                  <p className="font-medium">{selectedLead.company || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Poste</p>
                  <p className="font-medium">{selectedLead.position || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potentiel</p>
                  <p className="font-medium text-orange-500">
                    {selectedLead.potentialAmount
                      ? `${parseFloat(selectedLead.potentialAmount).toLocaleString()} €`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Probabilité</p>
                  <p className="font-medium">{selectedLead.probability || 0}%</p>
                </div>
              </div>
              {selectedLead.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{selectedLead.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer email
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Créer devis
                </Button>
                {selectedLead.status === "ordre" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      convertToClientMutation.mutate({ leadId: selectedLead.id });
                      setSelectedLead(null);
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Convertir en client
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
