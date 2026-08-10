"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { changePassword, setup2FA, verify2FA, disable2FA } from "@/lib/api/auth";
import { getMyProfile, updateMyProfile, uploadAvatar, deleteAvatar } from "@/lib/api/profile";
import { getTickets } from "@/lib/api/tickets";
import type { Role, Ticket, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Building, Save, Camera, Trash2, Shield } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getInitials, getAvatarSrc } from "@/lib/avatar";

const profileSchema = z.object({
  fullName: z.string().min(1, "Required").max(150, "Max 150 characters"),
  department: z.string().max(100, "Max 100 characters").optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

const roleClasses: Record<Role, string> = {
  Admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Employee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const statusColorMap: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSubmitError, setProfileSubmitError] = useState<string | null>(null);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ sharedKey: string; provisioningUri: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", department: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    let mounted = true;

    Promise.all([getMyProfile(), getTickets()])
      .then(([profileData, ticketsData]) => {
        if (!mounted) return;
        setProfile(profileData);
        setAllTickets(ticketsData.items);
        profileForm.reset({
          fullName: profileData.fullName,
          department: profileData.department ?? "",
        });
      })
      .catch(() => {
        if (mounted) setProfileError("Unable to load profile.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [profileForm]);

  const onSaveProfile = async (data: ProfileValues) => {
    setProfileSubmitError(null);
    try {
      const updated = await updateMyProfile({
        fullName: data.fullName,
        department: data.department?.trim() || undefined,
      });
      setProfile(updated);
      toast.success("Profile updated successfully.");
      setIsEditing(false);
    } catch {
      setProfileSubmitError("Unable to update profile.");
    }
  };

  const onChangePassword = async (data: PasswordValues) => {
    setPasswordSubmitError(null);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 400
      ) {
        setPasswordSubmitError(
          "Current password is incorrect or new password does not meet requirements."
        );
        return;
      }
      setPasswordSubmitError("Unable to change password.");
    }
  };

  const handleSetup2FA = async () => {
    setIsSettingUp2FA(true);
    try {
      const result = await setup2FA();
      setTwoFactorSetup(result);
      setTwoFactorCode("");
    } catch {
      toast.error("Failed to start 2FA setup.");
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length < 6) return;
    setIsVerifying2FA(true);
    try {
      await verify2FA(twoFactorCode);
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setTwoFactorCode("");
      toast.success("Two-factor authentication enabled.");
    } catch {
      toast.error("Invalid verification code.");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (twoFactorCode.length < 6) return;
    setIsDisabling2FA(true);
    try {
      await disable2FA(twoFactorCode);
      setTwoFactorEnabled(false);
      setTwoFactorCode("");
      toast.success("Two-factor authentication disabled.");
    } catch {
      toast.error("Invalid verification code.");
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleCancel2FASetup = async () => {
    setTwoFactorSetup(null);
    setTwoFactorCode("");
  };

  const role = profile?.role as Role | undefined;

  const stats = useMemo(() => {
    const name = profile?.fullName ?? "";
    return {
      created: allTickets.filter((t) => t.createdByName === name).length,
      assigned: allTickets.filter((t) => t.assignedToName === name).length,
      resolved: allTickets.filter(
        (t) => t.assignedToName === name && t.statusName === "Resolved"
      ).length,
    };
  }, [allTickets, profile]);

  const userTickets = useMemo(
    () =>
      allTickets.filter(
        (t) =>
          t.createdByName === profile?.fullName ||
          t.assignedToName === profile?.fullName
      ),
    [allTickets, profile]
  );

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar();
      setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      toast.success("Avatar removed.");
    } catch {
      toast.error("Failed to remove avatar.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="User Profile" description="Manage your account information" />

      {loading ? (
        <LoadingSkeleton />
      ) : profileError ? (
        <p className="text-sm font-medium text-destructive">{profileError}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24">
                      {profile?.avatarUrl ? (
                        <AvatarImage src={getAvatarSrc(profile.avatarUrl)} alt={profile.fullName} />
                      ) : null}
                      <AvatarFallback className="text-2xl">
                        {profile ? getInitials(profile.fullName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const result = await uploadAvatar(file);
                          setProfile((prev) => prev ? { ...prev, avatarUrl: result.avatarUrl } : prev);
                          toast.success("Avatar updated.");
                        } catch {
                          toast.error("Failed to upload avatar.");
                        }
                      }}
                    />
                    <div className="absolute -bottom-1 right-0 flex gap-1">
                      {profile?.avatarUrl ? (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-full h-8 w-8"
                          onClick={handleDeleteAvatar}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-8 w-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-1">{profile?.fullName}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{profile?.email}</p>
                  {role && (
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${roleClasses[role]}`}
                    >
                      {role}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tickets Created</span>
                  <span className="font-semibold">{stats.created}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tickets Assigned</span>
                  <span className="font-semibold">{stats.assigned}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tickets Resolved</span>
                  <span className="font-semibold">{stats.resolved}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolution Rate</span>
                  <span className="font-semibold">
                    {stats.assigned > 0
                      ? Math.round((stats.resolved / stats.assigned) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your profile details</CardDescription>
                      </div>
                      {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form
                        className="space-y-4"
                        onSubmit={profileForm.handleSubmit(onSaveProfile)}
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <div className="space-y-2">
                                  <Label htmlFor="name">Full Name</Label>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      id="name"
                                      className="pl-9"
                                      disabled={!isEditing}
                                      maxLength={150}
                                      {...field}
                                    />
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <div className="space-y-2">
                                  <Label htmlFor="department">Department</Label>
                                  <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      id="department"
                                      className="pl-9"
                                      disabled={!isEditing}
                                      maxLength={100}
                                      {...field}
                                    />
                                  </div>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input value={profile?.email ?? ""} readOnly className="pl-9" />
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                              <Save className="mr-2 h-4 w-4" />
                              {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditing(false);
                                profileForm.reset({
                                  fullName: profile?.fullName ?? "",
                                  department: profile?.department ?? "",
                                });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {profileSubmitError ? (
                          <p className="text-sm font-medium text-destructive">
                            {profileSubmitError}
                          </p>
                        ) : null}
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent ticket interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userTickets.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No ticket activity yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {userTickets.slice(0, 5).map((ticket) => (
                          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                            <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-1">{ticket.title}</h4>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      statusColorMap[ticket.statusName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                    }`}
                                  >
                                    {ticket.statusName}
                                  </span>
                                  <span className="font-mono text-xs text-muted-foreground/60">
                                    {ticket.referenceNumber}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.createdByName === profile?.fullName
                                    ? "Created by you"
                                    : "Assigned to you"}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form
                        className="space-y-4"
                        onSubmit={passwordForm.handleSubmit(onChangePassword)}
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                  id="currentPassword"
                                  type="password"
                                  autoComplete="current-password"
                                  {...field}
                                />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  autoComplete="new-password"
                                  {...field}
                                />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  autoComplete="new-password"
                                  {...field}
                                />
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />
                        <div className="space-y-3 pt-2">
                          <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting
                              ? "Changing..."
                              : "Change Password"}
                          </Button>
                          {passwordSubmitError ? (
                            <p className="text-sm font-medium text-destructive">
                              {passwordSubmitError}
                            </p>
                          ) : null}
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">2FA Status</p>
                        <p className="text-sm text-muted-foreground">
                          {twoFactorEnabled ? "Enabled" : "Not enabled"}
                        </p>
                      </div>
                      {!twoFactorSetup && !twoFactorEnabled && (
                        <Button onClick={handleSetup2FA} disabled={isSettingUp2FA}>
                          {isSettingUp2FA ? "Setting up..." : "Enable 2FA"}
                        </Button>
                      )}
                      {twoFactorEnabled && (
                        <Button variant="outline" onClick={() => setTwoFactorCode("")}>
                          Disable
                        </Button>
                      )}
                    </div>

                    {twoFactorSetup && (
                      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                        <p className="text-sm font-medium">Scan this QR code with your authenticator app</p>
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetup.provisioningUri)}`}
                            alt="2FA QR Code"
                            className="rounded-lg"
                            width={200}
                            height={200}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Or enter key manually: <code className="text-foreground font-mono">{twoFactorSetup.sharedKey}</code>
                        </p>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter 6-digit code"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength={6}
                            className="w-40"
                          />
                          <Button onClick={handleVerify2FA} disabled={twoFactorCode.length < 6 || isVerifying2FA} size="sm">
                            {isVerifying2FA ? "Verifying..." : "Verify"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleCancel2FASetup}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {twoFactorEnabled && twoFactorCode.length === 0 && (
                      <p className="text-xs text-muted-foreground">Click "Disable" above to show the code input for disabling 2FA.</p>
                    )}

                    {twoFactorEnabled && twoFactorCode.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Enter 6-digit code to disable"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="w-52"
                        />
                        <Button variant="destructive" size="sm" onClick={handleDisable2FA} disabled={twoFactorCode.length < 6 || isDisabling2FA}>
                          {isDisabling2FA ? "Disabling..." : "Confirm Disable"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setTwoFactorCode("")}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
