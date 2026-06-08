"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { getUsers, createUser, toggleUserActive } from "@/lib/api/users";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, UserPlus, X } from "lucide-react";

const roleOptions = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Agent" },
  { id: 3, name: "Manager" },
  { id: 4, name: "Employee" },
];

const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(150, "Max 150 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  roleId: z.string().min(1, "Role is required"),
  department: z.string().max(100, "Max 100 characters").optional(),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const roleBadge: Record<string, string> = {
  Admin: "bg-red-100 text-red-700",
  Agent: "bg-blue-100 text-blue-700",
  Manager: "bg-purple-100 text-purple-700",
  Employee: "bg-green-100 text-green-700",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-10 w-32 rounded-xl bg-zinc-100" />
      </div>
      <div className="space-y-3">
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
        <div className="h-12 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: "", email: "", password: "", roleId: "", department: "" },
  });

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    getUsers()
      .then((data) => setUsers(data))
      .catch(() => setError("Unable to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    setTogglingId(user.id);
    try {
      await toggleUserActive(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(`${user.fullName} ${action}d successfully.`);
    } catch {
      toast.error(`Unable to ${action} user.`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateUser = async (data: CreateUserFormValues) => {
    setCreateError(null);
    try {
      await createUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        roleId: Number(data.roleId),
        department: data.department?.trim() || undefined,
      });
      toast.success("User created successfully.");
      setShowCreateForm(false);
      createForm.reset();
      fetchUsers();
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 400
      ) {
        setCreateError("Invalid data. Email may already be in use.");
      } else {
        setCreateError("Unable to create user.");
      }
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(null); }}>
          {showCreateForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </>
          )}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new user to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form className="space-y-4" onSubmit={createForm.handleSubmit(handleCreateUser)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input id="fullName" placeholder="John Doe" maxLength={150} {...field} />
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="user@company.com" {...field} />
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" placeholder="Min 8 chars, upper, lower, digit, special" {...field} />
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="roleId">Role</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id="roleId">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-2">
                          <Label htmlFor="department">Department</Label>
                          <Input id="department" placeholder="e.g. Engineering" maxLength={100} {...field} />
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createForm.formState.isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {createForm.formState.isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowCreateForm(false); createForm.reset(); }}
                    disabled={createForm.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
                {createError ? <p className="text-sm font-medium text-destructive">{createError}</p> : null}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{users.length} user{users.length !== 1 ? "s" : ""} registered</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground border-b text-xs uppercase">
                    <tr>
                      <th className="px-3 py-3 font-medium">User</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Role</th>
                      <th className="px-3 py-3 font-medium">Department</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Created</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-b-0 hover:bg-zinc-50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[user.role] ?? "bg-zinc-100 text-zinc-700"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user.department ?? "\u2014"}</td>
                        <td className="px-3 py-3">
                          <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={togglingId === user.id}
                            onClick={() => handleToggleActive(user)}
                          >
                            {togglingId === user.id
                              ? "..."
                              : user.isActive
                                ? "Deactivate"
                                : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[user.role] ?? "bg-zinc-100 text-zinc-700"}`}>
                        {user.role}
                      </span>
                      <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-700" : ""}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{user.department ?? "No department"}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={togglingId === user.id}
                      onClick={() => handleToggleActive(user)}
                    >
                      {togglingId === user.id
                        ? "..."
                        : user.isActive
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
