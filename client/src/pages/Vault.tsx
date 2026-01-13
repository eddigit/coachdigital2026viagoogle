import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function Vault() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Coffre-fort</h1>
        <Card><CardContent className="py-12 text-center">Fonctionnalité en cours de développement</CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
