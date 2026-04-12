import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RequestDashboardContent } from "@/components/request-dashboard/request-dashboard-content"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard } from "lucide-react"

export default function RequestDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              Request Overview
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Request Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor blood request activity, track fulfillment progress, and manage emergency responses.
            </p>
          </div>

          <RequestDashboardContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
