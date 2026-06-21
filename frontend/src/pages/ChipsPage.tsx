import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Eye, Plus, Search, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Badge, ChipStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { useRbac } from "@/hooks/useRbac";
import { compactICCID, onlyDigits } from "@/utils/formatters";
import type { ChipStatus, CreateChipRequest, CreateLoteRequest } from "@/types/api";
import { ActivateChipModal } from "@/pages/ChipDetailsPage";

const statuses: Array<ChipStatus | ""> = ["", "available", "active", "reserved", "suspended", "canceled"];

export function ChipsPage() {
  const { canOperate } = useRbac();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ChipStatus | "">("");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [activateICCID, setActivateICCID] = useState<string | null>(null);
  const chipsQuery = useQuery({ queryKey: ["chips", status], queryFn: () => mvnoService.listChips(status) });

  const chips = useMemo(() => {
    const term = onlyDigits(search);
    return (chipsQuery.data ?? []).filter((chip) => {
      if (!term) return true;
      return chip.iccid.includes(term) || chip.msisdn?.includes(term);
    });
  }, [chipsQuery.data, search]);

  const createMutation = useMutation({
    mutationFn: mvnoService.createChip,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chips"] });
      toast.success("Chip cadastrado.");
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  const createBatchMutation = useMutation({
    mutationFn: mvnoService.createLote,
    onSuccess: async (lote) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chips"] }),
        queryClient.invalidateQueries({ queryKey: ["chip-lotes"] })
      ]);
      toast.success(`${lote.quantidade} chips cadastrados no lote ${lote.nome}.`);
      setIsBatchOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Chips</h1>
          <p className="text-sm text-slate-500">Estoque, ativações, assinaturas e recargas</p>
        </div>
        {canOperate ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setIsBatchOpen(true)}>
              <Boxes className="h-4 w-4" />
              Novo lote
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo chip
            </Button>
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statuses.map((item) => (
              <Button key={item || "all"} type="button" variant={status === item ? "primary" : "secondary"} size="sm" onClick={() => setStatus(item)}>
                {item || "todos"}
              </Button>
            ))}
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar por ICCID ou MSISDN" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {chipsQuery.isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
          ) : chips.length === 0 ? (
            <div className="p-5"><EmptyState title="Nenhum chip encontrado" /></div>
          ) : (
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">ICCID</th>
                  <th className="px-5 py-3">MSISDN</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Plano atual</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {chips.map((chip) => (
                  <tr key={chip.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">{compactICCID(chip.iccid)}</td>
                    <td className="px-5 py-4">{chip.msisdn || "-"}</td>
                    <td className="px-5 py-4"><ChipStatusBadge status={chip.status} /></td>
                    <td className="px-5 py-4">{chip.cliente_id ? <Badge>{chip.cliente_id.slice(-8)}</Badge> : "-"}</td>
                    <td className="px-5 py-4">{chip.assinatura_atual?.plano.nome ?? "-"}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canOperate && chip.status !== "active" && chip.status !== "canceled" ? (
                          <Button size="sm" variant="secondary" onClick={() => setActivateICCID(chip.iccid)}>
                            <Zap className="h-4 w-4" />
                            Ativar
                          </Button>
                        ) : null}
                        <Link
                          className="inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-muted"
                          to={`/dashboard/chips/${chip.iccid}`}
                        >
                            <Eye className="h-4 w-4" />
                            Detalhes
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <CreateChipModal isOpen={isCreateOpen} isSaving={createMutation.isPending} onClose={() => setIsCreateOpen(false)} onSubmit={(payload) => createMutation.mutate(payload)} />
      <CreateBatchModal isOpen={isBatchOpen} isSaving={createBatchMutation.isPending} onClose={() => setIsBatchOpen(false)} onSubmit={(payload) => createBatchMutation.mutate(payload)} />
      <ActivateChipModal iccid={activateICCID} isOpen={Boolean(activateICCID)} onClose={() => setActivateICCID(null)} />
    </div>
  );
}

function CreateBatchModal({ isOpen, isSaving, onClose, onSubmit }: { isOpen: boolean; isSaving: boolean; onClose: () => void; onSubmit: (payload: CreateLoteRequest) => void }) {
  const [form, setForm] = useState<CreateLoteRequest>({
    nome: "",
    descricao: "",
    quantidade: 10,
    iccid_prefix: "",
    msisdn_prefix: "",
    imsi_prefix: "",
    operadora: "MVNO",
    tags: []
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      ...form,
      quantidade: Number(form.quantidade),
      iccid_prefix: onlyDigits(form.iccid_prefix),
      msisdn_prefix: onlyDigits(form.msisdn_prefix ?? ""),
      imsi_prefix: onlyDigits(form.imsi_prefix ?? "")
    });
  }

  return (
    <Modal title="Cadastrar chips em lote" description="Os números serão gerados sequencialmente a partir dos prefixos informados." isOpen={isOpen} onClose={onClose}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Nome do lote</span>
          <Input required minLength={2} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Quantidade</span>
          <Input required type="number" min={1} max={1000} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Descrição</span>
          <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Prefixo ICCID</span>
          <Input required minLength={6} inputMode="numeric" placeholder="89550001" value={form.iccid_prefix} onChange={(e) => setForm({ ...form, iccid_prefix: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Prefixo MSISDN</span>
          <Input inputMode="numeric" placeholder="55859" value={form.msisdn_prefix} onChange={(e) => setForm({ ...form, msisdn_prefix: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Prefixo IMSI</span>
          <Input inputMode="numeric" placeholder="72400" value={form.imsi_prefix} onChange={(e) => setForm({ ...form, imsi_prefix: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Operadora</span>
          <Input value={form.operadora} onChange={(e) => setForm({ ...form, operadora: e.target.value })} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Tags</span>
          <Input placeholder="lote-01, eSIM" onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving}>{isSaving ? "Cadastrando..." : `Cadastrar ${form.quantidade || 0} chips`}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateChipModal({ isOpen, isSaving, onClose, onSubmit }: { isOpen: boolean; isSaving: boolean; onClose: () => void; onSubmit: (payload: CreateChipRequest) => void }) {
  const [form, setForm] = useState<CreateChipRequest>({ iccid: "", msisdn: "", operadora: "MVNO", imsi: "", tags: [] });
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ ...form, iccid: onlyDigits(form.iccid), msisdn: onlyDigits(form.msisdn ?? ""), imsi: onlyDigits(form.imsi ?? "") });
  }
  return (
    <Modal title="Novo chip" isOpen={isOpen} onClose={onClose}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">ICCID</span>
          <Input required value={form.iccid} onChange={(e) => setForm({ ...form, iccid: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">MSISDN</span>
          <Input value={form.msisdn} onChange={(e) => setForm({ ...form, msisdn: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">IMSI</span>
          <Input value={form.imsi} onChange={(e) => setForm({ ...form, imsi: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Operadora</span>
          <Input value={form.operadora} onChange={(e) => setForm({ ...form, operadora: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Tags</span>
          <Input placeholder="lote-01, eSIM" onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
