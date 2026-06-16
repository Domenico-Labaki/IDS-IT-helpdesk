"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Database,
  Bell,
  Trash2,
  Edit,
  Tags,
} from "lucide-react";
import { toast } from "sonner";

import { getInitials, getAvatarSrc } from "@/lib/avatar";

import { getUsers } from "@/lib/api/users";
import {
  getSettings,
  updateSettings,
  getEmailTemplates,
  updateEmailTemplate,
  getSystemInfo,
  updateUserRole,
  updateUser,
  deleteUser,
  clearCache,
  createBackup,
  checkUpdates,
  getEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  type EmailTemplate,
  type EscalationRule,
} from "@/lib/api/settings";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPriorities,
  createPriority,
  updatePriority,
  deletePriority,
  getStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "@/lib/api/tickets";
import type { Category, Priority, Status, User } from "@/types";

const roleOptions = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Agent" },
  { id: 3, name: "Manager" },
  { id: 4, name: "Employee" },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const generalFormRef = useRef<HTMLFormElement>(null);
  const securityFormRef = useRef<HTMLFormElement>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);
  const [slaEnabled, setSlaEnabled] = useState(false);
  const [require2fa, setRequire2fa] = useState(false);
  const [pwExpEnabled, setPwExpEnabled] = useState(false);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(false);

  const { data: userList, isLoading: usersLoading } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  const { data: settingsData } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const { data: emailTemplates, isLoading: templatesLoading } = useQuery({ queryKey: ["email-templates"], queryFn: getEmailTemplates });
  const { data: systemInfo, isLoading: sysLoading } = useQuery({ queryKey: ["system-info"], queryFn: getSystemInfo });

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");

  const saveSettingsMut = useMutation({
    mutationFn: (data: { key: string; value: string }[]) => updateSettings(data),
    onSuccess: () => { toast.success("Settings saved."); queryClient.invalidateQueries({ queryKey: ["settings"] }); },
    onError: () => toast.error("Failed to save settings."),
  });

  const saveTemplateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { subject: string; body: string } }) => updateEmailTemplate(id, data),
    onSuccess: () => { toast.success("Email template updated."); setEditingTemplate(null); queryClient.invalidateQueries({ queryKey: ["email-templates"] }); },
    onError: () => toast.error("Failed to update template."),
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: number }) => updateUserRole(userId, roleId),
    onSuccess: () => { toast.success("User role updated."); queryClient.invalidateQueries({ queryKey: ["users"] }); },
    onError: () => toast.error("Failed to update role."),
  });

  const updateUserMut = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { fullName: string; email: string; department?: string } }) => updateUser(userId, data),
    onSuccess: () => { toast.success("User updated."); setEditingUser(null); queryClient.invalidateQueries({ queryKey: ["users"] }); },
    onError: () => toast.error("Failed to update user."),
  });

  const deleteUserMut = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => { toast.success("User deleted."); queryClient.invalidateQueries({ queryKey: ["users"] }); },
    onError: () => toast.error("Failed to delete user."),
  });

  const collectAndSave = (formRef: React.RefObject<HTMLFormElement | null>, extras: Record<string, string>) => {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    const entries: { key: string; value: string }[] = [];
    form.forEach((value, key) => entries.push({ key, value: value.toString() }));
    for (const [key, value] of Object.entries(extras)) {
      entries.push({ key, value });
    }
    saveSettingsMut.mutate(entries);
  };

  const openEditTemplate = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  };

  const saveTemplate = () => {
    if (!editingTemplate) return;
    saveTemplateMut.mutate({ id: editingTemplate.id, data: { subject: editSubject, body: editBody } });
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditDept(user.department ?? "");
  };

  const saveUserEdit = () => {
    if (!editingUser) return;
    updateUserMut.mutate({ userId: editingUser.id, data: { fullName: editName, email: editEmail, department: editDept || undefined } });
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">Configure system settings and manage users</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 lg:w-auto">
          <TabsTrigger value="general"><SettingsIcon className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="lookups"><Tags className="mr-2 h-4 w-4" />Lookups</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="system"><Database className="mr-2 h-4 w-4" />System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <form ref={generalFormRef} onSubmit={(e) => { e.preventDefault(); collectAndSave(generalFormRef, { autoAssign: String(autoAssign), emailNotifications: String(emailNotif), slaEnabled: String(slaEnabled) }); }}>
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic system preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" name="companyName" defaultValue={settingsData?.companyName ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settingsData?.supportEmail ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select id="timezone" name="timezone" defaultValue={settingsData?.timezone ?? "est"} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <option value="est">Eastern Time (EST)</option>
                      <option value="cst">Central Time (CST)</option>
                      <option value="mst">Mountain Time (MST)</option>
                      <option value="pst">Pacific Time (PST)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select id="language" name="language" defaultValue={settingsData?.language ?? "en"} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Tickets</Label>
                      <p className="text-sm text-muted-foreground">Automatically assign new tickets to available agents</p>
                    </div>
                    <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send email updates for ticket changes</p>
                    </div>
                    <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SLA Tracking</Label>
                      <p className="text-sm text-muted-foreground">Enable service level agreement tracking</p>
                    </div>
                    <Switch checked={slaEnabled} onCheckedChange={setSlaEnabled} />
                  </div>
                </div>
                <Button type="submit" disabled={saveSettingsMut.isPending}>
                  {saveSettingsMut.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell></TableRow>
                  ) : userList && userList.length > 0 ? (
                    userList.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {user.avatarUrl ? <AvatarImage src={getAvatarSrc(user.avatarUrl)} alt={user.fullName} /> : null}
                              <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <select
                            defaultValue={String(roleOptions.find((r) => r.name === user.role)?.id ?? 4)}
                            onChange={(e) => updateRoleMut.mutate({ userId: user.id, roleId: parseInt(e.target.value) })}
                            className="flex h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                          >
                            {roleOptions.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                          </select>
                        </TableCell>
                        <TableCell>{user.department ?? "-"}</TableCell>
                        <TableCell>{user.isActive ? <Badge className="bg-green-500 dark:bg-green-600">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this user?")) deleteUserMut.mutate(user.id); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Edit notification email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {templatesLoading ? (
                <p className="text-muted-foreground">Loading templates...</p>
              ) : emailTemplates && emailTemplates.length > 0 ? (
                <div className="space-y-3">
                  {emailTemplates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      <Button variant="outline" size="sm" onClick={() => openEditTemplate(tpl)}>
                        Edit Template
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No email templates configured.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lookups" className="space-y-4">
          <LookupsTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <form ref={securityFormRef} onSubmit={(e) => { e.preventDefault(); collectAndSave(securityFormRef, { require2fa: String(require2fa), passwordExpirationEnabled: String(pwExpEnabled), sessionTimeoutEnabled: String(sessionTimeoutEnabled) }); }}>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Expiration</Label>
                    <p className="text-sm text-muted-foreground">Force password reset every N days</p>
                  </div>
                  <Switch checked={pwExpEnabled} onCheckedChange={setPwExpEnabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">Password Expiration (days)</Label>
                  <Input id="passwordExpiryDays" name="passwordExpiryDays" type="number" className="w-32" defaultValue={settingsData?.passwordExpiryDays ?? "90"} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                  </div>
                  <Switch checked={sessionTimeoutEnabled} onCheckedChange={setSessionTimeoutEnabled} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDurationMinutes">Session Duration (minutes)</Label>
                  <Input id="sessionDurationMinutes" name="sessionDurationMinutes" type="number" className="w-32" defaultValue={settingsData?.sessionDurationMinutes ?? "30"} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input id="maxLoginAttempts" name="maxLoginAttempts" type="number" className="w-32" defaultValue={settingsData?.maxLoginAttempts ?? "5"} />
                </div>
                <Button type="submit" disabled={saveSettingsMut.isPending}>
                  {saveSettingsMut.isPending ? "Saving..." : "Save Security Settings"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>View system details and perform maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sysLoading ? (
                <p className="text-muted-foreground">Loading system info...</p>
              ) : systemInfo ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Version</Label>
                    <p className="text-sm text-muted-foreground">{systemInfo.version}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Last Updated</Label>
                    <p className="text-sm text-muted-foreground">{systemInfo.lastUpdated}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Database Status</Label>
                    <Badge className="bg-green-500 dark:bg-green-600">Healthy</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label>Storage Used</Label>
                    <p className="text-sm text-muted-foreground">{systemInfo.storageUsed} / {systemInfo.storageLimit}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Total Users</Label>
                    <p className="text-sm text-muted-foreground">{systemInfo.totalUsers}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Total Tickets</Label>
                    <p className="text-sm text-muted-foreground">{systemInfo.totalTickets}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to load system info.</p>
              )}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold">Maintenance Actions</h4>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={async () => { try { const r = await clearCache(); toast.success(r.message); } catch { toast.error("Failed to clear cache."); } }}>Clear Cache</Button>
                  <Button variant="outline" onClick={async () => { try { const r = await createBackup(); toast.success(r.message); } catch { toast.error("Failed to create backup."); } }}>Create Backup</Button>
                  <Button variant="outline" onClick={async () => { try { const r = await checkUpdates(); toast.success(r.message); } catch { toast.error("Failed to check updates."); } }}>Check for Updates</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingTemplate} onOpenChange={(open) => { if (!open) setEditingTemplate(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>{editingTemplate?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body (HTML)</Label>
              <textarea
                className="w-full min-h-[200px] rounded-xl border border-border bg-background p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-400/20"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={saveTemplateMut.isPending}>
              {saveTemplateMut.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
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
            <Button onClick={saveUserEdit} disabled={updateUserMut.isPending}>
              {updateUserMut.isPending ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LookupsTab() {
  const { data: categories, refetch: refetchCats } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: priorities, refetch: refetchPrios } = useQuery({ queryKey: ["priorities"], queryFn: getPriorities });
  const { data: statuses, refetch: refetchStatuses } = useQuery({ queryKey: ["statuses"], queryFn: getStatuses });

  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatDesc, setEditCatDesc] = useState("");

  const [newPrioName, setNewPrioName] = useState("");
  const [newPrioLevel, setNewPrioLevel] = useState(1);
  const [editingPrio, setEditingPrio] = useState<Priority | null>(null);
  const [editPrioName, setEditPrioName] = useState("");
  const [editPrioLevel, setEditPrioLevel] = useState(1);

  const [newStatusName, setNewStatusName] = useState("");
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [editStatusName, setEditStatusName] = useState("");

  const queryClient = useQueryClient();

  const createCatMut = useMutation({
    mutationFn: () => createCategory(newCatName, newCatDesc || undefined),
    onSuccess: () => { setNewCatName(""); setNewCatDesc(""); toast.success("Category created."); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
    onError: () => toast.error("Failed to create category."),
  });

  const updateCatMut = useMutation({
    mutationFn: () => updateCategory(editingCat!.id, editCatName, editCatDesc || undefined),
    onSuccess: () => { setEditingCat(null); toast.success("Category updated."); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
    onError: () => toast.error("Failed to update category."),
  });

  const deleteCatMut = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => { toast.success("Category deleted."); queryClient.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete category."),
  });

  const createPrioMut = useMutation({
    mutationFn: () => createPriority(newPrioName, newPrioLevel),
    onSuccess: () => { setNewPrioName(""); setNewPrioLevel(1); toast.success("Priority created."); queryClient.invalidateQueries({ queryKey: ["priorities"] }); },
    onError: () => toast.error("Failed to create priority."),
  });

  const updatePrioMut = useMutation({
    mutationFn: () => updatePriority(editingPrio!.id, editPrioName, editPrioLevel),
    onSuccess: () => { setEditingPrio(null); toast.success("Priority updated."); queryClient.invalidateQueries({ queryKey: ["priorities"] }); },
    onError: () => toast.error("Failed to update priority."),
  });

  const deletePrioMut = useMutation({
    mutationFn: (id: number) => deletePriority(id),
    onSuccess: () => { toast.success("Priority deleted."); queryClient.invalidateQueries({ queryKey: ["priorities"] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete priority."),
  });

  const createStatusMut = useMutation({
    mutationFn: () => createStatus(newStatusName),
    onSuccess: () => { setNewStatusName(""); toast.success("Status created."); queryClient.invalidateQueries({ queryKey: ["statuses"] }); },
    onError: () => toast.error("Failed to create status."),
  });

  const updateStatusMut = useMutation({
    mutationFn: () => updateStatus(editingStatus!.id, editStatusName),
    onSuccess: () => { setEditingStatus(null); toast.success("Status updated."); queryClient.invalidateQueries({ queryKey: ["statuses"] }); },
    onError: () => toast.error("Failed to update status."),
  });

  const deleteStatusMut = useMutation({
    mutationFn: (id: number) => deleteStatus(id),
    onSuccess: () => { toast.success("Status deleted."); queryClient.invalidateQueries({ queryKey: ["statuses"] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete status."),
  });

  // Escalation rules state
  const { data: escalationRules, refetch: refetchRules } = useQuery({ queryKey: ["escalation-rules"], queryFn: getEscalationRules });
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePrio, setNewRulePrio] = useState(1);
  const [newRuleHours, setNewRuleHours] = useState(4);
  const [newRuleTargetRole, setNewRuleTargetRole] = useState("");
  const [newRuleEscalateRole, setNewRuleEscalateRole] = useState("");

  const createRuleMut = useMutation({
    mutationFn: () => createEscalationRule({
      name: newRuleName,
      priorityId: newRulePrio,
      triggerHours: newRuleHours,
      targetRoleId: newRuleTargetRole ? Number(newRuleTargetRole) : null,
      escalateToRoleId: newRuleEscalateRole ? Number(newRuleEscalateRole) : null,
    }),
    onSuccess: () => { setNewRuleName(""); toast.success("Escalation rule created."); queryClient.invalidateQueries({ queryKey: ["escalation-rules"] }); },
    onError: () => toast.error("Failed to create escalation rule."),
  });

  const deleteRuleMut = useMutation({
    mutationFn: (id: number) => deleteEscalationRule(id),
    onSuccess: () => { toast.success("Escalation rule deleted."); queryClient.invalidateQueries({ queryKey: ["escalation-rules"] }); },
    onError: () => toast.error("Failed to delete escalation rule."),
  });

  return (
    <Tabs defaultValue="categories" className="space-y-4">
      <TabsList>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="priorities">Priorities</TabsTrigger>
        <TabsTrigger value="statuses">Statuses</TabsTrigger>
        <TabsTrigger value="escalation">Escalation</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage ticket categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="space-y-1 flex-1">
                <Label>Name</Label>
                <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" />
              </div>
              <div className="space-y-1 flex-1">
                <Label>Description</Label>
                <Input value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Description" />
              </div>
              <Button onClick={() => createCatMut.mutate()} disabled={!newCatName || createCatMut.isPending}>
                {createCatMut.isPending ? "..." : "Add"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.id}</TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setEditCatName(cat.name); setEditCatDesc(cat.description ?? ""); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this category?")) deleteCatMut.mutate(cat.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="priorities">
        <Card>
          <CardHeader>
            <CardTitle>Priorities</CardTitle>
            <CardDescription>Manage ticket priorities (lower level = higher priority)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={newPrioName} onChange={(e) => setNewPrioName(e.target.value)} placeholder="Priority name" />
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Input type="number" value={newPrioLevel} onChange={(e) => setNewPrioLevel(Number(e.target.value))} className="w-20" />
              </div>
              <Button onClick={() => createPrioMut.mutate()} disabled={!newPrioName || createPrioMut.isPending}>
                {createPrioMut.isPending ? "..." : "Add"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorities?.map((prio) => (
                  <TableRow key={prio.id}>
                    <TableCell>{prio.id}</TableCell>
                    <TableCell>{prio.name}</TableCell>
                    <TableCell>{prio.level}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPrio(prio); setEditPrioName(prio.name); setEditPrioLevel(prio.level); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this priority?")) deletePrioMut.mutate(prio.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="statuses">
        <Card>
          <CardHeader>
            <CardTitle>Statuses</CardTitle>
            <CardDescription>Manage ticket statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="space-y-1 flex-1">
                <Label>Name</Label>
                <Input value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} placeholder="New status name" />
              </div>
              <Button onClick={() => createStatusMut.mutate()} disabled={!newStatusName || createStatusMut.isPending}>
                {createStatusMut.isPending ? "..." : "Add"}
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses?.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell>{st.id}</TableCell>
                    <TableCell>{st.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingStatus(st); setEditStatusName(st.name); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this status?")) deleteStatusMut.mutate(st.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="escalation">
        <Card>
          <CardHeader>
            <CardTitle>Escalation Rules</CardTitle>
            <CardDescription>Configure automatic ticket escalation based on priority and time thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-5 items-end">
              <div className="space-y-1">
                <Label>Rule Name</Label>
                <Input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="e.g. Critical Escalation" />
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <select value={newRulePrio} onChange={(e) => setNewRulePrio(Number(e.target.value))} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  {priorities?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Trigger (hours)</Label>
                <Input type="number" value={newRuleHours} onChange={(e) => setNewRuleHours(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Escalate to Role</Label>
                <select value={newRuleEscalateRole} onChange={(e) => setNewRuleEscalateRole(e.target.value)} className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Same role</option>
                  <option value="1">Admin</option>
                  <option value="2">Agent</option>
                  <option value="3">Manager</option>
                </select>
              </div>
              <Button onClick={() => createRuleMut.mutate()} disabled={!newRuleName || createRuleMut.isPending}>Add Rule</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Escalate To</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escalationRules?.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.priorityName}</TableCell>
                    <TableCell>{rule.triggerHours}h</TableCell>
                    <TableCell>{rule.escalateToRoleName || "-"}</TableCell>
                    <TableCell>
                      {rule.isActive ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this rule?")) deleteRuleMut.mutate(rule.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Edit Dialogs */}
      <Dialog open={!!editingCat} onOpenChange={(o) => { if (!o) setEditingCat(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
            <Button onClick={() => updateCatMut.mutate()} disabled={updateCatMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPrio} onOpenChange={(o) => { if (!o) setEditingPrio(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Priority</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editPrioName} onChange={(e) => setEditPrioName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input type="number" value={editPrioLevel} onChange={(e) => setEditPrioLevel(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrio(null)}>Cancel</Button>
            <Button onClick={() => updatePrioMut.mutate()} disabled={updatePrioMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStatus} onOpenChange={(o) => { if (!o) setEditingStatus(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Status</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={editStatusName} onChange={(e) => setEditStatusName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStatus(null)}>Cancel</Button>
            <Button onClick={() => updateStatusMut.mutate()} disabled={updateStatusMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
