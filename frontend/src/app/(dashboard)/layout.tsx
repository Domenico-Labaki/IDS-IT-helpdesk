import { SidebarNav } from "@/components/SidebarNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 md:pl-[240px]">
      <SidebarNav />
      <main className="min-h-screen flex-1 overflow-y-auto p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}