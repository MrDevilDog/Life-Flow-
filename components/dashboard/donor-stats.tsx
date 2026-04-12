"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Droplet, Heart, CalendarCheck, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

type DonationRow = {
  donation_id: number | string
  date: string
  units: number
  request_status?: string
}

function toDate(d?: string) {
  if (!d) return null
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

function computeStreak(dates: Date[]) {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  let best = 1
  let current = 1

  // Approx: count consecutive donations when each next donation is within 60 days.
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays <= 60) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }

  return best
}

export function DonorStats() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [donations, setDonations] = useState<DonationRow[]>([])

  useEffect(() => {
    if (!user || !token) return

    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/donations", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (mounted) setDonations(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load stats")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, token])

  const computed = useMemo(() => {
    const dates = donations.map((d) => toDate(d.date)).filter(Boolean) as Date[]
    const totalDonations = donations.length
    const totalUnits = donations.reduce((sum, d) => sum + (Number(d.units) || 0), 0)
    const last = dates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    return {
      totalDonations,
      livesSaved: totalUnits, // no separate field in schema; keep as derived units
      lastDonationLabel: last ? last.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—",
      streak: computeStreak(dates),
    }
  }, [donations])

  if (!user) return null
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <p className="text-sm text-muted-foreground col-span-full">Loading donation stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <p className="text-sm text-destructive col-span-full">{error}</p>
      </div>
    )
  }

  const stats = [
    { label: "Total Donations", value: String(computed.totalDonations), icon: Droplet },
    { label: "Lives Saved (derived)", value: String(computed.livesSaved), icon: Heart },
    { label: "Last Donation", value: computed.lastDonationLabel, icon: CalendarCheck },
    { label: "Streak (approx.)", value: String(computed.streak), icon: TrendingUp },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
