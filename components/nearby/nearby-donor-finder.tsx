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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [bloodFilter, setBloodFilter] = useState("All")
  const [maxDistance, setMaxDistance] = useState(20)
  const [selectedRadius, setSelectedRadius] = useState("20")

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    let mounted = true
    try {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mounted) return
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        },
        () => {
          // Location denied/unavailable; keep distances as a fallback.
          if (mounted) setUserLocation(null)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      )
    } catch {
      setUserLocation(null)
    }
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const donorRes = await fetch("/api/donors", { cache: "no-store" })
        
        if (!donorRes.ok) throw new Error(`Donors HTTP ${donorRes.status}`)

        const donorData = await donorRes.json()

        const normalized: NearbyDonor[] = (Array.isArray(donorData) ? donorData : []).map((row: any) => {
          return {
            id: Number(row.id),
            name: row.name ?? `User ${row.user_id}`,
            bloodGroup: row.blood_group,
            city: row.location,
            distance:
              row.lat != null && row.lng != null && userLocation
                ? haversineKm(userLocation.lat, userLocation.lng, Number(row.lat), Number(row.lng))
                : 1,
            phone: row.phone,
            email: row.email ?? "",
            available: Boolean(row.availability),
            verified: true,
            lat: row.lat,
            lng: row.lng,
          }
        })
        if (mounted) setNearbyDonors(normalized)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load nearby donors")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [userLocation])

  useEffect(() => {
    if (!userLocation) return
    setNearbyDonors((prev) =>
      prev.map((d) => {
        if (d.lat == null || d.lng == null) return { ...d, distance: 1 }
        return {
          ...d,
          distance: haversineKm(userLocation.lat, userLocation.lng, Number(d.lat), Number(d.lng)),
        }
      })
    )
  }, [userLocation])

  const filteredDonors = useMemo(() => {
    return nearbyDonors
      .filter((donor) => {
        const matchesBlood = bloodFilter === "All" || donor.bloodGroup === bloodFilter
        const matchesDistance = donor.distance <= maxDistance
        return matchesBlood && matchesDistance
      })
      .sort((a, b) => a.distance - b.distance)
  }, [bloodFilter, maxDistance])

  function handleRadiusChange(value: string) {
    setSelectedRadius(value)
    setMaxDistance(parseInt(value))
  }

  function resetFilters() {
    setBloodFilter("All")
    setMaxDistance(20)
    setSelectedRadius("20")
  }

  const availableCount = filteredDonors.filter((d) => d.available).length

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading nearby donors...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load nearby donors: {error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Radar visualization + filters */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Radar visual card */}
        <Card className="border-border lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="relative flex h-48 w-48 items-center justify-center">
              <div className="absolute h-full w-full rounded-full border border-dashed border-primary/15" />
              <div className="absolute h-3/4 w-3/4 rounded-full border border-dashed border-primary/20" />
              <div className="absolute h-1/2 w-1/2 rounded-full border border-dashed border-primary/30" />
              <div className="absolute h-1/4 w-1/4 rounded-full bg-primary/10" />
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20">
                <Radar className="h-5 w-5 text-primary-foreground" />
              </div>
              {/* Simulated donor dots */}
              {filteredDonors.slice(0, 6).map((donor, i) => {
                const angle = (i * 60) + 15
                const dist = Math.min(donor.distance / maxDistance, 0.95) * 85
                const x = Math.cos((angle * Math.PI) / 180) * dist
                const y = Math.sin((angle * Math.PI) / 180) * dist
                return (
                  <div
                    key={donor.id}
                    className={cn(
                      "absolute h-3 w-3 rounded-full border-2 border-card transition-all",
                      donor.available ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                    title={`${donor.name} - ${donor.distance}km`}
                  />
                )
              })}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Scanning within{" "}
                <span className="font-bold text-primary font-mono">{maxDistance}km</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {availableCount} available donors found
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Search Filters</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Blood Group</Label>
                <Select value={bloodFilter} onValueChange={setBloodFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg === "All" ? "All Blood Groups" : bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Distance Radius</Label>
                <Select value={selectedRadius} onValueChange={handleRadiusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distances.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Fine-tune Distance</Label>
                <span className="text-xs font-medium text-primary font-mono">{maxDistance}km</span>
              </div>
              <Slider
                value={[maxDistance]}
                onValueChange={([val]) => {
                  setMaxDistance(val)
                  setSelectedRadius(String(val))
                }}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>1km</span>
                <span>10km</span>
                <span>20km</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={resetFilters} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium text-foreground">{filteredDonors.length}</span>{" "}
                donor{filteredDonors.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {filteredDonors.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Navigation className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">No donors found nearby</p>
            <p className="text-sm text-muted-foreground">
              Try increasing the search radius or changing the blood group filter
            </p>
            <Button variant="outline" onClick={resetFilters} className="mt-2 gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDonors.map((donor) => (
            <NearbyDonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      )}
    </div>
  )
}

function NearbyDonorCard({ donor }: { donor: NearbyDonor }) {
  const initials = donor.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <Card className="group relative overflow-hidden border-border transition-all hover:border-primary/30 hover:shadow-md">
      {/* Distance indicator */}
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
        <Navigation className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium text-foreground font-mono">{donor.distance}km</span>
      </div>

      <CardContent className="flex flex-col gap-4 p-5">
        {/* Profile header */}
        <div className="flex items-center gap-3 pr-16">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{donor.name}</h3>
              {donor.verified && (
                <Award className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {donor.city}
            </div>
          </div>
        </div>

        {/* Blood group and stats */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="shrink-0 border-primary/30 bg-primary/5 px-3 py-1 font-mono text-base font-bold text-primary"
          >
            {donor.bloodGroup}
          </Badge>
            <div className="flex-1 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplet className="h-3 w-3" />
                {donor.phone}
              </div>
          </div>
        </div>

        {/* Availability & response time */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                donor.available ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            <span className={cn(
              "text-xs font-medium",
              donor.available ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
            )}>
              {donor.available ? "Available" : "Unavailable"}
            </span>
          </div>
          {donor.available && <span className="text-[10px] text-muted-foreground">Available now</span>}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!donor.available}
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!donor.available}
          >
            <Mail className="h-3.5 w-3.5" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
