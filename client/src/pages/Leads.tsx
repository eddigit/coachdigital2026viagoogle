import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Plus,
  Search,
  List,
  LayoutGrid,
  Kanban,
  Mail,
  Phone,
  Building2,
  Euro,
  Calendar,
  UserCheck,
  Filter,
  TrendingUp,
  Upload,
  Send,
  CheckSquare,
  Download,
  Users,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import Papa from "papaparse";
import { ExportButton } from "@/components/ExportCSV";

type ViewMode = "list" | "cards" | "kanban";
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

export default function Leads() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBulkEmailDialogOpen, setIsBulkEmailDialogOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isAudienceDialogOpen, setIsAudienceDialogOpen] = useState(false);

  const handleOpenEmailDialog = (lead: any) => {
    setSelectedLead(lead);
    setIsEmailDialogOpen(true);
  };

  const { data: leads = [], refetch } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.getStats.useQuery();
  const { data: audiences = [] } = trpc.audiences.list.useQuery();
  const updateStatusMutation = trpc.leads.updateStatus.useMutation();
  const convertToClientMutation = trpc.leads.convertToClient.useMutation();
  const assignAudienceMutation = trpc.audiences.assignToLeads.useMutation();
  const changePhaseForLeadsMutation = trpc.audiences.changePhaseForLeads.useMutation();

  // Extraire les audiences et sources uniques
  const uniqueAudiences = Array.from(new Set(leads.map((l: any) => l.audience || "general").filter(Boolean)));
  const uniqueSources = Array.from(new Set(leads.map((l: any) => l.source).filter(Boolean)));

  // Filtrer les leads
  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch =
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesAudience = audienceFilter === "all" || (lead.audience || "general") === audienceFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesAudience && matchesSource;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Grouper les leads par statut pour le Kanban (SPANCO)
  const leadsByStatus: Record<LeadStatus, any[]> = {
    suspect: filteredLeads.filter((l) => l.status === "suspect"),
    prospect: filteredLeads.filter((l) => l.status === "prospect"),
    analyse: filteredLeads.filter((l) => l.status === "analyse"),
    negociation: filteredLeads.filter((l) => l.status === "negociation"),
    conclusion: filteredLeads.filter((l) => l.status === "conclusion"),
    ordre: filteredLeads.filter((l) => l.status === "ordre"),
  };

  // Gérer le drag & drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const leadId = parseInt(draggableId);
    const newStatus = destination.droppableId as LeadStatus;

    try {
      await updateStatusMutation.mutateAsync({ id: leadId, status: newStatus });
      toast.success(`Lead déplacé vers ${STATUS_LABELS[newStatus]}`);
      refetch();
    } catch (error) {
      toast.error("Erreur lors du déplacement du lead");
    }
  };

  // Gérer la sélection multiple
  const handleToggleSelect = (leadId: number) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    }
  };

  // Convertir un lead en client
  const handleConvertToClient = async (leadId: number) => {
    try {
      await convertToClientMutation.mutateAsync({ leadId });
      toast.success("Lead converti en client avec succès !");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la conversion");
    }
  };

  // Actions en masse - Assigner une audience
  const handleBulkAssignAudience = async (audienceName: string) => {
    if (selectedLeads.length === 0) {
      toast.error("Aucun lead sélectionné");
      return;
    }
    try {
      await assignAudienceMutation.mutateAsync({ audienceName, leadIds: selectedLeads });
      toast.success(`${selectedLeads.length} lead(s) assigné(s) à l'audience "${audienceName}"`);
      setSelectedLeads([]);
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'assignation");
    }
  };

  // Actions en masse - Changer la phase
  const handleBulkChangePhase = async (status: LeadStatus) => {
    if (selectedLeads.length === 0) {
      toast.error("Aucun lead sélectionné");
      return;
    }
    try {
      await changePhaseForLeadsMutation.mutateAsync({ status, leadIds: selectedLeads });
      toast.success(`${selectedLeads.length} lead(s) déplacé(s) vers "${STATUS_LABELS[status]}"`);
      setSelectedLeads([]);
      refetch();
    } catch (error) {
      toast.error("Erreur lors du changement de phase");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Prospection</h1>
            <p className="text-muted-foreground">Pipeline de vente et gestion des leads</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importer des leads depuis un CSV</DialogTitle>
                  <DialogDescription>
                    Uploadez un fichier CSV avec les colonnes : firstName, lastName, email, phone, company, position
                  </DialogDescription>
                </DialogHeader>
                <ImportCSVForm onSuccess={() => { setIsImportDialogOpen(false); refetch(); }} />
              </DialogContent>
            </Dialog>

            <Dialog open={isBulkEmailDialogOpen} onOpenChange={setIsBulkEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={selectedLeads.length === 0}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoi de masse ({selectedLeads.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Envoi de masse d'emails</DialogTitle>
                  <DialogDescription>
                    Envoyer un email à {selectedLeads.length} leads sélectionnés (limite : 500/jour)
                  </DialogDescription>
                </DialogHeader>
                <BulkEmailForm
                  leadIds={selectedLeads}
                  onSuccess={() => {
                    setIsBulkEmailDialogOpen(false);
                    setSelectedLeads([]);
                    refetch();
                  }}
                />
              </DialogContent>
            </Dialog>

            {/* Menu Actions en masse */}
            {selectedLeads.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions ({selectedLeads.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions en masse</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Tag className="h-4 w-4 mr-2" />
                      Assigner une audience
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {audiences.map((audience: any) => (
                        <DropdownMenuItem
                          key={audience.id}
                          onClick={() => handleBulkAssignAudience(audience.name)}
                        >
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: audience.color }}
                          />
                          {audience.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Changer la phase
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {STATUS_ORDER.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleBulkChangePhase(status)}
                        >
                          <span className={`w-3 h-3 rounded-full mr-2 ${STATUS_COLORS[status]}`} />
                          {STATUS_LABELS[status]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ExportButton type="leads" label="Exporter" />

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un lead
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un Lead</DialogTitle>
                <DialogDescription>Créer un nouveau prospect dans le pipeline</DialogDescription>
              </DialogHeader>
              <AddLeadForm onSuccess={() => { setIsAddDialogOpen(false); refetch(); }} />
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Convertis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Potentiel Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPotential.toFixed(0)} €</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Potentiel Pondéré</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.weightedPotential.toFixed(0)} €</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres et modes d'affichage */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les phases</SelectItem>
              <SelectItem value="suspect">Suspect</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="analyse">Analyse</SelectItem>
              <SelectItem value="negociation">Négociation</SelectItem>
              <SelectItem value="conclusion">Conclusion</SelectItem>
              <SelectItem value="ordre">Prise d'Ordre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={audienceFilter} onValueChange={setAudienceFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les audiences</SelectItem>
              {audiences.map((audience: any) => (
                <SelectItem key={audience.id} value={audience.name}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: audience.color }}
                    />
                    {audience.name}
                  </div>
                </SelectItem>
              ))}
              {/* Ajouter les audiences uniques des leads qui ne sont pas dans la table audiences */}
              {uniqueAudiences.filter((a: string) => !audiences.some((aud: any) => aud.name === a)).map((audience: string) => (
                <SelectItem key={audience} value={audience}>
                  {audience === "general" ? "Général" : audience}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              {uniqueSources.map((source: string) => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Compteur et pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredLeads.length} lead{filteredLeads.length > 1 ? "s" : ""} trouvé{filteredLeads.length > 1 ? "s" : ""}
            {audienceFilter !== "all" && ` dans l'audience "${audienceFilter}"`}
            {statusFilter !== "all" && ` en phase "${STATUS_LABELS[statusFilter as LeadStatus]}"`}
          </span>
          {totalPages > 1 && viewMode === "list" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span>Page {currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>

        {/* Affichage selon le mode */}
        {viewMode === "list" && (
          <ListView
            leads={paginatedLeads}
            onConvert={handleConvertToClient}
            onRefetch={refetch}
            onSendEmail={handleOpenEmailDialog}
            selectedLeads={selectedLeads}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
        )}
        {viewMode === "cards" && <CardsView leads={filteredLeads} onConvert={handleConvertToClient} onRefetch={refetch} onSendEmail={handleOpenEmailDialog} />}
        {viewMode === "kanban" && (
          <KanbanView
            leadsByStatus={leadsByStatus}
            onDragEnd={handleDragEnd}
            onConvert={handleConvertToClient}
            onRefetch={refetch}
            onSendEmail={handleOpenEmailDialog}
            onEdit={(lead) => {
              setEditingLead(lead);
              setIsEditDialogOpen(true);
            }}
          />
        )}

        {/* Dialog d'envoi d'email */}
        {selectedLead && (
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Envoyer un email à {selectedLead.firstName} {selectedLead.lastName}</DialogTitle>
                <DialogDescription>{selectedLead.email}</DialogDescription>
              </DialogHeader>
              <SendEmailForm
                lead={selectedLead}
                onSuccess={() => {
                  setIsEmailDialogOpen(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog d'édition */}
        {editingLead && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le lead</DialogTitle>
                <DialogDescription>
                  {editingLead.firstName} {editingLead.lastName} - {editingLead.company || "Sans entreprise"}
                </DialogDescription>
              </DialogHeader>
              <EditLeadForm
                lead={editingLead}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setEditingLead(null);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

// Composant ListView
function ListView({ leads, onConvert, onRefetch, onSendEmail, selectedLeads, onToggleSelect, onToggleSelectAll }: { leads: any[]; onConvert: (id: number) => void; onRefetch: () => void; onSendEmail: (lead: any) => void; selectedLeads: number[]; onToggleSelect: (id: number) => void; onToggleSelectAll: () => void; }) {
  return (
    <Card className="max-w-full overflow-x-hidden">
      <CardContent className="p-0 max-w-full overflow-x-auto">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-max">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onChange={onToggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Entreprise</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Téléphone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Potentiel</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Probabilité</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => onToggleSelect(lead.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                    {lead.position && <div className="text-sm text-muted-foreground">{lead.position}</div>}
                  </td>
                  <td className="px-4 py-3">{lead.company || "-"}</td>
                  <td className="px-4 py-3">{lead.email || "-"}</td>
                  <td className="px-4 py-3">{lead.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${STATUS_COLORS[lead.status as LeadStatus]}`}>
                      {STATUS_LABELS[lead.status as LeadStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{lead.potentialAmount ? `${parseFloat(lead.potentialAmount).toFixed(0)} €` : "-"}</td>
                  <td className="px-4 py-3">{lead.probability}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onSendEmail(lead)} disabled={!lead.email}>
                        <Mail className="h-3 w-3" />
                      </Button>
                      {lead.status === "conclusion" && !lead.convertedToClientId && (
                        <Button size="sm" onClick={() => onConvert(lead.id)}>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Convertir
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant CardsView
function CardsView({ leads, onConvert, onRefetch, onSendEmail }: { leads: any[]; onConvert: (id: number) => void; onRefetch: () => void; onSendEmail: (lead: any) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
      {leads.map((lead) => (
        <Card key={lead.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{lead.firstName} {lead.lastName}</CardTitle>
                <CardDescription>{lead.position || "Position non spécifiée"}</CardDescription>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${STATUS_COLORS[lead.status as LeadStatus]}`}>
                {STATUS_LABELS[lead.status as LeadStatus]}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{lead.company}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.potentialAmount && (
              <div className="flex items-center gap-2 text-sm">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{parseFloat(lead.potentialAmount).toFixed(0)} € ({lead.probability}%)</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onSendEmail(lead)} disabled={!lead.email}>
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
              {lead.status === "conclusion" && !lead.convertedToClientId && (
                <Button size="sm" className="flex-1" onClick={() => onConvert(lead.id)}>
                  <UserCheck className="h-3 w-3 mr-1" />
                  Convertir
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Composant KanbanView
function KanbanView({
  leadsByStatus,
  onDragEnd,
  onConvert,
  onRefetch,
  onSendEmail,
  onEdit,
}: {
  leadsByStatus: Record<LeadStatus, any[]>;
  onDragEnd: (result: DropResult) => void;
  onConvert: (id: number) => void;
  onRefetch: () => void;
  onSendEmail: (lead: any) => void;
  onEdit: (lead: any) => void;
}) {
  const statuses: LeadStatus[] = ["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-full overflow-x-auto pb-4">
        {statuses.map((status) => (
          <div key={status} className="flex flex-col">
            <div className="mb-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {leadsByStatus[status].length}
                </span>
              </div>
            </div>
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 space-y-2 p-2 rounded-lg border-2 border-dashed min-h-[500px] ${
                    snapshot.isDraggingOver ? "bg-blue-50 border-blue-300" : "bg-muted/20 border-muted"
                  }`}
                >
                  {leadsByStatus[status].map((lead, index) => (
                    <Draggable key={lead.id} draggableId={String(lead.id)} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onEdit(lead)}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? "shadow-lg rotate-2" : ""
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-sm">
                                  {lead.firstName} {lead.lastName}
                                </CardTitle>
                                {lead.company && (
                                  <CardDescription className="text-xs">{lead.company}</CardDescription>
                                )}
                              </div>
                              {/* Badge de score d'engagement */}
                              {lead.score !== undefined && lead.score !== null && (
                                <div
                                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    lead.score >= 70
                                      ? "bg-green-100 text-green-700"
                                      : lead.score >= 40
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                  title="Score d'engagement basé sur les ouvertures et clics d'emails"
                                >
                                  {lead.score}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-xs">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            )}
                            {lead.potentialAmount && (
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{parseFloat(lead.potentialAmount).toFixed(0)} €</span>
                                <span className="text-muted-foreground">{lead.probability}%</span>
                              </div>
                            )}
                            {status === "conclusion" && !lead.convertedToClientId && (
                              <Button
                                size="sm"
                                className="w-full mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onConvert(lead.id);
                                }}
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Convertir en client
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

// Composant AddLeadForm
function AddLeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    address: "",
    postalCode: "",
    city: "",
    country: "France",
    status: "suspect" as LeadStatus,
    potentialAmount: "",
    probability: "25",
    source: "",
    notes: "",
  });

  const createMutation = trpc.leads.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        ...formData,
        potentialAmount: formData.potentialAmount ? parseFloat(formData.potentialAmount) : undefined,
        probability: parseInt(formData.probability),
      });
      toast.success("Lead créé avec succès !");
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de la création du lead");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Entreprise</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="position">Poste</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suspect">Suspect</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="analyse">Analyse</SelectItem>
              <SelectItem value="negociation">Négociation</SelectItem>
              <SelectItem value="conclusion">Conclusion</SelectItem>
              <SelectItem value="ordre">Prise d'Ordre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            placeholder="LinkedIn, Référence, Site web..."
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="potentialAmount">Montant potentiel (€)</Label>
          <Input
            id="potentialAmount"
            type="number"
            value={formData.potentialAmount}
            onChange={(e) => setFormData({ ...formData, potentialAmount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="probability">Probabilité (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Création..." : "Créer le lead"}
        </Button>
      </div>
    </form>
  );
}

// Composant SendEmailForm
function SendEmailForm({ lead, onSuccess }: { lead: any; onSuccess: () => void }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: templates = [] } = trpc.emailTemplates.list.useQuery();
  const sendEmailMutation = trpc.leads.sendEmail.useMutation();

  const handleTemplateChange = (templateId: string) => {
    const id = parseInt(templateId);
    setSelectedTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendEmailMutation.mutateAsync({
        leadId: lead.id,
        templateId: selectedTemplateId || undefined,
        subject,
        body,
      });
      toast.success("Email envoyé avec succès !");
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'email");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template">Template d'email</Label>
        <Select value={selectedTemplateId?.toString() || ""} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Les variables {"{{firstName}}"} seront remplacées automatiquement
        </p>
      </div>

      <div>
        <Label htmlFor="subject">Objet</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={sendEmailMutation.isPending}>
          {sendEmailMutation.isPending ? "Envoi en cours..." : "Envoyer l'email"}
        </Button>
      </div>
    </form>
  );
}

// Composant ImportCSVForm - Optimisé pour 30 000 contacts
function ImportCSVForm({ onSuccess }: { onSuccess: () => void }) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
    total: number;
  } | null>(null);
  const importMutation = trpc.leads.importFromCSV.useMutation();

  const CHUNK_SIZE = 5000; // Envoyer par chunks de 5000 pour éviter les timeouts

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProgress(0);
    setImportStats(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filtrer les lignes vides
        const validData = results.data.filter((row: any) => 
          row.firstName || row.prenom || row.lastName || row.nom || row.email
        );
        setCsvData(validData);
        setPreview(validData.slice(0, 5));
        toast.success(`${validData.length} contacts détectés dans le fichier`);
      },
      error: (error) => {
        toast.error(`Erreur de parsing CSV: ${error.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;

    setIsImporting(true);
    setProgress(0);
    setImportStats(null);

    const totalStats = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      total: csvData.length,
    };

    const totalChunks = Math.ceil(csvData.length / CHUNK_SIZE);

    try {
      for (let i = 0; i < csvData.length; i += CHUNK_SIZE) {
        const chunk = csvData.slice(i, i + CHUNK_SIZE);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;

        const result = await importMutation.mutateAsync({
          leads: chunk.map((row: any) => ({
            firstName: row.firstName || row.prenom || "",
            lastName: row.lastName || row.nom || "",
            email: row.email || "",
            phone: row.phone || row.telephone || "",
            company: row.company || row.entreprise || "",
            position: row.position || row.poste || "",
            status: "suspect" as const,
            potentialAmount: parseFloat(row.potentialAmount || row.montant || "0") || undefined,
            probability: parseInt(row.probability || row.probabilite || "25") || 25,
            source: row.source || "Import CSV",
            notes: row.notes || "",
          })),
        });

        totalStats.imported += result.imported;
        totalStats.duplicates += result.duplicates;
        totalStats.errors += result.errors;

        const progressPercent = Math.round((chunkNumber / totalChunks) * 100);
        setProgress(progressPercent);
        setImportStats({ ...totalStats });
      }

      toast.success(
        `Import terminé : ${totalStats.imported} leads importés, ${totalStats.duplicates} doublons ignorés, ${totalStats.errors} erreurs`
      );
      onSuccess();
    } catch (error) {
      toast.error("Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="csv-file">Fichier CSV (jusqu'à 30 000 contacts)</Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isImporting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Colonnes attendues : firstName/prenom, lastName/nom, email, phone/telephone, company/entreprise, position/poste
        </p>
      </div>

      {preview.length > 0 && (
        <div>
          <Label>Prévisualisation ({csvData.length.toLocaleString()} contacts)</Label>
          <div className="mt-2 border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Prénom</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Entreprise</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{row.firstName || row.prenom}</td>
                    <td className="px-4 py-2">{row.lastName || row.nom}</td>
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2">{row.company || row.entreprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvData.length > 5 && (
            <p className="text-xs text-muted-foreground mt-1">
              ... et {(csvData.length - 5).toLocaleString()} autres contacts
            </p>
          )}
        </div>
      )}

      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Import en cours...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          {importStats && (
            <div className="text-xs text-muted-foreground">
              Importés: {importStats.imported.toLocaleString()} | 
              Doublons: {importStats.duplicates.toLocaleString()} | 
              Erreurs: {importStats.errors}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          onClick={handleImport}
          disabled={csvData.length === 0 || isImporting}
        >
          {isImporting 
            ? `Import en cours... ${progress}%` 
            : `Importer ${csvData.length.toLocaleString()} leads`}
        </Button>
      </div>
    </div>
  );
}

// Composant BulkEmailForm
function BulkEmailForm({ leadIds, onSuccess }: { leadIds: number[]; onSuccess: () => void }) {
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: templates = [] } = trpc.emailTemplates.list.useQuery();
  const createCampaignMutation = trpc.leads.createBulkCampaign.useMutation();
  const sendCampaignMutation = trpc.leads.sendCampaign.useMutation();

  const handleTemplateChange = (templateId: string) => {
    const id = parseInt(templateId);
    setSelectedTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Créer la campagne
      const campaign = await createCampaignMutation.mutateAsync({
        name: campaignName,
        templateId: selectedTemplateId || undefined,
        subject,
        body,
        leadIds,
      });

      toast.success(`Campagne créée : ${campaign.totalQueued} emails en file d'attente`);

      // Lancer l'envoi
      const result = await sendCampaignMutation.mutateAsync({
        campaignId: campaign.campaignId as number,
      });

      toast.success(`Envoi terminé : ${result.sentCount} envoyés, ${result.failedCount} échecs`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="campaign-name">Nom de la campagne</Label>
        <Input
          id="campaign-name"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="Ex: Vœux 2026 - Avocats Paris"
          required
        />
      </div>

      <div>
        <Label htmlFor="template">Template d'email</Label>
        <Select value={selectedTemplateId?.toString() || ""} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Objet</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Les variables {"{{firstName}}"} seront remplacées automatiquement
        </p>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <p className="text-sm">
          <strong>{leadIds.length}</strong> leads sélectionnés
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Limite Gmail : 500 emails/jour
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={createCampaignMutation.isPending || sendCampaignMutation.isPending}
        >
          {createCampaignMutation.isPending || sendCampaignMutation.isPending
            ? "Envoi en cours..."
            : "Créer et envoyer la campagne"}
        </Button>
      </div>
    </form>
  );
}

// Composant EditLeadForm
function EditLeadForm({ lead, onSuccess }: { lead: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "",
    position: lead.position || "",
    address: lead.address || "",
    postalCode: lead.postalCode || "",
    city: lead.city || "",
    country: lead.country || "France",
    status: lead.status || "suspect",
    potentialAmount: lead.potentialAmount || "",
    probability: lead.probability?.toString() || "25",
    source: lead.source || "",
    notes: lead.notes || "",
    nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toISOString().split("T")[0] : "",
  });

  const updateMutation = trpc.leads.update.useMutation();
  const deleteMutation = trpc.leads.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: lead.id,
        ...formData,
        potentialAmount: formData.potentialAmount ? parseFloat(formData.potentialAmount) : undefined,
        probability: parseInt(formData.probability),
        nextFollowUpDate: formData.nextFollowUpDate || undefined,
      });
      toast.success("Lead modifié avec succès");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce lead (${lead.firstName} ${lead.lastName}) ?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: lead.id });
      toast.success("Lead supprimé avec succès");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Entreprise</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="position">Poste</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="suspect">Suspect</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="analyse">Analyse</SelectItem>
              <SelectItem value="negociation">Négociation</SelectItem>
              <SelectItem value="conclusion">Conclusion</SelectItem>
              <SelectItem value="ordre">Prise d'Ordre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="LinkedIn, Référence, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="potentialAmount">Montant potentiel (€)</Label>
          <Input
            id="potentialAmount"
            type="number"
            step="0.01"
            value={formData.potentialAmount}
            onChange={(e) => setFormData({ ...formData, potentialAmount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="probability">Probabilité (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="nextFollowUpDate">Prochaine relance</Label>
        <Input
          id="nextFollowUpDate"
          type="date"
          value={formData.nextFollowUpDate}
          onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notes internes sur ce lead..."
        />
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Modification..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
