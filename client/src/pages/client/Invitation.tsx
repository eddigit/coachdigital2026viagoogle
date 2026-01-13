import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function Invitation() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const acceptInvitation = trpc.clientAuth.acceptInvitation.useMutation({
    onSuccess: () => {
      toast.success("Compte créé avec succès !");
      setTimeout(() => {
        setLocation("/client/login");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création du compte");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (!token) {
      toast.error("Token d'invitation invalide");
      return;
    }

    acceptInvitation.mutate({
      token,
      password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm border-2 border-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Coach Digital</h1>
              <p className="text-sm text-muted-foreground">Espace Client</p>
            </div>
          </div>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Bienvenue !</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Créez votre mot de passe pour accéder à votre espace client sécurisé
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez au moins 8 caractères avec des lettres et des chiffres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retapez votre mot de passe"
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={acceptInvitation.isPending}
              >
                {acceptInvitation.isPending ? "Création du compte..." : "Créer mon compte"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Vous avez déjà un compte ?{" "}
                  <a href="/client/login" className="text-primary hover:underline">
                    Se connecter
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© 2025 Coach Digital Paris. Tous droits réservés.</p>
          <p className="mt-1">
            Vos données sont protégées et chiffrées selon les normes RGPD
          </p>
        </div>
      </div>
    </div>
  );
}
