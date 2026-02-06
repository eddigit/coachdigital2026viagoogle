import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Eye, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TiptapEditor from "../components/TiptapEditor";

export default function Blog() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    status: "draft" as "draft" | "published" | "archived",
    tags: [] as string[],
    metaTitle: "",
    metaDescription: "",
  });
  const [tagInput, setTagInput] = useState("");

  const { data: posts = [], refetch } = trpc.blog.listAll.useQuery();
  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      resetNewPost();
      toast.success("Article créé avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingPost(null);
      toast.success("Article mis à jour");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Article supprimé");
    },
  });

  const resetNewPost = () => {
    setNewPost({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImageUrl: "",
      status: "draft",
      tags: [],
      metaTitle: "",
      metaDescription: "",
    });
    setTagInput("");
  };

  const handleCreate = () => {
    if (!newPost.title || !newPost.content) {
      toast.error("Titre et contenu sont obligatoires");
      return;
    }
    createMutation.mutate(newPost);
  };

  const handleUpdate = () => {
    if (!editingPost) return;
    if (!editingPost.title || !editingPost.content) {
      toast.error("Titre et contenu sont obligatoires");
      return;
    }
    updateMutation.mutate({
      id: editingPost.id,
      title: editingPost.title,
      slug: editingPost.slug,
      excerpt: editingPost.excerpt,
      content: editingPost.content,
      coverImageUrl: editingPost.coverImageUrl,
      status: editingPost.status,
      tags: editingPost.tags,
      metaTitle: editingPost.metaTitle,
      metaDescription: editingPost.metaDescription,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const addTag = (postData: any, setPostData: any) => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !postData.tags.includes(trimmedTag)) {
      setPostData({ ...postData, tags: [...postData.tags, trimmedTag] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string, postData: any, setPostData: any) => {
    setPostData({ ...postData, tags: postData.tags.filter((t: string) => t !== tag) });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      published: { variant: "success", label: "Publié" },
      archived: { variant: "outline", label: "Archivé" },
    };
    const info = variants[status] || variants.draft;
    return <Badge variant={info.variant as any}>{info.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Blog</h1>
            <p className="text-muted-foreground">Gérez vos articles de blog</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvel article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Titre de l'article"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    placeholder="slug-de-larticle (optionnel, généré automatiquement si vide)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL finale : /blog/{newPost.slug || "slug-genere-auto"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Extrait</Label>
                  <Input
                    id="excerpt"
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                    placeholder="Court résumé de l'article"
                  />
                </div>

                <div>
                  <Label htmlFor="coverImageUrl">Image de couverture (URL)</Label>
                  <Input
                    id="coverImageUrl"
                    value={newPost.coverImageUrl}
                    onChange={(e) => setNewPost({ ...newPost, coverImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="content">Contenu *</Label>
                  <TiptapEditor
                    content={newPost.content}
                    onChange={(content) => setNewPost({ ...newPost, content })}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(newPost, setNewPost);
                        }
                      }}
                      placeholder="Ajouter un tag (Entrée)"
                    />
                    <Button type="button" onClick={() => addTag(newPost, setNewPost)}>
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newPost.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag, newPost, setNewPost)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={newPost.status}
                    onValueChange={(value: any) => setNewPost({ ...newPost, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">SEO (optionnel)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="metaTitle">Meta Titre</Label>
                      <Input
                        id="metaTitle"
                        value={newPost.metaTitle}
                        onChange={(e) => setNewPost({ ...newPost, metaTitle: e.target.value })}
                        placeholder="Titre pour les moteurs de recherche"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Input
                        id="metaDescription"
                        value={newPost.metaDescription}
                        onChange={(e) => setNewPost({ ...newPost, metaDescription: e.target.value })}
                        placeholder="Description pour les moteurs de recherche"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Création..." : "Créer l'article"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {post.slug} • {post.viewCount || 0} vues
                      {post.publishedAt && (
                        <> • Publié le {format(new Date(post.publishedAt), "dd MMMM yyyy", { locale: fr })}</>
                      )}
                    </p>
                    {post.excerpt && <p className="text-sm mt-2">{post.excerpt}</p>}
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {post.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {post.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setEditingPost({ ...post })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun article de blog. Créez-en un pour commencer.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog d'édition (similaire au dialog de création) */}
        {editingPost && (
          <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier l'article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Copie des mêmes champs que pour la création */}
                <div>
                  <Label htmlFor="edit-title">Titre *</Label>
                  <Input
                    id="edit-title"
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    placeholder="Titre de l'article"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-slug">Slug (URL)</Label>
                  <Input
                    id="edit-slug"
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    placeholder="slug-de-larticle"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-excerpt">Extrait</Label>
                  <Input
                    id="edit-excerpt"
                    value={editingPost.excerpt || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    placeholder="Court résumé de l'article"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-coverImageUrl">Image de couverture (URL)</Label>
                  <Input
                    id="edit-coverImageUrl"
                    value={editingPost.coverImageUrl || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="edit-content">Contenu *</Label>
                  <TiptapEditor
                    content={editingPost.content}
                    onChange={(content) => setEditingPost({ ...editingPost, content })}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(editingPost, setEditingPost);
                        }
                      }}
                      placeholder="Ajouter un tag (Entrée)"
                    />
                    <Button type="button" onClick={() => addTag(editingPost, setEditingPost)}>
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingPost.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag, editingPost, setEditingPost)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={editingPost.status}
                    onValueChange={(value: any) => setEditingPost({ ...editingPost, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">SEO (optionnel)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="edit-metaTitle">Meta Titre</Label>
                      <Input
                        id="edit-metaTitle"
                        value={editingPost.metaTitle || ""}
                        onChange={(e) => setEditingPost({ ...editingPost, metaTitle: e.target.value })}
                        placeholder="Titre pour les moteurs de recherche"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-metaDescription">Meta Description</Label>
                      <Input
                        id="edit-metaDescription"
                        value={editingPost.metaDescription || ""}
                        onChange={(e) => setEditingPost({ ...editingPost, metaDescription: e.target.value })}
                        placeholder="Description pour les moteurs de recherche"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingPost(null)}>
                    Annuler
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
