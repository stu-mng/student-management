


import { ProtectedRoute } from "@/components/protected-route"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "root"]}>
      {children}
    </ProtectedRoute>
  )
}

