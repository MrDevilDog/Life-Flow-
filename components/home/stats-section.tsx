"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, HeartPulse, Building2, Activity } from "lucide-react"
import { useEffect, useState } from "react"

type PublicStats = {
  total_donors: number
  active_requests: number
  completed_donations: number
}

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [target])

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export function StatsSection() {
  const [stats, setStats] = useState<
    Array<{
      label: string
      value: number
      icon: any
      description: string
      suffix: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/stats", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as PublicStats
        if (!mounted) return

        const totalDonors = Number(data.total_donors) || 0
        const activeRequests = Number(data.active_requests) || 0
        const completedDonations = Number(data.completed_donations) || 0

        // Partner hospitals/lives saved aren't stored as dedicated aggregates in schema,
        // so we derive them conservatively from existing counts.
        setStats([
          { label: "Total Donors", value: totalDonors, icon: Users, description: "Registered blood donors", suffix: "+" },
          { label: "Active Requests", value: activeRequests, icon: HeartPulse, description: "Requests currently in progress", suffix: "+" },
          { label: "Completed Donations", value: completedDonations, icon: Building2, description: "Completed donation records", suffix: "" },
          { label: "Lives Saved (est.)", value: completedDonations, icon: Activity, description: "Derived from completed donations", suffix: "+" },
        ])
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Unable to load stats")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) return null
  if (error) {
    return (
      <section className="border-y border-border bg-background py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="border-y border-border bg-background py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            Making an Impact Together
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our community is growing stronger every day
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-border transition-all hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight text-foreground font-mono">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
