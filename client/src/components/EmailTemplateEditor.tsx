import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Type,
  Image,
  Link2,
  Square,
  Trash2,
  GripVertical,
  Plus,
  Eye,
  Save,
  Heading1,
  AlignLeft,
  MousePointer,
  Divide,
} from "lucide-react";

// Types pour les blocs d'email
export type BlockType = "header" | "text" | "image" | "button" | "divider" | "spacer" | "columns" | "social" | "signature";

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
}

interface EmailTemplateEditorProps {
  initialBlocks?: EmailBlock[];
  initialSubject?: string;
  initialName?: string;
  initialCategory?: string;
  onSave: (data: {
    name: string;
    subject: string;
    category: string;
    blocks: EmailBlock[];
    html: string;
  }) => void;
  onCancel: () => void;
}

// Blocs disponibles pour le drag & drop
const AVAILABLE_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "header", label: "Titre", icon: <Heading1 className="h-4 w-4" /> },
  { type: "text", label: "Texte", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "image", label: "Image", icon: <Image className="h-4 w-4" /> },
  { type: "button", label: "Bouton CTA", icon: <MousePointer className="h-4 w-4" /> },
  { type: "divider", label: "Séparateur", icon: <Divide className="h-4 w-4" /> },
  { type: "spacer", label: "Espace", icon: <Square className="h-4 w-4" /> },
  { type: "columns", label: "2 Colonnes", icon: <Type className="h-4 w-4" /> },
  { type: "social", label: "Réseaux Sociaux", icon: <Link2 className="h-4 w-4" /> },
  { type: "signature", label: "Signature", icon: <Type className="h-4 w-4" /> },
];

// Variables disponibles pour l'interpolation
const AVAILABLE_VARIABLES = [
  { key: "{{firstName}}", label: "Prénom" },
  { key: "{{lastName}}", label: "Nom" },
  { key: "{{company}}", label: "Entreprise" },
  { key: "{{email}}", label: "Email" },
  { key: "{{phone}}", label: "Téléphone" },
  { key: "{{position}}", label: "Poste" },
];

// Générer un ID unique
const generateId = () => Math.random().toString(36).substr(2, 9);

// Créer un nouveau bloc avec contenu par défaut
const createBlock = (type: BlockType): EmailBlock => {
  const id = generateId();
  switch (type) {
    case "header":
      return { id, type, content: { text: "Titre de l'email", level: "h1", align: "center" } };
    case "text":
      return { id, type, content: { text: "Votre texte ici...", align: "left" } };
    case "image":
      return { id, type, content: { url: "", alt: "Image", width: "100%" } };
    case "button":
      return { id, type, content: { text: "Cliquez ici", url: "https://coachdigital.biz", color: "#E67E50", align: "center" } };
    case "divider":
      return { id, type, content: { color: "#e5e7eb", height: "1px" } };
    case "spacer":
      return { id, type, content: { height: "20px" } };
    case "columns":
      return { id, type, content: { leftText: "Colonne gauche", rightText: "Colonne droite" } };
    case "social":
      return { id, type, content: { linkedin: "https://linkedin.com/in/coachdigital", twitter: "", facebook: "", instagram: "" } };
    case "signature":
      return { id, type, content: { name: "Coach Digital Paris", title: "Expert IA & Développement", phone: "+33 6 52 34 51 80", email: "coachdigitalparis@gmail.com", website: "https://coachdigital.biz" } };
    default:
      return { id, type, content: {} };
  }
};

