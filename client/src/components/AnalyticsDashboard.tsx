import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { TrendingUp, TrendingDown, Target, Users, FileText, Clock } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  const { data: documents } = trpc.documents.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: leads } = trpc.leads.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();

  const getRevenueByMonth = () => {
    if (!documents) return { labels: [], data: [] };

    const now = new Date();
    const months: string[] = [];
    const revenues: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      months.push(monthLabel);

      const monthRevenue = documents
        .filter((doc) => {
          if (doc.type !== "invoice" || doc.status !== "paid") return false;
          const docDate = new Date(doc.date);
          return (
            docDate.getMonth() === date.getMonth() &&
            docDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, doc) => sum + parseFloat(doc.totalTtc || "0"), 0);

      revenues.push(monthRevenue);
    }

    return { labels: months, data: revenues };
  };

  const getClientsByCategory = () => {
    if (!clients) return { labels: [], data: [] };

    const categories = ["prospect", "active", "vip", "inactive"];
    const counts = categories.map(
      (cat) => clients.filter((c) => c.category === cat).length
    );

    const labels = ["Prospects", "Actifs", "VIP", "Inactifs"];

    return { labels, data: counts };
  };

  const getConversionRate = () => {
    if (!documents) return { labels: [], data: [] };

    const quotes = documents.filter((d) => d.type === "quote");
    const invoices = documents.filter((d) => d.type === "invoice");

    const totalQuotes = quotes.length;
    const converted = invoices.length;
    const notConverted = totalQuotes - converted;

    return {
      labels: ["Convertis en factures", "Non convertis"],
      data: [converted, notConverted > 0 ? notConverted : 0],
    };
  };

  const getLeadsPipeline = () => {
    if (!leads) return { labels: [], data: [], potential: 0, weighted: 0 };

    const statuses = ["suspect", "prospect", "analyse", "negociation", "conclusion", "ordre"];
    const labels = ["Suspect", "Prospect", "Analyse", "Négociation", "Conclusion", "Ordre"];
    const counts = statuses.map(
      (status) => leads.filter((l) => l.status === status).length
    );

    const potential = leads.reduce((sum, l) => sum + parseFloat(l.potentialAmount || "0"), 0);
    const weighted = leads.reduce(
      (sum, l) => sum + parseFloat(l.potentialAmount || "0") * (l.probability || 0) / 100,
      0
    );

    return { labels, data: counts, potential, weighted };
  };

  const getKPIs = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthRevenue = documents?.filter((doc) => {
      if (doc.type !== "invoice" || doc.status !== "paid") return false;
      const docDate = new Date(doc.date);
      return docDate.getMonth() === thisMonth && docDate.getFullYear() === thisYear;
    }).reduce((sum, doc) => sum + parseFloat(doc.totalTtc || "0"), 0) || 0;

    const lastMonthRevenue = documents?.filter((doc) => {
      if (doc.type !== "invoice" || doc.status !== "paid") return false;
      const docDate = new Date(doc.date);
      return docDate.getMonth() === lastMonth && docDate.getFullYear() === lastMonthYear;
    }).reduce((sum, doc) => sum + parseFloat(doc.totalTtc || "0"), 0) || 0;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const pendingQuotes = documents?.filter(d => d.type === "quote" && d.status === "sent").length || 0;
    const pendingQuotesValue = documents?.filter(d => d.type === "quote" && d.status === "sent")
      .reduce((sum, d) => sum + parseFloat(d.totalTtc || "0"), 0) || 0;

    const unpaidInvoices = documents?.filter(d => d.type === "invoice" && d.status === "sent").length || 0;
    const unpaidValue = documents?.filter(d => d.type === "invoice" && d.status === "sent")
      .reduce((sum, d) => sum + parseFloat(d.totalTtc || "0"), 0) || 0;

    const overdueTasks = tasks?.filter(t => {
      if (t.status === "done" || t.status === "cancelled") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now;
    }).length || 0;

    return {
      thisMonthRevenue,
      revenueGrowth,
      pendingQuotes,
      pendingQuotesValue,
      unpaidInvoices,
      unpaidValue,
      overdueTasks,
    };
  };

  const revenueData = getRevenueByMonth();
  const clientsData = getClientsByCategory();
  const conversionData = getConversionRate();
  const pipelineData = getLeadsPipeline();
  const kpis = getKPIs();

  const revenueChartData = {
    labels: revenueData.labels,
    datasets: [
      {
        label: "Chiffre d'affaires (€)",
        data: revenueData.data,
        backgroundColor: "rgba(230, 126, 80, 0.8)",
        borderColor: "rgba(230, 126, 80, 1)",
        borderWidth: 2,
      },
    ],
  };

  const pipelineChartData = {
    labels: pipelineData.labels,
    datasets: [
      {
        label: "Nombre de leads",
        data: pipelineData.data,
        backgroundColor: [
          "rgba(156, 163, 175, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(230, 126, 80, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const clientsChartData = {
    labels: clientsData.labels,
    datasets: [
      {
        data: clientsData.data,
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(230, 126, 80, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const conversionChartData = {
    labels: conversionData.labels,
    datasets: [
      {
        data: conversionData.data,
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: "rgb(156, 163, 175)",
          font: { family: "Inter" },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(156, 163, 175, 0.1)" },
      },
      x: {
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(156, 163, 175, 0.1)" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: "rgb(156, 163, 175)",
          font: { family: "Inter" },
        },
      },
    },
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tableau de Bord Analytique</h2>
        <p className="text-muted-foreground">
          Visualisez vos performances et statistiques clés
        </p>
      </div>

      {/* KPIs rapides */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CA ce mois</p>
                <p className="text-xl font-bold">{formatCurrency(kpis.thisMonthRevenue)}</p>
              </div>
              {kpis.revenueGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className={`text-xs mt-1 ${kpis.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
              {kpis.revenueGrowth >= 0 ? "+" : ""}{kpis.revenueGrowth.toFixed(0)}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Devis en attente</p>
                <p className="text-xl font-bold">{kpis.pendingQuotes}</p>
              </div>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpis.pendingQuotesValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Factures impayées</p>
                <p className="text-xl font-bold">{kpis.unpaidInvoices}</p>
              </div>
              <Target className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(kpis.unpaidValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tâches en retard</p>
                <p className="text-xl font-bold">{kpis.overdueTasks}</p>
              </div>
              <Clock className={`h-5 w-5 ${kpis.overdueTasks > 0 ? "text-red-500" : "text-green-500"}`} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.overdueTasks === 0 ? "Tout est à jour" : "À traiter"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline prospection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pipeline de Prospection (SPANCO)</span>
            <div className="text-sm font-normal text-muted-foreground">
              Potentiel: {formatCurrency(pipelineData.potential)} | Pondéré: {formatCurrency(pipelineData.weighted)}
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {leads?.length || 0} leads dans le pipeline
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <Bar data={pipelineChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Graphique chiffre d'affaires */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
          <p className="text-sm text-muted-foreground">
            Factures payées sur les 6 derniers mois
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Bar data={revenueChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Graphiques répartition et conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition clients */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Clients</CardTitle>
            <p className="text-sm text-muted-foreground">
              Par catégorie (Prospect, Actif, VIP, Inactif)
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={clientsChartData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Taux de conversion */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de Conversion</CardTitle>
            <p className="text-sm text-muted-foreground">
              Devis convertis en factures
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut data={conversionChartData} options={doughnutOptions} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {conversionData.data[0] > 0
                  ? Math.round(
                      (conversionData.data[0] /
                        (conversionData.data[0] + conversionData.data[1])) *
                        100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-muted-foreground">Taux de conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
