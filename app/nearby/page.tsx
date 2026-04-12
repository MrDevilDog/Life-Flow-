import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NearbyDonorFinder } from "@/components/nearby/nearby-donor-finder"
import { Badge } from "@/components/ui/badge"
import { Radar } from "lucide-react"

export default function NearbyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
              <Radar className="h-3.5 w-3.5 text-primary" />
              Location-Based Search
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Nearby Donor Finder
            </h1>
            <p className="text-muted-foreground">
              Find available blood donors near you. Filter by blood group, city, and distance to find the closest match.
            </p>
          </div>

          <NearbyDonorFinder />
        </div>
      </main>
      <Footer />
    </div>
  )
}
