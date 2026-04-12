"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

type DonationStatus = "Completed" | "Pending" | "Cancelled"

interface Donation {
  id: string
  date: string
  hospital: string
  bloodGroup: string
  status: DonationStatus
  units: number
}

type DonationRow = {
  donation_id: number | string
  date: string
  hospital: string
  blood_group: string
  units: number
  request_status: string
}

function getStatusColor(status: DonationStatus) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
    case "Pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
  }
}

export function DonationHistoryTable() {
  const { user, token } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])

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

        const normalized: Donation[] = Array.isArray(data)
          ? data.map((r) => {
              const rs = String(r.request_status)
              const status: DonationStatus =
                rs === "fulfilled" ? "Completed" : rs === "cancelled" ? "Cancelled" : "Pending"
              const id = `DON-${r.donation_id}`
              return {
                id,
                date: r.date,
                hospital: r.hospital,
                bloodGroup: r.blood_group,
                status,
                units: Number(r.units) || 0,
              }
            })
          : []

        if (mounted) setDonations(normalized)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load donation history")
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user, token])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return donations.filter((d) => {
      const matchesStatus = statusFilter === "all" || d.status === statusFilter
      const matchesSearch = d.hospital.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [donations, searchQuery, statusFilter])

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">Donation Records</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by hospital or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!user ? (
          <div className="p-6 text-sm text-muted-foreground">Please log in to view your donation history.</div>
        ) : loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading donation records...</div>
        ) : error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No donation records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="pl-6 font-medium text-foreground">{donation.id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {donation.date ? new Date(donation.date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-foreground">{donation.hospital}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{donation.bloodGroup}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {donation.units} unit{donation.units === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant="secondary" className={getStatusColor(donation.status)}>
                        {donation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
