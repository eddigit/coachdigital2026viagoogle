import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Database,
  Server,
  Mail,
  Key,
  FolderOpen,
  MoreHorizontal,
} from "lucide-react";

interface ProjectSecretsProps {
  projectId: number;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  database: { label: "Base de données", icon: Database, color: "bg-blue-500" },
  hosting: { label: "Hébergement", icon: Server, color: "bg-green-500" },
  smtp: { label: "SMTP / Email", icon: Mail, color: "bg-purple-500" },
  api: { label: "API Keys", icon: Key, color: "bg-orange-500" },
  ftp: { label: "FTP / SFTP", icon: FolderOpen, color: "bg-cyan-500" },
  other: { label: "Autres", icon: MoreHorizontal, color: "bg-gray-500" },
};

export default function ProjectSecrets({ projectId }: ProjectSecretsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<any>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<number, string>>({});
  const [loadingReveal, setLoadingReveal] = useState<number | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    category: "other" as "database" | "hosting" | "smtp" | "api" | "ftp" | "other",
    name: "",
    value: "",
    description: "",
  });
  const [importContent, setImportContent] = useState("");
  const [importCategory, setImportCategory] = useState<"database" | "hosting" | "smtp" | "api" | "ftp" | "other">("other");

  // Queries et mutations
  const { data: secrets, refetch } = trpc.projectSecrets.list.useQuery({ projectId });
  const createMutation = trpc.projectSecrets.create.useMutation();
  const updateMutation = trpc.projectSecrets.update.useMutation();
  const deleteMutation = trpc.projectSecrets.delete.useMutation();
  const importMutation = trpc.projectSecrets.import.useMutation();
  const revealMutation = trpc.projectSecrets.reveal.useMutation();
  const { refetch: refetchExport } = trpc.projectSecrets.export.useQuery(
    { projectId },
    { enabled: false }
  );

  // Révéler un secret
  const handleReveal = async (secretId: number) => {
    if (revealedSecrets[secretId]) {
      // Masquer
      setRevealedSecrets((prev) => {
        const newState = { ...prev };
        delete newState[secretId];
        return newState;
      });
    } else {
      // Révéler
      setLoadingReveal(secretId);
      try {
        const result = await revealMutation.mutateAsync({ id: secretId });
        if (result) {
          setRevealedSecrets((prev) => ({ ...prev, [secretId]: result.value }));
        }
      } catch (error) {
        toast.error("Impossible de révéler le secret");
      }
      setLoadingReveal(null);
    }
  };

  // Copier dans le presse-papier
  const handleCopy = async (secretId: number) => {
    const value = revealedSecrets[secretId];
    if (value) {
      await navigator.clipboard.writeText(value);
      toast.success("Valeur copiée dans le presse-papier");
    } else {
      // Révéler d'abord puis copier
      try {
        const result = await revealMutation.mutateAsync({ id: secretId });
        if (result) {
          await navigator.clipboard.writeText(result.value);
          toast.success("Valeur copiée dans le presse-papier");
        }
      } catch {
        toast.error("Impossible de copier");
      }
    }
  };

  // Créer ou mettre à jour
  const handleSubmit = async () => {
    try {
      if (editingSecret) {
        await updateMutation.mutateAsync({
          id: editingSecret.id,
          ...formData,
        });
        toast.success("Secret mis à jour");
      } else {
        await createMutation.mutateAsync({
          projectId,
          ...formData,
        });
        toast.success("Secret créé");
      }
      setIsAddDialogOpen(false);
      setEditingSecret(null);
      setFormData({ category: "other", name: "", value: "", description: "" });
      refetch();
    } catch (error) {
      toast.error("Impossible de sauvegarder");
    }
  };

  // Supprimer
  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce secret ?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Secret supprimé");
      refetch();
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  // Exporter en .env
  const handleExport = async () => {
    const result = await refetchExport();
    if (result.data) {
      const blob = new Blob([result.data.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Fichier ${result.data.filename} téléchargé`);
    }
  };

  // Importer depuis .env
  const handleImport = async () => {
    try {
      const result = await importMutation.mutateAsync({
        projectId,
        content: importContent,
        category: importCategory,
      });
      toast.success(`${result.imported} variable(s) importée(s)`);
      setIsImportDialogOpen(false);
      setImportContent("");
      refetch();
    } catch {
      toast.error("Impossible d'importer");
    }
  };

  // Ouvrir le formulaire d'édition
  const openEdit = (secret: any) => {
    setEditingSecret(secret);
    setFormData({
      category: secret.category,
      name: secret.name,
      value: "", // Ne pas pré-remplir la valeur pour sécurité
      description: secret.description || "",
    });
    setIsAddDialogOpen(true);
  };

  // Grouper les secrets par catégorie
  const secretsByCategory = secrets?.reduce((acc, secret) => {
    if (!acc[secret.category]) acc[secret.category] = [];
    acc[secret.category].push(secret);
    return acc;
  }, {} as Record<string, typeof secrets>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Variables d'environnement
            </CardTitle>
            <CardDescription>
              Gérez les secrets et credentials de ce projet de manière sécurisée
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importer des variables</DialogTitle>
                  <DialogDescription>
                    Collez le contenu d'un fichier .env pour importer les variables
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Catégorie par défaut</Label>
                    <Select value={importCategory} onValueChange={(v: any) => setImportCategory(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contenu .env</Label>
                    <Textarea
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      placeholder="DB_HOST=localhost&#10;DB_USER=root&#10;DB_PASSWORD=secret"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button onClick={handleImport} className="w-full">
                    Importer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter .env
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingSecret(null);
                setFormData({ category: "other", name: "", value: "", description: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingSecret ? "Modifier" : "Ajouter"} une variable</DialogTitle>
                  <DialogDescription>
                    Les valeurs sont chiffrées et stockées de manière sécurisée
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v: any) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon }]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nom de la variable</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                      placeholder="DB_HOST"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <Input
                      type="password"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={editingSecret ? "Laisser vide pour ne pas modifier" : "Valeur secrète"}
                    />
                  </div>
                  <div>
                    <Label>Description (optionnel)</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de cette variable"
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingSecret ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!secrets || secrets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune variable d'environnement</p>
            <p className="text-sm">Ajoutez des secrets pour ce projet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(secretsByCategory || {}).map(([category, categorySecrets]) => {
              const { label, icon: Icon, color } = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-1.5 rounded ${color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-medium">{label}</h3>
                    <Badge variant="secondary">{categorySecrets?.length}</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Variable</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead className="w-[200px]">Description</TableHead>
                        <TableHead className="w-[150px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categorySecrets?.map((secret: any) => (
                        <TableRow key={secret.id}>
                          <TableCell className="font-mono font-medium">{secret.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {revealedSecrets[secret.id] || "••••••••••••"}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleReveal(secret.id)}
                                disabled={loadingReveal === secret.id}
                              >
                                {revealedSecrets[secret.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {secret.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopy(secret.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(secret)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(secret.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
