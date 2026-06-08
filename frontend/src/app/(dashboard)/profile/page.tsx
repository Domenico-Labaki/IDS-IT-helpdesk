"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { changePassword } from "@/lib/api/auth";
import { getMyProfile, updateMyProfile } from "@/lib/api/profile";
import { getTickets } from "@/lib/api/tickets";
import type { Role, Ticket, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, Building, Save, Camera } from "lucide-react";

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
  Admin: "bg-red-100 text-red-700",
  Agent: "bg-blue-100 text-blue-700",
  Manager: "bg-purple-100 text-purple-700",
  Employee: "bg-green-100 text-green-700",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-zinc-200" />
      <div className="h-10 rounded-xl bg-zinc-100" />
      <div className="h-10 rounded-xl bg-zinc-100" />
      <div className="h-10 rounded-xl bg-zinc-100" />
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
        setAllTickets(ticketsData);
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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">User Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

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
                      <AvatarFallback className="text-2xl">
                        {profile ? getInitials(profile.fullName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
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
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {ticket.referenceNumber}
                                  </span>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      ticket.statusName === "Open"
                                        ? "bg-blue-100 text-blue-700"
                                        : ticket.statusName === "In Progress"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : ticket.statusName === "Resolved"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-zinc-100 text-zinc-700"
                                    }`}
                                  >
                                    {ticket.statusName}
                                  </span>
                                </div>
                                <h4 className="font-semibold mb-1">{ticket.title}</h4>
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
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">2FA Status</p>
                        <p className="text-sm text-muted-foreground">Not enabled</p>
                      </div>
                      <Button disabled>Enable 2FA</Button>
                    </div>
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
