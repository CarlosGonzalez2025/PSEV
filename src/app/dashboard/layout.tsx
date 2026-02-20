import type { ReactNode } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-background dark:bg-background-dark">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Header />
          <main className="flex-1 p-6 bg-background dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
