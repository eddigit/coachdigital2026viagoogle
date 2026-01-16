import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Download,
  Plus,
  Users,
  Mail,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserPlus,
  Trash2,
  Eye,
  Send,
  Target,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Lead = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  audience: string | null;
  source: string | null;
  score: number;
  isActivated: boolean;
  createdAt: string;
};

export default function LeadsBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const itemsPerPage = 50;

  // Queries
  const { data: leadsData, refetch: refetchLeads } = trpc.leads.listPaginated.useQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: "all",
    audience: audienceFilter !== "all" ? audienceFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    search: searchQuery || undefined,
  });

  const { data: audiences = [] } = trpc.audiences.list.useQuery();
  const { data: filtersData } = trpc.leads.getFilters.useQuery();

  // Mutations
  const activateMutation = trpc.leads.activateToPortfolio.useMutation({
    onSuccess: () => {
      toast.success("Lead activé vers le portefeuille");
      refetchLeads();
    },
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead supprimé");
      refetchLeads();
      setSelectedLeads([]);
    },
  });

  const bulkUpdateAudienceMutation = trpc.leads.bulkUpdateAudience.useMutation({
    onSuccess: () => {
      toast.success("Audience mise à jour pour les leads sélectionnés");
      refetchLeads();
      setSelectedLeads([]);
    },
  });

  const leads = leadsData?.leads || [];
  const totalLeads = leadsData?.total || 0;
  const totalPages = Math.ceil(totalLeads / itemsPerPage);
  const uniqueSources = filtersData?.sources || [];

  // Filtrer pour n'afficher que les leads NON activés (base de leads)
  const nonActivatedLeads = leads.filter((lead: Lead) => !lead.isActivated);

  const handleSelectAll = () => {
    if (selectedLeads.length === nonActivatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(nonActivatedLeads.map((lead: Lead) => lead.id));
    }
  };

  const handleSelectLead = (leadId: number) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleActivateSelected = () => {
    selectedLeads.forEach((leadId) => {
      activateMutation.mutate({ leadId });
    });
    setSelectedLeads([]);
  };

  const handleDeleteSelected = () => {
    if (confirm(`Supprimer ${selectedLeads.length} lead(s) ?`)) {
      selectedLeads.forEach((leadId) => {
        deleteMutation.mutate({ id: leadId });
      });
    }
  };

  const handleBulkAssignAudience = (audienceName: string) => {
    bulkUpdateAudienceMutation.mutate({
      leadIds: selectedLeads,
      audience: audienceName,
    });
  };

  const getAudienceColor = (audienceName: string | null) => {
    if (!audienceName) return "#6b7280";
    const audience = audiences.find((a: any) => a.name === audienceName);
    return audience?.color || "#6b7280";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Base de Leads</h1>
          <p className="text-muted-foreground">
            Gérez vos {totalLeads.toLocaleString()} contacts par audience
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importer CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des contacts</DialogTitle>
              </DialogHeader>
              <ImportCSVForm onSuccess={() => {
                setShowImportDialog(false);
                refetchLeads();
              }} />
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nouveau lead</DialogTitle>
              </DialogHeader>
              <AddLeadForm
                audiences={audiences}
                onSuccess={() => {
                  setShowAddDialog(false);
                  refetchLeads();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Audiences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audiences.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activés (Portefeuille)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {leads.filter((l: Lead) => l.isActivated).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sélectionnés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {selectedLeads.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger className="w-48">
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
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les sources</SelectItem>
            {uniqueSources.map((source: string) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions en masse */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedLeads.length} lead(s) sélectionné(s)
          </span>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={handleActivateSelected}
          >
            <Target className="h-4 w-4 mr-2" />
            Activer vers Portefeuille
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Assigner Audience
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Envoyer Email
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      )}

      {/* Table des leads */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === nonActivatedLeads.length && nonActivatedLeads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nonActivatedLeads.map((lead: Lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </span>
                      {lead.email && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.company}</span>
                      </div>
                    )}
                    {lead.position && (
                      <span className="text-sm text-muted-foreground">
                        {lead.position}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.audience && (
                      <Badge
                        style={{
                          backgroundColor: getAudienceColor(lead.audience),
                          color: "white",
                        }}
                      >
                        {lead.audience}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.source && (
                      <span className="text-sm">{lead.source}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-sm">{lead.score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => activateMutation.mutate({ leadId: lead.id })}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Activer vers Portefeuille
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm("Supprimer ce lead ?")) {
                              deleteMutation.mutate({ id: lead.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} sur {totalPages} ({totalLeads.toLocaleString()} leads)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant Import CSV
function ImportCSVForm({ onSuccess }: { onSuccess: () => void }) {
  const [csvContent, setCsvContent] = useState("");
  const [defaultAudience, setDefaultAudience] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: audiences = [] } = trpc.audiences.list.useQuery();
  const importMutation = trpc.leads.importFromCSV.useMutation();

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast.error("Veuillez coller le contenu CSV");
      return;
    }

    setIsImporting(true);
    setProgress(0);

    const lines = csvContent.trim().split("\n");
    const chunkSize = 5000;
    const totalChunks = Math.ceil(lines.length / chunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = lines.slice(i * chunkSize, (i + 1) * chunkSize).join("\n");
        await importMutation.mutateAsync({
          csvContent: chunk,
          defaultAudience: defaultAudience || undefined,
        });
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
      toast.success("Import terminé avec succès");
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
        <Label>Audience par défaut</Label>
        <Select value={defaultAudience} onValueChange={setDefaultAudience}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une audience" />
          </SelectTrigger>
          <SelectContent>
            {audiences.map((audience: any) => (
              <SelectItem key={audience.id} value={audience.name}>
                {audience.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Contenu CSV</Label>
        <Textarea
          placeholder="Collez votre CSV ici (firstName,lastName,email,phone,company,position,source)"
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          rows={10}
        />
      </div>
      {isImporting && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center">{progress}%</p>
        </div>
      )}
      <Button
        onClick={handleImport}
        disabled={isImporting}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {isImporting ? "Import en cours..." : "Importer"}
      </Button>
    </div>
  );
}

// Composant Ajout Lead
function AddLeadForm({
  audiences,
  onSuccess,
}: {
  audiences: any[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    audience: "",
    source: "",
    notes: "",
  });

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead créé avec succès");
      onSuccess();
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Prénom *</Label>
          <Input
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>
        <div>
          <Label>Nom *</Label>
          <Input
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Téléphone</Label>
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Entreprise</Label>
          <Input
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Poste</Label>
          <Input
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Audience</Label>
          <Select
            value={formData.audience}
            onValueChange={(v) => setFormData({ ...formData, audience: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {audiences.map((audience: any) => (
                <SelectItem key={audience.id} value={audience.name}>
                  {audience.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Input
            value={formData.source}
            onChange={(e) =>
              setFormData({ ...formData, source: e.target.value })
            }
            placeholder="LinkedIn, Référence, Site web..."
          />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Création..." : "Créer le lead"}
      </Button>
    </form>
  );
}
