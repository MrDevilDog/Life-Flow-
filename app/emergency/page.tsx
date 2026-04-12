"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus } from "lucide-react"
import Link from "next/link"

type EmergencyRequest = {
  id: number
  patient_name: string
  patient_phone?: string
  blood_group: string
  units: number
  hospital: string
  city: string
  urgency: string
  status: string
  created_at?: string
  user_id?: number
}

export function EmergencyRequestsList() {
  const [requests, setRequests] = useState<EmergencyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/request", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        
        const data = await res.json()
        console.log("Emergency requests data:", data);
        
        // Handle both response formats - direct array or wrapped in success/data
        const requestsArray = Array.isArray(data) ? data : (data.data || [])
        setRequests(requestsArray)
      } catch (err) {
        console.error(err)
        setError("Failed to load emergency requests.")
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-muted-foreground">Loading requests...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-destructive">{error}</span>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-muted-foreground">No active emergency requests found.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-lg">{req.patient_name}</span>
            <span className="text-sm text-muted-foreground">
              <span className="font-mono font-semibold">{req.blood_group}</span>{" "}
              | {req.units} unit{req.units !== 1 ? 's' : ''} | {req.city}
            </span>
            {req.hospital && (
              <span className="text-xs text-muted-foreground">
                🏥 {req.hospital}
              </span>
            )}
            {req.patient_phone && (
              <span className="text-xs text-muted-foreground">
                📞 {req.patient_phone}
              </span>
            )}
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-xs text-foreground">
              Urgency: <span className={`font-semibold ${
                req.urgency === 'high' ? 'text-red-600' :
                req.urgency === 'medium' ? 'text-amber-600' :
                'text-green-600'
              }`}>{req.urgency}</span>
            </span>
            <span className={`inline-flex items-center text-xs font-medium ${
              req.status === "active"
                ? "text-green-600"
                : req.status === "fulfilled"
                  ? "text-blue-600"
                  : "text-gray-500"
            }`}>
              Status: {req.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EmergencyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3">
              <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-primary" />
                Live Emergency Feed
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
                Emergency Blood Requests
              </h1>
              <p className="text-muted-foreground">
                Active blood requests from hospitals and patients in need. Respond now to save a life.
              </p>
            </div>
            <Button asChild className="gap-2 shrink-0">
              <Link href="/request">
                <Plus className="h-4 w-4" />
                New Request
              </Link>
            </Button>
          </div>

          <EmergencyRequestsList />
        </div>
      </main>
      <Footer />
    </div>
  )
}
