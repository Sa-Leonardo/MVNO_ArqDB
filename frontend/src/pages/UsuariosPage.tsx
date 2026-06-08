import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { mvnoService } from "@/services/mvno";
import type { CreateUserRequest, UserRole } from "@/types/api";

export function UsuariosPage() {
  const [form, setForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: "operator"
  });

  const mutation = useMutation({
    mutationFn: mvnoService.createUser,
    onSuccess: () => {
      toast.success("Usuário criado.");
      setForm({ name: "", email: "", password: "", role: "operator" });
    },
    onError: (error) => toast.error(error.message)
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-ink">Novo usuário</h1>
          <p className="text-sm text-slate-500">Controle de acesso administrativo</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Nome</span>
              <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Senha</span>
              <Input required type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Perfil</span>
              <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </Select>
            </label>
            <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Criando..." : "Criar usuário"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-ink">Perfis</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <RoleDescription role="admin" description="Acesso total, gestão de usuários, planos e operação." />
          <RoleDescription role="operator" description="Opera clientes, chips, ativações e recargas." />
          <RoleDescription role="viewer" description="Modo leitura, sem botões de ação operacional." />
        </CardContent>
      </Card>
    </div>
  );
}

function RoleDescription({ role, description }: { role: UserRole; description: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
      <div>
        <Badge>{role}</Badge>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
