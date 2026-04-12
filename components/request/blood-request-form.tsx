"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Building2,
  Droplet,
  Hash,
  AlertTriangle,
  MapPin,
  Phone,
  CheckCircle2,
  FileText,
  LogIn
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-context"
import Link from "next/link"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const urgencyLevels = [
  { value: "normal", label: "Normal", description: "Within 24-48 hours", color: "bg-emerald-500" },
  { value: "urgent", label: "Urgent", description: "Within 6-12 hours", color: "bg-amber-500" },
  { value: "critical", label: "Critical", description: "Immediate need", color: "bg-primary" },
]

export function BloodRequestForm() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [urgency, setUrgency] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!urgency) {
      setError("Please select an urgency level")
      return
    }

    const form = e.currentTarget
    const formData = new FormData(form)
    
    const patient_name = formData.get("patientName") as string;
    const blood_group = formData.get("bloodGroup") as string;
    const units = parseInt(formData.get("units") as string) || 1;
    const city = formData.get("city") as string;
    const contact_number = formData.get("contact") as string;
    const notes = (formData.get("notes") as string) || (formData.get("hospitalName") as string);
    
    // Explicit requested UI Validation
    if (!patient_name || !blood_group || !units) {
      setError("Please fill all required fields");
      return;
    }

    const payload = {
      patient_name,
      blood_group,
      units,
      city,
      contact_number,
      urgency,
      notes
    };
    
    console.log("🚀 Submitting blood request:", payload);
    console.log("📞 Contact number being sent:", contact_number);

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        let errorMessage = "Failed to submit request"
        try {
          const data = await res.json()
          errorMessage = data.error || data.message || errorMessage
        } catch(e) { }
        throw new Error(errorMessage)
      }

      setSubmitted(true)
      setTimeout(() => {
        router.push("/emergency")
      }, 2000)
    } catch (err) {
      // Requested Error Output improvement
      setError(err instanceof Error ? err.message : "Please fill all required fields correctly")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground font-mono">
            Request Submitted!
          </h2>
          <p className="text-center text-muted-foreground">
            Your blood request has been broadcasted to nearby donors. Redirecting to emergency requests...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!authLoading && !user) {
    return (
      <Card className="border-border px-6 py-12 text-center">
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AlertTriangle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground font-mono">
            Login Required
          </h2>
          <p className="text-muted-foreground max-w-[400px]">
            You must be logged into your account to create verified emergency blood requests.
          </p>
          <Button asChild className="mt-4 gap-2">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Sign In to Request Blood
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6 p-6 md:p-8">
          {/* Patient & Hospital Info */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              Patient & Hospital Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="patientName" className="text-sm font-medium">
                  Patient Name
                </Label>
                <Input
                  id="patientName"
                  name="patientName"
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hospitalName" className="flex items-center gap-1.5 text-sm font-medium">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Hospital Name
                </Label>
                <Input
                  id="hospitalName"
                  name="hospitalName"
                  placeholder="City General Hospital"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Blood Requirements */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Droplet className="h-4 w-4 text-primary" />
              Blood Requirements
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bloodGroup" className="text-sm font-medium">
                  Blood Group Required
                </Label>
                <Select name="bloodGroup" required>
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="units" className="flex items-center gap-1.5 text-sm font-medium">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Units Needed
                </Label>
                <Input
                  id="units"
                  name="units"
                  type="number"
                  placeholder="2"
                  min={1}
                  max={20}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Urgency Level */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Urgency Level
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {urgencyLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setUrgency(level.value)}
                  className={cn(
                    "relative flex flex-col gap-1 rounded-lg border-2 p-4 text-left transition-all",
                    urgency === level.value
                      ? level.value === "critical"
                        ? "border-primary bg-primary/5"
                        : level.value === "urgent"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                          : "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", level.color)} />
                    <span className="text-sm font-semibold text-foreground">{level.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{level.description}</span>
                  {urgency === level.value && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className={cn(
                        "h-4 w-4",
                        level.value === "critical" ? "text-primary" :
                        level.value === "urgent" ? "text-amber-500" : "text-emerald-500"
                      )} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Contact & Location */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Contact & Location
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="New York"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact" className="flex items-center gap-1.5 text-sm font-medium">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Contact Number
                </Label>
                <Input
                  id="contact"
                  name="contact"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-medium">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special requirements or additional details..."
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-4 md:flex-row md:justify-between md:px-8">
          <p className="text-xs text-muted-foreground">
            Requests are shared with verified donors within your city.
          </p>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <Button type="submit" className="w-full gap-2 md:w-auto" disabled={loading}>
            <AlertTriangle className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit Blood Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
