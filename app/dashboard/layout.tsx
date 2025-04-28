import { AuthProvider } from "@/components/auth-provider"
import DashboardHeader from "@/components/dashboard-header"
import type React from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex w-screen min-h-screen items-center flex-col">
        <DashboardHeader />
        <div className="flex-1 p-4 md:p-6 w-full lg:max-w-[75vw]">{children}</div>
      </div>
    </AuthProvider>
  )
}
