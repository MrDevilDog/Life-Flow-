"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RegistrationForm } from "@/components/register/registration-form";
import { PreRegisterOTP } from "@/components/auth/pre-register-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"verify" | "register">("verify");
  const [verifiedData, setVerifiedData] = useState<any>(null);

  const handleVerified = (data: any) => {
    setVerifiedData(data);
    setStep("register");
  };

  const handleBackToVerify = () => {
    setStep("verify");
    setVerifiedData(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-10 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono md:text-4xl">
              {step === "verify" ? "Verify Before Registration" : "Register as a Donor"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {step === "verify" 
                ? "Verify your contact details before creating your account"
                : "Fill in your details below to join our community of life-savers"
              }
            </p>
          </div>

          {step === "verify" && (
            <PreRegisterOTP 
              onVerified={handleVerified}
              onBack={() => window.history.back()}
            />
          )}

          {step === "register" && verifiedData && (
            <>
              {verifiedData.verified && (
                <Alert className="mb-6">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verifiedData.type === "email" 
                      ? `Email ${verifiedData.email} verified successfully!`
                      : `Phone ${verifiedData.phone} verified successfully!`
                    }
                  </AlertDescription>
                </Alert>
              )}
              <RegistrationForm 
                preVerifiedData={verifiedData}
                onBackToVerify={handleBackToVerify}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
