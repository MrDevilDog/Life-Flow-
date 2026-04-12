"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Building2, Clock, Filter, MapPin, RotateCcw, Phone, Mail, User, Eye } from "lucide-react"

interface BloodRequest {
  id: number
  patient_name: string
  hospital: string
  blood_group: string
  units: number
  urgency: "low" | "medium" | "high"
  city: string
  status: "active" | "fulfilled" | "cancelled"
  created_at?: string
  notes?: string
  role?: string
  requester_name?: string
  requester_email?: string
  requester_phone?: string
}

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const urgencyOptions = ["All", "high", "medium", "low"]

export function EmergencyRequestsList() {
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bloodFilter, setBloodFilter] = useState("All")
  const [cityFilter, setCityFilter] = useState("All")
  const [urgencyFilter, setUrgencyFilter] = useState("All")
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    let mounted = true
    let intervalId: NodeJS.Timeout

    async function fetchRequests() {
      try {
        setError(null)
        const res = await fetch("/api/requests", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        
        const data = await res.json()
        
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch requests")
        }
        
        if (mounted) setRequests(Array.isArray(data.data) ? data.data : [])
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load requests")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Initial fetch
    fetchRequests()

    // Set up polling for real-time updates (every 5 seconds)
    intervalId = setInterval(fetchRequests, 5000)

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const handleViewContact = async (request: BloodRequest) => {
    try {
      const res = await fetch(`/api/requests/${request.id}`)
      if (res.ok) {
        const response = await res.json()
        if (response.success) {
          setSelectedRequest(response.data)
          setShowContactModal(true)
        } else {
          throw new Error(response.error || "Failed to fetch request details")
        }
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch request details:", error)
      alert("Failed to load contact details. Please try again.")
    }
  }

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(requests.map((r) => r.city))).sort()],
    [requests]
  )

  const filteredRequests = useMemo(
    () =>
      requests.filter((req) => {
        const matchesBlood = bloodFilter === "All" || req.blood_group === bloodFilter
        const matchesCity = cityFilter === "All" || req.city === cityFilter
        const matchesUrgency = urgencyFilter === "All" || req.urgency === urgencyFilter
        return matchesBlood && matchesCity && matchesUrgency
      }),
    [requests, bloodFilter, cityFilter, urgencyFilter]
  )

  function resetFilters() {
    setBloodFilter("All")
    setCityFilter("All")
    setUrgencyFilter("All")
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading requests...</p>
  if (error) return <p className="text-sm text-destructive">Failed to load requests: {error}</p>

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border">
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Filter Requests</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Blood Group</Label>
              <Select value={bloodFilter} onValueChange={setBloodFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Urgency</Label>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {urgencyOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredRequests.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{req.patient_name}</p>
                <Badge variant={req.status === "active" ? "destructive" : req.status === "fulfilled" ? "default" : "secondary"}>
                  {req.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {req.blood_group}
                </Badge>
                <span className="text-sm text-muted-foreground">| {req.units} units | {req.urgency}</span>
              </div>
              
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />{req.hospital}
              </p>
              
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{req.city}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {req.role === "hospital" ? "🏥 Requested by Hospital" : "👤 Requested by Donor"}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />{req.created_at ? new Date(req.created_at).toLocaleDateString() : "recently"}
                </span>
              </div>
              
              {req.status === "active" && (
                <Button 
                  size="sm" 
                  onClick={() => handleViewContact(req)}
                  className="w-full mt-2"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View Contact Details
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Details Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedRequest.patient_name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedRequest.blood_group}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedRequest.units} units needed</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedRequest.hospital}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedRequest.city}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedRequest.requester_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequest.role === "hospital" ? "Hospital Contact" : "Donor Contact"}
                    </p>
                  </div>
                </div>
                
                {selectedRequest.requester_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedRequest.requester_phone}</span>
                  </div>
                )}
                
                {selectedRequest.requester_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedRequest.requester_email}</span>
                  </div>
                )}
                
                {selectedRequest.notes && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Additional Notes:</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowContactModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
