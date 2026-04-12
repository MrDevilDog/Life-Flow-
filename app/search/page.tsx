import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DonorSearch } from "@/components/search/donor-search"

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Find Blood Donors
            </h1>
            <p className="mt-1 text-muted-foreground">
              Search for available donors by blood group, city, or availability
            </p>
          </div>
          <DonorSearch />
        </div>
      </main>
      <Footer />
    </div>
  )
}
