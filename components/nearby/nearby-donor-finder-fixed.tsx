"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Droplet,
  MapPin,
  Phone,
  Navigation,
  Filter,
  RotateCcw,
  Users,
  Clock,
  Award,
  Mail,
  Radar,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NearbyDonor {
  id: number
  name: string
  bloodGroup: string
  city: string
  distance: number
  phone: string
  email: string
  available: boolean
  verified: boolean
  lat?: number | null
  lng?: number | null
}

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const distances = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
]

export function NearbyDonorFinder() {
  const [nearbyDonors, setNearbyDonors] = useState<NearbyDonor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("All")
  const [selectedDistance, setSelectedDistance] = useState("20")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Get user's current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log("Got user location:", { latitude, longitude })
        setUserLocation({ lat: latitude, lng: longitude })
        setLocationPermission('granted')
      },
      (error) => {
        console.error("Geolocation error:", error)
        setLocationPermission('denied')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location access denied. Please enable location services to find nearby donors.")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable. Please try again.")
            break
          case error.TIMEOUT:
            setError("Location request timed out. Please try again.")
            break
          default:
            setError("An unknown error occurred while getting your location.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  // Fetch nearby donors using the API
  const fetchNearbyDonors = async () => {
    if (!userLocation) {
      setError("Please enable location access to find nearby donors")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: selectedDistance,
        ...(selectedBloodGroup !== "All" && { blood_group: selectedBloodGroup }),
      })

      const response = await fetch(`/api/donors/nearby?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nearby donors: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setNearbyDonors(data.data || [])
        console.log(`Found ${data.count || 0} nearby donors`)
      } else {
        setError(data.error || "Failed to find nearby donors")
      }
    } catch (err) {
      console.error("Error fetching nearby donors:", err)
      setError(err instanceof Error ? err.message : "Failed to find nearby donors")
    } finally {
      setLoading(false)
    }
  }

  // Get location on component mount
  useEffect(() => {
    getCurrentLocation()
  }, [])

  // Fetch donors when location or filters change
  useEffect(() => {
    if (userLocation) {
      fetchNearbyDonors()
    }
  }, [userLocation, selectedBloodGroup, selectedDistance])

  const filteredDonors = useMemo(() => {
    return nearbyDonors.filter((donor) => {
      const matchesBloodGroup = selectedBloodGroup === "All" || donor.bloodGroup === selectedBloodGroup
      const matchesDistance = donor.distance <= parseFloat(selectedDistance)
      return matchesBloodGroup && matchesDistance
    })
  }, [nearbyDonors, selectedBloodGroup, selectedDistance])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Radar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Find Nearby Donors</h2>
                <p className="text-sm text-muted-foreground">
                  {userLocation 
                    ? `Searching from your current location`
                    : "Enable location to find nearby donors"
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Update Location
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group === "All" ? "All Blood Groups" : group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Radius: {selectedDistance} km</Label>
              <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                <SelectTrigger>
                  <SelectValue placeholder="Select distance" />
                </SelectTrigger>
                <SelectContent>
                  {distances.map((dist) => (
                    <SelectItem key={dist.value} value={dist.value}>
                      {dist.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <MapPin className="h-5 w-5" />
              <div>
                <p className="font-medium">Location Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Permission Required */}
      {!userLocation && !error && (
        <Card>
          <CardContent className="p-6 text-center">
            <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Location Access Required</h3>
            <p className="text-muted-foreground mb-4">
              Please enable location services to find nearby blood donors in your area.
            </p>
            <Button onClick={getCurrentLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching for nearby donors...</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {userLocation && !loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Found {filteredDonors.length} Nearby Donors
            </h3>
            <Button variant="outline" size="sm" onClick={fetchNearbyDonors}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {filteredDonors.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Nearby Donors Found</h3>
                <p className="text-muted-foreground">
                  Try expanding your search radius or check back later.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDonors.map((donor) => (
                <Card key={donor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {donor.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{donor.name}</h4>
                          <p className="text-sm text-muted-foreground">{donor.city}</p>
                        </div>
                      </div>
                      <Badge variant={donor.available ? "default" : "secondary"}>
                        {donor.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{donor.bloodGroup}</span>
                        <span className="text-sm text-muted-foreground">
                          ({donor.distance.toFixed(1)} km away)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{donor.phone}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
