"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, User, Mail, Phone, MapPin, CheckCircle, XCircle, Edit2, Save } from "lucide-react"

interface UserProfile {
  id: number
  name: string
  email: string
  phone: string
  email_verified: boolean
  phone_verified: boolean
  created_at: string
  donor_profile: {
    blood_group: string
    location: string
    availability: boolean
    lat: number
    lng: number
  } | null
}

export function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    location: "",
    lat: 0,
    lng: 0
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login to view your profile")
        return
      }

      const response = await fetch("/api/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setEditForm({
          name: data.data.name,
          phone: data.data.phone,
          location: data.data.donor_profile?.location || "",
          lat: Number(data.data.donor_profile?.lat) || 0,
          lng: Number(data.data.donor_profile?.lng) || 0
        })
      } else {
        setError(data.error || "Failed to fetch profile")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Profile updated successfully!")
        setEditing(false)
        fetchProfile() // Refresh profile data
      } else {
        setError(data.error || "Failed to update profile")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditForm(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }))
          setSuccess("Location captured successfully!")
        },
        (error) => {
          setError("Unable to get your location. Please enable location services.")
        }
      )
    } else {
      setError("Geolocation is not supported by your browser.")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error || "Profile not found"}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel" : <Edit2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              {editing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{profile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.email_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              {editing ? (
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Donor Profile */}
        {profile.donor_profile && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Donor Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Badge variant="secondary">{profile.donor_profile.blood_group}</Badge>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Badge variant={profile.donor_profile.availability ? "default" : "secondary"}>
                  {profile.donor_profile.availability ? "Available" : "Not Available"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter your city"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetCurrentLocation}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Current Location
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{profile.donor_profile.location}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Coordinates</Label>
                <p className="text-xs text-muted-foreground">
                  {profile?.donor_profile?.lat 
                    ? Number(profile.donor_profile.lat).toFixed(6) 
                    : "N/A"}, {profile?.donor_profile?.lng 
                    ? Number(profile.donor_profile.lng).toFixed(6) 
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {editing && (
          <div className="flex gap-2">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false)
                setEditForm({
                  name: profile.name,
                  phone: profile.phone,
                  location: profile.donor_profile?.location || "",
                  lat: Number(profile.donor_profile?.lat) || 0,
                  lng: Number(profile.donor_profile?.lng) || 0
                })
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Verification Status */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Verification Status</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm">Email:</span>
              {profile.email_verified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
