import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Calendar, CheckSquare, FileText, Users, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function RemindersWidget() {
  const [, setLocation] = useLocation();
  const { data: reminders, isLoading } = trpc.reminders.getAll.useQuery(undefined, {
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Rappels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReminders = 
    (reminders?.overdueLeads.length || 0) + 
    (reminders?.overdueTasks.length || 0) + 
    (reminders?.unpaidInvoices.length || 0);

  if (totalReminders === 0 && (reminders?.upcomingEvents.length || 0) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-500" />
            Aucun rappel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tout est à jour, aucune action urgente requise.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays > 1) return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <Card className="border-orange-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Rappels
            {totalReminders > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalReminders}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Leads en retard de relance */}
        {reminders?.overdueLeads && reminders.overdueLeads.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Users className="h-4 w-4 text-purple-500" />
              Relances en retard ({reminders.overdueLeads.length})
            </div>
            <div className="space-y-1">
              {reminders.overdueLeads.slice(0, 3).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => setLocation("/leads")}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lead.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.subtitle}</p>
                  </div>
                  <span className="text-xs text-red-500 whitespace-nowrap ml-2">
                    {formatDate(lead.dueDate)}
                  </span>
                </div>
              ))}
              {reminders.overdueLeads.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setLocation("/leads")}>
                  Voir tous ({reminders.overdueLeads.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tâches en retard */}
        {reminders?.overdueTasks && reminders.overdueTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <CheckSquare className="h-4 w-4 text-blue-500" />
              Tâches en retard ({reminders.overdueTasks.length})
            </div>
            <div className="space-y-1">
              {reminders.overdueTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => setLocation("/tasks")}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                  <span className="text-xs text-red-500 whitespace-nowrap ml-2">
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              ))}
              {reminders.overdueTasks.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setLocation("/tasks")}>
                  Voir toutes ({reminders.overdueTasks.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Factures impayées */}
        {reminders?.unpaidInvoices && reminders.unpaidInvoices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-red-500" />
              Factures en retard ({reminders.unpaidInvoices.length})
            </div>
            <div className="space-y-1">
              {reminders.unpaidInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => setLocation("/documents")}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{invoice.title}</p>
                    <p className="text-xs text-muted-foreground">{invoice.subtitle}</p>
                  </div>
                  <span className="text-xs text-red-500 whitespace-nowrap ml-2">
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              ))}
              {reminders.unpaidInvoices.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setLocation("/documents")}>
                  Voir toutes ({reminders.unpaidInvoices.length})
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Événements aujourd'hui */}
        {reminders?.upcomingEvents && reminders.upcomingEvents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-green-500" />
              Aujourd'hui ({reminders.upcomingEvents.length})
            </div>
            <div className="space-y-1">
              {reminders.upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => setLocation("/calendar")}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{event.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.eventType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
