import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewRequestForm from "@/components/NewRequestForm";
import ClientCredentialsManager from "@/components/ClientCredentialsManager";
import ClientDocuments from "@/components/ClientDocuments";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  FileText,
  FolderOpen,
  MessageSquare,
  Lock,
  Plus,
  LogOut,
  Download,
  Eye,
} from "lucide-react";

/**
 * Dashboard de l'espace client sécurisé
 * Design Tesla/Apple dark theme
 */
export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const [clientUser, setClientUser] = useState<any>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "credentials">("overview");

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem("clientToken");
    if (!token) {
      setLocation("/client/login");
      return;
    }

    // Extraire l'ID client du token (format: client_{id}_{timestamp})
    const parts = token.split("_");
    if (parts.length >= 2) {
      setClientUser({ id: parseInt(parts[1]) });
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("clientToken");
    toast.success("Déconnexion réussie");
    setLocation("/client/login");
  };

  if (!clientUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">COACH DIGITAL</h1>
              <p className="text-sm text-muted-foreground">Votre Espace Client</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bienvenue</h2>
          <p className="text-muted-foreground text-lg">
            Retrouvez tous vos projets, documents et échanges en un seul endroit.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "credentials"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mes Identifiants
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
        <>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Mes Projets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Projets en cours</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Devis & Factures</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Messages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Nouveaux messages</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Coffre-fort</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Credentials stockés</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projets en cours */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets en cours</CardTitle>
                  <CardDescription>Suivez l'avancement de vos projets</CardDescription>
                </div>
                <Button size="sm" className="gap-2" onClick={() => setShowNewRequest(true)}>
                  <Plus className="h-4 w-4" />
                  Nouvelle demande
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun projet en cours</p>
                <p className="text-sm mt-2">
                  Créez une nouvelle demande pour démarrer un projet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documents récents */}
          <ClientDocuments clientUserId={clientUser.id} />
        </div>

        {/* CTA Section */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Besoin d'aide ?</h3>
                <p className="text-muted-foreground">
                  Notre équipe est à votre disposition pour répondre à vos questions
                </p>
              </div>
              <Button className="gap-2" onClick={() => setShowNewRequest(true)}>
                <MessageSquare className="h-4 w-4" />
                Contacter le coach
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
        )}

        {/* Credentials Tab */}
        {activeTab === "credentials" && (
          <ClientCredentialsManager clientId={clientUser.id} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2025 Coach Digital Paris. Tous droits réservés.</p>
            <div className="flex gap-4">
              <a href="mailto:coachdigitalparis@gmail.com" className="hover:text-primary transition-colors">
                Contact
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialogue formulaire nouvelle demande */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande</DialogTitle>
          </DialogHeader>
          <NewRequestForm
            onClose={() => setShowNewRequest(false)}
            onSuccess={() => setShowNewRequest(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
