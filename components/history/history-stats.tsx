"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Droplet, CheckCircle2, Clock, Building2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

type DonationRow = {
  hospital: string
  request_status: string
}

export function HistoryStats() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<DonationRow[]>([])

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
        const data = (await res.json()) as DonationRow[]
        if (mounted) setRows(Array.isArray(data) ? data : [])
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load history stats")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user, token])

  const stats = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((r) => String(r.request_status) === "fulfilled").length
    const pending = rows.filter((r) => {
      const s = String(r.request_status)
      return s !== "fulfilled" && s !== "cancelled"
    }).length
    const hospitals = Array.from(new Set(rows.map((r) => r.hospital).filter(Boolean))).length

    return [
      { label: "Total Donations", value: String(total), icon: Droplet },
      { label: "Completed", value: String(completed), icon: CheckCircle2 },
      { label: "Pending", value: String(pending), icon: Clock },
      { label: "Hospitals", value: String(hospitals), icon: Building2 },
    ]
  }, [rows])

  if (!user) {
    return <div className="mb-6 text-sm text-muted-foreground">Please log in to view history.</div>
  }
  if (loading) {
    return <div className="mb-6 text-sm text-muted-foreground">Loading history stats...</div>
  }
  if (error) {
    return <div className="mb-6 text-sm text-destructive">{error}</div>
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
