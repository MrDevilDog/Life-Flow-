"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Navigation, Users } from "lucide-react"

interface NearbyDonor {
  id: number
  name: string
  email: string
  blood_group: string
  location: string
  phone: string
  lat: number
  lng: number
  availability: boolean
  distance: number
}

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const radiusOptions = ["10", "25", "50", "100", "200"]

export function NearbyDonorsMap() {
  const [donors, setDonors] = useState<NearbyDonor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [bloodFilter, setBloodFilter] = useState("All")
  const [radius, setRadius] = useState("50")

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Unable to get your location. Please enable location services.")
        }
      )
    } else {
      setError("Geolocation is not supported by your browser.")
    }
  }, [])

  // Fetch nearby donors when location or filters change
  useEffect(() => {
    if (!userLocation) return

    const fetchNearbyDonors = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams({
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
          radius: radius
        })
        
        if (bloodFilter !== "All") {
          params.append("blood_group", bloodFilter)
        }

        const response = await fetch(`/api/donors/nearby?${params}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        setDonors(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch nearby donors")
      } finally {
        setLoading(false)
      }
    }

    fetchNearbyDonors()
  }, [userLocation, bloodFilter, radius])

  if (!userLocation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Getting Your Location</h3>
          <p className="text-muted-foreground">Please allow location access to find nearby donors.</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Nearby Donors
        </CardTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Blood Group</Label>
            <Select value={bloodFilter} onValueChange={setBloodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Radius (km)</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((r) => (
                  <SelectItem key={r} value={r}>{r} km</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${userLocation.lat}&mlon=${userLocation.lng}&zoom=12`, '_blank')}
              className="w-full"
            >
              <MapPin className="h-3.5 w-3.5 mr-1" />
              View Map
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Finding nearby donors...</p>
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Nearby Donors Found</h3>
            <p className="text-muted-foreground">
              Try increasing the search radius or check back later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found {donors.length} donor{donors.length !== 1 ? 's' : ''} within {radius} km
            </div>
            <div className="grid gap-4">
              {donors.map((donor) => (
                <div key={donor.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{donor.name}</h4>
                      <p className="text-sm text-muted-foreground">{donor.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{donor.blood_group}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {donor.distance} km away
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{donor.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{donor.email}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${donor.lat}&mlon=${donor.lng}&zoom=15`, '_blank')}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      View on Map
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
