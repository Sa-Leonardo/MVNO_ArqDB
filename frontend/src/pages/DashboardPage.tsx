import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { formatCurrency } from "@/utils/formatters";

// Funções auxiliares locais
function formatCompactNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return value.toString();
}

function timeAgo(date: Date): string {
  const diffMinutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
  if (diffMinutes < 1) return "agora mesmo";
  if (diffMinutes < 60) return `${diffMinutes} min atrás`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
  return `${Math.floor(diffMinutes / 1440)}d atrás`;
}

// Componente Alert simples
function SimpleAlert({ children, variant = "info" }: { children: React.ReactNode; variant?: "warning" | "info" | "success" }) {
  const colors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return <div className={`p-3 rounded-lg border ${colors[variant]}`}>{children}</div>;
}

type Period = "7d" | "30d" | "90d";

// Dados mockados para gráficos
const mockRevenueData = {
  "7d": [
    { dia: "Seg", valor: 1200 },
    { dia: "Ter", valor: 1850 },
    { dia: "Qua", valor: 1640 },
    { dia: "Qui", valor: 2300 },
    { dia: "Sex", valor: 2880 },
    { dia: "Sáb", valor: 2100 },
    { dia: "Dom", valor: 950 },
  ],
  "30d": Array.from({ length: 30 }, (_, i) => ({
    dia: `Dia ${i + 1}`,
    valor: Math.floor(Math.random() * 3000) + 500,
  })),
  "90d": Array.from({ length: 90 }, (_, i) => ({
    dia: `Dia ${i + 1}`,
    valor: Math.floor(Math.random() * 3000) + 500,
  })),
};

// Dados mockados para atividades
const mockActivities = [
  { id: "1", cliente: "João Silva", chip: "8912****", acao: "Ativação" as const, data: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "2", cliente: "TechCorp", chip: "5532****", acao: "Recarga" as const, valor: 30, data: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: "3", cliente: "Maria Santos", chip: "7721****", acao: "Ativação" as const, data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

// Componente para renderizar labels customizadas
const renderCustomLabel = ({ name, percent, value }: { name: string; percent: number; value: number }) => {
  return `${value} (${(percent * 100).toFixed(0)}%)`;
};

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>("7d");

  const chipsQuery = useQuery({
    queryKey: ["chips"],
    queryFn: () => mvnoService.listChips(),
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes"],
    queryFn: () => mvnoService.listClientes(),
  });

  const chips = chipsQuery.data ?? [];
  const active = chips.filter((chip) => chip.status === "active").length;
  const available = chips.filter((chip) => chip.status === "available").length;
  const totalChips = chips.length;
  const occupancyRate = totalChips > 0 ? (active / totalChips) * 100 : 0;

  // Ticket médio (simulado)
  const averageTicket = 48.5;

  // Dados do gráfico de status
  const byStatus = [
    { name: "Ativos", value: active, color: "#10b981" },
    { name: "Disponíveis", value: available, color: "#94a3b8" },
    {
      name: "Outros",
      value: Math.max(totalChips - active - available, 0),
      color: "#f59e0b",
    },
  ];

  const inactiveChips = totalChips - active;

  // Dados do gráfico de faturamento (usando mock por enquanto)
  const revenueData = mockRevenueData[period];

  return (
    <div className="space-y-6">
      {/* Header com filtro de período */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-slate-500">Resumo operacional da base MVNO</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chips ativos"
          value={active}
          loading={chipsQuery.isLoading}
          subtitle={`${Math.round(occupancyRate)}% de ocupação`}
        />
        <KpiCard
          label="Clientes cadastrados"
          value={clientesQuery.data?.length ?? 0}
          loading={clientesQuery.isLoading}
        />
        <KpiCard
          label="Chips disponíveis"
          value={available}
          loading={chipsQuery.isLoading}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(averageTicket)}
          loading={false}
        />
      </div>

      {/* Gráficos principais - LAYOUT RESPONSIVO COM LARGURAS AJUSTADAS */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:grid-cols-[1fr_500px]">
        {/* Gráfico de faturamento */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Faturamento por dia</h2>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="dia" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12 }}
                  width={40}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de status dos chips - sem erro do labelStyle */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Status dos chips</h2>
          </CardHeader>
          <CardContent className="h-80 pt-2 pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  label={renderCustomLabel}
                  labelLine={true}
                >
                  {byStatus.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} chips`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de atividades e alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Últimas movimentações</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Alertas operacionais</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {inactiveChips > 0 && (
              <SimpleAlert variant="warning">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <span className="font-medium">Chips inativos</span>
                    <p className="text-sm mt-1">
                      {inactiveChips} {inactiveChips === 1 ? "chip não está" : "chips não estão"} em uso
                    </p>
                  </div>
                </div>
              </SimpleAlert>
            )}

            {available > 0 && (
              <SimpleAlert variant="info">
                <div className="flex items-start gap-2">
                  <span className="text-lg">📦</span>
                  <div>
                    <span className="font-medium">Chips disponíveis</span>
                    <p className="text-sm mt-1">
                      {available} {available === 1 ? "chip está" : "chips estão"} disponível(is) para ativação
                    </p>
                  </div>
                </div>
              </SimpleAlert>
            )}

            {active > 0 && active === totalChips && (
              <SimpleAlert variant="success">
                <div className="flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <span className="font-medium">Base totalmente ocupada</span>
                    <p className="text-sm mt-1">Todos os {totalChips} chips estão ativos</p>
                  </div>
                </div>
              </SimpleAlert>
            )}

            {inactiveChips === 0 && available === 0 && active === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhum chip cadastrado ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente de filtro de período
function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const periods: { label: string; value: Period }[] = [
    { label: "7 dias", value: "7d" },
    { label: "30 dias", value: "30d" },
    { label: "90 dias", value: "90d" },
  ];

  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            value === period.value
              ? "bg-white text-ink shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

// Componente de KPI
function KpiCard({
  label,
  value,
  loading,
  subtitle,
}: {
  label: string;
  value: number | string;
  loading: boolean;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-24" />
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de item de atividade
function ActivityItem({
  activity,
}: {
  activity: {
    id: string;
    cliente: string;
    chip: string;
    acao: "Ativação" | "Recarga" | "Desativação";
    valor?: number;
    data: Date;
  };
}) {
  const getActionColor = (acao: string) => {
    switch (acao) {
      case "Ativação":
        return "text-emerald-700 bg-emerald-50";
      case "Recarga":
        return "text-blue-700 bg-blue-50";
      case "Desativação":
        return "text-red-700 bg-red-50";
      default:
        return "text-slate-700 bg-slate-50";
    }
  };

  const getActionIcon = (acao: string) => {
    switch (acao) {
      case "Ativação":
        return "🟢";
      case "Recarga":
        return "💰";
      case "Desativação":
        return "🔴";
      default:
        return "📌";
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="text-lg">{getActionIcon(activity.acao)}</div>
        <div>
          <p className="text-sm font-medium text-ink">{activity.cliente}</p>
          <p className="text-xs text-slate-400">
            Chip {activity.chip} • {timeAgo(activity.data)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {activity.valor && (
          <span className="text-sm font-semibold text-ink">
            {formatCurrency(activity.valor)}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ${getActionColor(activity.acao)}`}>
          {activity.acao}
        </span>
      </div>
    </div>
  );
}