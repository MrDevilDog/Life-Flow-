"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Phone, CheckCircle, Clock, ArrowLeft, Edit, Lock } from "lucide-react"
import { VerificationUtils } from "@/lib/verification-utils"

interface OTPVerificationProps {
  email?: string
  phone?: string
  onVerified: (token: string) => void
  onBack?: () => void
  onEditDetails?: () => void
}

export function OTPVerification({ email, phone, onVerified, onBack, onEditDetails }: OTPVerificationProps) {
  const [emailOTP, setEmailOTP] = useState("")
  const [phoneOTP, setPhoneOTP] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [resending, setResending] = useState<"email" | "phone" | null>(null)
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)

  // Mask sensitive information for display
  const maskedEmail = email ? VerificationUtils.maskEmail(email) : email

  const handleEmailVerify = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      setError("Please enter a valid 6-digit email OTP")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: emailOTP,
          type: "email",
          flow: "registration" // Pre-registration flow
        })
      })

      const data = await response.json()

      if (data.success) {
        setEmailVerified(true)
        if (data.token) {
          setVerifiedToken(data.token)
          localStorage.setItem("token", data.token)
        } else if (data.verificationSession) {
          setVerifiedToken(data.verificationSession)
        }
        
        if (data.flow === 'registration' || data.allowRegistration) {
          setError(data.message || "Email verified! You can now continue with registration.")
        } else if (data.token) {
          // Post-registration flow - login
          onVerified(data.token)
        } else {
          // Partial verification
          setError(data.message || "Email verified! Please also verify your phone number if possible.")
        }
      } else {
        setError(data.error || "Verification failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }



  const handleResendOTP = async (type: "email" | "phone") => {
    setResending(type)
    setError(null)

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type]: type === "email" ? email : phone,
          type
        })
      })

      const data = await response.json()

      if (data.success) {
        setError(`OTP sent to your ${type}! Check your ${type === 'email' ? 'inbox (and spam folder)' : 'phone messages'}.`)
      } else {
        setError(data.error || "Failed to send OTP. Please try again.")
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setResending(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Verify Your Account</CardTitle>
        <CardDescription>
          Your email address must be verified to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant={error.includes("sent") ? "default" : "destructive"}>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Locked Contact Information Display */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email Address</span>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {maskedEmail}
            </div>
          </div>
          
          {onEditDetails && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditDetails}
                className="w-full text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Details
              </Button>
            </div>
          )}
        </div>

        {/* Email Verification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email-otp">Email Verification <span className="text-xs font-normal text-muted-foreground">(Required)</span></Label>
            {emailVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
          <div className="flex gap-2">
            <Input
              id="email-otp"
              placeholder="6-digit code"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              disabled={emailVerified || loading}
            />
            <Button
              variant="outline"
              onClick={() => handleResendOTP("email")}
              disabled={resending === "email" || loading}
            >
              {resending === "email" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Resend"
              )}
            </Button>
            {!emailVerified && (
              <Button
                onClick={handleEmailVerify}
                disabled={!emailOTP || emailOTP.length !== 6 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            )}
          </div>
          {email && (
            <p className="text-xs text-muted-foreground">
              Check your inbox (and spam folder) for the verification code
            </p>
          )}
        </div>



        {/* Success Message & Continue Button */}
        {emailVerified && (
          <div className="space-y-4 pt-4 border-t">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email verification complete! You can now continue registration.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => {
                if (onVerified) {
                  onVerified(verifiedToken || "email-verified");
                }
              }}
            >
              Continue Registration
            </Button>
          </div>
        )}

        {/* Back Button */}
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="w-full">
            Back to Registration
          </Button>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>OTP codes expire in 5 minutes</span>
          </div>
          <p>Check your spam folder if you don't see the email</p>
          <p>Make sure your phone can receive SMS messages</p>
        </div>
      </CardContent>
    </Card>
  )
}
