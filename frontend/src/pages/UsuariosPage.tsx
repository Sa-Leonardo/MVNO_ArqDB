import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Pencil, Power, PowerOff } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { mvnoService } from "@/services/mvno";
import type { CreateUserRequest, User, UserRole } from "@/types/api";

const emptyUser: CreateUserRequest = {
  name: "",
  email: "",
  password: "",
  role: "operator"
};

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserRequest>(emptyUser);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "operator" as UserRole
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: mvnoService.listUsers
  });

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: mvnoService.createUser,
    onSuccess: async () => {
      setForm(emptyUser);
      await refreshUsers();
      toast.success("Usuário criado com sucesso.");
    },
    onError: (error) => toast.error(error.message)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: typeof editForm }) =>
      mvnoService.updateUser(id, payload),
    onSuccess: async () => {
      setEditingUser(null);
      await refreshUsers();
      toast.success("Usuário atualizado.");
    },
    onError: (error) => toast.error(error.message)
  });

  const deactivateMutation = useMutation({
    mutationFn: mvnoService.deactivateUser,
    onSuccess: async () => {
      await refreshUsers();
      toast.success("Usuário desativado.");
    },
    onError: (error) => toast.error(error.message)
  });

  const reactivateMutation = useMutation({
    mutationFn: mvnoService.reactivateUser,
    onSuccess: async () => {
      await refreshUsers();
      toast.success("Usuário reativado.");
    },
    onError: (error) => toast.error(error.message)
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      mvnoService.changeUserPassword(id, password),
    onSuccess: () => {
      setPasswordUser(null);
      setNewPassword("");
      setShowPassword(false);
      toast.success("Nova senha definida.");
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setEditForm({
      name: user.identity.name,
      email: user.identity.email,
      role: user.access.role
    });
  }

  function changeStatus(user: User) {
    const action = user.status.is_active ? "desativar" : "reativar";
    if (!window.confirm(`Deseja realmente ${action} ${user.identity.name}?`)) return;
    if (user.status.is_active) deactivateMutation.mutate(user.id);
    else reactivateMutation.mutate(user.id);
  }

  function openPassword(user: User) {
    setPasswordUser(user);
    setNewPassword("");
    setShowPassword(false);
  }

  function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordUser) return;
    passwordMutation.mutate({ id: passwordUser.id, password: newPassword });
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <h1 className="text-lg font-bold text-ink">Novo usuário</h1>
            <p className="text-sm text-slate-500">Acesso administrativo e operacional</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Field label="Nome">
                <Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Senha">
                <Input required type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Field label="Perfil">
                <RoleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} />
              </Field>
              <Button className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar usuário"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-ink">Usuários cadastrados</h2>
            <p className="text-sm text-slate-500">{usersQuery.data?.length ?? 0} usuários na base</p>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div>
            ) : (
              <div className="divide-y divide-border">
                {(usersQuery.data ?? []).map((user) => (
                  <div key={user.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{user.identity.name}</p>
                      <p className="truncate text-sm text-slate-500">{user.identity.email}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge tone="blue">{user.access.role}</Badge>
                        <Badge tone={user.status.is_active ? "green" : "red"}>
                          {user.status.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" title="Editar usuário" aria-label="Editar usuário" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Definir nova senha" aria-label="Definir nova senha" onClick={() => openPassword(user)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={user.status.is_active ? "ghost" : "secondary"}
                        title={user.status.is_active ? "Desativar usuário" : "Reativar usuário"}
                        aria-label={user.status.is_active ? "Desativar usuário" : "Reativar usuário"}
                        disabled={deactivateMutation.isPending || reactivateMutation.isPending}
                        onClick={() => changeStatus(user)}
                      >
                        {user.status.is_active ? <PowerOff className="h-4 w-4 text-danger" /> : <Power className="h-4 w-4 text-emerald-600" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} title="Editar usuário">
        <div className="space-y-4">
          <Field label="Nome">
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </Field>
          <Field label="Perfil">
            <RoleSelect value={editForm.role} onChange={(role) => setEditForm({ ...editForm, role })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button disabled={updateMutation.isPending} onClick={() => editingUser && updateMutation.mutate({ id: editingUser.id, payload: editForm })}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(passwordUser)}
        onClose={() => setPasswordUser(null)}
        title="Definir nova senha"
        description={passwordUser ? `A nova senha será aplicada a ${passwordUser.identity.name}.` : undefined}
      >
        <form className="space-y-4" onSubmit={submitPassword}>
          <Field label="Nova senha">
            <div className="relative">
              <Input
                className="pr-11"
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-muted"
                type="button"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPasswordUser(null)}>Cancelar</Button>
            <Button disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Salvando..." : "Atualizar senha"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function RoleSelect({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value as UserRole)}>
      <option value="admin">Administrador</option>
      <option value="operator">Operador</option>
      <option value="viewer">Visualizador</option>
    </Select>
  );
}
