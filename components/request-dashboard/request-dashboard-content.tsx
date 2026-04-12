"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Droplet,
  Building2,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

type RequestRow = {
  id: number | string
  patient_name: string
  blood_group: string
  units: number
  hospital: string
  city: string
  urgency: "low" | "medium" | "high"
  status: "active" | "fulfilled" | "cancelled"
  created_at?: string
}

type DonorRow = {
  id: number | string
  user_id: number | string
  blood_group: string
  location: string
  phone: string
  availability: number | boolean
}

function formatDateRelative(date?: string) {
  if (!date) return "—"
  const dt = new Date(date)
  if (Number.isNaN(dt.getTime())) return "—"
  const diffMs = Date.now() - dt.getTime()
  const diffMin = Math.round(diffMs / (1000 * 60))
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`
  const diffDays = Math.round(diffHr / 24)
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
}

export function RequestDashboardContent() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [donors, setDonors] = useState<DonorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const [reqRes, donorRes] = await Promise.all([
          fetch("/api/requests", { cache: "no-store" }),
          fetch("/api/donors", { cache: "no-store" }),
        ])
        if (!reqRes.ok) throw new Error(`Requests HTTP ${reqRes.status}`)
        if (!donorRes.ok) throw new Error(`Donors HTTP ${donorRes.status}`)

        const reqData = (await reqRes.json()) as RequestRow[]
        const donorData = (await donorRes.json()) as DonorRow[]

        if (!mounted) return
        setRequests(Array.isArray(reqData) ? reqData : [])
        setDonors(Array.isArray(donorData) ? donorData : [])
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load request dashboard")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const computed = useMemo(() => {
    const activeRequests = requests.filter((r) => r.status === "active")
    const criticalRequests = activeRequests.filter((r) => r.urgency === "high")
    const fulfilledToday = requests.filter((r) => {
      if (r.status !== "fulfilled") return false
      const dt = r.created_at ? new Date(r.created_at) : null
      if (!dt || Number.isNaN(dt.getTime())) return false
      return dt.toDateString() === new Date().toDateString()
    }).length

    const bloodGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    const demand = bloodGroups.map((g) => {
      const groupRequests = activeRequests.filter((r) => r.blood_group === g).length
      const availableDonors = donors.filter((d) => d.availability === true || d.availability === 1).filter((d) => d.blood_group === g).length
      const ratio = availableDonors === 0 ? Infinity : groupRequests / availableDonors
      const demandLevel = ratio === Infinity ? "high" : ratio >= 1 ? "high" : ratio >= 0.5 ? "medium" : "low"
      return { group: g, requests: groupRequests, available: availableDonors, demand: demandLevel }
    })

    const recentFulfilled = requests
      .filter((r) => r.status === "fulfilled")
      .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
      .slice(0, 5)
      .map((r) => {
        const respondedDonors = donors.filter((d) => (d.availability === true || d.availability === 1) && d.blood_group === r.blood_group).length
        return { ...r, respondedDonors }
      })

    return {
      activeRequests: activeRequests.length,
      criticalRequests: criticalRequests.length,
      fulfilledToday,
      demand,
      recentFulfilled,
    }
  }, [requests, donors])

  if (loading) return <p className="text-sm text-muted-foreground">Loading request dashboard...</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Active Requests", value: computed.activeRequests, icon: HeartPulse, accent: false },
          { label: "Critical Requests", value: computed.criticalRequests, icon: AlertTriangle, accent: true },
          { label: "Fulfilled Today", value: computed.fulfilledToday, icon: CheckCircle2, accent: false },
          { label: "Avg Units in Active", value: computed.activeRequests ? Math.round(requests.filter((r) => r.status === "active").reduce((s, r) => s + (Number(r.units) || 0), 0) / computed.activeRequests) : 0, icon: Activity, accent: false },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={cn("group relative overflow-hidden border-border transition-all hover:shadow-md", stat.accent && "border-primary/30 shadow-sm shadow-primary/5")}
          >
            {stat.accent ? <div className="absolute left-0 top-0 h-full w-1 bg-primary" /> : null}
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10", stat.accent && "bg-primary/15")}>
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground font-mono">{stat.value}</p>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="border-primary/20 shadow-sm shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Critical Requests</CardTitle>
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-xs text-primary">
                  {computed.criticalRequests} active
                </Badge>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary">
                <Link href="/emergency">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {requests
                .filter((r) => r.status === "active" && r.urgency === "high")
                .sort((a, b) => (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0))
                .slice(0, 3)
                .map((req) => (
                  <div
                    key={String(req.id)}
                    className="flex items-center gap-4 rounded-lg border border-primary/15 bg-primary/[0.02] p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <span className="text-sm font-bold text-primary font-mono">{req.blood_group}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{req.patient_name}</p>
                        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] font-semibold uppercase text-primary">
                          Critical
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {req.hospital}
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplet className="h-3 w-3" />
                          {formatDateRelative(req.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {req.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-lg font-bold text-foreground font-mono">{req.units}</p>
                      <p className="text-[10px] text-muted-foreground">units needed</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {donors.filter((d) => (d.availability === true || d.availability === 1) && d.blood_group === req.blood_group).length} available
                      </div>
                    </div>
                  </div>
                ))}
              {computed.criticalRequests === 0 ? (
                <p className="text-sm text-muted-foreground">No critical requests right now.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Blood Group Demand</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              {computed.demand.map((bg) => {
                const percentage =
                  bg.available === 0 ? 100 : Math.min(Math.round((bg.requests / (bg.requests + bg.available)) * 100), 100)
                return (
                  <div key={bg.group} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5">
                      <span className="text-xs font-bold text-primary font-mono">{bg.group}</span>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {bg.requests} requests / {bg.available} available
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            bg.demand === "high" && "border-primary/30 text-primary",
                            bg.demand === "medium" && "border-amber-500/30 text-amber-600 dark:text-amber-400",
                            bg.demand === "low" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {bg.demand}
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base font-semibold">Recently Fulfilled Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {computed.recentFulfilled.length === 0 ? (
              <p className="text-sm text-muted-foreground">No fulfilled requests yet.</p>
            ) : (
              computed.recentFulfilled.map((r) => (
                <div key={String(r.id)} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{r.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{r.hospital} - {r.city}</p>
                      <p className="text-sm">
                        Blood group: <span className="font-medium">{r.blood_group}</span> | Units:{" "}
                        <span className="font-medium">{r.units}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">fulfilled</Badge>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{r.respondedDonors}</span> donors available
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

