import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileBarChart } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRbac } from "@/hooks/useRbac";
import { mvnoService } from "@/services/mvno";
import { formatDate } from "@/utils/formatters";
import type { Chip, ChipStatus } from "@/types/api";

const statusLabels: Record<ChipStatus, string> = {
  available: "Disponíveis",
  reserved: "Reservados",
  active: "Ativos",
  suspended: "Suspensos",
  canceled: "Cancelados"
};

const statusColors: Record<ChipStatus, string> = {
  available: "#64748b",
  reserved: "#f59e0b",
  active: "#10b981",
  suspended: "#ef4444",
  canceled: "#991b1b"
};

export function ReportsPage() {
  const { canOperate } = useRbac();
  const chipsQuery = useQuery({ queryKey: ["chips"], queryFn: () => mvnoService.listChips() });
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: mvnoService.listClientes });
  const planosQuery = useQuery({ queryKey: ["planos"], queryFn: mvnoService.listPlanos });
  const lotesQuery = useQuery({
    queryKey: ["chip-lotes"],
    queryFn: mvnoService.listLotes,
    enabled: canOperate
  });

  const chips = chipsQuery.data ?? [];
  const statusData = useMemo(() => {
    const counts = chips.reduce<Record<ChipStatus, number>>(
      (result, chip) => {
        result[chip.status] += 1;
        return result;
      },
      { available: 0, reserved: 0, active: 0, suspended: 0, canceled: 0 }
    );
    return (Object.keys(counts) as ChipStatus[])
      .map((status) => ({
        status,
        name: statusLabels[status],
        value: counts[status],
        color: statusColors[status]
      }))
      .filter((item) => item.value > 0);
  }, [chips]);

  const planData = useMemo(() => {
    const counts = new Map<string, number>();
    chips.forEach((chip) => {
      const name = chip.assinatura_atual?.plano.nome;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [chips]);

  const operatorData = useMemo(() => {
    const counts = new Map<string, number>();
    chips.forEach((chip) => {
      const name = chip.rede.operadora || "Não informada";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [chips]);

  const active = statusData.find((item) => item.status === "active")?.value ?? 0;
  const linked = chips.filter((chip) => chip.cliente_id).length;
  const activationRate = chips.length ? Math.round((active / chips.length) * 100) : 0;
  const isLoading = chipsQuery.isLoading || clientesQuery.isLoading || planosQuery.isLoading;

  function exportCSV() {
    if (!chips.length) {
      toast.error("Não há chips para exportar.");
      return;
    }
    const rows = [
      ["ICCID", "MSISDN", "Status", "Operadora", "Cliente ID", "Plano"],
      ...chips.map((chip) => [
        chip.iccid,
        chip.msisdn ?? "",
        statusLabels[chip.status],
        chip.rede.operadora ?? "",
        chip.cliente_id ?? "",
        chip.assinatura_atual?.plano.nome ?? ""
      ])
    ];
    const csv = rows.map((row) => row.map(csvValue).join(";")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-chips-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Relatórios</h1>
          <p className="text-sm text-slate-500">Indicadores calculados com os dados atuais da operação</p>
        </div>
        <Button onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Exportar chips
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Chips cadastrados" value={chips.length} loading={isLoading} />
        <Metric label="Clientes" value={clientesQuery.data?.length ?? 0} loading={isLoading} />
        <Metric label="Planos ativos" value={planosQuery.data?.length ?? 0} loading={isLoading} />
        <Metric label="Taxa de ativação" value={`${activationRate}%`} detail={`${linked} chips vinculados`} loading={isLoading} />
      </div>

      {chipsQuery.isError ? (
        <Card><CardContent><EmptyState title="Não foi possível carregar os dados" description={chipsQuery.error.message} /></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-ink">Chips por status</h2>
            </CardHeader>
            <CardContent className="h-72">
              {chipsQuery.isLoading ? <Skeleton className="h-full" /> : statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                      {statusData.map((item) => <Cell key={item.status} fill={item.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} chips`, "Quantidade"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState title="Nenhum chip cadastrado" />}
            </CardContent>
            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
              {statusData.map((item) => <Badge key={item.status}>{item.name}: {item.value}</Badge>)}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-ink">Chips por operadora</h2>
            </CardHeader>
            <CardContent className="h-72">
              {chipsQuery.isLoading ? <Skeleton className="h-full" /> : operatorData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatorData} margin={{ left: 0, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                    <Tooltip formatter={(value: number) => [`${value} chips`, "Quantidade"]} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState title="Sem dados de operadora" />}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Planos em uso</h2>
          </CardHeader>
          <CardContent>
            {planData.length ? (
              <div className="space-y-3">
                {planData.map((item) => {
                  const width = active ? Math.max((item.value / active) * 100, 4) : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="text-slate-500">{item.value} chips</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState title="Nenhum plano em uso" description="Os planos aparecerão após a ativação dos chips." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-ink">Lotes recentes</h2>
          </CardHeader>
          <CardContent>
            {!canOperate ? (
              <p className="text-sm text-slate-500">Disponível para administradores e operadores.</p>
            ) : lotesQuery.isLoading ? (
              <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : (lotesQuery.data ?? []).length ? (
              <div className="divide-y divide-border">
                {(lotesQuery.data ?? []).slice(0, 5).map((lote) => (
                  <div key={lote.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{lote.nome}</p>
                      <p className="text-xs text-slate-500">{formatDate(lote.criado_em)}</p>
                    </div>
                    <Badge tone="blue">{lote.quantidade} chips</Badge>
                  </div>
                ))}
              </div>
            ) : <EmptyState title="Nenhum lote cadastrado" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, loading }: { label: string; value: string | number; detail?: string; loading: boolean }) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-primary">
          <FileBarChart className="h-4 w-4" />
        </div>
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-bold text-ink">{value}</p>}
        {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function csvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
