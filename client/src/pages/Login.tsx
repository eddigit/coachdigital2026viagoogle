import { useState } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/_core/hooks/useFirebaseAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
    const [, setLocation] = useLocation();
    const { login, loginGoogle, loading, isAuthenticated } = useFirebaseAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated && !loading) {
        setLocation("/today");
        return null;
    }

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
            toast.success("Connexion réussie !");
            setLocation("/today");
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.code === "auth/invalid-credential") {
                toast.error("Email ou mot de passe incorrect");
            } else if (error.code === "auth/user-not-found") {
                toast.error("Utilisateur non trouvé");
            } else if (error.code === "auth/wrong-password") {
                toast.error("Mot de passe incorrect");
            } else {
                toast.error("Erreur de connexion : " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            await loginGoogle();
            toast.success("Connexion réussie !");
            setLocation("/today");
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === "auth/popup-closed-by-user") {
                toast.info("Connexion annulée");
            } else {
                toast.error("Erreur de connexion Google : " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">CD</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Coach Digital</CardTitle>
                    <CardDescription className="text-gray-400">
                        Connectez-vous à votre espace admin
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Google Login Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0"
                        onClick={handleGoogleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Chrome className="w-4 h-4 mr-2" />
                        )}
                        Continuer avec Google
                    </Button>

                    <div className="relative">
                        <Separator className="bg-gray-700" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 px-3 text-sm text-gray-500">
                            ou
                        </span>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">
                                Mot de passe
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Se connecter
                        </Button>
                    </form>

                    <p className="text-center text-sm text-gray-500">
                        Espace réservé aux administrateurs
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
