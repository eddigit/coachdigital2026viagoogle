import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { ArrowLeft, Briefcase, FileText, Code, StickyNote, CheckSquare, FileCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;

  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: client } = trpc.clients.getById.useQuery(
    { id: project?.clientId || 0 },
    { enabled: !!project?.clientId }
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Link href="/projects">
            <Button className="mt-4">Retour aux projets</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux projets
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 shrink-0">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} className="object-cover" />
              ) : (
                <AvatarFallback>
                  <Briefcase className="h-8 w-8" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {client && (
                <p className="text-muted-foreground mt-1">
                  Client : {client.firstName} {client.lastName}
                  {client.company && ` - ${client.company}`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === "active"
                    ? "bg-blue-100 text-blue-700"
                    : project.status === "on_hold"
                    ? "bg-yellow-100 text-yellow-700"
                    : project.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {project.status === "active"
                  ? "Actif"
                  : project.status === "on_hold"
                  ? "En pause"
                  : project.status === "cancelled"
                  ? "Annulé"
                  : "Brouillon"}
              </span>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Briefcase className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="requirements">
              <FileText className="h-4 w-4 mr-2" />
              Cahier des charges
            </TabsTrigger>
            <TabsTrigger value="env">
              <Code className="h-4 w-4 mr-2" />
              Variables
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tâches
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileCheck className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du Projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Nom</span>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-medium capitalize">{project.status}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Date de début</span>
                    <span className="font-medium">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString("fr-FR") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Date de fin</span>
                    <span className="font-medium">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString("fr-FR") : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client ? (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Nom</span>
                        <span className="font-medium">
                          {client.firstName} {client.lastName}
                        </span>
                      </div>
                      {client.company && (
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Entreprise</span>
                          <span className="font-medium">{client.company}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Téléphone</span>
                          <span className="font-medium">{client.phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Aucun client associé</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Cahier des charges */}
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Cahier des Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Variables d'environnement */}
          <TabsContent value="env">
            <Card>
              <CardHeader>
                <CardTitle>Variables d'Environnement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notes */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Tâches */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tâches du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fonctionnalité à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
