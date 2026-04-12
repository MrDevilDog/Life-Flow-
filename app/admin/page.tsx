import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"

export const metadata = {
  title: "Admin Dashboard - LifeFlow",
  description: "Blood Donation Management System admin overview.",
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono lg:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your blood donation management system.
        </p>
      </div>
      <AdminDashboardContent />
    </div>
  )
}
