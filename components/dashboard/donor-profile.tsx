"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Droplet, MapPin, Phone, Mail, Calendar, Edit3 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

type DonorRow = {
  name: string
  email: string
  created_at: string
  phone: string | null
  location: string | null
  blood_group: string | null
  availability: boolean | null
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function DonorProfile() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [donor, setDonor] = useState<DonorRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPhone, setEditPhone] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editBloodGroup, setEditBloodGroup] = useState<string>("")
  const [editAvailability, setEditAvailability] = useState(false)

  // Fetch updated data wrapper function
  async function refreshMe(token: string) {
    try {
      const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setDonor(data.user)
    } catch (err) {}
  }

  useEffect(() => {
    if (!user || !token) return
    
    // Always fetch fresh data from /api/me endpoint
    refreshMe(token)
  }, [user, token])

  const initials = useMemo(() => {
    const base = donor?.name ?? ""
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
  }, [donor?.name])

  if (!user) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-4 pt-8">
          <p className="text-sm text-muted-foreground">Please log in to view your profile.</p>
        </CardHeader>
      </Card>
    )
  }

  if (loading && !donor) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-4 pt-8">
          <p className="text-sm text-muted-foreground">Loading donor profile...</p>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-4 pt-8">
          <p className="text-sm text-destructive">{error}</p>
        </CardHeader>
      </Card>
    )
  }

  const isProfileComplete = 
    donor &&
    donor.blood_group &&
    donor.location &&
    donor.phone;
  
  console.log("Profile completeness check:", {
    donor: !!donor,
    blood_group: !!donor?.blood_group,
    location: !!donor?.location,
    phone: !!donor?.phone,
    isComplete: !!(donor && donor.blood_group && donor.location && donor.phone)
  });
  
  const availability = donor ? Boolean(donor.availability) : false
  const bloodGroup = donor?.blood_group || "Not specified"
  const location = donor?.location || "Not specified"
  const phone = donor?.phone || "Not specified"
  const email = donor?.email || "Not specified"
  
  const memberSince = donor?.created_at ? 
    new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(donor.created_at)) 
    : "N/A"

  const handleEditClick = () => {
    setEditPhone(phone === "Not specified" ? "" : phone)
    setEditLocation(location === "Not specified" ? "" : location)
    setEditBloodGroup(bloodGroup === "Not specified" ? "" : bloodGroup)
    setEditAvailability(availability)
    setShowEditModal(true)
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const t = localStorage.getItem("token")
      const requestBody: any = {
        availability: editAvailability
      }
      
      // Only include fields that have values
      if (editPhone && editPhone.trim()) {
        requestBody.phone = editPhone.trim()
      }
      if (editLocation && editLocation.trim()) {
        requestBody.location = editLocation.trim()
      }
      if (editBloodGroup && editBloodGroup.trim()) {
        requestBody.blood_group = editBloodGroup.trim()
      }
      
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${t || ""}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update profile")

      console.log("Profile update response:", data)
      
      // Update local state immediately with returned data
      if (data?.data) {
        setDonor(data.data)
        console.log("Updated local donor state:", data.data)
      }
      
      // Also refresh auth context if needed
      if (t) await refreshMe(t)
      
      // Refresh the page to ensure dashboard updates
      router.refresh()
      
      setShowEditModal(false)
    } catch (err) {
      console.error("Profile update error:", err)
      const errorMessage = err instanceof Error ? err.message : "Error updating profile. Please try again."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-border">
      <CardHeader className="flex flex-col items-center gap-4 pb-4 pt-8 relative">
        {!isEditing && isProfileComplete && (
          <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handleEditClick}>
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          {isProfileComplete && !isEditing && (
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-bold text-primary-foreground">
              {bloodGroup}
            </div>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{donor?.name}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
        </div>
        {isProfileComplete && !isEditing && (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            <Droplet className="mr-1 h-3 w-3" />
            Blood Group: {bloodGroup}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-6 pb-6">
        <Separator />
        
        {!isProfileComplete ? (
          <div className="text-center py-6 bg-muted/30 rounded-lg flex flex-col items-center gap-3">
            <div>
              <p className="font-semibold text-foreground">Complete your donor profile</p>
              <p className="text-sm text-muted-foreground mt-1 px-4">Add your blood group and location to join the registry.</p>
            </div>
            <Button size="sm" onClick={handleEditClick}>Complete Profile</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{phone}</span>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Availability</p>
              <div className="mt-1 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${availability ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                <span className="text-sm font-medium text-foreground">
                  {availability ? "Available" : "Not Available"}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>

    {/* Edit Profile Modal */}
    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label>Blood Group</Label>
            <Select value={editBloodGroup} onValueChange={setEditBloodGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Phone Number</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="e.g. +1 555-0100" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Location / City</Label>
            <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. New York" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="availability">Available for Donation</Label>
            <Switch
              id="availability"
              checked={editAvailability}
              onCheckedChange={setEditAvailability}
            />
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={loading}>{loading ? "Saving..." : "Save Profile"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
