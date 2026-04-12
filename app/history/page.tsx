import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DonationHistoryTable } from "@/components/history/donation-history-table"
import { HistoryStats } from "@/components/history/history-stats"

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
              Donation History
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track your donation records and contributions
            </p>
          </div>
          <HistoryStats />
          <DonationHistoryTable />
        </div>
      </main>
      <Footer />
    </div>
  )
}
