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
import { Building2, FileText, Palette, Mail, Ban, Database } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre entreprise et personnalisez vos documents
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates Documents
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Configuration Email
          </TabsTrigger>
          <TabsTrigger value="blacklist">
            <Ban className="h-4 w-4 mr-2" />
            Blacklist
          </TabsTrigger>
          <TabsTrigger value="admin">
            <Database className="h-4 w-4 mr-2" />
            Backend Admin
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
        
        {/* Onglet Configuration Email */}
        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>
        
        {/* Onglet Blacklist */}
        <TabsContent value="blacklist">
          <BlacklistSettings />
        </TabsContent>
        
        {/* Onglet Backend Admin */}
        <TabsContent value="admin">
          <BackendAdminSettings />
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


// Composant Configuration Email
function EmailSettings() {
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  
  const { data: smtpStatus } = trpc.smtp.checkStatus.useQuery();
  const testSmtpMutation = trpc.smtp.testConfiguration.useMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configuration SMTP Gmail
        </CardTitle>
        <CardDescription>
          Configurez votre compte Gmail pour l'envoi automatique d'emails et de factures de temps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statut de la configuration SMTP */}
        {smtpStatus && (
          <div className={`border rounded-lg p-4 ${
            smtpStatus.isReady 
              ? "bg-green-50 border-green-200" 
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <h4 className={`font-semibold mb-2 ${
              smtpStatus.isReady ? "text-green-900" : "text-yellow-900"
            }`}>
              {smtpStatus.isReady ? "✅ SMTP Configuré et Opérationnel" : "⚠️ SMTP Non Configuré"}
            </h4>
            <div className={`text-sm ${
              smtpStatus.isReady ? "text-green-800" : "text-yellow-800"
            }`}>
              {smtpStatus.config.host && (
                <p><strong>Serveur:</strong> {smtpStatus.config.host}:{smtpStatus.config.port}</p>
              )}
              {smtpStatus.config.user && (
                <p><strong>Utilisateur:</strong> {smtpStatus.config.user}</p>
              )}
              {smtpStatus.config.from && (
                <p><strong>Expéditeur:</strong> {smtpStatus.config.from}</p>
              )}
              {!smtpStatus.isReady && (
                <p className="mt-2">
                  Veuillez configurer les variables d'environnement SMTP dans les secrets de l'application.
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            📧 Comment obtenir un mot de passe d'application Gmail
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Allez sur <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline">https://myaccount.google.com/security</a></li>
            <li>Activez la validation en 2 étapes (si ce n'est pas déjà fait)</li>
            <li>Allez dans "Mots de passe des applications" (App passwords)</li>
            <li>Sélectionnez "Autre (nom personnalisé)" et entrez "Coach Digital"</li>
            <li>Copiez le mot de passe généré (16 caractères sans espaces)</li>
          </ol>
        </div>

        {/* Formulaire de configuration */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">Serveur SMTP</Label>
              <Input
                id="smtpHost"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">Port</Label>
              <Select value={smtpPort} onValueChange={setSmtpPort}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="587">587 (TLS - Recommandé)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="smtpUser">Adresse Gmail</Label>
            <Input
              id="smtpUser"
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="votre-email@gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="smtpPassword">Mot de passe d'application</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="16 caractères sans espaces"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Utilisez un mot de passe d'application Gmail, pas votre mot de passe principal
            </p>
          </div>

          <div>
            <Label htmlFor="smtpFrom">Nom de l'expéditeur (optionnel)</Label>
            <Input
              id="smtpFrom"
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              placeholder="Coach Digital <votre-email@gmail.com>"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Laissez vide pour utiliser votre adresse Gmail
            </p>
          </div>
        </div>

        {/* Test de configuration */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Tester la configuration</h4>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email de test"
              className="flex-1"
            />
            <Button
              onClick={async () => {
                if (!testEmail) {
                  toast.error("Veuillez entrer un email de test");
                  return;
                }
                
                setIsTesting(true);
                toast.info("Envoi de l'email de test en cours...");
                
                try {
                  const result = await testSmtpMutation.mutateAsync({ testEmail });
                  
                  if (result.success) {
                    toast.success(result.message);
                  } else {
                    toast.error(result.message);
                  }
                } catch (error) {
                  toast.error("Erreur lors de l'envoi : " + String(error));
                } finally {
                  setIsTesting(false);
                }
              }}
              disabled={isTesting}
            >
              {isTesting ? "Envoi..." : "Envoyer un test"}
            </Button>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={() => {
              toast.info("Configuration SMTP enregistrée. Veuillez redémarrer le serveur pour appliquer les changements.");
            }}
          >
            Enregistrer la configuration
          </Button>
        </div>

        {/* Note de sécurité */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="text-yellow-900">
            <strong>🔒 Sécurité :</strong> Les credentials SMTP seront stockés en tant que variables d'environnement sécurisées. 
            Ne partagez jamais votre mot de passe d'application Gmail.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


// Composant pour la gestion de la blacklist
function BlacklistSettings() {
  const [newEmail, setNewEmail] = useState("");
  const [reason, setReason] = useState("");
  
  const { data: blacklist = [], refetch } = trpc.emailTracking.getBlacklist.useQuery();
  const addToBlacklistMutation = trpc.emailTracking.addToBlacklist.useMutation();
  const removeFromBlacklistMutation = trpc.emailTracking.removeFromBlacklist.useMutation();
  
  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) {
      toast.error("Veuillez entrer un email");
      return;
    }
    
    try {
      await addToBlacklistMutation.mutateAsync({
        email: newEmail,
        reason: reason || "Ajout manuel par l'administrateur"
      });
      toast.success("Email ajouté à la blacklist");
      setNewEmail("");
      setReason("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    }
  };
  
  const handleRemoveFromBlacklist = async (email: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${email} de la blacklist ?`)) {
      return;
    }
    
    try {
      await removeFromBlacklistMutation.mutateAsync({ email });
      toast.success("Email retiré de la blacklist");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };
  
  const handleExportCSV = () => {
    const csv = [
      ["Email", "Raison", "Date d'ajout"],
      ...blacklist.map((item: any) => [
        item.email,
        item.reason || "",
        new Date(item.createdAt).toLocaleDateString("fr-FR")
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `blacklist-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Export CSV téléchargé");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion de la Blacklist</CardTitle>
        <CardDescription>
          Gérez les emails désabonnés et ajoutez manuellement des adresses à la blacklist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Blacklistés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blacklist.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Désabonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {blacklist.filter((item: any) => item.reason?.includes("désabonné")).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ajouts Manuels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {blacklist.filter((item: any) => item.reason?.includes("manuel")).length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Formulaire d'ajout */}
        <form onSubmit={handleAddToBlacklist} className="space-y-4">
          <div>
            <Label htmlFor="newEmail">Ajouter un email à la blacklist</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="email@exemple.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Input
              id="reason"
              placeholder="Spam, demande client, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={addToBlacklistMutation.isPending}>
              {addToBlacklistMutation.isPending ? "Ajout..." : "Ajouter à la blacklist"}
            </Button>
            <Button type="button" variant="outline" onClick={handleExportCSV}>
              Exporter CSV
            </Button>
          </div>
        </form>
        
        {/* Liste des emails blacklistés */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Emails Blacklistés</h3>
          {blacklist.length === 0 ? (
            <p className="text-muted-foreground">Aucun email dans la blacklist</p>
          ) : (
            <div className="space-y-2">
              {blacklist.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.email}</p>
                    {item.reason && (
                      <p className="text-sm text-muted-foreground">{item.reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Ajouté le {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFromBlacklist(item.email)}
                    disabled={removeFromBlacklistMutation.isPending}
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Avertissement RGPD */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="text-yellow-900">
            <strong>⚖️ Conformité RGPD :</strong> Les emails blacklistés ne recevront plus aucun email de prospection. 
            Conservez cette liste pour prouver le respect des désabonnements en cas de contrôle CNIL.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


// Composant Backend Admin
function BackendAdminSettings() {
  const [isExporting, setIsExporting] = useState(false);
  const { data: company, isLoading } = trpc.company.get.useQuery();
  const utils = trpc.useUtils();
  
  const upsertCompany = trpc.company.upsert.useMutation({
    onSuccess: () => {
      toast.success("Logo mis à jour");
      utils.company.get.invalidate();
    },
  });
  
  const exportDatabase = trpc.admin.exportDatabase.useQuery(undefined, {
    enabled: false,
  });
  
  const handleLogoUpload = async (imageData: string, mimeType: string) => {
    // Stocker directement l'image en base64 (data URL)
    upsertCompany.mutate({ appLogo: imageData });
    return { url: imageData };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportDatabase.refetch();
      
      if (result.data) {
        // Créer un blob JSON
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        
        // Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coach-digital-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Base de données exportée avec succès");
      }
    } catch (error: any) {
      toast.error("Erreur lors de l'export : " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backend Administration</CardTitle>
        <CardDescription>
          Outils d'administration et de maintenance de la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Logo de l'application</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ce logo s'affichera dans le header de l'application et sur tous les documents PDF générés (devis, factures).
            </p>
            <ImageUpload
              currentImageUrl={company?.appLogo || ""}
              onUpload={handleLogoUpload}
              label="Logo de l'application"
            />
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Export de la base de données</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Téléchargez une copie complète de toutes les données de la plateforme au format JSON.
              Cet export inclut toutes les tables : clients, projets, tâches, documents, etc.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="bg-[#E67E50] hover:bg-[#E67E50]/90"
            >
              <Database className="h-4 w-4 mr-2" />
              {isExporting ? "Export en cours..." : "Exporter la base de données"}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Statistiques système</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-2xl font-bold">1.0.0</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Environnement</p>
                <p className="text-2xl font-bold">Production</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
