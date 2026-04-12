"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle, Phone } from "lucide-react"
import { PhoneFormatter } from "@/lib/phone-client"

interface ForgotPasswordProps {
  onBack: () => void
  onSuccess: () => void
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [method, setMethod] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState<"request" | "verify" | "reset">("request")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handlePhoneChange = (value: string) => {
    const result = PhoneFormatter.handleInputChange(value);
    setPhone(result.value);
    
    if (result.isValid && fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  }

  const handleSendOTP = async () => {
    // Clear previous errors
    setError(null)
    setFieldErrors({})
    
    // Client-side validation
    const errors: Record<string, string> = {}
    
    if (method === "email") {
      if (!email.trim()) {
        errors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address"
      }
    } else if (method === "phone") {
      const phoneValidation = PhoneFormatter.validateInput(phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error || "Enter a valid phone number";
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setSuccess(null)

    try {
      const requestBody = method === "email" 
        ? { method: "email", email }
        : { method: "phone", phone: PhoneFormatter.formatDisplay(phone) }

      const response = await fetch("/api/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        setStep("verify")
        setSuccess(data.message || `OTP sent to your ${method}! Check your ${method === "email" ? "inbox" : "phone"}.`)
      } else {
        // Handle field-specific errors from backend
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        } else {
          setError(data.error || "Failed to send OTP")
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    // Clear previous errors
    setError(null)
    setFieldErrors({})
    
    // Client-side validation
    const errors: Record<string, string> = {}
    
    if (!otp.trim()) {
      errors.otp = "OTP is required"
    } else if (otp.length !== 6) {
      errors.otp = "OTP must be 6 digits"
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setSuccess(null)

    try {
      const requestBody = method === "email" 
        ? { method: "email", email, otp }
        : { method: "phone", phone: PhoneFormatter.formatDisplay(phone), otp }

      const response = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        setStep("reset")
        setSuccess(data.message || "OTP verified! You can now reset your password.")
      } else {
        // Handle field-specific errors from backend
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        } else {
          setError(data.error || "Invalid OTP")
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    // Clear previous errors
    setError(null)
    setFieldErrors({})
    
    // Client-side validation
    const errors: Record<string, string> = {}
    
    if (!newPassword.trim()) {
      errors.newPassword = "New password is required"
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters"
    }
    
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password"
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const requestBody = method === "email" 
        ? { method: "email", email, newPassword }
        : { method: "phone", phone: PhoneFormatter.formatDisplay(phone), newPassword }

      const response = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || "Password reset successful! You can now login with your new password.")
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        // Handle field-specific errors from backend
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors)
        } else {
          setError(data.error || "Failed to reset password")
        }
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>
          {step === "request" && "Choose your reset method and enter your details"}
          {step === "verify" && `Enter the verification code sent to your ${method}`}
          {step === "reset" && "Create your new password"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {step === "request" && (
          <div className="space-y-4">
            <Tabs value={method} onValueChange={(value) => setMethod(value as "email" | "phone")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors(prev => ({ ...prev, email: '' }))
                      }
                    }}
                    className={fieldErrors.email ? 'border-red-500' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-500">{fieldErrors.email}</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="phone" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={fieldErrors.phone ? 'border-red-500' : ''}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-500">{fieldErrors.phone}</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleSendOTP} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value)
                  if (fieldErrors.otp) {
                    setFieldErrors(prev => ({ ...prev, otp: '' }))
                  }
                }}
                className={fieldErrors.otp ? 'border-red-500' : ''}
                maxLength={6}
              />
              {fieldErrors.otp && (
                <p className="text-sm text-red-500">{fieldErrors.otp}</p>
              )}
            </div>

            <Button 
              onClick={handleVerifyOTP} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Code
                </>
              )}
            </Button>
          </div>
        )}

        {step === "reset" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (fieldErrors.newPassword) {
                    setFieldErrors(prev => ({ ...prev, newPassword: '' }))
                  }
                }}
                className={fieldErrors.newPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.newPassword && (
                <p className="text-sm text-red-500">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }))
                  }
                }}
                className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button 
              onClick={handleResetPassword} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={onBack} 
          className="w-full"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>OTP codes expire in 5 minutes</p>
          <p>Check your spam folder if you don't see the email</p>
        </div>
      </CardContent>
    </Card>
  )
}
