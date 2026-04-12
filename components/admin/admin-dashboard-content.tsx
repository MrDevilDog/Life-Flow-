"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  HeartPulse,
  Droplet,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const widgetStats = [
  {
    label: "Total Donors",
    value: "2,847",
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    href: "/admin/donors",
  },
  {
    label: "Active Blood Requests",
    value: "38",
    change: "+5 today",
    trend: "up" as const,
    icon: HeartPulse,
    href: "/admin/requests",
  },
  {
    label: "Blood Units Available",
    value: "1,254",
    change: "-3%",
    trend: "down" as const,
    icon: Droplet,
    href: "/admin/blood-stock",
  },
  {
    label: "Registered Hospitals",
    value: "64",
    change: "+2 this month",
    trend: "up" as const,
    icon: Building2,
    href: "/admin/hospitals",
  },
]

const bloodInventory = [
  { group: "O+", units: 312, capacity: 400, status: "normal" },
  { group: "O-", units: 87, capacity: 200, status: "low" },
  { group: "A+", units: 245, capacity: 350, status: "normal" },
  { group: "A-", units: 58, capacity: 150, status: "critical" },
  { group: "B+", units: 198, capacity: 250, status: "normal" },
  { group: "B-", units: 42, capacity: 120, status: "critical" },
  { group: "AB+", units: 165, capacity: 200, status: "normal" },
  { group: "AB-", units: 34, capacity: 100, status: "low" },
]

const recentRequests = [
  {
    id: "REQ-1042",
    patient: "Arun Mehta",
    hospital: "City General Hospital",
    bloodGroup: "O-",
    units: 3,
    urgency: "Critical" as const,
    time: "8 min ago",
  },
  {
    id: "REQ-1041",
    patient: "Sarah Kim",
    hospital: "St. Mary's Medical",
    bloodGroup: "A+",
    units: 2,
    urgency: "Urgent" as const,
    time: "25 min ago",
  },
  {
    id: "REQ-1040",
    patient: "David Torres",
    hospital: "Regional Medical Center",
    bloodGroup: "B+",
    units: 1,
    urgency: "Normal" as const,
    time: "1 hour ago",
  },
  {
    id: "REQ-1039",
    patient: "Emily Chen",
    hospital: "Memorial Hospital",
    bloodGroup: "AB-",
    units: 2,
    urgency: "Urgent" as const,
    time: "2 hours ago",
  },
  {
    id: "REQ-1038",
    patient: "James Okoro",
    hospital: "Downtown Medical",
    bloodGroup: "O+",
    units: 1,
    urgency: "Normal" as const,
    time: "3 hours ago",
  },
]

const recentActivity = [
  { action: "New donor registered", detail: "Maria Santos from Los Angeles", time: "5 min ago", type: "donor" as const },
  { action: "Blood request fulfilled", detail: "REQ-1035 at Valley Hospital", time: "18 min ago", type: "fulfilled" as const },
  { action: "Critical request created", detail: "O- needed at City General", time: "25 min ago", type: "critical" as const },
  { action: "Stock updated", detail: "50 units A+ added from blood drive", time: "1 hour ago", type: "stock" as const },
  { action: "Hospital registered", detail: "Sunrise Medical Center, Houston", time: "2 hours ago", type: "hospital" as const },
  { action: "Donor approved", detail: "Robert Lee verified for B+", time: "3 hours ago", type: "donor" as const },
]

function getUrgencyStyle(urgency: "Critical" | "Urgent" | "Normal") {
  switch (urgency) {
    case "Critical":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    case "Urgent":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
    case "Normal":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
  }
}

function getStockStyle(status: string) {
  switch (status) {
    case "critical":
      return { color: "text-red-600 dark:text-red-400", bg: "bg-red-500" }
    case "low":
      return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" }
    default:
      return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" }
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
    case "fulfilled":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    case "stock":
      return <Droplet className="h-3.5 w-3.5 text-primary" />
    case "hospital":
      return <Building2 className="h-3.5 w-3.5 text-blue-500" />
    default:
      return <Users className="h-3.5 w-3.5 text-violet-500" />
  }
}

export function AdminDashboardContent() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {widgetStats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="group border-border transition-all hover:border-primary/30 hover:shadow-md">
              <CardContent className="flex items-start justify-between p-5">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground font-mono">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={cn(
                        stat.trend === "up"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      )}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Recent Blood Requests - wider */}
        <div className="xl:col-span-3">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Recent Blood Requests
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary">
                <Link href="/admin/requests">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Blood</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead className="pr-6 text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="pl-6 font-medium font-mono text-xs text-foreground">
                        {req.id}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {req.patient}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="hidden lg:inline">{req.hospital}</span>
                        <span className="lg:hidden">{req.hospital.split(" ").slice(0, 2).join(" ")}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 bg-primary/5 font-mono text-xs font-bold text-primary">
                          {req.bloodGroup}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getUrgencyStyle(req.urgency))}>
                          {req.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                        {req.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="xl:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 pt-0">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 py-3",
                    i !== recentActivity.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blood Inventory Overview */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Blood Inventory</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary">
            <Link href="/admin/blood-stock">
              Manage Stock
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bloodInventory.map((item) => {
              const percentage = Math.round((item.units / item.capacity) * 100)
              const style = getStockStyle(item.status)
              return (
                <div
                  key={item.group}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
                      <span className="text-sm font-bold text-primary font-mono">
                        {item.group}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        item.status === "critical" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
                        item.status === "low" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
                        item.status === "normal" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground font-mono">{item.units}</span>
                      <span className="text-xs text-muted-foreground">/ {item.capacity} units</span>
                    </div>
                    <Progress value={percentage} className="mt-2 h-1.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
