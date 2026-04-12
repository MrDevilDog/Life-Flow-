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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Droplet,
  MapPin,
  Phone,
  Search,
  Filter,
  RotateCcw,
  Users,
  Lock,
  LogIn,
} from "lucide-react"
import { PhoneFormatter } from "@/lib/phone-client"

interface Donor {
  id: number
  name: string
  bloodGroup: string
  city: string
  phone?: string // Optional for guests
  available: boolean
}

interface DonorApiResponse {
  success: boolean
  data: Donor[]
  count: number
  authenticated: boolean
  message: string
}

const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function DonorSearch() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use localStorage for auth state as requested
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isLoggedIn = !!token;
  
  // Default filters do NOT block results (Part 3)
  const [bloodFilter, setBloodFilter] = useState("All")
  const [cityFilter, setCityFilter] = useState("All")
  const [availabilityFilter, setAvailabilityFilter] = useState("All")
  const [nameSearch, setNameSearch] = useState("")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // Ensure correct API endpoint is used (Part 5)
        const opts: RequestInit = { cache: "no-store", headers: {} }
        if (token) {
          opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` }
        }
        
        const donorRes = await fetch("/api/donors", opts)
        if (!donorRes.ok) throw new Error(`Donors HTTP ${donorRes.status}`)

        const donorData: DonorApiResponse = await donorRes.json()

        const normalized: Donor[] = (Array.isArray(donorData.data) ? donorData.data : []).map((row: any) => {
          return {
            id: Number(row.id),
            name: row.name || "Unknown",
            bloodGroup: row.blood_group || "N/A",
            city: row.city || row.location || "N/A", // Use city field first, fallback to location
            phone: row.phone || undefined, // Phone might not be available for guests
            available: Boolean(row.availability),
          }
        })
        
        // Debug Response (Part 4)
        console.log("Donors:", normalized);
        console.log("User authenticated:", donorData.authenticated);
        
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

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(donors.map((d) => d.city))).filter(c => c !== "N/A").sort()],
    [donors]
  )

  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
      const matchesBlood =
        bloodFilter === "All" || donor.bloodGroup === bloodFilter
      const matchesCity = cityFilter === "All" || donor.city === cityFilter
      const matchesAvailability =
        availabilityFilter === "All" ||
        (availabilityFilter === "Available" && donor.available) ||
        (availabilityFilter === "Not Available" && !donor.available)
      const matchesName = !nameSearch || donor.name
        .toLowerCase()
        .includes(nameSearch.toLowerCase())
        
      return matchesBlood && matchesCity && matchesAvailability && matchesName
    })
  }, [bloodFilter, cityFilter, availabilityFilter, nameSearch, donors])

  function resetFilters() {
    setBloodFilter("All")
    setCityFilter("All")
    setAvailabilityFilter("All")
    setNameSearch("")
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading donors...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">Failed to load donors: {error}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Authentication Notice */}
      {!isLoggedIn && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            You are browsing donors as a guest. <strong>Login</strong> to view contact information and contact donors directly.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border">
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Search Filters</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5 lg:col-span-1">
              <Label className="text-xs text-muted-foreground">Donor Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
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

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === "All" ? "All Cities" : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Availability</Label>
              <Select
                value={availabilityFilter}
                onValueChange={setAvailabilityFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Not Available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end flex-col justify-end">
               <Label className="text-xs hidden lg:block opacity-0 h-4">Reset</Label>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filteredDonors.length}</span>{" "}
            donor{filteredDonors.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {donors.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-bold text-foreground font-mono">0 donors found in system</p>
            <p className="text-sm text-muted-foreground">
              Currently no donors have registered on the platform.
            </p>
          </CardContent>
        </Card>
      ) : filteredDonors.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Filter className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground">No matching donors</p>
            <p className="text-sm text-muted-foreground max-w-[300px]">
              We couldn't find any donors matching your specific search filters.
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
            <DonorCard key={donor.id} donor={donor} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      )}
    </div>
  )
}

function DonorCard({ donor, isLoggedIn }: { donor: Donor; isLoggedIn: boolean }) {
  const initials = donor.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)

  const handleContactDonor = () => {
    if (isLoggedIn) {
      // TODO: Implement contact functionality for authenticated users
      console.log("Contacting donor:", donor.name, "Phone:", donor.phone)
      // This could open a modal, make a call, etc.
    } else {
      // Redirect to login for unauthenticated users
      window.location.href = "/login"
    }
  }

  return (
    <Card className="group border-border transition-all hover:border-primary/30 hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border border-border">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{donor.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {donor.city}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-primary/30 bg-primary/5 font-mono text-sm font-bold text-primary"
          >
            {donor.bloodGroup}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {donor.phone && isLoggedIn ? (
              <span className="font-medium text-foreground">{PhoneFormatter.formatDisplay(donor.phone)}</span>
            ) : (
              <span className="font-medium text-foreground">
                {isLoggedIn ? "Contact Available" : "Login to view"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                donor.available ? "bg-green-500" : "bg-muted-foreground/40"
              }`}
            />
            <span className={donor.available ? "text-green-700 dark:text-green-400" : ""}>
              {donor.available ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>

        <Button
          variant={donor.available ? "default" : "outline"}
          size="sm"
          className="w-full gap-2"
          disabled={!donor.available}
          onClick={handleContactDonor}
        >
          {isLoggedIn ? (
            <>
              <Phone className="h-3.5 w-3.5" />
              {donor.available ? "Contact Donor" : "Currently Unavailable"}
            </>
          ) : (
            <>
              <LogIn className="h-3.5 w-3.5" />
              {donor.available ? "Login to Contact" : "Currently Unavailable"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
