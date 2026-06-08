import { useQuery } from "@tanstack/react-query";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { formatCurrency } from "@/utils/formatters";

const revenue = [
  { dia: "Seg", valor: 1200 },
  { dia: "Ter", valor: 1850 },
  { dia: "Qua", valor: 1640 },
  { dia: "Qui", valor: 2300 },
  { dia: "Sex", valor: 2880 },
  { dia: "Sáb", valor: 2100 }
];

export function DashboardPage() {
  const chipsQuery = useQuery({ queryKey: ["chips"], queryFn: () => mvnoService.listChips() });
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: mvnoService.listClientes });
  const chips = chipsQuery.data ?? [];
  const active = chips.filter((chip) => chip.status === "active").length;
  const available = chips.filter((chip) => chip.status === "available").length;
  const byStatus = [
    { name: "Ativos", value: active, color: "#10b981" },
    { name: "Disponíveis", value: available, color: "#94a3b8" },
    { name: "Outros", value: Math.max(chips.length - active - available, 0), color: "#f59e0b" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumo operacional da base MVNO</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Chips ativos" value={active} loading={chipsQuery.isLoading} />
        <KpiCard label="Clientes cadastrados" value={clientesQuery.data?.length ?? 0} loading={clientesQuery.isLoading} />
        <KpiCard label="Faturamento estimado" value={formatCurrency(12_430)} loading={false} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Recargas por dia</h2>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue}>
                <XAxis dataKey="dia" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="valor" stroke="#0ea5e9" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Status dos chips</h2>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86}>
                  {byStatus.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ label, value, loading }: { label: string; value: number | string; loading: boolean }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-2 text-3xl font-bold text-ink">{value}</p>}
      </CardContent>
    </Card>
  );
}
