"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { changePassword, getMyProfile, updateMyProfile } from "@/lib/api";
import type { Role, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSubmitError, setProfileSubmitError] = useState<string | null>(null);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName: "", department: "" } });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  useEffect(() => {
    let mounted = true;

    getMyProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        profileForm.reset({ fullName: data.fullName, department: data.department ?? "" });
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
      const updated = await updateMyProfile({ fullName: data.fullName, department: data.department?.trim() || undefined });
      setProfile(updated);
      toast.success("Profile updated successfully.");
    } catch {
      setProfileSubmitError("Unable to update profile.");
    }
  };

  const onChangePassword = async (data: PasswordValues) => {
    setPasswordSubmitError(null);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success("Password changed successfully.");
      passwordForm.reset();
    } catch (error) {
      if (typeof error === "object" && error && "response" in error && (error as { response?: { status?: number } }).response?.status === 400) {
        setPasswordSubmitError("Current password is incorrect or new password does not meet requirements.");
        return;
      }
      setPasswordSubmitError("Unable to change password.");
    }
  };

  const role = profile?.role as Role | undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Profile</h1>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSkeleton />
          ) : profileError ? (
            <p className="text-sm font-medium text-destructive">{profileError}</p>
          ) : (
            <Form {...profileForm}>
              <form className="space-y-4" onSubmit={profileForm.handleSubmit(onSaveProfile)}>
                <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" maxLength={150} {...field} />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="department" render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" maxLength={100} {...field} />
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${role ? roleClasses[role] : "bg-zinc-100 text-zinc-700"}`}>{role ?? "-"}</span>
                </div>
                <div className="space-y-3 pt-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>Save Changes</Button>
                  {profileSubmitError ? <p className="text-sm font-medium text-destructive">{profileSubmitError}</p> : null}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold tracking-tight">Change Password</h2>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form className="space-y-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                <FormItem>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" autoComplete="current-password" {...field} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" autoComplete="new-password" {...field} />
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" {...field} />
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-3 pt-2">
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>Change Password</Button>
                {passwordSubmitError ? <p className="text-sm font-medium text-destructive">{passwordSubmitError}</p> : null}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}