"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Phone, ArrowRight } from "lucide-react";

interface PreRegisterOTPProps {
  onVerified: (data: any) => void;
  onBack: () => void;
}

export function PreRegisterOTP({ onVerified, onBack }: PreRegisterOTPProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pre-register-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: "email",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTempUserId(data.temp_user_id);
        setStep("verify");
        setError("");
        // Show OTP in development
        if (process.env.NODE_ENV === 'development' && data.otp) {
          setError(`Development: OTP is ${data.otp}`);
        }
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verify-pre-register-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: email,
          email,
          otp,
          type: "email",
        }),
      });

      const data = await response.json();

      if (data.success) {
        onVerified({
          verified: true,
          email,
          type: "email",
          contact: data.contact
        });
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await fetch("/api/pre-register-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type: "email",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError("");
        // Show OTP in development
        if (process.env.NODE_ENV === 'development' && data.otp) {
          setError(`Development: OTP is ${data.otp}`);
        }
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Before Registration</CardTitle>
        <CardDescription>
          {step === "send" 
            ? "Enter your email and we'll send you an OTP"
            : `Enter the OTP sent to your email`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "send" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={isResending}
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend OTP
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("send")}
                disabled={isLoading || isResending}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
