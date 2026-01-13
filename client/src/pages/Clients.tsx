import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Mail, Phone, Building, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);
  const [avatarImageData, setAvatarImageData] = useState<{ data: string; mimeType: string } | null>(null);
  
  const utils = trpc.useUtils();
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Client créé avec succès");
      setIsDialogOpen(false);
      utils.clients.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateClient = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client modifié avec succès");
      setIsDialogOpen(false);
      setEditingClient(null);
      utils.clients.list.invalidate();
    },
    onError: () => toast.error("Erreur lors de la modification"),
  });

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client supprimé");
      utils.clients.list.invalidate();
      utils.stats.get.invalidate();
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const generateInvitation = trpc.clientAuth.generateInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation envoyée avec succès");
      // Copier le lien dans le presse-papier
      navigator.clipboard.writeText(data.invitationUrl);
      toast.info("Lien d'invitation copié dans le presse-papier");
    },
    onError: () => toast.error("Erreur lors de l'envoi de l'invitation"),
  });

  const handleInviteClient = (client: any) => {
    if (!client.email) {
      toast.error("Le client n'a pas d'email");
      return;
    }
    if (confirm(`Envoyer une invitation à ${client.email} ?`)) {
      generateInvitation.mutate({
        clientId: client.id,
        email: client.email,
      });
    }
  };

  const uploadAvatar = trpc.upload.uploadClientAvatar.useMutation();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let avatarUrl = editingClient?.avatarUrl || null;
    
    if (avatarImageData) {
      try {
        const result = await uploadAvatar.mutateAsync({
          clientId: editingClient?.id || 0,
          imageData: avatarImageData.data,
          mimeType: avatarImageData.mimeType,
        });
        avatarUrl = result.url;
      } catch (error) {
        toast.error("Erreur lors de l'upload de l'avatar");
        return;
      }
    }
    
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      company: (formData.get("company") as string) || null,
      position: (formData.get("position") as string) || null,
      address: (formData.get("address") as string) || null,
      postalCode: (formData.get("postalCode") as string) || null,
      city: (formData.get("city") as string) || null,
      country: (formData.get("country") as string) || "France",
      category: (formData.get("category") as any) || "prospect",
      status: "active" as const,
      notes: (formData.get("notes") as string) || null,
      avatarUrl,
    };

    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, data });
    } else {
      createClient.mutate(data);
    }
    setUploadedAvatarUrl(null);
    setAvatarImageData(null);
  };

  const filteredClients = clients?.filter((client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.firstName?.toLowerCase().includes(query) ||
      client.lastName?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.company?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Gérez vos clients et prospects</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingClient(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Modifier le client" : "Créer un nouveau client"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Photo de profil</Label>
                  <ImageUpload
                    currentImageUrl={uploadedAvatarUrl || editingClient?.avatarUrl}
                    onUpload={async (imageData: string, mimeType: string) => {
                      setAvatarImageData({ data: imageData, mimeType });
                      return { url: imageData };
                    }}
                    label="Choisir une photo"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input 
                      id="firstName" 
                      name="firstName" 
                      defaultValue={editingClient?.firstName}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input 
                      id="lastName" 
                      name="lastName" 
                      defaultValue={editingClient?.lastName}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      defaultValue={editingClient?.email || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      defaultValue={editingClient?.phone || ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise</Label>
                    <Input 
                      id="company" 
                      name="company" 
                      defaultValue={editingClient?.company || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste</Label>
                    <Input 
                      id="position" 
                      name="position" 
                      defaultValue={editingClient?.position || ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    defaultValue={editingClient?.address || ""}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code Postal</Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode" 
                      defaultValue={editingClient?.postalCode || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      defaultValue={editingClient?.city || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input 
                      id="country" 
                      name="country" 
                      defaultValue={editingClient?.country || "France"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select name="category" defaultValue={editingClient?.category || "prospect"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    rows={3} 
                    defaultValue={editingClient?.notes || ""}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingClient(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createClient.isPending || updateClient.isPending}
                  >
                    {createClient.isPending || updateClient.isPending 
                      ? "Enregistrement..." 
                      : editingClient ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredClients && filteredClients.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 border-2 shrink-0">
                        {client.avatarUrl ? (
                          <img src={client.avatarUrl} alt={`${client.firstName} ${client.lastName}`} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-sm font-medium">
                            {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="truncate">
                        {client.firstName} {client.lastName}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                        client.category === "vip"
                          ? "bg-purple-100 text-purple-700"
                          : client.category === "active"
                          ? "bg-green-100 text-green-700"
                          : client.category === "prospect"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {client.category}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.company && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{client.company}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingClient(client);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    {client.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleInviteClient(client)}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Inviter
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Supprimer ${client.firstName} ${client.lastName} ?`)) {
                          deleteClient.mutate({ id: client.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Aucun client trouvé"
                  : "Aucun client pour le moment. Créez votre premier client !"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
