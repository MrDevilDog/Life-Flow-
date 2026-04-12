"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { PhoneFormatter } from "@/lib/phone-client"
import {
  Droplet,
  Phone,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Calendar,
  Loader2,
  ArrowLeft
} from "lucide-react"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface RegistrationFormProps {
  preVerifiedData?: any;
  onBackToVerify?: () => void;
}

export function RegistrationForm({ preVerifiedData, onBackToVerify }: RegistrationFormProps) {
  const router = useRouter()
  const [isAvailable, setIsAvailable] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)

  const [name, setName] = useState(preVerifiedData?.type === "email" ? "" : preVerifiedData?.email || "")
  const [email, setEmail] = useState(preVerifiedData?.email || "")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")
  const [bloodGroup, setBloodGroup] = useState<string | undefined>(undefined)
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [district, setDistrict] = useState("")
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)
  const [lastDonationDate, setLastDonationDate] = useState("")
  const [detectingLocation, setDetectingLocation] = useState(false)

  // Field-specific error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Field locking logic
  const isEmailLocked = preVerifiedData?.type === "email";
  const isPhoneLocked = false; // Phone is always editable per new requirements

  // Debug: Log pre-verified data
  console.log("Pre-verified data:", preVerifiedData)
  console.log("Phone in state:", phone)
  console.log("Is phone locked:", isPhoneLocked)

  const handleGetCurrentLocation = async () => {
    if ("geolocation" in navigator) {
      setDetectingLocation(true);
      setError("Detecting your location...");
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          setLat(latitude);
          setLng(longitude);
          
          // Try to get city and district using reverse geocoding
          try {
            const response = await fetch("/api/geocoding/reverse", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                lat: latitude,
                lng: longitude
              })
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
              const locationData = data.data;
              setCity(locationData.city || "");
              setDistrict(locationData.district || "");
              console.log("✅ Location detected:", locationData);
              setError(null);
            } else {
              console.log("⚠️ Could not detect city/district, but location is set");
              setError("Location detected, but city/district could not be determined automatically.");
            }
          } catch (error) {
            console.error("❌ Reverse geocoding failed:", error);
            setError("Location detected, but city/district could not be determined automatically.");
          }
        },
        (error) => {
          setError("Unable to get your location. Please enable location services.");
        }
      );
      
      // Reset detecting location state
      setDetectingLocation(false);
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Phone input handler
  const handlePhoneChange = (value: string) => {
    if (isPhoneLocked) return; // Don't change if locked
    
    const result = PhoneFormatter.handleInputChange(value);
    setPhone(result.value);
    
    // Clear error when user starts typing
    if (result.isValid && fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  }

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Full Name validation
    if (!name.trim()) {
      errors.name = "Full Name is required"
    }

    // Age validation (optional in backend schema)
    if (age.trim()) {
      const ageNum = Number(age)
      if (isNaN(ageNum)) {
        errors.age = "Age must be a valid number"
      } else if (ageNum < 18) {
        errors.age = "You must be at least 18 years old"
      } else if (ageNum > 100) {
        errors.age = "Age must be 100 or less"
      }
    }

    // Email validation (only if not locked)
    if (!isEmailLocked) {
      if (!email.trim()) {
        errors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address"
      }
    }

    // Phone validation (only if not locked)
    if (!isPhoneLocked) {
      const phoneValidation = PhoneFormatter.validateInput(phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error || "Enter a valid phone number";
      }
    }

    // Password validation
    if (!password.trim()) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }

    // Blood Group validation
    if (!bloodGroup) {
      errors.bloodGroup = "Blood Group is required"
    }

    // Location validation
    if (!city.trim()) {
      errors.city = "City/Location is required"
    }

    // Last Donation Date validation (optional in backend schema)
    if (lastDonationDate) {
      const donationDate = new Date(lastDonationDate)
      const today = new Date()
      if (donationDate > today) {
        errors.lastDonationDate = "Donation date cannot be in the future"
      }
    }

    return errors
  }

  // Auto-scroll to first error
  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstErrorField = Object.keys(errors)[0]
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSubmitted(false)
    
    try {
      console.log('Form submission started')
      console.log('FORM VALUES:', { name, age, email, phone, password, bloodGroup, city, lastDonationDate, verification_type: preVerifiedData?.type || "email" })
      console.log('Pre-verified data:', preVerifiedData)
      console.log('Phone locked:', isPhoneLocked, 'Email locked:', isEmailLocked)
      
      // Validate form
      const errors = validateForm()
      console.log('Validation errors:', errors)
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        scrollToFirstError(errors)
        throw new Error("Please fix the validation errors")
      }
      
      // Clear field errors if validation passes
      setFieldErrors({})

      // User & Donor combined payload request
      const reqPayload = {
        name,
        email,
        password,
        age: Number(age),
        blood_group: bloodGroup,
        phone,
        city,
        district: district || undefined, // Include district if provided
        availability: isAvailable,
        lat: lat || undefined,
        lng: lng || undefined,
        lastDonationDate: lastDonationDate,
        verification_type: preVerifiedData?.type || "email"
      }
      
      console.log('Sending payload:', reqPayload)

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reqPayload),
      })

      const registerData = await res.json()
      if (!res.ok) {
        throw new Error(registerData?.error ?? "Registration failed")
      }

      if (registerData.token) {
        localStorage.setItem("token", registerData.token)
        setSubmitted(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Fallback for missing token scenario
        router.push("/login?registered=true")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerified = (token: string) => {
    localStorage.setItem("token", token)
    setSubmitted(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  if (submitted) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground font-mono">
            Registration Successful!
          </h2>
          <p className="text-center text-muted-foreground">
            Thank you for registering. Redirecting to your dashboard...
          </p>
        </CardContent>
      </Card>
    )
  }



  return (
    <Card className="border-border">
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6 p-6 md:p-8">
          {error && !error.includes("fix the validation errors") && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) {
                    setFieldErrors(prev => ({ ...prev, name: '' }))
                  }
                }}
                className={fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-500">{fieldErrors.name}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="age" className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25 (optional)"
                min={18}
                max={100}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value)
                  if (fieldErrors.age) {
                    setFieldErrors(prev => ({ ...prev, age: '' }))
                  }
                }}
                className={fieldErrors.age ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.age && (
                <p className="text-sm text-red-500">{fieldErrors.age}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
                {isEmailLocked && (
                  <span className="ml-2 text-xs text-orange-600">(Verified - Locked)</span>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                required
                disabled={isEmailLocked}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }))
                  }
                }}
                className={fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Secure password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }))
                  }
                }}
                className={fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bloodGroup" className="flex items-center gap-1.5 text-sm font-medium">
                <Droplet className="h-3.5 w-3.5 text-muted-foreground" />
                Blood Group
              </Label>
              <Select 
                value={bloodGroup} 
                onValueChange={(value) => {
                  setBloodGroup(value)
                  if (fieldErrors.bloodGroup) {
                    setFieldErrors(prev => ({ ...prev, bloodGroup: '' }))
                  }
                }} 
                required
              >
                <SelectTrigger id="bloodGroup" className={fieldErrors.bloodGroup ? 'border-red-500 focus:border-red-500' : ''}>
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
              {fieldErrors.bloodGroup && (
                <p className="text-sm text-red-500">{fieldErrors.bloodGroup}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
                {isPhoneLocked && (
                  <span className="ml-2 text-xs text-orange-600">(Verified - Locked)</span>
                )}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                required
                disabled={isPhoneLocked}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.phone && (
                <p className="text-sm text-red-500">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                City / Location
              </Label>
              <Input
                id="city"
                placeholder="New York"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  if (fieldErrors.city) {
                    setFieldErrors(prev => ({ ...prev, city: '' }))
                  }
                }}
                className={fieldErrors.city ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.city && (
                <p className="text-sm text-red-500">{fieldErrors.city}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="district" className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                District (Optional)
              </Label>
              <Input
                id="district"
                placeholder="Manhattan"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value)
                  if (fieldErrors.district) {
                    setFieldErrors(prev => ({ ...prev, district: '' }))
                  }
                }}
                className={fieldErrors.district ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.district && (
                <p className="text-sm text-red-500">{fieldErrors.district}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Location Coordinates
              </Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Latitude"
                    value={lat || ""}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    type="number"
                    step="any"
                  />
                  <Input
                    placeholder="Longitude"
                    value={lng || ""}
                    onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                    type="number"
                    step="any"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={detectingLocation}
                  className="w-full"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5 mr-2" />
                      Get Current Location
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="lastDonation"
                className="flex items-center gap-1.5 text-sm font-medium"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Last Donation Date
              </Label>
              <Input
                id="lastDonation"
                type="date"
                value={lastDonationDate}
                onChange={(e) => {
                  setLastDonationDate(e.target.value)
                  if (fieldErrors.lastDonationDate) {
                    setFieldErrors(prev => ({ ...prev, lastDonationDate: '' }))
                  }
                }}
                className={fieldErrors.lastDonationDate ? 'border-red-500 focus:border-red-500' : ''}
              />
              {fieldErrors.lastDonationDate && (
                <p className="text-sm text-red-500">{fieldErrors.lastDonationDate}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                Availability Status
              </Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  id="availability"
                />
                <Label htmlFor="availability" className="cursor-pointer text-sm">
                  {isAvailable ? (
                    <span className="font-medium text-primary">Available</span>
                  ) : (
                    <span className="text-muted-foreground">Not Available</span>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/30 px-6 py-4 md:flex-row md:justify-between md:px-8">
          {preVerifiedData && onBackToVerify && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBackToVerify}
              disabled={loading}
              className="w-full md:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Verification
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            By registering, you agree to make your contact information visible to those in need of blood.
          </p>
          <Button type="submit" className="w-full gap-2 md:w-auto" disabled={loading}>
            <Droplet className="h-4 w-4" />
            {loading ? "Registering..." : "Register"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
