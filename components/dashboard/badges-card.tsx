"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Star, Zap, Heart, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-context"

type DonationRow = { date: string; units: number }

function computeStreak(dates: Date[]) {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  let best = 1
  let current = 1
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

export function BadgesCard() {
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
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load badges")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user, token])

  const earnedBadges = useMemo(() => {
    const dates = donations
      .map((d) => new Date(d.date))
      .filter((dt) => !Number.isNaN(dt.getTime()))
    const totalDonations = donations.length
    const units = donations.reduce((sum, d) => sum + (Number(d.units) || 0), 0)
    const streak = computeStreak(dates)

    const badgeDefs = [
      { icon: Award, label: "First Donor", description: "Completed 1 donation", earned: totalDonations >= 1 },
      { icon: Star, label: "Regular Donor", description: "5+ donations", earned: totalDonations >= 5 },
      { icon: Zap, label: "Streak Master", description: "3+ donation streak", earned: streak >= 3 },
      { icon: Heart, label: "Life Saver", description: "20+ units donated", earned: units >= 20 },
      { icon: Shield, label: "Elite Donor", description: "10+ donations", earned: totalDonations >= 10 },
    ]

    const earnedCount = badgeDefs.filter((b) => b.earned).length
    return { badgeDefs, earnedCount }
  }, [donations])

  if (!user) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Donation Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please log in to view your badges.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Donation Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading badges...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Donation Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Donation Badges</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {earnedBadges.badgeDefs.map((badge) => (
            <div
              key={badge.label}
              className="group relative flex flex-col items-center gap-1"
              title={`${badge.label}: ${badge.description}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  badge.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                }`}
              >
                <badge.icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  badge.earned ? "font-medium text-foreground" : "text-muted-foreground/50"
                }`}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="secondary">{earnedBadges.earnedCount} badges earned</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
