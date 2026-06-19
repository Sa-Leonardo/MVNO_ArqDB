import { FormEvent, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

import { mvnoService } from "@/services/mvno";

import type {
  CreateUserRequest,
  User,
  UserRole
} from "@/types/api";

export function UsuariosPage() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: "operator"
  });

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "operator" as UserRole
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: mvnoService.listUsers
  });

  const createMutation = useMutation({
    mutationFn: mvnoService.createUser,
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");

      setForm({
        name: "",
        email: "",
        password: "",
        role: "operator"
      });

      queryClient.invalidateQueries({
        queryKey: ["users"]
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: {
        name: string;
        email: string;
        role: UserRole;
      };
    }) => mvnoService.updateUser(id, payload),

    onSuccess: () => {
      toast.success("Usuário atualizado");

      setEditingUser(null);

      queryClient.invalidateQueries({
        queryKey: ["users"]
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: mvnoService.deactivateUser,

    onSuccess: () => {
      toast.success("Usuário desativado");

      queryClient.invalidateQueries({
        queryKey: ["users"]
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    }
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

  function saveEdit() {
    if (!editingUser) return;

    updateMutation.mutate({
      id: editingUser.id,
      payload: editForm
    });
  }

  function deactivate(id: string) {
    if (
      !window.confirm(
        "Deseja realmente desativar este usuário?"
      )
    ) {
      return;
    }

    deactivateMutation.mutate(id);
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-bold text-ink">
              Novo usuário
            </h1>

            <p className="text-sm text-slate-500">
              Controle de acesso administrativo
            </p>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-4"
              onSubmit={submit}
            >
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Nome
                </span>

                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Email
                </span>

                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Senha
                </span>

                <Input
                  required
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value
                    })
                  }
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Perfil
                </span>

                <Select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role:
                        e.target.value as UserRole
                    })
                  }
                >
                  <option value="admin">
                    Admin
                  </option>

                  <option value="operator">
                    Operator
                  </option>

                  <option value="viewer">
                    Viewer
                  </option>
                </Select>
              </label>

              <Button
                className="w-full"
                disabled={
                  createMutation.isPending
                }
              >
                {createMutation.isPending
                  ? "Criando..."
                  : "Criar usuário"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Usuários cadastrados
            </h2>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {user.identity.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {user.identity.email}
                      </p>

                      <div className="mt-2 flex gap-2">
                        <Badge>
                          {user.access.role}
                        </Badge>

                        <Badge>
                          {user.status.is_active
                            ? "Ativo"
                            : "Inativo"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          openEdit(user)
                        }
                      >
                        Editar
                      </Button>

                      {user.status.is_active && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            deactivate(user.id)
                          }
                        >
                          Desativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar usuário"
        description="Atualize os dados do usuário"
      >
        <div className="space-y-4">
          <Input
            value={editForm.name}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                name: e.target.value
              })
            }
            placeholder="Nome"
          />

          <Input
            value={editForm.email}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                email: e.target.value
              })
            }
            placeholder="Email"
          />

          <Select
            value={editForm.role}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                role:
                  e.target.value as UserRole
              })
            }
          >
            <option value="admin">
              Admin
            </option>

            <option value="operator">
              Operator
            </option>

            <option value="viewer">
              Viewer
            </option>
          </Select>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                setEditingUser(null)
              }
            >
              Cancelar
            </Button>

            <Button
              onClick={saveEdit}
              disabled={
                updateMutation.isPending
              }
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}