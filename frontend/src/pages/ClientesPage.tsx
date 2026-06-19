import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import { useRbac } from "@/hooks/useRbac";
import { maskCep, maskDocument, maskPhone, onlyDigits } from "@/utils/formatters";
import type { Chip, Cliente, CreateClienteRequest, UpdateClienteRequest } from "@/types/api";

export function ClientesPage() {
  const { canManageUsers, canOperate } = useRbac();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["clientes"], queryFn: mvnoService.listClientes });
  const chipsQuery = useQuery({ queryKey: ["chips"], queryFn: () => mvnoService.listChips() });

  const chipCountByCliente = useMemo(() => {
    const counts = new Map<string, number>();
    for (const chip of chipsQuery.data ?? []) {
      if (chip.cliente_id) {
        counts.set(chip.cliente_id, (counts.get(chip.cliente_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [chipsQuery.data]);

  const availableChips = useMemo(
    () => (chipsQuery.data ?? []).filter((chip) => chip.status === "available" && !chip.cliente_id),
    [chipsQuery.data]
  );

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clientes"] }),
        queryClient.invalidateQueries({ queryKey: ["chips"] })
      ]);
      toast.success("Cliente criado.");
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClienteRequest }) => mvnoService.updateCliente(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente atualizado.");
      setEditingCliente(null);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: mvnoService.deleteCliente,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluido.");
    },
    onError: (error) => toast.error(error.message)
  });

  function deleteCliente(id: string, nome: string) {
    const confirmed = window.confirm(`Excluir o cliente "${nome}"? Esta acao nao pode ser desfeita.`);
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  }

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
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">UF</th>
                  <th className="px-5 py-3">Chips</th>
                  {canOperate || canManageUsers ? <th className="px-5 py-3 text-right">Acoes</th> : null}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium text-ink">{cliente.nome}</td>
                    <td className="px-5 py-4">{maskDocument(cliente.documento)}</td>
                    <td className="px-5 py-4">{cliente.contato.email || cliente.contato.telefone || "-"}</td>
                    <td className="px-5 py-4">{cliente.endereco.uf || "-"}</td>
                    <td className="px-5 py-4">{chipCountByCliente.get(cliente.id) ?? 0}</td>
                    {canOperate || canManageUsers ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {canOperate ? (
                            <Button
                              aria-label={`Editar ${cliente.nome}`}
                              size="icon"
                              title="Editar cliente"
                              type="button"
                              variant="ghost"
                              onClick={() => setEditingCliente(cliente)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canManageUsers ? (
                            <Button
                              aria-label={`Excluir ${cliente.nome}`}
                              disabled={deleteMutation.isPending}
                              size="icon"
                              title="Excluir cliente"
                              type="button"
                              variant="ghost"
                              onClick={() => deleteCliente(cliente.id, cliente.nome)}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ClienteModal
        availableChips={availableChips}
        isOpen={isModalOpen}
        isSaving={createMutation.isPending}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
      <EditClienteModal
        cliente={editingCliente}
        isSaving={updateMutation.isPending}
        onClose={() => setEditingCliente(null)}
        onSubmit={(id, payload) => updateMutation.mutate({ id, payload })}
      />
    </div>
  );
}

function ClienteModal({
  availableChips,
  isOpen,
  isSaving,
  onClose,
  onSubmit
}: {
  availableChips: Chip[];
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
    tags: [],
    chip_iccids: []
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      ...form,
      documento: onlyDigits(form.documento),
      contato: { ...form.contato, telefone: onlyDigits(form.contato.telefone ?? "") },
      endereco: { ...form.endereco, cep: onlyDigits(form.endereco.cep ?? "") },
      chip_iccids: form.chip_iccids.map(onlyDigits).filter(Boolean)
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
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Chips</span>
          <Select
            required
            multiple
            className="h-28 py-2"
            value={form.chip_iccids}
            onChange={(event) =>
              setForm({
                ...form,
                chip_iccids: Array.from(event.target.selectedOptions, (option) => option.value)
              })
            }
          >
            {availableChips.map((chip) => (
              <option key={chip.iccid} value={chip.iccid}>
                {chip.iccid} {chip.msisdn ? `- ${chip.msisdn}` : ""}
              </option>
            ))}
          </Select>
          <p className="text-xs text-slate-500">Selecione pelo menos um chip disponivel.</p>
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving || form.chip_iccids.length === 0}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditClienteModal({
  cliente,
  isSaving,
  onClose,
  onSubmit
}: {
  cliente: Cliente | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateClienteRequest) => void;
}) {
  const [form, setForm] = useState<UpdateClienteRequest>({
    nome: "",
    documento: "",
    contato: { email: "", telefone: "" },
    endereco: { logradouro: "", numero: "", cidade: "", uf: "", cep: "" },
    tags: []
  });
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    if (!cliente) return;
    setForm({
      nome: cliente.nome,
      documento: cliente.documento,
      contato: {
        email: cliente.contato.email ?? "",
        telefone: cliente.contato.telefone ?? ""
      },
      endereco: {
        logradouro: cliente.endereco.logradouro ?? "",
        numero: cliente.endereco.numero ?? "",
        cidade: cliente.endereco.cidade ?? "",
        uf: cliente.endereco.uf ?? "",
        cep: cliente.endereco.cep ?? ""
      },
      tags: cliente.tags ?? []
    });
    setTagsText((cliente.tags ?? []).join(", "));
  }, [cliente]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!cliente) return;
    onSubmit(cliente.id, {
      ...form,
      documento: onlyDigits(form.documento),
      contato: { ...form.contato, telefone: onlyDigits(form.contato.telefone ?? "") },
      endereco: { ...form.endereco, cep: onlyDigits(form.endereco.cep ?? "") },
      tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean)
    });
  }

  return (
    <Modal title="Editar cliente" isOpen={Boolean(cliente)} onClose={onClose}>
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
          <Input placeholder="vip, varejo" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </form>
    </Modal>
  );
}
