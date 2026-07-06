"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { getUsers, createUser, toggleUserActive, unlockUser } from "@/lib/api/users";
import { updateUserRole, updateUser, deleteUser } from "@/lib/api/settings";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, UserPlus, Search, Edit, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { getInitials, getAvatarSrc } from "@/lib/avatar";

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
  Admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Employee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
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
  const [confirmUserToggle, setConfirmUserToggle] = useState<User | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");

  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter === "active") {
      result = result.filter((u) => u.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((u) => !u.isActive);
    }
    return result;
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleActive = async (user: User) => {
    setConfirmUserToggle(user);
  };

  const executeToggleActive = async () => {
    if (!confirmUserToggle) return;
    const user = confirmUserToggle;
    setConfirmUserToggle(null);
    setTogglingId(user.id);
    try {
      await toggleUserActive(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(`${user.fullName} ${user.isActive ? "deactivated" : "activated"} successfully.`);
    } catch {
      toast.error(`Unable to ${user.isActive ? "deactivate" : "activate"} user.`);
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

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditDept(user.department ?? "");
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, {
        fullName: editName,
        email: editEmail,
        department: editDept || undefined,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("User updated.");
      setEditingUser(null);
    } catch {
      toast.error("Failed to update user.");
    }
  };

  const handleUnlock = async (userId: string) => {
    setUnlockingId(userId);
    try {
      await unlockUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: null } : u))
      );
      toast.success("User unlocked.");
    } catch {
      toast.error("Failed to unlock user.");
    } finally {
      setUnlockingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUserId) return;
    try {
      await deleteUser(confirmDeleteUserId);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteUserId));
      toast.success("User deleted.");
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setConfirmDeleteUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const updated = await updateUserRole(userId, parseInt(roleId));
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success("Role updated.");
    } catch {
      toast.error("Failed to update role.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage system users and their roles">
        <Dialog open={showCreateForm} onOpenChange={(o) => { setShowCreateForm(o); if (!o) setCreateError(null); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
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
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); createForm.reset(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createForm.formState.isSubmitting}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {createForm.formState.isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
                {createError ? <p className="text-sm font-medium text-destructive">{createError}</p> : null}
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""} shown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Search by name or email... (Ctrl+/)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roleOptions.map((r) => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search || roleFilter !== "all" || statusFilter !== "all" ? "No users match your filters." : "No users found."}
            </p>
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
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatarUrl ? <AvatarImage src={getAvatarSrc(user.avatarUrl)} alt={user.fullName} /> : null}
                              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-3 py-3">
                          <Select
                            defaultValue={String(roleOptions.find((r) => r.name === user.role)?.id ?? 4)}
                            onValueChange={(v) => handleRoleChange(user.id, v)}
                          >
                            <SelectTrigger className={`w-28 h-7 text-xs font-semibold rounded-full border-0 ${roleBadge[user.role] ?? ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((r) => (
                                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{user.department ?? "\u2014"}</td>
                        <td className="px-3 py-3">
                          {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Locked</Badge>
                          ) : (
                            <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40" : ""}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={unlockingId === user.id}
                                onClick={() => handleUnlock(user.id)}
                              >
                                {unlockingId === user.id ? "..." : "Unlock"}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={user.isActive ? "destructive" : "outline"}
                              size="xs"
                              disabled={togglingId === user.id}
                              onClick={() => handleToggleActive(user)}
                            >
                              {togglingId === user.id ? "..." : user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmDeleteUserId(user.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {user.avatarUrl ? <AvatarImage src={getAvatarSrc(user.avatarUrl)} alt={user.fullName} /> : null}
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
                      {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Locked</Badge>
                      ) : (
                        <Badge variant={user.isActive ? "default" : "secondary"} className={user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{user.department ?? "No department"}</span>
                      <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unlockingId === user.id}
                          onClick={() => handleUnlock(user.id)}
                        >
                          {unlockingId === user.id ? "..." : "Unlock"}
                        </Button>
                      )}
                      <Button
                        variant={user.isActive ? "destructive" : "outline"}
                        size="sm"
                        className={user.lockedUntil && new Date(user.lockedUntil) > new Date() ? "" : "flex-1"}
                        disabled={togglingId === user.id}
                        onClick={() => handleToggleActive(user)}
                      >
                        {togglingId === user.id ? "..." : user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => openEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmUserToggle}
        onOpenChange={(o) => { if (!o) setConfirmUserToggle(null); }}
        title={confirmUserToggle?.isActive ? "Deactivate User" : "Activate User"}
        description={`Are you sure you want to ${confirmUserToggle?.isActive ? "deactivate" : "activate"} ${confirmUserToggle?.fullName}?`}
        confirmLabel={confirmUserToggle?.isActive ? "Deactivate" : "Activate"}
        variant="destructive"
        onConfirm={executeToggleActive}
        loading={!!togglingId}
      />

      <Dialog open={!!editingUser} onOpenChange={(o) => { if (!o) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept">Department</Label>
              <Input id="edit-dept" value={editDept} onChange={(e) => setEditDept(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveUserEdit}>Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteUserId}
        onOpenChange={(o) => { if (!o) setConfirmDeleteUserId(null); }}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
