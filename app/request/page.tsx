import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BloodRequestForm } from "@/components/request/blood-request-form"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

export default function RequestPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" />
              Emergency Blood Request
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Request Blood
            </h1>
            <p className="text-muted-foreground">
              Fill in the details below to submit an emergency blood request. Our network of donors will be notified immediately.
            </p>
          </div>

          <BloodRequestForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
