import { AdminBloodRequests } from "@/components/admin/admin-blood-requests"

export const metadata = {
  title: "Blood Requests - LifeFlow Admin",
  description: "Manage blood donation requests.",
}

export default function AdminRequestsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono lg:text-3xl">
          Blood Requests
        </h1>
        <p className="mt-1 text-muted-foreground">
          Monitor and manage all incoming blood requests.
        </p>
      </div>
      <AdminBloodRequests />
    </div>
  )
}