// Générer le HTML à partir des blocs
const generateHtml = (blocks: EmailBlock[]): string => {
  const blockHtml = blocks.map((block) => {
    switch (block.type) {
      case "header":
        const Tag = block.content.level || "h1";
        return `<${Tag} style="text-align: ${block.content.align || "center"}; color: #1f2937; margin: 0 0 16px 0;">${block.content.text}</${Tag}>`;
      case "text":
        return `<p style="text-align: ${block.content.align || "left"}; color: #374151; line-height: 1.6; margin: 0 0 16px 0;">${block.content.text}</p>`;
      case "image":
        return block.content.url
          ? `<img src="${block.content.url}" alt="${block.content.alt || ""}" style="width: ${block.content.width || "100%"}; max-width: 100%; height: auto; display: block; margin: 0 auto 16px auto;" />`
          : "";
      case "button":
        return `<div style="text-align: ${block.content.align || "center"}; margin: 16px 0;">
          <a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.color || "#E67E50"}; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">${block.content.text}</a>
        </div>`;
      case "divider":
        return `<hr style="border: none; border-top: ${block.content.height || "1px"} solid ${block.content.color || "#e5e7eb"}; margin: 16px 0;" />`;
      case "spacer":
        return `<div style="height: ${block.content.height || "20px"};"></div>`;
      case "columns":
        return `<table style="width: 100%; margin: 16px 0;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%; padding: 10px; vertical-align: top;">${block.content.leftText}</td>
            <td style="width: 50%; padding: 10px; vertical-align: top;">${block.content.rightText}</td>
          </tr>
        </table>`;
      case "social":
        const socialLinks = [];
        if (block.content.linkedin) socialLinks.push(`<a href="${block.content.linkedin}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" alt="LinkedIn" style="width: 24px; height: 24px;" /></a>`);
        if (block.content.twitter) socialLinks.push(`<a href="${block.content.twitter}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733579.png" alt="Twitter" style="width: 24px; height: 24px;" /></a>`);
        if (block.content.facebook) socialLinks.push(`<a href="${block.content.facebook}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/733/733547.png" alt="Facebook" style="width: 24px; height: 24px;" /></a>`);
        if (block.content.instagram) socialLinks.push(`<a href="${block.content.instagram}" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/32/174/174855.png" alt="Instagram" style="width: 24px; height: 24px;" /></a>`);
        return `<div style="text-align: center; margin: 16px 0;">${socialLinks.join("")}</div>`;
      case "signature":
        return `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-weight: bold; color: #1f2937;">${block.content.name}</p>
          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">${block.content.title}</p>
          <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
            ${block.content.phone ? `Tél: ${block.content.phone}` : ""}
            ${block.content.phone && block.content.email ? " | " : ""}
            ${block.content.email ? `<a href="mailto:${block.content.email}" style="color: #E67E50;">${block.content.email}</a>` : ""}
          </p>
          ${block.content.website ? `<p style="margin: 4px 0;"><a href="${block.content.website}" style="color: #E67E50; font-size: 14px;">${block.content.website}</a></p>` : ""}
        </div>`;
      default:
        return "";
    }
  }).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    ${blockHtml}
  </div>
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>Coach Digital Paris - Coaching IA & Développement</p>
    <p><a href="{{unsubscribe_url}}" style="color: #9ca3af;">Se désabonner</a></p>
  </div>
</body>
</html>`;
};

export function EmailTemplateEditor({
  initialBlocks = [],
  initialSubject = "",
  initialName = "",
  initialCategory = "presentation",
  onSave,
  onCancel,
}: EmailTemplateEditorProps) {
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [category, setCategory] = useState(initialCategory);
  const [blocks, setBlocks] = useState<EmailBlock[]>(
    initialBlocks.length > 0 ? initialBlocks : [
      createBlock("header"),
      createBlock("text"),
      createBlock("button"),
    ]
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Gérer le drag & drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Si on drag depuis la palette vers l'éditeur
    if (result.source.droppableId === "palette" && result.destination.droppableId === "editor") {
      const blockType = AVAILABLE_BLOCKS[result.source.index].type;
      const newBlock = createBlock(blockType);
      const newBlocks = [...blocks];
      newBlocks.splice(result.destination.index, 0, newBlock);
      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      return;
    }

    // Si on réordonne dans l'éditeur
    if (result.source.droppableId === "editor" && result.destination.droppableId === "editor") {
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(result.source.index, 1);
      newBlocks.splice(result.destination.index, 0, removed);
      setBlocks(newBlocks);
    }
  };

  // Mettre à jour un bloc
  const updateBlock = (blockId: string, content: Record<string, any>) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)));
  };

  // Supprimer un bloc
  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  // Ajouter un bloc
  const addBlock = (type: BlockType) => {
    const newBlock = createBlock(type);
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  // Insérer une variable
  const insertVariable = (variable: string) => {
    if (!selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block || (block.type !== "text" && block.type !== "header")) return;
    updateBlock(selectedBlockId, { text: (block.content.text || "") + " " + variable });
  };

  // Sauvegarder
  const handleSave = () => {
    if (!name.trim() || !subject.trim()) {
      alert("Veuillez remplir le nom et l'objet du template");
      return;
    }
    onSave({
      name,
      subject,
      category,
      blocks,
      html: generateHtml(blocks),
    });
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Éditeur de Template</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Éditer" : "Aperçu"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* Mode Aperçu */
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 p-4 bg-white rounded-lg shadow">
              <p className="text-sm text-muted-foreground">Objet:</p>
              <p className="font-medium">{subject}</p>
            </div>
            <div
              className="bg-white rounded-lg shadow"
              dangerouslySetInnerHTML={{ __html: generateHtml(blocks) }}
            />
          </div>
        </div>
      ) : (
        /* Mode Édition */
        <div className="flex-1 flex overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Palette de blocs */}
            <div className="w-64 border-r p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Blocs disponibles</h3>
              <Droppable droppableId="palette" isDropDisabled={true}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {AVAILABLE_BLOCKS.map((block, index) => (
                      <Draggable key={block.type} draggableId={`palette-${block.type}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-2 p-3 bg-card border rounded-lg cursor-grab ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            }`}
                          >
                            {block.icon}
                            <span>{block.label}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Variables</h3>
                <div className="space-y-1">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Button
                      key={v.key}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone d'édition */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {/* Métadonnées du template */}
              <div className="max-w-2xl mx-auto mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom du template</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Présentation services"
                    />
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="voeux">Vœux</SelectItem>
                        <SelectItem value="presentation">Présentation</SelectItem>
                        <SelectItem value="relance">Relance</SelectItem>
                        <SelectItem value="rendez_vous">Rendez-vous</SelectItem>
                        <SelectItem value="suivi">Suivi</SelectItem>
                        <SelectItem value="remerciement">Remerciement</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Objet de l'email</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Découvrez nos services de coaching IA"
                  />
                </div>
              </div>

              {/* Zone de drop des blocs */}
              <Droppable droppableId="editor">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`max-w-2xl mx-auto min-h-[400px] bg-gray-50 rounded-lg shadow p-4 border-2 border-dashed border-gray-300 ${
                      snapshot.isDraggingOver ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {blocks.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Glissez des blocs ici pour créer votre email
                      </div>
                    ) : (
                      blocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group relative mb-2 p-3 border rounded-lg ${
                                selectedBlockId === block.id ? "ring-2 ring-primary" : ""
                              } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                              onClick={() => setSelectedBlockId(block.id)}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>

                              {/* Rendu du bloc selon son type */}
                              <div className="pl-6">
                                {block.type === "header" && (
                                  <div style={{ textAlign: block.content.align || "center" }} className="bg-white p-3 rounded border">
                                    <span className="text-xl font-bold text-gray-900">{block.content.text}</span>
                                  </div>
                                )}
                                {block.type === "text" && (
                                  <p style={{ textAlign: block.content.align || "left" }} className="bg-white p-3 rounded border text-gray-900">{block.content.text}</p>
                                )}
                                {block.type === "image" && (
                                  <div className="text-center">
                                    {block.content.url ? (
                                      <img src={block.content.url} alt={block.content.alt} className="max-w-full h-auto" />
                                    ) : (
                                      <div className="bg-gray-100 p-8 text-muted-foreground">
                                        <Image className="h-8 w-8 mx-auto mb-2" />
                                        <span>Ajouter une image</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {block.type === "button" && (
                                  <div style={{ textAlign: block.content.align || "center" }}>
                                    <span
                                      className="inline-block px-4 py-2 rounded text-white font-medium"
                                      style={{ backgroundColor: block.content.color || "#E67E50" }}
                                    >
                                      {block.content.text}
                                    </span>
                                  </div>
                                )}
                                {block.type === "divider" && (
                                  <hr style={{ borderColor: block.content.color || "#e5e7eb" }} />
                                )}
                                {block.type === "spacer" && (
                                  <div
                                    className="bg-gray-100 text-center text-xs text-muted-foreground"
                                    style={{ height: block.content.height || "20px", lineHeight: block.content.height || "20px" }}
                                  >
                                    Espace
                                  </div>
                                )}
                                {block.type === "columns" && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-2 bg-gray-50 rounded text-sm">{block.content.leftText}</div>
                                    <div className="p-2 bg-gray-50 rounded text-sm">{block.content.rightText}</div>
                                  </div>
                                )}
                                {block.type === "social" && (
                                  <div className="flex justify-center gap-4">
                                    {block.content.linkedin && <span className="text-blue-600">LinkedIn</span>}
                                    {block.content.twitter && <span className="text-sky-500">Twitter</span>}
                                    {block.content.facebook && <span className="text-blue-700">Facebook</span>}
                                    {block.content.instagram && <span className="text-pink-600">Instagram</span>}
                                    {!block.content.linkedin && !block.content.twitter && !block.content.facebook && !block.content.instagram && (
                                      <span className="text-muted-foreground">Réseaux sociaux</span>
                                    )}
                                  </div>
                                )}
                                {block.type === "signature" && (
                                  <div className="border-t pt-3">
                                    <p className="font-bold">{block.content.name}</p>
                                    <p className="text-sm text-muted-foreground">{block.content.title}</p>
                                    <p className="text-sm text-muted-foreground">{block.content.phone} | {block.content.email}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Panneau de propriétés */}
            <div className="w-72 border-l p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Propriétés</h3>
              {selectedBlock ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Type: {AVAILABLE_BLOCKS.find((b) => b.type === selectedBlock.type)?.label}
                  </p>

                  {(selectedBlock.type === "header" || selectedBlock.type === "text") && (
                    <>
                      <div>
                        <Label>Texte</Label>
                        <Textarea
                          value={selectedBlock.content.text || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Alignement</Label>
                        <Select
                          value={selectedBlock.content.align || "left"}
                          onValueChange={(v) => updateBlock(selectedBlock.id, { align: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Gauche</SelectItem>
                            <SelectItem value="center">Centre</SelectItem>
                            <SelectItem value="right">Droite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "header" && (
                    <div>
                      <Label>Niveau</Label>
                      <Select
                        value={selectedBlock.content.level || "h1"}
                        onValueChange={(v) => updateBlock(selectedBlock.id, { level: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h1">Titre 1</SelectItem>
                          <SelectItem value="h2">Titre 2</SelectItem>
                          <SelectItem value="h3">Titre 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedBlock.type === "image" && (
                    <>
                      <div>
                        <Label>URL de l'image</Label>
                        <Input
                          value={selectedBlock.content.url || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>Texte alternatif</Label>
                        <Input
                          value={selectedBlock.content.alt || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { alt: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "button" && (
                    <>
                      <div>
                        <Label>Texte du bouton</Label>
                        <Input
                          value={selectedBlock.content.text || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { text: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>URL du lien</Label>
                        <Input
                          value={selectedBlock.content.url || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>Couleur</Label>
                        <Input
                          type="color"
                          value={selectedBlock.content.color || "#E67E50"}
                          onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Alignement</Label>
                        <Select
                          value={selectedBlock.content.align || "center"}
                          onValueChange={(v) => updateBlock(selectedBlock.id, { align: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Gauche</SelectItem>
                            <SelectItem value="center">Centre</SelectItem>
                            <SelectItem value="right">Droite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "spacer" && (
                    <div>
                      <Label>Hauteur</Label>
                      <Select
                        value={selectedBlock.content.height || "20px"}
                        onValueChange={(v) => updateBlock(selectedBlock.id, { height: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10px">Petit (10px)</SelectItem>
                          <SelectItem value="20px">Moyen (20px)</SelectItem>
                          <SelectItem value="40px">Grand (40px)</SelectItem>
                          <SelectItem value="60px">Très grand (60px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedBlock.type === "divider" && (
                    <div>
                      <Label>Couleur</Label>
                      <Input
                        type="color"
                        value={selectedBlock.content.color || "#e5e7eb"}
                        onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                      />
                    </div>
                  )}

                  {selectedBlock.type === "columns" && (
                    <>
                      <div>
                        <Label>Colonne gauche</Label>
                        <Textarea
                          value={selectedBlock.content.leftText || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { leftText: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Colonne droite</Label>
                        <Textarea
                          value={selectedBlock.content.rightText || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { rightText: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "social" && (
                    <>
                      <div>
                        <Label>LinkedIn</Label>
                        <Input
                          value={selectedBlock.content.linkedin || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                      <div>
                        <Label>Twitter / X</Label>
                        <Input
                          value={selectedBlock.content.twitter || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { twitter: e.target.value })}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div>
                        <Label>Facebook</Label>
                        <Input
                          value={selectedBlock.content.facebook || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { facebook: e.target.value })}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div>
                        <Label>Instagram</Label>
                        <Input
                          value={selectedBlock.content.instagram || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { instagram: e.target.value })}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === "signature" && (
                    <>
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={selectedBlock.content.name || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Titre / Fonction</Label>
                        <Input
                          value={selectedBlock.content.title || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input
                          value={selectedBlock.content.phone || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={selectedBlock.content.email || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Site web</Label>
                        <Input
                          value={selectedBlock.content.website || ""}
                          onChange={(e) => updateBlock(selectedBlock.id, { website: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sélectionnez un bloc pour modifier ses propriétés
                </p>
              )}
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}

export default EmailTemplateEditor;
