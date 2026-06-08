import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { useRbac } from "@/hooks/useRbac";
import { maskCep, maskDocument, maskPhone, onlyDigits } from "@/utils/formatters";
import type { CreateClienteRequest } from "@/types/api";

export function ClientesPage() {
  const { canOperate } = useRbac();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["clientes"], queryFn: mvnoService.listClientes });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return (data ?? []).filter((cliente) =>
      [cliente.nome, cliente.documento, cliente.contato.email, cliente.endereco.uf].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, search]);

  const createMutation = useMutation({
    mutationFn: mvnoService.createCliente,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente criado.");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro e vínculo operacional de assinantes</p>
        </div>
        {canOperate ? (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar por nome, documento, email ou UF" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-5"><EmptyState title="Nenhum cliente encontrado" /></div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">UF</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">{cliente.nome}</td>
                    <td className="px-5 py-4">{maskDocument(cliente.documento)}</td>
                    <td className="px-5 py-4">{cliente.contato.email || cliente.contato.telefone || "-"}</td>
                    <td className="px-5 py-4">{cliente.endereco.uf || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ClienteModal
        isOpen={isModalOpen}
        isSaving={createMutation.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
}

function ClienteModal({
  isOpen,
  isSaving,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClienteRequest) => void;
}) {
  const [form, setForm] = useState<CreateClienteRequest>({
    nome: "",
    documento: "",
    contato: { email: "", telefone: "" },
    endereco: { logradouro: "", numero: "", cidade: "", uf: "", cep: "" },
    tags: []
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      ...form,
      documento: onlyDigits(form.documento),
      contato: { ...form.contato, telefone: onlyDigits(form.contato.telefone ?? "") },
      endereco: { ...form.endereco, cep: onlyDigits(form.endereco.cep ?? "") }
    });
  }

  return (
    <Modal title="Novo cliente" isOpen={isOpen} onClose={onClose}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Nome</span>
          <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">CPF/CNPJ</span>
          <Input required value={maskDocument(form.documento)} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Telefone</span>
          <Input value={maskPhone(form.contato.telefone ?? "")} onChange={(e) => setForm({ ...form, contato: { ...form.contato, telefone: e.target.value } })} />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Email</span>
          <Input type="email" value={form.contato.email} onChange={(e) => setForm({ ...form, contato: { ...form.contato, email: e.target.value } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Cidade</span>
          <Input value={form.endereco.cidade} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cidade: e.target.value } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">UF</span>
          <Input maxLength={2} value={form.endereco.uf} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, uf: e.target.value.toUpperCase() } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">CEP</span>
          <Input value={maskCep(form.endereco.cep ?? "")} onChange={(e) => setForm({ ...form, endereco: { ...form.endereco, cep: e.target.value } })} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Tags</span>
          <Input placeholder="vip, varejo" onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
