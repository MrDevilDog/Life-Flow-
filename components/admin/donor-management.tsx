"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Users, UserCheck, UserX, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type DonorStatus = "Active" | "Suspended"

interface Donor {
  id: number
  name: string
  bloodGroup: string
  city: string
  status: DonorStatus
  phone: string
  email: string
}

function getStatusStyle(status: DonorStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    case "Suspended":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
  }
}

export function DonorManagement() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [bloodFilter, setBloodFilter] = useState("all")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const [donorRes, usersRes] = await Promise.all([
          fetch("/api/donors", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ])
        if (!donorRes.ok) throw new Error(`Donors HTTP ${donorRes.status}`)
        if (!usersRes.ok) throw new Error(`Users HTTP ${usersRes.status}`)

        const [donorData, usersData] = await Promise.all([donorRes.json(), usersRes.json()])
        const usersById = new Map<number, any>(
          (Array.isArray(usersData) ? usersData : []).map((u: any) => [Number(u.id), u])
        )

        const normalized: Donor[] = (Array.isArray(donorData) ? donorData : []).map((row: any) => {
          const u = usersById.get(Number(row.user_id))
          return {
            id: Number(row.id),
            name: u?.name ?? `User ${row.user_id}`,
            bloodGroup: row.blood_group,
            city: row.location,
            status: row.availability ? "Active" : "Suspended",
            phone: row.phone ?? "",
            email: u?.email ?? "",
          }
        })
        if (mounted) setDonors(normalized)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load donors")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const summaryStats = useMemo(
    () => [
      { label: "Total Donors", value: String(donors.length), icon: Users },
      { label: "Active", value: String(donors.filter((d) => d.status === "Active").length), icon: UserCheck },
      { label: "Suspended", value: String(donors.filter((d) => d.status === "Suspended").length), icon: UserX },
      { label: "Loaded", value: loading ? "..." : "Yes", icon: Clock },
    ],
    [donors, loading]
  )

  const filtered = donors.filter((d) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter
    const matchBlood = bloodFilter === "all" || d.bloodGroup === bloodFilter
    const q = searchQuery.toLowerCase()
    const matchSearch =
      d.name.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      String(d.id).toLowerCase().includes(q)
    return matchStatus && matchBlood && matchSearch
  })

  if (loading) return <p className="text-sm text-muted-foreground">Loading donors...</p>
  if (error) return <p className="text-sm text-destructive">Failed to load donors: {error}</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
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

      <Card className="border-border">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base font-semibold">All Donors</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, city, or donor ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:w-56"
              />
            </div>
            <Select value={bloodFilter} onValueChange={setBloodFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Donor</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead className="hidden md:table-cell">City</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No donors found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {donor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">D-{donor.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 font-mono text-xs font-bold text-primary">
                        {donor.bloodGroup}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{donor.city}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{donor.phone}</TableCell>
                    <TableCell className="hidden font-mono text-foreground lg:table-cell">{donor.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getStatusStyle(donor.status))}>
                        {donor.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
