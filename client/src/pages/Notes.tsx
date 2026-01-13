import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pin, Trash2, Edit, Search } from "lucide-react";
import { toast } from "sonner";

export default function Notes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "yellow" as "yellow" | "blue" | "green" | "red" | "purple" | "orange",
    pinned: false,
  });

  const { data: notes = [], refetch } = trpc.notes.list.useQuery();
  const createMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      setNewNote({ title: "", content: "", color: "yellow", pinned: false });
      toast.success("Note créée avec succès");
    },
  });
  const updateMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingNote(null);
      toast.success("Note mise à jour");
    },
  });
  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Note supprimée");
    },
  });
  const togglePinMutation = trpc.notes.togglePin.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const colorClasses = {
    yellow: "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700",
    blue: "bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700",
    green: "bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700",
    red: "bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700",
    purple: "bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700",
    orange: "bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700",
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const regularNotes = filteredNotes.filter((n) => !n.pinned);

  const handleCreate = () => {
    createMutation.mutate(newNote);
  };

  const handleUpdate = () => {
    if (!editingNote) return;
    updateMutation.mutate({
      id: editingNote.id,
      title: editingNote.title,
      content: editingNote.content,
      color: editingNote.color,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleTogglePin = (id: number, pinned: boolean) => {
    togglePinMutation.mutate({ id, pinned: !pinned });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notes</h1>
            <p className="text-muted-foreground">Organisez vos idées et informations importantes</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="Titre de la note"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Contenu</Label>
                  <Textarea
                    id="content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Contenu de la note..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <Select
                    value={newNote.color}
                    onValueChange={(value: any) => setNewNote({ ...newNote, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">🟡 Jaune</SelectItem>
                      <SelectItem value="blue">🔵 Bleu</SelectItem>
                      <SelectItem value="green">🟢 Vert</SelectItem>
                      <SelectItem value="red">🔴 Rouge</SelectItem>
                      <SelectItem value="purple">🟣 Violet</SelectItem>
                      <SelectItem value="orange">🟠 Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Créer la note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Pin className="h-5 w-5" />
              Notes épinglées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinnedNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`${colorClasses[note.color as keyof typeof colorClasses]} border-2 hover:shadow-lg transition-shadow`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{note.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTogglePin(note.id, note.pinned)}
                        >
                          <Pin className={`h-4 w-4 ${note.pinned ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap line-clamp-6">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Notes */}
        {regularNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Toutes les notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regularNotes.map((note) => (
                <Card
                  key={note.id}
                  className={`${colorClasses[note.color as keyof typeof colorClasses]} border-2 hover:shadow-lg transition-shadow`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{note.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTogglePin(note.id, note.pinned)}
                        >
                          <Pin className={`h-4 w-4 ${note.pinned ? "fill-current" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap line-clamp-6">{note.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune note trouvée</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la note</DialogTitle>
            </DialogHeader>
            {editingNote && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Titre</Label>
                  <Input
                    id="edit-title"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">Contenu</Label>
                  <Textarea
                    id="edit-content"
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-color">Couleur</Label>
                  <Select
                    value={editingNote.color}
                    onValueChange={(value: any) => setEditingNote({ ...editingNote, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">🟡 Jaune</SelectItem>
                      <SelectItem value="blue">🔵 Bleu</SelectItem>
                      <SelectItem value="green">🟢 Vert</SelectItem>
                      <SelectItem value="red">🔴 Rouge</SelectItem>
                      <SelectItem value="purple">🟣 Violet</SelectItem>
                      <SelectItem value="orange">🟠 Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdate} className="w-full">
                  Enregistrer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
