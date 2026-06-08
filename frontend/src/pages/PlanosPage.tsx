import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { useRbac } from "@/hooks/useRbac";
import { formatCurrency } from "@/utils/formatters";
import type { CreatePlanoRequest } from "@/types/api";

export function PlanosPage() {
  const { canCreatePlans } = useRbac();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["planos"], queryFn: mvnoService.listPlanos });
  const mutation = useMutation({
    mutationFn: mvnoService.createPlano,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["planos"] });
      toast.success("Plano criado.");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Planos</h1>
          <p className="text-sm text-slate-500">Catálogo comercial usado nas ativações</p>
        </div>
        {canCreatePlans ? (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Criar Plano
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-44" />)
          : (data ?? []).map((plano) => (
              <Card key={plano.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-ink">{plano.nome}</h2>
                      <p className="mt-1 text-sm text-slate-500">{plano.descricao}</p>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(plano.valor, plano.moeda)}</p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <Metric label="Dados" value={`${Math.round(plano.beneficios.dados_mb / 1024)}GB`} />
                    <Metric label="Voz" value={`${plano.beneficios.voz_min} min`} />
                    <Metric label="Ciclo" value={`${plano.ciclo_dias} dias`} />
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    {plano.beneficios.apps?.length ? plano.beneficios.apps.join(" | ") : "Sem apps inclusos"}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <PlanoModal isOpen={isModalOpen} isSaving={mutation.isPending} onClose={() => setIsModalOpen(false)} onSubmit={(payload) => mutation.mutate(payload)} />
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

function PlanoModal({ isOpen, isSaving, onClose, onSubmit }: { isOpen: boolean; isSaving: boolean; onClose: () => void; onSubmit: (payload: CreatePlanoRequest) => void }) {
  const [form, setForm] = useState<CreatePlanoRequest>({
    nome: "",
    descricao: "",
    valor: 0,
    moeda: "BRL",
    ciclo_dias: 30,
    beneficios: { dados_mb: 10240, voz_min: 100, sms: 50, apps: [] }
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <Modal title="Criar plano" isOpen={isOpen} onClose={onClose}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Nome</span>
          <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Descrição</span>
          <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Valor</span>
          <Input type="number" min={0} step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Ciclo</span>
          <Input type="number" min={1} value={form.ciclo_dias} onChange={(e) => setForm({ ...form, ciclo_dias: Number(e.target.value) })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Dados MB</span>
          <Input type="number" value={form.beneficios.dados_mb} onChange={(e) => setForm({ ...form, beneficios: { ...form.beneficios, dados_mb: Number(e.target.value) } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Voz min</span>
          <Input type="number" value={form.beneficios.voz_min} onChange={(e) => setForm({ ...form, beneficios: { ...form.beneficios, voz_min: Number(e.target.value) } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">SMS</span>
          <Input type="number" value={form.beneficios.sms} onChange={(e) => setForm({ ...form, beneficios: { ...form.beneficios, sms: Number(e.target.value) } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Apps</span>
          <Input placeholder="whatsapp, redes sociais" onChange={(e) => setForm({ ...form, beneficios: { ...form.beneficios, apps: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
