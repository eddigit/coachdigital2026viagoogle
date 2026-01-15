import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

type ExportType = "clients" | "leads" | "documents" | "invoicesDetailed";

interface ExportButtonProps {
  type: ExportType;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

function downloadCSV(data: { headers: string[]; rows: (string | number)[][] }, filename: string) {
  const escapeCSV = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    data.headers.map(escapeCSV).join(","),
    ...data.rows.map(row => row.map(escapeCSV).join(","))
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportButton({ type, label, variant = "outline", size = "sm" }: ExportButtonProps) {
  const { refetch: fetchClients, isFetching: fetchingClients } = trpc.export.clients.useQuery(undefined, { enabled: false });
  const { refetch: fetchLeads, isFetching: fetchingLeads } = trpc.export.leads.useQuery(undefined, { enabled: false });
  const { refetch: fetchDocuments, isFetching: fetchingDocuments } = trpc.export.documents.useQuery(undefined, { enabled: false });
  const { refetch: fetchInvoices, isFetching: fetchingInvoices } = trpc.export.invoicesDetailed.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    try {
      const now = new Date().toISOString().split("T")[0];
      
      if (type === "clients") {
        const { data } = await fetchClients();
        if (data) {
          downloadCSV(data, `clients_${now}.csv`);
          toast.success("Export clients terminé");
        }
      } else if (type === "leads") {
        const { data } = await fetchLeads();
        if (data) {
          downloadCSV(data, `leads_${now}.csv`);
          toast.success("Export leads terminé");
        }
      } else if (type === "documents") {
        const { data } = await fetchDocuments();
        if (data) {
          downloadCSV(data, `documents_${now}.csv`);
          toast.success("Export documents terminé");
        }
      } else if (type === "invoicesDetailed") {
        const { data } = await fetchInvoices();
        if (data) {
          downloadCSV(data, `factures_${now}.csv`);
          toast.success("Export factures terminé");
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const isFetching = fetchingClients || fetchingLeads || fetchingDocuments || fetchingInvoices;

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={isFetching}>
      <Download className="h-4 w-4 mr-2" />
      {label || "Exporter CSV"}
    </Button>
  );
}

export function ExportDropdown() {
  const { refetch: fetchClients } = trpc.export.clients.useQuery(undefined, { enabled: false });
  const { refetch: fetchLeads } = trpc.export.leads.useQuery(undefined, { enabled: false });
  const { refetch: fetchDocuments } = trpc.export.documents.useQuery(undefined, { enabled: false });
  const { refetch: fetchInvoices } = trpc.export.invoicesDetailed.useQuery(undefined, { enabled: false });

  const handleExport = async (type: ExportType) => {
    try {
      const now = new Date().toISOString().split("T")[0];
      
      if (type === "clients") {
        const { data } = await fetchClients();
        if (data) {
          downloadCSV(data, `clients_${now}.csv`);
          toast.success("Export clients terminé");
        }
      } else if (type === "leads") {
        const { data } = await fetchLeads();
        if (data) {
          downloadCSV(data, `leads_${now}.csv`);
          toast.success("Export leads terminé");
        }
      } else if (type === "documents") {
        const { data } = await fetchDocuments();
        if (data) {
          downloadCSV(data, `documents_${now}.csv`);
          toast.success("Export documents terminé");
        }
      } else if (type === "invoicesDetailed") {
        const { data } = await fetchInvoices();
        if (data) {
          downloadCSV(data, `factures_${now}.csv`);
          toast.success("Export factures terminé");
        }
      }
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exports CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("clients")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter Clients
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("leads")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter Leads
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("documents")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter Documents
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("invoicesDetailed")}>
          <Download className="h-4 w-4 mr-2" />
          Exporter Factures (détaillé)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
