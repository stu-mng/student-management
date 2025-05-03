"use client"

import ProtectedRoute from "@/components/protected-route"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "root", "manager"]}>
      <div className="space-y-6">
        {children}
      </div>
    </ProtectedRoute>
  )
} 