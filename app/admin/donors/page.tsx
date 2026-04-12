import { DonorManagement } from "@/components/admin/donor-management"

export const metadata = {
  title: "Donor Management - LifeFlow Admin",
  description: "Manage registered blood donors.",
}

export default function DonorsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono lg:text-3xl">
          Donor Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Approve, suspend, or remove donors from the system.
        </p>
      </div>
      <DonorManagement />
    </div>
  )
}
