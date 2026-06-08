import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, RefreshCw, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { AssinaturaStatusBadge, ChipStatusBadge, RecargaStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { useRbac } from "@/hooks/useRbac";
import { compactICCID, formatCurrency, formatDate, maskMoneyInput, parseMoney } from "@/utils/formatters";
import type { AtivarChipRequest, CreateRecargaRequest } from "@/types/api";

type TabKey = "recargas" | "assinaturas";

export function ChipDetailsPage() {
  const { iccid = "" } = useParams();
  const { canOperate } = useRbac();
  const [tab, setTab] = useState<TabKey>("recargas");
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const chipQuery = useQuery({ queryKey: ["chip", iccid], queryFn: () => mvnoService.getChip(iccid), enabled: Boolean(iccid) });
  const recargasQuery = useQuery({ queryKey: ["recargas", iccid], queryFn: () => mvnoService.listRecargas(iccid), enabled: Boolean(iccid) });
  const assinaturasQuery = useQuery({ queryKey: ["assinaturas", iccid], queryFn: () => mvnoService.listAssinaturas(iccid), enabled: Boolean(iccid) });
  const chip = chipQuery.data;
  const canRecharge = canOperate && chip?.status === "active";
  const canActivate = canOperate && chip && chip.status !== "active" && chip.status !== "canceled";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link className="mb-2 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary" to="/dashboard/chips">
            <ArrowLeft className="h-4 w-4" />
            Voltar para chips
          </Link>
          <h1 className="text-2xl font-bold text-ink">Chip {compactICCID(iccid)}</h1>
          <p className="text-sm text-slate-500">Visão 360º da linha, assinatura e histórico operacional</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canActivate ? (
            <Button onClick={() => setIsActivateOpen(true)}>
              <Zap className="h-4 w-4" />
              Ativar Chip
            </Button>
          ) : null}
          <Button disabled={!canRecharge} variant="secondary" onClick={() => setIsRechargeOpen(true)}>
            <CreditCard className="h-4 w-4" />
            Realizar Recarga
          </Button>
        </div>
      </div>

      {chipQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-64 xl:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : !chip ? (
        <EmptyState title="Chip não encontrado" />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">Dados operacionais</h2>
                  <ChipStatusBadge status={chip.status} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Info label="ICCID" value={chip.iccid} />
                <Info label="MSISDN" value={chip.msisdn || "-"} />
                <Info label="IMSI" value={chip.rede.imsi || "-"} />
                <Info label="Operadora" value={chip.rede.operadora || "-"} />
                <Info label="Cliente ID" value={chip.cliente_id || "-"} />
                <Info label="Plano ID" value={chip.plano_id || "-"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink">Assinatura atual</h2>
              </CardHeader>
              <CardContent>
                {chip.assinatura_atual ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-ink">{chip.assinatura_atual.plano.nome}</p>
                        <p className="text-sm text-slate-500">
                          {formatCurrency(chip.assinatura_atual.plano.valor, chip.assinatura_atual.plano.moeda)}
                        </p>
                      </div>
                      <AssinaturaStatusBadge status={chip.assinatura_atual.status} />
                    </div>
                    <Info label="Início" value={formatDate(chip.assinatura_atual.inicio_em)} />
                    <div className="grid grid-cols-3 gap-2">
                      <Metric label="Dados" value={`${Math.round(chip.assinatura_atual.plano.beneficios.dados_mb / 1024)}GB`} />
                      <Metric label="Voz" value={`${chip.assinatura_atual.plano.beneficios.voz_min} min`} />
                      <Metric label="SMS" value={`${chip.assinatura_atual.plano.beneficios.sms}`} />
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Sem assinatura ativa" description="Ative o chip para embutir o snapshot do plano atual." />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex gap-2">
                <Button size="sm" variant={tab === "recargas" ? "primary" : "secondary"} onClick={() => setTab("recargas")}>Histórico de Recargas</Button>
                <Button size="sm" variant={tab === "assinaturas" ? "primary" : "secondary"} onClick={() => setTab("assinaturas")}>Histórico de Assinaturas</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {tab === "recargas" ? (
                recargasQuery.isLoading ? <HistorySkeleton /> : <RecargasTable recargas={recargasQuery.data ?? []} />
              ) : assinaturasQuery.isLoading ? (
                <HistorySkeleton />
              ) : (
                <AssinaturasTable assinaturas={assinaturasQuery.data ?? []} />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ActivateChipModal iccid={iccid} isOpen={isActivateOpen} onClose={() => setIsActivateOpen(false)} />
      <RechargeModal iccid={iccid} isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} />
    </div>
  );
}

export function ActivateChipModal({ iccid, isOpen, onClose }: { iccid: string | null; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [planoId, setPlanoId] = useState("");
  const clientesQuery = useQuery({ queryKey: ["clientes"], queryFn: mvnoService.listClientes, enabled: isOpen });
  const planosQuery = useQuery({ queryKey: ["planos"], queryFn: mvnoService.listPlanos, enabled: isOpen });
  const mutation = useMutation({
    mutationFn: (payload: AtivarChipRequest) => mvnoService.activateChip(iccid ?? "", payload),
    onSuccess: async (chip) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chips"] }),
        queryClient.invalidateQueries({ queryKey: ["chip", chip.iccid] }),
        queryClient.invalidateQueries({ queryKey: ["assinaturas", chip.iccid] })
      ]);
      toast.success("Chip ativado.");
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ cliente_id: clienteId, plano_id: planoId });
  }

  return (
    <Modal title="Ativar chip" description={iccid ? compactICCID(iccid) : undefined} isOpen={isOpen} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Cliente</span>
          <Select required value={clienteId} onChange={(event) => setClienteId(event.target.value)}>
            <option value="">Selecione um cliente</option>
            {(clientesQuery.data ?? []).map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nome} - {cliente.documento}</option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Plano</span>
          <Select required value={planoId} onChange={(event) => setPlanoId(event.target.value)}>
            <option value="">Selecione um plano</option>
            {(planosQuery.data ?? []).map((plano) => (
              <option key={plano.id} value={plano.id}>{plano.nome} - {formatCurrency(plano.valor, plano.moeda)}</option>
            ))}
          </Select>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={mutation.isPending || !iccid}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Confirmar ativação
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RechargeModal({ iccid, isOpen, onClose }: { iccid: string; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("0,00");
  const mutation = useMutation({
    mutationFn: (payload: CreateRecargaRequest) => mvnoService.createRecarga(iccid, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recargas", iccid] });
      toast.success("Recarga registrada.");
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ valor: parseMoney(amount), moeda: "BRL" });
  }

  return (
    <Modal title="Realizar recarga" description={compactICCID(iccid)} isOpen={isOpen} onClose={onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Valor</span>
          <Input value={amount} onChange={(event) => setAmount(maskMoneyInput(event.target.value))} />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Confirmar recarga
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}

function HistorySkeleton() {
  return <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>;
}

function RecargasTable({ recargas }: { recargas: Awaited<ReturnType<typeof mvnoService.listRecargas>> }) {
  if (recargas.length === 0) return <div className="p-5"><EmptyState title="Nenhuma recarga registrada" /></div>;
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead className="border-b border-border bg-muted text-xs uppercase text-slate-500">
        <tr><th className="px-5 py-3">Data</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Referência</th></tr>
      </thead>
      <tbody>{recargas.map((recarga) => (
        <tr key={recarga.id} className="border-b border-border last:border-0">
          <td className="px-5 py-4">{formatDate(recarga.solicitada_em)}</td>
          <td className="px-5 py-4 font-medium">{formatCurrency(recarga.valor, recarga.moeda)}</td>
          <td className="px-5 py-4"><RecargaStatusBadge status={recarga.status} /></td>
          <td className="px-5 py-4">{recarga.referencia || "-"}</td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function AssinaturasTable({ assinaturas }: { assinaturas: Awaited<ReturnType<typeof mvnoService.listAssinaturas>> }) {
  if (assinaturas.length === 0) return <div className="p-5"><EmptyState title="Nenhuma assinatura registrada" /></div>;
  return (
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="border-b border-border bg-muted text-xs uppercase text-slate-500">
        <tr><th className="px-5 py-3">Início</th><th className="px-5 py-3">Plano</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Status</th></tr>
      </thead>
      <tbody>{assinaturas.map((assinatura) => (
        <tr key={assinatura.id} className="border-b border-border last:border-0">
          <td className="px-5 py-4">{formatDate(assinatura.inicio_em)}</td>
          <td className="px-5 py-4 font-medium">{assinatura.plano.nome}</td>
          <td className="px-5 py-4">{formatCurrency(assinatura.plano.valor, assinatura.plano.moeda)}</td>
          <td className="px-5 py-4"><AssinaturaStatusBadge status={assinatura.status} /></td>
        </tr>
      ))}</tbody>
    </table>
  );
}
