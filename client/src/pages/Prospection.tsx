import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Mail,
  Phone,
  Building2,
  Euro,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

type LeadStatus = "suspect" | "prospect" | "analyse" | "negociation" | "conclusion" | "ordre";

const STATUS_LABELS: Record<LeadStatus, string> = {
  suspect: "Suspect",
  prospect: "Prospect",
  analyse: "Analyse",
  negociation: "Négociation",
  conclusion: "Conclusion",
  ordre: "Prise d'Ordre",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  suspect: "bg-gray-500",
  prospect: "bg-purple-500",
  analyse: "bg-blue-500",
  negociation: "bg-yellow-500",
  conclusion: "bg-green-500",
  ordre: "bg-emerald-600",
};

const STATUS_ORDER: LeadStatus[] = ["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"];

export default function Prospection() {
  const { data: leads = [], refetch } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.getStats.useQuery();
  const updateStatusMutation = trpc.leads.updateStatus.useMutation();

  // Grouper les leads par statut pour le Kanban (SPANCO)
  const leadsByStatus: Record<LeadStatus, any[]> = {
    suspect: leads.filter((l: any) => l.status === "suspect"),
    prospect: leads.filter((l: any) => l.status === "prospect"),
    analyse: leads.filter((l: any) => l.status === "analyse"),
    negociation: leads.filter((l: any) => l.status === "negociation"),
    conclusion: leads.filter((l: any) => l.status === "conclusion"),
    ordre: leads.filter((l: any) => l.status === "ordre"),
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const leadId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId as LeadStatus;

    try {
      await updateStatusMutation.mutateAsync({ id: leadId, status: newStatus });
      refetch();
      toast.success(`Lead déplacé vers ${STATUS_LABELS[newStatus]}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du déplacement");
    }
  };

  // Calculer les statistiques par phase
  const phaseStats = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: leadsByStatus[status].length,
    value: leadsByStatus[status].reduce((sum: number, l: any) => sum + (l.estimatedValue || 0), 0),
  }));

  const totalValue = phaseStats.reduce((sum, p) => sum + p.value, 0);
  const totalLeads = leads.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Prospection SPANCO</h1>
            <p className="text-muted-foreground">Pipeline de prospection avec phases SPANCO</p>
          </div>
          <Link href="/leads">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Gérer tous les leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valeur Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalValue.toLocaleString("fr-FR")} €
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Négociation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {leadsByStatus.negociation.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conclus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {leadsByStatus.conclusion.length + leadsByStatus.ordre.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vue Kanban SPANCO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pipeline SPANCO
            </CardTitle>
            <CardDescription>
              Glissez-déposez les leads entre les phases pour mettre à jour leur statut
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 p-4 overflow-x-auto min-h-[500px]">
                {STATUS_ORDER.map((status) => (
                  <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-shrink-0 w-72 rounded-lg p-3 ${
                          snapshot.isDraggingOver ? "bg-muted/80" : "bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
                            <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
                          </div>
                          <span className="text-xs bg-background px-2 py-1 rounded-full">
                            {leadsByStatus[status].length}
                          </span>
                        </div>

                        <div className="space-y-2 min-h-[400px]">
                          {leadsByStatus[status].slice(0, 10).map((lead: any, index: number) => (
                            <Draggable
                              key={lead.id}
                              draggableId={lead.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-background p-3 rounded-lg shadow-sm border ${
                                    snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                                  }`}
                                >
                                  <div className="font-medium text-sm">
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                  {lead.company && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Building2 className="h-3 w-3" />
                                      {lead.company}
                                    </div>
                                  )}
                                  {lead.estimatedValue > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                      <Euro className="h-3 w-3" />
                                      {lead.estimatedValue.toLocaleString("fr-FR")} €
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {leadsByStatus[status].length > 10 && (
                            <div className="text-center text-xs text-muted-foreground py-2">
                              +{leadsByStatus[status].length - 10} autres leads
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </CardContent>
        </Card>

        {/* Statistiques par phase */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {phaseStats.map((phase) => (
                <div key={phase.status} className="text-center p-4 rounded-lg bg-muted/40">
                  <div className={`w-4 h-4 rounded-full ${STATUS_COLORS[phase.status]} mx-auto mb-2`} />
                  <div className="text-sm font-medium">{phase.label}</div>
                  <div className="text-2xl font-bold">{phase.count}</div>
                  <div className="text-xs text-muted-foreground">
                    {phase.value.toLocaleString("fr-FR")} €
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
