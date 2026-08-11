"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Shield,
  Bell,
  Trash2,
  Edit,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

import {
  getSettings,
  updateSettings,
  getEmailTemplates,
  updateEmailTemplate,
  getEscalationRules,
  createEscalationRule,
  deleteEscalationRule,
  getSlaTargets,
  updateSlaTarget,
  type EmailTemplate,
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
import type { Category, Priority, Status } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const generalFormRef = useRef<HTMLFormElement>(null);
  const securityFormRef = useRef<HTMLFormElement>(null);
  const [autoAssign, setAutoAssign] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);
  const [slaEnabled, setSlaEnabled] = useState(false);
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { data: settingsData } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const { data: emailTemplates, isLoading: templatesLoading } = useQuery({ queryKey: ["email-templates"], queryFn: getEmailTemplates });

  useEffect(() => {
    if (!settingsData) return;
    const timer = window.setTimeout(() => {
      setAutoAssign(settingsData.autoAssign === "true");
      setEmailNotif(settingsData.emailNotifications === "true");
      setSlaEnabled(settingsData.slaEnabled === "true");
      setSessionTimeoutEnabled(settingsData.sessionTimeoutEnabled === "true");
      setMaintenanceMode(settingsData.maintenanceMode === "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [settingsData]);

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

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

  return (
    <div className="workspace-page">
      <PageHeader title="System settings" description="Configure operations, communications, security, and service definitions." />
      <Tabs defaultValue="general" className="mt-6 space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
          <TabsTrigger value="general"><SettingsIcon className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="lookups"><Tags className="mr-2 h-4 w-4" />Lookups</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <form ref={generalFormRef} onSubmit={(e) => { e.preventDefault(); collectAndSave(generalFormRef, { autoAssign: String(autoAssign), emailNotifications: String(emailNotif), slaEnabled: String(slaEnabled), maintenanceMode: String(maintenanceMode) }); }}>
            <Card className="overflow-hidden">
              <CardHeader>
                <p className="section-label">Platform behavior</p>
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
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Block non-admin access to the system</p>
                    </div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                </div>
                <Button type="submit" disabled={saveSettingsMut.isPending}>
                  {saveSettingsMut.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>



        <TabsContent value="notifications" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <p className="section-label">Communication layer</p>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Edit notification email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {templatesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : emailTemplates && emailTemplates.length > 0 ? (
                <div className="space-y-3">
                  {emailTemplates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <span className="text-sm font-medium">{tpl.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{tpl.subject}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditTemplate(tpl)}>
                        Edit Template
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Bell className="h-12 w-12" />} title="No email templates" description="No email templates have been configured." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lookups" className="space-y-4">
          <LookupsTab />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <form ref={securityFormRef} onSubmit={(e) => { e.preventDefault(); collectAndSave(securityFormRef, { sessionTimeoutEnabled: String(sessionTimeoutEnabled) }); }}>
            <Card className="overflow-hidden">
              <CardHeader>
                <p className="section-label">Access controls</p>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage security and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                className="min-h-[200px] w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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


    </div>
  );
}

function LookupsTab() {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const { data: priorities } = useQuery({ queryKey: ["priorities"], queryFn: getPriorities });
  const { data: statuses } = useQuery({ queryKey: ["statuses"], queryFn: getStatuses });

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

  const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: "category" | "priority" | "status" | "rule" } | null>(null);

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
  const { data: escalationRules } = useQuery({ queryKey: ["escalation-rules"], queryFn: getEscalationRules });
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePrio, setNewRulePrio] = useState(1);
  const [newRuleHours, setNewRuleHours] = useState(4);
  const [newRuleTargetRole] = useState("");
  const [newRuleEscalateRole, setNewRuleEscalateRole] = useState("");

  const createRuleMut = useMutation({
    mutationFn: () => createEscalationRule({
      name: newRuleName,
      priorityId: newRulePrio,
      triggerHours: newRuleHours,
      targetRoleId: newRuleTargetRole ? Number(newRuleTargetRole) : null,
      escalateToRoleId: newRuleEscalateRole && newRuleEscalateRole !== "none" ? Number(newRuleEscalateRole) : null,
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
      <TabsList className="max-w-full justify-start overflow-x-auto">
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="priorities">Priorities</TabsTrigger>
        <TabsTrigger value="statuses">Statuses</TabsTrigger>
        <TabsTrigger value="escalation">Escalation</TabsTrigger>
        <TabsTrigger value="sla">SLA Targets</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <Card className="overflow-hidden">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setEditCatName(cat.name); setEditCatDesc(cat.description ?? ""); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({ id: cat.id, type: "category" })}>
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
        <Card className="overflow-hidden">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorities?.map((prio) => (
                  <TableRow key={prio.id}>
                    <TableCell>{prio.name}</TableCell>
                    <TableCell>{prio.level}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingPrio(prio); setEditPrioName(prio.name); setEditPrioLevel(prio.level); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({ id: prio.id, type: "priority" })}>
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
        <Card className="overflow-hidden">
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
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses?.map((st) => (
                  <TableRow key={st.id}>
                    <TableCell>{st.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingStatus(st); setEditStatusName(st.name); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({ id: st.id, type: "status" })}>
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
        <Card className="overflow-hidden">
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
                <Select value={String(newRulePrio)} onValueChange={(v) => setNewRulePrio(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Trigger (hours)</Label>
                <Input type="number" value={newRuleHours} onChange={(e) => setNewRuleHours(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Escalate to Role</Label>
                <Select value={newRuleEscalateRole} onValueChange={setNewRuleEscalateRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Same role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Same role</SelectItem>
                    <SelectItem value="1">Admin</SelectItem>
                    <SelectItem value="2">Agent</SelectItem>
                    <SelectItem value="3">Manager</SelectItem>
                  </SelectContent>
                </Select>
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
                      {rule.isActive ? <Badge className="border border-primary/20 bg-primary/[0.07] text-primary">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete({ id: rule.id, type: "rule" })}>
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

      <TabsContent value="sla">
        <SlaTargetsTab />
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

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
        title={`Delete ${confirmDelete?.type ? confirmDelete.type.charAt(0).toUpperCase() + confirmDelete.type.slice(1) : "Item"}`}
        description={`Are you sure you want to delete this ${confirmDelete?.type}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (!confirmDelete) return;
          const { id, type } = confirmDelete;
          setConfirmDelete(null);
          if (type === "category") deleteCatMut.mutate(id);
          else if (type === "priority") deletePrioMut.mutate(id);
          else if (type === "status") deleteStatusMut.mutate(id);
          else if (type === "rule") deleteRuleMut.mutate(id);
        }}
      />
    </Tabs>
  );
}

function SlaTargetsTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editHours, setEditHours] = useState(0);

  const { data: slaTargets, isLoading } = useQuery({
    queryKey: ["sla-targets"],
    queryFn: getSlaTargets,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, hours }: { id: number; hours: number }) => updateSlaTarget(id, hours),
    onSuccess: () => {
      toast.success("SLA target updated.");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["sla-targets"] });
    },
    onError: () => toast.error("Failed to update SLA target."),
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>SLA Targets</CardTitle>
        <CardDescription>Set the target resolution hours for each priority level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Target Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaTargets?.map((target) => (
                <TableRow key={target.id}>
                  <TableCell className="font-medium">{target.priorityName}</TableCell>
                  <TableCell>
                    {editingId === target.id ? (
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={editHours}
                        onChange={(e) => setEditHours(Number(e.target.value))}
                        min={1}
                      />
                    ) : (
                      <span>{target.targetHours}h</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === target.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="xs"
                          disabled={updateMut.isPending || editHours < 1}
                          onClick={() => updateMut.mutate({ id: target.id, hours: editHours })}
                        >
                          {updateMut.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => { setEditingId(target.id); setEditHours(target.targetHours); }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
