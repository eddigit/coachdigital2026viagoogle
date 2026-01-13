import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { Building2, FileText, Palette } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre entreprise et personnalisez vos documents
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates Documents
          </TabsTrigger>
        </TabsList>
        
        {/* Onglet Entreprise */}
        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
        
        {/* Onglet Templates Documents */}
        <TabsContent value="templates">
          <TemplatesSettings />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Composant pour les paramètres entreprise
function CompanySettings() {
  const { data: company, isLoading } = trpc.company.get.useQuery();
  const utils = trpc.useUtils();
  
  const upsertCompany = trpc.company.upsert.useMutation({
    onSuccess: () => {
      toast.success("Informations enregistrées");
      utils.company.get.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    upsertCompany.mutate({
      name: formData.get("name") as string,
      legalName: (formData.get("legalName") as string) || null,
      siret: (formData.get("siret") as string) || null,
      tvaNumber: (formData.get("tvaNumber") as string) || null,
      address: (formData.get("address") as string) || null,
      postalCode: (formData.get("postalCode") as string) || null,
      city: (formData.get("city") as string) || null,
      country: (formData.get("country") as string) || "France",
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      website: (formData.get("website") as string) || null,
      logoUrl: (formData.get("logoUrl") as string) || null,
      bankName: (formData.get("bankName") as string) || null,
      iban: (formData.get("iban") as string) || null,
      bic: (formData.get("bic") as string) || null,
      defaultTvaRate: (formData.get("defaultTvaRate") as string) || "20.00",
      defaultPaymentTerms: parseInt(formData.get("defaultPaymentTerms") as string) || 30,
      legalMentions: (formData.get("legalMentions") as string) || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations Entreprise</CardTitle>
        <CardDescription>
          Gérez les informations de votre entreprise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom commercial *</Label>
              <Input name="name" defaultValue={company?.name || ""} required />
            </div>
            <div className="space-y-2">
              <Label>Raison sociale</Label>
              <Input name="legalName" defaultValue={company?.legalName || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input name="siret" defaultValue={company?.siret || ""} />
            </div>
            <div className="space-y-2">
              <Label>N° TVA</Label>
              <Input name="tvaNumber" defaultValue={company?.tvaNumber || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input name="address" defaultValue={company?.address || ""} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Code Postal</Label>
              <Input name="postalCode" defaultValue={company?.postalCode || ""} />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input name="city" defaultValue={company?.city || ""} />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input name="country" defaultValue={company?.country || "France"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input name="phone" defaultValue={company?.phone || ""} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={company?.email || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Site web</Label>
            <Input name="website" defaultValue={company?.website || ""} />
          </div>

          <div className="space-y-2">
            <Label>URL Logo</Label>
            <Input name="logoUrl" defaultValue={company?.logoUrl || ""} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Banque</Label>
              <Input name="bankName" defaultValue={company?.bankName || ""} />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input name="iban" defaultValue={company?.iban || ""} />
            </div>
            <div className="space-y-2">
              <Label>BIC</Label>
              <Input name="bic" defaultValue={company?.bic || ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TVA par défaut (%)</Label>
              <Input name="defaultTvaRate" type="number" step="0.01" defaultValue={company?.defaultTvaRate || "20.00"} />
            </div>
            <div className="space-y-2">
              <Label>Délai de paiement (jours)</Label>
              <Input name="defaultPaymentTerms" type="number" defaultValue={company?.defaultPaymentTerms || 30} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mentions légales</Label>
            <Textarea name="legalMentions" rows={4} defaultValue={company?.legalMentions || ""} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={upsertCompany.isPending}>
              {upsertCompany.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Composant pour les templates de documents
function TemplatesSettings() {
  const [templateType, setTemplateType] = useState<"quote" | "invoice">("quote");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Charger le template par défaut
  const { data: template, isLoading } = trpc.documentTemplates.getDefault.useQuery({
    type: templateType,
  });
  
  const utils = trpc.useUtils();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    primaryColor: "#E67E50",
    secondaryColor: "#1E293B",
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companySiret: "",
    companyTva: "",
    legalMentions: "",
    termsAndConditions: "",
    footerText: "",
  });
  
  // Mettre à jour le formulaire quand le template charge
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        logoUrl: template.logoUrl || "",
        primaryColor: template.primaryColor || "#E67E50",
        secondaryColor: template.secondaryColor || "#1E293B",
        companyName: template.companyName || "",
        companyAddress: template.companyAddress || "",
        companyPhone: template.companyPhone || "",
        companyEmail: template.companyEmail || "",
        companySiret: template.companySiret || "",
        companyTva: template.companyTva || "",
        legalMentions: template.legalMentions || "",
        termsAndConditions: template.termsAndConditions || "",
        footerText: template.footerText || "",
      });
    }
  }, [template]);
  
  const uploadMutation = trpc.upload.uploadProjectLogo.useMutation();
  const createTemplateMutation = trpc.documentTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template créé avec succès");
      utils.documentTemplates.getDefault.invalidate();
    },
  });
  
  const updateTemplateMutation = trpc.documentTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template mis à jour avec succès");
      utils.documentTemplates.getDefault.invalidate();
    },
  });
  
  const handleSave = async () => {
    try {
      // Upload du logo si présent
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        const reader = new FileReader();
        reader.readAsDataURL(logoFile);
        await new Promise((resolve) => {
          reader.onload = async () => {
            const base64 = reader.result as string;
            const result = await uploadMutation.mutateAsync({
              projectId: 0, // Pas de projet spécifique pour les templates
              imageData: base64,
              mimeType: logoFile.type,
            });
            logoUrl = result.url;
            resolve(null);
          };
        });
      }
      
      const data = {
        ...formData,
        logoUrl,
        type: templateType,
        isDefault: true,
      };
      
      if (template) {
        await updateTemplateMutation.mutateAsync({ id: template.id, ...data });
      } else {
        await createTemplateMutation.mutateAsync(data);
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };
  
  const handleReset = () => {
    setFormData({
      name: `Template ${templateType === "quote" ? "Devis" : "Facture"}`,
      logoUrl: "",
      primaryColor: "#E67E50",
      secondaryColor: "#1E293B",
      companyName: "",
      companyAddress: "",
      companyPhone: "",
      companyEmail: "",
      companySiret: "",
      companyTva: "",
      legalMentions: "",
      termsAndConditions: "",
      footerText: "",
    });
    setLogoFile(null);
    toast.info("Formulaire réinitialisé");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnalisation des Templates</CardTitle>
        <CardDescription>
          Personnalisez l'apparence de vos devis et factures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de type */}
        <div className="space-y-2">
          <Label>Type de document</Label>
          <Select value={templateType} onValueChange={(v: "quote" | "invoice") => setTemplateType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quote">Devis</SelectItem>
              <SelectItem value="invoice">Facture</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mon template personnalisé"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Logo entreprise</Label>
                <ImageUpload
                  onUpload={async (imageData, mimeType) => {
                    // Stocker temporairement le fichier pour l'upload lors de la sauvegarde
                    const blob = await fetch(imageData).then(r => r.blob());
                    const file = new File([blob], "logo.png", { type: mimeType });
                    setLogoFile(file);
                    return { url: imageData }; // Retourner l'URL de prévisualisation
                  }}
                  currentImageUrl={formData.logoUrl}
                  label="Logo entreprise"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">
                    <Palette className="h-4 w-4 inline mr-2" />
                    Couleur principale
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#E67E50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">
                    <Palette className="h-4 w-4 inline mr-2" />
                    Couleur secondaire
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#1E293B"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nom de l'entreprise</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Coach Digital"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  placeholder="123 rue de la République, 75001 Paris"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    placeholder="contact@coach-digital.fr"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input
                    value={formData.companySiret}
                    onChange={(e) => setFormData({ ...formData, companySiret: e.target.value })}
                    placeholder="123 456 789 00012"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>N° TVA</Label>
                  <Input
                    value={formData.companyTva}
                    onChange={(e) => setFormData({ ...formData, companyTva: e.target.value })}
                    placeholder="FR 12 345678901"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Mentions légales</Label>
                <Textarea
                  value={formData.legalMentions}
                  onChange={(e) => setFormData({ ...formData, legalMentions: e.target.value })}
                  placeholder="Mentions légales à afficher sur les documents..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Conditions générales</Label>
                <Textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  placeholder="Conditions générales de vente..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Texte du pied de page</Label>
                <Input
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Merci de votre confiance"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  Enregistrer
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Réinitialiser
                </Button>
              </div>
            </div>
            
            {/* Prévisualisation */}
            <div className="space-y-2">
              <Label>Prévisualisation</Label>
              <Card className="p-6 bg-white text-black">
                <div className="space-y-4">
                  {/* Header avec logo */}
                  <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: formData.primaryColor }}>
                    {formData.logoUrl || logoFile ? (
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : formData.logoUrl}
                        alt="Logo"
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="h-16 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        Logo
                      </div>
                    )}
                    <div className="text-right text-sm">
                      <div className="font-bold text-lg" style={{ color: formData.primaryColor }}>
                        {templateType === "quote" ? "DEVIS" : "FACTURE"}
                      </div>
                      <div className="text-gray-600">N° DEV-2026-001</div>
                      <div className="text-gray-600">Date: 13/01/2026</div>
                    </div>
                  </div>
                  
                  {/* Informations entreprise */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold mb-2" style={{ color: formData.primaryColor }}>
                        Émetteur
                      </div>
                      <div>{formData.companyName || "Nom de l'entreprise"}</div>
                      <div className="text-gray-600 whitespace-pre-line">
                        {formData.companyAddress || "Adresse de l'entreprise"}
                      </div>
                      <div className="text-gray-600">{formData.companyPhone || "Téléphone"}</div>
                      <div className="text-gray-600">{formData.companyEmail || "Email"}</div>
                      {formData.companySiret && (
                        <div className="text-gray-600 text-xs mt-2">
                          SIRET: {formData.companySiret}
                        </div>
                      )}
                      {formData.companyTva && (
                        <div className="text-gray-600 text-xs">
                          TVA: {formData.companyTva}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-semibold mb-2" style={{ color: formData.primaryColor }}>
                        Client
                      </div>
                      <div>Client Example</div>
                      <div className="text-gray-600">123 rue Example</div>
                      <div className="text-gray-600">75001 Paris</div>
                    </div>
                  </div>
                  
                  {/* Tableau exemple */}
                  <div className="border rounded overflow-hidden text-sm">
                    <div className="grid grid-cols-4 gap-2 p-2 font-semibold" style={{ backgroundColor: formData.primaryColor, color: "white" }}>
                      <div>Description</div>
                      <div className="text-right">Qté</div>
                      <div className="text-right">P.U. HT</div>
                      <div className="text-right">Total HT</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 p-2 border-t">
                      <div>Prestation exemple</div>
                      <div className="text-right">1</div>
                      <div className="text-right">1 000,00 €</div>
                      <div className="text-right">1 000,00 €</div>
                    </div>
                  </div>
                  
                  {/* Totaux */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total HT:</span>
                        <span>1 000,00 €</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>TVA 20%:</span>
                        <span>200,00 €</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ color: formData.primaryColor }}>
                        <span>Total TTC:</span>
                        <span>1 200,00 €</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  {formData.footerText && (
                    <div className="text-center text-sm text-gray-600 pt-4 border-t">
                      {formData.footerText}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
