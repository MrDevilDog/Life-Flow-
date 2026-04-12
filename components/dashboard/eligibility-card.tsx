"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Calendar } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

type DonationRow = {
  date: string
}

export function EligibilityCard() {
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
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load eligibility")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user, token])

  const computed = useMemo(() => {
    const dates = donations
      .map((d) => {
        const dt = new Date(d.date)
        return Number.isNaN(dt.getTime()) ? null : dt
      })
      .filter(Boolean) as Date[]

    if (dates.length === 0) {
      return {
        isEligible: true,
        nextDonationDate: "—",
        progress: 0,
      }
    }

    const last = dates.sort((a, b) => b.getTime() - a.getTime())[0]
    const eligibleAt = new Date(last.getTime() + 56 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diffMs = eligibleAt.getTime() - now.getTime()
    const daysUntilEligible = diffMs / (1000 * 60 * 60 * 24)
    const isEligible = daysUntilEligible <= 0

    const daysSinceLast = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    const progress = Math.min(Math.max((daysSinceLast / 56) * 100, 0), 100)

    return {
      isEligible,
      nextDonationDate: eligibleAt.toLocaleDateString(),
      progress: Math.round(progress),
    }
  }, [donations])

  if (!user) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please log in to see eligibility.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading eligibility...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Eligibility Status</CardTitle>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Eligibility Status</CardTitle>
          <Badge
            variant={computed.isEligible ? "default" : "secondary"}
            className={computed.isEligible ? "bg-green-600 text-green-50 hover:bg-green-600/90" : ""}
          >
            {computed.isEligible ? "Eligible" : "Not Eligible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {computed.isEligible ? (
          <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                You are eligible to donate!
              </p>
              <p className="mt-0.5 text-xs text-green-700/70 dark:text-green-400/70">
                {donations.length ? "Recovery period completed." : "No donation records found yet."}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recovery progress</span>
              <span className="font-medium text-foreground">{computed.progress}%</span>
            </div>
            <Progress value={computed.progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Next eligible date</p>
            <p className="text-sm font-medium text-foreground">{computed.nextDonationDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
