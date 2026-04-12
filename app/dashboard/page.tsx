import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DonorProfile } from "@/components/dashboard/donor-profile"
import { DonorStats } from "@/components/dashboard/donor-stats"
import { EligibilityCard } from "@/components/dashboard/eligibility-card"
import { BadgesCard } from "@/components/dashboard/badges-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { NearbyDonorsMap } from "@/components/dashboard/nearby-donors-map"
import { UserProfile } from "@/components/dashboard/user-profile"
import { DonationEligibility } from "@/components/dashboard/donation-eligibility"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function DashboardPage() {
  // Check for authentication token
  const cookieStore = await cookies()
  const token = cookieStore.get("token")
  
  if (!token) {
    redirect("/login")
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Donor Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back. Here is your donation overview.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <DonorProfile />
              <UserProfile />
              <DonationEligibility />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-2">
              <DonorStats />
              <div className="grid gap-6 md:grid-cols-2">
                <EligibilityCard />
                <BadgesCard />
              </div>
              <QuickActions />
              <NearbyDonorsMap />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
