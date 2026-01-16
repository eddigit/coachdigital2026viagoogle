import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Send, AlertCircle, CheckCircle, Clock, RefreshCw, Eye, MousePointerClick } from "lucide-react";

export default function EmailCampaigns() {

  const { data: campaigns = [], refetch } = trpc.emailCampaigns.list.useQuery();
  const { data: trackingStats } = trpc.emailTracking.getCampaignStats.useQuery(
    { campaignId: campaigns[0]?.id || 0 },
    { enabled: campaigns.length > 0 }
  );
  const retryCampaignMutation = trpc.emailCampaigns.retryFailed.useMutation();

  const handleRetryFailed = async (campaignId: number) => {
    try {
      await retryCampaignMutation.mutateAsync({ campaignId });
      toast.success("Relance des emails échoués en cours...");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la relance");
    }
  };

  const calculateSuccessRate = (sent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <div>
          <h1 className="text-3xl font-bold">Historique des Campagnes d'Emails</h1>
          <p className="text-muted-foreground">Suivez les performances de vos campagnes d'envoi de masse</p>
        </div>

        {/* Statistiques globales */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Campagnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Emails Envoyés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {campaigns.reduce((sum: number, c: any) => sum + c.sentCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Emails Échoués</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {campaigns.reduce((sum: number, c: any) => sum + c.failedCount, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {campaigns.reduce((sum: number, c: any) => sum + c.pendingCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistiques de tracking */}
        {campaigns.length > 0 && trackingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Taux d'Ouverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {trackingStats.openRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {trackingStats.totalOpened || 0} / {trackingStats.totalSent || 0} emails ouverts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4" />
                  Taux de Clic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {trackingStats.clickRate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {trackingStats.totalClicked || 0} / {trackingStats.totalSent || 0} emails cliqués
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {((trackingStats.openRate || 0) + (trackingStats.clickRate || 0)) / 2 > 0 
                    ? (((trackingStats.openRate || 0) + (trackingStats.clickRate || 0)) / 2).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score moyen d'engagement
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste des campagnes */}
        <Card>
          <CardHeader>
            <CardTitle>Campagnes d'Envoi</CardTitle>
            <CardDescription>Historique complet de toutes vos campagnes d'emails</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune campagne d'email pour le moment</p>
                <p className="text-sm mt-2">Les campagnes d'envoi de masse apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Template</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Envoyés</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Échoués</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">En attente</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Taux</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaigns.map((campaign: any) => {
                      const total = campaign.sentCount + campaign.failedCount + campaign.pendingCount;
                      const successRate = calculateSuccessRate(campaign.sentCount, total);
                      
                      return (
                        <tr key={campaign.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{campaign.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {new Date(campaign.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-muted-foreground">
                              {campaign.templateId ? `Template #${campaign.templateId}` : "Personnalisé"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{total}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>{campaign.sentCount}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>{campaign.failedCount}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-yellow-600">
                              <Clock className="h-3 w-3" />
                              <span>{campaign.pendingCount}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                successRate >= 90
                                  ? "bg-green-100 text-green-800"
                                  : successRate >= 70
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {successRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {campaign.failedCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryFailed(campaign.id)}
                                disabled={retryCampaignMutation.isPending}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Relancer
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


    </DashboardLayout>
  );
}

